import { db } from './db';
import { overrideDbTime, clearTimeOverride } from '../test-helpers/db';

describe('dummy tests', () => {
  afterEach(async () => {
    await clearTimeOverride();
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
});
