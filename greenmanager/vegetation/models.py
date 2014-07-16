from django.contrib.gis import models
from django.db.models import Max
from django.db.models.signals import post_save
from django.dispatch import receiver

from coremodels.models import *


class TerritoryData(models.Model):
    territory = models.OneToOneField(Territory)
    #todo: add other fields here


class VegetationState(BaseState):
    height = models.IntegerField(null=True, blank=True)
    condition = models.CharField(max_length=255, null=True, blank=True)

    #todo: on save whe should set the last state on target
    def save(self, *args, **kwargs):
        if not self.revision:
            states = VegetationState.objects.filter(content_type=self.content_type, object_id=self.object_id)
            aggr =  states.aggregate(Max('revision'))
            max_revision = aggr['revision__max'] or 0
            self.revision = max_revision + 1
            

        
        
        return super(VegetationState, self).save(*args, **kwargs)


    def __unicode__(self):
        return u'state rev %d' % self.revision


class PointVegetation(PointElement):
    # TODO: (ND) could be a foreign key
    specie = models.CharField(max_length=255)
    items = models.IntegerField(null=True, blank=True, default=1)
    states = GenericRelation(VegetationState)
    last_state = models.ForeignKey(VegetationState, null=True, blank=True)

    def __unicode__(self):
        return u'point veg %d' % self.id


class AreaVegetation(PolygonElement):
    # TODO: (ND) could be a foreign key
    specie = models.CharField(max_length=255)
    items = models.IntegerField(null=True, blank=True, default=1)
    states = GenericRelation(VegetationState)
    last_state = models.ForeignKey(VegetationState, null=True, blank=True)




#signals setup
def after_vegetationstate_save(sender, instance, *args, **kwargs):
    print "signal run"
    states = VegetationState.objects.filter(content_type=instance.content_type, object_id=instance.object_id)
    aggr =  states.aggregate(Max('revision'))
    max_revision = aggr['revision__max']
    last_state = states.get(revision=max_revision)
    instance.content_object.last_state = last_state
    instance.content_object.save()

post_save.connect(after_vegetationstate_save, sender=VegetationState)
