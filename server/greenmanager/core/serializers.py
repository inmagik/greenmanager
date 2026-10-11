import json

from django.contrib.gis.geos import Polygon
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from . import geo
from .errors import error_payload
from .services import user_label


class TrackedModelSerializer(serializers.ModelSerializer):
    """
    Base serializer of the models with the tracking fields (TrackedModel).

    - The labels of the authors feed the "last change" details of the detail
      pages: the views select ``created_by`` and ``updated_by`` with the record.
    - ``revision`` is the current revision; in a change, the client can send back
      the revision it read: if the record changed in the meantime the API answers
      409 ``revision_conflict``. The views take it out of the validated data
      (``pop_revision``).
    """

    created_by_label = serializers.SerializerMethodField()
    updated_by_label = serializers.SerializerMethodField()
    revision = serializers.IntegerField(required=False, min_value=1)

    tracking_fields = (
        "created_at",
        "created_by_label",
        "updated_at",
        "updated_by_label",
        "revision",
    )

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_created_by_label(self, obj):
        return user_label(obj.created_by) or None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_updated_by_label(self, obj):
        return user_label(obj.updated_by) or None


def pop_revision(validated_data):
    """The revision the client read, out of the data to save."""
    return validated_data.pop("revision", None)


class GeoJSONGeometryField(serializers.Field):
    """
    A geometry as a GeoJSON geometry object, in WGS84 (§4.2 of 04-modello-dati.md).

    The input is normalized for ``geometry_type`` (``core.geo.normalize``): a
    polygon becomes a MultiPolygon, and so on. The errors have a code (e.g.
    ``geometry_invalid``, ``geometry_type_not_allowed``).
    """

    def __init__(self, geometry_type, **kwargs):
        self.geometry_type = geometry_type
        super().__init__(**kwargs)

    def to_representation(self, value):
        return json.loads(value.geojson)

    def to_internal_value(self, data):
        try:
            return geo.normalize(geo.parse_geojson(data), self.geometry_type)
        except geo.GeometryError as exc:
            raise serializers.ValidationError(exc.payload)


class GeoJSONQuerySerializer(serializers.Serializer):
    """Parameters of the ``geojson`` actions (core.views.GeoJSONActionMixin)."""

    bbox = serializers.CharField(
        required=False,
        help_text="Porzione di mappa: minx,miny,maxx,maxy in WGS84.",
    )
    srid = serializers.ChoiceField(
        choices=geo.OUTPUT_SRIDS,
        required=False,
        default=geo.SRID,
        help_text="Sistema di riferimento delle coordinate restituite.",
    )

    def validate_bbox(self, value):
        try:
            minx, miny, maxx, maxy = (float(part) for part in value.split(","))
        except ValueError:
            minx = miny = maxx = maxy = 0
        if minx >= maxx or miny >= maxy:
            raise serializers.ValidationError(
                error_payload(
                    "bbox_invalid",
                    "The bbox must be minx,miny,maxx,maxy, with min below max.",
                )
            )
        bbox = Polygon.from_bbox((minx, miny, maxx, maxy))
        bbox.srid = geo.SRID
        return bbox
