import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor } from '@/lib/redm-api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';

export const dynamic = 'force-dynamic';

/* Registre des comptes & codes (numéros de compte des entreprises, codes des coffres entreprise et dispensaire).
   Données sensibles : lecture ET écriture réservées au directeur, au co-directeur et aux admins
   (pas même le médecin chef). Les valeurs ne sont jamais écrites dans le Journal d'activité.
   Écritures atomiques : lecture fraîche + modification ciblée. */

const KEY = 'redm_registre_codes';
const TYPES = ['Numéro de compte entreprise', 'Code coffre entreprise', 'Code coffre dispensaire', 'Autre'];

interface Entree {
  id: string; type: string; nom: string; valeur: string; precision: string;
  auteur: string; createdAt: string; modifieePar?: string; modifieeAt?: string;
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

async function lire(): Promise<Entree[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  return Array.isArray(data?.value) ? data.value : [];
}

export async function GET() {
  if (!await requireDirectionActor()) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });
  return NextResponse.json({ entrees: await lire() });
}

export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });

  try {
    const body = await req.json();
    const db = await createServiceClient();
    const current = await lire();
    let next: Entree[];

    if (body.action === 'upsert' && body.entree && typeof body.entree.nom === 'string' && body.entree.nom.trim()) {
      const e = body.entree;
      const champs = {
        type: TYPES.includes(e.type) ? e.type : 'Autre',
        nom: e.nom.trim().slice(0, 150),
        valeur: typeof e.valeur === 'string' ? e.valeur.trim().slice(0, 300) : '',
        precision: typeof e.precision === 'string' ? e.precision.trim().slice(0, 500) : '',
      };
      const idx = e.id ? current.findIndex(x => x.id === e.id) : -1;
      if (idx === -1) {
        const entree: Entree = { id: uid(), ...champs, auteur: actor.name, createdAt: new Date().toISOString() };
        next = [...current, entree];
        redmLog(actor, { action: 'code_create', category: 'notes', description: `${actor.name} a ajouté « ${champs.nom} » (${champs.type}) au registre des comptes & codes`, meta: { id: entree.id } });
      } else {
        next = current.map((x, i) => i !== idx ? x : { ...x, ...champs, modifieePar: actor.name, modifieeAt: new Date().toISOString() });
        redmLog(actor, { action: 'code_update', category: 'notes', description: `${actor.name} a modifié « ${champs.nom} » (${champs.type}) dans le registre des comptes & codes`, meta: { id: e.id } });
      }
    } else if (body.action === 'delete' && body.id) {
      const removed = current.find(x => x.id === body.id);
      next = current.filter(x => x.id !== body.id);
      if (removed) redmLog(actor, { action: 'code_delete', category: 'notes', description: `${actor.name} a supprimé « ${removed.nom} » (${removed.type}) du registre des comptes & codes`, meta: { id: removed.id } });
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, entrees: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
