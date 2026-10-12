import datetime

from catalogs.models import (
    AreaUse,
    ElementClass,
    RemovalCause,
    Species,
    UrbanGreenType,
    UsageIntensity,
)
from core import geo
from core.enums import GeometryType
from core.models import ChangeRecord
from core.services import ChangeContext
from core.testing import make_tenant, make_user, tenant_header
from django.utils import timezone
from inventory import services
from inventory.models import Element
from parties.models import Client, ClientSequence
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase
from territory import services as territory_services

READ = "inventory.READ_ELEMENTS"
WRITE = "inventory.WRITE_ELEMENTS"
URL = "/api/inventory/elements/"


def square(x0, y0, size=0.001):
    ring = [[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size]]
    return {"type": "Polygon", "coordinates": [[*ring, [x0, y0]]]}


def point(x, y):
    return {"type": "Point", "coordinates": [x, y]}


def line(*coordinates):
    return {"type": "LineString", "coordinates": [list(c) for c in coordinates]}


def parse(geojson):
    return geo.parse_geojson(geojson)


class InventoryTestCase(APITestCase):
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
        self.area = self.make_area(self.own, "1", 9)
        self.foreign_area = self.make_area(self.foreign, "1", 9)
        self.classes = {entry.code: entry for entry in ElementClass.objects.system()}
        self.tilia = self.make_species("Tilia cordata")
        self.acer = self.make_species("Acer campestre")
        self.ligustrum = self.make_species("Ligustrum vulgare")
        self.cause = RemovalCause.objects.system().get(code="disease")
        self.client.force_authenticate(self.manager)

    def make_area(self, client, number, x0, **changes):
        return territory_services.create_area(
            {
                "client": client,
                "number": number,
                "name": f"Area {number}",
                "geometry": geo.normalize(parse(square(x0, 45)), GeometryType.POLYGON),
                "urban_green_type": UrbanGreenType.objects.get(code="urban_park"),
                "area_use": AreaUse.objects.system().first(),
                "usage_intensity": UsageIntensity.objects.get(code="medium"),
                "management_start": datetime.date(2020, 1, 1),
                "municipality_code": "015146",
                **changes,
            },
            ChangeContext(actor=None, organization=client.managing_organization),
        )

    def make_species(self, name):
        return Species.objects.create(
            code=name.lower().replace(" ", "-"),
            name=name,
            scientific_name=name,
            genus=name.split()[0],
        )

    def make_tree(self, area=None, **changes):
        area = area or self.area
        return services.create_element(
            {
                "area": area,
                "element_class": self.classes["tree"],
                "geometry": parse(point(9.0005, 45.0005)),
                "species": self.tilia,
                **changes,
            },
            (
                self.context
                if area.client.managing_organization == self.org
                else ChangeContext(
                    actor=None, organization=area.client.managing_organization
                )
            ),
        )

    def tree_data(self, **changes):
        return {
            "area": str(self.area.pk),
            "element_class": str(self.classes["tree"].pk),
            "geometry": point(9.0005, 45.0005),
            "species": str(self.tilia.pk),
            **changes,
        }

    def post(self, url, data):
        return self.client.post(url, data, format="json", **self.header)

    def patch(self, url, data):
        return self.client.patch(url, data, format="json", **self.header)


