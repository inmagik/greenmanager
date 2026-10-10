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
from catalogs.services import normalize
from core.errors import django_errors_payload
from core.models import system_entry_id
from core.services import snapshot
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

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
            entries = {}
            for line, row in enumerate(rows, start=2):
                entry, outcome = self.import_row(row, line, update)
                entries[entry.code] = entry
                counts[outcome] += 1
            self.link_parents(rows, entries, update)
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
        try:
            # The parent is linked in a second pass.
            entry.full_clean(exclude=["parent"])
        except ValidationError as exc:
            raise CommandError(
                f"Line {line} ({code}): {django_errors_payload(exc, Species)}"
            ) from exc
        if not created and snapshot(entry) == before:
            return entry, "unchanged"
        entry.save()
        return entry, "created" if created else "updated"

    def link_parents(self, rows, entries, update):
        for row in rows:
            code = row["code"].strip()
            parent_code = (row.get("parent_code") or "").strip()
            entry = entries[code]
            if not parent_code:
                if update and entry.parent_id is not None:
                    entry.parent = None
                    entry.save(update_fields=["parent"])
                continue
            if entry.parent_id is not None and not update:
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
                entry.save(update_fields=["parent"])
