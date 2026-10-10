from catalogs.models import AreaUse
from core.errors import validate_model
from core.models import ChangeRecord, system_entry_id
from core.services import (
    ChangeContext,
    change_source,
    json_value,
    record_change,
    snapshot,
)
from core.testing import make_tenant, make_user, tenant_header
from django.contrib.gis.geos import Point
from django.core.management import call_command
from django.db import DatabaseError, connection, transaction
from django.test import RequestFactory, SimpleTestCase, TestCase
from parties.models import Client
from rest_framework import serializers
from rest_framework.test import APITestCase


class TrackedModelTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant("Org")

    def test_revision_grows_at_every_save(self):
        client = Client.objects.create(
            name="Comune", kind="public_body", managing_organization=self.tenant
        )
        self.assertEqual(client.revision, 1)

        client.name = "Comune di Prova"
        client.save()
        client.save(update_fields=["name"])

        client.refresh_from_db()
        self.assertEqual(client.revision, 3)

    def test_system_entry_ids_are_deterministic(self):
        self.assertEqual(
            system_entry_id("catalogs.areause", "other"),
            system_entry_id("Catalogs.AreaUse", "other"),
        )
        self.assertEqual(
            AreaUse.objects.get(code="other", organization=None).pk,
            system_entry_id("catalogs.areause", "other"),
        )


class ChangeRecordTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant("Org")
        self.user = make_user("author@example.com", self.tenant, full_name="Ada")
        self.context = ChangeContext(actor=self.user, organization=self.tenant)
        self.client_record = Client.objects.create(
            name="Comune", kind="public_body", managing_organization=self.tenant
        )

    def test_create_records_every_value(self):
        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.CREATE,
            context=self.context,
            client_id=self.client_record.pk,
        )

        self.assertEqual(record.entity, "parties.client")
        self.assertEqual(record.record_id, self.client_record.pk)
        self.assertEqual(record.client_id, self.client_record.pk)
        self.assertEqual(record.author, self.user)
        self.assertEqual(record.author_label, "Ada")
        self.assertEqual(record.organization, self.tenant)
        self.assertEqual(record.source, ChangeRecord.Source.WEB)
        self.assertEqual(record.changes["name"], {"old": None, "new": "Comune"})
        self.assertEqual(
            record.changes["managing_organization"],
            {"old": None, "new": self.tenant.pk},
        )
        self.assertNotIn("revision", record.changes)

    def test_update_records_only_the_differences(self):
        before = snapshot(self.client_record)
        self.client_record.name = "Comune di Prova"

        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.UPDATE,
            context=self.context,
            before=before,
        )

        self.assertEqual(
            record.changes, {"name": {"old": "Comune", "new": "Comune di Prova"}}
        )

    def test_update_without_differences_writes_nothing(self):
        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.UPDATE,
            context=self.context,
            before=snapshot(self.client_record),
        )

        self.assertIsNone(record)
        self.assertFalse(ChangeRecord.objects.exists())

    def test_history_cannot_change(self):
        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.CREATE,
            context=self.context,
        )

        record.reason = "edited"
        with self.assertRaises(ValueError):
            record.save()
        with self.assertRaises(ValueError):
            record.delete()
        with self.assertRaises(ValueError):
            ChangeRecord.objects.filter(pk=record.pk).update(reason="edited")
        with self.assertRaises(ValueError):
            ChangeRecord.objects.filter(pk=record.pk).delete()

    def test_database_rejects_changes_to_the_history(self):
        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.CREATE,
            context=self.context,
        )

        for sql in (
            "UPDATE core_changerecord SET reason = 'edited' WHERE id = %s",
            "DELETE FROM core_changerecord WHERE id = %s",
        ):
            with self.subTest(sql=sql):
                with self.assertRaises(DatabaseError), transaction.atomic():
                    with connection.cursor() as cursor:
                        cursor.execute(sql, [record.pk])
        self.assertTrue(ChangeRecord.objects.filter(pk=record.pk).exists())

    def test_deleting_the_author_keeps_the_history(self):
        record = record_change(
            instance=self.client_record,
            operation=ChangeRecord.Operation.CREATE,
            context=self.context,
        )

        self.user.delete()

        record.refresh_from_db()
        self.assertIsNone(record.author)
        self.assertEqual(record.author_label, "Ada")


class HelpersTests(SimpleTestCase):
    def test_change_source_accepts_web_and_field_only(self):
        factory = RequestFactory()

        self.assertEqual(
            change_source(factory.get("/", HTTP_X_CHANGE_SOURCE="field")), "field"
        )
        self.assertEqual(
            change_source(factory.get("/", HTTP_X_CHANGE_SOURCE="sync")), "web"
        )
        self.assertEqual(change_source(factory.get("/")), "web")

    def test_geometries_are_stored_as_geojson(self):
        self.assertEqual(
            json_value(Point(9.19, 45.46, srid=4326)),
            {"type": "Point", "coordinates": [9.19, 45.46]},
        )


class ValidateModelTests(TestCase):
    def test_keeps_the_codes_of_the_errors(self):
        tenant = make_tenant("Org")
        client = Client(
            name="Comune",
            kind="public_body",
            istat_code="12AB",
            managing_organization=tenant,
        )

        with self.assertRaises(serializers.ValidationError) as raised:
            validate_model(client)

        error = raised.exception.detail["istat_code"][0]
        self.assertEqual(error["code"], "invalid_istat_code")

    def test_constraint_errors_go_to_their_field(self):
        AreaUse.objects.create(code="park", name="Parco")

        with self.assertRaises(serializers.ValidationError) as raised:
            validate_model(AreaUse(code="park", name="Parco bis"))

        error = raised.exception.detail["code"][0]
        self.assertEqual(error["code"], "catalog_code_not_unique")


class DomainApiContractTests(APITestCase):
    def test_permissions_of_the_domain_apps_are_collected(self):
        tenant = make_tenant("Org")
        user = make_user("user@example.com", tenant)
        self.client.force_authenticate(user)

        response = self.client.get(
            "/api/core/auth/permissions/", **tenant_header(tenant)
        )

        codes = {permission["code"] for permission in response.data}
        self.assertTrue(
            {
                "catalogs.WRITE_CATALOGS",
                "parties.READ_CLIENTS",
                "parties.WRITE_CLIENTS",
            }
            <= codes
        )

    def test_openapi_schema_has_no_warnings(self):
        call_command("spectacular", "--fail-on-warn", "--file", "/dev/null")
