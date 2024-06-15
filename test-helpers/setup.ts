import '../env/load-env';
import { db } from '../src/db';

afterAll(async () => {
  await db.destroy();
});

beforeAll(async () => {
  await db.raw(`
    CREATE OR REPLACE FUNCTION remove_all_triggers() RETURNS text AS $$ DECLARE
      triggNameRecord RECORD;
      triggTableRecord RECORD;
    BEGIN
        FOR triggNameRecord IN select distinct(trigger_name) from information_schema.triggers where trigger_schema = 'public' LOOP
            FOR triggTableRecord IN SELECT distinct(event_object_table) from information_schema.triggers where trigger_name = triggNameRecord.trigger_name LOOP
                RAISE NOTICE 'Dropping trigger: % on table: %', triggNameRecord.trigger_name, triggTableRecord.event_object_table;
                EXECUTE 'DROP TRIGGER ' || triggNameRecord.trigger_name || ' ON ' || triggTableRecord.event_object_table || ';';
            END LOOP;
        END LOOP;

        RETURN 'done';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;`);
});
