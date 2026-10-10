import threading

from axes.models import AccessAttempt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import SimpleTestCase, TestCase
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
        self.admin.permissions = ["auth_core.WRITE_USERS"]
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

    def test_activation_email_waits_for_the_commit(self):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(
                "/api/core/auth/users/",
                {"full_name": "New User", "email": "new@example.com"},
                format="json",
                **self.tenant_header,
            )
            self.assertEqual(len(mail.outbox), 0)

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(len(callbacks), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["new@example.com"])

    def test_cannot_assign_permissions_when_creating_user_without_role_permission(
        self,
    ):
        response = self.client.post(
            "/api/core/auth/users/",
            {
                "full_name": "Privileged User",
                "email": "privileged@example.com",
                "permissions": ["auth_core.WRITE_ROLES"],
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
            {"permissions": ["auth_core.WRITE_ROLES"]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.admin.refresh_from_db()
        self.assertNotIn("auth_core.WRITE_ROLES", self.admin.permissions)

    def test_cannot_assign_roles_without_role_permission(self):
        role = Role.objects.create(
            tenant=self.tenant,
            name="Administrators",
            permissions=["auth_core.WRITE_ROLES"],
        )

        response = self.client.patch(
            f"/api/core/auth/users/{self.admin.pk}/",
            {"roles": [role.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertFalse(self.admin.roles.filter(pk=role.pk).exists())

    def test_role_manager_can_assign_roles(self):
        self.admin.permissions.append("auth_core.WRITE_ROLES")
        self.admin.save(update_fields=["permissions"])
        role = Role.objects.create(tenant=self.tenant, name="Operators")
        user = get_user_model().objects.create_user(email="user@example.com")
        TenantMembership.objects.create(tenant=self.tenant, user=user, is_default=True)

        response = self.client.patch(
            f"/api/core/auth/users/{user.pk}/",
            {"roles": [role.pk]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        user.refresh_from_db()
        self.assertEqual(list(user.roles.values_list("pk", flat=True)), [role.pk])

    def test_only_staff_assigns_direct_permissions(self):
        self.admin.permissions.append("auth_core.WRITE_ROLES")
        self.admin.save(update_fields=["permissions"])
        user = get_user_model().objects.create_user(email="user@example.com")
        TenantMembership.objects.create(tenant=self.tenant, user=user, is_default=True)
        url = f"/api/core/auth/users/{user.pk}/"
        payload = {"permissions": ["auth_core.READ_USERS"]}

        as_role_manager = self.client.patch(
            url, payload, format="json", **self.tenant_header
        )
        self.admin.is_staff = True
        self.admin.save(update_fields=["is_staff"])
        as_staff = self.client.patch(url, payload, format="json", **self.tenant_header)

        self.assertEqual(as_role_manager.status_code, 400, as_role_manager.content)
        self.assertEqual(
            as_role_manager.data["permissions"]["code"],
            "direct_permissions_staff_only",
        )
        self.assertEqual(as_staff.status_code, 200, as_staff.content)
        user.refresh_from_db()
        self.assertEqual(user.permissions, ["auth_core.READ_USERS"])

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
            permissions=["auth_core.WRITE_ROLES"],
        )
        self.admin = User.objects.create_user(email="admin@example.com")
        self.admin.permissions = [
            "auth_core.READ_USERS",
            "auth_core.WRITE_USERS",
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
        self.admin.permissions.append("auth_core.WRITE_ROLES")
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
        self.assertNotIn("auth_core.WRITE_ROLES", response.data["all_permissions"])

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

    def give_admin_role_writer_in_other_tenant(self):
        TenantMembership.objects.create(tenant=self.other_tenant, user=self.admin)
        self.admin.roles.add(self.other_role)

    def test_role_permissions_hold_only_in_their_tenant(self):
        self.give_admin_role_writer_in_other_tenant()

        in_tenant = self.client.post(
            "/api/core/auth/roles/",
            {"name": "New role", "permissions": []},
            format="json",
            **self.tenant_header,
        )
        in_other_tenant = self.client.post(
            "/api/core/auth/roles/",
            {"name": "New role", "permissions": []},
            format="json",
            HTTP_X_TENANT_ID=str(self.other_tenant.pk),
        )

        self.assertEqual(in_tenant.status_code, 403, in_tenant.content)
        self.assertEqual(in_other_tenant.status_code, 201, in_other_tenant.content)

    def test_role_writer_of_other_tenant_cannot_change_roles_here(self):
        self.give_admin_role_writer_in_other_tenant()

        response = self.client.patch(
            self.user_url(self.user),
            {"roles": []},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 403, response.content)
        self.assertTrue(self.user.roles.filter(pk=self.role.pk).exists())

    def test_cannot_change_direct_permissions_of_shared_user(self):
        self.grant_role_permission()

        response = self.client.patch(
            self.user_url(self.shared),
            {"permissions": ["auth_core.WRITE_USERS"]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(
            response.data["permissions"]["code"], "direct_permissions_staff_only"
        )
        self.shared.refresh_from_db()
        self.assertEqual(self.shared.permissions, [])

    def test_cannot_change_email_of_user_shared_with_other_tenants(self):
        response = self.client.patch(
            self.user_url(self.shared),
            {"email": "attacker@example.com"},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(
            response.data["email"]["code"], "user_shared_with_other_tenants"
        )
        self.shared.refresh_from_db()
        self.assertEqual(self.shared.email, "shared@example.com")

    def test_staff_changes_email_of_shared_user(self):
        self.admin.is_staff = True
        self.admin.save(update_fields=["is_staff"])

        response = self.client.patch(
            self.user_url(self.shared),
            {"email": "renamed@example.com"},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.shared.refresh_from_db()
        self.assertEqual(self.shared.email, "renamed@example.com")

    def test_cannot_deactivate_or_delete_own_account(self):
        deactivate = self.client.patch(
            self.user_url(self.admin),
            {"is_active": False},
            format="json",
            **self.tenant_header,
        )
        delete = self.client.delete(self.user_url(self.admin), **self.tenant_header)

        self.assertEqual(deactivate.status_code, 400, deactivate.content)
        self.assertEqual(
            deactivate.data["is_active"]["code"], "cannot_change_own_account"
        )
        self.assertEqual(delete.data["code"], "cannot_change_own_account")
        self.assertEqual(delete.status_code, 400, delete.content)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_rejects_unknown_permissions(self):
        self.grant_role_permission()

        user_response = self.client.patch(
            self.user_url(self.user),
            {"permissions": ["auth_core.NOT_A_PERMISSION"]},
            format="json",
            **self.tenant_header,
        )
        role_response = self.client.post(
            "/api/core/auth/roles/",
            {"name": "Bogus", "permissions": ["auth_core.NOT_A_PERMISSION"]},
            format="json",
            **self.tenant_header,
        )

        self.assertEqual(user_response.status_code, 400, user_response.content)
        self.assertEqual(role_response.status_code, 400, role_response.content)
        self.assertFalse(Role.objects.filter(name="Bogus").exists())

    def test_lock_uses_the_highest_failure_count(self):
        # Axes keeps one row per username and IP: any of them can be at the limit.
        for ip, failures in (
            ("10.0.0.1", 1),
            ("10.0.0.2", settings.AXES_FAILURE_LIMIT),
        ):
            AccessAttempt.objects.create(
                username=self.user.email,
                ip_address=ip,
                user_agent="test",
                failures_since_start=failures,
            )

        response = self.client.get(self.user_url(self.user), **self.tenant_header)

        self.assertTrue(response.data["is_locked"])

    def test_unlock_returns_the_unlocked_user(self):
        AccessAttempt.objects.create(
            username=self.user.email,
            ip_address="127.0.0.1",
            user_agent="test",
            failures_since_start=settings.AXES_FAILURE_LIMIT,
        )
        locked = self.client.get(self.user_url(self.user), **self.tenant_header)
        self.assertTrue(locked.data["is_locked"])

        response = self.client.post(
            f"{self.user_url(self.user)}unlock/", **self.tenant_header
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(response.data["is_locked"])
        self.assertEqual(response.data["status"], "active")


class RolePermissionsReceiverTests(TestCase):
    def setUp(self):
        tenant = Tenant.objects.create(name="Tenant A", slug="tenant-a")
        self.role = Role.objects.create(
            tenant=tenant, name="Readers", permissions=["auth_core.READ_USERS"]
        )
        self.user = get_user_model().objects.create_user(email="user@example.com")

    def test_changes_from_the_role_side_update_user_permissions(self):
        self.role.user_set.add(self.user)
        self.user.refresh_from_db()
        self.assertEqual(self.user.all_permissions, ["auth_core.READ_USERS"])

        self.role.user_set.clear()
        self.user.refresh_from_db()
        self.assertEqual(self.user.all_permissions, [])


class AccountEndpointsTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", full_name="Old Name"
        )

    def test_locked_out_login_returns_account_locked(self):
        self.user.set_password("Correct-Pass-2026")
        self.user.save()
        AccessAttempt.objects.create(
            username=self.user.email,
            ip_address="127.0.0.1",
            user_agent="",
            failures_since_start=settings.AXES_FAILURE_LIMIT,
        )

        response = self.client.post(
            "/api/core/auth/token/",
            {"email": self.user.email, "password": "Correct-Pass-2026"},
            format="json",
            REMOTE_ADDR="127.0.0.1",
        )

        self.assertEqual(response.status_code, 429, response.content)
        self.assertEqual(response.data["code"], "account_locked")

    def test_login_sets_last_login(self):
        self.user.set_password("Correct-Pass-2026")
        self.user.save()

        response = self.client.post(
            "/api/core/auth/token/",
            {"email": self.user.email, "password": "Correct-Pass-2026"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login)

    def test_change_password_requires_authentication(self):
        response = self.client.put(
            "/api/userbase/change-password/",
            {"old_password": "x", "password": "y"},
            format="json",
        )

        self.assertEqual(response.status_code, 401, response.content)

    def test_userbase_me_and_resend_activation_are_not_exposed(self):
        self.client.force_authenticate(self.user)

        self.assertEqual(self.client.get("/api/userbase/me/").status_code, 404)
        self.assertEqual(
            self.client.post(
                "/api/userbase/resend-activation-email/",
                {"users": [self.user.pk]},
                format="json",
            ).status_code,
            404,
        )

    def test_me_patch_changes_only_the_name(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            "/api/core/auth/me/",
            {"full_name": "New Name", "email": "other@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["full_name"], "New Name")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "user@example.com")


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
