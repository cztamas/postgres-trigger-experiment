import { db } from './db';

describe('dummy tests', () => {
  test('tests runner should be set up', () => {
    expect(1 + 1).toBe(2);
  });

  test('should connect to DB', async () => {
    const result = await db.raw("SELECT 'world' as hello");
    expect(result.rows).toEqual([{ hello: 'world' }]);
  });
});
