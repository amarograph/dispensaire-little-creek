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

import { rpNameOf } from '@/lib/rp-name';

export function redmLog(
  actor: RedmLogActor,
  entry: {
    action:      string;
    category:    string;
    description: string;
    meta?:       Record<string, unknown>;
  },
) {
  /* L'auteur est enregistré sous son nom et prénom RP (le pseudo Discord reste le repli) */
  void (async () => {
    const nom = await rpNameOf(actor.id, actor.name);
    await db()
      .from('redm_logs')
      .insert({
        actor_discord_id: actor.id,
        actor_name:       nom,
        action:           entry.action,
        category:         entry.category,
        description:      actor.name && nom !== actor.name ? entry.description.split(actor.name).join(nom) : entry.description,
        meta:             entry.meta ?? {},
      });
  })().then(() => {}, () => {});
}
