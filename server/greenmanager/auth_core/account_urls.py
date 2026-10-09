from django.urls import path

from .account_views import (
    ActivateAccountView,
    ChangePasswordView,
    RecoverPasswordView,
    ResetPasswordView,
)

# The paths of userbase.urls, without me/ and resend-activation-email/
# (see account_views.py).
urlpatterns = [
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("activate-account/", ActivateAccountView.as_view(), name="activate_account"),
    path("recover-password/", RecoverPasswordView.as_view(), name="recover_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
]
