"""Add profile bio and notification preferences to User."""

from django.db import migrations, models

import CattleTrace.models


class Migration(migrations.Migration):

    dependencies = [
        ('CattleTrace', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='user',
            name='notification_preferences',
            field=models.JSONField(blank=True, default=CattleTrace.models.default_notification_preferences),
        ),
    ]
