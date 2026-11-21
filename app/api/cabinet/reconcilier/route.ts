import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireCabinetActor } from '@/lib/redm-api-auth';
import { cleNom, nomDansDocument } from '@/lib/cabinet-nom';

const EXAMENS_KEY = 'redm_cabinet_examens_psychiques';
const MAX_SCORE = 110;

interface Examen {
  id: string; nom: string; prenom: string; age: string; fonction: string; county: string;
  date: string; score: number; verdict: string; conclusion: string; recommandations: string;
}

/**
 * POST — rattache les documents orphelins à un dossier patient.
 *  1. Chaque examen psychique dont le nom/prénom ne correspond à aucun dossier → dossier créé.
 *  2. Chaque document dont le dossier n'existe plus, mais qui porte « Nom et prénom : … » → rattaché
 *     au dossier du même nom (créé s'il manque).
 * Idempotent : sans orphelin, ne modifie rien.
 */
export async function POST() {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();

  const [dossiersRes, docsRes, examsRes] = await Promise.all([
    supabase.from('cabinet_dossiers').select('id, patient_nom, patient_prenom'),
    supabase.from('cabinet_documents').select('id, patient_id, contenu'),
    supabase.from('site_config').select('value').eq('key', EXAMENS_KEY).maybeSingle(),
  ]);
  if (dossiersRes.error) return NextResponse.json({ error: dossiersRes.error.message }, { status: 500 });

  const dossiers = dossiersRes.data ?? [];
  const docs     = docsRes.data ?? [];
  const examens: Examen[] = Array.isArray(examsRes.data?.value) ? examsRes.data!.value : [];

  const parCle = new Map<string, string>();               // clé de nom → id du dossier
  const ids    = new Set<string>();
  for (const d of dossiers) {
    ids.add(String(d.id));
    const k = cleNom(d.patient_prenom, d.patient_nom);
    if (k && !parCle.has(k)) parCle.set(k, String(d.id));
  }

  let crees = 0;
  let rattaches = 0;

  /* 1 ── examens psychiques sans dossier */
  for (const ex of examens) {
    const k = cleNom(ex.prenom, ex.nom);
    if (!k || parCle.has(k)) continue;
    const { data, error } = await supabase.from('cabinet_dossiers').insert({
      owner_id:         ctx.discordId,
      patient_nom:      ex.nom ?? '',
      patient_prenom:   ex.prenom ?? '',
      patient_age:      ex.age ?? '',
      patient_metier:   ex.fonction ?? '',
      date_consult:     ex.date ?? '',
      type_seance:      'Première consultation',
      plainte:          `Examen psychique & moral — ${ex.fonction}${ex.county ? ' du comté de ' + ex.county : ''}`,
      equilibre_nerveux: ex.score < 41 ? 'III' : ex.score < 76 ? 'II' : 'I',
      note_therapeute:  `Score examen psychique : ${ex.score}/${MAX_SCORE} — Verdict : ${ex.verdict}\n\n${ex.conclusion ?? ''}`,
      traitement:       ex.recommandations ?? '',
      statut:           'EN COURS',
      confidentiel:     true,
    }).select('id').single();
    if (!error && data) { parCle.set(k, String(data.id)); ids.add(String(data.id)); crees++; }
  }

  /* 2 ── documents dont le dossier n'existe plus, mais qui portent un nom */
  for (const doc of docs) {
    if (doc.patient_id && ids.has(String(doc.patient_id))) continue;
    const n = nomDansDocument(doc.contenu);
    if (!n) continue;
    const k = cleNom(n.prenom, n.nom);
    if (!k) continue;
    let cible = parCle.get(k);
    if (!cible) {
      const { data, error } = await supabase.from('cabinet_dossiers').insert({
        owner_id:       ctx.discordId,
        patient_nom:    n.nom,
        patient_prenom: n.prenom,
        type_seance:    'Première consultation',
        statut:         'EN COURS',
        confidentiel:   false,
      }).select('id').single();
      if (error || !data) continue;
      cible = String(data.id);
      parCle.set(k, cible); ids.add(cible); crees++;
    }
    const { error } = await supabase.from('cabinet_documents').update({ patient_id: cible }).eq('id', doc.id);
    if (!error) rattaches++;
  }

  return NextResponse.json({ ok: true, crees, rattaches });
}
