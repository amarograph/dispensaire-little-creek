import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, canEdit, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';

const KEY = 'redm_bibliotheque';

interface BiblioDoc { id: string; titre: string; contenu: string; date: string; }
interface BiblioCategorie { id: string; nom: string; icon: string; documents: BiblioDoc[]; }

async function session() { return getApiSession(); }
async function canReadLib(): Promise<boolean> {
  const s = await session(); if (!s) return false;
  return isAdmin(s.roles) || canRead(s.roles, 'redm_bibliotheque');
}
async function getEditor() {
  const s = await session(); if (!s) return null;
  if (!isAdmin(s.roles) && !canEdit(s.roles, 'redm_bibliotheque')) return null;
  return { id: s.discordId, name: s.username };
}

/* GET — arbre des catégories (uniquement les catégories créées + documents ajoutés ; les catégories
   par défaut et leur contenu intégré au code restent générées côté client) */
export async function GET() {
  if (!await canReadLib()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json(Array.isArray(data?.value) ? data.value : []);
}

/* POST — opérations atomiques sur les catégories/documents (jamais un remplacement en bloc) */
export async function POST(req: NextRequest) {
  const actor = await getEditor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const supabase = await createServiceClient();
    const { data: row } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const current: BiblioCategorie[] = Array.isArray(row?.value) ? row.value : [];

    let next: BiblioCategorie[];
    switch (body.action) {
      case 'createCategory': {
        if (!body.categorie?.id) return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
        next = current.some(c => c.id === body.categorie.id) ? current : [...current, body.categorie];
        redmLog(actor, { action: 'bibliotheque_categorie_create', category: 'bibliotheque', description: `${actor.name} a créé la catégorie « ${body.categorie.nom} » dans la Bibliothèque`, meta: { id: body.categorie.id } });
        break;
      }
      case 'renameCategory': {
        if (!body.id || typeof body.nom !== 'string') return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        const exists = current.some(c => c.id === body.id);
        next = exists
          ? current.map(c => c.id === body.id ? { ...c, nom: body.nom } : c)
          : [...current, { id: body.id, nom: body.nom, icon: body.icon ?? '📜', documents: [] }];
        redmLog(actor, { action: 'bibliotheque_categorie_rename', category: 'bibliotheque', description: `${actor.name} a renommé une catégorie de la Bibliothèque en « ${body.nom} »`, meta: { id: body.id } });
        break;
      }
      case 'deleteCategory': {
        if (!body.id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });
        const removed = current.find(c => c.id === body.id);
        next = current.filter(c => c.id !== body.id);
        if (removed) redmLog(actor, { action: 'bibliotheque_categorie_delete', category: 'bibliotheque', description: `${actor.name} a supprimé la catégorie « ${removed.nom} » de la Bibliothèque`, meta: { id: removed.id } });
        break;
      }
      case 'upsertDoc': {
        if (!body.categoryId || !body.doc?.id) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        const idx = current.findIndex(c => c.id === body.categoryId);
        const base: BiblioCategorie = idx === -1 ? { id: body.categoryId, nom: body.categoryId, icon: '📜', documents: [] } : current[idx];
        const docIdx = base.documents.findIndex(d => d.id === body.doc.id);
        const nextDocs = docIdx === -1 ? [...base.documents, body.doc] : base.documents.map(d => d.id === body.doc.id ? body.doc : d);
        const nextCat = { ...base, documents: nextDocs };
        next = idx === -1 ? [...current, nextCat] : current.map(c => c.id === body.categoryId ? nextCat : c);
        redmLog(actor, {
          action: docIdx === -1 ? 'bibliotheque_doc_create' : 'bibliotheque_doc_update',
          category: 'bibliotheque',
          description: docIdx === -1
            ? `${actor.name} a ajouté le document « ${body.doc.titre} » dans « ${base.nom} »`
            : `${actor.name} a modifié le document « ${body.doc.titre} » dans « ${base.nom} »`,
          meta: { categoryId: body.categoryId, docId: body.doc.id },
        });
        break;
      }
      case 'deleteDoc': {
        if (!body.categoryId || !body.docId) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        const cat = current.find(c => c.id === body.categoryId);
        const removedDoc = cat?.documents.find(d => d.id === body.docId);
        next = current.map(c => c.id === body.categoryId ? { ...c, documents: c.documents.filter(d => d.id !== body.docId) } : c);
        if (removedDoc) redmLog(actor, { action: 'bibliotheque_doc_delete', category: 'bibliotheque', description: `${actor.name} a supprimé le document « ${removedDoc.titre} » de « ${cat?.nom ?? body.categoryId} »`, meta: { categoryId: body.categoryId, docId: body.docId } });
        break;
      }
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, categories: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
