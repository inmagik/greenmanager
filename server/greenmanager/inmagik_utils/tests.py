from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from jobs_core.models import JobRun
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from .audit_log.audit_log_integration import standard_auditlog_manager
from .nested_multi_parser import (
    MAX_LIST_ITEMS,
    MAX_TOTAL_LIST_ITEMS,
    NestedMultiPartParser,
    _assign,
    _ExpansionBudget,
)


class NestedUploadView(APIView):
    parser_classes = [NestedMultiPartParser]


class NestedMultiPartParserExpansionTests(SimpleTestCase):
    def test_rejects_an_excessive_list_index_without_growing_the_list(self):
        root = {}

        with self.assertRaisesRegex(ValueError, "above the limit"):
            _assign(
                root,
                ["items", "1000000000", "name"],
                "value",
                _ExpansionBudget(),
            )

        self.assertEqual(root["items"], [])

    def test_accepts_the_highest_allowed_list_index(self):
        root = {}

        _assign(
            root,
            ["items", str(MAX_LIST_ITEMS - 1)],
            "value",
            _ExpansionBudget(),
        )

        self.assertEqual(len(root["items"]), MAX_LIST_ITEMS)
        self.assertEqual(root["items"][-1], "value")

    def test_rejects_total_expansion_across_multiple_lists(self):
        root = {}
        budget = _ExpansionBudget()
        list_count = MAX_TOTAL_LIST_ITEMS // MAX_LIST_ITEMS

        for index in range(list_count):
            _assign(
                root,
                [f"items_{index}", str(MAX_LIST_ITEMS - 1)],
                "value",
                budget,
            )

        with self.assertRaisesRegex(ValueError, "list items in total"):
            _assign(root, ["one_more", "0"], "value", budget)

        self.assertEqual(root["one_more"], [])

    def test_append_syntax_obeys_the_per_list_limit(self):
        root = {}
        budget = _ExpansionBudget()

        for _ in range(MAX_LIST_ITEMS):
            _assign(root, ["items", ""], "value", budget)

        with self.assertRaisesRegex(ValueError, "more than 1000 list items"):
            _assign(root, ["items", ""], "value", budget)


class NestedMultiPartParserFileTests(SimpleTestCase):
    def parse_request(self, data):
        django_request = APIRequestFactory().post("/upload/", data, format="multipart")
        request = NestedUploadView().initialize_request(django_request)
        return django_request, request

    def test_flat_file_is_not_replaced_with_a_list(self):
        upload = SimpleUploadedFile("avatar.txt", b"content")
        django_request, request = self.parse_request({"avatar": upload})
        parsed_upload = request.FILES["avatar"]

        self.assertIs(request.data["avatar"], parsed_upload)
        self.assertFalse(isinstance(request.data["avatar"], list))

        django_request.close()
        self.assertTrue(parsed_upload.closed)

    def test_nested_file_does_not_gain_an_extra_flat_key(self):
        upload = SimpleUploadedFile("document.txt", b"content")
        django_request, request = self.parse_request({"items[0].file": upload})
        parsed_upload = request.FILES["items[0].file"]

        self.assertIs(request.data["items"][0]["file"], parsed_upload)
        self.assertNotIn("items[0].file", request.data)

        django_request.close()
        self.assertTrue(parsed_upload.closed)


class LastUpdateMixinTests(TestCase):
    def annotated(self, instance):
        manager = standard_auditlog_manager()()
        manager.model = type(instance)
        return manager.get_queryset().get(pk=instance.pk)

    def log(self, instance, action, email):
        LogEntry.objects.create(
            content_type=ContentType.objects.get_for_model(instance),
            object_pk=str(instance.pk),
            object_id=instance.pk if isinstance(instance.pk, int) else None,
            object_repr=str(instance),
            action=action,
            actor_email=email,
        )

    def test_finds_entries_of_uuid_and_integer_keys(self):
        # JobRun has a UUID key, like the domain entities; Role an integer one.
        from auth_core.models import Role
        from tenants.models import Tenant

        tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        for instance in (
            JobRun.objects.create(func="x"),
            Role.objects.create(tenant=tenant, name="Readers"),
        ):
            self.log(instance, LogEntry.Action.CREATE, "creator@example.com")
            self.log(instance, LogEntry.Action.UPDATE, "editor@example.com")

            annotated = self.annotated(instance)

            self.assertEqual(annotated.created_by_email, "creator@example.com")
            self.assertEqual(annotated.updated_by_email, "editor@example.com")
            self.assertIsNotNone(annotated.created_at)
