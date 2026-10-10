from rest_framework.exceptions import NotFound
from rest_framework.serializers import ValidationError
from tenants.models import Tenant


class TenantContextMixin:
    tenant_header = "HTTP_X_TENANT_ID"

    def get_current_tenant(self):
        # Read once per request: permissions, queryset and serializer all use it.
        if not hasattr(self, "_current_tenant"):
            self._current_tenant = self._find_current_tenant()
        return self._current_tenant

    def _find_current_tenant(self):
        tenant_id = self.request.META.get(
            self.tenant_header
        ) or self.request.query_params.get("tenant")
        if not tenant_id:
            return None
        qs = Tenant.objects.all()
        user = self.request.user
        if not getattr(user, "is_staff", False):
            qs = qs.filter(memberships__user=user)
        try:
            return qs.get(pk=tenant_id)
        except (Tenant.DoesNotExist, ValueError, TypeError) as exc:
            raise NotFound(
                {"code": "tenant_not_found", "detail": "Tenant not found."}
            ) from exc

    def restrict_queryset_without_tenant(self, qs):
        user = self.request.user
        if getattr(user, "is_authenticated", False) and not getattr(
            user, "is_staff", False
        ):
            return qs.none()
        if hasattr(qs.model, "tenant_id"):
            return qs.none()
        return qs


class TenantScopedViewSetMixin(TenantContextMixin):
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = self.get_current_tenant()
        if tenant is None:
            return self.restrict_queryset_without_tenant(qs)
        return qs.filter(tenant=tenant)

    def perform_create(self, serializer):
        has_tenant_field = any(
            field.name == "tenant" for field in serializer.Meta.model._meta.fields
        )
        if not has_tenant_field:
            serializer.save()
            return

        tenant = self.get_current_tenant()
        if tenant is None:
            raise ValidationError(
                {
                    "tenant": {
                        "code": "tenant_required",
                        "detail": "A tenant is required.",
                    }
                }
            )
        else:
            serializer.save(tenant=tenant)
