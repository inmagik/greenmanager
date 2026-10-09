import threading

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework.test import APITestCase
from tenants.models import Tenant, TenantMembership

from .models import Role
from .permission_manager import PermissionManager


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


class TenantScopedUsersTests(APITestCase):
    """Users and roles seen and changed from one tenant leave the others intact."""

    def setUp(self):
        User = get_user_model()
        self.tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.other_tenant = Tenant.objects.create(name="Tenant B", slug="tenant-b")
        self.role = Role.objects.create(tenant=self.tenant, name="Operators")
        self.other_role = Role.objects.create(
            tenant=self.other_tenant,
            name="Administrators",
            permissions=["auth_core.SCRITTURA_RUOLI"],
        )
        self.admin = User.objects.create_user(email="admin@example.com")
        self.admin.permissions = [
            "auth_core.LETTURA_UTENTI",
            "auth_core.SCRITTURA_UTENTI",
        ]
        self.admin.save(update_fields=["permissions"])
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.admin, is_default=True
        )
        self.user = User.objects.create_user(email="user@example.com")
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.user, is_default=True
        )
        self.user.roles.add(self.role)
        self.shared = User.objects.create_user(email="shared@example.com")
        TenantMembership.objects.create(
            tenant=self.tenant, user=self.shared, is_default=True
        )
        TenantMembership.objects.create(tenant=self.other_tenant, user=self.shared)
        self.shared.roles.add(self.role, self.other_role)
        self.client.force_authenticate(self.admin)
        self.tenant_header = {"HTTP_X_TENANT_ID": str(self.tenant.pk)}

    def grant_role_permission(self):
        self.admin.permissions.append("auth_core.SCRITTURA_RUOLI")
        self.admin.save(update_fields=["permissions"])

    def user_url(self, user):
        return f"/api/core/auth/users/{user.pk}/"

    def test_deactivate_with_unchanged_roles_needs_only_user_permission(self):
        current = self.client.get(self.user_url(self.user), **self.tenant_header).data
        self.assertEqual(current["roles"], [self.role.pk])

        response = self.client.patch(
            self.user_url(self.user),
            {**current, "is_active": False},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

    def test_shows_only_roles_and_memberships_of_current_tenant(self):
        response = self.client.get(self.user_url(self.shared), **self.tenant_header)

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["roles"], [self.role.pk])
        self.assertEqual([r["id"] for r in response.data["roles_data"]], [self.role.pk])
        self.assertEqual(response.data["tenants"], [self.tenant.pk])
        self.assertNotIn("auth_core.SCRITTURA_RUOLI", response.data["all_permissions"])

    def test_cannot_assign_role_of_other_tenant(self):
        self.grant_role_permission()

        response = self.client.patch(
            self.user_url(self.user),
            {"roles": [self.other_role.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(self.user.roles.filter(pk=self.other_role.pk).exists())

    def test_update_keeps_roles_of_other_tenants(self):
        self.grant_role_permission()

        response = self.client.patch(
            self.user_url(self.shared),
            {"roles": []},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(
            list(self.shared.roles.values_list("pk", flat=True)), [self.other_role.pk]
        )

    def test_cannot_deactivate_or_delete_user_shared_with_other_tenants(self):
        deactivate = self.client.patch(
            self.user_url(self.shared),
            {"is_active": False},
            format="json",
            **self.tenant_header,
        )
        delete = self.client.delete(self.user_url(self.shared), **self.tenant_header)
        bulk_delete = self.client.post(
            "/api/core/auth/users/bulk-delete/",
            {"ids": [self.shared.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(deactivate.status_code, 400, deactivate.content)
        self.assertEqual(delete.status_code, 400, delete.content)
        self.assertEqual(bulk_delete.status_code, 400, bulk_delete.content)
        self.shared.refresh_from_db()
        self.assertTrue(self.shared.is_active)

    def test_grant_to_accepts_only_members_of_current_tenant(self):
        self.grant_role_permission()
        outsider = get_user_model().objects.create_user(email="out@example.com")
        TenantMembership.objects.create(
            tenant=self.other_tenant, user=outsider, is_default=True
        )

        response = self.client.post(
            f"/api/core/auth/roles/{self.role.pk}/grant_to/",
            {"user_ids": [outsider.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(outsider.roles.filter(pk=self.role.pk).exists())

    def test_revoke_from_removes_role(self):
        self.grant_role_permission()

        response = self.client.post(
            f"/api/core/auth/roles/{self.role.pk}/revoke_from/",
            {"user_ids": [self.user.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(self.user.roles.filter(pk=self.role.pk).exists())

    def test_revoke_from_requires_role_permission(self):
        response = self.client.post(
            f"/api/core/auth/roles/{self.role.pk}/revoke_from/",
            {"user_ids": [self.user.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)


class PermissionManagerTests(SimpleTestCase):
    def test_concurrent_collection_does_not_duplicate_permissions(self):
        manager = PermissionManager()

        threads = [
            threading.Thread(target=manager.collect_permissions) for _ in range(8)
        ]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        codes = [permission["code"] for permission in manager.permissions]
        self.assertEqual(len(codes), len(set(codes)))
