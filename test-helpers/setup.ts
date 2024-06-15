import '../env/load-env';
import { db } from '../src/db';

afterAll(async () => {
  await db.destroy();
});

beforeAll(async () => {
  await db.raw(`
    CREATE SCHEMA IF NOT EXISTS test_overrides;

    CREATE OR REPLACE FUNCTION test_overrides.now()
      RETURNS timestamptz IMMUTABLE PARALLEL SAFE AS
    $$
    BEGIN
        if current_setting('test_overrides.time_override', true) is null or current_setting('test_overrides.time_override') = '' then
            return pg_catalog.now();
        else
            return current_setting('test_overrides.time_override')::timestamptz;
        end if;
    END
    $$ language plpgsql;
  `);

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

export const overrideDbTime = async (timestamp: string) => {
  await db.raw(`
    set search_path = test_overrides,pg_temp,"$user",public,pg_catalog;
    set test_overrides.time_override = '${timestamp}';
`);
};

export const clearTimeOverride = async () => {
  await db.raw(`set test_overrides.time_override = ''`);
};
