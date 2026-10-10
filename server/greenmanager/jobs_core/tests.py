from datetime import timedelta
from types import SimpleNamespace
from unittest import mock

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from .models import CronJobDefinition, JobRun, ScheduledJobDefinition
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

    def test_rerun_clears_the_previous_outcome(self):
        job_run = JobRun.objects.create(
            func="jobs_core.tests.succeeding_job",
            status="failed",
            error_details="boom",
            completed_at=timezone.now(),
        )
        fake_job = SimpleNamespace(
            meta={
                "__inmagik_scheduler": {
                    "func": "jobs_core.tests.succeeding_job",
                    "run_id": job_run.id,
                }
            }
        )

        with mock.patch("jobs_core.runner.get_current_job", return_value=fake_job):
            job_runner()

        job_run.refresh_from_db()
        self.assertEqual(job_run.status, "completed")
        self.assertEqual(job_run.error_details, "")

    def test_missing_function_is_recorded_as_failed_run(self):
        fake_job = SimpleNamespace(
            meta={"__inmagik_scheduler": {"func": "jobs_core.tests.removed_job"}}
        )

        with mock.patch("jobs_core.runner.get_current_job", return_value=fake_job):
            with self.assertRaises(ImportError):
                job_runner()

        job_run = JobRun.objects.get()
        self.assertEqual(job_run.status, "failed")
        self.assertEqual(job_run.func, "jobs_core.tests.removed_job")


class JobDefinitionTests(TestCase):
    def test_unschedulable_function_is_a_validation_error(self):
        definition = CronJobDefinition(id="bad", cron="* * * * *", func="os.remove")

        with self.assertRaises(ValidationError) as context:
            definition.full_clean()

        self.assertIn("func", context.exception.message_dict)

    @mock.patch("jobs_core.receivers.get_scheduler")
    @mock.patch(
        "jobs_core.receivers.dynamic_scheduling_manager.is_schedulable",
        return_value=True,
    )
    def test_rescheduling_resets_the_job_run(self, _is_schedulable, _scheduler):
        definition = ScheduledJobDefinition.objects.create(
            id="once",
            start_at=timezone.now() + timedelta(hours=1),
            func="jobs_core.tests.succeeding_job",
        )
        JobRun.objects.filter(scheduled_job_definition=definition).update(
            status="failed", error_details="boom", completed_at=timezone.now()
        )

        definition.start_at = timezone.now() + timedelta(hours=2)
        definition.save()

        job_run = definition.job_run
        job_run.refresh_from_db()
        self.assertEqual(job_run.status, "pending")
        self.assertEqual(job_run.error_details, "")
        self.assertIsNone(job_run.completed_at)

    @mock.patch("jobs_core.receivers.get_scheduler")
    @mock.patch(
        "jobs_core.receivers.dynamic_scheduling_manager.is_schedulable",
        return_value=True,
    )
    def test_scheduler_changes_wait_for_the_commit(self, _is_schedulable, scheduler):
        with self.captureOnCommitCallbacks() as callbacks:
            ScheduledJobDefinition.objects.create(
                id="later",
                start_at=timezone.now() + timedelta(hours=1),
                func="jobs_core.tests.succeeding_job",
            )
            # Inside the transaction Redis is not touched yet.
            scheduler.assert_not_called()

        for callback in callbacks:
            callback()
        scheduler.return_value.enqueue_at.assert_called_once()
