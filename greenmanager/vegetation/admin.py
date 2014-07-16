from django.contrib.gis import admin
from django.contrib.contenttypes.admin import GenericTabularInline

from .models import Territory
from .models import PointVegetation, AreaVegetation
from .models import VegetationState


class StateItemInline(GenericTabularInline):
    readonly_fields = ('revision',)

    
class VegetationStateInline(StateItemInline):
    model = VegetationState


class PointVegetationAdmin(admin.GeoModelAdmin):
    inlines = [
        VegetationStateInline,
    ]


class AreaVegetationAdmin(admin.GeoModelAdmin):
    inlines = [
        VegetationStateInline,
    ]


admin.site.register(Territory, admin.GeoModelAdmin)
admin.site.register(PointVegetation, PointVegetationAdmin)
admin.site.register(AreaVegetation, AreaVegetationAdmin)
admin.site.register(VegetationState, admin.GeoModelAdmin)

