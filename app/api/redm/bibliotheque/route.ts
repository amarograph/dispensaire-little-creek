import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, canEdit, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';

const KEY = 'redm_bibliotheque';

interface BiblioDoc { id: string; titre: string; contenu: string; date: string; }
interface BiblioCategorie { id: string; nom: string; icon: string; documents: BiblioDoc[]; }

async function session() { return getApiSession(); }
async function canReadLib(): Promise<boolean> {
  const s = await session(); if (!s) return false;
  return isAdmin(s.roles) || canRead(s.roles, 'redm_bibliotheque');
}
async function canEditLib(): Promise<boolean> {
  const s = await session(); if (!s) return false;
  return isAdmin(s.roles) || canEdit(s.roles, 'redm_bibliotheque');
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
  if (!await canEditLib()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
        break;
      }
      case 'renameCategory': {
        if (!body.id || typeof body.nom !== 'string') return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        const exists = current.some(c => c.id === body.id);
        next = exists
          ? current.map(c => c.id === body.id ? { ...c, nom: body.nom } : c)
          : [...current, { id: body.id, nom: body.nom, icon: body.icon ?? '📜', documents: [] }];
        break;
      }
      case 'deleteCategory': {
        if (!body.id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });
        next = current.filter(c => c.id !== body.id);
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
        break;
      }
      case 'deleteDoc': {
        if (!body.categoryId || !body.docId) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        next = current.map(c => c.id === body.categoryId ? { ...c, documents: c.documents.filter(d => d.id !== body.docId) } : c);
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
