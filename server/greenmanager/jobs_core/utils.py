from django.conf import settings
from redis import Redis
from rq_scheduler import Scheduler


def get_scheduler():
    return Scheduler(
        connection=Redis(
            host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB
        )
    )
