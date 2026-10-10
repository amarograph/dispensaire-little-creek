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
  id: string; date: string; heure: string; statut: string;
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

/* "DD/MM/1890" (année RP = réelle − 136) + "HH:MM" heure de Paris → instant UTC */
function rdvInstant(date: string, heure: string): Date | null {
  const d = (date ?? '').split('/').map(Number);
  const h = (heure ?? '').split(':').map(Number);
  if (d.length !== 3 || h.length < 2 || d.some(isNaN) || h.some(isNaN)) return null;
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
const SOURCES: { key: string; nom: string; mentions: (r: RendezVous, a: Annuaire) => string[] }[] = [
  { key: KEY_COMMUN, nom: 'commun', mentions: (r, a) => {
      const ids = [r.medecinDiscordId, ...(r.medecinsSup ?? []).map(s => s.discord_id)].filter((x): x is string => !!x);
      return ids.length > 0 ? ids : idParNom(r.medecin, a);
  } },
  { key: KEY_OBS, nom: 'obstetrique', mentions: (r, a) => r.medecinDiscordId ? [r.medecinDiscordId] : idParNom(r.medecin, a) },
  { key: KEY_CAB, nom: 'cabinet', mentions: (_r, a) => a.therapeutes },
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
    const heure = d.rdv.heure.replace(':', 'h');
    const content = `**Rappel de rendez-vous**\n\nDocteur ${d.mentions.map(i => `<@${i}>`).join(' ')}, nous vous rappelons que vous avez un rendez-vous prévu le **${d.rdv.date}** à **${heure}**, soit dans une heure.\n\nNous vous invitons à prendre vos dispositions afin d'être disponible à l'heure convenue.`;
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
