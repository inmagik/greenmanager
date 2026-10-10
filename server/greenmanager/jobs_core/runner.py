from django.utils import timezone
from django.utils.module_loading import import_string
from django_rq import job
from rq import get_current_job

from .models import CronJobDefinition, JobRun


@job
def job_runner(*args, **kwargs):
    job = get_current_job()
    scheduler_meta = job.meta.get("__inmagik_scheduler", {})
    func_path = scheduler_meta.get("func")
    if func_path:
        run_id = scheduler_meta.get("run_id")
        # Each run of a model-backed cron gets a new JobRun, linked to its
        # definition (if it still exists).
        cron_job_definition = CronJobDefinition.objects.filter(
            pk=scheduler_meta.get("cron_job_definition_id")
        ).first()
        job_run = JobRun.objects.get_or_create(
            id=run_id,
            defaults={
                "func": func_path,
                "args": args,
                "kwargs": kwargs,
                "status": "running",
                "cron_job_definition": cron_job_definition,
            },
        )[0]
        # A rescheduled definition reuses its JobRun: clear the previous outcome.
        job_run.status = "running"
        job_run.started_at = timezone.now()
        job_run.completed_at = None
        job_run.error_details = ""
        job_run.save()
        try:
            # Imported here, so that a function removed or renamed after the job
            # was scheduled is recorded as a failed run too.
            job_func = import_string(func_path)
            result = job_func(*args, **kwargs)
            job_run.status = "completed"
            job_run.completed_at = timezone.now()
            job_run.save()
            return result
        except Exception as e:
            job_run.status = "failed"
            job_run.error_details = str(e)
            job_run.completed_at = timezone.now()
            job_run.save()
            # Let RQ mark the job as failed and apply its failure handling.
            raise
