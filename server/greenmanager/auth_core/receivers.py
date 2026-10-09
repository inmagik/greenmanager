from django.db.models.signals import m2m_changed, post_save, pre_delete
from django.dispatch import receiver

from .models import Role, User


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
