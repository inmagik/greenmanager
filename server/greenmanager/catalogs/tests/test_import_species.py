import csv
import tempfile
from io import StringIO
from pathlib import Path

from catalogs.models import Species
from core.models import system_entry_id
from core.testing import make_tenant, make_user
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext

FIELDS = (
    "code",
    "rank",
    "scientific_name",
    "genus",
    "specific_epithet",
    "family",
    "common_name",
    "parent_code",
    "synonyms",
)


class ImportSpeciesTests(TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write_csv(self, rows):
        path = Path(self.directory.name) / "species.csv"
        with path.open("w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(rows)
        return str(path)

    def run_command(self, *args):
        output = StringIO()
        call_command("import_species", *args, stdout=output)
        return output.getvalue()

    def rows(self, common_name="tiglio selvatico"):
        return [
            {
                "code": "tilia-cordata",
                "rank": "species",
                "scientific_name": "Tilia cordata",
                "specific_epithet": "cordata",
                "family": "Malvaceae",
                "common_name": common_name,
                "parent_code": "tilia",
                "synonyms": "Tilia parvifolia|Tilia ulmifolia",
            },
            {
                "code": "tilia",
                "rank": "genus",
                "scientific_name": "Tilia",
                "family": "Malvaceae",
            },
        ]

    def test_creates_system_entries_with_parents_and_synonyms(self):
        output = self.run_command(self.write_csv(self.rows()))

        self.assertIn("2 created", output)
        species = Species.objects.get(code="tilia-cordata")
        self.assertIsNone(species.organization)
        self.assertEqual(
            species.pk, system_entry_id("catalogs.species", "tilia-cordata")
        )
        self.assertEqual(species.genus, "Tilia")
        self.assertEqual(species.parent.code, "tilia")
        self.assertEqual(species.synonyms, ["Tilia parvifolia", "Tilia ulmifolia"])

    def test_existing_entries_change_only_with_update(self):
        self.run_command(self.write_csv(self.rows()))
        path = self.write_csv(self.rows(common_name="tiglio"))

        again = self.run_command(path)
        unchanged = Species.objects.get(code="tilia-cordata").common_name
        self.run_command(path, "--update")
        updated = Species.objects.get(code="tilia-cordata").common_name

        self.assertIn("2 unchanged", again)
        self.assertEqual(unchanged, "tiglio selvatico")
        self.assertEqual(updated, "tiglio")

    def test_dry_run_saves_nothing(self):
        output = self.run_command(self.write_csv(self.rows()), "--dry-run")

        self.assertIn("[dry run]", output)
        self.assertFalse(Species.objects.exists())

    def test_update_clears_a_parent_removed_from_the_file(self):
        self.run_command(self.write_csv(self.rows()))
        rows = self.rows()
        rows[0]["parent_code"] = ""

        self.run_command(self.write_csv(rows), "--update")

        self.assertIsNone(Species.objects.get(code="tilia-cordata").parent)

    def test_changes_of_the_import_have_no_author(self):
        self.run_command(self.write_csv(self.rows()))
        user = make_user("editor@example.com")
        Species.objects.update(updated_by=user)
        rows = self.rows()
        rows[0]["parent_code"] = ""
        rows[1]["family"] = "Tiliaceae"

        self.run_command(self.write_csv(rows), "--update")

        # A change of the fields (tilia) and one of the parent (tilia-cordata).
        self.assertFalse(Species.objects.filter(updated_by__isnull=False).exists())

    def test_update_checks_the_final_hierarchy(self):
        # A cultivar becomes a species: its parent, a species, becomes the genus.
        rows = self.rows() + [
            {
                "code": "tilia-greenspire",
                "rank": "cultivar",
                "scientific_name": "Tilia cordata 'Greenspire'",
                "parent_code": "tilia-cordata",
            }
        ]
        self.run_command(self.write_csv(rows))
        rows[2].update(
            rank="species", scientific_name="Tilia platyphyllos", parent_code="tilia"
        )

        self.run_command(self.write_csv(rows), "--update")

        entry = Species.objects.get(code="tilia-greenspire")
        self.assertEqual((entry.rank, entry.parent.code), ("species", "tilia"))

    def test_update_locks_the_existing_entries(self):
        self.run_command(self.write_csv(self.rows()))

        with CaptureQueriesContext(connection) as queries:
            self.run_command(self.write_csv(self.rows()), "--update")

        locking = [
            query["sql"]
            for query in queries.captured_queries
            if "FOR UPDATE" in query["sql"] and '"catalogs_species"' in query["sql"]
        ]
        self.assertEqual(len(locking), 2)

    def test_parent_only_changes_are_counted_as_updates(self):
        self.run_command(self.write_csv(self.rows()))
        rows = self.rows()
        rows[0]["parent_code"] = ""

        output = self.run_command(self.write_csv(rows), "--update")

        self.assertIn("0 created, 1 updated, 1 unchanged", output)

    def test_existing_entries_get_no_parent_without_update(self):
        rows = self.rows()
        rows[0]["parent_code"] = ""
        self.run_command(self.write_csv(rows))

        self.run_command(self.write_csv(self.rows()))

        self.assertIsNone(Species.objects.get(code="tilia-cordata").parent)

    def test_an_entry_cannot_be_its_own_parent(self):
        rows = self.rows()
        rows[1]["parent_code"] = "tilia"

        with self.assertRaises(CommandError):
            self.run_command(self.write_csv(rows))
        self.assertFalse(Species.objects.exists())

    def test_system_species_do_not_repeat_active_own_entries(self):
        organization = make_tenant("Org")
        Species.objects.create(
            code="own",
            rank="genus",
            scientific_name="Tilia",
            genus="Tilia",
            organization=organization,
        )

        with self.assertRaises(CommandError):
            self.run_command(self.write_csv(self.rows()))
        self.assertFalse(Species.objects.system().exists())

    def test_unknown_parent_stops_the_import(self):
        rows = self.rows()[:1]

        with self.assertRaises(CommandError):
            self.run_command(self.write_csv(rows))
        self.assertFalse(Species.objects.exists())

    def test_starter_list_loads(self):
        starter = Path(__file__).resolve().parents[1] / "seeds" / "species_starter.csv"
        output = self.run_command(str(starter))

        self.assertIn("created", output)
        self.assertEqual(
            Species.objects.get(code="platanus-hispanica").parent.code, "platanus"
        )
