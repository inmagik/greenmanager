from catalogs.models import (
    AreaUse,
    AttributeDefinition,
    ElementClass,
    ElementClassAttribute,
    Species,
    UrbanGreenType,
    UsageIntensity,
)
from core.models import system_entry_id
from core.testing import make_tenant, make_user, tenant_header
from django.test import TestCase
from rest_framework.test import APITestCase

WRITE = "catalogs.WRITE_CATALOGS"


class SeedTests(TestCase):
    def test_system_entries_are_loaded_by_the_migrations(self):
        self.assertEqual(UrbanGreenType.objects.count(), 14)
        self.assertEqual(
            list(UsageIntensity.objects.system().values_list("code", flat=True)),
            ["low", "medium", "high"],
        )
        self.assertEqual(ElementClass.objects.system().count(), 20)
        tree = ElementClass.objects.get(code="tree", organization=None)
        self.assertEqual(tree.pk, system_entry_id("catalogs.elementclass", "tree"))
        self.assertTrue(tree.counts_as_tree)
        self.assertEqual(tree.geometry_type, "point")
        lawn = ElementClass.objects.get(code="lawn", organization=None)
        self.assertEqual(
            list(lawn.class_attributes.values_list("attribute__code", flat=True)),
            ["lawn_type", "irrigated"],
        )


