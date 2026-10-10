import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/* Rappel Discord 1 h avant un rendez-vous de l'agenda commun.
   À appeler régulièrement (toutes les 5 min) par un planificateur : Vercel Cron (Pro) ou service externe.
   Sécurité : secret obligatoire (CRON_SECRET) — sans lui la route refuse tout.
   Variables d'environnement : CRON_SECRET, DISCORD_RAPPELS_WEBHOOK_URL (webhook du salon du dispensaire). */

const KEY = 'redm_agenda_commun';
const FENETRE_MIN = 60;        // rappel envoyé quand le RDV est dans <= 60 min…
const FENETRE_MAX_RETARD = 15; // …mais pas si le RDV est déjà passé de plus de 15 min

interface RendezVous {
  id: string; patientNom: string; date: string; heure: string;
  type: string; statut: string; notes: string; createdAt: string;
  medecin?: string; medecinDiscordId?: string; medecinsSup?: { nom: string; discord_id: string }[]; rappelEnvoye?: boolean;
}

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
  const d = date.split('/').map(Number);
  const h = heure.split(':').map(Number);
  if (d.length !== 3 || h.length < 2 || d.some(isNaN) || h.some(isNaN)) return null;
  const [day, month, y] = d;
  const year = y < 1900 ? y + 136 : y;
  const guess = new Date(Date.UTC(year, month - 1, day, h[0], h[1]));
  return new Date(guess.getTime() - parisOffsetMin(guess) * 60000);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const webhook = process.env.DISCORD_RAPPELS_WEBHOOK_URL;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? req.nextUrl.searchParams.get('key');
  if (!secret || given !== secret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!webhook) return NextResponse.json({ ok: false, error: 'DISCORD_RAPPELS_WEBHOOK_URL non configurée' }, { status: 200 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const rdvs: RendezVous[] = Array.isArray(data?.value) ? data.value : [];

  const now = Date.now();
  const aEnvoyer = rdvs.filter(r => {
    if (r.rappelEnvoye || !r.medecinDiscordId) return false;
    if (r.statut === 'ANNULÉ' || r.statut === 'PASSÉ') return false;
    const t = rdvInstant(r.date, r.heure);
    if (!t) return false;
    const minutes = (t.getTime() - now) / 60000;
    return minutes <= FENETRE_MIN && minutes >= -FENETRE_MAX_RETARD;
  });
  if (aEnvoyer.length === 0) return NextResponse.json({ ok: true, envoyes: 0 });

  /* Anti-doublon : on MARQUE d'abord les rendez-vous comme « rappelés » (relecture fraîche + écriture ciblée),
     puis on envoie. Si le marquage échoue, on n'envoie rien : mieux vaut un rappel manqué qu'un message répété
     à chaque passage du planificateur. */
  const ids = new Set(aEnvoyer.map(r => r.id));
  const { data: fresh } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  const current: RendezVous[] = Array.isArray(fresh?.value) ? fresh.value : [];
  const marque = current.map(r => ids.has(r.id) && !r.rappelEnvoye ? { ...r, rappelEnvoye: true } : r);
  const { error: errMark } = await supabase.from('site_config').upsert({ key: KEY, value: marque }, { onConflict: 'key' });
  if (errMark) return NextResponse.json({ ok: false, error: 'Marquage impossible, aucun rappel envoyé' }, { status: 500 });

  const echecs: string[] = [];
  let envoyes = 0;
  for (const r of aEnvoyer) {
    const mentions = Array.from(new Set([r.medecinDiscordId, ...(r.medecinsSup ?? []).map(s => s.discord_id)].filter((x): x is string => !!x)));
    /* Confidentialité : ni nom du patient, ni notes, ni motif — seulement les médecins, la date et l'heure */
    const heure = r.heure.replace(':', 'h');
    const content = `**Rappel de rendez-vous**\n\nDocteur ${mentions.map(i => `<@${i}>`).join(' ')}, nous vous rappelons que vous avez un rendez-vous prévu le **${r.date}** à **${heure}**, soit dans une heure.\n\nNous vous invitons à prendre vos dispositions afin d'être disponible à l'heure convenue.`;
    try {
      const res = await fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, allowed_mentions: { users: mentions } }),
      });
      if (res.ok) envoyes++; else echecs.push(r.id);
    } catch { echecs.push(r.id); }
  }

  /* Un envoi qui a échoué (Discord indisponible) est ré-armé pour être retenté au prochain passage */
  if (echecs.length > 0) {
    const { data: again } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const cur: RendezVous[] = Array.isArray(again?.value) ? again.value : [];
    const redo = new Set(echecs);
    await supabase.from('site_config').upsert({ key: KEY, value: cur.map(r => redo.has(r.id) ? { ...r, rappelEnvoye: false } : r) }, { onConflict: 'key' });
  }

  return NextResponse.json({ ok: true, envoyes, echecs: echecs.length });
}
