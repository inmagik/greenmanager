import datetime
import uuid

from catalogs.models import AreaUse, UrbanGreenType, UsageIntensity
from core import geo
from core.enums import GeometryType
from core.models import ChangeRecord
from core.services import ChangeContext
from core.testing import make_tenant, make_user, tenant_header
from django.db import connection
from django.test import override_settings
from django.test.utils import CaptureQueriesContext
from parties.models import Client
from rest_framework.test import APITestCase
from territory import services
from territory.models import Area, Zone

READ = "territory.READ_AREAS"
WRITE = "territory.WRITE_AREAS"


def square(x0, y0, size=0.001):
    ring = [[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size]]
    return {"type": "Polygon", "coordinates": [[*ring, [x0, y0]]]}


def geometry(x0, y0, size=0.001):
    return geo.normalize(geo.parse_geojson(square(x0, y0, size)), GeometryType.POLYGON)


class TerritoryTestCase(APITestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.other = make_tenant("Other")
        self.manager = make_user("manager@example.com", self.org, [READ, WRITE])
        self.reader = make_user("reader@example.com", self.org, [READ])
        self.header = tenant_header(self.org)
        self.context = ChangeContext(actor=self.manager, organization=self.org)
        self.own = Client.objects.create(
            name="Comune", kind="public_body", managing_organization=self.org
        )
        self.foreign = Client.objects.create(
            name="Altro", kind="public_body", managing_organization=self.other
        )
        self.green_type = UrbanGreenType.objects.get(code="urban_park")
        self.area_use = AreaUse.objects.system().first()
        self.intensity = UsageIntensity.objects.get(code="medium")
        self.client.force_authenticate(self.manager)

    def area_data(self, **changes):
        return {
            "client": str(self.own.pk),
            "number": "1",
            "name": "Parco",
            "geometry": square(9, 45),
            "urban_green_type": str(self.green_type.pk),
            "area_use": str(self.area_use.pk),
            "usage_intensity": str(self.intensity.pk),
            "management_start": "2020-01-01",
            "municipality_code": "015146",
            **changes,
        }

    def make_area(self, number, x0, client=None, **changes):
        return services.create_area(
            {
                "client": client or self.own,
                "number": number,
                "name": f"Area {number}",
                "geometry": geometry(x0, 45),
                "urban_green_type": self.green_type,
                "area_use": self.area_use,
                "usage_intensity": self.intensity,
                "management_start": datetime.date(2020, 1, 1),
                "municipality_code": "015146",
                **changes,
            },
            (
                self.context
                if client is None or client.managing_organization == self.org
                else ChangeContext(
                    actor=None, organization=client.managing_organization
                )
            ),
        )

    def post(self, url, data):
        return self.client.post(url, data, format="json", **self.header)

    def patch(self, url, data):
        return self.client.patch(url, data, format="json", **self.header)


class ZoneTests(TerritoryTestCase):
    url = "/api/territory/zones/"

    def test_codes_are_the_next_of_the_client(self):
        first = self.post(self.url, {"client": str(self.own.pk), "name": "Nord"})
        second = self.post(self.url, {"client": str(self.own.pk), "name": "Sud"})
        repeated = self.post(
            self.url, {"client": str(self.own.pk), "name": "Est", "code": 2}
        )

        self.assertEqual(first.status_code, 201, first.content)
        self.assertEqual((first.data["code"], second.data["code"]), (1, 2))
        self.assertEqual(repeated.status_code, 400, repeated.content)
        self.assertEqual(repeated.data["code"][0]["code"], "zone_code_not_unique")
        record = ChangeRecord.objects.get(record_id=first.data["id"])
        self.assertEqual(record.client_id, self.own.pk)

    def test_clients_of_other_organizations(self):
        foreign_zone = Zone.objects.create(client=self.foreign, code=1, name="X")

        created = self.post(self.url, {"client": str(self.foreign.pk), "name": "Z"})
        listed = self.client.get(self.url, **self.header)
        detail = self.client.get(f"{self.url}{foreign_zone.pk}/", **self.header)

        self.assertEqual(created.status_code, 400, created.content)
        self.assertEqual(created.data["client"]["code"], "client_not_available")
        self.assertEqual(listed.data["count"], 0)
        self.assertEqual(detail.status_code, 404)

    def test_client_does_not_change(self):
        zone = services.create_zone({"client": self.own, "name": "Nord"}, self.context)
        other_own = Client.objects.create(
            name="Secondo", kind="company", managing_organization=self.org
        )

        response = self.patch(f"{self.url}{zone.pk}/", {"client": str(other_own.pk)})

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["client"]["code"], "client_immutable")

    def test_inactive_client_gets_no_new_zones(self):
        zone = services.create_zone({"client": self.own, "name": "Nord"}, self.context)
        self.own.active = False
        self.own.save()

        created = self.post(self.url, {"client": str(self.own.pk), "name": "Sud"})
        updated = self.patch(f"{self.url}{zone.pk}/", {"name": "Nord-est"})

        self.assertEqual(created.status_code, 400, created.content)
        self.assertEqual(created.data["client"]["code"], "client_inactive")
        self.assertEqual(created.data["client"]["params"], {"name": "Comune"})
        self.assertEqual(updated.status_code, 200, updated.content)

    def test_zone_with_areas_is_not_deleted(self):
        zone = services.create_zone({"client": self.own, "name": "Nord"}, self.context)
        self.make_area("1", 9, zone=zone)
        empty = services.create_zone({"client": self.own, "name": "Sud"}, self.context)

        refused = self.client.delete(f"{self.url}{zone.pk}/", **self.header)
        deleted = self.client.delete(f"{self.url}{empty.pk}/", **self.header)

        self.assertEqual(refused.status_code, 400, refused.content)
        self.assertEqual(refused.data["code"], "zone_has_areas")
        self.assertEqual(deleted.status_code, 204, deleted.content)
        self.assertEqual(
            ChangeRecord.objects.get(record_id=empty.pk, operation="cancel").client_id,
            self.own.pk,
        )

    def test_geometry_is_optional_and_multipart(self):
        response = self.post(
            self.url,
            {"client": str(self.own.pk), "name": "Nord", "geometry": square(9, 45)},
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["geometry"]["type"], "MultiPolygon")


