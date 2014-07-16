from django.contrib.gis.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation


class Territory(models.Model):
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)    
    geom = models.PolygonField(srid=4326, null=True, blank=True)
    
    objects = models.GeoManager()

    def __unicode__(self):
        return u'%s' % self.name

    


class BaseElement(models.Model):

    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)
    deleted = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True    


class GeometryElement(BaseElement):
    
    territory = models.ForeignKey(Territory, null=True, blank=True)
    geom = models.GeometryField(srid=4326, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        abstract = True



class PointElement(BaseElement):
    
    territory = models.ForeignKey(Territory, null=True, blank=True)
    geom = models.PointField(srid=4326, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        abstract = True


class LineElement(BaseElement):
    
    territory = models.ForeignKey(Territory, null=True, blank=True)
    geom = models.LineStringField(srid=4326, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        abstract = True


class PolygonElement(BaseElement):
    
    territory = models.ForeignKey(Territory, null=True, blank=True)
    geom = models.PolygonField(srid=4326, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        abstract = True



class BaseState(BaseElement):
    
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    revision = models.PositiveIntegerField(default=0, blank=True, editable=False);


    class Meta:
        abstract = True

