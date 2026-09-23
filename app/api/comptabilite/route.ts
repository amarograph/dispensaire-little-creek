import { NextRequest, NextResponse } from 'next/server';
import { getApiSession } from '@/lib/api-auth';
import { canRead, isAdmin } from '@/lib/permissions';
import { createServiceClient } from '@/lib/supabase/server';

const KEY          = 'redm_comptabilite_factures';
const ARCHIVES_KEY = 'redm_comptabilite_archives';

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

async function canAccess(): Promise<boolean> {
  const session = await getApiSession();
  if (!session) return false;
  return isAdmin(session.roles) || canRead(session.roles, 'redm_comptabilite');
}

function getMondayOf(date: Date): Date {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0, 0, 0, 0); return d;
}
function parseDate(s: string): Date | null {
  const p = s.split('/'); if (p.length !== 3) return null;
  const [d, m, y] = p.map(Number); if (!d || !m || !y) return null;
  const realY = y < 1900 ? y + 136 : y;
  return new Date(realY, m - 1, d);
}
function mondayISO(m: Date) { return m.toISOString(); }
function weekLabel(mon: Date): string {
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const f = (dt: Date, full = false) => {
    const s = dt.toLocaleDateString('fr-FR', full ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { day: '2-digit', month: '2-digit' });
    return full ? s.replace(String(dt.getFullYear()), String(dt.getFullYear() - 136)) : s;
  };
  return `Semaine du ${f(mon)} au ${f(sun, true)}`;
}
function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

/* Déplace les factures des semaines passées vers les archives — pur, idempotent, dédupliqué par weekStart. */
function archivePastWeeks(items: Facture[], archives: SemaineArchivee[]): { items: Facture[]; archives: SemaineArchivee[]; changed: boolean } {
  const currentKey = mondayISO(getMondayOf(new Date()));
  const byWeek: Record<string, { monday: Date; factures: Facture[] }> = {};
  items.forEach(f => {
    const d = parseDate(f.dateSeance); if (!d) return;
    const mon = getMondayOf(d); const key = mondayISO(mon);
    if (key === currentKey) return;
    (byWeek[key] ??= { monday: mon, factures: [] }).factures.push(f);
  });
  const pastKeys = Object.keys(byWeek);
  if (pastKeys.length === 0) return { items, archives, changed: false };

  const toRemoveIds = new Set<string>();
  const nextArchives = [...archives];
  const brandNew: SemaineArchivee[] = [];

  pastKeys.forEach(key => {
    const g = byWeek[key];
    g.factures.forEach(f => toRemoveIds.add(f.id));
    const idx = nextArchives.findIndex(a => a.weekStart === key);
    if (idx === -1) {
      brandNew.push({
        id: uid(), weekLabel: weekLabel(g.monday), weekStart: key, factures: g.factures,
        archivedAt: new Date().toISOString(),
        totalPercu:   g.factures.filter(f => f.statut === 'PAYÉ').reduce((s, f) => s + f.montant, 0),
        totalAttente: g.factures.filter(f => f.statut === 'EN ATTENTE').reduce((s, f) => s + f.montant, 0),
      });
    } else {
      const existingIds = new Set(nextArchives[idx].factures.map(f => f.id));
      const merged = [...nextArchives[idx].factures, ...g.factures.filter(f => !existingIds.has(f.id))];
      nextArchives[idx] = {
        ...nextArchives[idx], factures: merged,
        totalPercu:   merged.filter(f => f.statut === 'PAYÉ').reduce((s, f) => s + f.montant, 0),
        totalAttente: merged.filter(f => f.statut === 'EN ATTENTE').reduce((s, f) => s + f.montant, 0),
      };
    }
  });

  return { items: items.filter(f => !toRemoveIds.has(f.id)), archives: [...brandNew, ...nextArchives], changed: true };
}

/* GET — factures de la semaine en cours (archive automatiquement les semaines passées, côté serveur, une seule fois) */
export async function GET() {
  if (!await canAccess()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const [{ data: itemsRow }, { data: arcRow }] = await Promise.all([
    supabase.from('site_config').select('value').eq('key', KEY).single(),
    supabase.from('site_config').select('value').eq('key', ARCHIVES_KEY).single(),
  ]);
  const rawItems: Facture[] = Array.isArray(itemsRow?.value) ? itemsRow.value : [];
  const rawArchives: SemaineArchivee[] = Array.isArray(arcRow?.value) ? arcRow.value : [];

  const { items, archives, changed } = archivePastWeeks(rawItems, rawArchives);
  if (changed) {
    await Promise.all([
      supabase.from('site_config').upsert({ key: KEY, value: items }, { onConflict: 'key' }),
      supabase.from('site_config').upsert({ key: ARCHIVES_KEY, value: archives }, { onConflict: 'key' }),
    ]);
  }

  return NextResponse.json(items);
}

/* POST — opérations atomiques (lecture fraîche + modification ciblée + écriture), jamais un remplacement en bloc du tableau local d'un client */
export async function POST(req: NextRequest) {
  if (!await canAccess()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const supabase = await createServiceClient();
    const { data: row } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const current: Facture[] = Array.isArray(row?.value) ? row.value : [];

    let next: Facture[];
    if (body.action === 'upsert' && body.facture?.id) {
      const f: Facture = body.facture;
      const idx = current.findIndex(x => x.id === f.id);
      next = idx === -1 ? [f, ...current] : current.map(x => x.id === f.id ? f : x);
    } else if (body.action === 'delete' && body.id) {
      next = current.filter(x => x.id !== body.id);
    } else if (body.action === 'merge' && Array.isArray(body.factures)) {
      const existingIds = new Set(current.map(x => x.id));
      next = [...current, ...body.factures.filter((f: Facture) => f?.id && !existingIds.has(f.id))];
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, items: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
