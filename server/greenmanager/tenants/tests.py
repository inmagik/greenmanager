from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from drf_spectacular.generators import SchemaGenerator
from rest_framework.test import APITestCase
from tenants.models import Tenant, TenantMembership
from tenants.serializers import TenantMembershipSerializer


class TenantOpenApiSchemaTests(SimpleTestCase):
    def test_tenant_header_only_on_tenant_scoped_operations(self):
        schema = SchemaGenerator().get_schema(request=None, public=True)

        def requires_tenant(path, method):
            security = schema["paths"][path][method].get("security", [])
            return any("TenantId" in requirement for requirement in security)

        self.assertTrue(requires_tenant("/api/core/auth/users/", "get"))
        self.assertTrue(requires_tenant("/api/core/auth/roles/", "get"))
        self.assertTrue(requires_tenant("/api/core/tenant-memberships/", "get"))
        # Bootstrap endpoints: the client calls them before it knows a tenant.
        self.assertFalse(requires_tenant("/api/core/auth/me/", "get"))
        self.assertFalse(requires_tenant("/api/core/tenants/", "get"))


class TenantUsersApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.admin = User.objects.create_user(
            email="admin@example.com", password="pw", is_staff=True
        )
        self.member = User.objects.create_user(
            email="member@example.com", full_name="Existing Member"
        )
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.member, is_default=True
        )
        self.available_users = [
            User.objects.create_user(
                email=f"user-{index:02d}@example.com", full_name=f"User {index:02d}"
            )
            for index in range(25)
        ]
        self.client.force_authenticate(self.admin)

    def test_available_users_are_filtered_searched_and_paginated(self):
        url = f"/api/core/tenants/{self.tenant.pk}/users/"

        response = self.client.get(url, {"available_only": "1", "page": 1})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["count"], 26)  # the admin is also available
        self.assertEqual(len(response.data["results"]), 20)
        self.assertNotIn(
            self.member.pk, [user["id"] for user in response.data["results"]]
        )

        response = self.client.get(url, {"available_only": "1", "search": "User 24"})
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["full_count"], 26)
        self.assertEqual(response.data["results"][0]["id"], self.available_users[24].pk)

    def test_add_users_does_not_replace_existing_members(self):
        response = self.client.post(
            f"/api/core/tenants/{self.tenant.pk}/add-users/",
            {"user_ids": [self.available_users[0].pk]},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(
            TenantMembership.objects.filter(
                tenant=self.tenant, user=self.member
            ).exists()
        )
        self.assertTrue(
            TenantMembership.objects.filter(
                tenant=self.tenant, user=self.available_users[0]
            ).exists()
        )

    def test_nested_tenant_data_does_not_query_membership_counts(self):
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.available_users[0]
        )
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.available_users[1]
        )
        memberships = TenantMembership.objects.select_related("tenant", "user").filter(
            tenant=self.tenant
        )

        with self.assertNumQueries(1):
            data = TenantMembershipSerializer(memberships, many=True).data

        self.assertEqual(len(data), 3)
        self.assertNotIn("user_count", data[0]["tenant_data"])

    def test_delete_error_exposes_stable_translation_code(self):
        response = self.client.delete(f"/api/core/tenants/{self.tenant.pk}/")

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["code"], "tenant_has_related_data")
        self.assertEqual(response.data["params"], {"name": self.tenant.name})
        self.assertIn("detail", response.data)

    def test_remove_missing_user_error_exposes_stable_translation_code(self):
        user = self.available_users[0]
        response = self.client.post(
            f"/api/core/tenants/{self.tenant.pk}/remove-user/",
            {"user_id": user.pk},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(response.data["code"], "user_not_associated_with_tenant")
        self.assertEqual(response.data["params"], {"name": user.full_name})


class TenantMembershipApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.other_tenant = Tenant.objects.create(name="Tenant B", slug="tenant-b")
        self.user = User.objects.create_user(email="user@example.com")
        self.default_membership = TenantMembership.objects.create(
            tenant=self.tenant, user=self.user, is_default=True
        )
        self.other_membership = TenantMembership.objects.create(
            tenant=self.other_tenant, user=self.user
        )

    def test_non_staff_cannot_create_memberships(self):
        admin = get_user_model().objects.create_user(email="admin@example.com")
        admin.permissions = ["auth_core.WRITE_USERS"]
        admin.save(update_fields=["permissions"])
        TenantMembership.objects.create(tenant=self.tenant, user=admin, is_default=True)
        outsider = get_user_model().objects.create_user(email="out@example.com")
        self.client.force_authenticate(admin)

        response = self.client.post(
            "/api/core/tenant-memberships/",
            {"user": outsider.pk},
            format="json",
            HTTP_X_TENANT_ID=str(self.tenant.pk),
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(TenantMembership.objects.filter(user=outsider).exists())

    def test_deleting_default_membership_keeps_a_default(self):
        staff = get_user_model().objects.create_user(email="staff@example.com")
        staff.is_staff = True
        staff.save(update_fields=["is_staff"])
        self.client.force_authenticate(staff)

        response = self.client.post(
            "/api/core/tenant-memberships/bulk-delete/",
            {"ids": [self.default_membership.pk]},
            format="json",
            HTTP_X_TENANT_ID=str(self.tenant.pk),
        )

        self.assertEqual(response.status_code, 204, response.content)
        self.other_membership.refresh_from_db()
        self.assertTrue(self.other_membership.is_default)

    def test_first_membership_becomes_default(self):
        staff = get_user_model().objects.create_user(email="staff@example.com")
        staff.is_staff = True
        staff.save(update_fields=["is_staff"])
        newcomer = get_user_model().objects.create_user(email="new@example.com")
        self.client.force_authenticate(staff)

        response = self.client.post(
            "/api/core/tenant-memberships/",
            {"tenant": self.tenant.pk, "user": newcomer.pk, "is_default": False},
            format="json",
            HTTP_X_TENANT_ID=str(self.tenant.pk),
        )

        self.assertEqual(response.status_code, 201, response.content)
        self.assertTrue(TenantMembership.objects.get(user=newcomer).is_default)


class TenantAdminMembershipTests(TestCase):
    def test_moving_a_membership_keeps_a_default_for_the_previous_user(self):
        User = get_user_model()
        admin = User.objects.create_superuser(email="root@example.com", password="pw")
        tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        other_tenant = Tenant.objects.create(name="Tenant B", slug="tenant-b")
        previous = User.objects.create_user(email="previous@example.com")
        newcomer = User.objects.create_user(email="newcomer@example.com")
        moved = TenantMembership.objects.create(
            tenant=tenant, user=previous, is_default=True
        )
        remaining = TenantMembership.objects.create(tenant=other_tenant, user=previous)
        self.client.force_login(admin)

        response = self.client.post(
            reverse("admin:tenants_tenant_change", args=[tenant.pk]),
            {
                "name": tenant.name,
                "slug": tenant.slug,
                "is_active": "on",
                "memberships-TOTAL_FORMS": "1",
                "memberships-INITIAL_FORMS": "1",
                "memberships-MIN_NUM_FORMS": "0",
                "memberships-MAX_NUM_FORMS": "1000",
                "memberships-0-id": str(moved.pk),
                "memberships-0-tenant": str(tenant.pk),
                "memberships-0-user": str(newcomer.pk),
                "memberships-0-is_default": "on",
            },
        )

        self.assertEqual(response.status_code, 302, response.content[:2000])
        remaining.refresh_from_db()
        self.assertTrue(remaining.is_default)