class AreaTests(TerritoryTestCase):
    url = "/api/territory/areas/"

    def test_create_computes_the_measures_and_records_the_change(self):
        self.own.istat_code = "015146"
        self.own.save()

        response = self.post(self.url, self.area_data(municipality_code=""))

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["geometry"]["type"], "MultiPolygon")
        self.assertAlmostEqual(float(response.data["surface_m2"]), 8762.31, delta=1)
        self.assertAlmostEqual(float(response.data["perimeter_m"]), 379.96, delta=1)
        self.assertEqual(response.data["municipality_code"], "015146")
        self.assertEqual(response.data["code"], "1")
        self.assertEqual(response.data["warnings"], [])
        record = ChangeRecord.objects.get(record_id=response.data["id"])
        self.assertEqual(record.operation, "create")
        self.assertEqual(record.changes["geometry"]["new"]["type"], "MultiPolygon")

    def test_rules_of_the_fields(self):
        foreign_zone = Zone.objects.create(client=self.foreign, code=1, name="X")
        self.make_area("1", 9)

        no_municipality = self.post(self.url, self.area_data(municipality_code=""))
        repeated = self.post(self.url, self.area_data())
        sub_area = self.post(self.url, self.area_data(sub_number="a"))
        dates = self.post(
            self.url, self.area_data(number="2", management_end="2019-01-01")
        )
        other_zone = self.post(
            self.url, self.area_data(number="3", zone=str(foreign_zone.pk))
        )
        foreign_client = self.post(
            self.url, self.area_data(client=str(self.foreign.pk))
        )
        point = self.post(
            self.url,
            self.area_data(
                number="4", geometry={"type": "Point", "coordinates": [9, 45]}
            ),
        )

        self.assertEqual(
            no_municipality.data["municipality_code"]["code"],
            "municipality_code_required",
        )
        self.assertEqual(repeated.data["number"][0]["code"], "area_number_not_unique")
        self.assertEqual(sub_area.status_code, 201, sub_area.content)
        self.assertEqual(sub_area.data["code"], "1/a")
        self.assertEqual(
            dates.data["management_end"][0]["code"], "area_management_dates_invalid"
        )
        self.assertEqual(other_zone.data["zone"]["code"], "zone_of_another_client")
        self.assertEqual(foreign_client.data["client"]["code"], "client_not_available")
        self.assertEqual(point.data["geometry"]["code"], "geometry_type_not_allowed")

    def test_inactive_client_gets_no_new_areas(self):
        area = self.make_area("1", 9)
        self.own.active = False
        self.own.save()

        created = self.post(self.url, self.area_data(number="2"))
        updated = self.patch(f"{self.url}{area.pk}/", {"name": "Parco grande"})

        self.assertEqual(created.status_code, 400, created.content)
        self.assertEqual(created.data["client"]["code"], "client_inactive")
        self.assertEqual(updated.status_code, 200, updated.content)

    def test_classifications_must_be_available_the_stored_ones_stay(self):
        area = self.make_area("1", 9)
        hidden = AreaUse.objects.system().exclude(pk=self.area_use.pk).first()
        hidden.hidden_by.add(self.org)
        self.area_use.hidden_by.add(self.org)
        url = f"{self.url}{area.pk}/"

        kept = self.patch(url, {"name": "Parco grande"})
        refused = self.patch(url, {"area_use": str(hidden.pk)})

        self.assertEqual(kept.status_code, 200, kept.content)
        self.assertEqual(refused.status_code, 400, refused.content)
        self.assertEqual(
            refused.data["area_use"]["code"], "catalog_entry_not_available"
        )

    def test_overlaps_are_warnings(self):
        first = self.make_area("1", 9)
        # Only touches the first area.
        self.make_area("2", 9.001)
        # Ended before the third one started.
        self.make_area("3", 9.0005, management_end=datetime.date(2020, 12, 31))
        self.make_area("4", 9.0005, is_fictitious=True)

        overlapping = self.post(
            self.url,
            self.area_data(
                number="5", geometry=square(9.0005, 45), management_start="2021-01-01"
            ),
        )
        detail = self.client.get(f"{self.url}{first.pk}/", **self.header)
        flagged = self.client.get(self.url, {"has_overlaps": True}, **self.header)

        self.assertEqual(overlapping.status_code, 201, overlapping.content)
        self.assertEqual(len(overlapping.data["warnings"]), 1)
        warning = overlapping.data["warnings"][0]
        self.assertEqual(warning["code"], "area_overlaps")
        self.assertEqual(warning["params"]["areas"], "1 Area 1, 2 Area 2")
        # The third area was managed in 2020, together with the first one.
        self.assertEqual(
            detail.data["warnings"][0]["params"]["areas"], "3 Area 3, 5 Parco"
        )
        self.assertEqual(
            sorted(area["number"] for area in flagged.data["results"]),
            ["1", "2", "3", "5"],
        )
        self.assertNotIn("geometry", flagged.data["results"][0])

    def test_geometry_check(self):
        area = self.make_area("1", 9)
        url = f"{self.url}geometry-check/"

        new = self.post(url, {"client": str(self.own.pk), "geometry": square(9, 45)})
        same = self.post(
            url,
            {
                "client": str(self.own.pk),
                "geometry": square(9, 45),
                "area": str(area.pk),
            },
        )
        foreign = self.post(
            url, {"client": str(self.foreign.pk), "geometry": square(9, 45)}
        )

        self.assertEqual(new.status_code, 200, new.content)
        self.assertEqual(new.data["warnings"][0]["code"], "area_overlaps")
        self.assertAlmostEqual(float(new.data["surface_m2"]), 8762.31, delta=1)
        self.assertEqual(same.data["warnings"], [])
        self.assertEqual(foreign.status_code, 400, foreign.content)
        self.assertEqual(Area.objects.count(), 1)

    def test_geometry_check_of_an_area_not_available(self):
        second = Client.objects.create(
            name="Consorzio", kind="public_body", managing_organization=self.org
        )
        of_another_client = self.make_area("1", 9, client=second)
        foreign = self.make_area("1", 9, client=self.foreign)
        url = f"{self.url}geometry-check/"
        data = {"client": str(self.own.pk), "geometry": square(9, 45)}

        for area in (uuid.uuid4(), foreign.pk, of_another_client.pk):
            with self.subTest(area=area):
                response = self.post(url, {**data, "area": str(area)})

                self.assertEqual(response.status_code, 400, response.content)
                self.assertEqual(response.data["area"]["code"], "area_not_available")

    def test_geometry_check_with_the_values_of_the_form(self):
        self.make_area("1", 9, management_end=datetime.date(2020, 12, 31))
        url = f"{self.url}geometry-check/"
        data = {"client": str(self.own.pk), "geometry": square(9, 45)}

        today = self.post(url, data)
        in_2020 = self.post(
            url,
            {**data, "management_start": "2020-06-01", "management_end": "2021-06-01"},
        )
        fictitious = self.post(
            url, {**data, "management_start": "2020-06-01", "is_fictitious": True}
        )

        self.assertEqual(today.data["warnings"], [])
        self.assertEqual(in_2020.data["warnings"][0]["code"], "area_overlaps")
        self.assertEqual(fictitious.data["warnings"], [])

    def test_choices_do_not_compute_the_overlaps(self):
        self.make_area("1", 9)

        with CaptureQueriesContext(connection) as queries:
            choices = self.client.get(f"{self.url}choices/", **self.header)
        # Read now: the next request resets the log of the queries.
        sql = " ".join(query["sql"] for query in queries)
        overlapping = self.client.get(
            f"{self.url}choices/", {"has_overlaps": False}, **self.header
        )

        self.assertEqual(len(choices.data), 1)
        self.assertIn('"territory_area"', sql)
        self.assertNotIn("ST_Relate", sql)
        self.assertNotIn('"territory_zone"."geometry"', sql)
        self.assertEqual(len(overlapping.data), 1)

    def test_update_checks_the_revision_and_records_the_geometry(self):
        area = self.make_area("1", 9)
        url = f"{self.url}{area.pk}/"

        updated = self.patch(url, {"geometry": square(9, 45, 0.002), "revision": 1})
        stale = self.patch(url, {"name": "Altro", "revision": 1})

        self.assertEqual(updated.status_code, 200, updated.content)
        self.assertGreater(float(updated.data["surface_m2"]), 30000)
        self.assertEqual(stale.status_code, 409, stale.content)
        record = ChangeRecord.objects.get(record_id=area.pk, operation="update")
        self.assertIn("geometry", record.changes)
        self.assertIn("surface_m2", record.changes)

    def test_delete_records_a_cancellation(self):
        area = self.make_area("1", 9)

        response = self.client.delete(f"{self.url}{area.pk}/", **self.header)

        self.assertEqual(response.status_code, 204, response.content)
        self.assertEqual(
            ChangeRecord.objects.get(record_id=area.pk, operation="cancel").client_id,
            self.own.pk,
        )

    def test_permissions_and_scope(self):
        self.make_area("1", 9, client=self.foreign)

        self.client.force_authenticate(self.reader)
        listed = self.client.get(self.url, **self.header)
        created = self.post(self.url, self.area_data())

        self.assertEqual(listed.data["count"], 0)
        self.assertEqual(created.status_code, 403, created.content)

    def test_filters(self):
        self.make_area("1", 9, management_end=datetime.date(2021, 12, 31))
        self.make_area("2", 9.01)

        managed = self.client.get(self.url, {"managed_on": "2023-06-01"}, **self.header)

        self.assertEqual([a["number"] for a in managed.data["results"]], ["2"])


