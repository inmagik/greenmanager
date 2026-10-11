from rest_framework.routers import DefaultRouter

from .views import ElementViewSet

router = DefaultRouter()
router.register(r"elements", ElementViewSet, basename="element")

urlpatterns = router.urls
