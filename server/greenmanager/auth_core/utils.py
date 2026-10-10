from rest_framework.permissions import BasePermission


def tenant_permissions(user, tenant):
    """Permissions of ``user`` in ``tenant``: the direct ones plus those of the
    user's roles in that tenant. Without a tenant, only the direct ones.

    ``User.all_permissions`` joins the roles of every tenant: it is not used for
    authorization, or a role in one tenant would grant its permissions in another.
    """
    permissions = set(user.permissions)
    if tenant is not None:
        for role_permissions in user.roles.filter(tenant=tenant).values_list(
            "permissions", flat=True
        ):
            permissions.update(role_permissions)
    return permissions


def request_permissions(request, view):
    """Permissions of the user of the request in the tenant of the view.

    The tenant comes from ``get_current_tenant()`` of the view (TenantContextMixin);
    a view without it has no tenant. The result is kept on the request.
    """
    get_current_tenant = getattr(view, "get_current_tenant", None)
    tenant = get_current_tenant() if get_current_tenant is not None else None
    cache = getattr(request, "_tenant_permissions", None)
    if cache is None:
        cache = request._tenant_permissions = {}
    key = tenant.pk if tenant is not None else None
    if key not in cache:
        cache[key] = tenant_permissions(request.user, tenant)
    return cache[key]


class RuntimePermission(BasePermission):
    permission_code = None

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.permission_code in request_permissions(request, view)


class ActionPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method == "OPTIONS":
            return True
        if hasattr(view, "action_permissions"):
            permission_defs = view.action_permissions.get(view.action, [])
            if not permission_defs:
                raise NotImplementedError(
                    f"No permissions defined for action '{view.action}' "
                    f"in view '{view.__class__.__name__}'."
                )
            for permission_def in permission_defs:
                if isinstance(permission_def, str):
                    permission_def = create_runtime_permission_class(permission_def)
                if not permission_def().has_permission(request, view):
                    return False
            return True
        raise NotImplementedError(
            "ActionPermission requires the view to define "
            "an 'action_permissions' attribute."
        )


def create_runtime_permission_class(permission_code):
    return type(
        "CustomRuntimePermission",
        (RuntimePermission,),
        {"permission_code": permission_code},
    )
