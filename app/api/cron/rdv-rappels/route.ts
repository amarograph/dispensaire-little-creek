import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/* Rappel Discord 1 h avant un rendez-vous : agenda commun, agenda de l'obstétrique et agenda du cabinet.
   À appeler chaque minute par un planificateur (ex. cron-job.org).
   Sécurité : secret obligatoire (CRON_SECRET) — sans lui la route refuse tout.
   Variables d'environnement : CRON_SECRET, DISCORD_RAPPELS_WEBHOOK_URL (webhook du salon des rendez-vous).
   Confidentialité : le message ne contient jamais de patient, de motif ni de notes — seulement le(s) médecin(s),
   la date et l'heure. */

const FENETRE_MIN = 60;        // rappel envoyé quand le RDV est dans <= 60 min…
const FENETRE_MAX_RETARD = 15; // …mais pas si le RDV est déjà passé de plus de 15 min

interface RendezVous {
  id: string; date: string; heure: string; statut: string; notes?: string;
  medecin?: string; medecinDiscordId?: string; medecinsSup?: { nom: string; discord_id: string }[]; rappelEnvoye?: boolean;
}
interface Annuaire { parNom: Map<string, string[]>; therapeutes: string[]; }

const KEY_COMMUN = 'redm_agenda_commun';
const KEY_OBS    = 'redm_obstetrique_agenda';
const KEY_CAB    = 'redm_cabinet_agenda';

/* Décalage horaire de Paris à un instant donné, en minutes (gère l'heure d'été / d'hiver) */
function parisOffsetMin(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

/* Heure saisie à la main : « 21 », « 21h », « 14h30 », « 22H00 », « 14:30 » */
function parseHeure(s: string | undefined): { h: number; m: number } | null {
  const mt = (s ?? '').trim().match(/^(\d{1,2})\s*(?:[hH:]\s*(\d{1,2})?)?$/);
  if (!mt) return null;
  return { h: Math.min(23, Number(mt[1])), m: Math.min(59, Number(mt[2] ?? 0)) };
}

/* Mise en gras « mathématique » Unicode (𝐀𝐚𝟎), comme le texte du rappel */
function gras(s: string): string {
  return Array.from(s).map(c => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1d400 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1d41a + c.charCodeAt(0) - 97);
    if (c >= '0' && c <= '9') return String.fromCodePoint(0x1d7ce + c.charCodeAt(0) - 48);
    return c;
  }).join('');
}

/* "DD/MM/1890" (année RP = réelle − 136) + heure de Paris → instant UTC */
function rdvInstant(date: string, heure: string): Date | null {
  const d = (date ?? '').trim().split('/').map(Number);
  /* Heures saisies à la main acceptées : « 21 », « 21h », « 14h30 », « 14:30 » */
  const hm = parseHeure(heure);
  if (d.length !== 3 || d.some(x => isNaN(x) || !x) || !hm) return null;
  const h = [hm.h, hm.m];
  const [day, month, y] = d;
  const year = y < 1900 ? y + 136 : y;
  const guess = new Date(Date.UTC(year, month - 1, day, h[0], h[1]));
  return new Date(guess.getTime() - parisOffsetMin(guess) * 60000);
}

const norm = (s: string) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/* Retrouve l'identifiant Discord d'un soignant à partir de son nom RP (anciens rendez-vous saisis à la main) */
function idParNom(nom: string | undefined, a: Annuaire): string[] {
  const q = norm(nom ?? '');
  if (!q) return [];
  const exact = a.parNom.get(q);
  if (exact && exact.length === 1) return exact;
  const partiel = Array.from(a.parNom.entries()).filter(([k]) => k.startsWith(q + ' ')).flatMap(([, v]) => v);
  return partiel.length === 1 ? partiel : [];
}

/* Qui tagger pour un rendez-vous de chaque agenda */
const SOURCES: { key: string; nom: string; avecNotes: boolean; mentions: (r: RendezVous, a: Annuaire) => string[] }[] = [
  { key: KEY_COMMUN, nom: 'commun', avecNotes: true, mentions: (r, a) => {
      const ids = [r.medecinDiscordId, ...(r.medecinsSup ?? []).map(s => s.discord_id)].filter((x): x is string => !!x);
      return ids.length > 0 ? ids : idParNom(r.medecin, a);
  } },
  { key: KEY_OBS, nom: 'obstetrique', avecNotes: false, mentions: (r, a) => r.medecinDiscordId ? [r.medecinDiscordId] : idParNom(r.medecin, a) },
  { key: KEY_CAB, nom: 'cabinet', avecNotes: false, mentions: (_r, a) => a.therapeutes },
];

