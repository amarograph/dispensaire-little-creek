import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { requireDirectionActor } from '@/lib/redm-api-auth';
import { redmLog } from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

const KEY = 'redm_circuit_cueillette';

export interface Circuit { id: string; nom: string; icon: string; image: string; }

/* Cartes proposées au départ : la carte du Laurier Rose existe déjà, les autres sont des cases vides
   à remplir par la direction (image vide = « carte à venir »). */
const DEFAUT: Circuit[] = [
  { id: 'laurier-rose',      nom: 'Laurier Rose',      icon: '🌺', image: '/circuit-cueillette/laurier-rose-v2.webp' },
  { id: 'ginseng-americain', nom: 'Ginseng Américain', icon: '🌿', image: '' },
  { id: 'ginseng-alaska',    nom: "Ginseng d'Alaska",  icon: '🌿', image: '' },
  { id: 'thym-sauvage',      nom: 'Thym sauvage',      icon: '🌱', image: '' },
  { id: 'camomille-sauvage', nom: 'Camomille sauvage', icon: '🌼', image: '' },
  { id: 'bardane',           nom: 'Bardane',           icon: '🍃', image: '' },
];

async function lire(): Promise<Circuit[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  return Array.isArray(data?.value) ? data.value : DEFAUT;
}

/* GET — liste des cartes (tout membre connecté) */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  return NextResponse.json({ circuits: await lire() });
}

/* POST — direction : { action:'upsert', id?, nom, icon?, imageDataUrl? } | { action:'delete', id }
   Lecture fraîche + modification ciblée + écriture (jamais de remplacement en bloc par un navigateur). */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });

  try {
    const body = await req.json();
    const db = await createServiceClient();
    const current = await lire();
    let next: Circuit[];

    if (body.action === 'upsert' && typeof body.nom === 'string' && body.nom.trim()) {
      let image: string | undefined;
      if (typeof body.imageDataUrl === 'string' && body.imageDataUrl) {
        const m = body.imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!m) return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
        const buffer = Buffer.from(m[2], 'base64');
        if (buffer.byteLength > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image trop lourde (max 4 Mo)' }, { status: 413 });
        const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
        const filename = `cueillette_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await db.storage.from('portraits').upload(filename, buffer, { contentType: m[1], upsert: true });
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
        image = db.storage.from('portraits').getPublicUrl(filename).data.publicUrl;
      }
      const idx = body.id ? current.findIndex(c => c.id === body.id) : -1;
      if (idx === -1) {
        const id = `${body.nom.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plante'}-${Date.now().toString(36)}`;
        next = [...current, { id, nom: body.nom.trim(), icon: (body.icon || '🌿').toString().slice(0, 4), image: image ?? '' }];
        redmLog(actor, { action: 'cueillette_create', category: 'bibliotheque', description: `${actor.name} a ajouté la plante « ${body.nom.trim()} » au Circuit de Cueillette`, meta: { id } });
      } else {
        next = current.map((c, i) => i !== idx ? c : { ...c, nom: body.nom.trim(), icon: body.icon ? body.icon.toString().slice(0, 4) : c.icon, image: image ?? c.image });
        redmLog(actor, { action: 'cueillette_update', category: 'bibliotheque', description: `${actor.name} a modifié la carte « ${body.nom.trim()} » du Circuit de Cueillette${image ? ' (nouvelle image)' : ''}`, meta: { id: body.id } });
      }
    } else if (body.action === 'delete' && body.id) {
      const removed = current.find(c => c.id === body.id);
      next = current.filter(c => c.id !== body.id);
      if (removed) redmLog(actor, { action: 'cueillette_delete', category: 'bibliotheque', description: `${actor.name} a supprimé la carte « ${removed.nom} » du Circuit de Cueillette`, meta: { id: removed.id } });
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, circuits: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
