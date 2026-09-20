/**
 * /api/admin/redm-tarifs
 *
 * PRÉREQUIS — exécuter une fois dans Supabase SQL Editor :
 * ─────────────────────────────────────────────────────────
 * -- Si la table existe déjà (ancien schéma avec "prestation" en clé primaire) :
 * ALTER TABLE public.redm_tarifs RENAME COLUMN prestation TO id;
 * ALTER TABLE public.redm_tarifs ADD COLUMN IF NOT EXISTS nom   TEXT;
 * UPDATE public.redm_tarifs SET nom = id WHERE nom IS NULL;
 * ALTER TABLE public.redm_tarifs ALTER COLUMN nom SET NOT NULL;
 * ALTER TABLE public.redm_tarifs ADD COLUMN IF NOT EXISTS type  TEXT NOT NULL DEFAULT 'vente';
 * ALTER TABLE public.redm_tarifs ADD COLUMN IF NOT EXISTS ordre INTEGER NOT NULL DEFAULT 0;
 * UPDATE public.redm_tarifs SET ordre = 1 WHERE id = 'Traitement';
 *
 * -- Si la table n'existe pas encore :
 * CREATE TABLE IF NOT EXISTS public.redm_tarifs (
 *   id               TEXT PRIMARY KEY,
 *   nom              TEXT NOT NULL,
 *   type             TEXT NOT NULL DEFAULT 'vente',
 *   prix             NUMERIC NOT NULL DEFAULT 0,
 *   pct_dispensaire  NUMERIC NOT NULL DEFAULT 50,
 *   pct_medecin      NUMERIC NOT NULL DEFAULT 50,
 *   ordre            INTEGER NOT NULL DEFAULT 0,
 *   updated_at       TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE public.redm_tarifs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service role full access" ON public.redm_tarifs USING (true) WITH CHECK (true);
 * ─────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireDirectionActor, requireDirectionRead } from '@/lib/redm-api-auth';
import { createClient }              from '@supabase/supabase-js';
import { redmLog }                   from '@/lib/redm-log';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type TypeCategorie = 'vente' | 'achat';

const DEFAULT_CATEGORIES = [
  { id: 'Consultation', nom: 'Consultation', type: 'vente' as TypeCategorie, prix: 1,   pct_dispensaire: 50, pct_medecin: 50, ordre: 0 },
  { id: 'Traitement',   nom: 'Traitement',   type: 'vente' as TypeCategorie, prix: 0.4, pct_dispensaire: 50, pct_medecin: 50, ordre: 1 },
];

const COMMANDE_SEULEMENT_KEY = 'redm_tarifs_commande_seulement';

async function getCommandeSeulementIds(): Promise<Set<string>> {
  const { data } = await admin().from('site_config').select('value').eq('key', COMMANDE_SEULEMENT_KEY).single();
  return new Set<string>(Array.isArray(data?.value) ? data.value : []);
}

async function setCommandeSeulement(id: string, actif: boolean) {
  const ids = await getCommandeSeulementIds();
  if (actif) ids.add(id); else ids.delete(id);
  await admin().from('site_config').upsert({ key: COMMANDE_SEULEMENT_KEY, value: Array.from(ids) }, { onConflict: 'key' });
}

function toCategory(row: any, commandeSeulementIds: Set<string>) {
  return {
    id:             row.id,
    nom:            row.nom,
    type:           (row.type === 'achat' ? 'achat' : 'vente') as TypeCategorie,
    prix:           row.prix,
    pctDispensaire: row.pct_dispensaire,
    pctMedecin:     row.pct_medecin,
    ordre:          row.ordre,
    commandeSeulement: commandeSeulementIds.has(row.id),
  };
}

function slugify(s: string) {
  const noAccents = Array.from(s.normalize('NFD'))
    .filter(ch => { const c = ch.codePointAt(0) ?? 0; return c < 0x0300 || c > 0x036f; })
    .join('');
  return noAccents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'categorie';
}

/* Lecture : direction, co-direction, médecin en chef (lecteur) */

/* ── GET : catégories de tarifs & répartition (direction + médecin en chef) ─ */
export async function GET(req: NextRequest) {
  if (!await requireDirectionRead()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let { data: rows } = await admin().from('redm_tarifs').select('*').order('ordre');
  if (!rows || rows.length === 0) {
    await admin().from('redm_tarifs').insert(DEFAULT_CATEGORIES);
    rows = DEFAULT_CATEGORIES;
  }
  const commandeSeulementIds = await getCommandeSeulementIds();

  return NextResponse.json({ categories: rows.map(r => toCategory(r, commandeSeulementIds)) });
}

/* ── POST : création d'une nouvelle catégorie ───────────────────────── */
export async function POST(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const nom  = (String(body.nom ?? '').trim()) || 'Nouvelle catégorie';
  const type: TypeCategorie = body.type === 'achat' ? 'achat' : 'vente';
  const prix = Number(body.prix) || 0;
  const pctDispensaire = Math.max(0, Math.min(100, Number(body.pctDispensaire ?? 50)));
  const pctMedecin     = 100 - pctDispensaire;

  const { data: existing } = await admin().from('redm_tarifs').select('id, ordre');
  const existingIds = new Set((existing ?? []).map(r => r.id));
  const base = slugify(nom);
  let id = base, n = 2;
  while (existingIds.has(id)) { id = `${base}-${n}`; n++; }
  const ordre = (existing ?? []).reduce((m, r) => Math.max(m, r.ordre ?? 0), -1) + 1;

  const { error } = await admin().from('redm_tarifs').insert({
    id, nom, type, prix, pct_dispensaire: pctDispensaire, pct_medecin: pctMedecin, ordre, updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  redmLog(actor, { action: 'tarif_create', category: 'tarifs', description: `A créé la catégorie « ${nom} » (${type}, $${prix})`, meta: { id, nom, type, prix } });
  return NextResponse.json({ category: { id, nom, type, prix, pctDispensaire, pctMedecin, ordre } });
}

/* ── PATCH : mise à jour d'une catégorie ────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, nom, type, prix, pctDispensaire, pctMedecin, commandeSeulement } = body;
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof nom === 'string' && nom.trim())        patch.nom            = nom.trim();
  if (type === 'vente' || type === 'achat')         patch.type           = type;
  if (typeof prix === 'number')                     patch.prix           = prix;
  if (typeof pctDispensaire === 'number')           patch.pct_dispensaire = Math.max(0, Math.min(100, pctDispensaire));
  if (typeof pctMedecin === 'number')               patch.pct_medecin     = Math.max(0, Math.min(100, pctMedecin));

  const { error } = await admin().from('redm_tarifs').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (typeof commandeSeulement === 'boolean') await setCommandeSeulement(id, commandeSeulement);

  redmLog(actor, { action: 'tarif_update', category: 'tarifs', description: `A modifié le tarif « ${nom ?? id} »${typeof prix === 'number' ? ` → $${prix}` : ''}`, meta: { id, ...patch, commandeSeulement } });
  return NextResponse.json({ ok: true });
}

/* ── DELETE : suppression d'une catégorie ───────────────────────────── */
export async function DELETE(req: NextRequest) {
  const actor = await requireDirectionActor();
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  const { error } = await admin().from('redm_tarifs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await setCommandeSeulement(id, false);

  redmLog(actor, { action: 'tarif_delete', category: 'tarifs', description: `A supprimé la catégorie de tarif « ${id} »`, meta: { id } });
  return NextResponse.json({ ok: true });
}
