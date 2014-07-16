# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '__first__'),
        ('coremodels', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='AreaVegetation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('deleted', models.DateTimeField(null=True, blank=True)),
                ('geom', django.contrib.gis.db.models.fields.PolygonField(srid=4326, null=True, blank=True)),
                ('specie', models.CharField(max_length=255)),
                ('items', models.IntegerField(default=1, null=True, blank=True)),
                ('territory', models.ForeignKey(to='coremodels.Territory', null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='PointVegetation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('deleted', models.DateTimeField(null=True, blank=True)),
                ('geom', django.contrib.gis.db.models.fields.PointField(srid=4326, null=True, blank=True)),
                ('specie', models.CharField(max_length=255)),
                ('items', models.IntegerField(default=1, null=True, blank=True)),
                ('territory', models.ForeignKey(to='coremodels.Territory', null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='TerritoryData',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('territory', models.OneToOneField(to='coremodels.Territory')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='VegetationState',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
                ('deleted', models.DateTimeField(null=True, blank=True)),
                ('object_id', models.PositiveIntegerField()),
                ('height', models.IntegerField(null=True, blank=True)),
                ('condition', models.CharField(max_length=255, null=True, blank=True)),
                ('content_type', models.ForeignKey(to='contenttypes.ContentType')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='pointvegetation',
            name='last_state',
            field=models.ForeignKey(blank=True, to='vegetation.VegetationState', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='areavegetation',
            name='last_state',
            field=models.ForeignKey(blank=True, to='vegetation.VegetationState', null=True),
            preserve_default=True,
        ),
    ]
