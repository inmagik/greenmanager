from django.apps import AppConfig


class JobsCoreConfig(AppConfig):
    name = "jobs_core"
    receivers_loaded = False

    def ready(self):
        if not self.receivers_loaded:
            # Import the receivers module to ensure signal handlers are registered
            from . import receivers  # noqa: F401

            self.receivers_loaded = True
