from rest_framework.routers import DefaultRouter

from .views import (
    AreaUseViewSet,
    AttributeDefinitionViewSet,
    ElementClassViewSet,
    RemovalCauseViewSet,
    SpeciesViewSet,
    UrbanGreenTypeViewSet,
    UsageIntensityViewSet,
)

router = DefaultRouter()
router.register(r"species", SpeciesViewSet, basename="species")
router.register(r"element-classes", ElementClassViewSet, basename="element-class")
router.register(
    r"attribute-definitions",
    AttributeDefinitionViewSet,
    basename="attribute-definition",
)
router.register(
    r"urban-green-types", UrbanGreenTypeViewSet, basename="urban-green-type"
)
router.register(r"area-uses", AreaUseViewSet, basename="area-use")
router.register(r"usage-intensities", UsageIntensityViewSet, basename="usage-intensity")
router.register(r"removal-causes", RemovalCauseViewSet, basename="removal-cause")

urlpatterns = router.urls
