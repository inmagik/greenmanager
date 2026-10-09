from django.core.signals import setting_changed
from django.utils.module_loading import import_string


class PermissionManager:
    """
    Manages the collection and retrieval of permissions from all installed apps.
    Every app that needs to integrate with the permission system should define
    a fm_permissions.py file with a list of permissions in the following format:

    permissions = [
        {"name": "permission_name", "description": "Permission description"},
        ...
    ]
    """

    def __init__(self):
        self._permissions = []
        self._loaded = False

    @property
    def permissions(self):
        if not self._loaded:
            self.collect_permissions()
        return self._permissions

    def collect_permissions(self):
        from django.apps import apps

        # Build a local list and assign it at the end: concurrent first requests
        # would otherwise append to the same shared list and duplicate entries.
        permissions = []
        found_permission_codes = set()  # To track and avoid duplicate permission codes

        for app_config in apps.get_app_configs():
            try:
                permissions_defs_path = app_config.name + ".fm_permissions.permissions"
                declared_permissions = import_string(permissions_defs_path)
                for perm in declared_permissions:
                    perm_code = f"{app_config.label}.{perm['name']}"
                    if perm_code not in found_permission_codes:
                        permissions.append(
                            {
                                "module": app_config.name,
                                "name": perm["name"],
                                "description": perm["description"],
                                "code": perm_code,
                            }
                        )
                        found_permission_codes.add(perm_code)
            except (ImportError, AttributeError):
                continue
        self._permissions = permissions
        self._loaded = True


# Create a global instance of the PermissionManager to be used across the application.
permission_manager = PermissionManager()


# Reload the permissions when settings change.
def reload_permissions(*args, **kwargs):
    permission_manager.collect_permissions()


setting_changed.connect(reload_permissions)
