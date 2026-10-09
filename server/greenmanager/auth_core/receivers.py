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
def update_user_permissions_when_roles_change(sender, instance, action, **kwargs):
    # This signal is never skipped, it is handled as part of the "save" process of
    # the User model, and so the recursion guard is not needed here. The post_save
    # signal will handle
    # the permissions update after the roles are changed.
    if action in ("post_add", "post_remove", "post_clear"):
        instance.update_permissions()


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