class ElementTests(InventoryTestCase):
    def test_create_gives_the_client_the_code_and_the_history(self):
        first = self.post(URL, self.tree_data(client=str(self.foreign.pk)))
        second = self.post(URL, self.tree_data(tag_number=" 12 "))

        self.assertEqual(first.status_code, 201, first.content)
        self.assertEqual(first.data["client"], self.own.pk)
        self.assertEqual((first.data["code"], second.data["code"]), ("1", "2"))
        self.assertEqual(second.data["tag_number"], "12")
        self.assertEqual(first.data["geometry"]["type"], "Point")
        self.assertIsNone(first.data["length_m"])
        self.assertEqual(first.data["surveyed_on"], str(timezone.localdate()))
        self.assertEqual(first.data["species_data"]["scientific_name"], "Tilia cordata")
        record = ChangeRecord.objects.get(record_id=first.data["id"])
        self.assertEqual(record.operation, "create")
        self.assertEqual(record.client_id, self.own.pk)
        self.assertEqual(record.changes["geometry"]["new"]["type"], "Point")
        self.assertEqual(record.changes["composition"]["new"], [])

    def test_codes_are_never_reused(self):
        self.make_tree()
        second = self.make_tree()
        services.delete_element(second, self.context)
        foreign = self.make_tree(area=self.foreign_area)

        third = self.make_tree()

        self.assertEqual(third.code, "3")
        self.assertEqual(foreign.code, "1")

    def test_geometry_of_the_type_of_the_class(self):
        hedge = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["hedge"].pk),
                geometry=line((9, 45), (9.001, 45)),
            ),
        )
        lawn = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["lawn"].pk),
                geometry=square(9, 45),
                species=None,
            ),
        )
        polygon_tree = self.post(URL, self.tree_data(geometry=square(9, 45)))
        invalid = self.post(URL, self.tree_data(geometry={"type": "Feature"}))

        self.assertEqual(hedge.status_code, 201, hedge.content)
        self.assertEqual(hedge.data["geometry"]["type"], "MultiLineString")
        self.assertAlmostEqual(float(hedge.data["length_m"]), 78.85, delta=0.1)
        self.assertIsNone(hedge.data["surface_m2"])
        self.assertEqual(lawn.status_code, 201, lawn.content)
        self.assertAlmostEqual(float(lawn.data["surface_m2"]), 8762.31, delta=1)
        self.assertEqual(
            polygon_tree.data["geometry"]["code"], "geometry_type_not_allowed"
        )
        self.assertEqual(invalid.data["geometry"]["code"], "geometry_invalid_geojson")

    def test_species_as_the_class_asks(self):
        hedge = str(self.classes["hedge"].pk)
        hedge_line = line((9, 45), (9.001, 45))
        composition = [{"species": str(self.ligustrum.pk), "quantity": 40}]

        without_species = self.post(URL, self.tree_data(species=None))
        lawn_with_species = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["lawn"].pk), geometry=square(9, 45)
            ),
        )
        tree_with_composition = self.post(URL, self.tree_data(composition=composition))
        both = self.post(
            URL,
            self.tree_data(
                element_class=hedge, geometry=hedge_line, composition=composition
            ),
        )
        mixed_hedge = self.post(
            URL,
            self.tree_data(
                element_class=hedge,
                geometry=hedge_line,
                species=None,
                composition=composition,
            ),
        )

        self.assertEqual(without_species.data["species"]["code"], "species_required")
        self.assertEqual(
            lawn_with_species.data["species"]["code"], "species_not_allowed"
        )
        self.assertEqual(
            tree_with_composition.data["composition"]["code"],
            "composition_not_allowed",
        )
        self.assertEqual(both.data["species"]["code"], "species_and_composition")
        self.assertEqual(mixed_hedge.status_code, 201, mixed_hedge.content)
        [item] = mixed_hedge.data["composition"]
        self.assertEqual(item["quantity"], 40)
        self.assertEqual(item["species_data"]["scientific_name"], "Ligustrum vulgare")

    def test_composition(self):
        data = self.tree_data(
            element_class=str(self.classes["flowerbed"].pk),
            geometry=square(9, 45),
            species=None,
        )

        def composition(*items):
            return [
                {"species": str(species.pk), "percentage": percentage}
                for species, percentage in items
            ]

        duplicated = self.post(
            URL, {**data, "composition": composition((self.acer, 10), (self.acer, 20))}
        )
        empty_item = self.post(
            URL, {**data, "composition": [{"species": str(self.acer.pk)}]}
        )
        over = self.post(
            URL, {**data, "composition": composition((self.acer, 60), (self.tilia, 50))}
        )
        created = self.post(
            URL, {**data, "composition": composition((self.acer, 60), (self.tilia, 40))}
        )
        url = f"{URL}{created.data['id']}/"
        renamed = self.patch(url, {"notes": "Aiuola fiorita"})
        changed = self.patch(
            url, {"composition": composition((self.acer, 30), (self.ligustrum, 70))}
        )

        self.assertEqual(
            duplicated.data["composition"]["code"], "composition_species_duplicated"
        )
        self.assertEqual(
            empty_item.data["composition"]["code"], "composition_quantity_required"
        )
        self.assertEqual(
            over.data["composition"]["code"], "composition_percentage_over_100"
        )
        self.assertEqual(created.status_code, 201, created.content)
        self.assertEqual(len(renamed.data["composition"]), 2)
        self.assertEqual(changed.status_code, 200, changed.content)
        self.assertEqual(
            {
                (item["species_data"]["scientific_name"], item["percentage"])
                for item in changed.data["composition"]
            },
            {("Acer campestre", "30.00"), ("Ligustrum vulgare", "70.00")},
        )
        record = ChangeRecord.objects.get(
            record_id=created.data["id"],
            operation="update",
            changes__has_key="composition",
        )
        self.assertEqual(len(record.changes["composition"]["new"]), 2)

    def test_attributes_of_the_class(self):
        data = self.tree_data(
            element_class=str(self.classes["lawn"].pk),
            geometry=square(9, 45),
            species=None,
        )

        invalid = self.post(URL, {**data, "attributes": {"lawn_type": "di plastica"}})
        created = self.post(
            URL, {**data, "attributes": {"lawn_type": "rustico", "irrigated": True}}
        )
        hedge = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["hedge"].pk),
                geometry=line((9, 45), (9.001, 45)),
                attributes={"height": 1.5},
            ),
        )

        self.assertEqual(
            invalid.data["attributes"]["lawn_type"]["code"], "attribute_invalid_choice"
        )
        self.assertEqual(created.status_code, 201, created.content)
        self.assertEqual(
            created.data["attributes"], {"lawn_type": "rustico", "irrigated": True}
        )
        self.assertEqual(
            hedge.data["attributes"]["height"]["code"], "attribute_is_measure"
        )

    def test_area_and_client(self):
        second_client = Client.objects.create(
            name="Condominio", kind="condominium", managing_organization=self.org
        )
        other_area = self.make_area(second_client, "1", 9)
        same_client_area = self.make_area(self.own, "2", 9.01)
        tree = self.make_tree()
        url = f"{URL}{tree.pk}/"

        foreign = self.post(URL, self.tree_data(area=str(self.foreign_area.pk)))
        moved = self.patch(url, {"area": str(same_client_area.pk)})
        other_client = self.patch(url, {"area": str(other_area.pk)})

        self.assertEqual(foreign.data["area"]["code"], "area_not_available")
        self.assertEqual(moved.status_code, 200, moved.content)
        self.assertEqual(moved.data["area_data"]["code"], "2")
        self.assertEqual(other_client.data["area"]["code"], "area_of_another_client")

    def test_catalog_entries_must_be_available_the_stored_ones_stay(self):
        tree = self.make_tree()
        self.tilia.hidden_by.add(self.org)
        own_species = Species.objects.create(
            organization=self.other,
            code="acer-x",
            name="Acer x",
            scientific_name="Acer x",
            genus="Acer",
        )

        kept = self.patch(f"{URL}{tree.pk}/", {"notes": "Potato nel 2024"})
        hidden = self.post(URL, self.tree_data())
        foreign = self.post(URL, self.tree_data(species=str(own_species.pk)))

        self.assertEqual(kept.status_code, 200, kept.content)
        self.assertEqual(hidden.data["species"]["code"], "catalog_entry_not_available")
        self.assertEqual(hidden.data["species"]["params"], {"name": "Tilia cordata"})
        self.assertEqual(foreign.data["species"]["code"], "catalog_entry_not_available")
        self.assertNotIn("params", foreign.data["species"])

    def test_tag_number_is_unique_among_the_present_elements(self):
        removed = self.make_tree(tag_number="12")
        services.remove_element(
            removed,
            {"removed_on": datetime.date(2024, 5, 1), "removal_cause": self.cause},
            self.context,
        )

        present = self.post(URL, self.tree_data(tag_number="12"))
        repeated = self.post(URL, self.tree_data(tag_number="12"))
        restored = self.post(f"{URL}{removed.pk}/restore/", {})

        self.assertEqual(present.status_code, 201, present.content)
        self.assertEqual(
            repeated.data["tag_number"][0]["code"], "element_tag_number_not_unique"
        )
        self.assertEqual(
            restored.data["tag_number"][0]["code"], "element_tag_number_not_unique"
        )

    def test_update_checks_the_revision(self):
        tree = self.make_tree()
        url = f"{URL}{tree.pk}/"

        updated = self.patch(url, {"geometry": point(9.0006, 45.0006), "revision": 1})
        stale = self.patch(url, {"notes": "Altro", "revision": 1})

        self.assertEqual(updated.status_code, 200, updated.content)
        self.assertEqual(updated.data["revision"], 2)
        self.assertEqual(stale.status_code, 409, stale.content)

    def test_permissions_and_scope(self):
        self.make_tree(area=self.foreign_area)
        self.make_tree()

        listed = self.client.get(URL, **self.header)
        self.client.force_authenticate(self.reader)
        created = self.post(URL, self.tree_data())

        self.assertEqual(listed.data["count"], 1)
        self.assertNotIn("geometry", listed.data["results"][0])
        self.assertEqual(listed.data["results"][0]["area_data"]["code"], "1")
        self.assertEqual(created.status_code, 403, created.content)


