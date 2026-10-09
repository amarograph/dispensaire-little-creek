import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';
import { requireDirectionActor } from '@/lib/redm-api-auth';

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
    } else if (body.action === 'set_statut' && body.id && Array.isArray(body.factureIds) && ['PAYÉ', 'EN ATTENTE'].includes(body.statut)) {
      /* Marquer des factures d'une semaine archivée comme payées / en attente — réservé à la direction */
      if (!await requireDirectionActor()) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });
      const ids = new Set<string>(body.factureIds);
      let changed: Facture[] = [];
      let weekLabel = '';
      next = current.map(a => {
        if (a.id !== body.id) return a;
        weekLabel = a.weekLabel;
        const factures = a.factures.map(f => {
          if (!ids.has(f.id) || f.statut === 'ANNULÉ' || f.statut === body.statut) return f;
          const upd = { ...f, statut: body.statut as string };
          changed.push(upd);
          return upd;
        });
        return {
          ...a, factures,
          totalPercu:   factures.filter(f => f.statut === 'PAYÉ').reduce((sum, f) => sum + f.montant, 0),
          totalAttente: factures.filter(f => f.statut === 'EN ATTENTE').reduce((sum, f) => sum + f.montant, 0),
        };
      });
      if (changed.length > 0) {
        const total = changed.reduce((sum, f) => sum + f.montant, 0);
        redmLog(actor, {
          action: 'facture_archive_statut', category: 'comptabilite',
          description: `${actor.name} a marqué ${changed.length} facture${changed.length > 1 ? 's' : ''} (${total}$) comme ${body.statut === 'PAYÉ' ? 'payée' + (changed.length > 1 ? 's' : '') : 'en attente'} — « ${weekLabel} »`,
          meta: { archiveId: body.id, factureIds: changed.map(f => f.id), statut: body.statut, total },
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
