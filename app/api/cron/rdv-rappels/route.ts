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

  const envoyes: string[] = [];
  for (const r of aEnvoyer) {
    const ids = Array.from(new Set([r.medecinDiscordId, ...(r.medecinsSup ?? []).map(s => s.discord_id)].filter((x): x is string => !!x)));
    const content = `⏰ ${ids.map(i => `<@${i}>`).join(' ')} **Rappel — rendez-vous dans 1 h**\n📅 ${r.date} à **${r.heure}** · ${r.type || 'Rendez-vous'}\n👤 Patient : ${r.patientNom}`; /* les notes (parfois privées) ne sont jamais publiées sur Discord */
    try {
      const res = await fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, allowed_mentions: { users: ids } }),
      });
      if (res.ok) envoyes.push(r.id);
    } catch {}
  }

  /* Marquage atomique : relecture fraîche puis écriture ciblée (n'écrase pas un RDV créé entre-temps) */
  if (envoyes.length > 0) {
    const { data: fresh } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const current: RendezVous[] = Array.isArray(fresh?.value) ? fresh.value : [];
    const done = new Set(envoyes);
    const next = current.map(r => done.has(r.id) ? { ...r, rappelEnvoye: true } : r);
    await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
  }

  return NextResponse.json({ ok: true, envoyes: envoyes.length });
}
