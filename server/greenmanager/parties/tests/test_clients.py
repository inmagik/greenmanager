from core.models import ChangeRecord
from core.services import ChangeContext
from core.testing import make_tenant, make_user, tenant_header
from django.test import TestCase
from parties import services
from parties.models import Client
from rest_framework.exceptions import NotFound
from rest_framework.test import APITestCase

READ = "parties.READ_CLIENTS"
WRITE = "parties.WRITE_CLIENTS"


class ClientApiTests(APITestCase):
    def setUp(self):
        self.org = make_tenant("Org")
        self.other = make_tenant("Other")
        self.manager = make_user(
            "manager@example.com", self.org, [READ, WRITE], full_name="Gestore"
        )
        self.reader = make_user("reader@example.com", self.org, [READ])
        self.header = tenant_header(self.org)
        self.own = Client.objects.create(
            name="Comune di Prova", kind="public_body", managing_organization=self.org
        )
        self.foreign = Client.objects.create(
            name="Condominio Altrui",
            kind="condominium",
            managing_organization=self.other,
        )

    def url(self, pk=None, action=None):
        url = "/api/parties/clients/"
        if pk is not None:
            url += f"{pk}/"
        if action is not None:
            url += f"{action}/"
        return url

    def create(self, data, **headers):
        return self.client.post(
            self.url(), data, format="json", **{**self.header, **headers}
        )

    def test_organizations_see_only_their_clients(self):
        self.client.force_authenticate(self.reader)

        listed = self.client.get(self.url(), **self.header)
        foreign = self.client.get(self.url(self.foreign.pk), **self.header)
        without_tenant = self.client.get(self.url())

        self.assertEqual(listed.status_code, 200, listed.content)
        self.assertEqual(
            [c["name"] for c in listed.data["results"]], ["Comune di Prova"]
        )
        self.assertEqual(foreign.status_code, 404, foreign.content)
        # Without a tenant the roles grant nothing, and nobody sees any client.
        self.assertEqual(without_tenant.status_code, 403, without_tenant.content)
        superuser = make_user("root@example.com", is_superuser=True, is_staff=True)
        self.client.force_authenticate(superuser)
        self.assertEqual(self.client.get(self.url()).data["count"], 0)

    def test_permissions(self):
        outsider = make_user("outsider@example.com", self.org)
        self.client.force_authenticate(outsider)
        self.assertEqual(self.client.get(self.url(), **self.header).status_code, 403)

        self.client.force_authenticate(self.reader)
        response = self.create({"name": "Nuovo", "kind": "company"})
        self.assertEqual(response.status_code, 403, response.content)

    def test_create_assigns_the_organization_and_records_the_change(self):
        self.client.force_authenticate(self.manager)

        response = self.create(
            {"name": "Condominio Verde", "kind": "condominium", "istat_code": "015146"},
            HTTP_X_CHANGE_SOURCE="field",
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["managing_organization"], self.org.pk)
        self.assertEqual(response.data["managing_organization_data"]["name"], "Org")
        self.assertEqual(response.data["created_by_label"], "Gestore")
        self.assertEqual(response.data["revision"], 1)
        record = ChangeRecord.objects.get(record_id=response.data["id"])
        self.assertEqual(record.operation, "create")
        self.assertEqual(str(record.client_id), response.data["id"])
        self.assertEqual(record.organization, self.org)
        self.assertEqual(record.author, self.manager)
        self.assertEqual(record.source, "field")
        self.assertEqual(record.changes["name"]["new"], "Condominio Verde")

    def test_only_staff_assign_another_organization(self):
        self.client.force_authenticate(self.manager)
        refused = self.create(
            {"name": "Altro", "kind": "company", "managing_organization": self.other.pk}
        )
        moved = self.client.patch(
            self.url(self.own.pk),
            {"managing_organization": self.other.pk},
            format="json",
            **self.header,
        )
        staff = make_user("staff@example.com", self.org, [READ, WRITE], is_staff=True)
        self.client.force_authenticate(staff)
        accepted = self.create(
            {"name": "Altro", "kind": "company", "managing_organization": self.other.pk}
        )

        self.assertEqual(refused.status_code, 403, refused.content)
        self.assertEqual(refused.data["code"], "managing_organization_staff_only")
        self.assertEqual(moved.status_code, 403, moved.content)
        self.assertEqual(accepted.status_code, 201, accepted.content)
        self.assertEqual(accepted.data["managing_organization"], self.other.pk)

    def test_update_records_the_differences_and_checks_the_revision(self):
        self.client.force_authenticate(self.manager)
        url = self.url(self.own.pk)

        updated = self.client.patch(
            url, {"notes": "Note", "revision": 1}, format="json", **self.header
        )
        unchanged = self.client.patch(
            url, {"notes": "Note"}, format="json", **self.header
        )
        stale = self.client.patch(
            url, {"notes": "Altro", "revision": 1}, format="json", **self.header
        )

        self.assertEqual(updated.status_code, 200, updated.content)
        self.assertEqual(updated.data["revision"], 2)
        self.assertEqual(stale.status_code, 409, stale.content)
        self.assertEqual(stale.data["code"], "revision_conflict")
        records = ChangeRecord.objects.filter(record_id=self.own.pk)
        self.assertEqual(records.count(), 1)
        self.assertEqual(records.get().changes, {"notes": {"old": "", "new": "Note"}})
        self.assertEqual(unchanged.status_code, 200, unchanged.content)

    def test_delete_records_a_cancellation(self):
        self.client.force_authenticate(self.manager)

        response = self.client.delete(self.url(self.own.pk), **self.header)

        self.assertEqual(response.status_code, 204, response.content)
        record = ChangeRecord.objects.get(record_id=self.own.pk)
        self.assertEqual(record.operation, "cancel")
        self.assertEqual(
            record.changes["name"], {"old": "Comune di Prova", "new": None}
        )

    def test_invalid_istat_code(self):
        self.client.force_authenticate(self.manager)

        response = self.create(
            {"name": "Comune", "kind": "public_body", "istat_code": "1A"}
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["istat_code"][0]["code"], "invalid_istat_code")

    def test_history_and_choices(self):
        self.client.force_authenticate(self.manager)
        self.client.patch(
            self.url(self.own.pk), {"active": False}, format="json", **self.header
        )

        history = self.client.get(self.url(self.own.pk, "history"), **self.header)
        choices = self.client.get(self.url(action="choices"), **self.header)

        self.assertEqual(history.status_code, 200, history.content)
        self.assertEqual(history.data[0]["action"], "update")
        self.assertEqual(choices.status_code, 200, choices.content)
        self.assertEqual(
            choices.data,
            [
                {
                    "id": str(self.own.pk),
                    "name": "Comune di Prova",
                    "kind": "public_body",
                    "istat_code": "",
                    "active": False,
                }
            ],
        )


