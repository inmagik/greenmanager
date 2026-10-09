from rest_framework.routers import DefaultRouter
from tenants.views import TenantMembershipViewSet, TenantViewSet

router = DefaultRouter()
router.register(r"tenants", TenantViewSet, basename="tenant")
router.register(
    r"tenant-memberships", TenantMembershipViewSet, basename="tenant-membership"
)

urlpatterns = router.urls
