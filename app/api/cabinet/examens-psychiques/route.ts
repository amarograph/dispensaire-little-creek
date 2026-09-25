import { NextRequest, NextResponse } from 'next/server';
import { requireCabinetActor } from '@/lib/redm-api-auth';
import { getApiSession } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { redmLog } from '@/lib/redm-log';

const KEY = 'redm_cabinet_examens_psychiques';

interface Reponses { [key: string]: number }
interface Examen {
  id: string; createdAt: string;
  nom: string; prenom: string; age: string; fonction: string; county: string; lieu: string;
  date: string; docteur: string;
  reponses: Reponses;
  score: number; verdict: string;
  etatEmotionnel: string; stabiliteNerveuse: string;
  elementsRetenus: string; conclusion: string; recommandations: string;
}

/* GET — liste des examens psychiques (Cabinet Thérapeutique) */
export async function GET() {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createServiceClient();
  const { data } = await supabase.from('site_config').select('value').eq('key', KEY).single();
  return NextResponse.json(Array.isArray(data?.value) ? data.value : []);
}

/* POST — opérations atomiques (upsert/delete) : relit l'état serveur avant d'appliquer un seul changement */
export async function POST(req: NextRequest) {
  const ctx = await requireCabinetActor();
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const session = await getApiSession();
  const actor = { id: ctx.discordId, name: session?.username ?? ctx.discordId };

  try {
    const body = await req.json();
    const supabase = await createServiceClient();
    const { data: row } = await supabase.from('site_config').select('value').eq('key', KEY).single();
    const current: Examen[] = Array.isArray(row?.value) ? row.value : [];

    let next: Examen[];
    if (body.action === 'upsert' && body.examen?.id) {
      const e: Examen = body.examen;
      const idx = current.findIndex(x => x.id === e.id);
      next = idx === -1 ? [e, ...current] : current.map(x => x.id === e.id ? e : x);
      redmLog(actor, {
        action: idx === -1 ? 'examen_psychique_create' : 'examen_psychique_update',
        category: 'cabinet',
        description: idx === -1
          ? `${actor.name} a créé un examen psychique pour ${e.prenom} ${e.nom} (verdict : ${e.verdict})`
          : `${actor.name} a modifié l'examen psychique de ${e.prenom} ${e.nom}`,
        meta: { id: e.id, verdict: e.verdict, score: e.score },
      });
    } else if (body.action === 'delete' && body.id) {
      const removed = current.find(x => x.id === body.id);
      next = current.filter(x => x.id !== body.id);
      if (removed) {
        redmLog(actor, {
          action: 'examen_psychique_delete', category: 'cabinet',
          description: `${actor.name} a supprimé l'examen psychique de ${removed.prenom} ${removed.nom}`,
          meta: { id: removed.id },
        });
      }
    } else {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await supabase.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, examens: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
