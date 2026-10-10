from django.conf import settings
from django.core.management.base import BaseCommand
from jobs_core.runner import job_runner
from jobs_core.utils import get_scheduler


class Command(BaseCommand):
    help = "Align the scheduler with the automatic tasks in settings.SCHEDULED_TASKS."

    def handle(self, *args, **options):
        jobs_list = getattr(settings, "SCHEDULED_TASKS", [])
        scheduler = get_scheduler()

        existing_jobs = scheduler.get_jobs()
        for job in existing_jobs:
            if job.meta.get("__inmagik_auto_scheduler", False):
                self.stdout.write(f"Removing existing job with ID: {job.id}")
                scheduler.cancel(job)

        for job_def in jobs_list:
            job_def = (
                job_def.copy()
            )  # Create a copy to avoid modifying the original definition
            job_func_path = job_def.pop("func")
            job_id = job_def.get("id")
            cron_expr = job_def.pop("cron")
            meta = job_def.pop(
                "meta", {}
            ).copy()  # Create a copy of meta to avoid modifying the original
            meta["__inmagik_auto_scheduler"] = True
            meta["__inmagik_scheduler"] = {"func": job_func_path, "run_id": None}

            self.stdout.write(
                f"Scheduling job: {job_func_path} with ID: {job_id} "
                f"and schedule: {cron_expr}"
            )

            scheduler.cron(cron_expr, **job_def, func=job_runner, meta=meta)
            self.stdout.write(
                f"Scheduled job: {job_func_path} with ID: {job_id} "
                f"and schedule: {cron_expr}"
            )
        self.stdout.write(self.style.SUCCESS("Automatic tasks scheduled."))
