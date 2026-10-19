import type { SupabaseClient } from '@supabase/supabase-js';

/* Rappel Discord quotidien « faites votre caisse » : à l'heure réglée dans Direction → Rappel de caisse,
   tague les préparateurs de caisse (et seulement eux) dans le salon du webhook DISCORD_CAISSE_WEBHOOK_URL.
   Déclenché par le même appel chaque minute que les rappels de rendez-vous (/api/cron/rdv-rappels). */

export const CAISSE_KEY = 'redm_rappel_caisse';
const ROLE = 'redm_preparateur_caisse';
const FENETRE_RETARD_MIN = 30; // si le planificateur a eu un trou, on envoie jusqu'à 30 min après l'heure réglée

export interface ConfigRappelCaisse {
  actif: boolean;
  heure: string;            // "HH:MM" (heure de Paris)
  jours: number[];          // 1 = lundi … 7 = dimanche
  seulementNonFaits: boolean; // ne taguer que ceux qui n'ont pas encore fait leur caisse aujourd'hui
  mode: 'role' | 'individuel'; // 'role' : tague le rôle Discord ; 'individuel' : tague chaque préparateur concerné
  roleId: string;           // identifiant du rôle Discord « Préparateur de caisse »
  message: string;          // {mentions} est remplacé par la liste des tags
  derniereDate?: string;    // "YYYY-MM-DD" du dernier envoi (anti-doublon)
  derniereHeure?: string;   // ISO du dernier envoi
}

/* Mise en gras « mathématique » Unicode (𝐀𝐚𝟎) pour garder l'écriture des autres rappels */
export function gras(s: string): string {
  return Array.from(s).map(c => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1d400 + c.charCodeAt(0) - 65);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(0x1d41a + c.charCodeAt(0) - 97);
    if (c >= '0' && c <= '9') return String.fromCodePoint(0x1d7ce + c.charCodeAt(0) - 48);
    return c;
  }).join('');
}

export const MESSAGE_DEFAUT = `**${gras('Rappel de caisse')}**\n\n{mentions}, ${gras("n'oubliez pas de faire votre caisse aujourd'hui.")}`;

export const CONFIG_DEFAUT: ConfigRappelCaisse = {
  actif: false, heure: '18:00', jours: [1, 2, 3, 4, 5, 6, 7], seulementNonFaits: true, mode: 'role', roleId: '1561880592801464461', message: MESSAGE_DEFAUT,
};

export async function lireConfigCaisse(supabase: SupabaseClient): Promise<ConfigRappelCaisse> {
  const { data } = await supabase.from('site_config').select('value').eq('key', CAISSE_KEY).single();
  const v = (data?.value ?? {}) as Partial<ConfigRappelCaisse>;
  return { ...CONFIG_DEFAUT, ...v, jours: Array.isArray(v.jours) ? v.jours : CONFIG_DEFAUT.jours };
}

/* Date, heure et jour de la semaine à Paris */
export function parisMaintenant(at: Date): { date: string; hhmm: string; minutes: number; jour: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(at);
  const g = (t: string) => parts.find(p => p.type === t)?.value ?? '';
  const jour = ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[g('weekday')] ?? 1;
  const hh = g('hour'), mm = g('minute');
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hhmm: `${hh}:${mm}`, minutes: Number(hh) * 60 + Number(mm), jour };
}

/* Préparateurs à taguer (rôle précis), éventuellement seulement ceux dont la caisse n'est pas faite aujourd'hui */
async function destinataires(supabase: SupabaseClient, date: string, seulementNonFaits: boolean): Promise<string[]> {
  const { data: membres } = await supabase.from('members').select('discord_id, roles').eq('status', 'approved');
  let ids = (membres ?? []).filter(m => (m.roles ?? []).includes(ROLE)).map(m => m.discord_id as string);
  if (seulementNonFaits && ids.length > 0) {
    const { data: faites } = await supabase.from('redm_caisses').select('discord_id').eq('date', date);
    const faits = new Set((faites ?? []).map(c => c.discord_id as string));
    ids = ids.filter(id => !faits.has(id));
  }
  return Array.from(new Set(ids));
}

