from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from tenants.models import Tenant, TenantMembership

from .models import Role


class UsersApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="pw12345!",
        )
        self.admin.permissions = ["auth_core.SCRITTURA_UTENTI"]
        self.admin.save(update_fields=["permissions"])
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.admin, is_default=True
        )
        self.client.force_authenticate(self.admin)
        self.tenant_header = {"HTTP_X_TENANT_ID": str(self.tenant.pk)}

    def test_create_user_assigns_current_tenant_as_default_membership(self):
        response = self.client.post(
            "/api/core/auth/users/",
            {"full_name": "New User", "email": "new@example.com"},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 201, response.content)
        created_user = get_user_model().objects.get(email="new@example.com")
        self.assertTrue(
            TenantMembership.objects.filter(
                tenant=self.tenant,
                user=created_user,
                is_default=True,
            ).exists()
        )

    def test_cannot_assign_permissions_when_creating_user_without_role_permission(
        self,
    ):
        response = self.client.post(
            "/api/core/auth/users/",
            {
                "full_name": "Privileged User",
                "email": "privileged@example.com",
                "permissions": ["auth_core.SCRITTURA_RUOLI"],
            },
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(
            get_user_model().objects.filter(email="privileged@example.com").exists()
        )

    def test_cannot_self_assign_permissions_without_role_permission(self):
        response = self.client.patch(
            f"/api/core/auth/users/{self.admin.pk}/",
            {"permissions": ["auth_core.SCRITTURA_RUOLI"]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.admin.refresh_from_db()
        self.assertNotIn("auth_core.SCRITTURA_RUOLI", self.admin.permissions)

    def test_cannot_assign_roles_without_role_permission(self):
        role = Role.objects.create(
            tenant=self.tenant,
            name="Administrators",
            permissions=["auth_core.SCRITTURA_RUOLI"],
        )

        response = self.client.patch(
            f"/api/core/auth/users/{self.admin.pk}/",
            {"roles": [role.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(self.admin.roles.filter(pk=role.pk).exists())

    def test_role_manager_can_assign_roles_and_permissions(self):
        self.admin.permissions.append("auth_core.SCRITTURA_RUOLI")
        self.admin.save(update_fields=["permissions"])
        role = Role.objects.create(tenant=self.tenant, name="Operators")
        user = get_user_model().objects.create_user(email="user@example.com")
        TenantMembership.objects.create(tenant=self.tenant, user=user, is_default=True)

        response = self.client.patch(
            f"/api/core/auth/users/{user.pk}/",
            {
                "roles": [role.pk],
                "permissions": ["auth_core.LETTURA_UTENTI"],
            },
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        user.refresh_from_db()
        self.assertEqual(list(user.roles.values_list("pk", flat=True)), [role.pk])
        self.assertEqual(user.permissions, ["auth_core.LETTURA_UTENTI"])

    def test_superuser_manages_users_and_roles_without_permissions(self):
        superuser = get_user_model().objects.create_user(
            email="superuser@example.com",
            password="pw12345!",
        )
        superuser.is_superuser = True
        superuser.is_staff = True
        superuser.save(update_fields=["is_superuser", "is_staff"])
        self.client.force_authenticate(superuser)

        roles = self.client.get("/api/core/auth/roles/", **self.tenant_header)
        self.assertEqual(roles.status_code, 200, roles.content)

        created = self.client.post(
            "/api/core/auth/users/",
            {"full_name": "User Super", "email": "user-super@example.com"},
            format="json",
            **self.tenant_header,
        )
        self.assertEqual(created.status_code, 201, created.content)