class ClassInUseTests(InventoryTestCase):
    def test_class_with_elements_locks_its_geometry_and_species_mode(self):
        self.make_tree()
        tree, hedge = self.classes["tree"], self.classes["hedge"]
        staff = make_user(
            "staff@example.com", self.org, ["catalogs.WRITE_CATALOGS"], is_staff=True
        )
        self.client.force_authenticate(staff)
        url = "/api/catalogs/element-classes/"

        listed = self.client.get(url, {"geometry_type": "point"}, **self.header)
        detail = self.client.get(f"{url}{hedge.pk}/", **self.header)
        changed = self.patch(f"{url}{tree.pk}/", {"geometry_type": "polygon"})

        locked = {row["code"]: row["locked_fields"] for row in listed.data["results"]}
        self.assertEqual(locked["tree"], ["geometry_type", "species_mode"])
        self.assertEqual(detail.data["locked_fields"], [])
        self.assertEqual(changed.status_code, 400, changed.content)
        self.assertEqual(
            changed.data["geometry_type"]["code"], "catalog_entry_in_use_locked"
        )


class LifeCycleTests(InventoryTestCase):
    def remove(self, element, **data):
        return self.post(f"{URL}{element.pk}/remove/", data)

    def test_remove_and_restore(self):
        tree = self.make_tree(planted_on=datetime.date(2010, 3, 1))
        bench = services.create_element(
            {
                "area": self.area,
                "element_class": self.classes["bench"],
                "geometry": parse(point(9.0002, 45.0002)),
            },
            self.context,
        )

        without_cause = self.remove(tree, removed_on="2024-05-01")
        before_planting = self.remove(
            tree, removed_on="2009-01-01", removal_cause=str(self.cause.pk)
        )
        tomorrow = timezone.localdate() + datetime.timedelta(days=1)
        in_the_future = self.remove(
            tree, removed_on=str(tomorrow), removal_cause=str(self.cause.pk)
        )
        removed = self.remove(
            tree,
            removed_on="2024-05-01",
            removal_cause=str(self.cause.pk),
            reason="Abbattuto per carie al colletto",
        )
        bench_removed = self.remove(bench, removed_on="2024-05-01")
        restored = self.post(
            f"{URL}{tree.pk}/restore/", {"reason": "Rimosso per errore"}
        )
        not_removed = self.post(f"{URL}{tree.pk}/restore/", {})

        self.assertEqual(
            without_cause.data["removal_cause"]["code"], "removal_cause_required"
        )
        self.assertEqual(
            before_planting.data["removed_on"][0]["code"],
            "element_removed_before_planted",
        )
        self.assertEqual(
            in_the_future.data["removed_on"]["code"], "removal_date_in_future"
        )
        self.assertEqual(removed.status_code, 200, removed.content)
        self.assertEqual(removed.data["removed_on"], "2024-05-01")
        self.assertEqual(removed.data["removal_cause_data"]["code"], "disease")
        self.assertEqual(bench_removed.status_code, 200, bench_removed.content)
        self.assertEqual(restored.status_code, 200, restored.content)
        self.assertIsNone(restored.data["removed_on"])
        self.assertIsNone(restored.data["removal_cause"])
        self.assertEqual(not_removed.data["code"], "element_not_removed")
        reasons = ChangeRecord.objects.filter(
            record_id=tree.pk, operation="update"
        ).values_list("reason", flat=True)
        self.assertEqual(
            sorted(reasons), ["Abbattuto per carie al colletto", "Rimosso per errore"]
        )

    def test_removal_fields_change_only_with_the_actions(self):
        tree = self.make_tree()

        response = self.patch(f"{URL}{tree.pk}/", {"removed_on": "2024-05-01"})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertIsNone(response.data["removed_on"])

    def test_replacement(self):
        old = self.make_tree()
        present = self.post(URL, self.tree_data(replaces=str(old.pk)))
        services.remove_element(
            old,
            {"removed_on": datetime.date(2024, 5, 1), "removal_cause": self.cause},
            self.context,
        )
        foreign = self.make_tree(area=self.foreign_area)

        new = self.post(URL, self.tree_data(replaces=str(old.pk)))
        of_another_client = self.post(URL, self.tree_data(replaces=str(foreign.pk)))
        restore_old = self.post(f"{URL}{old.pk}/restore/", {})
        delete_old = self.client.delete(f"{URL}{old.pk}/", **self.header)
        new_element = Element.objects.get(pk=new.data["id"])
        services.remove_element(
            new_element,
            {"removed_on": datetime.date(2024, 6, 1), "removal_cause": self.cause},
            self.context,
        )
        cycle = self.patch(f"{URL}{old.pk}/", {"replaces": str(new_element.pk)})
        # The new element is removed too: the old one comes back, still
        # referred to by its replacement.
        restored_old = self.post(f"{URL}{old.pk}/restore/", {})
        delete_restored = self.client.delete(f"{URL}{old.pk}/", **self.header)

        self.assertEqual(
            present.data["replaces"]["code"], "replaced_element_not_removed"
        )
        self.assertEqual(new.status_code, 201, new.content)
        self.assertEqual(new.data["replaces_data"]["code"], old.code)
        self.assertEqual(
            of_another_client.data["replaces"]["code"], "replaced_element_not_available"
        )
        self.assertEqual(restore_old.data["removed_on"]["code"], "element_replaced")
        self.assertEqual(delete_old.data["code"], "element_already_removed")
        self.assertEqual(cycle.data["replaces"]["code"], "replacement_cycle")
        self.assertEqual(restored_old.status_code, 200, restored_old.content)
        self.assertEqual(delete_restored.data["code"], "element_has_related_data")

    def test_a_removed_element_is_not_deleted(self):
        tree = self.make_tree()
        services.remove_element(
            tree,
            {"removed_on": datetime.date(2024, 5, 1), "removal_cause": self.cause},
            self.context,
        )

        response = self.client.delete(f"{URL}{tree.pk}/", **self.header)

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["code"], "element_already_removed")
        self.assertEqual(response.data["params"]["code"], tree.code)
        self.assertTrue(Element.objects.filter(pk=tree.pk).exists())
        self.assertFalse(
            ChangeRecord.objects.filter(record_id=tree.pk, operation="cancel").exists()
        )

    def test_delete_records_a_cancellation_and_protects_the_area(self):
        hedge = services.create_element(
            {
                "area": self.area,
                "element_class": self.classes["hedge"],
                "geometry": parse(line((9, 45), (9.001, 45))),
                "composition": [{"species": self.ligustrum, "quantity": 30}],
            },
            self.context,
        )

        with self.assertRaises(ValidationError) as area:
            territory_services.delete_area(self.area, self.context)
        deleted = self.client.delete(f"{URL}{hedge.pk}/", **self.header)

        self.assertEqual(area.exception.detail["code"], "area_has_related_data")
        self.assertEqual(deleted.status_code, 204, deleted.content)
        record = ChangeRecord.objects.get(record_id=hedge.pk, operation="cancel")
        self.assertEqual(record.client_id, self.own.pk)
        self.assertEqual(record.changes["composition"]["old"][0]["quantity"], 30)


