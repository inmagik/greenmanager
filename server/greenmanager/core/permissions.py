from auth_core.utils import request_permissions
from rest_framework.permissions import BasePermission


def any_permission(*codes):
    """Permission class for ``action_permissions``: one of ``codes`` is enough.

    For instance the clients to pick in a form are readable by whoever reads
    the areas or the elements, not only the clients.
    """

    class AnyPermission(BasePermission):
        def has_permission(self, request, view):
            user = request.user
            if not user.is_authenticated:
                return False
            if user.is_superuser:
                return True
            return bool(set(codes) & request_permissions(request, view))

    AnyPermission.__name__ = "AnyPermission"
    return AnyPermission
