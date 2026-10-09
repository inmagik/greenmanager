from django.conf import settings
from django.db import models


class Tenant(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=80, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TenantMembership(models.Model):
    tenant = models.ForeignKey(
        Tenant, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_memberships",
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "user"], name="unique_tenant_membership"
            ),
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(is_default=True),
                name="unique_default_tenant_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.user} @ {self.tenant}"


class TenantScopedQuerySet(models.QuerySet):
    def for_tenant(self, tenant):
        if tenant is None:
            return self.none()
        return self.filter(tenant=tenant)


class TenantScopedModel(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
        db_index=True,
    )

    objects = TenantScopedQuerySet.as_manager()

    class Meta:
        abstract = True
