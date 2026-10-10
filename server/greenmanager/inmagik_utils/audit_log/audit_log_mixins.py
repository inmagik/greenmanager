from auditlog.context import set_actor
from auditlog.middleware import AuditlogMiddleware


class AuditlogActorMixin:
    """Set the authenticated DRF user as the actor of the logged changes."""

    _auditlog_actor_context = None

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)

        actor = request.user if request.user.is_authenticated else None
        self._auditlog_actor_context = set_actor(
            actor,
            remote_addr=AuditlogMiddleware._get_remote_addr(request),
            remote_port=AuditlogMiddleware._get_remote_port(request),
        )
        self._auditlog_actor_context.__enter__()

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        finally:
            if self._auditlog_actor_context is not None:
                self._auditlog_actor_context.__exit__(None, None, None)
                self._auditlog_actor_context = None
