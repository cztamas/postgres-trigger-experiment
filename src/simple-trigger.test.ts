import { buildAndLoadTsToDb } from '../test-helpers/plv8ify';
import { db } from './db';
import { overrideDbTime, clearTimeOverride } from '../test-helpers/setup';

describe('simple trigger tests', () => {
  afterEach(async () => {
    await clearTimeOverride();
    await db.raw('SELECT remove_all_triggers()');
    await Promise.all([db('event').del(), db('message_outbox').del()]);
  });

  test('should insert a row to messages table if a failure event is inserted', async () => {
    await buildAndLoadTsToDb(__dirname, './simple-trigger.ts');
    await db.raw(
      'CREATE TRIGGER testTrigger BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE simpleTrigger();'
    );

    await db('event').insert({ user_id: 'nice_user', type: 'pathetic_failure' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ user_id: 'nice_user', content: "Don't give up!" });
  });

  test('should not insert messages for other event types', async () => {
    await buildAndLoadTsToDb(__dirname, './simple-trigger.ts');
    await db.raw(
      'CREATE TRIGGER testTrigger BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE simpleTrigger();'
    );

    await db('event').insert({ user_id: 'nice_user', type: 'some_other_event' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });

  test('should insert the events without modification', async () => {
    await buildAndLoadTsToDb(__dirname, './simple-trigger.ts');
    await db.raw(
      'CREATE TRIGGER testTrigger BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE simpleTrigger();'
    );

    await db('event').insert({ user_id: 'nice_user', type: 'pathetic_failure' });
    await db('event').insert({ user_id: 'nice_user', type: 'some_other_event' });

    const events = await db('event').select('*');

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ user_id: 'nice_user', type: 'pathetic_failure' });
    expect(events[1]).toMatchObject({ user_id: 'nice_user', type: 'some_other_event' });
  });

  test('DB current time can be overwritten', async () => {
    const testTimestamp = '2022-01-01T00:00:00Z';
    await overrideDbTime(testTimestamp);

    const result = await db.raw('SELECT now() as now');
    expect(result.rows).toEqual([{ now: new Date(testTimestamp) }]);
  });
});
