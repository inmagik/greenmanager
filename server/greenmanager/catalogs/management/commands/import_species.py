"""
Load system species from a CSV file (catalog CT-2).

Columns: code, rank, scientific_name, genus, specific_epithet, infraspecific,
cultivar, family, common_name, parent_code, synonyms (separated by ``|``),
external_ref. Only ``code`` and ``scientific_name`` are required.

The entries are matched by code: new codes are created, existing ones are left
as they are unless ``--update``. The keys of the new entries are deterministic
(``core.models.system_entry_id``).

    python manage.py import_species catalogs/seeds/species_starter.csv
"""

import csv

from catalogs.models import Species
from catalogs.services import lock_species_name, normalize, validate_references
from core.errors import django_errors_payload
from core.models import system_entry_id
from core.services import snapshot, stamp
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from rest_framework.exceptions import APIException

FIELDS = (
    "rank",
    "scientific_name",
    "genus",
    "specific_epithet",
    "infraspecific",
    "cultivar",
    "family",
    "common_name",
    "external_ref",
)


class Command(BaseCommand):
    help = "Load system species from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("path", help="CSV file, UTF-8, comma separated.")
        parser.add_argument(
            "--update",
            action="store_true",
            help="Update the entries that already exist.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Check the file without saving anything.",
        )

    def handle(self, path, update=False, dry_run=False, **options):
        try:
            with open(path, newline="", encoding="utf-8-sig") as file:
                rows = list(csv.DictReader(file))
        except OSError as exc:
            raise CommandError(f"Cannot read {path}: {exc}") from exc

        counts = {"created": 0, "updated": 0, "unchanged": 0}
        with transaction.atomic():
            entries, created = {}, set()
            for line, row in enumerate(rows, start=2):
                entry, outcome = self.import_row(row, line, update)
                entries[entry.code] = entry
                counts[outcome] += 1
                if outcome == "created":
                    created.add(entry.code)
            self.link_parents(rows, entries, created, update)
            if dry_run:
                transaction.set_rollback(True)

        prefix = "[dry run] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"{prefix}Species: {counts['created']} created, "
                f"{counts['updated']} updated, {counts['unchanged']} unchanged."
            )
        )

    def import_row(self, row, line, update):
        code = (row.get("code") or "").strip()
        if not code or not (row.get("scientific_name") or "").strip():
            raise CommandError(f"Line {line}: code and scientific_name are required.")

        entry = Species.objects.system().filter(code=code).first()
        if entry is not None and not update:
            return entry, "unchanged"
        created = entry is None
        if created:
            entry = Species(id=system_entry_id("catalogs.species", code), code=code)
        before = None if created else snapshot(entry)
        for field in FIELDS:
            value = (row.get(field) or "").strip()
            if value or field != "rank":
                setattr(entry, field, value)
        entry.synonyms = [
            name.strip() for name in (row.get("synonyms") or "").split("|") if name
        ]
        entry.source = entry.source or "GreenManager, elenco iniziale"
        normalize(entry)
        # Before any check of the name, as in services.prepare_entry.
        lock_species_name(entry.scientific_name)
        try:
            # The parent is linked in a second pass.
            entry.full_clean(exclude=["parent"])
            # The rules of the API too, e.g. the name unique across the scopes.
            validate_references(entry)
        except ValidationError as exc:
            raise CommandError(
                f"Line {line} ({code}): {django_errors_payload(exc, Species)}"
            ) from exc
        except APIException as exc:
            raise CommandError(f"Line {line} ({code}): {exc.detail}") from exc
        if not created and snapshot(entry) == before:
            return entry, "unchanged"
        # A change of the command has no author: it is the system's.
        stamp(entry, None)
        entry.save()
        return entry, "created" if created else "updated"

    def link_parents(self, rows, entries, created, update):
        """Link the parents of the entries created now, and with ``--update`` of
        the existing ones too: without it, existing entries stay as they are."""
        for row in rows:
            code = row["code"].strip()
            parent_code = (row.get("parent_code") or "").strip()
            entry = entries[code]
            if code not in created and not update:
                continue
            if not parent_code:
                if entry.parent_id is not None:
                    entry.parent = None
                    stamp(entry, None)
                    entry.save(update_fields=["parent"])
                continue
            parent = entries.get(parent_code) or (
                Species.objects.system().filter(code=parent_code).first()
            )
            if parent is None:
                raise CommandError(f"{code}: unknown parent {parent_code}.")
            if entry.parent_id != parent.pk:
                entry.parent = parent
                try:
                    entry.full_clean()
                except ValidationError as exc:
                    raise CommandError(
                        f"{code}: {django_errors_payload(exc, Species)}"
                    ) from exc
                stamp(entry, None)
                entry.save(update_fields=["parent"])
