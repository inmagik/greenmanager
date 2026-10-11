from rest_framework.routers import DefaultRouter

from .views import AreaViewSet, ZoneViewSet

router = DefaultRouter()
router.register(r"zones", ZoneViewSet, basename="zone")
router.register(r"areas", AreaViewSet, basename="area")

urlpatterns = router.urls
