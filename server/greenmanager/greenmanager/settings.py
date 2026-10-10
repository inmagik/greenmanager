"""
Django settings for the greenmanager project.

Every value that changes between environments is read from a DJANGO_* environment
variable, with a default suitable for local development.

https://docs.djangoproject.com/en/6.1/topics/settings/
https://docs.djangoproject.com/en/6.1/ref/settings/
"""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv(
    "DJANGO_SECRET",
    "django-insecure-a#_@#f-v8n%y5--j3=w5di764iu-_rf=njgxsn!(s3@5ru*1wg",
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "True") in ["True", "true", "yes", "1"]

# The default key is public (it is in the repository): only for development.
if not DEBUG and SECRET_KEY.startswith("django-insecure-"):
    raise ImproperlyConfigured("Set DJANGO_SECRET when DJANGO_DEBUG is off.")

ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
if os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", ""):
    CSRF_TRUSTED_ORIGINS = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")

# Application definition

INSTALLED_APPS = [
    # Core django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "django.contrib.gis",
    # Library apps
    "rest_framework",
    "django_filters",
    "axes",
    "auditlog",
    "drf_spectacular",
    "userbase",  # https://github.com/inmagik/django-userbase
    "inmagik_utils",
    "django_rq",
    # Local apps
    "tenants",
    "auth_core",
    "jobs_core",
    # Domain apps
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "axes.middleware.AxesMiddleware",
    "auditlog.middleware.AuditlogMiddleware",
]

ROOT_URLCONF = "greenmanager.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "greenmanager.wsgi.application"
ASGI_APPLICATION = "greenmanager.asgi.application"


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

# PostGIS is required: geometries of areas and elements are stored with GeoDjango.
DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.getenv("DJANGO_PG_NAME", "greenmanager"),
        "USER": os.getenv("DJANGO_PG_USER", "greenmanager"),
        "PASSWORD": os.getenv("DJANGO_PG_PASS", "greenmanager"),
        "HOST": os.getenv("DJANGO_PG_HOST", "127.0.0.1"),
        "PORT": os.getenv("DJANGO_PG_PORT", "5432"),
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",  # noqa: E501
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = "it-it"

TIME_ZONE = "Europe/Rome"

USE_I18N = True

USE_TZ = True


# Static and media files
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = os.getenv("DJANGO_STATIC_URL", "static/")
MEDIA_URL = os.getenv("DJANGO_MEDIA_URL", "media/")
MEDIA_ROOT = Path(os.getenv("DJANGO_MEDIA_ROOT", BASE_DIR / "media"))
STATIC_ROOT = Path(os.getenv("DJANGO_STATIC_ROOT", BASE_DIR / "static"))

MEDIA_URL = MEDIA_URL if MEDIA_URL.endswith("/") else f"{MEDIA_URL}/"
STATIC_URL = STATIC_URL if STATIC_URL.endswith("/") else f"{STATIC_URL}/"

# region REST Framework settings

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "greenmanager.schema.TenantAwareAutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "GreenManager API",
    "VERSION": "1.0.0",
    "COMPONENT_SPLIT_REQUEST": True,
    "APPEND_COMPONENTS": {
        "securitySchemes": {
            "TenantId": {
                "type": "apiKey",
                "in": "header",
                "name": "X-Tenant-ID",
                "description": "Current tenant id used to scope tenant-aware API requests.",  # noqa: E501
            },
        },
    },
}

# endregion

# region Email settings

EMAIL_VENDOR = os.getenv("DJANGO_EMAIL_VENDOR", "console")
if EMAIL_VENDOR == "smtp":
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("DJANGO_EMAIL_HOST", "localhost")
    EMAIL_PORT = int(os.getenv("DJANGO_EMAIL_PORT", "25"))
    EMAIL_HOST_USER = os.getenv("DJANGO_EMAIL_USER", "")
    EMAIL_HOST_PASSWORD = os.getenv("DJANGO_EMAIL_PASS", "")
    EMAIL_USE_TLS = os.getenv("DJANGO_EMAIL_TLS", "False") in [
        "True",
        "true",
        "yes",
        "1",
    ]
    EMAIL_USE_SSL = os.getenv("DJANGO_EMAIL_SSL", "False") in [
        "True",
        "true",
        "yes",
        "1",
    ]
    EMAIL_TIMEOUT = (
        int(os.getenv("DJANGO_EMAIL_TIMEOUT"))
        if os.getenv("DJANGO_EMAIL_TIMEOUT")
        else None
    )
    EMAIL_SSL_KEYFILE = os.getenv("DJANGO_EMAIL_SSL_KEYFILE", None)
    EMAIL_SSL_CERTFILE = os.getenv("DJANGO_EMAIL_SSL_CERTFILE", None)
    EMAIL_SSL_CAFILE = os.getenv("DJANGO_EMAIL_SSL_CAFILE", None)

