from datetime import timedelta

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import CronJobDefinition, JobRun, ScheduledJobDefinition
from .runner import job_runner
from .scheduling import dynamic_scheduling_manager
from .utils import get_scheduler


@receiver(post_save, sender=CronJobDefinition)
def schedule_job_on_save(sender, instance, created, **kwargs):
    """
    Signal receiver that schedules a job whenever a CronJobDefinition instance
    is created or updated.
    """
    scheduler = get_scheduler()
    job_id = instance.id

    # Remove existing job with the same ID if it exists
    existing_jobs = scheduler.get_jobs()
    for job in existing_jobs:
        if job.id == job_id:
            scheduler.cancel(job)

    # Schedule the new or updated job
    if instance.enabled and dynamic_scheduling_manager.is_schedulable(instance.func):
        scheduler.cron(
            instance.cron,
            id=job_id,
            func=job_runner,
            args=instance.args,
            kwargs=instance.kwargs,
            repeat=instance.repeat,
            result_ttl=instance.result_ttl,
            ttl=instance.ttl,
            meta={
                **instance.meta,
                "__inmagik_auto_scheduler": False,
                "__inmagik_scheduler": {
                    "func": instance.func,
                    "run_id": None,
                    "cron_job_definition_id": instance.id,
                },
            },
            use_local_timezone=instance.use_local_timezone,
            queue_name=instance.queue_name,
        )


@receiver(post_delete, sender=CronJobDefinition)
def remove_job_on_delete(sender, instance, **kwargs):
    """
    Signal receiver that removes a scheduled job whenever a CronJobDefinition
    instance is deleted.
    """
    scheduler = get_scheduler()
    job_id = instance.id

    # Remove the job with the corresponding ID if it exists
    existing_jobs = scheduler.get_jobs()
    for job in existing_jobs:
        if job.id == job_id:
            scheduler.cancel(job)


@receiver(post_save, sender=ScheduledJobDefinition)
def schedule_scheduled_job_on_save(sender, instance, created, **kwargs):
    """
    Signal receiver that schedules a job whenever a ScheduledJobDefinition
    instance is created or updated.
    """
    scheduler = get_scheduler()
    job_id = instance.id

    # Remove existing job with the same ID if it exists
    existing_jobs = scheduler.get_jobs()
    for job in existing_jobs:
        if job.id == job_id:
            scheduler.cancel(job)

    # Schedule the new or updated job
    if dynamic_scheduling_manager.is_schedulable(instance.func):
        # The definition keeps one JobRun: when it is saved again (rescheduled),
        # the run goes back to pending with the new function and arguments.
        job_run, _created = JobRun.objects.update_or_create(
            scheduled_job_definition=instance,
            defaults={
                "func": instance.func,
                "args": instance.args,
                "kwargs": instance.kwargs,
                "status": "pending",
                "started_at": None,
                "completed_at": None,
                "error_details": "",
            },
        )

        if instance.start_at > timezone.now():
            # Schedule the job to run at the specified start time
            scheduler.enqueue_at(
                instance.start_at,
                job_runner,
                *instance.args,
                **instance.kwargs,
                job_id=job_id,
                job_result_ttl=instance.result_ttl,
                job_ttl=instance.ttl,
                meta={
                    **instance.meta,
                    "__inmagik_auto_scheduler": False,
                    "__inmagik_scheduler": {
                        "func": instance.func,
                        "run_id": job_run.id,
                    },
                },
                queue_name=instance.queue_name,
            )
        else:
            # If the start time is in the past, run the job immediately
            scheduler.enqueue_in(
                timedelta(seconds=0),
                job_runner,
                *instance.args,
                **instance.kwargs,
                job_id=job_id,
                job_result_ttl=instance.result_ttl,
                job_ttl=instance.ttl,
                meta={
                    **instance.meta,
                    "__inmagik_auto_scheduler": False,
                    "__inmagik_scheduler": {
                        "func": instance.func,
                        "run_id": job_run.id,
                    },
                },
                queue_name=instance.queue_name,
            )


@receiver(post_delete, sender=ScheduledJobDefinition)
def remove_scheduled_job_on_delete(sender, instance, **kwargs):
    """
    Signal receiver that removes a scheduled job whenever a
    ScheduledJobDefinition instance is deleted.
    """
    scheduler = get_scheduler()
    job_id = instance.id

    # Remove the job with the corresponding ID if it exists
    existing_jobs = scheduler.get_jobs()
    for job in existing_jobs:
        if job.id == job_id:
            scheduler.cancel(job)
