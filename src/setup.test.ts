import { db } from './db';
import { overrideDbTime, clearTimeOverride } from '../test-helpers/db';

describe('dummy tests', () => {
  afterEach(async () => {
    await clearTimeOverride();
    await db.raw('DROP FUNCTION IF EXISTS plv8_test');
  });

  test('should connect to DB', async () => {
    const result = await db.raw("SELECT 'world' as hello");
    expect(result.rows).toEqual([{ hello: 'world' }]);
  });

  test('DB current time can be overwritten', async () => {
    const testTimestamp = '2022-01-01T00:00:00Z';
    await overrideDbTime(testTimestamp);

    const result = await db.raw('SELECT now() as now');
    expect(result.rows).toEqual([{ now: new Date(testTimestamp) }]);
  });

  test('plv8 should be loaded correctly', async () => {
    await db.raw(`
      CREATE FUNCTION plv8_test(value INTEGER) RETURNS VARCHAR AS $$
        const range = Array(value).fill(null).map((_, index) => index);
        return JSON.stringify(range);
      $$ LANGUAGE plv8 IMMUTABLE STRICT;
    `);

    const result = await db.raw('SELECT plv8_test(5) as result');
    expect(result.rows).toEqual([{ result: '[0,1,2,3,4]' }]);
  });
});
