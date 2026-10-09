from django.core.signals import setting_changed
from django.utils.module_loading import import_string


class DynamicSchedulingManager:
    """
    Manages the collection and retrieval of schedulable jobs from all installed apps.
    Every app that needs to integrate with the scheduling system should define
    a fm_scheduling.py file with a list of schedulable jobs in the following format:

    schedulable_jobs = [
        {"name": "job_name", "func": "dotted.path.to.job.func"},
        ...
    ]
    """

    def __init__(self):
        self._funcs = []
        self._loaded = False

    @property
    def schedulable_jobs(self):
        if not self._loaded:
            self.collect_schedulable_jobs()
        return self._funcs

    def is_schedulable(self, func_name):
        return any(job_def["func"] == func_name for job_def in self.schedulable_jobs)

    def collect_schedulable_jobs(self):
        from django.apps import apps

        # Build a local list and assign it at the end, as in PermissionManager.
        funcs = []
        found_func_codes = set()  # To track and avoid duplicate function codes

        for app_config in apps.get_app_configs():
            try:
                schedulable_defs_path = (
                    app_config.name + ".fm_scheduling.schedulable_jobs"
                )
                declared_schedulable_jobs = import_string(schedulable_defs_path)
                for job in declared_schedulable_jobs:
                    func_code = job["func"]
                    if func_code not in found_func_codes:
                        funcs.append(
                            {
                                "name": app_config.label + ": " + job["name"],
                                "func": job["func"],
                            }
                        )
                        found_func_codes.add(func_code)
            except (ImportError, AttributeError):
                continue
        self._funcs = funcs
        self._loaded = True


# Global instance of the DynamicSchedulingManager, used across the application.
dynamic_scheduling_manager = DynamicSchedulingManager()


# Reload the schedulable jobs when settings change.
def reload_schedulable_jobs(*args, **kwargs):
    dynamic_scheduling_manager.collect_schedulable_jobs()


setting_changed.connect(reload_schedulable_jobs)
