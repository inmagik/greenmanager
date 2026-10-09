from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework.test import APITestCase
from tenants.models import Tenant, TenantMembership
from tenants.serializers import TenantMembershipSerializer

from greenmanager.schema import add_tenant_security_requirement


class TenantOpenApiSchemaTests(SimpleTestCase):
    def test_tenant_security_is_added_to_authenticated_operations(self):
        schema = {
            "paths": {
                "/api/example/": {
                    "get": {
                        "security": [
                            {"jwtAuth": []},
                            {"cookieAuth": []},
                        ],
                    },
                    "post": {"security": [{}]},
                },
            },
        }

        result = add_tenant_security_requirement(schema, None, None, False)

        self.assertEqual(
            result["paths"]["/api/example/"]["get"]["security"],
            [
                {"jwtAuth": [], "TenantId": []},
                {"cookieAuth": [], "TenantId": []},
            ],
        )
        self.assertEqual(result["paths"]["/api/example/"]["post"]["security"], [{}])


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
