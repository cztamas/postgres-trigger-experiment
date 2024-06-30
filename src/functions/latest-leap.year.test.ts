import { buildAndLoadTsToDb } from '../../test-helpers/plv8ify';
import { db } from '../db';

describe('date handling', () => {
  beforeEach(async () => {
    await buildAndLoadTsToDb(__dirname, './latest-leap-year.ts');
  });

  afterEach(async () => {
    await db.raw('DROP FUNCTION IF EXISTS latestLeapDayBefore');
  });

  test('latestLeapDayBefore should return latest leap year before the given date', async () => {
    const result = await db.raw(
      `SELECT to_char(
        latestLeapDayBefore(
          to_date('2025-06-01', 'YYYY-MM-DD')
        ),
        'YYYY-MM-DD'
      ) as result`
    );
    expect(result.rows).toEqual([{ result: '2024-02-29' }]);
  });

  test('latestLeapDayBefore should handle non-leap special years', async () => {
    const result = await db.raw(
      `SELECT to_char(
        latestLeapDayBefore(
          to_date('2102-06-01', 'YYYY-MM-DD')
        ),
        'YYYY-MM-DD'
      ) as result`
    );
    expect(result.rows).toEqual([{ result: '2096-02-29' }]);
  });
});
