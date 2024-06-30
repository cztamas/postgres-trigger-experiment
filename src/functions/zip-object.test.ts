import { buildAndLoadTsToDb } from '../../test-helpers/plv8ify';
import { db } from '../db';

describe('zipObject', () => {
  beforeEach(async () => {
    await buildAndLoadTsToDb(__dirname, './zip-object.ts');
  });

  afterEach(async () => {
    await db.raw('DROP FUNCTION IF EXISTS zipObject');
  });

  test('handles imported dependencies correctly', async () => {
    const result = await db.raw(
      `SELECT zipObject(
        '["a", "b"]'::jsonb,
        '[1, 2]'::jsonb
      ) as result`
    );
    expect(result.rows).toEqual([{ result: { a: 1, b: 2 } }]);
  });
});
