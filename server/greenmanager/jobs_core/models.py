from uuid import uuid4

from django.db import models


def validate_is_schedulable(func_name):
    from .scheduling import dynamic_scheduling_manager

    if not dynamic_scheduling_manager.is_schedulable(func_name):
        raise ValueError(f"The function '{func_name}' is not schedulable.")


class CronJobDefinition(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    cron = models.CharField(max_length=255)
    func = models.CharField(max_length=255, validators=[validate_is_schedulable])
    args = models.JSONField(default=list, blank=True)
    kwargs = models.JSONField(default=dict, blank=True)
    repeat = models.IntegerField(null=True, blank=True)
    result_ttl = models.IntegerField(null=True, blank=True)
    ttl = models.IntegerField(null=True, blank=True)
    queue_name = models.CharField(max_length=255, default="default")
    meta = models.JSONField(default=dict, blank=True)
    use_local_timezone = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.id


class ScheduledJobDefinition(models.Model):
    id = models.CharField(max_length=255, primary_key=True)
    start_at = models.DateTimeField()
    func = models.CharField(max_length=255, validators=[validate_is_schedulable])
    args = models.JSONField(default=list, blank=True)
    kwargs = models.JSONField(default=dict, blank=True)
    result_ttl = models.IntegerField(null=True, blank=True)
    ttl = models.IntegerField(null=True, blank=True)
    queue_name = models.CharField(max_length=255, default="default")
    meta = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.id


# TODO Validare che esattamente uno tra cron e start_at sia valorizzato
# Serve
# - aggiungere un cron da admin
# - aggiungere un job ad una certa data/ora da admin
# - aggiungere un job adesso da admin
# - aggiungere un job adesso da API
# - aggiungere un job ad una certa data/ora da API

# Serve che l'ID della JobRun sia disponibile subito
# (al momento in cui il job viene richiesto)


class JobRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    func = models.CharField(max_length=255)
    args = models.JSONField(default=list, blank=True)
    kwargs = models.JSONField(default=dict, blank=True)
    scheduled_job_definition = models.OneToOneField(
        ScheduledJobDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_run",
    )
    cron_job_definition = models.ForeignKey(
        CronJobDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_runs",
    )

    status = models.CharField(
        max_length=50,
        choices=[
            ("pending", "Pending"),
            ("running", "Running"),
            ("completed", "Completed"),
            ("failed", "Failed"),
        ],
        default="pending",
    )

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    error_details = models.TextField(blank=True)
