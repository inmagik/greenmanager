import django_filters as FS
from auth_core.utils import ActionPermission
from core.serializers import pop_revision
from core.views import (
    AuditHistoryActionMixin,
    ChoicesActionMixin,
    ClientScopedViewSetMixin,
    GeoJSONActionMixin,
)
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from inmagik_utils.audit_log.audit_log_mixins import AuditlogActorMixin
from inmagik_utils.pagination import StandardPaginationMixin
from inmagik_utils.structural_filters import StructuralFilterMixin, StructuralFilterSet
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from . import services
from .models import Area, Zone
from .serializers import (
    AreaChoiceSerializer,
    AreaGeometryCheckResultSerializer,
    AreaGeometryCheckSerializer,
    AreaListSerializer,
    AreaSerializer,
    ZoneChoiceSerializer,
    ZoneSerializer,
)

READ_AREAS = "territory.READ_AREAS"
WRITE_AREAS = "territory.WRITE_AREAS"

READ_ACTIONS = ("list", "retrieve", "history", "choices", "geojson")
WRITE_ACTIONS = ("create", "update", "partial_update", "destroy")


class AssetViewSet(
    AuditlogActorMixin,
    ClientScopedViewSetMixin,
    StandardPaginationMixin,
    StructuralFilterMixin,
    AuditHistoryActionMixin,
    ChoicesActionMixin,
    GeoJSONActionMixin,
    ModelViewSet,
):
    """Base of the viewsets of zones and areas: the writes go through
    ``create_service``, ``update_service`` and ``delete_service``."""

    permission_classes = [ActionPermission]
    action_permissions = {
        **{name: [READ_AREAS] for name in READ_ACTIONS},
        **{name: [WRITE_AREAS] for name in WRITE_ACTIONS},
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    create_service = update_service = delete_service = None

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        pop_revision(data)
        serializer.instance = self.create_service(data, self.get_change_context())

    def perform_update(self, serializer):
        data = dict(serializer.validated_data)
        expected_revision = pop_revision(data)
        serializer.instance = self.update_service(
            serializer.instance,
            data,
            self.get_change_context(),
            expected_revision=expected_revision,
        )

    def perform_destroy(self, instance):
        self.delete_service(instance, self.get_change_context())


class ZoneFilter(StructuralFilterSet):
    client = FS.UUIDFilter()


class ZoneViewSet(AssetViewSet):
    queryset = Zone.objects.select_related("client", "created_by", "updated_by")
    serializer_class = ZoneSerializer
    choice_serializer_class = ZoneChoiceSerializer
    filterset_class = ZoneFilter
    search_fields = ["name"]
    ordering_fields = ["code", "name", "created_at", "updated_at"]
    geojson_properties = ("client", "code", "name")

    create_service = staticmethod(services.create_zone)
    update_service = staticmethod(services.update_zone)
    delete_service = staticmethod(services.delete_zone)


class AreaFilter(StructuralFilterSet):
    client = FS.UUIDFilter()
    zone = FS.UUIDFilter()
    urban_green_type = FS.UUIDFilter()
    area_use = FS.UUIDFilter()
    usage_intensity = FS.UUIDFilter()
    is_fictitious = FS.BooleanFilter()
    has_overlaps = FS.BooleanFilter(method="filter_has_overlaps")
    managed_on = FS.DateFilter(method="filter_managed_on")

    def filter_has_overlaps(self, queryset, name, value):
        if "has_overlaps" not in queryset.query.annotations:
            queryset = queryset.with_overlap_flag()
        return queryset.filter(has_overlaps=value)

    def filter_managed_on(self, queryset, name, value):
        return queryset.managed_on(value)


class AreaViewSet(AssetViewSet):
    queryset = Area.objects.select_related(
        "client",
        "zone",
        "urban_green_type",
        "area_use",
        "usage_intensity",
        "created_by",
        "updated_by",
    ).defer("geometry", "zone__geometry")
    serializer_class = AreaSerializer
    choice_serializer_class = AreaChoiceSerializer
    filterset_class = AreaFilter
    search_fields = ["number", "name"]
    ordering_fields = [
        "number",
        "name",
        "surface_m2",
        "management_start",
        "created_at",
        "updated_at",
    ]
    geojson_properties = ("client", "zone", "number", "sub_number", "name")
    read_only_actions = ("geometry_check",)
    action_permissions = {
        **AssetViewSet.action_permissions,
        "geometry_check": [WRITE_AREAS],
    }

    create_service = staticmethod(services.create_area)
    update_service = staticmethod(services.update_area)
    delete_service = staticmethod(services.delete_area)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            # The flag of the overlaps, a spatial subquery, only where it is
            # shown; the filter adds it where it is asked (AreaFilter).
            return queryset.with_overlap_flag()
        if self.action == "choices":
            return queryset
        # The detail and the writes need the geometry of the area.
        return queryset.defer(None).defer("zone__geometry")

    def get_serializer_class(self):
        if self.action == "list":
            return AreaListSerializer
        return super().get_serializer_class()

    @extend_schema(
        request=AreaGeometryCheckSerializer,
        responses=AreaGeometryCheckResultSerializer,
    )
    @action(detail=False, methods=["post"], url_path="geometry-check")
    def geometry_check(self, request, *args, **kwargs):
        """Measures and warnings of a perimeter before saving it (AR-5)."""
        serializer = AreaGeometryCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        area = None
        if data.get("area") is not None:
            area = self.get_queryset().filter(pk=data["area"]).first()
        proposed = {
            field: data[field]
            for field in services.PROPOSED_AREA_FIELDS
            if field in data
        }
        result = services.check_area_geometry(
            data["client"],
            data["geometry"],
            self.get_change_context(),
            area,
            **proposed
        )
        return Response(AreaGeometryCheckResultSerializer(result).data)
