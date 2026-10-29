import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getApiSession } from '@/lib/api-auth';
import { requireDirectionActor, requireRedmStaff } from '@/lib/redm-api-auth';
import { redmLog } from '@/lib/redm-log';
import { rpNameOf } from '@/lib/rp-name';

export const dynamic = 'force-dynamic';

/* Évènements : un dossier par évènement (Halloween…), avec des affiches et un registre des participants
   (fiches nom/prénom + résultat de chaque énigme : bonne / fausse / pas répondue).
   Stockage serveur (site_config). Écritures atomiques : lecture fraîche + modification ciblée.
   • Structure (dossiers, affiches, nom des énigmes) : directeur, co-directeur, admin.
   • Registre (fiches participants et résultats) : tout le personnel du dispensaire. */

const KEY = 'redm_evenements';
const NB_ENIGMES_DEFAUT = 7;

interface Enigme { titre: string; date: string; enonce: string; reponse: string; }
interface Affiche { id: string; titre: string; url: string; createdAt: string; auteur: string; }
interface Participant {
  id: string; prenom: string; nom: string; notes: string;
  reponses: (boolean | null)[]; // true = bonne, false = fausse, null = pas encore répondue
  createdAt: string; auteur: string; modifieAt?: string;
}
interface Evenement {
  id: string; nom: string; icon: string; description: string; couleur: string;
  enigmes: Enigme[];           // les énigmes de l'évènement (titre, date, énoncé, réponse attendue)
  affiches: Affiche[]; participants: Participant[];
  createdAt: string; auteur: string;
}

