"""
Geometries of the domain (§4.2 of 04-modello-dati.md, D-035).

They are stored in WGS84 (EPSG:4326). Lines and polygons can be multipart and
are stored as MultiLineString and MultiPolygon; points are simple. Areas and
lengths are computed on the ellipsoid, so they are in meters everywhere.
"""

import json
from decimal import Decimal

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.gdal import GDALException
from django.contrib.gis.geos import (
    GEOSException,
    GEOSGeometry,
    LineString,
    MultiLineString,
    MultiPolygon,
    Point,
    Polygon,
    WKBWriter,
)
from django.db import connection
from django.db.models import FloatField, Func
from django.db.models.functions import Cast

from .enums import GeometryType
from .errors import error_payload

SRID = 4326
# Systems the GeoJSON endpoints can give the coordinates in: WGS84, Web Mercator
# and RDN2008, geographic and projected (the systems of the CAM export).
OUTPUT_SRIDS = (4326, 3857, 6706, 7791, 7792, 7793, 7794)

# Stored type of each kind of geometry, and the input types it accepts.
STORED_TYPES = {
    GeometryType.POINT: (Point, (Point,)),
    GeometryType.LINE: (MultiLineString, (LineString, MultiLineString)),
    GeometryType.POLYGON: (MultiPolygon, (Polygon, MultiPolygon)),
}


class GeometryError(ValueError):
    """A geometry that cannot be stored, with the payload of the API error."""

    def __init__(self, code, detail, params=None):
        super().__init__(detail)
        self.payload = error_payload(code, detail, params)


def parse_geojson(value):
    """A GeoJSON geometry object (a dict or its text) as a geometry in WGS84."""
    if isinstance(value, dict):
        value = json.dumps(value)
    if not isinstance(value, str) or not value.strip().startswith("{"):
        raise GeometryError(
            "geometry_invalid_geojson", "The geometry must be a GeoJSON geometry."
        )
    try:
        geometry = GEOSGeometry(value)
    except (GEOSException, GDALException, ValueError, TypeError):
        raise GeometryError(
            "geometry_invalid_geojson", "The geometry must be a GeoJSON geometry."
        ) from None
    if geometry.srid is None:
        geometry.srid = SRID
    elif geometry.srid != SRID:
        geometry.transform(SRID)
    return geometry


def normalize(geometry, kind):
    """
    The geometry as stored for ``kind`` (a GeometryType): a line becomes a
    MultiLineString, a polygon a MultiPolygon, a point stays a point. The Z
    coordinate is dropped. Empty, invalid or out of range geometries are refused.
    """
    stored_type, accepted = STORED_TYPES[kind]
    if not isinstance(geometry, accepted):
        raise GeometryError(
            "geometry_type_not_allowed",
            "The type of the geometry is not allowed.",
            {
                "type": geometry.geom_type,
                "allowed": ", ".join(t.__name__ for t in accepted),
            },
        )
    if geometry.empty:
        raise GeometryError("geometry_empty", "The geometry is empty.")
    srid = geometry.srid or SRID
    if geometry.hasz:
        # The WKB writer writes two dimensions unless told otherwise.
        geometry = GEOSGeometry(WKBWriter().write(geometry), srid=srid)
    if not isinstance(geometry, stored_type):
        geometry = stored_type(geometry, srid=srid)
    geometry.srid = srid
    minx, miny, maxx, maxy = geometry.extent
    if minx < -180 or maxx > 180 or miny < -90 or maxy > 90:
        raise GeometryError(
            "geometry_out_of_range",
            "The coordinates are not longitudes and latitudes in WGS84.",
        )
    if not geometry.valid:
        raise GeometryError(
            "geometry_invalid",
            "The geometry is not valid.",
            {"reason": geometry.valid_reason},
        )
    return geometry


def geodesic_measures(geometry):
    """
    Area and perimeter (polygons) or length (lines) of a WGS84 geometry, in
    meters on the ellipsoid; for a multipart geometry, the sum of the parts.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT ST_Area(g::geography), ST_Perimeter(g::geography), "
            "ST_Length(g::geography) FROM (SELECT ST_GeomFromEWKB(%s) AS g) AS input",
            [bytes(geometry.ewkb)],
        )
        area, perimeter, length = cursor.fetchone()
    return {
        "area_m2": round_meters(area),
        "perimeter_m": round_meters(perimeter),
        "length_m": round_meters(length),
    }


def round_meters(value):
    return Decimal(str(round(value or 0, 2)))


def geodesic(function, expression):
    """
    ``function`` (``ST_Length``, ``ST_Area``) of a WGS84 geometry expression, in
    meters on the ellipsoid: ``geodesic_measures`` as an expression of a query.
    """
    return Func(
        Cast(expression, GeometryField(srid=SRID, geography=True)),
        function=function,
        output_field=FloatField(),
    )