class SpatialCheckTests(InventoryTestCase):
    """Proposed area, warnings and position at the center of the area (AR-5,
    EL-10). A meter is about 0.000009° of latitude."""

    def setUp(self):
        super().setUp()
        # Touches the first area, on its east side.
        self.east = self.make_area(self.own, "2", 9.001)

    def check(self, **data):
        return self.post(
            f"{URL}geometry-check/",
            {"element_class": str(self.classes["tree"].pk), **data},
        )

    def warning_codes(self, response):
        return [warning["code"] for warning in response.data["warnings"]]

    def test_proposed_area(self):
        small = geo.normalize(
            parse(square(9.0004, 45.0004, 0.0002)), GeometryType.POLYGON
        )
        self.make_area(self.own, "3", 9, geometry=small)
        self.make_area(self.own, "4", 9, management_end=datetime.date(2021, 1, 1))

        in_both = self.check(geometry=point(9.0005, 45.0005))
        in_first = self.check(geometry=point(9.0002, 45.0008))
        nowhere = self.check(geometry=point(9.1, 45.1))
        line_mostly_east = self.check(
            element_class=str(self.classes["hedge"].pk),
            geometry=line((9.0004, 45.0009), (9.0018, 45.0009)),
        )
        polygon_mostly_east = self.check(
            element_class=str(self.classes["lawn"].pk),
            geometry=square(9.0008, 45.0001, 0.0005),
        )
        of_the_client = self.check(
            geometry=point(9.0002, 45.0008), client=str(self.own.pk)
        )
        foreign_client = self.check(
            geometry=point(9.0002, 45.0008), client=str(self.foreign.pk)
        )

        # The smallest of the areas that contain the point; the fourth area is
        # no longer managed, the one of the other organization is not editable.
        self.assertEqual(in_both.status_code, 200, in_both.content)
        self.assertEqual(in_both.data["suggested_area"]["code"], "3")
        self.assertEqual(in_first.data["suggested_area"]["code"], "1")
        self.assertIsNone(nowhere.data["suggested_area"])
        self.assertEqual(nowhere.data["warnings"], [])
        self.assertEqual(line_mostly_east.data["suggested_area"]["code"], "2")
        self.assertAlmostEqual(
            float(line_mostly_east.data["length_m"]), 110.4, delta=0.5
        )
        self.assertEqual(self.warning_codes(line_mostly_east), ["element_outside_area"])
        self.assertEqual(polygon_mostly_east.data["suggested_area"]["code"], "2")
        self.assertIsNotNone(polygon_mostly_east.data["surface_m2"])
        self.assertEqual(of_the_client.data["suggested_area"]["code"], "1")
        self.assertEqual(foreign_client.data["client"]["code"], "client_not_available")

    def test_element_outside_its_area(self):
        inside = self.post(URL, self.tree_data())
        on_the_border = self.post(URL, self.tree_data(geometry=point(9.001, 45.0002)))
        outside = self.post(URL, self.tree_data(geometry=point(9.0015, 45.0008)))
        url = f"{URL}{outside.data['id']}/"

        detail = self.client.get(url, **self.header)
        listed = self.client.get(URL, **self.header)
        flagged = self.client.get(URL, {"outside_area": True}, **self.header)
        not_flagged = self.client.get(URL, {"outside_area": False}, **self.header)
        moved = self.patch(url, {"area": str(self.east.pk)})

        self.assertEqual(inside.data["warnings"], [])
        self.assertEqual(on_the_border.data["warnings"], [])
        [warning] = outside.data["warnings"]
        self.assertEqual(warning["code"], "element_outside_area")
        self.assertEqual(warning["params"]["area"], "1 Area 1")
        self.assertEqual(detail.data["warnings"], [warning])
        self.assertTrue(detail.data["outside_area"])
        self.assertEqual(
            {
                element["code"]: element["outside_area"]
                for element in listed.data["results"]
            },
            {"1": False, "2": False, "3": True},
        )
        self.assertEqual([e["code"] for e in flagged.data["results"]], ["3"])
        self.assertEqual([e["code"] for e in not_flagged.data["results"]], ["1", "2"])
        self.assertEqual(moved.data["warnings"], [])
        self.assertFalse(moved.data["outside_area"])

    def test_trees_very_close(self):
        existing = self.make_tree()
        removed = self.make_tree(geometry=parse(point(9.0007, 45.0005)))
        services.remove_element(
            removed,
            {"removed_on": datetime.date(2024, 5, 1), "removal_cause": self.cause},
            self.context,
        )
        self.make_tree(
            area=self.foreign_area, geometry=parse(point(9.0005, 45.0005135))
        )

        # 1.5 m north and 2.5 m south of the existing tree.
        near = self.post(URL, self.tree_data(geometry=point(9.0005, 45.0005135)))
        far = self.post(URL, self.tree_data(geometry=point(9.0005, 45.0004775)))
        near_the_removed = self.post(
            URL, self.tree_data(geometry=point(9.0007, 45.0005))
        )
        bench = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["bench"].pk),
                species=None,
                geometry=point(9.0005, 45.0005),
            ),
        )
        near_url = f"{URL}{near.data['id']}/"
        detail = self.client.get(near_url, **self.header)
        renamed = self.patch(near_url, {"notes": "Due alberi vicini"})
        # 1 m south of the existing tree, 2.5 m from the near one.
        moved = self.patch(
            f"{URL}{far.data['id']}/", {"geometry": point(9.0005, 45.000491)}
        )

        [warning] = near.data["warnings"]
        self.assertEqual(warning["code"], "element_near_tree")
        self.assertEqual(
            warning["params"], {"elements": existing.code, "distance": "2"}
        )
        self.assertEqual(far.data["warnings"], [])
        self.assertEqual(near_the_removed.data["warnings"], [])
        self.assertEqual(bench.data["warnings"], [])
        # The surveyor saved the tree: the detail and other changes do not
        # warn again.
        self.assertEqual(detail.data["warnings"], [])
        self.assertEqual(renamed.data["warnings"], [])
        self.assertEqual(moved.data["warnings"][0]["params"]["elements"], existing.code)

    def test_trees_very_close_when_the_class_or_the_status_change(self):
        provisional = self.make_tree(location_source="area_center", geometry=None)
        # 1 m north of the point on the surface of the area.
        x, y = provisional.geometry.coords
        existing = self.make_tree(geometry=parse(point(x, y + 0.000009)))
        # 0.9 m north of the existing tree, 1.9 m from the provisional one.
        bench = services.create_element(
            {
                "area": self.area,
                "element_class": self.classes["bench"],
                "geometry": parse(point(x, y + 0.000017)),
            },
            self.context,
        )

        became_tree = self.patch(
            f"{URL}{bench.pk}/",
            {
                "element_class": str(self.classes["tree"].pk),
                "species": str(self.tilia.pk),
            },
        )
        verified = self.patch(
            f"{URL}{provisional.pk}/",
            {"location_source": "map", "location_status": "verified"},
        )

        self.assertEqual(became_tree.status_code, 200, became_tree.content)
        # The provisional tree is not a surveyed position.
        self.assertEqual(
            became_tree.data["warnings"][0]["params"]["elements"], existing.code
        )
        self.assertEqual(verified.status_code, 200, verified.content)
        self.assertEqual(verified.data["warnings"][0]["code"], "element_near_tree")
        self.assertEqual(
            verified.data["warnings"][0]["params"]["elements"],
            f"{existing.code}, {bench.code}",
        )

    def test_geometry_check(self):
        tree = self.make_tree()
        # Saved outside every area.
        self.make_tree(geometry=parse(point(9.1, 45.1)))
        foreign_tree = self.make_tree(area=self.foreign_area)
        count = Element.objects.count()

        hedge = self.check(
            element_class=str(self.classes["hedge"].pk),
            geometry=line((9.0002, 45.0002), (9.0008, 45.0002)),
        )
        chosen_area = self.check(
            geometry=point(9.0005, 45.0005135), area=str(self.east.pk)
        )
        same_tree = self.check(geometry=point(9.0005, 45.0005135), element=str(tree.pk))
        wrong_type = self.check(geometry=square(9, 45))
        foreign_area = self.check(
            geometry=point(9.0005, 45.0005), area=str(self.foreign_area.pk)
        )
        foreign_element = self.check(
            geometry=point(9.0005, 45.0005), element=str(foreign_tree.pk)
        )
        # 1 m from the tree outside every area: its client is known only when
        # the check names it.
        without_client = self.check(geometry=point(9.1, 45.100009))
        with_client = self.check(
            geometry=point(9.1, 45.100009), client=str(self.own.pk)
        )
        self.client.force_authenticate(self.reader)
        reader = self.check(geometry=point(9.0005, 45.0005))

        self.assertEqual(hedge.status_code, 200, hedge.content)
        self.assertAlmostEqual(float(hedge.data["length_m"]), 47.3, delta=0.5)
        self.assertIsNone(hedge.data["surface_m2"])
        self.assertEqual(hedge.data["suggested_area"]["code"], "1")
        self.assertEqual(hedge.data["warnings"], [])
        self.assertEqual(chosen_area.data["suggested_area"]["code"], "1")
        self.assertEqual(
            self.warning_codes(chosen_area),
            ["element_outside_area", "element_near_tree"],
        )
        self.assertEqual(chosen_area.data["warnings"][0]["params"]["area"], "2 Area 2")
        self.assertEqual(same_tree.data["warnings"], [])
        self.assertEqual(
            wrong_type.data["geometry"]["code"], "geometry_type_not_allowed"
        )
        self.assertEqual(foreign_area.data["area"]["code"], "area_not_available")
        self.assertEqual(
            foreign_element.data["element"]["code"], "element_not_available"
        )
        self.assertIsNone(without_client.data["suggested_area"])
        self.assertEqual(without_client.data["warnings"], [])
        self.assertEqual(self.warning_codes(with_client), ["element_near_tree"])
        self.assertEqual(reader.status_code, 403, reader.content)
        self.assertEqual(Element.objects.count(), count)

    def test_position_at_the_center_of_the_area(self):
        data = self.tree_data(location_source="area_center", surveyed_on="2024-01-01")
        del data["geometry"]
        without_geometry = {**data, "location_source": "map"}

        created = self.post(URL, data)
        second = self.post(URL, data)
        missing = self.post(URL, without_geometry)
        hedge = self.post(
            URL,
            self.tree_data(
                element_class=str(self.classes["hedge"].pk),
                geometry=line((9, 45), (9.001, 45)),
                location_source="area_center",
            ),
        )
        url = f"{URL}{created.data['id']}/"
        # The point follows the area: the geometry sent does not count.
        moved = self.patch(
            url, {"area": str(self.east.pk), "geometry": point(9.0002, 45.0002)}
        )
        verified = self.patch(
            url,
            {
                "location_source": "gps",
                "location_status": "verified",
                "geometry": point(9.0015, 45.0005),
            },
        )
        verified_with_date = self.patch(
            f"{URL}{second.data['id']}/",
            {
                "location_source": "map",
                "location_status": "verified",
                "geometry": point(9.0002, 45.0002),
                "surveyed_on": "2025-03-01",
            },
        )

        self.assertEqual(created.status_code, 201, created.content)
        self.assertEqual(created.data["location_status"], "provisional")
        self.assertTrue(self.area.geometry.covers(parse(created.data["geometry"])))
        self.assertEqual(created.data["warnings"], [])
        # Same point, but provisional positions are not near trees.
        self.assertEqual(second.data["geometry"], created.data["geometry"])
        self.assertEqual(second.data["warnings"], [])
        self.assertEqual(missing.data["geometry"]["code"], "geometry_required")
        self.assertEqual(
            hedge.data["location_source"]["code"], "area_center_point_only"
        )
        self.assertEqual(moved.status_code, 200, moved.content)
        self.assertTrue(self.east.geometry.covers(parse(moved.data["geometry"])))
        self.assertEqual(moved.data["location_status"], "provisional")
        self.assertEqual(verified.status_code, 200, verified.content)
        self.assertEqual(verified.data["location_status"], "verified")
        self.assertEqual(verified.data["geometry"]["coordinates"], [9.0015, 45.0005])
        # The verification is a survey: today, unless the change gives a date.
        self.assertEqual(verified.data["surveyed_on"], str(timezone.localdate()))
        self.assertEqual(verified_with_date.data["surveyed_on"], "2025-03-01")