function uid() { return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`; }

const VIDE = (): Enigme => ({ titre: '', date: '', enonce: '', reponse: '' });
const ENIGMES_DEFAUT: Enigme[] = [
  { titre: 'La visiteuse de minuit', date: '25 octobre',
    enonce: "Je n'ai ni chair, ni os, pourtant certains jurent m'avoir aperçue. Je traverse les murs et hante les demeures abandonnées. Qui suis-je ?",
    reponse: 'Un fantôme.' },
  { titre: 'Le messager des ténèbres', date: '26 octobre',
    enonce: 'Vêtu de noir, je surveille les champs et les cimetières. Mon cri résonne comme un mauvais présage. Qui suis-je ?',
    reponse: 'Un corbeau.' },
  { titre: 'Le sourire de feu', date: '27 octobre',
    enonce: "Autrefois, je grandissais dans les champs. Aujourd'hui, l'on m'arrache les entrailles et l'on défigure mon visage. Une flamme me donne vie à la nuit tombée. Qui suis-je ?",
    reponse: 'Une citrouille sculptée.' },
  { titre: 'Le noble maudit', date: '28 octobre',
    enonce: 'Le soleil est mon ennemi, la nuit mon royaume. Je ne vieillis jamais, mais pour survivre, je dois boire ce qui coule dans vos veines. Qui suis-je ?',
    reponse: 'Un vampire.' },
  { titre: 'La préparation interdite', date: '29 octobre',
    enonce: "Dans mon ventre bouillonnent plantes et mystérieux ingrédients. Les sorcières m'utilisent pour confectionner leurs mixtures. Qui suis-je ?",
    reponse: 'Un chaudron.' },
  { titre: 'La malédiction de la lune', date: '30 octobre',
    enonce: 'Le jour, je marche parmi les hommes. Mais lorsque la pleine lune paraît, mon corps se couvre de poils et mes cris deviennent des hurlements. Qui suis-je ?',
    reponse: 'Un loup-garou.' },
  { titre: 'La dernière visite', date: '31 octobre',
    enonce: "Nul ne peut me fuir éternellement. Je visite aussi bien les rois que les mendiants. Je ne frappe qu'une fois et personne ne revient raconter notre rencontre. Qui suis-je ?",
    reponse: 'La Mort.' },
].slice(0, NB_ENIGMES_DEFAUT);

/* Anciennes données : les énigmes étaient de simples libellés (texte) */
function normEnigmes(x: unknown): Enigme[] {
  const l = Array.isArray(x) ? x : [];
  return l.map((e: unknown) => typeof e === 'string'
    ? { titre: /^Énigme \d+$/.test(e) ? '' : e, date: '', enonce: '', reponse: '' }
    : { titre: String((e as Enigme)?.titre ?? ''), date: String((e as Enigme)?.date ?? ''), enonce: String((e as Enigme)?.enonce ?? ''), reponse: String((e as Enigme)?.reponse ?? '') });
}

const HALLOWEEN: Evenement = {
  id: 'halloween', nom: 'Halloween', icon: '🎃', couleur: '#E8A04C',
  description: "Chasse aux énigmes d'Halloween — affiches de l'évènement et registre des participants (7 énigmes).",
  enigmes: ENIGMES_DEFAUT,
  affiches: [], participants: [], createdAt: new Date(0).toISOString(), auteur: 'Système',
};

async function lire(): Promise<Evenement[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  const liste: Evenement[] = Array.isArray(data?.value) ? data.value : [HALLOWEEN];
  return liste.map(e => ({ ...e, enigmes: normEnigmes(e.enigmes) }));
}

/* GET — tout membre approuvé */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  return NextResponse.json({ evenements: await lire() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  const ACTIONS_REGISTRE = ['add_participant', 'update_participant', 'delete_participant', 'set_reponse'];
  const registre = ACTIONS_REGISTRE.includes(body.action);

  /* Droits : registre → personnel du dispensaire ; le reste → direction */
  let actor: { id: string; name: string } | null = null;
  if (registre) {
    const staff = await requireRedmStaff();
    if (staff) { const s = await getApiSession(); if (s) actor = { id: s.discordId, name: s.username }; }
    if (!actor) actor = await requireDirectionActor();
  } else {
    actor = await requireDirectionActor();
  }
  if (!actor) return NextResponse.json({ error: registre ? 'Réservé au personnel du dispensaire' : 'Réservé à la direction' }, { status: 403 });

  try {
    const db = await createServiceClient();
    const current = await lire();
    const auteur = await rpNameOf(actor.id, actor.name);
    const ev = (id: unknown) => current.find(e => e.id === id);
    const maj = (id: unknown, f: (e: Evenement) => Evenement) => current.map(e => e.id === id ? f(e) : e);
    let next: Evenement[] = current;

    switch (body.action) {
      case 'create_event': {
        const nom = String(body.nom ?? '').trim().slice(0, 80);
        if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
        const e: Evenement = {
          id: `${nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'evenement'}-${Date.now().toString(36)}`,
          nom, icon: String(body.icon || '🎉').slice(0, 4), couleur: '#E8A04C',
          description: String(body.description ?? '').slice(0, 500),
          enigmes: Array.from({ length: NB_ENIGMES_DEFAUT }, VIDE),
          affiches: [], participants: [], createdAt: new Date().toISOString(), auteur,
        };
        next = [...current, e];
        redmLog(actor, { action: 'evenement_create', category: 'evenements', description: `${actor.name} a créé le dossier évènement « ${nom} »`, meta: { id: e.id } });
        break;
      }
      case 'update_event': {
        const nom = String(body.nom ?? '').trim().slice(0, 80);
        if (!ev(body.id) || !nom) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        next = maj(body.id, e => ({ ...e, nom, icon: String(body.icon || e.icon).slice(0, 4), description: String(body.description ?? e.description).slice(0, 500) }));
        break;
      }
      case 'delete_event': {
        const e = ev(body.id);
        if (!e) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        next = current.filter(x => x.id !== body.id);
        redmLog(actor, { action: 'evenement_delete', category: 'evenements', description: `${actor.name} a supprimé le dossier évènement « ${e.nom} »`, meta: { id: e.id } });
        break;
      }
      case 'set_enigmes': {
        if (!ev(body.id) || !Array.isArray(body.enigmes)) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        const libs: Enigme[] = normEnigmes(body.enigmes.slice(0, 20)).map(x => ({ titre: x.titre.trim().slice(0, 100), date: x.date.trim().slice(0, 40), enonce: x.enonce.trim().slice(0, 2000), reponse: x.reponse.trim().slice(0, 500) }));
        next = maj(body.id, e => ({
          ...e, enigmes: libs,
          participants: e.participants.map(p => ({ ...p, reponses: libs.map((_, i) => p.reponses[i] ?? null) })),
        }));
        break;
      }
      case 'add_affiche': {
        const e = ev(body.id);
        if (!e) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        const m = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/) : null;
        if (!m) return NextResponse.json({ error: 'Image invalide' }, { status: 400 });
        const buffer = Buffer.from(m[2], 'base64');
        if (buffer.byteLength > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image trop lourde (max 4 Mo)' }, { status: 413 });
        const ext = m[1] === 'image/png' ? 'png' : m[1] === 'image/webp' ? 'webp' : 'jpg';
        const filename = `evenement_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await db.storage.from('portraits').upload(filename, buffer, { contentType: m[1], upsert: true });
        if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
        const url = db.storage.from('portraits').getPublicUrl(filename).data.publicUrl;
        const affiche: Affiche = { id: uid(), titre: String(body.titre ?? '').trim().slice(0, 100) || 'Affiche', url, createdAt: new Date().toISOString(), auteur };
        next = maj(body.id, x => ({ ...x, affiches: [...x.affiches, affiche] }));
        redmLog(actor, { action: 'evenement_affiche_add', category: 'evenements', description: `${actor.name} a ajouté l'affiche « ${affiche.titre} » au dossier « ${e.nom} »`, meta: { id: e.id } });
        break;
      }
      case 'rename_affiche': {
        next = maj(body.id, e => ({ ...e, affiches: e.affiches.map(a => a.id === body.afficheId ? { ...a, titre: String(body.titre ?? '').trim().slice(0, 100) || a.titre } : a) }));
        break;
      }
      case 'delete_affiche': {
        const e = ev(body.id);
        if (!e) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        const a = e.affiches.find(x => x.id === body.afficheId);
        next = maj(body.id, x => ({ ...x, affiches: x.affiches.filter(f => f.id !== body.afficheId) }));
        if (a) redmLog(actor, { action: 'evenement_affiche_delete', category: 'evenements', description: `${actor.name} a supprimé l'affiche « ${a.titre} » du dossier « ${e.nom} »`, meta: { id: e.id } });
        break;
      }
      case 'add_participant': {
        const e = ev(body.id);
        if (!e) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        const prenom = String(body.prenom ?? '').trim().slice(0, 60), nom = String(body.nom ?? '').trim().slice(0, 60);
        if (!prenom && !nom) return NextResponse.json({ error: 'Nom ou prénom requis' }, { status: 400 });
        const p: Participant = { id: uid(), prenom, nom, notes: String(body.notes ?? '').slice(0, 500), reponses: e.enigmes.map(() => null), createdAt: new Date().toISOString(), auteur };
        next = maj(body.id, x => ({ ...x, participants: [...x.participants, p] }));
        redmLog(actor, { action: 'evenement_participant_add', category: 'evenements', description: `${actor.name} a ajouté ${prenom} ${nom} au registre « ${e.nom} »`, meta: { id: e.id, participant: p.id } });
        break;
      }
      case 'update_participant': {
        next = maj(body.id, e => ({ ...e, participants: e.participants.map(p => p.id === body.participantId
          ? { ...p, prenom: String(body.prenom ?? p.prenom).trim().slice(0, 60), nom: String(body.nom ?? p.nom).trim().slice(0, 60), notes: String(body.notes ?? p.notes).slice(0, 500), modifieAt: new Date().toISOString() } : p) }));
        break;
      }
      case 'delete_participant': {
        const e = ev(body.id);
        if (!e) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });
        const p = e.participants.find(x => x.id === body.participantId);
        next = maj(body.id, x => ({ ...x, participants: x.participants.filter(y => y.id !== body.participantId) }));
        if (p) redmLog(actor, { action: 'evenement_participant_delete', category: 'evenements', description: `${actor.name} a supprimé la fiche de ${p.prenom} ${p.nom} du registre « ${e.nom} »`, meta: { id: e.id } });
        break;
      }
      case 'set_reponse': {
        const idx = Number(body.index);
        const valeur = body.valeur === true ? true : body.valeur === false ? false : null;
        next = maj(body.id, e => ({
          ...e,
          participants: e.participants.map(p => {
            if (p.id !== body.participantId || !Number.isInteger(idx) || idx < 0 || idx >= e.enigmes.length) return p;
            const reponses = e.enigmes.map((_, i) => i === idx ? valeur : (p.reponses[i] ?? null));
            return { ...p, reponses, modifieAt: new Date().toISOString() };
          }),
        }));
        break;
      }
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, evenements: next });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