class ClientAdminTests(APITestCase):
    def test_admin_changes_go_through_the_services(self):
        org = make_tenant("Org")
        staff = make_user("admin@example.com", org, is_staff=True, is_superuser=True)
        self.client.force_login(staff)

        response = self.client.post(
            "/admin/parties/client/add/",
            {
                "name": "Comune",
                "kind": "public_body",
                "istat_code": "",
                "tax_code": "",
                "managing_organization": org.pk,
                "contacts": "",
                "cam_export_srid": "",
                "active": "on",
                "notes": "",
            },
        )

        self.assertEqual(response.status_code, 302, response.content)
        client = Client.objects.get(name="Comune")
        self.assertEqual(client.created_by, staff)
        record = ChangeRecord.objects.get(record_id=client.pk)
        self.assertEqual(record.source, "system")
        self.assertEqual(record.organization, org)

    def test_admin_shows_the_errors_of_the_services(self):
        org = make_tenant("Org")
        staff = make_user("admin@example.com", org, is_staff=True, is_superuser=True)
        self.client.force_login(staff)

        response = self.client.post(
            "/admin/parties/client/add/",
            {"name": "Comune", "kind": "public_body", "istat_code": "12"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Client.objects.exists())

    def test_admin_refuses_a_stale_revision(self):
        org = make_tenant("Org")
        staff = make_user("admin@example.com", org, is_staff=True, is_superuser=True)
        client = Client.objects.create(
            name="Comune", kind="public_body", managing_organization=org
        )
        self.client.force_login(staff)
        url = f"/admin/parties/client/{client.pk}/change/"
        form = self.client.get(url).context["adminform"].form
        opened_with = form.fields["expected_revision"].initial
        # Someone else changes the client after the form was opened.
        services.update_client(
            client, {"notes": "Altro"}, ChangeContext(actor=staff, organization=org)
        )
        data = {
            "name": "Comune di Prova",
            "kind": "public_body",
            "istat_code": "",
            "tax_code": "",
            "managing_organization": org.pk,
            "contacts": "",
            "cam_export_srid": "",
            "active": "on",
            "notes": "Altro",
            "expected_revision": opened_with,
        }

        stale = self.client.post(url, data)
        current = self.client.post(url, {**data, "expected_revision": 2})

        self.assertEqual(opened_with, 1)
        self.assertEqual(stale.status_code, 200)
        self.assertIn(
            "The record was changed by someone else in the meantime.",
            stale.context["adminform"].form.non_field_errors(),
        )
        self.assertEqual(current.status_code, 302)
        client.refresh_from_db()
        self.assertEqual(client.name, "Comune di Prova")
        self.assertEqual(client.revision, 3)


class ClientScopeUnderLockTests(TestCase):
    """The organization of a change is checked again under the lock."""

    def setUp(self):
        self.org = make_tenant("Org")
        self.other = make_tenant("Other")
        self.user = make_user("manager@example.com", self.org)
        self.context = ChangeContext(actor=self.user, organization=self.org)
        self.client_record = Client.objects.create(
            name="Comune", kind="public_body", managing_organization=self.org
        )
        # Meanwhile staff moves the client to another organization.
        Client.objects.filter(pk=self.client_record.pk).update(
            managing_organization=self.other
        )

    def test_update_of_a_client_moved_away(self):
        with self.assertRaises(NotFound):
            services.update_client(self.client_record, {"notes": "x"}, self.context)

    def test_delete_of_a_client_moved_away(self):
        with self.assertRaises(NotFound):
            services.delete_client(self.client_record, self.context)
        self.assertTrue(Client.objects.filter(pk=self.client_record.pk).exists())
