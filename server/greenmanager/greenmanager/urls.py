"""
URL configuration for the greenmanager project.

Each domain app is mounted under its own prefix, api/<app>/.
https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # django admin
    path(settings.DJANGO_ADMIN_PATH, admin.site.urls),
    # core apps
    path("api/userbase/", include("auth_core.account_urls")),
    path("api/core/auth/", include("auth_core.urls")),
    path("api/core/", include("tenants.urls")),
    # domain apps
    path("api/catalogs/", include("catalogs.urls")),
    path("api/parties/", include("parties.urls")),
    # swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