class AvailabilityTests(TestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.other = make_tenant("Other")
        self.system = AreaUse.objects.create(code="sys", name="Sistema")
        self.hidden = AreaUse.objects.create(code="hidden", name="Nascosta")
        self.hidden.hidden_by.add(self.org)
        self.retired = AreaUse.objects.create(code="old", name="Ritirata", retired=True)
        self.own = AreaUse.objects.create(
            code="own", name="Propria", organization=self.org
        )
        self.foreign = AreaUse.objects.create(
            code="own", name="Altrui", organization=self.other
        )

    def codes(self, queryset):
        return set(queryset.filter(code__in=["sys", "hidden", "old", "own"]))

    def test_available_entries(self):
        self.assertEqual(
            self.codes(AreaUse.objects.available_for(self.org)),
            {self.system, self.own},
        )
        self.assertEqual(
            self.codes(AreaUse.objects.available_for(self.other)),
            {self.system, self.hidden, self.foreign},
        )

    def test_visible_entries_include_retired_and_hidden(self):
        self.assertEqual(
            self.codes(AreaUse.objects.visible_to(self.org)),
            {self.system, self.hidden, self.retired, self.own},
        )

    def test_flags(self):
        flags = {
            entry.code: (entry.is_hidden, entry.is_available)
            for entry in AreaUse.objects.visible_to(self.org).with_flags(self.org)
            if entry.code in {"sys", "hidden", "old", "own"}
        }
        self.assertEqual(
            flags,
            {
                "sys": (False, True),
                "hidden": (True, False),
                "old": (False, False),
                "own": (False, True),
            },
        )


class CatalogApiTests(APITestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.other = make_tenant("Other")
        self.reader = make_user("reader@example.com", self.org)
        self.writer = make_user("writer@example.com", self.org, [WRITE])
        self.staff = make_user("staff@example.com", self.org, [WRITE], is_staff=True)
        self.header = tenant_header(self.org)
        self.system_use = AreaUse.objects.get(code="playground", organization=None)

    def url(self, resource, pk=None, action=None):
        url = f"/api/catalogs/{resource}/"
        if pk is not None:
            url += f"{pk}/"
        if action is not None:
            url += f"{action}/"
        return url

    def test_members_read_the_catalogs_without_permissions(self):
        self.client.force_authenticate(self.reader)

        response = self.client.get(self.url("area-uses"), **self.header)

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["count"], 10)
        entry = response.data["results"][0]
        self.assertTrue(entry["is_system"])
        self.assertTrue(entry["is_available"])

    def test_foreign_tenant_is_not_found_and_no_tenant_shows_system_entries(self):
        AreaUse.objects.create(code="mine", name="Mia", organization=self.org)
        self.client.force_authenticate(self.reader)

        foreign = self.client.get(self.url("area-uses"), **tenant_header(self.other))
        without_tenant = self.client.get(self.url("area-uses"))

        self.assertEqual(foreign.status_code, 404, foreign.content)
        self.assertEqual(without_tenant.status_code, 200)
        self.assertNotIn(
            "mine", [entry["code"] for entry in without_tenant.data["results"]]
        )

    def test_organization_adds_its_own_entries(self):
        self.client.force_authenticate(self.writer)

        response = self.client.post(
            self.url("area-uses"), {"name": "Area eventi"}, format="json", **self.header
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["code"], "area-eventi")
        self.assertEqual(response.data["organization"], self.org.pk)
        self.assertFalse(response.data["is_system"])
        entry = AreaUse.objects.get(pk=response.data["id"])
        self.assertEqual(entry.created_by, self.writer)

    def test_writing_needs_the_permission(self):
        self.client.force_authenticate(self.reader)

        response = self.client.post(
            self.url("area-uses"), {"name": "Area eventi"}, format="json", **self.header
        )

        self.assertEqual(response.status_code, 403, response.content)

    def test_system_entries_are_read_only_for_non_staff_users(self):
        self.client.force_authenticate(self.writer)
        url = self.url("area-uses", self.system_use.pk)

        update = self.client.patch(
            url, {"name": "Giochi"}, format="json", **self.header
        )
        delete = self.client.delete(url, **self.header)
        create = self.client.post(
            self.url("area-uses"),
            {"name": "Nuova", "is_system": True},
            format="json",
            **self.header,
        )
        fixed = self.client.post(
            self.url("urban-green-types"),
            {"name": "Nuova"},
            format="json",
            **self.header,
        )

        for response in (update, delete, create, fixed):
            self.assertEqual(response.status_code, 403, response.content)
            self.assertEqual(response.data["code"], "system_entry_read_only")
        self.system_use.refresh_from_db()
        self.assertEqual(self.system_use.name, "Area gioco")

    def test_staff_manage_system_entries_but_not_their_codes(self):
        self.client.force_authenticate(self.staff)

        create = self.client.post(
            self.url("area-uses"),
            {"name": "Area eventi", "is_system": True},
            format="json",
            **self.header,
        )
        rename = self.client.patch(
            self.url("area-uses", self.system_use.pk),
            {"name": "Area giochi"},
            format="json",
            **self.header,
        )
        recode = self.client.patch(
            self.url("area-uses", self.system_use.pk),
            {"code": "games"},
            format="json",
            **self.header,
        )

        self.assertEqual(create.status_code, 201, create.content)
        self.assertIsNone(create.data["organization"])
        self.assertEqual(rename.status_code, 200, rename.content)
        self.assertEqual(recode.status_code, 400, recode.content)
        self.assertEqual(recode.data["code"]["code"], "catalog_code_immutable")

    def test_codes_are_unique_in_their_scope(self):
        self.client.force_authenticate(self.writer)
        AreaUse.objects.create(code="events", name="Eventi", organization=self.other)

        same_as_other_org = self.client.post(
            self.url("area-uses"),
            {"code": "events", "name": "Eventi"},
            format="json",
            **self.header,
        )
        duplicate = self.client.post(
            self.url("area-uses"),
            {"code": "events", "name": "Eventi 2"},
            format="json",
            **self.header,
        )

        self.assertEqual(same_as_other_org.status_code, 201, same_as_other_org.content)
        self.assertEqual(duplicate.status_code, 400, duplicate.content)
        self.assertEqual(duplicate.data["code"][0]["code"], "catalog_code_not_unique")

    def test_hide_and_unhide_system_entries(self):
        self.client.force_authenticate(self.writer)
        own = AreaUse.objects.create(code="mine", name="Mia", organization=self.org)

        hidden = self.client.post(
            self.url("area-uses", self.system_use.pk, "hide"), **self.header
        )
        choices = self.client.get(
            self.url("area-uses", action="choices"), **self.header
        )
        hide_own = self.client.post(
            self.url("area-uses", own.pk, "hide"), **self.header
        )
        shown = self.client.post(
            self.url("area-uses", self.system_use.pk, "unhide"), **self.header
        )

        self.assertEqual(hidden.status_code, 200, hidden.content)
        self.assertTrue(hidden.data["is_hidden"])
        self.assertFalse(hidden.data["is_available"])
        self.assertNotIn(self.system_use.code, [e["code"] for e in choices.data])
        self.assertIn("mine", [e["code"] for e in choices.data])
        self.assertEqual(hide_own.status_code, 400, hide_own.content)
        self.assertEqual(hide_own.data["code"], "only_system_entries_can_be_hidden")
        self.assertFalse(shown.data["is_hidden"])
        # Hiding is per organization.
        self.assertTrue(
            AreaUse.objects.available_for(self.other)
            .filter(pk=self.system_use.pk)
            .exists()
        )

    def test_actions_answer_without_the_request_filters(self):
        self.client.force_authenticate(self.writer)

        response = self.client.post(
            self.url("area-uses", self.system_use.pk, "hide") + "?_sf_hidden=false",
            **self.header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.data["is_hidden"])

    def test_hiding_stays_out_of_the_shared_history(self):
        self.client.force_authenticate(self.writer)
        self.client.post(
            self.url("area-uses", self.system_use.pk, "hide"), **self.header
        )
        other_reader = make_user("other@example.com", self.other)
        self.client.force_authenticate(other_reader)

        response = self.client.get(
            self.url("area-uses", self.system_use.pk, "history"),
            **tenant_header(self.other),
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertNotIn(
            "writer@example.com", [entry["actor"] for entry in response.data]
        )

    def test_choices_leave_out_retired_entries(self):
        AreaUse.objects.create(
            code="old", name="Vecchia", organization=self.org, retired=True
        )
        self.client.force_authenticate(self.reader)

        response = self.client.get(
            self.url("area-uses", action="choices"), **self.header
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertNotIn("old", [entry["code"] for entry in response.data])

    def test_entries_in_use_are_not_deleted(self):
        genus = Species.objects.create(
            code="g", scientific_name="Genus", genus="Genus", organization=self.org
        )
        Species.objects.create(
            code="gs",
            scientific_name="Genus species",
            genus="Genus",
            parent=genus,
            organization=self.org,
        )
        self.client.force_authenticate(self.writer)

        response = self.client.delete(self.url("species", genus.pk), **self.header)

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["code"], "catalog_entry_in_use")
        self.assertTrue(Species.objects.filter(pk=genus.pk).exists())

    def test_history(self):
        self.client.force_authenticate(self.writer)
        created = self.client.post(
            self.url("area-uses"), {"name": "Area eventi"}, format="json", **self.header
        )
        self.client.patch(
            self.url("area-uses", created.data["id"]),
            {"name": "Area feste"},
            format="json",
            **self.header,
        )

        response = self.client.get(
            self.url("area-uses", created.data["id"], "history"), **self.header
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            [entry["action"] for entry in response.data], ["update", "create"]
        )
        self.assertEqual(response.data[0]["actor"], "writer@example.com")


class SpeciesApiTests(APITestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.writer = make_user("writer@example.com", self.org, [WRITE])
        self.header = tenant_header(self.org)
        self.client.force_authenticate(self.writer)
        self.genus = Species.objects.create(
            code="tilia", rank="genus", scientific_name="Tilia", genus="Tilia"
        )
        self.system = Species.objects.create(
            code="tilia-cordata",
            scientific_name="Tilia cordata",
            genus="Tilia",
            parent=self.genus,
        )

    def post(self, data):
        return self.client.post(
            "/api/catalogs/species/", data, format="json", **self.header
        )

    def test_create_derives_name_genus_and_code(self):
        response = self.post(
            {"scientific_name": "Tilia  americana", "parent": str(self.genus.pk)}
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["scientific_name"], "Tilia americana")
        self.assertEqual(response.data["name"], "Tilia americana")
        self.assertEqual(response.data["genus"], "Tilia")
        self.assertEqual(response.data["code"], "tilia-americana")
        self.assertEqual(response.data["parent_data"]["code"], "tilia")

    def test_scientific_name_unique_among_available_entries(self):
        duplicate = self.post({"scientific_name": "tilia cordata"})
        self.system.hidden_by.add(self.org)
        replacing_hidden = self.post({"scientific_name": "Tilia cordata"})
        own_duplicate = self.post({"scientific_name": "TILIA CORDATA"})

        self.assertEqual(duplicate.status_code, 400, duplicate.content)
        self.assertEqual(
            duplicate.data["scientific_name"]["code"], "species_name_not_unique"
        )
        self.assertEqual(replacing_hidden.status_code, 201, replacing_hidden.content)
        self.assertEqual(own_duplicate.status_code, 400, own_duplicate.content)
        self.assertEqual(
            own_duplicate.data["scientific_name"][0]["code"], "species_name_not_unique"
        )

    def test_unhide_refused_while_an_own_entry_has_the_name(self):
        self.system.hidden_by.add(self.org)
        own = self.post({"scientific_name": "Tilia cordata"})
        url = f"/api/catalogs/species/{self.system.pk}/unhide/"

        refused = self.client.post(url, **self.header)
        Species.objects.filter(pk=own.data["id"]).update(retired=True)
        accepted = self.client.post(url, **self.header)

        self.assertEqual(refused.status_code, 400, refused.content)
        self.assertEqual(
            refused.data["scientific_name"]["code"], "species_name_not_unique"
        )
        self.assertEqual(accepted.status_code, 200, accepted.content)

    def test_parent_of_another_organization_is_refused(self):
        other = make_tenant("Other")
        foreign = Species.objects.create(
            code="x", scientific_name="Xus", genus="Xus", organization=other
        )

        response = self.post({"scientific_name": "Xus yus", "parent": str(foreign.pk)})

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["parent"]["code"], "catalog_entry_not_available")


class ElementClassApiTests(APITestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.writer = make_user("writer@example.com", self.org, [WRITE])
        self.staff = make_user("staff@example.com", self.org, [WRITE], is_staff=True)
        self.header = tenant_header(self.org)
        self.material = AttributeDefinition.objects.get(code="material")
        self.irrigated = AttributeDefinition.objects.get(code="irrigated")

    def test_class_with_attributes(self):
        self.client.force_authenticate(self.writer)

        created = self.client.post(
            "/api/catalogs/element-classes/",
            {
                "name": "Pergola",
                "category": "furniture",
                "geometry_type": "polygon",
                "quantity_unit": "square_meter",
                "species_mode": "none",
                "class_attributes": [
                    {"attribute": str(self.material.pk), "required": True}
                ],
            },
            format="json",
            **self.header,
        )
        updated = self.client.patch(
            f"/api/catalogs/element-classes/{created.data['id']}/",
            {"class_attributes": [{"attribute": str(self.irrigated.pk)}]},
            format="json",
            **self.header,
        )

        self.assertEqual(created.status_code, 201, created.content)
        self.assertEqual(
            created.data["class_attributes"][0]["attribute_data"]["code"], "material"
        )
        self.assertTrue(created.data["class_attributes"][0]["required"])
        self.assertEqual(updated.status_code, 200, updated.content)
        self.assertEqual(
            list(
                ElementClassAttribute.objects.filter(
                    element_class_id=created.data["id"]
                ).values_list("attribute__code", flat=True)
            ),
            ["irrigated"],
        )

    def test_only_available_attributes_are_added(self):
        element_class = ElementClass.objects.create(
            code="kiosk",
            name="Chiosco",
            category="furniture",
            geometry_type="point",
            quantity_unit="count",
            species_mode="none",
            organization=self.org,
        )
        ElementClassAttribute.objects.create(
            element_class=element_class, attribute=self.material
        )
        self.material.retired = True
        self.material.save()
        self.irrigated.hidden_by.add(self.org)
        self.client.force_authenticate(self.writer)
        url = f"/api/catalogs/element-classes/{element_class.pk}/"

        hidden = self.client.patch(
            url,
            {
                "class_attributes": [
                    {"attribute": str(self.material.pk)},
                    {"attribute": str(self.irrigated.pk)},
                ]
            },
            format="json",
            **self.header,
        )
        kept = self.client.patch(
            url,
            {"class_attributes": [{"attribute": str(self.material.pk)}]},
            format="json",
            **self.header,
        )

        self.assertEqual(hidden.status_code, 400, hidden.content)
        self.assertEqual(
            hidden.data["class_attributes"]["code"], "catalog_entry_not_available"
        )
        # The retired attribute already in the class stays.
        self.assertEqual(kept.status_code, 200, kept.content)

    def test_attributes_are_system_entries_in_the_mvp(self):
        self.client.force_authenticate(self.writer)

        response = self.client.post(
            "/api/catalogs/attribute-definitions/",
            {"name": "Colore", "data_type": "text"},
            format="json",
            **self.header,
        )

        self.assertEqual(response.status_code, 403, response.content)

    def test_type_of_an_attribute_in_use_is_locked(self):
        self.client.force_authenticate(self.staff)

        response = self.client.patch(
            f"/api/catalogs/attribute-definitions/{self.material.pk}/",
            {"data_type": "text", "choices": []},
            format="json",
            **self.header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(
            response.data["data_type"]["code"], "catalog_entry_in_use_locked"
        )

    def test_choice_attributes_need_values(self):
        self.client.force_authenticate(self.staff)

        response = self.client.post(
            "/api/catalogs/attribute-definitions/",
            {"name": "Forma", "data_type": "choice", "is_system": True},
            format="json",
            **self.header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(
            response.data["choices"][0]["code"], "attribute_choices_required"
        )


class CatalogAdminTests(TestCase):
    """The admin changes the entries with the rules of the services (D-046)."""

    def setUp(self):
        self.org = make_tenant("Org")
        self.staff = make_user(
            "admin@example.com", self.org, is_staff=True, is_superuser=True
        )
        self.client.force_login(self.staff)
        self.playground = AreaUse.objects.get(code="playground", organization=None)

    def entry_data(self, entry, **changes):
        data = {
            "code": entry.code,
            "name": entry.name,
            "description": entry.description,
            "sort_order": entry.sort_order,
            "source": entry.source,
            "organization": entry.organization_id or "",
        }
        if entry.retired:
            data["retired"] = "on"
        return {**data, **changes}

    def test_code_of_a_system_entry_does_not_change(self):
        response = self.client.post(
            f"/admin/catalogs/areause/{self.playground.pk}/change/",
            self.entry_data(self.playground, code="games"),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("code", response.context["adminform"].form.errors)
        self.playground.refresh_from_db()
        self.assertEqual(self.playground.code, "playground")

    def test_changes_are_stamped(self):
        response = self.client.post(
            f"/admin/catalogs/areause/{self.playground.pk}/change/",
            self.entry_data(self.playground, name="Area giochi"),
        )

        self.assertEqual(response.status_code, 302)
        self.playground.refresh_from_db()
        self.assertEqual(self.playground.name, "Area giochi")
        self.assertEqual(self.playground.updated_by, self.staff)
        self.assertEqual(self.playground.revision, 2)

    def test_attributes_of_an_organization_are_refused(self):
        response = self.client.post(
            "/admin/catalogs/attributedefinition/add/",
            {
                "code": "colour",
                "name": "Colore",
                "sort_order": 0,
                "organization": self.org.pk,
                "data_type": "text",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "The organizations do not add entries to this catalog.",
            response.context["adminform"].form.non_field_errors(),
        )
        self.assertFalse(AttributeDefinition.objects.filter(code="colour").exists())

    def test_retired_attributes_are_not_added_to_a_class(self):
        lawn = ElementClass.objects.get(code="lawn", organization=None)
        material = AttributeDefinition.objects.get(code="material")
        material.retired = True
        material.save()
        links = list(lawn.class_attributes.all())
        data = {
            "code": lawn.code,
            "name": lawn.name,
            "sort_order": lawn.sort_order,
            "category": lawn.category,
            "geometry_type": lawn.geometry_type,
            "quantity_unit": lawn.quantity_unit,
            "species_mode": lawn.species_mode,
            "class_attributes-TOTAL_FORMS": len(links) + 1,
            "class_attributes-INITIAL_FORMS": len(links),
            "class_attributes-MIN_NUM_FORMS": 0,
            "class_attributes-MAX_NUM_FORMS": 1000,
        }
        for index, link in enumerate([*links, None]):
            prefix = f"class_attributes-{index}"
            data[f"{prefix}-element_class"] = lawn.pk
            if link is None:
                data[f"{prefix}-attribute"] = material.pk
                data[f"{prefix}-sort_order"] = 99
            else:
                data[f"{prefix}-id"] = link.pk
                data[f"{prefix}-attribute"] = link.attribute_id
                data[f"{prefix}-sort_order"] = link.sort_order

        response = self.client.post(
            f"/admin/catalogs/elementclass/{lawn.pk}/change/", data
        )

        self.assertEqual(response.status_code, 200)
        inline_errors = response.context["inline_admin_formsets"][0].formset.errors
        self.assertEqual(
            inline_errors[-1]["attribute"], ["The attribute is not available."]
        )
        self.assertFalse(lawn.class_attributes.filter(attribute=material).exists())
