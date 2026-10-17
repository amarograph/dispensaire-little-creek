import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';
import { rpNameOf } from '@/lib/rp-name';

export const dynamic = 'force-dynamic';

/* Registre des notes de la direction — stocké côté serveur (site_config), visible par la direction,
   modifiable par directeur / co-directeur / admin. Écritures atomiques : lecture fraîche + modification
   ciblée, jamais le remplacement de toute la liste par un navigateur. */

const KEY = 'redm_registre_notes';
const CATEGORIES = ['Général', 'Réunion', 'Décision', 'Personnel', 'Rappel / À faire', 'Incident', 'Autre'];

interface Note {
  id: string; titre: string; categorie: string; contenu: string; date: string;
  epinglee: boolean; auteur: string; auteurId: string; createdAt: string;
  modifieePar?: string; modifieeAt?: string;
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

async function lire(): Promise<Note[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  return Array.isArray(data?.value) ? data.value : [];
}

export async function GET() {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ notes: await lire() });
}

export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });

  try {
    const body = await req.json();
    const db = await createServiceClient();
    const current = await lire();
    const auteurRp = await rpNameOf(actor.id, actor.name);
    let next: Note[];

    if (body.action === 'upsert' && body.note && typeof body.note.titre === 'string' && body.note.titre.trim()) {
      const n = body.note;
      const champs = {
        titre: n.titre.trim().slice(0, 200),
        categorie: CATEGORIES.includes(n.categorie) ? n.categorie : 'Général',
        contenu: typeof n.contenu === 'string' ? n.contenu.slice(0, 60000) : '',
        date: typeof n.date === 'string' ? n.date.slice(0, 20) : '',
        epinglee: !!n.epinglee,
      };
      const idx = n.id ? current.findIndex(x => x.id === n.id) : -1;
      if (idx === -1) {
        const note: Note = { id: uid(), ...champs, auteur: auteurRp, auteurId: actor.id, createdAt: new Date().toISOString() };
        next = [note, ...current];
        redmLog(actor, { action: 'note_create', category: 'notes', description: `${actor.name} a ajouté la note « ${note.titre} » (${note.categorie}) au registre des notes`, meta: { id: note.id } });
      } else {
        next = current.map((x, i) => i !== idx ? x : { ...x, ...champs, modifieePar: auteurRp, modifieeAt: new Date().toISOString() });
        redmLog(actor, { action: 'note_update', category: 'notes', description: `${actor.name} a modifié la note « ${champs.titre} » du registre des notes`, meta: { id: n.id } });
      }
    } else if (body.action === 'pin' && body.id) {
      next = current.map(x => x.id === body.id ? { ...x, epinglee: !!body.epinglee } : x);
    } else if (body.action === 'delete' && body.id) {
      const removed = current.find(x => x.id === body.id);
      next = current.filter(x => x.id !== body.id);
      if (removed) redmLog(actor, { action: 'note_delete', category: 'notes', description: `${actor.name} a supprimé la note « ${removed.titre} » du registre des notes`, meta: { id: removed.id } });
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, notes: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
