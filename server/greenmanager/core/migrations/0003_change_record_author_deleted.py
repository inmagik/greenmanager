"""
The author of a change becomes NULL only when the user is deleted.

The trigger of migration 0002 lets an UPDATE set ``author_id`` to NULL, which the
ORM does for ``on_delete=SET_NULL`` before deleting the user. This constraint
trigger checks it at the commit, when the user must no longer exist: any other
writer that clears the author of a change fails.
"""

from django.db import migrations

FORWARDS = """
CREATE FUNCTION core_changerecord_author_deleted() RETURNS trigger AS $$
BEGIN
    IF OLD.author_id IS NOT NULL
       AND NEW.author_id IS NULL
       AND EXISTS (SELECT 1 FROM auth_core_user WHERE id = OLD.author_id) THEN
        RAISE EXCEPTION 'The author of a change is removed only with the user.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER core_changerecord_author_deleted
AFTER UPDATE OF author_id ON core_changerecord
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION core_changerecord_author_deleted();
"""

BACKWARDS = """
DROP TRIGGER IF EXISTS core_changerecord_author_deleted ON core_changerecord;
DROP FUNCTION IF EXISTS core_changerecord_author_deleted();
"""


class Migration(migrations.Migration):
    dependencies = [
        ("auth_core", "0001_initial"),
        ("core", "0002_change_record_immutable"),
    ]

    operations = [
        migrations.RunSQL(FORWARDS, BACKWARDS),
    ]
