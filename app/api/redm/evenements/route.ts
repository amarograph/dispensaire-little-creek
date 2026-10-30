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
   • Structure (dossiers, visibilité, affiches, récompenses, énigmes) : directeur, co-directeur, admin.
   • Registre (fiches participants et résultats) : tout le personnel du dispensaire.
   • Un dossier « masqué » n'est visible (et modifiable) que par la direction. */

const KEY = 'redm_evenements';
const NB_ENIGMES_DEFAUT = 7;

/* groupe : les énigmes d'un même groupe ne comptent qu'une fois (dès que l'une est notée, les autres ne comptent plus) */
interface Enigme { titre: string; date: string; enonce: string; reponse: string; groupe?: string; }
interface Affiche { id: string; titre: string; url: string; createdAt: string; auteur: string; }
interface Recompense { id: string; rang: string; titre: string; description: string; gagnant: string; }
interface Participant {
  id: string; prenom: string; nom: string; notes: string;
  reponses: (boolean | null)[]; // true = bonne, false = fausse, null = pas encore répondue
  reponsesBonus?: (boolean | null)[]; // énigmes de départage (égalité à 7/7)
  createdAt: string; auteur: string; modifieAt?: string;
}
interface Evenement {
  id: string; nom: string; icon: string; description: string; couleur: string;
  visible?: boolean;           // false = réservé à la direction (défaut : visible par tous)
  enigmes: Enigme[];           // les énigmes de l'évènement (date, énoncé, réponse attendue)
  bonus?: Enigme[];            // énigmes de départage, affichées seulement en cas d'égalité parfaite
  recompenses?: Recompense[];
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

/* Énigmes de départage : n'apparaissent que si plusieurs participants sont à égalité parfaite (7/7).
   Les deux dernières sont alternatives : l'une notée, l'autre ne compte plus (anti-triche). */
const GROUPE_FINAL = 'depart-final';
const BONUS_DEFAUT: Enigme[] = [
  { titre: '', date: '',
    enonce: "Je tiens de la guérisseuse autant que du maléfice,\nEt ce qui soigne entre mes mains peut devenir supplice.\nOn me prête un pacte, un bal et des prières inversées,\nTandis que d’autres me voient comme femme savante rejetée.\nJ’habite les récits que l’Église et la peur ont façonnés.\nQui suis-je ?",
    reponse: 'La sorcière' },
  { titre: '', date: '',
    enonce: "Je ne suis plus tout à fait de ce monde,\nEt pourtant les routes, les ponts et les rives me répondent.\nOn me voit lorsque le brouillard se lève et que tout devient froid,\nMa robe semble claire, mais mon histoire ne l’est pas.\nOn me dit née d’un malheur que le temps n’a pas lavé,\nD’un amour, d’un meurtre ou d’un serment inachevé.\nJe ne poursuis pas toujours, je n’appelle pas toujours,\nMais ceux qui me croisent doutent parfois de leur retour.\nQui suis-je ?",
    reponse: 'La dame blanche' },
  { titre: '', date: '',
    enonce: "Je marche sans repos, bien que mon heure soit passée.\nLa terre m’a pris, mais ne m’a point gardé.\nJe ne suis plus des vôtres, et pourtant je reviens,\nPortant dans mes pas l’effroi des anciens.\nNi tout à fait mort, ni véritablement en vie.\nQui suis-je ?",
    reponse: 'Le mort-vivant' },
  { titre: '', date: '',
    enonce: "Je suis un domaine où nul ne possède plus rien,\nSinon un nom gravé, quelques dates et la mémoire des siens.\nLes pas s’y font lents, les voix s’y font basses,\nEt même le vent semble y respecter ce qui passe.\nJe reçois sans choisir l’enfant, le pauvre, le roi,\nEt pourtant nul n’y demeure par goût ou par choix.\nQui suis-je ?",
    reponse: 'Le cimetière' },
  { titre: '', date: '',
    enonce: "Je fus jadis caché sous la chaleur du vivant,\nMais le temps m’a rendu à ma vérité d’avant.\nSans moi, nul pas, nul geste, nulle stature ne demeure,\nEt pourtant l’on ne me découvre vraiment qu’après la dernière heure.\nJe suis l’ouvrage nu sur lequel la chair fut portée,\nLa dernière architecture quand toute beauté s’est effacée.\nQui suis-je ?",
    reponse: 'Le squelette' },
  { titre: '', date: '',
    enonce: "Je ne règne ni par couronne ni par justice,\nMais par le désir, la faiblesse et le vice.\nJe m’invite là où l’âme hésite et se fend,\nCar je connais le prix exact des rêves des vivants.\nOn m’imagine dans la flamme, dans l’ombre ou sous un nom interdit,\nMais je suis surtout la promesse qui corrompt avant même d’avoir été saisie.\nQui suis-je ?",
    reponse: 'Le démon' },
  { titre: '', date: '', groupe: GROUPE_FINAL,
    enonce: "Lorsque la nuit recouvre les chemins oubliés,\nOn entend mon passage avant de me distinguer.\nJe poursuis sans relâche ce que le destin m'a ravi,\nCondamné à chercher ce qui me manque depuis la fin de ma vie.\nNul ne connaît le repos de mon errance,\nEt ceux qui me croisent regrettent souvent leur imprudence.\nMon histoire est celle d'une perte que même la tombe n'a su apaiser.\n\nQui suis-je ?",
    reponse: 'Le Cavalier sans tête' },
  { titre: '', date: '', groupe: GROUPE_FINAL,
    enonce: "Je demeure lorsque ceux qui m'ont donné vie ne sont plus,\nGardienne silencieuse de secrets à jamais tus.\nLe temps me dévore, mais certains souvenirs lui résistent,\nEt dans mon silence, d'étranges présences persistent.\n\nJe ne retiens personne, pourtant certains ne peuvent me quitter,\nJe ne possède aucune voix, mais l'on prétend m'entendre murmurer.\nCeux qui franchissent mon seuil viennent chercher la vérité,\nMais découvrent parfois que le passé refuse d'être enterré.\n\nQui suis-je ?",
    reponse: 'La maison hantée' },
];

/* Anciennes données : les énigmes étaient de simples libellés (texte) */
function normEnigmes(x: unknown): Enigme[] {
  const l = Array.isArray(x) ? x : [];
  return l.map((e: unknown) => {
    if (typeof e === 'string') return { titre: /^Énigme \d+$/.test(e) ? '' : e, date: '', enonce: '', reponse: '' };
    const g = (e as Enigme)?.groupe;
    return {
      titre: String((e as Enigme)?.titre ?? ''), date: String((e as Enigme)?.date ?? ''),
      enonce: String((e as Enigme)?.enonce ?? ''), reponse: String((e as Enigme)?.reponse ?? ''),
      ...(typeof g === 'string' && g ? { groupe: g.slice(0, 40) } : {}),
    };
  });
}

const HALLOWEEN: Evenement = {
  id: 'halloween', nom: 'Halloween', icon: '🎃', couleur: '#E8A04C', visible: true,
  description: "Chasse aux énigmes d'Halloween — affiches de l'évènement, registre des participants (7 énigmes) et récompenses.",
  enigmes: ENIGMES_DEFAUT, bonus: BONUS_DEFAUT, recompenses: [],
  affiches: [], participants: [], createdAt: new Date(0).toISOString(), auteur: 'Système',
};

async function lire(): Promise<Evenement[]> {
  const db = await createServiceClient();
  const { data } = await db.from('site_config').select('value').eq('key', KEY).single();
  const liste: Evenement[] = Array.isArray(data?.value) ? data.value : [HALLOWEEN];
  return liste.map(e => {
    /* Le dossier Halloween existant reçoit les énigmes de départage tant qu'il n'en a pas */
    const bonus = Array.isArray(e.bonus) ? normEnigmes(e.bonus) : (e.id === 'halloween' ? BONUS_DEFAUT : []);
    return {
      ...e, visible: e.visible !== false,
      enigmes: normEnigmes(e.enigmes), bonus,
      recompenses: Array.isArray(e.recompenses) ? e.recompenses : [],
      participants: (e.participants ?? []).map(p => ({ ...p, reponsesBonus: bonus.map((_, i) => p.reponsesBonus?.[i] ?? null) })),
    };
  });
}

/* GET — tout membre approuvé ; les dossiers masqués ne sont renvoyés qu'à la direction */
export async function GET() {
  const session = await getApiSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const direction = await requireDirectionActor();
  const liste = await lire();
  return NextResponse.json({ evenements: direction ? liste : liste.filter(e => e.visible !== false) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  const ACTIONS_REGISTRE = ['add_participant', 'update_participant', 'delete_participant', 'set_reponse', 'set_reponse_bonus'];
  const registre = ACTIONS_REGISTRE.includes(body.action);

  /* Droits : registre → personnel du dispensaire ; le reste → direction */
  const direction = await requireDirectionActor();
  let actor: { id: string; name: string } | null = direction;
  if (!actor && registre) {
    const staff = await requireRedmStaff();
    if (staff) { const s = await getApiSession(); if (s) actor = { id: s.discordId, name: s.username }; }
  }
  if (!actor) return NextResponse.json({ error: registre ? 'Réservé au personnel du dispensaire' : 'Réservé à la direction' }, { status: 403 });

  try {
    const db = await createServiceClient();
    const current = await lire();
    const auteur = await rpNameOf(actor.id, actor.name);
    /* Un dossier masqué n'existe pas pour ceux qui ne sont pas de la direction */
    const ev = (id: unknown) => current.find(e => e.id === id && (direction || e.visible !== false));
    const maj = (id: unknown, f: (e: Evenement) => Evenement) => current.map(e => e.id === id ? f(e) : e);
    let next: Evenement[] = current;

    if (body.action !== 'create_event' && !ev(body.id)) return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 });

    switch (body.action) {
      case 'create_event': {
        const nom = String(body.nom ?? '').trim().slice(0, 80);
        if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
        const e: Evenement = {
          id: `${nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'evenement'}-${Date.now().toString(36)}`,
          nom, icon: String(body.icon || '🎉').slice(0, 4), couleur: '#E8A04C', visible: true,
          description: String(body.description ?? '').slice(0, 500),
          enigmes: Array.from({ length: NB_ENIGMES_DEFAUT }, VIDE), bonus: [], recompenses: [],
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
      case 'set_visible': {
        if (!direction) return NextResponse.json({ error: 'Réservé à la direction' }, { status: 403 });
        const visible = body.visible !== false;
        const e = ev(body.id)!;
        next = maj(body.id, x => ({ ...x, visible }));
        redmLog(actor, { action: 'evenement_visibilite', category: 'evenements', description: `${actor.name} a ${visible ? 'affiché à tous' : 'masqué (direction seulement)'} le dossier « ${e.nom} »`, meta: { id: e.id, visible } });
        break;
      }
      case 'set_enigmes': {
        if (!Array.isArray(body.enigmes)) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
        const nettoie = (l: unknown[]): Enigme[] => normEnigmes(l.slice(0, 20)).map(x => ({ ...x, titre: x.titre.trim().slice(0, 100), date: x.date.trim().slice(0, 40), enonce: x.enonce.trim().slice(0, 3000), reponse: x.reponse.trim().slice(0, 500) }));
        const libs = nettoie(body.enigmes);
        const bonus = Array.isArray(body.bonus) ? nettoie(body.bonus) : null;
        next = maj(body.id, e => {
          const b = bonus ?? e.bonus ?? [];
          return {
            ...e, enigmes: libs, bonus: b,
            participants: e.participants.map(p => ({ ...p, reponses: libs.map((_, i) => p.reponses[i] ?? null), reponsesBonus: b.map((_, i) => p.reponsesBonus?.[i] ?? null) })),
          };
        });
        break;
      }
      case 'add_recompense':
      case 'update_recompense': {
        const champs = {
          rang: String(body.rang ?? '').trim().slice(0, 60), titre: String(body.titre ?? '').trim().slice(0, 120),
          description: String(body.description ?? '').trim().slice(0, 1000), gagnant: String(body.gagnant ?? '').trim().slice(0, 120),
        };
        if (!champs.titre) return NextResponse.json({ error: 'Intitulé du prix requis' }, { status: 400 });
        const e = ev(body.id)!;
        if (body.action === 'add_recompense') {
          next = maj(body.id, x => ({ ...x, recompenses: [...(x.recompenses ?? []), { id: uid(), ...champs }] }));
          redmLog(actor, { action: 'evenement_recompense_add', category: 'evenements', description: `${actor.name} a ajouté le prix « ${champs.titre} » au dossier « ${e.nom} »`, meta: { id: e.id } });
        } else {
          next = maj(body.id, x => ({ ...x, recompenses: (x.recompenses ?? []).map(r => r.id === body.recompenseId ? { ...r, ...champs } : r) }));
        }
        break;
      }
      case 'delete_recompense': {
        const e = ev(body.id)!;
        const r = (e.recompenses ?? []).find(x => x.id === body.recompenseId);
        next = maj(body.id, x => ({ ...x, recompenses: (x.recompenses ?? []).filter(y => y.id !== body.recompenseId) }));
        if (r) redmLog(actor, { action: 'evenement_recompense_delete', category: 'evenements', description: `${actor.name} a supprimé le prix « ${r.titre} » du dossier « ${e.nom} »`, meta: { id: e.id } });
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
        const p: Participant = { id: uid(), prenom, nom, notes: String(body.notes ?? '').slice(0, 500), reponses: e.enigmes.map(() => null), reponsesBonus: (e.bonus ?? []).map(() => null), createdAt: new Date().toISOString(), auteur };
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
      case 'set_reponse_bonus': {
        const idx = Number(body.index);
        const valeur = body.valeur === true ? true : body.valeur === false ? false : null;
        const e = ev(body.id)!;
        const bonus = e.bonus ?? [];
        if (!Number.isInteger(idx) || idx < 0 || idx >= bonus.length) return NextResponse.json({ error: 'Énigme inconnue' }, { status: 400 });
        /* Anti-triche : dans un groupe d'énigmes alternatives, dès que l'une est notée les autres ne comptent plus */
        const g = bonus[idx].groupe;
        const p0 = e.participants.find(p => p.id === body.participantId);
        if (g && valeur !== null && p0 && bonus.some((b, i) => i !== idx && b.groupe === g && (p0.reponsesBonus?.[i] ?? null) !== null))
          return NextResponse.json({ error: "L'autre énigme de ce choix est déjà notée : elle seule compte." }, { status: 409 });
        next = maj(body.id, x => ({
          ...x,
          participants: x.participants.map(p => {
            if (p.id !== body.participantId) return p;
            return { ...p, reponsesBonus: bonus.map((_, i) => i === idx ? valeur : (p.reponsesBonus?.[i] ?? null)), modifieAt: new Date().toISOString() };
          }),
        }));
        break;
      }
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const { error } = await db.from('site_config').upsert({ key: KEY, value: next }, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, evenements: direction ? next : next.filter(e => e.visible !== false) });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
