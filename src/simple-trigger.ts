type Event = {
  id: string;
  type: string;
  user_id: string;
  timestamp: Date;
};

//@plv8ify-trigger
export function simpleTrigger(NEW: Event): Event {
  if (TG_OP === 'INSERT' && NEW.type === 'pathetic_failure') {
    plv8.execute(
      'INSERT INTO message_outbox (user_id, content, created_at) VALUES ($1, $2, NOW())',
      [NEW.user_id, "Don't give up!"]
    );
  }

  return NEW;
}
