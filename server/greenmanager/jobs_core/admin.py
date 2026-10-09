from django import forms
from django.conf import settings
from django.contrib import admin

from .models import CronJobDefinition, JobRun, ScheduledJobDefinition
from .scheduling import dynamic_scheduling_manager


class SchedulableJobChoiceField(forms.ChoiceField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.choices = [
            (job["func"], job["name"])
            for job in dynamic_scheduling_manager.schedulable_jobs
        ]


class CronJobDefinitionAdminForm(forms.ModelForm):
    queue_name = forms.ChoiceField(
        choices=[(queue, queue) for queue in settings.RQ_QUEUES]
    )
    func = SchedulableJobChoiceField()

    class Meta:
        model = CronJobDefinition
        fields = "__all__"


@admin.register(CronJobDefinition)
class CronJobDefinitionAdmin(admin.ModelAdmin):
    form = CronJobDefinitionAdminForm
    list_display = ("id", "func", "cron", "enabled")
    search_fields = ("id", "func")
    list_filter = ("enabled",)


class ScheduledJobDefinitionAdminForm(forms.ModelForm):
    queue_name = forms.ChoiceField(
        choices=[(queue, queue) for queue in settings.RQ_QUEUES]
    )
    func = SchedulableJobChoiceField()

    class Meta:
        model = ScheduledJobDefinition
        fields = "__all__"


@admin.register(ScheduledJobDefinition)
class ScheduledJobDefinitionAdmin(admin.ModelAdmin):
    form = ScheduledJobDefinitionAdminForm
    list_display = ("id", "func", "start_at")
    search_fields = ("id", "func")


@admin.register(JobRun)
class JobRunAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "func",
        "status",
        "scheduled_job_definition",
        "cron_job_definition",
    )
    search_fields = ("id", "func")
    list_filter = ("status",)