/* Remet en lettres normales les caractères « gras mathématique » Unicode (𝐀𝐚𝟎) pour reconnaître {𝐦𝐞𝐧𝐭𝐢𝐨𝐧𝐬} */
function enNormal(s: string): string {
  return Array.from(s).map(c => {
    const cp = c.codePointAt(0) ?? 0;
    if (cp >= 0x1d400 && cp <= 0x1d419) return String.fromCharCode(65 + cp - 0x1d400);
    if (cp >= 0x1d41a && cp <= 0x1d433) return String.fromCharCode(97 + cp - 0x1d41a);
    if (cp >= 0x1d7ce && cp <= 0x1d7d7) return String.fromCharCode(48 + cp - 0x1d7ce);
    return c;
  }).join('');
}

const MOTS_MENTIONS = ['mentions', 'mention', 'role', 'rôle', 'roles', 'rôles', 'tag', 'tags'];

/* Remplace {mentions} (écrit en lettres normales OU en gras Unicode, majuscules acceptées) par les tags */
export function remplacerMentions(message: string, tags: string): { texte: string; trouve: boolean } {
  let trouve = false;
  const texte = message.replace(/\{([^{}\n]{1,24})\}/g, (m, inner: string) => {
    if (MOTS_MENTIONS.includes(enNormal(inner).trim().toLowerCase())) { trouve = true; return tags; }
    return m;
  });
  return { texte, trouve };
}

export function texteRappel(message: string, mentions: string[], roleId = ''): string {
  const tags = roleId ? `<@&${roleId}>` : mentions.map(i => `<@${i}>`).join(' ');
  const { texte, trouve } = remplacerMentions(message || MESSAGE_DEFAUT, tags);
  return trouve ? texte : `${tags}\n\n${texte}`;
}

/* Envoi immédiat (bouton « test » : aucun tag réel, rien n'est enregistré) */
export async function envoyerTestCaisse(config: ConfigRappelCaisse, pingUserId = '', pingRole = false): Promise<{ ok: boolean; error?: string }> {
  const webhook = process.env.DISCORD_CAISSE_WEBHOOK_URL;
  if (!webhook) return { ok: false, error: 'DISCORD_CAISSE_WEBHOOK_URL non configurée dans Vercel' };

  /* Test RÉEL du rôle : le rôle est vraiment prévenu (à utiliser avec un rôle de test pour ne déranger personne) */
  if (pingRole) {
    if (!/^\d{15,25}$/.test(config.roleId)) return { ok: false, error: 'Identifiant de rôle manquant ou invalide' };
    const corps = remplacerMentions(config.message || MESSAGE_DEFAUT, `<@&${config.roleId}>`).texte;
    const contenu = `🔔 *Test réel du rôle — tous ses membres sont prévenus*\n\n${corps}`.slice(0, 1900);
    try {
      const r = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: contenu, allowed_mentions: { roles: [config.roleId] } }) });
      return r.ok ? { ok: true } : { ok: false, error: `Discord a répondu ${r.status}` };
    } catch { return { ok: false, error: 'Discord injoignable ou URL invalide' }; }
  }

  /* Test AVEC notification : seule la personne qui clique est prévenue (sa propre mention) — le rôle n'est pas touché */
  if (/^\d{15,25}$/.test(pingUserId)) {
    const corps = remplacerMentions(config.message || MESSAGE_DEFAUT, `<@${pingUserId}>`).texte;
    const contenu = `🔔 *Test avec notification — seul <@${pingUserId}> est prévenu (le rôle n'est pas touché)*\n\n${corps}`.slice(0, 1900);
    try {
      const r = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: contenu, allowed_mentions: { users: [pingUserId] } }) });
      return r.ok ? { ok: true } : { ok: false, error: `Discord a répondu ${r.status}` };
    } catch { return { ok: false, error: 'Discord injoignable ou URL invalide' }; }
  }

  /* En mode rôle, la vraie mention du rôle est écrite (elle s'affiche comme un tag avec le nom du rôle si l'ID est bon),
     mais allowed_mentions est vide : Discord n'envoie AUCUNE notification à personne. */
  const roleId = config.mode === 'role' && /^\d{15,25}$/.test(config.roleId) ? config.roleId : '';
  const corps = remplacerMentions(config.message || MESSAGE_DEFAUT, roleId ? `<@&${roleId}>` : '@préparateurs').texte;
  const contenu = `🧪 *Test du rappel de caisse — personne n'est prévenu*\n\n${corps}`.slice(0, 1900);
  try {
    const r = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: contenu, allowed_mentions: { parse: [] } }) });
    return r.ok ? { ok: true } : { ok: false, error: `Discord a répondu ${r.status}` };
  } catch { return { ok: false, error: 'Discord injoignable ou URL invalide' }; }
}

