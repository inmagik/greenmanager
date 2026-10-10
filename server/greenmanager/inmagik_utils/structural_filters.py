from collections import OrderedDict

from django.db.models import QuerySet
from django_filters import FilterSet, utils
from django_filters.rest_framework import DjangoFilterBackend

STRUCTURAL_FILTER_PREFIX = "_sf_"


class StructuralFilterSet(FilterSet):
    mode = "auto"  # can be "auto" or "structural"

    def _is_applicable(self, field_name):
        has_prefix = field_name.startswith(STRUCTURAL_FILTER_PREFIX)
        is_structural = self.mode == "structural"
        return has_prefix == is_structural

    def filter_queryset(self, queryset):
        for name, value in self.form.cleaned_data.items():
            if not self._is_applicable(name):
                continue
            queryset = self.filters[name].filter(queryset, value)
            assert isinstance(
                queryset, QuerySet
            ), "Expected '%s.%s' to return a QuerySet, but got a %s instead." % (
                type(self).__name__,
                name,
                type(queryset).__name__,
            )
        return queryset

    @classmethod
    def get_filters(cls):
        filters = super().get_filters()
        fields = list(filters.keys())
        for key in fields:
            filters[f"{STRUCTURAL_FILTER_PREFIX}{key}"] = filters[key]
        return filters

    @property
    def struct_qs(self):
        if not hasattr(self, "_struct_qs"):
            qs = self.queryset.all()
            if self.is_bound:
                # ensure form validation before filtering
                self.errors
                qs = self.filter_queryset(qs)
            self._struct_qs = qs
        return self._struct_qs

    def get_form_class(self):
        """
        Returns a django Form suitable of validating the filterset data.

        This method should be overridden if the form class needs to be
        customized relative to the filterset instance.
        """
        fields = OrderedDict(
            [
                (name, filter_.field)
                for name, filter_ in self.filters.items()
                if self._is_applicable(name)
            ]
        )

        return type(str("%sForm" % self.__class__.__name__), (self._meta.form,), fields)


class StructFilterImpl(DjangoFilterBackend):
    filterset_base = StructuralFilterSet

    def filter_queryset_structural(self, request, queryset, view):
        filterset = self.get_filterset(request, queryset, view)
        if filterset is None:
            return queryset

        filterset.mode = "structural"

        if not filterset.is_valid() and self.raise_exception:
            raise utils.translate_validation(filterset.errors)
        return filterset.struct_qs


class StructuralFilterMixin:
    def get_queryset(self):
        if hasattr(self, "_structural_filtered_queryset"):
            return self._structural_filtered_queryset
        qs = super().get_queryset()
        backend = StructFilterImpl()
        self._structural_filtered_queryset = backend.filter_queryset_structural(
            self.request, qs, self
        )
        return self._structural_filtered_queryset
