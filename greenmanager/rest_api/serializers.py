from vegetation.models import Territory, PointVegetation, AreaVegetation, VegetationState
from rest_framework import serializers


class TerritorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Territory
        

class VegetationStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VegetationState
        fields = ('revision', 'created','height', 'condition')


class PointVegetationSerializer(serializers.ModelSerializer):
    states = VegetationStateSerializer(many=True, read_only=True)
    last_state = VegetationStateSerializer(read_only=True)

    class Meta:
        model = PointVegetation

class AreaVegetationSerializer(serializers.ModelSerializer):
    states = VegetationStateSerializer(many=True, read_only=True)
    last_state = VegetationStateSerializer(read_only=True)

    class Meta:
        model = AreaVegetation
