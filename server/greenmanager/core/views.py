from auditlog.models import LogEntry
from django.conf import settings
from django.contrib.gis.db.models.functions import AsGeoJSON, Transform
from django.db.models import F, JSONField
from django.db.models.functions import Cast
from drf_spectacular.utils import OpenApiResponse, extend_schema
from inmagik_utils.audit_log.audit_log_serializers import AuditLogEntrySerializer
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from tenants.mixins import TenantContextMixin

from . import geo
from .errors import api_error
from .schema import GEOJSON_FEATURE_COLLECTION
from .serializers import GeoJSONQuerySerializer
from .services import ChangeContext, change_source


class ChangeContextMixin:
    """The ChangeContext of the request, for the domain services."""

    def get_change_context(self):
        tenant = self.get_current_tenant()
        if tenant is None:
            raise api_error("tenant_required", "A tenant is required.", field="tenant")
        return ChangeContext(
            actor=self.request.user,
            organization=tenant,
            source=change_source(self.request),
        )


class ClientScopedViewSetMixin(ChangeContextMixin, TenantContextMixin):
    """
    Viewset of the asset data, which belong to a client (§5.4 of 04-modello-dati.md).

    The organization of the request sees the records of ``visible_to(tenant)``
    and changes those of ``editable_by(tenant)``: two methods of the QuerySet of
    the model. In the MVP both mean "clients managed by the organization"; the
    access of executors through assignments will extend them, not the views.

    Without a tenant nobody sees anything, staff users included: the records have
    no tenant of their own to check.
    """

    # Actions with an unsafe method that do not change the record.
    read_only_actions = ()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["tenant"] = self.get_current_tenant()
        return context

    def is_write_request(self):
        return (
            self.request.method not in SAFE_METHODS
            and self.action not in self.read_only_actions
        )

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        if tenant is None:
            return qs.none()
        if self.is_write_request():
            return qs.editable_by(tenant)
        return qs.visible_to(tenant)


class AuditHistoryActionMixin:
    """Action ``history``: the technical history of the record (django-auditlog).

    The viewset lists it in ``action_permissions``, usually with the read
    permission.
    """

    def get_history_entries(self, instance):
        return LogEntry.objects.get_for_object(instance).select_related("actor")

    @extend_schema(responses=AuditLogEntrySerializer(many=True))
    @action(detail=True, methods=["get"], pagination_class=None, filter_backends=[])
    def history(self, request, *args, **kwargs):
        instance = self.get_object()
        entries = self.get_history_entries(instance).order_by("-timestamp")
        return Response(AuditLogEntrySerializer(entries, many=True).data)


class ChoicesActionMixin:
    """
    Action ``choices``: the records to pick in a form, filtered like the list
    but not paginated, with the compact ``choice_serializer_class``.
    """

    choice_serializer_class = None

    def get_choices_queryset(self):
        return self.filter_queryset(self.get_queryset())

    def get_serializer_class(self):
        if getattr(self, "action", None) == "choices":
            return self.choice_serializer_class
        return super().get_serializer_class()

    def get_serializer(self, *args, **kwargs):
        # The choices are a list, also for the OpenAPI schema.
        if getattr(self, "action", None) == "choices":
            kwargs.setdefault("many", True)
        return super().get_serializer(*args, **kwargs)

    @action(detail=False, methods=["get"], pagination_class=None)
    def choices(self, request, *args, **kwargs):
        return Response(self.get_serializer(self.get_choices_queryset()).data)


class GeoJSONActionMixin:
    """
    Action ``geojson``: the records filtered like the list, as a GeoJSON
    FeatureCollection for the map (§4.4 of backend.md).

    - Without pagination: the limit is the part of the map in ``bbox``
      (``minx,miny,maxx,maxy`` in WGS84), and ``GEOJSON_MAX_FEATURES`` at most,
      with ``truncated`` true if there were more.
    - The database writes the GeoJSON of the geometries, in ``srid`` if given.
    - The properties are the fields in ``geojson_properties``.
    """

    geojson_geometry_field = "geometry"
    geojson_properties = ()

    @extend_schema(
        parameters=[GeoJSONQuerySerializer],
        responses={200: OpenApiResponse(response=GEOJSON_FEATURE_COLLECTION)},
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def geojson(self, request, *args, **kwargs):
        params = GeoJSONQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)
        field = self.geojson_geometry_field
        queryset = self.filter_queryset(self.get_queryset()).filter(
            **{f"{field}__isnull": False}
        )
        bbox = params.validated_data.get("bbox")
        if bbox is not None:
            queryset = queryset.filter(**{f"{field}__intersects": bbox})
        srid = int(params.validated_data["srid"])
        geometry = F(field) if srid == geo.SRID else Transform(field, srid)
        limit = settings.GEOJSON_MAX_FEATURES
        rows = (
            queryset.annotate(
                geojson_geometry=Cast(AsGeoJSON(geometry), output_field=JSONField())
            )
            .values("pk", "geojson_geometry", *self.geojson_properties)[: limit + 1]
            .iterator(chunk_size=2000)
        )
        features = []
        for row in rows:
            features.append(
                {
                    "type": "Feature",
                    "id": str(row.pop("pk")),
                    "geometry": row.pop("geojson_geometry"),
                    "properties": row,
                }
            )
        truncated = len(features) > limit
        return Response(
            {
                "type": "FeatureCollection",
                "features": features[:limit],
                "truncated": truncated,
            }
        )
