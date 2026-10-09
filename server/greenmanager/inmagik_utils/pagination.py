from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Standard API pagination with an optional unfiltered total count.

    ``full_count`` is set on the paginator by the calling view (see
    ``StandardPaginationMixin``): it counts the context of the list, while
    ``count`` counts the filtered results.
    """

    page_size = 20

    def set_full_count(self, full_count):
        self.full_count = full_count

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "full_count": getattr(self, "full_count", None),
                "page_size": self.page_size,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema):
        example_url = "http://api.example.org/accounts/?{page_query_param}={page}"
        return {
            "type": "object",
            "required": ["count", "results"],
            "properties": {
                "count": {
                    "type": "integer",
                    "example": 123,
                },
                "full_count": {
                    "type": "integer",
                    "nullable": True,
                    "example": 123,
                },
                "page_size": {
                    "type": "integer",
                    "example": self.page_size,
                },
                "next": {
                    "type": "string",
                    "nullable": True,
                    "format": "uri",
                    "example": example_url.format(
                        page_query_param=self.page_query_param, page=4
                    ),
                },
                "previous": {
                    "type": "string",
                    "nullable": True,
                    "format": "uri",
                    "example": example_url.format(
                        page_query_param=self.page_query_param, page=2
                    ),
                },
                "results": schema,
            },
        }


class HugePagination(StandardPagination):
    page_size = 10000


class StandardPaginationMixin:
    pagination_class = StandardPagination

    def set_full_count_queryset(self, queryset):
        """
        Allow a view/action to declare which queryset should be used to
        compute ``full_count`` (e.g. when paginating a queryset different
        from ``self.get_queryset()``, like a custom detail action).
        """
        self._full_count_queryset = queryset

    def get_full_count_queryset(self):
        queryset = getattr(self, "_full_count_queryset", None)
        return queryset if queryset is not None else self.get_queryset()

    def get_paginated_response(self, data):
        assert self.paginator is not None
        self.paginator.set_full_count(self.get_full_count_queryset().count())
        return super().get_paginated_response(data)


class HugePaginationMixin(StandardPaginationMixin):
    pagination_class = HugePagination
