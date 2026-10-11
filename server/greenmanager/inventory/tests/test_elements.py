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
        self.assertEqual(foreign.data["species"]["code"], "catalog_entry_not_available")

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

        self.assertEqual(
            present.data["replaces"]["code"], "replaced_element_not_removed"
        )
        self.assertEqual(new.status_code, 201, new.content)
        self.assertEqual(new.data["replaces_data"]["code"], old.code)
        self.assertEqual(
            of_another_client.data["replaces"]["code"], "replaced_element_not_available"
        )
        self.assertEqual(restore_old.data["removed_on"]["code"], "element_replaced")
        self.assertEqual(delete_old.data["code"], "element_has_related_data")
        self.assertEqual(cycle.data["replaces"]["code"], "replacement_cycle")

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
        saved = self.client.post(url, data)

        self.assertEqual(refused.status_code, 200)
        self.assertContains(refused, "The class of the element needs a species.")
        self.assertEqual(saved.status_code, 302, saved.content)
        tree.refresh_from_db()
        self.assertEqual(tree.tag_number, "7")
        record = ChangeRecord.objects.get(record_id=tree.pk, operation="update")
        self.assertEqual(record.source, "system")
