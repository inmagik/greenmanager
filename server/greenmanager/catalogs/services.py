"""
Rules of the catalogs (§2.2 of 04-modello-dati.md, D-016, D-027).

- System entries are changed only by staff users; their code never changes.
- An organization adds its own entries and hides the system entries it does not
  use; an entry in use is never deleted, it is retired or hidden.
- On the data of a client the available entries are those of its managing
  organization; a value already saved stays valid if the entry is later hidden or
  retired (``check_available``).
"""

from core.errors import api_error, check_revision, permission_error, validate_model
from core.services import stamp
from django.db import router, transaction
from django.db.models.deletion import Collector, ProtectedError, RestrictedError
from django.utils.text import slugify

from .models import AttributeDefinition, ElementClassAttribute, Species


def can_manage_system_entries(user):
    return bool(
        getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)
    )


def require_system_manager(user):
    if not can_manage_system_entries(user):
        raise permission_error(
            "system_entry_read_only",
            "System catalog entries are changed only by staff users.",
        )


def is_in_use(entry):
    """Whether other data protect the entry from deletion (it is in use)."""
    collector = Collector(using=router.db_for_write(type(entry)))
    try:
        collector.collect([entry])
    except (ProtectedError, RestrictedError):
        return True
    return False


def unique_code(entry, text):
    """A code from ``text``, free in the scope of the entry (system or its
    organization)."""
    base = slugify(text)[:140] or "entry"
    scope = type(entry)._default_manager.all()
    if entry.is_extensible:
        scope = scope.filter(organization_id=entry.organization_id)
    scope = scope.exclude(pk=entry.pk)
    code, suffix = base, 2
    while scope.filter(code=code).exists():
        code = f"{base}-{suffix}"
        suffix += 1
    return code


def normalize(entry):
    """Values derived from others, before the validation."""
    if isinstance(entry, Species):
        entry.scientific_name = " ".join(entry.scientific_name.split())
        # The scientific name is the name of the entry.
        entry.name = entry.scientific_name
        if not entry.genus and entry.scientific_name:
            entry.genus = entry.scientific_name.split()[0].lstrip("×")
    if not entry.code:
        entry.code = unique_code(entry, entry.name)


def check_available(entry, organization, *, field, previous_id=None):
    """
    ``entry`` can be picked on the data of a client managed by ``organization``.

    The value already saved (``previous_id``) stays valid even if the entry was
    later hidden or retired.
    """
    if entry is None or entry.pk == previous_id:
        return
    model = type(entry)
    if not model.objects.available_for(organization).filter(pk=entry.pk).exists():
        raise api_error(
            "catalog_entry_not_available",
            "The catalog entry is not available.",
            {"name": entry.name},
            field=field,
        )


def validate_references(entry):
    """Entries referenced by an entry: visible to its organization."""
    if isinstance(entry, Species):
        parent = entry.parent
        if parent is not None:
            visible = Species.objects.visible_to(entry.organization)
            if not visible.filter(pk=parent.pk).exists():
                raise api_error(
                    "catalog_entry_not_available",
                    "The parent entry is not available.",
                    {"name": parent.name},
                    field="parent",
                )
        if not entry.is_system:
            # Unique among the entries available to the organization (§2.4).
            duplicate = (
                Species.objects.available_for(entry.organization)
                .system()
                .filter(scientific_name__iexact=entry.scientific_name)
            )
            if duplicate.exists():
                raise api_error(
                    "species_name_not_unique",
                    "An entry with this scientific name already exists.",
                    field="scientific_name",
                )


def check_locked_fields(entry, data):
    """Fields that cannot change once the entry is in use (e.g. the geometry of
    a class with elements)."""
    changed = [
        field
        for field in entry.locked_when_in_use
        if field in data and data[field] != getattr(entry, field)
    ]
    if changed and is_in_use(entry):
        raise api_error(
            "catalog_entry_in_use_locked",
            "The field cannot change: the entry is in use.",
            field=changed[0],
        )


