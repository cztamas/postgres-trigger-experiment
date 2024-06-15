import { addDays } from 'date-fns';
import { buildAndLoadTsToDb } from '../test-helpers/plv8ify';
import { overrideDbTime, clearTimeOverride } from '../test-helpers/db';
import { db } from './db';

const range = (length: number) => Array.from({ length }, (_, i) => i);
const someSunday = new Date('2024-06-02T12:00:00Z');

describe('streakTrigger', () => {
  const loadTrigger = async () => {
    await buildAndLoadTsToDb(__dirname, './streak-trigger.ts');
    await db.raw(
      'CREATE TRIGGER streakTrigger BEFORE INSERT ON event FOR EACH ROW EXECUTE PROCEDURE streakTrigger();'
    );
  };

  afterEach(async () => {
    await db.raw('SELECT remove_all_triggers()');
    await Promise.all([db('event').del(), db('message_outbox').del()]);
    await clearTimeOverride();
  });

  test('should insert a message if a success event is inserted on Sunday with a streak of at least 7 days', async () => {
    await overrideDbTime(someSunday);

    const previousDays = range(6).map(days => addDays(someSunday, -days - 1));
    await db('event').insert(
      previousDays.map(date => ({ user_id: 'nice_user', type: 'success', timestamp: date }))
    );
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      user_id: 'nice_user',
      content: 'You have an awesome full-week streak!',
      created_at: someSunday
    });
  });

  test('should not insert a message if the current day is not a Sunday', async () => {
    const mockDate = new Date('2024-06-03T12:00:00Z'); // this is a Monday
    await overrideDbTime(mockDate);

    const previousDays = range(6).map(days => addDays(mockDate, -days - 1));
    await db('event').insert(
      previousDays.map(date => ({ user_id: 'nice_user', type: 'success', timestamp: date }))
    );
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });

  test('should not insert a message if the streak is shorter than 7 days', async () => {
    await overrideDbTime(someSunday);

    const previousDays = range(5).map(days => addDays(someSunday, -days - 1));
    await db('event').insert(
      previousDays.map(date => ({ user_id: 'nice_user', type: 'success', timestamp: date }))
    );
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });

  test('should ignore other event types', async () => {
    await overrideDbTime(someSunday);

    const previousDays = range(6).map(days => addDays(someSunday, -days - 1));
    await db('event').insert(
      previousDays.map(date => ({ user_id: 'nice_user', type: 'failure', timestamp: date }))
    );
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });

  test("should ignore other users' events", async () => {
    await overrideDbTime(someSunday);

    const previousDays = range(6).map(days => addDays(someSunday, -days - 1));
    await db('event').insert(
      previousDays.map(date => ({ user_id: 'other_user', type: 'success', timestamp: date }))
    );
    await loadTrigger();

    await db('event').insert({ user_id: 'nice_user', type: 'success' });

    const messages = await db('message_outbox').select('*');
    expect(messages).toHaveLength(0);
  });
});
