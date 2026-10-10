import django_filters as FS
from auth_core.utils import ActionPermission
from core.enums import GeometryType
from core.errors import api_error
from core.serializers import pop_revision
from core.views import AuditHistoryActionMixin, ChoicesActionMixin
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from inmagik_utils.audit_log.audit_log_mixins import AuditlogActorMixin
from inmagik_utils.pagination import StandardPaginationMixin
from inmagik_utils.structural_filters import StructuralFilterMixin, StructuralFilterSet
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from tenants.mixins import TenantContextMixin

from . import services
from .models import (
    AreaUse,
    AttributeDefinition,
    ElementClass,
    ElementClassAttribute,
    RemovalCause,
    Species,
    UrbanGreenType,
    UsageIntensity,
)
from .serializers import (
    AreaUseSerializer,
    AttributeDefinitionSerializer,
    AttributeOptionSerializer,
    ElementClassOptionSerializer,
    ElementClassSerializer,
    EntryOptionSerializer,
    RemovalCauseOptionSerializer,
    RemovalCauseSerializer,
    SpeciesOptionSerializer,
    SpeciesSerializer,
    UrbanGreenTypeSerializer,
    UsageIntensityOptionSerializer,
    UsageIntensitySerializer,
)

WRITE_CATALOGS = "catalogs.WRITE_CATALOGS"


class FixedCatalogFilter(StructuralFilterSet):
    retired = FS.BooleanFilter()
    available = FS.BooleanFilter(field_name="is_available")


class ExtensibleCatalogFilter(FixedCatalogFilter):
    SCOPES = (("system", "system"), ("organization", "organization"))

    hidden = FS.BooleanFilter(field_name="is_hidden")
    scope = FS.ChoiceFilter(choices=SCOPES, method="filter_scope")

    def filter_scope(self, queryset, name, value):
        return queryset.filter(organization__isnull=value == "system")


