import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRedmStaff } from '@/lib/redm-api-auth';

const KEY             = 'redm_agenda_commun';
const CABINET_KEY     = 'redm_cabinet_agenda';
const OBSTETRIQUE_KEY = 'redm_obstetrique_agenda';

interface RendezVous {
  id: string; patientNom: string; date: string; heure: string;
  type: string; statut: string; notes: string; createdAt: string;
  medecin?: string; medecinDiscordId?: string; rappelEnvoye?: boolean; source?: 'cabinet' | 'obstetrique';
}

export async function GET() {
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json([], { status: 200 });

  try {
    const supabase = await createServiceClient();
    const [{ data: agenda }, { data: cabinet }, { data: obstetrique }] = await Promise.all([
      supabase.from('site_config').select('value').eq('key', KEY).single(),
      supabase.from('site_config').select('value').eq('key', CABINET_KEY).single(),
      supabase.from('site_config').select('value').eq('key', OBSTETRIQUE_KEY).single(),
    ]);

    const natifs: RendezVous[] = Array.isArray(agenda?.value) ? agenda.value : [];
    const cabinetRdvs: RendezVous[] = Array.isArray(cabinet?.value) ? cabinet.value : [];
    const obstetriqueRdvs: RendezVous[] = Array.isArray(obstetrique?.value) ? obstetrique.value : [];

    const anonymisesCabinet: RendezVous[] = cabinetRdvs.map(r => ({
      id: `cab-${r.id}`,
      patientNom: 'Patient (Cabinet)',
      date: r.date,
      heure: r.heure,
      type: 'Séance Cabinet Thérapeutique',
      statut: r.statut,
      notes: '',
      createdAt: r.createdAt,
      source: 'cabinet',
    }));

    // Confidentialité totale : ni le nom de la patiente ni le motif ne sont repris,
    // seuls le médecin assigné et l'heure apparaissent dans l'agenda commun.
    const anonymisesObstetrique: RendezVous[] = obstetriqueRdvs.map(r => ({
      id: `obs-${r.id}`,
      patientNom: 'Patiente (Obstétrique)',
      date: r.date,
      heure: r.heure,
      type: 'RDV Obstétrique',
      statut: r.statut,
      notes: '',
      createdAt: r.createdAt,
      medecin: r.medecin || '',
      source: 'obstetrique',
    }));

    return NextResponse.json([...natifs, ...anonymisesCabinet, ...anonymisesObstetrique]);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    let natifs: RendezVous[] = Array.isArray(data) ? data.filter((r: RendezVous) => r.source !== 'cabinet' && r.source !== 'obstetrique') : [];
    const supabase = await createServiceClient();

    /* Le rappel Discord est marqué côté serveur : un navigateur qui enregistre avec une liste plus ancienne
       ne doit pas effacer ce marquage (sinon le rappel serait renvoyé). Si la date, l'heure ou le soignant
       change, le rappel est réarmé. */
    const { data: row } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const before: RendezVous[] = Array.isArray(row?.value) ? row.value : [];
    natifs = natifs.map(r => {
      const old = before.find(x => x.id === r.id);
      const inchange = old && old.date === r.date && old.heure === r.heure && (old.medecinDiscordId ?? '') === (r.medecinDiscordId ?? '');
      if (inchange && old.rappelEnvoye) return { ...r, rappelEnvoye: true };
      const { rappelEnvoye, ...reste } = r;
      return reste;
    });

    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: natifs }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
