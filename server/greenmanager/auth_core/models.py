from django.contrib.postgres.fields import ArrayField
from django.db import models
from userbase.models import AbstractUser


class User(AbstractUser):
    roles = models.ManyToManyField("Role", blank=True)
    tenants = models.ManyToManyField(
        "tenants.Tenant",
        through="tenants.TenantMembership",
        related_name="users",
        blank=True,
    )
    permissions = ArrayField(models.CharField(max_length=255), blank=True, default=list)
    all_permissions = ArrayField(
        models.CharField(max_length=255), blank=True, default=list
    )

    def update_permissions(self):
        permissions = set(self.permissions)  # Start with direct permissions
        for role in self.roles.all():
            permissions.update(role.permissions)  # Add permissions from each role
        if permissions != set(self.all_permissions):
            self.all_permissions = list(permissions)
            self.save(update_fields=["all_permissions"])


class Role(models.Model):
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.PROTECT,
        related_name="roles",
        db_index=True,
    )
    name = models.CharField(max_length=255)
    permissions = ArrayField(models.CharField(max_length=255), blank=True, default=list)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "name"],
                name="unique_role_name_per_tenant",
            ),
        ]

    def __str__(self):
        return self.name
