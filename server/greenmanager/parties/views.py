import django_filters as FS
from auth_core.utils import ActionPermission
from core.serializers import pop_revision
from core.views import (
    AuditHistoryActionMixin,
    ChoicesActionMixin,
    ClientScopedViewSetMixin,
)
from django_filters.rest_framework import DjangoFilterBackend
from inmagik_utils.audit_log.audit_log_mixins import AuditlogActorMixin
from inmagik_utils.pagination import StandardPaginationMixin
from inmagik_utils.structural_filters import StructuralFilterMixin, StructuralFilterSet
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet

from . import services
from .models import Client
from .serializers import ClientChoiceSerializer, ClientSerializer

READ_CLIENTS = "parties.READ_CLIENTS"
WRITE_CLIENTS = "parties.WRITE_CLIENTS"


class ClientFilter(StructuralFilterSet):
    active = FS.BooleanFilter()
    kind = FS.ChoiceFilter(choices=Client.Kind.choices)


class ClientViewSet(
    AuditlogActorMixin,
    ClientScopedViewSetMixin,
    StandardPaginationMixin,
    StructuralFilterMixin,
    AuditHistoryActionMixin,
    ChoicesActionMixin,
    ModelViewSet,
):
    queryset = Client.objects.select_related(
        "managing_organization", "created_by", "updated_by"
    )
    serializer_class = ClientSerializer
    choice_serializer_class = ClientChoiceSerializer
    permission_classes = [ActionPermission]
    action_permissions = {
        "list": [READ_CLIENTS],
        "retrieve": [READ_CLIENTS],
        "history": [READ_CLIENTS],
        "choices": [READ_CLIENTS],
        "create": [WRITE_CLIENTS],
        "update": [WRITE_CLIENTS],
        "partial_update": [WRITE_CLIENTS],
        "destroy": [WRITE_CLIENTS],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ClientFilter
    search_fields = ["name", "tax_code", "istat_code"]
    ordering_fields = ["name", "kind", "created_at", "updated_at"]

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        pop_revision(data)
        serializer.instance = services.create_client(data, self.get_change_context())

    def perform_update(self, serializer):
        data = dict(serializer.validated_data)
        expected_revision = pop_revision(data)
        serializer.instance = services.update_client(
            serializer.instance,
            data,
            self.get_change_context(),
            expected_revision=expected_revision,
        )

    def perform_destroy(self, instance):
        services.delete_client(instance, self.get_change_context())