function estDu(r: RendezVous, now: number): { du: boolean; raison: string } {
  if (r.rappelEnvoye) return { du: false, raison: 'deja_envoye' };
  if (r.statut === 'ANNULÉ' || r.statut === 'PASSÉ') return { du: false, raison: `statut_${r.statut}` };
  const t = rdvInstant(r.date, r.heure);
  if (!t) return { du: false, raison: 'date_ou_heure_invalide' };
  const minutes = (t.getTime() - now) / 60000;
  if (minutes <= FENETRE_MIN && minutes >= -FENETRE_MAX_RETARD) return { du: true, raison: 'du' };
  return { du: false, raison: `dans_${Math.round(minutes)}_min` };
}

async function lire(supabase: SupabaseClient, key: string): Promise<RendezVous[]> {
  const { data } = await supabase.from('site_config').select('value').eq('key', key).single();
  return Array.isArray(data?.value) ? data.value : [];
}

async function annuaire(supabase: SupabaseClient): Promise<Annuaire> {
  const [{ data: membres }, { data: profils }] = await Promise.all([
    supabase.from('members').select('discord_id, username, roles').eq('status', 'approved'),
    supabase.from('user_rp_profiles').select('discord_id, nom_rp, prenom_rp').eq('universe', 'redm'),
  ]);
  const rp: Record<string, string> = {};
  for (const p of profils ?? []) rp[p.discord_id] = [p.prenom_rp, p.nom_rp].filter(Boolean).join(' ');
  const parNom = new Map<string, string[]>();
  const therapeutes: string[] = [];
  for (const m of membres ?? []) {
    const nom = norm(rp[m.discord_id] ?? '');
    if (nom) parNom.set(nom, [...(parNom.get(nom) ?? []), m.discord_id]);
    if ((m.roles ?? []).includes('redm_therapeute')) therapeutes.push(m.discord_id);
  }
  return { parNom, therapeutes };
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const webhook = process.env.DISCORD_RAPPELS_WEBHOOK_URL;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.nextUrl.searchParams.get('key');
  if (!secret || given !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!webhook) return NextResponse.json({ ok: false, error: 'DISCORD_RAPPELS_WEBHOOK_URL non configurée' }, { status: 200 });

  /* Client sans cache : le planificateur doit toujours lire l'état réel des agendas */
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });

  const now = Date.now();
  const lus = await Promise.all(SOURCES.map(async s => ({ s, rdvs: await lire(supabase, s.key) })));

  /* RDV dus, avec les personnes à tagger (sans personne identifiée : rien à envoyer) */
  const dus: { s: typeof SOURCES[number]; rdv: RendezVous; mentions: string[] }[] = [];
  const diagnostic: Record<string, string[]> = {};
  let ann: Annuaire | null = null;
  for (const { s, rdvs } of lus) {
    diagnostic[s.nom] = [];
    for (const r of rdvs) {
      const { du, raison } = estDu(r, now);
      if (!du) { diagnostic[s.nom].push(raison); continue; }
      ann ??= await annuaire(supabase);
      const mentions = Array.from(new Set(s.mentions(r, ann)));
      if (mentions.length === 0) { diagnostic[s.nom].push('aucun_destinataire_discord'); continue; }
      dus.push({ s, rdv: r, mentions });
    }
  }
  if (dus.length === 0) return NextResponse.json({ ok: true, envoyes: 0, diagnostic });

  /* Anti-doublon : on MARQUE d'abord les rendez-vous comme « rappelés » (relecture fraîche + écriture ciblée),
     puis on envoie. Si le marquage échoue, on n'envoie rien : mieux vaut un rappel manqué qu'un message répété. */
  const marquer = async (key: string, ids: Set<string>, valeur: boolean): Promise<boolean> => {
    const courant = await lire(supabase, key);
    const next = courant.map(r => ids.has(r.id) ? { ...r, rappelEnvoye: valeur } : r);
    const { error } = await supabase.from('site_config').upsert({ key, value: next }, { onConflict: 'key' });
    return !error;
  };
  const parSource = new Map<string, Set<string>>();
  for (const d of dus) parSource.set(d.s.key, (parSource.get(d.s.key) ?? new Set()).add(d.rdv.id));
  for (const [key, ids] of Array.from(parSource.entries())) {
    if (!await marquer(key, ids, true)) return NextResponse.json({ ok: false, error: 'Marquage impossible, aucun rappel envoyé' }, { status: 500 });
  }

  const echecs = new Map<string, Set<string>>();
  const raisons: string[] = [];
  let envoyes = 0;
  for (const d of dus) {
    const hm = parseHeure(d.rdv.heure);
    const heure = hm ? `${String(hm.h).padStart(2, '0')}h${String(hm.m).padStart(2, '0')}` : (d.rdv.heure ?? '');
    /* Les notes ne sont reprises que pour l'agenda commun (là où elles sont visibles de tous) :
       celles du cabinet et de l'obstétrique restent confidentielles et ne vont jamais sur Discord. */
    const notes = d.s.avecNotes ? (d.rdv.notes ?? '').trim().slice(0, 600) : '';
    const complement = notes ? ` 𝐄𝐭 𝐯𝐨𝐢𝐜𝐢 𝐮𝐧 𝐜𝐨𝐦𝐩𝐥𝐞́𝐦𝐞𝐧𝐭 𝐝'𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 𝐩𝐨𝐮𝐫 𝐯𝐨𝐭𝐫𝐞 𝐫𝐞𝐧𝐝𝐞𝐳-𝐯𝐨𝐮𝐬 : ${notes}` : '';
    const content = `**𝐑𝐚𝐩𝐩𝐞𝐥 𝐝𝐞 𝐫𝐞𝐧𝐝𝐞𝐳-𝐯𝐨𝐮𝐬**\n\n𝐃𝐨𝐜𝐭𝐞𝐮𝐫 ${d.mentions.map(i => `<@${i}>`).join(' ')}, 𝐧𝐨𝐮𝐬 𝐯𝐨𝐮𝐬 𝐫𝐚𝐩𝐩𝐞𝐥𝐨𝐧𝐬 𝐪𝐮𝐞 𝐯𝐨𝐮𝐬 𝐚𝐯𝐞𝐳 𝐮𝐧 𝐫𝐞𝐧𝐝𝐞𝐳-𝐯𝐨𝐮𝐬 𝐩𝐫𝐞́𝐯𝐮 𝐥𝐞 **${gras(d.rdv.date)} 𝐚̀ ${gras(heure)}**, 𝐬𝐨𝐢𝐭 𝐝𝐚𝐧𝐬 𝐮𝐧𝐞 𝐡𝐞𝐮𝐫𝐞.${complement}\n\n𝐍𝐨𝐮𝐬 𝐯𝐨𝐮𝐬 𝐢𝐧𝐯𝐢𝐭𝐨𝐧𝐬 𝐚̀ 𝐩𝐫𝐞𝐧𝐝𝐫𝐞 𝐯𝐨𝐬 𝐝𝐢𝐬𝐩𝐨𝐬𝐢𝐭𝐢𝐨𝐧𝐬 𝐚𝐟𝐢𝐧 𝐝'𝐞̂𝐭𝐫𝐞 𝐝𝐢𝐬𝐩𝐨𝐧𝐢𝐛𝐥𝐞 𝐚̀ 𝐥'𝐡𝐞𝐮𝐫𝐞 𝐜𝐨𝐧𝐯𝐞𝐧𝐮𝐞.`;
    try {
      const res = await fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, allowed_mentions: { users: d.mentions } }),
      });
      if (res.ok) envoyes++;
      else { echecs.set(d.s.key, (echecs.get(d.s.key) ?? new Set()).add(d.rdv.id)); raisons.push(`discord_http_${res.status}`); }
    } catch {
      echecs.set(d.s.key, (echecs.get(d.s.key) ?? new Set()).add(d.rdv.id)); raisons.push('discord_injoignable_ou_url_invalide');
    }
  }

  /* Un envoi qui a échoué (Discord indisponible) est ré-armé pour être retenté au prochain passage */
  for (const [key, ids] of Array.from(echecs.entries())) await marquer(key, ids, false);

  return NextResponse.json({ ok: true, envoyes, echecs: raisons.length, raisons });
}