if EMAIL_VENDOR == "console":
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

DEFAULT_FROM_EMAIL = os.getenv("DJANGO_DEFAULT_FROM_EMAIL", "support@mail.inmagik.com")

# endregion

# region Deployment info

DJANGO_ADMIN_PATH = os.getenv("DJANGO_ADMIN_PATH", "admin/")
FRONTEND_URL = os.getenv("DJANGO_FRONTEND_URL", "http://localhost:5173")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# endregion

# region User and authentication settings

AUTH_USER_MODEL = "auth_core.User"

USERBASE_SETTINGS = {
    "RESET_PASSWORD_EMAIL_TEMPLATE": "auth_core/email_reset_password.txt",
    "RESET_PASSWORD_URL": FRONTEND_URL + "/reset-password/",
    "ACTIVATE_ACCOUNT_URL": FRONTEND_URL + "/welcome/",
    "ACTIVATE_ACCOUNT_EMAIL_TEMPLATE": "auth_core/email_account_activation.txt",
    "ACTIVATE_ACCOUNT_EMAIL_SUBJECT": "Attivazione account GreenManager",
    "RESET_PASSWORD_EMAIL_SUBJECT": "Reset password GreenManager",
    "FROM_EMAIL": DEFAULT_FROM_EMAIL,
    "USER_SERIALIZER": "userbase.serializers.UserSerializer",
    "ENABLE_ACCOUNT_ACTIVATION": True,
    "ENABLE_PASSWORD_RECOVERY": True,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # The login sets last_login, shown in the list of users.
    "UPDATE_LAST_LOGIN": True,
}

AUTHENTICATION_BACKENDS = [
    # AxesStandaloneBackend should be the first authentication backend.
    "axes.backends.AxesStandaloneBackend",
    # Django ModelBackend is the default authentication backend.
    "django.contrib.auth.backends.ModelBackend",
]


def axes_username(request, credentials):
    """The API logs in with the email, the Django admin with the username."""
    if request.path.startswith("/api"):
        return credentials.get("email", None)
    return credentials.get("username", None)


AXES_FAILURE_LIMIT = 10
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_PARAMETERS = [["username", "ip_address"]]
AXES_USERNAME_CALLABLE = axes_username

# endregion

# region RQ settings

REDIS_HOST = os.getenv("DJANGO_REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("DJANGO_REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("DJANGO_REDIS_DB", "0"))
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
RQ_DEFAULT_TIMEOUT = int(os.getenv("DJANGO_RQ_DEFAULT_TIMEOUT", "360"))
RQ_DEFAULT_RESULT_TTL = int(os.getenv("DJANGO_RQ_DEFAULT_RESULT_TTL", "3600"))

RQ_QUEUES = {
    "default": {
        "HOST": REDIS_HOST,
        "PORT": REDIS_PORT,
        "DB": REDIS_DB,
        "DEFAULT_TIMEOUT": RQ_DEFAULT_TIMEOUT,
        "DEFAULT_RESULT_TTL": RQ_DEFAULT_RESULT_TTL,
    },
}

# endregion

# region Scheduled tasks settings

SCHEDULED_TASKS = [
    # {
    #     "id": "example_task",                  # Unique id of the scheduled task
    #     "cron": "* * * * *",                   # A cron string (e.g. "0 0 * * 0")
    #     "func": "app.jobs.example_job",        # Function to be queued
    #     "args": ["arg1", 2],                   # Positional arguments of the function
    #     "kwargs": {"foo": "bar"},              # Keyword arguments of the function
    #     "repeat": 10,                          # Repetitions (None means forever)
    #     "result_ttl": 300,                     # Seconds results are kept
    #     "ttl": 200,                            # Max queued seconds before discard
    #     "queue_name": "default",               # Queue of the job
    #     "meta": {"foo": "bar"},                # Arbitrary pickleable data on the job
    #     "use_local_timezone": False,           # Interpret hours in the local timezone
    # }
]

# endregion

# region Development

INTERNAL_IPS = [
    "127.0.0.1",
]

try:
    from .localsettings import *  # noqa: F401, F403
except ImportError:
    pass

# endregion
