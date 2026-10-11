from core import geo
from core.enums import GeometryType
from core.serializers import GeoJSONGeometryField, GeoJSONQuerySerializer
from django.contrib.gis.geos import MultiLineString, MultiPolygon, Point
from django.test import SimpleTestCase, TestCase
from rest_framework import serializers


def square(x0, y0, size=0.001):
    return [
        [x0, y0],
        [x0 + size, y0],
        [x0 + size, y0 + size],
        [x0, y0 + size],
        [x0, y0],
    ]


def polygon(*rings):
    return {"type": "Polygon", "coordinates": list(rings)}


class NormalizeTests(SimpleTestCase):
    def normalize(self, geojson, kind=GeometryType.POLYGON):
        return geo.normalize(geo.parse_geojson(geojson), kind)

    def error(self, geojson, kind=GeometryType.POLYGON):
        with self.assertRaises(geo.GeometryError) as raised:
            self.normalize(geojson, kind)
        return raised.exception.payload["code"]

    def test_polygons_and_lines_become_multipart(self):
        area = self.normalize(polygon(square(9, 45)))
        line = self.normalize(
            {"type": "LineString", "coordinates": [[9, 45], [9.001, 45]]},
            GeometryType.LINE,
        )
        point = self.normalize(
            {"type": "Point", "coordinates": [9, 45]}, GeometryType.POINT
        )

        self.assertIsInstance(area, MultiPolygon)
        self.assertIsInstance(line, MultiLineString)
        self.assertIsInstance(point, Point)
        self.assertEqual(area.srid, 4326)

    def test_z_is_dropped(self):
        ring = [[x, y, 120.0] for x, y in square(9, 45)]

        area = self.normalize(polygon(ring))

        self.assertFalse(area.hasz)
        self.assertEqual(area[0].exterior_ring[0], (9.0, 45.0))

    def test_refused_geometries(self):
        bowtie = [[9, 45], [9.001, 45.001], [9.001, 45], [9, 45.001], [9, 45]]
        projected = square(1500000, 5000000, size=100)

        self.assertEqual(self.error(polygon(bowtie)), "geometry_invalid")
        self.assertEqual(self.error(polygon(projected)), "geometry_out_of_range")
        self.assertEqual(
            self.error({"type": "Point", "coordinates": [9, 45]}),
            "geometry_type_not_allowed",
        )
        self.assertEqual(
            self.error({"type": "Polygon", "coordinates": []}), "geometry_empty"
        )
        self.assertEqual(self.error({"type": "Feature"}), "geometry_invalid_geojson")
        self.assertEqual(self.error("POINT (9 45)"), "geometry_invalid_geojson")

    def test_field_gives_the_errors_with_their_code(self):
        field = GeoJSONGeometryField(GeometryType.POLYGON)

        with self.assertRaises(serializers.ValidationError) as raised:
            field.to_internal_value({"type": "Point", "coordinates": [9, 45]})

        self.assertEqual(raised.exception.detail["code"], "geometry_type_not_allowed")
        self.assertEqual(
            field.to_representation(self.normalize(polygon(square(9, 45))))["type"],
            "MultiPolygon",
        )

    def test_bbox(self):
        valid = GeoJSONQuerySerializer(data={"bbox": "9,45,9.1,45.1", "srid": 3857})
        reversed_ = GeoJSONQuerySerializer(data={"bbox": "9.1,45,9,45.1"})
        text = GeoJSONQuerySerializer(data={"bbox": "a,b,c,d"})
        other_srid = GeoJSONQuerySerializer(data={"srid": 32632})

        self.assertTrue(valid.is_valid(), valid.errors)
        self.assertEqual(valid.validated_data["bbox"].extent, (9, 45, 9.1, 45.1))
        self.assertFalse(reversed_.is_valid())
        self.assertEqual(reversed_.errors["bbox"]["code"], "bbox_invalid")
        self.assertFalse(text.is_valid())
        self.assertFalse(other_srid.is_valid())


class GeodesicMeasuresTests(TestCase):
    def test_measures_on_the_ellipsoid_and_sum_of_the_parts(self):
        # One degree of latitude by one of longitude at the equator: about
        # 111.32 km by 110.57 km on the WGS84 ellipsoid.
        degree = geo.normalize(
            geo.parse_geojson(polygon(square(0, 0, size=1))), GeometryType.POLYGON
        )
        part = geo.normalize(
            geo.parse_geojson(polygon(square(9, 45))), GeometryType.POLYGON
        )
        two_parts = MultiPolygon(part[0], geo.parse_geojson(polygon(square(9.01, 45))))
        two_parts.srid = 4326

        measures = geo.geodesic_measures(degree)
        one = geo.geodesic_measures(part)
        both = geo.geodesic_measures(two_parts)

        self.assertAlmostEqual(float(measures["area_m2"]) / 1e6, 12308.8, delta=1)
        self.assertGreater(one["area_m2"], 0)
        self.assertAlmostEqual(
            float(both["area_m2"]), 2 * float(one["area_m2"]), delta=1
        )
        self.assertAlmostEqual(
            float(both["perimeter_m"]), 2 * float(one["perimeter_m"]), delta=0.1
        )

    def test_length_of_lines_and_sum_of_the_parts(self):
        # One degree along the equator and one along a meridian, on the WGS84
        # ellipsoid: about 111.32 km and 110.57 km.
        equator = {"type": "LineString", "coordinates": [[0, 0], [1, 0]]}
        meridian = {"type": "LineString", "coordinates": [[0, 0], [0, 1]]}
        both = {
            "type": "MultiLineString",
            "coordinates": [equator["coordinates"], meridian["coordinates"]],
        }

        def length(geojson):
            line = geo.normalize(geo.parse_geojson(geojson), GeometryType.LINE)
            return geo.geodesic_measures(line)

        one = length(equator)
        two = length(both)

        self.assertAlmostEqual(float(one["length_m"]), 111319.49, delta=0.1)
        self.assertAlmostEqual(
            float(length(meridian)["length_m"]), 110574.39, delta=0.1
        )
        self.assertAlmostEqual(float(two["length_m"]), 221893.88, delta=0.1)
        self.assertEqual((one["area_m2"], one["perimeter_m"]), (0, 0))
