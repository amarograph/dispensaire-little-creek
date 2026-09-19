import { createClient } from '@supabase/supabase-js';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface RedmLogActor {
  id:   string;
  name: string;
}

export function redmLog(
  actor: RedmLogActor,
  entry: {
    action:      string;
    category:    string;
    description: string;
    meta?:       Record<string, unknown>;
  },
) {
  void db()
    .from('redm_logs')
    .insert({
      actor_discord_id: actor.id,
      actor_name:       actor.name,
      action:           entry.action,
      category:         entry.category,
      description:      entry.description,
      meta:             entry.meta ?? {},
    })
    .then(() => {}, () => {});
}
