from django.apps import AppConfig


class AuthCoreConfig(AppConfig):
    name = "auth_core"
    receivers_imported = False

    def ready(self):
        if not self.receivers_imported:
            self.receivers_imported = True
            from . import receivers  # noqa: F401