@transaction.atomic
def create_entry(model, data, *, user, organization):
    data = dict(data)
    class_attributes = data.pop("class_attributes", None)
    is_system = (
        data.pop("is_system", False)
        or not model.is_extensible
        or not model.organization_entries_allowed
    )
    if is_system:
        require_system_manager(user)
    elif organization is None:
        raise api_error("tenant_required", "A tenant is required.", field="tenant")

    entry = model(**data)
    if model.is_extensible:
        entry.organization = None if is_system else organization
    normalize(entry)
    stamp(entry, user)
    validate_model(entry)
    validate_references(entry)
    entry.save()
    if class_attributes is not None:
        set_class_attributes(entry, class_attributes, user=user)
    return entry


@transaction.atomic
def update_entry(entry, data, *, user, expected_revision=None):
    entry = type(entry)._default_manager.select_for_update().get(pk=entry.pk)
    check_revision(entry, expected_revision)
    if entry.is_system:
        require_system_manager(user)
    data = dict(data)
    data.pop("is_system", None)
    class_attributes = data.pop("class_attributes", None)
    if entry.is_system and "code" in data and data["code"] != entry.code:
        raise api_error(
            "catalog_code_immutable",
            "The code of a system entry cannot change.",
            field="code",
        )
    check_locked_fields(entry, data)

    for field, value in data.items():
        setattr(entry, field, value)
    normalize(entry)
    stamp(entry, user)
    validate_model(entry)
    validate_references(entry)
    entry.save()
    if class_attributes is not None:
        set_class_attributes(entry, class_attributes, user=user)
    return entry


@transaction.atomic
def delete_entry(entry, *, user):
    if entry.is_system:
        require_system_manager(user)
    try:
        with transaction.atomic():
            entry.delete()
    except (ProtectedError, RestrictedError) as exc:
        objects = getattr(exc, "protected_objects", None) or getattr(
            exc, "restricted_objects", ()
        )
        related = sorted({str(obj._meta.verbose_name_plural) for obj in objects})
        raise api_error(
            "catalog_entry_in_use",
            "The entry is in use: retire or hide it instead.",
            {"related": ", ".join(related)},
        )


def check_hideable(entry):
    if not (entry.is_extensible and entry.is_system):
        raise api_error(
            "only_system_entries_can_be_hidden",
            "Only system entries can be hidden.",
        )


@transaction.atomic
def hide_entry(entry, organization):
    """The organization hides a system entry: it is no longer available to it."""
    check_hideable(entry)
    entry.hidden_by.add(organization)


@transaction.atomic
def unhide_entry(entry, organization):
    check_hideable(entry)
    entry.hidden_by.remove(organization)


def set_class_attributes(element_class, items, *, user):
    """Replace the attributes of a class with ``items``.

    Each item has ``attribute`` and optionally ``required`` and ``sort_order``.
    The attributes must be visible to the organization of the class.
    """
    attributes = [item["attribute"] for item in items]
    if len({attribute.pk for attribute in attributes}) != len(attributes):
        raise api_error(
            "class_attribute_duplicated",
            "The attribute is already in the class.",
            field="class_attributes",
        )
    visible = AttributeDefinition.objects.visible_to(element_class.organization)
    visible_ids = set(
        visible.filter(pk__in=[a.pk for a in attributes]).values_list("pk", flat=True)
    )
    for attribute in attributes:
        if attribute.pk not in visible_ids:
            raise api_error(
                "catalog_entry_not_available",
                "The attribute is not available.",
                {"name": attribute.name},
                field="class_attributes",
            )

    links = {
        link.attribute_id: link
        for link in ElementClassAttribute.objects.select_for_update().filter(
            element_class=element_class
        )
    }
    selected = {attribute.pk for attribute in attributes}
    for attribute_id, link in links.items():
        if attribute_id not in selected:
            link.delete()
    for index, item in enumerate(items):
        attribute = item["attribute"]
        link = links.get(attribute.pk) or ElementClassAttribute(
            element_class=element_class, attribute=attribute
        )
        required = item.get("required", False)
        sort_order = item.get("sort_order", index)
        if (
            not link._state.adding
            and link.required == required
            and link.sort_order == sort_order
        ):
            continue
        link.required = required
        link.sort_order = sort_order
        stamp(link, user)
        link.save()
