from types import SimpleNamespace
from unittest import mock

from django.test import TestCase

from .models import CronJobDefinition, JobRun
from .runner import job_runner


def failing_job():
    raise RuntimeError("boom")


def succeeding_job():
    return "ok"


class JobRunnerTests(TestCase):
    def test_failure_is_recorded_and_raised_to_rq(self):
        fake_job = SimpleNamespace(
            meta={"__inmagik_scheduler": {"func": "jobs_core.tests.failing_job"}}
        )

        with mock.patch("jobs_core.runner.get_current_job", return_value=fake_job):
            with self.assertRaises(RuntimeError):
                # Called directly: @job only adds .delay to the function.
                job_runner()

        job_run = JobRun.objects.get()
        self.assertEqual(job_run.status, "failed")
        self.assertEqual(job_run.error_details, "boom")

    def test_cron_run_is_linked_to_its_definition(self):
        with mock.patch("jobs_core.receivers.get_scheduler"):
            cron = CronJobDefinition.objects.create(
                id="nightly", cron="0 2 * * *", func="jobs_core.tests.succeeding_job"
            )
        fake_job = SimpleNamespace(
            meta={
                "__inmagik_scheduler": {
                    "func": "jobs_core.tests.succeeding_job",
                    "run_id": None,
                    "cron_job_definition_id": cron.id,
                }
            }
        )

        with mock.patch("jobs_core.runner.get_current_job", return_value=fake_job):
            self.assertEqual(job_runner(), "ok")

        job_run = JobRun.objects.get()
        self.assertEqual(job_run.status, "completed")
        self.assertEqual(job_run.cron_job_definition, cron)
