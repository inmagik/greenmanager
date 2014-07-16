from django.conf.urls import patterns, include, url
from rest_framework import routers
from rest_api import views

from django.contrib import admin
admin.autodiscover()

router = routers.DefaultRouter()
router.register(r'territory', views.TerritoryViewSet)
router.register(r'pointvegetation', views.PointVegetationViewSet)
router.register(r'areavegetation', views.AreaVegetationViewSet)
router.register(r'vegetationstate', views.VegetationStateViewSet)

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'greenmanager.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
)

