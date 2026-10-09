from drf_spectacular.openapi import AutoSchema
from tenants.mixins import TenantContextMixin


class TenantAwareAutoSchema(AutoSchema):
    """Require the X-Tenant-ID header (TenantId) only on tenant-scoped views.

    Bootstrap endpoints, such as `auth/me/` and `tenants/`, stay without it:
    a client calls them before it knows a tenant.
    """

    def get_auth(self):
        auth = super().get_auth()
        if not isinstance(self.view, TenantContextMixin):
            return auth
        # An empty requirement means anonymous access: it stays as it is.
        return [
            {**requirement, "TenantId": []} if requirement else requirement
            for requirement in auth
        ]
