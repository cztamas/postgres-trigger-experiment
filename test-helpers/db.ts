import { Client } from 'pg';
import { db } from '../src/db';

export const pgClient = new Client({ connectionString: process.env.DATABASE_URL });

export const overrideDbTime = async (timestamp: string) => {
  await db.raw(`
    set search_path = test_overrides,pg_temp,"$user",public,pg_catalog;
    set test_overrides.time_override = '${timestamp}';
`);
};

export const clearTimeOverride = async () => {
  await db.raw(`set test_overrides.time_override = ''`);
};
