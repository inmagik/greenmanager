from rest_framework import routers
from rest_api import views

router = routers.DefaultRouter()
router.register(r'territory', views.TerritoryViewSet)
router.register(r'pointvegetation', views.PointVegetationViewSet)
router.register(r'areavegetation', views.AreaVegetationViewSet)
router.register(r'vegetationstate', views.VegetationStateViewSet)

urlpatterns = router.urls