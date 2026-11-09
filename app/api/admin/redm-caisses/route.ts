import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionRead } from '@/lib/redm-api-auth';
import { getApiSession } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';
import { createClient } from '@supabase/supabase-js';
import { CAISSE_RATE, CAISSE_ROLES } from '@/lib/caisse-rates';
import { redmLog } from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

const CAISSE_EDITOR_ROLES = ['redm_directeur', 'redm_co_directeur', 'redm_medecin_chef'];

/* Équipe de chaque semaine : { 'YYYY-MM-DD' (lundi): [{ discord_id, nom, rpOk, numero_compte, roles, rate }] } */
const ROSTER_KEY = 'redm_caisses_roster';
interface RosterEntry { discord_id: string; nom: string; rpOk: boolean; numero_compte: string; roles: string[]; rate: number; }

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/* GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — caisses de tout le personnel concerné sur la période. Sans from/to : historique complet. */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  if ((from && !to) || (to && !from)) return NextResponse.json({ error: 'from et to doivent être fournis ensemble' }, { status: 400 });

  const supabase = db();

  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('discord_id, username, roles')
    .eq('status', 'approved');
  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const staff = (members ?? []).filter(m =>
    (m.roles ?? []).some((r: string) => (CAISSE_ROLES as readonly string[]).includes(r))
  );

  const { data: profiles } = await supabase
    .from('user_rp_profiles')
    .select('discord_id, nom_rp, prenom_rp')
    .eq('universe', 'redm');
  const rp: Record<string, { nom_rp: string; prenom_rp: string }> = {};
  for (const row of profiles ?? []) rp[row.discord_id] = row;

  /* N° de compte de chaque membre (fiche de la Liste des Médecins) */
  const { data: metas } = await supabase.from('redm_medecins_meta').select('discord_id, numero_compte');
  const compte: Record<string, string> = {};
  for (const row of metas ?? []) compte[row.discord_id] = row.numero_compte ?? '';

  let caissesQuery = supabase.from('redm_caisses').select('discord_id, date');
  if (from && to) caissesQuery = caissesQuery.gte('date', from).lte('date', to);
  const { data: caisses, error } = await caissesQuery;

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ staff: [], missing_table: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byUser: Record<string, string[]> = {};
  for (const c of caisses ?? []) (byUser[c.discord_id] ??= []).push(c.date);

  /* Équipe actuelle (nom prénom RP, grade, tarif) */
  const live: RosterEntry[] = staff.map(m => {
    const roles: string[] = m.roles ?? [];
    let rate = 0;
    for (const r of roles) {
      const v = CAISSE_RATE[r as keyof typeof CAISSE_RATE];
      if (v != null && v > rate) rate = v;
    }
    const p = rp[m.discord_id] ?? { prenom_rp: '', nom_rp: '' };
    const nomRp = [p.prenom_rp, p.nom_rp].filter(Boolean).join(' ');
    return {
      discord_id: m.discord_id,
      nom: nomRp || m.username,
      rpOk: !!nomRp,
      numero_compte: compte[m.discord_id] ?? '',
      roles,
      rate,
    };
  });

  /* Traçabilité : l'équipe de chaque semaine est conservée (nom RP, grade et tarif de l'époque).
     Dès qu'une personne n'est plus dans l'équipe (renvoyée / retirée), elle disparaît de toutes les semaines. */
  let roster: RosterEntry[] = live;
  if (from && to && live.length > 0) {
    const { data: rosterRow } = await supabase.from('site_config').select('value').eq('key', ROSTER_KEY).maybeSingle();
    const stored: Record<string, RosterEntry[]> = rosterRow?.value && typeof rosterRow.value === 'object' && !Array.isArray(rosterRow.value) ? rosterRow.value : {};
    const liveById = new Map(live.map(e => [e.discord_id, e]));

    /* 1. on retire des semaines enregistrées ceux qui ne sont plus dans l'équipe */
    const next: Record<string, RosterEntry[]> = {};
    for (const [wk, entries] of Object.entries(stored)) {
      if (!Array.isArray(entries)) continue;
      next[wk] = entries.filter(e => e && liveById.has(e.discord_id));
    }

    /* 2. semaine en cours (ou presque) : l'équipe actuelle ; semaine passée : l'équipe enregistrée */
    const limiteSemaineEnCours = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (to >= limiteSemaineEnCours || !next[from]) {
      next[from] = live;
      roster = live;
    } else {
      roster = next[from].map(e => {
        const l = liveById.get(e.discord_id)!;
        return {
          ...e,
          numero_compte: l.numero_compte || e.numero_compte || '',
          ...(!e.rpOk && l.rpOk ? { nom: l.nom, rpOk: true } : {}),   // le nom RP a été renseigné depuis
        };
      });
      next[from] = roster;
    }

    if (JSON.stringify(next) !== JSON.stringify(stored)) {
      await supabase.from('site_config').upsert({ key: ROSTER_KEY, value: next }, { onConflict: 'key' });
    }
  }

  const result = roster.map(e => {
    const dates = (byUser[e.discord_id] ?? []).sort();
    return {
      discord_id: e.discord_id,
      nom: e.nom,
      numero_compte: e.numero_compte ?? '',
      roles: e.roles,
      rate: e.rate,
      dates,
      count: dates.length,
      salaire: Math.round(dates.length * e.rate * 100) / 100,
    };
  }).sort((a, b) => b.rate - a.rate || a.nom.localeCompare(b.nom));

  return NextResponse.json({ staff: result });
}

/* POST { discord_id, date } — bascule manuellement une caisse (Direction / Co-direction / Médecin en Chef) */
export async function POST(req: NextRequest) {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = isAdmin(session.roles) || session.roles.some(r => CAISSE_EDITOR_ROLES.includes(r));
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { discord_id, date } = await req.json();
  if (!discord_id || !date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = db();
  const actor = { id: session.discordId, name: session.username };

  const { data: existing } = await supabase
    .from('redm_caisses')
    .select('id')
    .eq('discord_id', discord_id)
    .eq('date', date)
    .single();

  if (existing) {
    const { error } = await supabase.from('redm_caisses').delete().eq('discord_id', discord_id).eq('date', date);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redmLog(actor, { action: 'caisse_remove', category: 'caisses', description: `A retiré la caisse de ${discord_id} pour le ${date}`, meta: { discord_id, date } });
    return NextResponse.json({ done: false });
  } else {
    const { error } = await supabase.from('redm_caisses').insert({ discord_id, date });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    redmLog(actor, { action: 'caisse_add', category: 'caisses', description: `A ajouté la caisse de ${discord_id} pour le ${date}`, meta: { discord_id, date } });
    return NextResponse.json({ done: true });
  }
}
