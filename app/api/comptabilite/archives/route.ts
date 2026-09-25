import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';

const KEY = 'redm_comptabilite_archives';

interface PrestationItem { id: string; qty: number; nom?: string; prix?: number; }
interface Facture {
  id: string; medecin: string; patientNom: string; dateSeance: string;
  prestations: (string | PrestationItem)[]; montant: number;
  payeur: string; statut: string; notes: string; createdAt: string;
  estCommande?: boolean;
}
interface SemaineArchivee {
  id: string; weekLabel: string; weekStart: string;
  factures: Facture[]; archivedAt: string;
  totalPercu: number; totalAttente: number;
}

async function getActor() {
  const session = await getApiSession();
  if (!session) return null;
  if (!isAdmin(session.roles) && !canRead(session.roles, 'redm_comptabilite')) return null;
  return { id: session.discordId, name: session.username };
}

/* GET — semaines archivées du registre partagé */
export async function GET() {
  if (!await getActor()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json(Array.isArray(data?.value) ? data.value : []);
}

/* POST — opérations atomiques (lecture fraîche + modification ciblée + écriture) */
export async function POST(req: NextRequest) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const supabase = await createServiceClient();
    const { data: row } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const current: SemaineArchivee[] = Array.isArray(row?.value) ? row.value : [];

    let next: SemaineArchivee[];
    if (body.action === 'delete' && body.id) {
      const removed = current.find(x => x.id === body.id);
      next = current.filter(x => x.id !== body.id);
      if (removed) {
        redmLog(actor, {
          action: 'facture_archive_delete', category: 'comptabilite',
          description: `${actor.name} a supprimé l'archive « ${removed.weekLabel} »`,
          meta: { id: removed.id, weekStart: removed.weekStart },
        });
      }
    } else if (body.action === 'merge' && Array.isArray(body.archives)) {
      const existingIds = new Set(current.map(x => x.id));
      const added = body.archives.filter((a: SemaineArchivee) => a?.id && !existingIds.has(a.id));
      next = [...current, ...added];
      if (added.length > 0) {
        redmLog(actor, {
          action: 'facture_archive_merge', category: 'comptabilite',
          description: `${actor.name} a ajouté ${added.length} ancienne${added.length > 1 ? 's' : ''} archive${added.length > 1 ? 's' : ''} locale${added.length > 1 ? 's' : ''} au registre partagé`,
          meta: { count: added.length },
        });
      }
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, archives: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
