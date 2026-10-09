from rest_framework.permissions import BasePermission


class RuntimePermission(BasePermission):
    permission_code = None

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return self.permission_code in getattr(user, "all_permissions", [])


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
