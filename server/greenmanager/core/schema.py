"""Descriptions of the core fields in the OpenAPI schema (drf-spectacular)."""

from drf_spectacular.extensions import OpenApiSerializerFieldExtension

GEOJSON_GEOMETRY = {
    "type": "object",
    "description": "Geometria GeoJSON (RFC 7946), in WGS84.",
    "properties": {
        "type": {"type": "string"},
        "coordinates": {"type": "array", "items": {}},
    },
    "required": ["type", "coordinates"],
}

# The geometries of the geojson action are in the srid of the request.
GEOJSON_RESPONSE_GEOMETRY = {
    **GEOJSON_GEOMETRY,
    "description": "Geometria GeoJSON, con le coordinate nel sistema di "
    "riferimento del parametro srid (WGS84 se manca).",
}

GEOJSON_FEATURE_COLLECTION = {
    "type": "object",
    "properties": {
        "type": {"type": "string", "enum": ["FeatureCollection"]},
        "features": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["Feature"]},
                    "id": {"type": "string"},
                    "geometry": GEOJSON_RESPONSE_GEOMETRY,
                    "properties": {"type": "object", "additionalProperties": True},
                },
            },
        },
        "truncated": {
            "type": "boolean",
            "description": "Vero se le feature erano più del limite restituito.",
        },
    },
    "required": ["type", "features", "truncated"],
}


class GeoJSONGeometryFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "core.serializers.GeoJSONGeometryField"

    def map_serializer_field(self, auto_schema, direction):
        return GEOJSON_GEOMETRY
