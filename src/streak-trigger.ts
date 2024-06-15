import { Event } from './types';

//@plv8ify-trigger
export function streakTrigger(NEW: Event): Event {
  if (TG_OP !== 'INSERT' || NEW.type !== 'success') return NEW;

  // I could not mock the date inside the v8 engine... :(
  const { now } = plv8.execute('SELECT NOW()::date as now')[0];
  if (now.getDay() !== 0) return NEW;

  const successesFromThisWeek = plv8.execute(
    `SELECT * FROM event WHERE user_id = $1 AND type = $2 AND timestamp >= NOW() - INTERVAL '7 days'`,
    [NEW.user_id, 'success']
  );
  // kind of quick and dirty, this wouldn't work with any other streak length except 7 days
  const daysWithSuccess = new Set(
    successesFromThisWeek.map((event: Event) => event.timestamp.getDay()).filter(day => day !== 0)
  );
  if (daysWithSuccess.size < 6) return NEW;

  const message = 'You have an awesome full-week streak!';
  plv8.execute('INSERT INTO message_outbox (user_id, content, created_at) VALUES ($1, $2, NOW())', [
    NEW.user_id,
    message
  ]);

  return NEW;
}
