import django_filters as FS
from auth_core.utils import ActionPermission
from axes.models import AccessAttempt
from axes.utils import reset as reset_axes
from django.conf import settings
from django.db.models import Count, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from inmagik_utils.mixins import BulkDeleteActionMixin
from inmagik_utils.pagination import StandardPaginationMixin
from inmagik_utils.structural_filters import StructuralFilterMixin, StructuralFilterSet
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView as BaseTokenObtainPairView,
)
from tenants.mixins import TenantContextMixin
from tenants.models import TenantMembership

from .models import Role, User
from .permission_manager import permission_manager
from .serializers import (
    USER_STATUSES,
    RoleSerializer,
    RoleUsersSerializer,
    UpdateMeSerializer,
    UserSerializer,
    is_shared_with_other_tenants,
    own_account_error,
    shared_user_error,
)


class TokenObtainPairView(BaseTokenObtainPairView):
    """Login. Locked out credentials get 429 with the code ``account_locked``.

    django-axes marks the request it receives (here the DRF one) and denies the
    authentication; simplejwt would answer as for wrong credentials.
    """

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            if getattr(request, "axes_locked_out", False):
                return Response(
                    {
                        "code": "account_locked",
                        "detail": "Too many failed login attempts.",
                    },
                    status=429,
                )
            raise


class MeView(GenericAPIView):
    queryset = User.objects.none()
    serializer_class = UserSerializer

    def get(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @extend_schema(request=UpdateMeSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UpdateMeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(request.user).data)


class AvailablePermissionsView(APIView):
    @extend_schema(
        responses={
            200: {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "module": {"type": "string"},
                    },
                },
            }
        },
    )
    def get(self, request):
        return Response(permission_manager.permissions)


class UserFilter(StructuralFilterSet):
    status = FS.ChoiceFilter(
        method="filter_status", choices=[(status, status) for status in USER_STATUSES]
    )
    without_role = FS.NumberFilter(method="filter_without_role")

    def filter_status(self, queryset, name, value):
        if value == "active":
            return queryset.filter(
                is_active=True, failed_login_attempts__lt=settings.AXES_FAILURE_LIMIT
            )
        elif value == "inactive":
            return queryset.filter(is_active=False)
        elif value == "locked":
            return queryset.filter(
                failed_login_attempts__gte=settings.AXES_FAILURE_LIMIT
            )
        return queryset

    def filter_without_role(self, queryset, name, value):
        if value:
            return queryset.exclude(roles__id=value)
        return queryset

    class Meta:
        model = User
        fields = {
            "roles": ["exact"],
        }


class UsersViewset(
    TenantContextMixin,
    StandardPaginationMixin,
    StructuralFilterMixin,
    BulkDeleteActionMixin,
    ModelViewSet,
):
    queryset = (
        User.objects.all()
        .prefetch_related("roles")
        .annotate(
            failed_login_attempts=Coalesce(
                Subquery(
                    AccessAttempt.objects.filter(
                        username=OuterRef("email"),
                    ).values(
                        "failures_since_start"
                    )[:1]
                ),
                Value(0),
            ),
        )
    )
    serializer_class = UserSerializer
    permission_classes = [ActionPermission]
    action_permissions = {
        "list": ["auth_core.LETTURA_UTENTI"],
        "retrieve": ["auth_core.LETTURA_UTENTI"],
        # Changing roles or permissions also requires SCRITTURA_RUOLI: the check is
        # in UserSerializer, which knows the current values.
        "create": ["auth_core.SCRITTURA_UTENTI"],
        "update": ["auth_core.SCRITTURA_UTENTI"],
        "partial_update": ["auth_core.SCRITTURA_UTENTI"],
        "destroy": ["auth_core.SCRITTURA_UTENTI"],
        "unlock": ["auth_core.SCRITTURA_UTENTI"],
        "bulk_delete": ["auth_core.SCRITTURA_UTENTI"],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["full_name", "email"]
    ordering_fields = ["full_name", "email", "date_joined", "last_login"]
    filterset_class = UserFilter

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        if tenant is None:
            return self.restrict_queryset_without_tenant(qs)
        return qs.filter(tenant_memberships__tenant=tenant)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["tenant"] = self.get_current_tenant()
        return context

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise own_account_error()
        # A user shared with other tenants would disappear from them too.
        tenant = self.get_current_tenant()
        if not self.request.user.is_staff and is_shared_with_other_tenants(
            instance, tenant
        ):
            raise shared_user_error(instance)
        instance.delete()

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
        user = serializer.save()
        TenantMembership.objects.get_or_create(
            tenant=tenant,
            user=user,
            defaults={"is_default": True},
        )

    @extend_schema(
        request=None,
        responses={200: UserSerializer()},
    )
    @action(detail=True, methods=["post"])
    def unlock(self, request, *args, **kwargs):
        instance = self.get_object()
        reset_axes(username=instance.email)
        # Read it again: the lock comes from a queryset annotation, which
        # refresh_from_db() would leave unchanged.
        instance = self.get_queryset().get(pk=instance.pk)
        return Response(self.get_serializer(instance).data)


class RolesViewset(
    TenantContextMixin, StandardPaginationMixin, BulkDeleteActionMixin, ModelViewSet
):
    queryset = Role.objects.annotate(user_count=Count("user")).order_by("name")
    serializer_class = RoleSerializer
    permission_classes = [ActionPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name"]
    action_permissions = {
        "list": ["auth_core.LETTURA_RUOLI"],
        "retrieve": ["auth_core.LETTURA_RUOLI"],
        "create": ["auth_core.SCRITTURA_RUOLI"],
        "update": ["auth_core.SCRITTURA_RUOLI"],
        "partial_update": ["auth_core.SCRITTURA_RUOLI"],
        "destroy": ["auth_core.SCRITTURA_RUOLI"],
        "bulk_delete": ["auth_core.SCRITTURA_RUOLI"],
    }

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        if tenant is None:
            return self.restrict_queryset_without_tenant(qs)
        return qs.filter(tenant=tenant)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["tenant"] = self.get_current_tenant()
        return context

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

    def role_users(self, request):
        serializer = RoleUsersSerializer(
            data=request.data, context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data["user_ids"]

    def users_response(self, users):
        queryset = User.objects.filter(id__in=[user.id for user in users])
        return Response(
            UserSerializer(
                queryset.prefetch_related("roles"),
                many=True,
                context=self.get_serializer_context(),
            ).data
        )

    @extend_schema(
        request=RoleUsersSerializer,
        responses={200: UserSerializer(many=True)},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[ActionPermission],
        action_permissions={"grant_to": ["auth_core.SCRITTURA_RUOLI"]},
        pagination_class=None,
    )
    def grant_to(self, request, *args, **kwargs):
        role = self.get_object()
        users = self.role_users(request)
        for user in users:
            user.roles.add(role)
        return self.users_response(users)

    @extend_schema(
        request=RoleUsersSerializer,
        responses={200: UserSerializer(many=True)},
    )
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[ActionPermission],
        action_permissions={"revoke_from": ["auth_core.SCRITTURA_RUOLI"]},
        pagination_class=None,
    )
    def revoke_from(self, request, *args, **kwargs):
        role = self.get_object()
        users = self.role_users(request)
        for user in users:
            user.roles.remove(role)
        return self.users_response(users)
