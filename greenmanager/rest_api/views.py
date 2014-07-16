from vegetation.models import Territory, PointVegetation, AreaVegetation, VegetationState
from rest_framework import viewsets
from .serializers import TerritorySerializer, PointVegetationSerializer, VegetationStateSerializer, AreaVegetationSerializer


class TerritoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows territories to be viewed or edited.
    """
    queryset = Territory.objects.all()
    serializer_class = TerritorySerializer



class PointVegetationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows PointVegetation to be viewed or edited.
    """
    queryset = PointVegetation.objects.all()
    serializer_class = PointVegetationSerializer


class VegetationStateViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows VegetationState to be viewed or edited.
    """
    queryset = VegetationState.objects.all()
    serializer_class = VegetationStateSerializer


class AreaVegetationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows VegetationState to be viewed or edited.
    """
    queryset = AreaVegetation.objects.all()
    serializer_class = AreaVegetationSerializer