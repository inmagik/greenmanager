from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Building blocks of the domain apps: base models, history, errors, mixins."""

    name = "core"
    verbose_name = "Basi del dominio"

    def ready(self):
        from . import schema  # noqa: F401  (extensions of the OpenAPI schema)
