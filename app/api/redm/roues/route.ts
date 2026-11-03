import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { requireDirectionActor, requireRedmStaff } from '@/lib/redm-api-auth';
import { redmLog } from '@/lib/redm-log';
import { rpNameOf } from '@/lib/rp-name';

export const dynamic = 'force-dynamic';

/* La roue des gains (section Évènements) : autant de roues que l'on veut, chacune avec ses cases.
   • Le tirage est fait côté serveur (aléatoire cryptographique, chaque case active a la même chance) :
     l'animation de la roue ne fait que montrer le résultat, personne ne peut le truquer depuis son navigateur.
   • Après chaque tirage, on demande s'il faut retirer la case : le tirage reste « en attente » tant qu'on n'a pas répondu.
   • Création / cases / suppression : direction. Faire tourner la roue : personnel du dispensaire.
   Stockage serveur (site_config), écritures atomiques : lecture fraîche + modification ciblée. */

const KEY = 'redm_roues';
const MAX_CASES = 200;
const MAX_HISTORIQUE = 300;

interface Segment { id: string; label: string; actif: boolean; }
interface Tirage {
  id: string; segmentId: string; label: string; participant: string; at: string; auteur: string;
  retire: boolean | null; // null = en attente de réponse « retirer la case ? »
}
interface Roue {
  id: string; nom: string; icon: string; description: string; visible: boolean;
  segments: Segment[]; historique: Tirage[]; createdAt: string; auteur: string;
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

async function lire(): Promise<Roue[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  const liste: Roue[] = Array.isArray(data?.value) ? data.value : [];
  return liste.map(r => ({ ...r, visible: r.visible !== false, segments: r.segments ?? [], historique: r.historique ?? [] }));
}

/* GET — tout membre approuvé ; les roues masquées ne sont renvoyées qu'à la direction */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const direction = await requireDirectionActor();
  const liste = await lire();
  return NextResponse.json({ roues: direction ? liste : liste.filter(r => r.visible) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  const ACTIONS_STAFF = ['spin', 'resolve_tirage'];
  const staffAction = ACTIONS_STAFF.includes(body.action);

  const direction = await requireDirectionActor();
  let actor: { id: string; name: string } | null = direction;
  if (!actor && staffAction) {
    const staff = await requireRedmStaff();
    if (staff) { const s = await getApiSession(); if (s) actor = { id: s.discordId, name: s.username }; }
  }
  if (!actor) return NextResponse.json({ error: staffAction ? 'Réservé au personnel du dispensaire' : 'Réservé à la direction' }, { status: 403 });

  try {
    const db = await createServiceClient();
    const current = await lire();
    const auteur = await rpNameOf(actor.id, actor.name);
    const roue = (id: unknown) => current.find(r => r.id === id && (direction || r.visible));
    const maj = (id: unknown, f: (r: Roue) => Roue) => current.map(r => r.id === id ? f(r) : r);
    let next: Roue[] = current;
    let extra: Record<string, unknown> = {};

    if (body.action !== 'create_roue' && !roue(body.id)) return NextResponse.json({ error: 'Roue introuvable' }, { status: 404 });

    switch (body.action) {
      case 'create_roue': {
        const nom = String(body.nom ?? '').trim().slice(0, 80);
        if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
        const r: Roue = {
          id: `${nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'roue'}-${Date.now().toString(36)}`,
          nom, icon: String(body.icon || '🎡').slice(0, 4), description: String(body.description ?? '').slice(0, 500),
          visible: true, segments: [], historique: [], createdAt: new Date().toISOString(), auteur,
        };
        next = [...current, r];
        extra = { id: r.id };
        redmLog(actor, { action: 'roue_create', category: 'evenements', description: `${actor.name} a créé la roue « ${nom} »`, meta: { id: r.id } });
        break;
      }
      case 'update_roue': {
        const nom = String(body.nom ?? '').trim().slice(0, 80);
        if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
        next = maj(body.id, r => ({ ...r, nom, icon: String(body.icon || r.icon).slice(0, 4), description: String(body.description ?? r.description).slice(0, 500) }));
        break;
      }
      case 'delete_roue': {
        const r = roue(body.id)!;
        next = current.filter(x => x.id !== body.id);
        redmLog(actor, { action: 'roue_delete', category: 'evenements', description: `${actor.name} a supprimé la roue « ${r.nom} »`, meta: { id: r.id } });
        break;
      }
      case 'set_visible': {
        const visible = body.visible !== false;
        const r = roue(body.id)!;
        next = maj(body.id, x => ({ ...x, visible }));
        redmLog(actor, { action: 'roue_visibilite', category: 'evenements', description: `${actor.name} a ${visible ? 'affiché à tous' : 'masqué (direction seulement)'} la roue « ${r.nom} »`, meta: { id: r.id, visible } });
        break;
      }
      case 'add_segments': {
        const labels = (Array.isArray(body.labels) ? body.labels : []).map((l: unknown) => String(l ?? '').trim().slice(0, 80)).filter(Boolean);
        if (labels.length === 0) return NextResponse.json({ error: 'Aucune case à ajouter' }, { status: 400 });
        const r = roue(body.id)!;
        if (r.segments.length + labels.length > MAX_CASES) return NextResponse.json({ error: `Maximum ${MAX_CASES} cases par roue` }, { status: 400 });
        next = maj(body.id, x => ({ ...x, segments: [...x.segments, ...labels.map((label: string) => ({ id: uid(), label, actif: true }))] }));
        break;
      }
      /* Nombre d'exemplaires d'une case : on décuple (ou on réduit) les cases en jeu portant cet intitulé */
      case 'set_count': {
        const label = String(body.label ?? '').trim();
        const count = Math.floor(Number(body.count));
        if (!label || !Number.isFinite(count) || count < 0 || count > 100) return NextResponse.json({ error: 'Nombre invalide (0 à 100)' }, { status: 400 });
        const r = roue(body.id)!;
        const memes = r.segments.filter(s => s.actif && s.label === label);
        if (r.segments.length + Math.max(0, count - memes.length) > MAX_CASES) return NextResponse.json({ error: `Maximum ${MAX_CASES} cases par roue` }, { status: 400 });
        const aSupprimer = new Set(memes.slice(count).map(s => s.id));
        const aAjouter = Math.max(0, count - memes.length);
        next = maj(body.id, x => ({ ...x, segments: [...x.segments.filter(s => !aSupprimer.has(s.id)), ...Array.from({ length: aAjouter }, () => ({ id: uid(), label, actif: true }))] }));
        break;
      }
      case 'rename_label': {
        const de = String(body.de ?? '').trim(), label = String(body.label ?? '').trim().slice(0, 80);
        if (!de || !label) return NextResponse.json({ error: 'Intitulé requis' }, { status: 400 });
        next = maj(body.id, x => ({ ...x, segments: x.segments.map(s => s.label === de ? { ...s, label } : s) }));
        break;
      }
      case 'update_segment': {
        const label = String(body.label ?? '').trim().slice(0, 80);
        if (!label) return NextResponse.json({ error: 'Intitulé requis' }, { status: 400 });
        next = maj(body.id, x => ({ ...x, segments: x.segments.map(s => s.id === body.segmentId ? { ...s, label } : s) }));
        break;
      }
      case 'delete_segment': {
        next = maj(body.id, x => ({ ...x, segments: x.segments.filter(s => s.id !== body.segmentId) }));
        break;
      }
      case 'set_segment_actif': {
        const actif = body.actif !== false;
        next = maj(body.id, x => ({ ...x, segments: x.segments.map(s => s.id === body.segmentId ? { ...s, actif } : s) }));
        break;
      }
      case 'reset_segments': {
        const r = roue(body.id)!;
        next = maj(body.id, x => ({ ...x, segments: x.segments.map(s => ({ ...s, actif: true })) }));
        redmLog(actor, { action: 'roue_reset', category: 'evenements', description: `${actor.name} a remis toutes les cases sur la roue « ${r.nom} »`, meta: { id: r.id } });
        break;
      }
      case 'clear_historique': {
        next = maj(body.id, x => ({ ...x, historique: x.historique.filter(t => t.retire === null) }));
        break;
      }
      case 'spin': {
        const r = roue(body.id)!;
        if (r.historique.some(t => t.retire === null)) return NextResponse.json({ error: 'Un tirage attend encore une réponse : retirer la case ou non ?' }, { status: 409 });
        const actives = r.segments.filter(s => s.actif);
        if (actives.length === 0) return NextResponse.json({ error: 'Aucune case sur la roue' }, { status: 400 });
        const gagnante = actives[randomInt(actives.length)];
        const t: Tirage = {
          id: uid(), segmentId: gagnante.id, label: gagnante.label, participant: String(body.participant ?? '').trim().slice(0, 80),
          at: new Date().toISOString(), auteur, retire: null,
        };
        next = maj(body.id, x => ({ ...x, historique: [t, ...x.historique].slice(0, MAX_HISTORIQUE) }));
        extra = { tirageId: t.id };
        redmLog(actor, { action: 'roue_tirage', category: 'evenements', description: `${actor.name} a fait tourner la roue « ${r.nom} »${t.participant ? ` pour ${t.participant}` : ''} : « ${t.label} »`, meta: { id: r.id, tirage: t.id } });
        break;
      }
      case 'resolve_tirage': {
        const r = roue(body.id)!;
        const t = r.historique.find(x => x.id === body.tirageId);
        if (!t) return NextResponse.json({ error: 'Tirage introuvable' }, { status: 404 });
        if (t.retire !== null) return NextResponse.json({ ok: true, roues: direction ? current : current.filter(x => x.visible) });
        const retirer = body.retirer === true;
        next = maj(body.id, x => ({
          ...x,
          historique: x.historique.map(h => h.id === t.id ? { ...h, retire: retirer } : h),
          segments: retirer ? x.segments.map(s => s.id === t.segmentId ? { ...s, actif: false } : s) : x.segments,
        }));
        redmLog(actor, { action: 'roue_resolution', category: 'evenements', description: `${actor.name} ${retirer ? 'a retiré' : 'a gardé'} la case « ${t.label} » sur la roue « ${r.nom} »`, meta: { id: r.id, tirage: t.id, retirer } });
        break;
      }
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ...extra, roues: direction ? next : next.filter(r => r.visible) });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
