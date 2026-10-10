from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AvailablePermissionsView,
    MeView,
    RolesViewset,
    TokenObtainPairView,
    UsersViewset,
)

router = DefaultRouter()
router.register(r"users", UsersViewset, basename="user")
router.register(r"roles", RolesViewset, basename="role")

urlpatterns = router.urls + [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path(
        "permissions/", AvailablePermissionsView.as_view(), name="available_permissions"
    ),
]
