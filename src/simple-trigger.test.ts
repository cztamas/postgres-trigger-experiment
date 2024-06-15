import { buildAndLoadTsToDb } from '../test-helpers/plv8ify';
import { db } from './db';

describe('simple trigger tests', () => {
  afterEach(async () => {
    await db.raw('SELECT remove_all_triggers()');
    await Promise.all([db('event').del(), db('message_outbox').del()]);
  });

  const loadTrigger = async () => {
    await buildAndLoadTsToDb(__dirname, './simple-trigger.ts');
    await db.raw(
      'CREATE TRIGGER testTrigger BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE simpleTrigger();'
    );
  };

  test('should insert a row to messages table if a failure event is inserted', async () => {
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'failure' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ user_id: 'nice_user', content: "Don't give up!" });
  });

  test('should insert a row to messages table if a success event is inserted', async () => {
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ user_id: 'nice_user', content: 'Congratulations!' });
  });

  test('should not insert messages for other event types', async () => {
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'some_other_event' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });

  test('should insert the events without modification', async () => {
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'pathetic_failure' });
    await db('event').insert({ user_id: 'nice_user', type: 'some_other_event' });

    const events = await db('event').select('*');

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ user_id: 'nice_user', type: 'pathetic_failure' });
    expect(events[1]).toMatchObject({ user_id: 'nice_user', type: 'some_other_event' });
  });
});
