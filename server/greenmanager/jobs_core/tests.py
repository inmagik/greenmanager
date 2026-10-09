from types import SimpleNamespace
from unittest import mock

from django.test import TestCase

from .models import JobRun
from .runner import job_runner


def failing_job():
    raise RuntimeError("boom")


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