class FilterTests(InventoryTestCase):
    def test_filters(self):
        zone = territory_services.create_zone(
            {"client": self.own, "name": "Nord"}, self.context
        )
        zoned_area = self.make_area(self.own, "2", 9.01, zone=zone)
        planted = self.make_tree(planted_on=datetime.date(2022, 4, 1))
        estimated = self.make_tree(
            planted_on=datetime.date(2022, 4, 1), planted_on_estimated=True
        )
        removed = self.make_tree(area=zoned_area)
        services.remove_element(
            removed,
            {"removed_on": datetime.date(2023, 1, 1), "removal_cause": self.cause},
            self.context,
        )

        def codes(**params):
            response = self.client.get(URL, params, **self.header)
            return sorted(element["code"] for element in response.data["results"])

        self.assertEqual(codes(removed=True), [removed.code])
        self.assertEqual(codes(removed=False), [planted.code, estimated.code])
        self.assertEqual(codes(present_on="2021-06-01"), [estimated.code, removed.code])
        self.assertEqual(codes(zone=str(zone.pk)), [removed.code])
        self.assertEqual(codes(category="furniture"), [])
        self.assertEqual(codes(search=planted.code), [planted.code])

    def test_codes_in_their_natural_order(self):
        self.make_tree()
        self.make_tree()
        ClientSequence.objects.filter(client=self.own).update(last_value=9)
        self.make_tree()

        def codes(**params):
            response = self.client.get(URL, params, **self.header)
            return [element["code"] for element in response.data["results"]]

        self.assertEqual(codes(), ["1", "2", "10"])
        self.assertEqual(codes(ordering="-code"), ["10", "2", "1"])

    def test_geojson(self):
        self.make_tree()
        self.make_tree(area=self.foreign_area)

        response = self.client.get(
            f"{URL}geojson/", {"bbox": "8.9,44.9,9.1,45.1"}, **self.header
        )

        [feature] = response.data["features"]
        self.assertEqual(feature["geometry"]["type"], "Point")
        self.assertEqual(feature["properties"]["code"], "1")
        self.assertEqual(
            feature["properties"]["element_class"], self.classes["tree"].pk
        )