class CatalogScopeMixin:
    """
    Entries visible to the organization of the request (system entries and its
    own), with the flags ``is_hidden`` and ``is_available``.

    It comes after StructuralFilterMixin, so that the structural filters see the
    flags. Without a tenant only the system entries are visible.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        return qs.visible_to(tenant).with_flags(tenant)


class CatalogViewSet(
    AuditlogActorMixin,
    TenantContextMixin,
    StandardPaginationMixin,
    StructuralFilterMixin,
    CatalogScopeMixin,
    AuditHistoryActionMixin,
    ChoicesActionMixin,
    ModelViewSet,
):
    """
    Entries of a catalog.

    Every member of the organization reads the catalogs: the forms of areas and
    elements need them. Writing needs ``WRITE_CATALOGS``; the system entries are
    changed only by staff users (services).
    """

    permission_classes = [ActionPermission]
    action_permissions = {
        "list": [IsAuthenticated],
        "retrieve": [IsAuthenticated],
        "choices": [IsAuthenticated],
        "history": [IsAuthenticated],
        "create": [WRITE_CATALOGS],
        "update": [WRITE_CATALOGS],
        "partial_update": [WRITE_CATALOGS],
        "destroy": [WRITE_CATALOGS],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = FixedCatalogFilter
    search_fields = ["code", "name"]
    ordering_fields = ["sort_order", "name", "code", "updated_at"]
    choice_serializer_class = EntryOptionSerializer

    def get_choices_queryset(self):
        """Entries the organization can pick in a form."""
        return super().get_choices_queryset().filter(is_available=True)

    def require_tenant(self):
        tenant = self.get_current_tenant()
        if tenant is None:
            raise api_error("tenant_required", "A tenant is required.", field="tenant")
        return tenant

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        pop_revision(data)
        serializer.instance = services.create_entry(
            self.queryset.model,
            data,
            user=self.request.user,
            organization=self.get_current_tenant(),
        )

    def perform_update(self, serializer):
        data = dict(serializer.validated_data)
        expected_revision = pop_revision(data)
        serializer.instance = services.update_entry(
            serializer.instance,
            data,
            user=self.request.user,
            expected_revision=expected_revision,
        )

    def perform_destroy(self, instance):
        services.delete_entry(instance, user=self.request.user)


class ExtensibleCatalogViewSet(CatalogViewSet):
    filterset_class = ExtensibleCatalogFilter
    action_permissions = {
        **CatalogViewSet.action_permissions,
        "hide": [WRITE_CATALOGS],
        "unhide": [WRITE_CATALOGS],
    }

    def fresh(self, entry):
        return self.get_queryset().get(pk=entry.pk)

    @extend_schema(request=None)
    @action(detail=True, methods=["post"])
    def hide(self, request, *args, **kwargs):
        """The organization hides a system entry it does not use."""
        entry = self.get_object()
        services.hide_entry(entry, self.require_tenant())
        return Response(self.get_serializer(self.fresh(entry)).data)

    @extend_schema(request=None)
    @action(detail=True, methods=["post"])
    def unhide(self, request, *args, **kwargs):
        entry = self.get_object()
        services.unhide_entry(entry, self.require_tenant())
        return Response(self.get_serializer(self.fresh(entry)).data)


TRACKED = ("created_by", "updated_by")


class SpeciesFilter(ExtensibleCatalogFilter):
    rank = FS.ChoiceFilter(choices=Species.Rank.choices)
    genus = FS.CharFilter(lookup_expr="iexact")


class SpeciesViewSet(ExtensibleCatalogViewSet):
    queryset = Species.objects.select_related("parent", "organization", *TRACKED)
    serializer_class = SpeciesSerializer
    choice_serializer_class = SpeciesOptionSerializer
    filterset_class = SpeciesFilter
    search_fields = ["code", "scientific_name", "common_name", "genus"]
    ordering_fields = ["scientific_name", "common_name", "code", "updated_at"]


class ElementClassFilter(ExtensibleCatalogFilter):
    category = FS.ChoiceFilter(choices=ElementClass.Category.choices)
    geometry_type = FS.ChoiceFilter(choices=GeometryType.choices)


class ElementClassViewSet(ExtensibleCatalogViewSet):
    queryset = ElementClass.objects.select_related(
        "organization", *TRACKED
    ).prefetch_related(
        Prefetch(
            "class_attributes",
            queryset=ElementClassAttribute.objects.select_related("attribute"),
        )
    )
    serializer_class = ElementClassSerializer
    choice_serializer_class = ElementClassOptionSerializer
    filterset_class = ElementClassFilter


class AttributeDefinitionFilter(ExtensibleCatalogFilter):
    data_type = FS.ChoiceFilter(choices=AttributeDefinition.DataType.choices)
    is_measure = FS.BooleanFilter()


class AttributeDefinitionViewSet(ExtensibleCatalogViewSet):
    queryset = AttributeDefinition.objects.select_related("organization", *TRACKED)
    serializer_class = AttributeDefinitionSerializer
    choice_serializer_class = AttributeOptionSerializer
    filterset_class = AttributeDefinitionFilter


class UrbanGreenTypeViewSet(CatalogViewSet):
    queryset = UrbanGreenType.objects.select_related(*TRACKED)
    serializer_class = UrbanGreenTypeSerializer


class AreaUseViewSet(ExtensibleCatalogViewSet):
    queryset = AreaUse.objects.select_related("organization", *TRACKED)
    serializer_class = AreaUseSerializer


class UsageIntensityViewSet(ExtensibleCatalogViewSet):
    queryset = UsageIntensity.objects.select_related("organization", *TRACKED)
    serializer_class = UsageIntensitySerializer
    choice_serializer_class = UsageIntensityOptionSerializer
    ordering_fields = [*ExtensibleCatalogViewSet.ordering_fields, "rank"]


class RemovalCauseViewSet(ExtensibleCatalogViewSet):
    queryset = RemovalCause.objects.select_related("organization", *TRACKED)
    serializer_class = RemovalCauseSerializer
    choice_serializer_class = RemovalCauseOptionSerializer
