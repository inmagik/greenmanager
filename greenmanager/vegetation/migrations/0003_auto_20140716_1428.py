# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vegetation', '0002_auto_20140716_1421'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vegetationstate',
            name='revision',
            field=models.PositiveIntegerField(default=0, editable=False, blank=True),
        ),
    ]
