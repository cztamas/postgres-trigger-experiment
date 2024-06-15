import { Event } from '../types';

export function simpleTrigger(NEW: Event): Event {
  if (TG_OP !== 'INSERT' || !['failure', 'success'].includes(NEW.type)) return NEW;

  const message = NEW.type === 'failure' ? "Don't give up!" : 'Congratulations!';
  plv8.execute('INSERT INTO message_outbox (user_id, content, created_at) VALUES ($1, $2, NOW())', [
    NEW.user_id,
    message
  ]);

  return NEW;
}
