from django.db import transaction
from django.db.models.signals import m2m_changed, post_save, pre_delete
from django.dispatch import receiver
from userbase import signals as userbase_signals
from userbase.helpers import send_activation_email
from userbase.settings import api_settings as userbase_settings

from .models import Role, User

# userbase sends the activation email from post_save, inside the transaction that
# creates the user: the email, with its link, would leave even if the creation
# rolled back. This receiver replaces it and waits for the commit.
post_save.disconnect(userbase_signals.s_send_activation_email, sender=User)


@receiver(post_save, sender=User)
def send_activation_email_on_commit(sender, instance, created, raw=False, **kwargs):
    if created and not raw and userbase_settings.ENABLE_ACCOUNT_ACTIVATION:
        transaction.on_commit(lambda: send_activation_email(instance))


@receiver(post_save, sender=User)
def update_user_permissions(sender, instance, raw, **kwargs):
    if raw:
        return  # Skip signal for raw data loading
    if getattr(instance, "_update_permissions_signal", False):
        return  # Avoid recursion

    setattr(instance, "_update_permissions_signal", True)  # Avoid recursion
    instance.update_permissions()
    setattr(instance, "_update_permissions_signal", False)


@receiver(m2m_changed, sender=User.roles.through)
def update_user_permissions_when_roles_change(
    sender, instance, action, reverse, model, pk_set, **kwargs
):
    # update_permissions() saves only all_permissions, so no recursion guard is
    # needed here.
    if not reverse:
        # user.roles.add(...) and similar: the instance is the user.
        if action in ("post_add", "post_remove", "post_clear"):
            instance.update_permissions()
        return

    # role.user_set.add(...) and similar: the instance is the role, the users
    # are in pk_set. On clear pk_set is empty: the users are read before.
    if action == "pre_clear":
        instance._users_before_clear = list(instance.user_set.all())
    elif action in ("post_add", "post_remove"):
        for user in model.objects.filter(pk__in=pk_set or []):
            user.update_permissions()
    elif action == "post_clear":
        for user in getattr(instance, "_users_before_clear", []):
            user.update_permissions()
        instance._users_before_clear = []


@receiver(post_save, sender=Role)
def update_role_permissions(sender, instance, raw, **kwargs):
    if raw:
        return  # Skip signal for raw data loading

    # Update all users that have this role
    for user in instance.user_set.all():
        setattr(user, "_update_permissions_signal", True)  # Avoid recursion
        user.update_permissions()
        setattr(user, "_update_permissions_signal", False)


@receiver(pre_delete, sender=Role)
def delete_role_permissions(sender, instance, **kwargs):
    # Update all users that had this role
    for user in instance.user_set.all():
        user.roles.remove(instance)  # Remove the role from the user
