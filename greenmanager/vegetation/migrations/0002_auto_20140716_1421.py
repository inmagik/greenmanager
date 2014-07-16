# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vegetation', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vegetationstate',
            name='revision',
            field=models.PositiveIntegerField(default=1, editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='areavegetation',
            name='territory',
            field=models.ForeignKey(blank=True, to='coremodels.Territory', null=True),
        ),
        migrations.AlterField(
            model_name='pointvegetation',
            name='territory',
            field=models.ForeignKey(blank=True, to='coremodels.Territory', null=True),
        ),
    ]