class GeoJSONTests(TerritoryTestCase):
    url = "/api/territory/areas/geojson/"

    def test_features_in_the_bbox(self):
        self.make_area("1", 9)
        self.make_area("2", 10)
        self.make_area("3", 9, client=self.foreign)

        response = self.client.get(
            self.url, {"bbox": "8.9,44.9,9.1,45.1"}, **self.header
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["type"], "FeatureCollection")
        self.assertFalse(response.data["truncated"])
        [feature] = response.data["features"]
        self.assertEqual(feature["properties"]["number"], "1")
        self.assertEqual(feature["geometry"]["type"], "MultiPolygon")
        self.assertEqual(feature["geometry"]["coordinates"][0][0][0], [9, 45])

    def test_other_reference_system(self):
        self.make_area("1", 9)

        response = self.client.get(self.url, {"srid": 3857}, **self.header)

        x, y = response.data["features"][0]["geometry"]["coordinates"][0][0][0]
        self.assertAlmostEqual(x, 1001875.4, delta=1)
        self.assertAlmostEqual(y, 5621521.5, delta=1)

    @override_settings(GEOJSON_MAX_FEATURES=2)
    def test_limit(self):
        for number in range(3):
            self.make_area(str(number), 9 + number * 0.01)

        response = self.client.get(self.url, **self.header)

        self.assertEqual(len(response.data["features"]), 2)
        self.assertTrue(response.data["truncated"])


class AreaAdminTests(TerritoryTestCase):
    def test_admin_changes_go_through_the_services(self):
        staff = make_user(
            "admin@example.com", self.org, is_staff=True, is_superuser=True
        )
        self.client.force_login(staff)
        area = self.make_area("1", 9)

        response = self.client.post(
            f"/admin/territory/area/{area.pk}/change/",
            {
                "client": self.own.pk,
                "number": "1",
                "sub_number": "",
                "name": "Parco nuovo",
                "geometry": area.geometry.wkt,
                "urban_green_type": self.green_type.pk,
                "area_use": self.area_use.pk,
                "usage_intensity": self.intensity.pk,
                "management_start": "2020-01-01",
                "municipality_code": "015146",
                "street_code": "",
                "notes": "",
                "expected_revision": 1,
            },
        )

        self.assertEqual(response.status_code, 302, response.content)
        area.refresh_from_db()
        self.assertEqual(area.name, "Parco nuovo")
        record = ChangeRecord.objects.get(record_id=area.pk, operation="update")
        self.assertEqual(record.source, "system")
        self.assertEqual(record.organization, self.org)
