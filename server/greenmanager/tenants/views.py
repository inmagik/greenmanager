from auth_core.models import User
from auth_core.utils import ActionPermission
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import BooleanField, Count, Exists, OuterRef, Q, Value
from django.shortcuts import get_object_or_404
from inmagik_utils.mixins import BulkDeleteActionMixin
from inmagik_utils.pagination import StandardPaginationMixin
from inmagik_utils.structural_filters import StructuralFilterMixin
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from tenants.mixins import TenantContextMixin
from tenants.models import Tenant, TenantMembership
from tenants.serializers import (
    BulkDeleteTenantsSerializer,
    RemoveTenantUserSerializer,
    TenantMembershipSerializer,
    TenantSerializer,
    TenantUserSerializer,
    TenantUsersSerializer,
)
from tenants.services import add_tenant_users, remove_tenant_user, replace_tenant_users


class TenantViewSet(
    StandardPaginationMixin,
    StructuralFilterMixin,
    BulkDeleteActionMixin,
    viewsets.ModelViewSet,
):
    queryset = Tenant.objects.annotate(
        user_count=Count("memberships", distinct=True)
    ).order_by("name")
    serializer_class = TenantSerializer
    permission_classes = [ActionPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "slug"]
    ordering_fields = ["name", "slug", "created_at"]
    action_permissions = {
        "list": ["auth_core.LETTURA_UTENTI"],
        "retrieve": ["auth_core.LETTURA_UTENTI"],
        "create": ["auth_core.SCRITTURA_UTENTI"],
        "update": ["auth_core.SCRITTURA_UTENTI"],
        "partial_update": ["auth_core.SCRITTURA_UTENTI"],
        "destroy": ["auth_core.SCRITTURA_UTENTI"],
        "bulk_delete": ["auth_core.SCRITTURA_UTENTI"],
    }

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, "is_staff", False):
            return qs
        return qs.filter(memberships__user=self.request.user).distinct()

    @staticmethod
    def get_dependencies(tenant):
        dependencies = set()
        for relation in tenant._meta.related_objects:
            accessor = relation.get_accessor_name()
            if not accessor:
                continue
            try:
                related = getattr(tenant, accessor, None)
            except ObjectDoesNotExist:
                continue
            if related is not None and hasattr(related, "exists") and related.exists():
                label = relation.related_model._meta.verbose_name_plural
                dependencies.add(str(label))
        return sorted(dependencies)

    def validate_can_delete(self, tenant):
        dependencies = self.get_dependencies(tenant)
        if dependencies:
            raise ValidationError(
                {
                    "code": "tenant_has_related_data",
                    "params": {"name": tenant.name},
                    "detail": (
                        f"Tenant '{tenant.name}' cannot be deleted "
                        "because it has related data."
                    ),
                    "dependencies": dependencies,
                }
            )

    def perform_destroy(self, instance):
        self.validate_can_delete(instance)
        super().perform_destroy(instance)

    @action(detail=False, methods=["POST"], url_path="bulk-delete")
    @transaction.atomic
    def bulk_delete(self, request, *args, **kwargs):
        serializer = BulkDeleteTenantsSerializer(
            data=request.data, queryset=self.get_queryset()
        )
        serializer.is_valid(raise_exception=True)
        tenants = serializer.validated_data["ids"]
        for tenant in tenants:
            self.validate_can_delete(tenant)
        for tenant in tenants:
            tenant.delete()
        return Response(status=204)

    @action(detail=True, methods=["GET", "POST"], url_path="users")
    @transaction.atomic
    def users(self, request, *args, **kwargs):
        # Do not use get_object(): the viewset SearchFilter would apply the
        # user search term to the Tenant queryset and incorrectly return 404.
        tenant = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
        if request.method == "GET":
            if request.query_params.get("members_only") == "1":
                users = User.objects.filter(tenant_memberships__tenant=tenant).order_by(
                    "full_name", "email"
                )
                full_count_queryset = users
                search = request.query_params.get("search", "").strip()
                if search:
                    users = users.filter(
                        Q(full_name__icontains=search) | Q(email__icontains=search)
                    )
                self.set_full_count_queryset(full_count_queryset)
                page = self.paginate_queryset(users)
                for user in page:
                    user.is_member = True
                data = TenantUserSerializer(page, many=True).data
                return self.get_paginated_response(data)

            memberships = tenant.memberships.filter(user_id=OuterRef("pk"))
            users = User.objects.annotate(is_member=Exists(memberships)).order_by(
                "full_name", "email"
            )
            if request.query_params.get("available_only") == "1":
                users = users.filter(is_member=False).annotate(
                    is_member=Value(False, output_field=BooleanField())
                )
            full_count_queryset = users
            search = request.query_params.get("search", "").strip()
            if search:
                users = users.filter(
                    Q(full_name__icontains=search) | Q(email__icontains=search)
                )
            self.set_full_count_queryset(full_count_queryset)
            page = self.paginate_queryset(users)
            data = TenantUserSerializer(page, many=True).data
            return self.get_paginated_response(data)

        input_serializer = TenantUsersSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        selected_users = input_serializer.validated_data["user_ids"]
        selected_ids = replace_tenant_users(tenant, selected_users)
        return Response({"user_ids": sorted(selected_ids)})

    @action(detail=True, methods=["POST"], url_path="add-users")
    @transaction.atomic
    def add_users(self, request, *args, **kwargs):
        tenant = self.get_object()
        input_serializer = TenantUsersSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        selected_users = input_serializer.validated_data["user_ids"]
        selected_ids = add_tenant_users(tenant, selected_users)
        return Response({"user_ids": sorted(selected_ids)})

    @action(detail=True, methods=["POST"], url_path="remove-user")
    @transaction.atomic
    def remove_user(self, request, *args, **kwargs):
        tenant = self.get_object()
        input_serializer = RemoveTenantUserSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        user = input_serializer.validated_data["user_id"]
        remove_tenant_user(tenant, user)
        return Response(status=204)


class TenantMembershipViewSet(
    TenantContextMixin,
    StandardPaginationMixin,
    StructuralFilterMixin,
    BulkDeleteActionMixin,
    viewsets.ModelViewSet,
):
    queryset = (
        TenantMembership.objects.select_related("tenant", "user")
        .all()
        .order_by("tenant__name", "user__email")
    )
    serializer_class = TenantMembershipSerializer
    permission_classes = [ActionPermission]
    filter_backends = [OrderingFilter]
    filterset_fields = ["tenant", "user", "is_default"]
    ordering_fields = ["tenant__name", "user__email", "created_at"]
    action_permissions = TenantViewSet.action_permissions

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        if tenant is None:
            return qs.filter(user=self.request.user)
        return qs.filter(tenant=tenant)

    def perform_create(self, serializer):

        tenant = self.get_current_tenant()
        if tenant is None:
            raise ValidationError(
                {
                    "tenant": {
                        "code": "tenant_required",
                        "detail": "A tenant is required.",
                    }
                }
            )
        serializer.save(tenant=tenant)
