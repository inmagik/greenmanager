from vegetation.models import Territory, PointVegetation, AreaVegetation, VegetationState
from rest_framework import serializers

from rest_framework_gis.serializers import GeoFeatureModelSerializer, GeometryField

class TerritoryGeoSerializer(GeoFeatureModelSerializer):
    
    class Meta:
        model = Territory
        geo_field = "geom"

class TerritorySerializer(serializers.ModelSerializer):
    geom = GeometryField()
    geojson = serializers.SerializerMethodField()

    def get_geojson(self, obj):
        s = TerritoryGeoSerializer(obj)
        return s.data
        
    class Meta:
        model = Territory
        

class VegetationStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VegetationState
        fields = ('revision', 'created','height', 'condition')


class PointVegetationSerializer(serializers.ModelSerializer):
    states = VegetationStateSerializer(many=True, read_only=True)
    last_state = VegetationStateSerializer(read_only=True)
    geom = GeometryField()
    class Meta:
        model = PointVegetation

class AreaVegetationSerializer(serializers.ModelSerializer):
    states = VegetationStateSerializer(many=True, read_only=True)
    last_state = VegetationStateSerializer(read_only=True)
    geom = GeometryField()
    class Meta:
        model = AreaVegetation