/* Appelé chaque minute : envoie le rappel quand l'heure réglée est atteinte, une seule fois par jour. */
export async function traiterRappelCaisse(supabase: SupabaseClient, now = new Date()): Promise<Record<string, unknown>> {
  const config = await lireConfigCaisse(supabase);
  if (!config.actif) return { actif: false };

  const webhook = process.env.DISCORD_CAISSE_WEBHOOK_URL;
  if (!webhook) return { actif: true, erreur: 'DISCORD_CAISSE_WEBHOOK_URL non configurée' };

  const p = parisMaintenant(now);
  if (!config.jours.includes(p.jour)) return { actif: true, envoye: false, raison: 'jour_non_prevu' };
  if (config.derniereDate === p.date) return { actif: true, envoye: false, raison: 'deja_envoye_aujourdhui' };

  const [h, m] = config.heure.split(':').map(Number);
  const cible = (h || 0) * 60 + (m || 0);
  const ecart = p.minutes - cible;
  if (ecart < 0) return { actif: true, envoye: false, raison: `dans_${-ecart}_min` };
  if (ecart > FENETRE_RETARD_MIN) return { actif: true, envoye: false, raison: 'heure_depassee' };

  /* Anti-doublon : on marque la journée AVANT d'envoyer (relecture fraîche, écriture ciblée) */
  const fresh = await lireConfigCaisse(supabase);
  if (fresh.derniereDate === p.date) return { actif: true, envoye: false, raison: 'deja_envoye_aujourdhui' };
  const { error: errMark } = await supabase.from('site_config').upsert(
    { key: CAISSE_KEY, value: { ...fresh, derniereDate: p.date, derniereHeure: now.toISOString() } }, { onConflict: 'key' });
  if (errMark) return { actif: true, envoye: false, raison: 'marquage_impossible' };

  const ids = await destinataires(supabase, p.date, config.seulementNonFaits);
  if (ids.length === 0) return { actif: true, envoye: false, raison: 'tout_le_monde_a_fait_sa_caisse' };

  /* Mode « rôle » : on tague le rôle Discord (tous ses membres) ; mode « individuel » : seulement les préparateurs concernés */
  const roleId = config.mode === 'role' && /^\d{15,25}$/.test(config.roleId) ? config.roleId : '';

  try {
    const res = await fetch(webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: texteRappel(config.message, ids, roleId).slice(0, 1900), allowed_mentions: roleId ? { roles: [roleId] } : { users: ids } }),
    });
    if (!res.ok) {
      /* échec : on ré-arme pour un nouvel essai au prochain passage (dans la fenêtre de retard) */
      await supabase.from('site_config').upsert({ key: CAISSE_KEY, value: { ...fresh, derniereDate: undefined } }, { onConflict: 'key' });
      return { actif: true, envoye: false, raison: `discord_http_${res.status}` };
    }
    return { actif: true, envoye: true, tags: roleId ? 'role' : ids.length };
  } catch {
    await supabase.from('site_config').upsert({ key: CAISSE_KEY, value: { ...fresh, derniereDate: undefined } }, { onConflict: 'key' });
    return { actif: true, envoye: false, raison: 'discord_injoignable' };
  }
}
