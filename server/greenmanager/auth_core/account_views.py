"""
Account endpoints of django-userbase used by the frontend: activation, password
recovery and reset, password change.

They are mounted one by one (see ``account_urls.py``) instead of with
``userbase.urls``, which also exposes ``me/`` (a second "me" that writes
``last_login`` on every call) and ``resend-activation-email/`` (any authenticated
user could send emails to any user and read their data).
"""

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from userbase import views as userbase_views
from userbase.serializers import (
    ActivateAccountSerializer,
    PasswordSerializer,
    RecoverPasswordSerializer,
    ResetPasswordSerializer,
)


def invalid_token_error():
    return serializers.ValidationError(
        {"token": [{"code": "invalid_token", "detail": "Invalid token."}]}
    )


class ActivateAccountView(userbase_views.ActivateAccountView):
    @extend_schema(request=ActivateAccountSerializer, responses={204: None})
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except get_user_model().DoesNotExist:
            # Valid token of a user deleted in the meantime.
            raise invalid_token_error()


class RecoverPasswordView(userbase_views.RecoverPasswordView):
    @extend_schema(request=RecoverPasswordSerializer, responses={204: None})
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ResetPasswordView(userbase_views.ResetPasswordView):
    @extend_schema(request=ResetPasswordSerializer, responses={200: None})
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except get_user_model().DoesNotExist:
            raise invalid_token_error()


class ChangePasswordView(userbase_views.ChangePasswordView):
    # userbase leaves the view open: an anonymous request ended in a server error.
    permission_classes = [IsAuthenticated]

    @extend_schema(request=PasswordSerializer, responses={204: None})
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
