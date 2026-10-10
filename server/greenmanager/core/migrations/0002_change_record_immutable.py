"""
The history of the changes cannot be changed or deleted (D-034), whoever writes to
the database: the ORM, the admin, a script.

The only update allowed sets the author to NULL, when the user is deleted
(``on_delete=SET_NULL``): ``author_label`` keeps the name.
"""

from django.db import migrations

FORWARDS = """
CREATE FUNCTION core_changerecord_immutable() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND NEW.author_id IS NULL
       AND (to_jsonb(NEW) - 'author_id') = (to_jsonb(OLD) - 'author_id') THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'The history of the changes cannot be changed or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER core_changerecord_immutable
BEFORE UPDATE OR DELETE ON core_changerecord
FOR EACH ROW EXECUTE FUNCTION core_changerecord_immutable();
"""

BACKWARDS = """
DROP TRIGGER IF EXISTS core_changerecord_immutable ON core_changerecord;
DROP FUNCTION IF EXISTS core_changerecord_immutable();
"""


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(FORWARDS, BACKWARDS),
    ]
