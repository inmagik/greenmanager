from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.conf import settings

from rest_framework import routers
from rest_api import views

from django.contrib import admin
admin.autodiscover()


urlpatterns =[
    # Examples:
    # url(r'^$', 'greenmanager.views.home', name='home'),
    url(r'', include('greenui.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/', include('rest_api.urls')),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]

urlpatterns = static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + urlpatterns