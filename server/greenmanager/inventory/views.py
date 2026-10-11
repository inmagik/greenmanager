import django_filters as FS
from catalogs.models import ElementClass
from core.serializers import pop_revision
from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from inmagik_utils.structural_filters import StructuralFilterSet
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from territory.views import READ_ACTIONS, WRITE_ACTIONS, AssetViewSet

from . import services
from .models import CompositionItem, Element, code_order
from .serializers import (
    ElementChoiceSerializer,
    ElementGeometryCheckResultSerializer,
    ElementGeometryCheckSerializer,
    ElementListSerializer,
    ElementRemoveSerializer,
    ElementRestoreSerializer,
    ElementSerializer,
)

READ_ELEMENTS = "inventory.READ_ELEMENTS"
WRITE_ELEMENTS = "inventory.WRITE_ELEMENTS"


class ElementFilter(StructuralFilterSet):
    client = FS.UUIDFilter()
    area = FS.UUIDFilter()
    zone = FS.UUIDFilter(field_name="area__zone")
    element_class = FS.UUIDFilter()
    category = FS.ChoiceFilter(
        field_name="element_class__category", choices=ElementClass.Category.choices
    )
    species = FS.UUIDFilter()
    location_status = FS.ChoiceFilter(choices=Element.LocationStatus.choices)
    removed = FS.BooleanFilter(method="filter_removed")
    present_on = FS.DateFilter(method="filter_present_on")
    outside_area = FS.BooleanFilter(method="filter_outside_area")

    def filter_removed(self, queryset, name, value):
        return queryset.filter(removed_on__isnull=not value)

    def filter_present_on(self, queryset, name, value):
        return queryset.present_on(value)

    def filter_outside_area(self, queryset, name, value):
        if "outside_area" not in queryset.query.annotations:
            queryset = queryset.with_outside_area_flag()
        return queryset.filter(outside_area=value)


class ElementOrderingFilter(OrderingFilter):
    """Ordering by ``code`` in the natural order of the codes ("2" before "10")."""

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if not ordering:
            return queryset
        expressions = []
        for field in ordering:
            if field.lstrip("-") == "code":
                expressions.extend(code_order(descending=field.startswith("-")))
            else:
                expressions.append(field)
        return queryset.order_by(*expressions)


class ElementViewSet(AssetViewSet):
    queryset = Element.objects.select_related(
        "client",
        "area",
        "element_class",
        "species",
        "removal_cause",
        "created_by",
        "updated_by",
    ).defer("geometry", "area__geometry")
    serializer_class = ElementSerializer
    choice_serializer_class = ElementChoiceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, ElementOrderingFilter]
    filterset_class = ElementFilter
    search_fields = ["code", "tag_number", "species__scientific_name", "notes"]
    ordering_fields = [
        "code",
        "tag_number",
        "planted_on",
        "removed_on",
        "created_at",
        "updated_at",
    ]
    geojson_properties = (
        "client",
        "area",
        "element_class",
        "species",
        "code",
        "tag_number",
        "location_status",
        "removed_on",
    )
    read_only_actions = ("geometry_check",)
    action_permissions = {
        **{name: [READ_ELEMENTS] for name in READ_ACTIONS},
        **{
            name: [WRITE_ELEMENTS]
            for name in (*WRITE_ACTIONS, "remove", "restore", "geometry_check")
        },
    }

    create_service = staticmethod(services.create_element)
    update_service = staticmethod(services.update_element)
    delete_service = staticmethod(services.delete_element)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            # The flag of the elements outside their area, a spatial subquery,
            # only where it is shown; the filter adds it where it is asked.
            return queryset.with_outside_area_flag()
        if self.action in ("choices", "geojson"):
            return queryset
        # The detail and the writes need the geometry and the composition.
        return (
            queryset.defer(None)
            .defer("area__geometry")
            .prefetch_related(
                Prefetch(
                    "composition",
                    queryset=CompositionItem.objects.select_related("species"),
                )
            )
        )

    def get_serializer_class(self):
        if self.action == "list":
            return ElementListSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        super().perform_create(serializer)
        # The response warns of the trees near the new position.
        serializer.context["new_position"] = True

    def perform_update(self, serializer):
        def position(element):
            return (
                element.geometry,
                element.element_class_id,
                element.location_status,
            )

        before = position(serializer.instance)
        super().perform_update(serializer)
        # A new geometry or class, or a provisional position verified.
        serializer.context["new_position"] = position(serializer.instance) != before

    def element_response(self, element):
        return Response(
            ElementSerializer(element, context=self.get_serializer_context()).data
        )

    @extend_schema(
        request=ElementGeometryCheckSerializer,
        responses=ElementGeometryCheckResultSerializer,
    )
    @action(detail=False, methods=["post"], url_path="geometry-check")
    def geometry_check(self, request, *args, **kwargs):
        """Measures, proposed area and warnings of a position before saving it
        (AR-5, scenario 4.2)."""
        serializer = ElementGeometryCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        element = None
        if data.get("element") is not None:
            element = self.get_queryset().filter(pk=data["element"]).first()
        result = services.check_element_geometry(
            data["element_class"],
            data["geometry"],
            self.get_change_context(),
            area_id=data.get("area"),
            client_id=data.get("client"),
            element=element,
        )
        return Response(ElementGeometryCheckResultSerializer(result).data)

    @extend_schema(request=ElementRemoveSerializer, responses=ElementSerializer)
    @action(detail=True, methods=["post"])
    def remove(self, request, *args, **kwargs):
        """Remove the element (EL-7), or correct date and cause of its removal."""
        element = self.get_object()
        serializer = ElementRemoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        expected_revision = pop_revision(data)
        element = services.remove_element(
            element,
            data,
            self.get_change_context(),
            expected_revision=expected_revision,
        )
        return self.element_response(element)

    @extend_schema(request=ElementRestoreSerializer, responses=ElementSerializer)
    @action(detail=True, methods=["post"])
    def restore(self, request, *args, **kwargs):
        """Restore an element removed by mistake."""
        element = self.get_object()
        serializer = ElementRestoreSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        expected_revision = pop_revision(data)
        element = services.restore_element(
            element,
            data,
            self.get_change_context(),
            expected_revision=expected_revision,
        )
        return self.element_response(element)
