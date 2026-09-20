import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRedmStaff } from '@/lib/redm-api-auth';

const KEY        = 'redm_agenda_commun';
const CABINET_KEY = 'redm_cabinet_agenda';

interface RendezVous {
  id: string; patientNom: string; date: string; heure: string;
  type: string; statut: string; notes: string; createdAt: string;
  medecin?: string; source?: 'cabinet';
}

export async function GET() {
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json([], { status: 200 });

  try {
    const supabase = await createServiceClient();
    const [{ data: agenda }, { data: cabinet }] = await Promise.all([
      supabase.from('site_config').select('value').eq('key', KEY).single(),
      supabase.from('site_config').select('value').eq('key', CABINET_KEY).single(),
    ]);

    const natifs: RendezVous[] = Array.isArray(agenda?.value) ? agenda.value : [];
    const cabinetRdvs: RendezVous[] = Array.isArray(cabinet?.value) ? cabinet.value : [];

    const anonymises: RendezVous[] = cabinetRdvs.map(r => ({
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

    return NextResponse.json([...natifs, ...anonymises]);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireRedmStaff();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    const natifs = Array.isArray(data) ? data.filter((r: RendezVous) => r.source !== 'cabinet') : [];
    const supabase = await createServiceClient();
    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: natifs }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