class ElementAdminTests(InventoryTestCase):
    def test_admin_changes_go_through_the_services(self):
        staff = make_user(
            "admin@example.com", self.org, is_staff=True, is_superuser=True
        )
        self.client.force_login(staff)
        tree = self.make_tree()
        url = f"/admin/inventory/element/{tree.pk}/change/"
        data = {
            "area": self.area.pk,
            "element_class": self.classes["tree"].pk,
            "geometry": tree.geometry.wkt,
            "location_status": "verified",
            "location_source": "",
            "species": self.tilia.pk,
            "attributes": "{}",
            "tag_number": "7",
            "notes": "",
            "expected_revision": 1,
            "composition-TOTAL_FORMS": 0,
            "composition-INITIAL_FORMS": 0,
        }

        refused = self.client.post(url, {**data, "species": ""})
        # Date and cause of the removal change only with the actions of the API.
        saved = self.client.post(
            url,
            {**data, "removed_on": "2024-05-01", "removal_cause": self.cause.pk},
        )

        self.assertEqual(refused.status_code, 200)
        self.assertContains(refused, "The class of the element needs a species.")
        self.assertEqual(saved.status_code, 302, saved.content)
        tree.refresh_from_db()
        self.assertEqual(tree.tag_number, "7")
        self.assertIsNone(tree.removed_on)
        self.assertIsNone(tree.removal_cause)
        record = ChangeRecord.objects.get(record_id=tree.pk, operation="update")
        self.assertEqual(record.source, "system")
