'use client';

import { useState, useEffect } from 'react';
import './bibliotheque.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { COURS } from './_cours';
import { CoursDocument } from './_CoursDocument';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', paper: '#214452', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5', sepia: '#D4B896' };

interface BiblioDoc {
  id: string;
  titre: string;
  contenu: string;
  date: string;
}
interface BiblioCategorie {
  id: string;
  nom: string;
  icon: string;
  documents: BiblioDoc[];
}

const DEFAULT_CATEGORIES: BiblioCategorie[] = [
  { id: 'reglement-interne',    nom: 'Règlement Interne',       icon: '⚖',  documents: [] },
  { id: 'serment-hippocrate',   nom: "Serment d'Hippocrate",    icon: '⚕',  documents: [] },
  { id: 'specialites-proposees', nom: 'Spécialités Proposées',  icon: '✦',  documents: [] },
  { id: 'protocole-sanitaire',   nom: 'Protocole Sanitaire — Gestion d\'un Risque Sanitaire', icon: '🛡️', documents: [] },
  { id: 'protocole-epidemie',    nom: 'Protocole Sanitaire — Gestion d\'une Épidémie', icon: '⚠️', documents: [] },
  /* Cours et manuels : contenu des PDF officiels (voir _cours.ts) */
  ...COURS.map(c => ({ id: c.id, nom: c.nom, icon: c.icon, documents: [] as BiblioDoc[] })),
];

const ICONS = ['📜', '⚖', '📖', '🧪', '💊', '🩹', '📋', '🗂', '🧬', '📰'];

const OLD_REGLEMENT_DOC_ID = 'reglement-general-dispensaire-lemoyne';

function cleanupOldReglementDoc(cats: BiblioCategorie[]): BiblioCategorie[] {
  return cats.map(c => c.id === 'reglement-interne'
    ? { ...c, documents: c.documents.filter(d => d.id !== OLD_REGLEMENT_DOC_ID) }
    : c
  );
}

function ensureBuiltinCategories(cats: BiblioCategorie[]): BiblioCategorie[] {
  const result = [...cats];
  for (const builtin of DEFAULT_CATEGORIES) {
    if (!result.some(c => c.id === builtin.id)) result.push({ ...builtin });
  }
  return result;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/');
  s[2] = String(Number(s[2]) - 136);
  return s.join('/');
}

async function load(): Promise<BiblioCategorie[]> {
  try {
    const r = await fetch('/api/redm/bibliotheque');
    const parsed = r.ok ? await r.json() : [];
    const cats = Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CATEGORIES;
    return ensureBuiltinCategories(cleanupOldReglementDoc(cats));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/* Opérations atomiques : chaque appel relit l'état serveur, applique un seul changement, écrit —
   jamais un remplacement en bloc de tout l'arbre local d'un onglet. */
async function apiCall(body: Record<string, unknown>): Promise<BiblioCategorie[] | null> {
  try {
    const r = await fetch('/api/redm/bibliotheque', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) return null;
    const d = await r.json();
    if (!Array.isArray(d.categories)) return null;
    return ensureBuiltinCategories(cleanupOldReglementDoc(d.categories));
  } catch { return null; }
}
async function createCategoryApi(categorie: BiblioCategorie) { return apiCall({ action: 'createCategory', categorie }); }
async function renameCategoryApi(id: string, nom: string, icon: string) { return apiCall({ action: 'renameCategory', id, nom, icon }); }
async function deleteCategoryApi(id: string) { return apiCall({ action: 'deleteCategory', id }); }
async function upsertDocApi(categoryId: string, doc: BiblioDoc) { return apiCall({ action: 'upsertDoc', categoryId, doc }); }
async function deleteDocApi(categoryId: string, docId: string) { return apiCall({ action: 'deleteDoc', categoryId, docId }); }

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 14, letterSpacing: '0.10em', padding: '9px 16px', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.25)', color: T.muted };
const btnGold: React.CSSProperties = { ...btn, border: `1px solid ${T.gold}`, color: T.gold, background: 'rgba(209,183,124,0.08)' };
const btnRed: React.CSSProperties = { ...btn, border: '1px solid rgba(180,70,70,0.5)', color: '#C87060', background: 'rgba(180,70,70,0.08)' };

/* ── Règlement Général du Dispensaire (document mis en avant) ── */

const REGLEMENT_CHAPITRES = [
  { num: 'I',    title: 'DE LA CONDUITE DU PERSONNEL',         icon: '🎖', col: '#8B4040' },
  { num: 'II',   title: "DE L'ORGANISATION DU DISPENSAIRE",    icon: '⚙',  col: '#AAB9C6' },
  { num: 'III',  title: "DE L'HYGIÈNE ET DE LA SALUBRITÉ",     icon: '🧼', col: '#A8B991' },
  { num: 'IV',   title: 'DES SOINS MÉDICAUX',                   icon: '⚕',  col: '#6B4A78' },
  { num: 'V',    title: 'DES REMÈDES, PLANTES ET PRÉPARATIONS', icon: '🌿', col: '#786030' },
  { num: 'VI',   title: 'DES VISITES EXTÉRIEURES',              icon: '🐎', col: '#4A6878' },
  { num: 'VII',  title: "DE L'ENSEIGNEMENT MÉDICAL",            icon: '📖', col: '#A8B991' },
  { num: 'VIII', title: 'DU SECRET MÉDICAL',                    icon: '🔒', col: '#D1B77C' },
  { num: 'IX',   title: 'DE LA MORALITÉ DU PRATICIEN',          icon: '⚖',  col: '#D1B77C' },
  { num: 'X',    title: 'DES SANCTIONS DISCIPLINAIRES',         icon: '⚠',  col: '#EADCB9' },
] as const;

function RegSectionHeader({ num, title, icon, col }: { num: string; title: string; icon: string; col: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
      <div style={{ width: 50, height: 50, background: `${col}20`, border: `2px solid ${col}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 20, color: col }}>{num}</span>
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: col, letterSpacing: '0.22em', marginBottom: 2 }}>CHAPITRE {num}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 21, color: T.sepia, letterSpacing: '0.06em' }}>{icon} {title}</div>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${col}60, transparent)`, marginLeft: 8 }} />
    </div>
  );
}

function RegPara({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.9, margin: '0 0 12px', textAlign: 'justify' }}>{children}</p>;
}

function RegList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '8px 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ color: T.gold, fontFamily: MONO, fontSize: 14, flexShrink: 0, marginTop: 2 }}>◆</span>
          <span style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.75 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RegBlock({ children, col = T.border }: { children: React.ReactNode; col?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${col}`, borderLeft: `3px solid ${col}`, padding: '22px 28px', marginBottom: 18 }}>
      {children}
    </div>
  );
}

function RegCitation({ text, author }: { text: string; author: string }) {
  return (
    <div style={{ margin: '18px 0 0', padding: '16px 24px', borderLeft: `3px solid ${T.gold}`, background: 'rgba(209,183,124,0.06)', position: 'relative' }}>
      <span style={{ position: 'absolute', top: -12, left: 16, fontFamily: DISPLAY, fontSize: 40, color: T.gold, opacity: 0.35, lineHeight: 1 }}>"</span>
      <p style={{ fontFamily: BODY, fontSize: 16, color: T.sepia, fontStyle: 'italic', lineHeight: 1.85, margin: '0 0 8px', paddingTop: 8 }}>{text}</p>
      <div style={{ fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.12em' }}>— {author}</div>
    </div>
  );
}

function ReglementDocument() {
  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '36px 20px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderBottom: pos.includes('bottom') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderLeft: pos.includes('left') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderRight: pos.includes('right') ? '2px solid rgba(209,183,124,0.45)' : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.3em', marginBottom: 10 }}>✦ DOCUMENT OFFICIEL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 8px', letterSpacing: '0.05em' }}>📜 Règlement Général du Dispensaire</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>Révisé et approuvé en l'an de grâce 1890</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>SOUS LA DIRECTION DU DOCTEUR FRANÇOIS DE MILLET · MÉDECIN FORMÉ À PARIS</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: '0 auto 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.2em' }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
      </div>

      {/* Sommaire */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: 'rgba(209,183,124,0.04)', border: `1px solid rgba(209,183,124,0.18)` }}>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SOMMAIRE</span>
        {REGLEMENT_CHAPITRES.map(c => (
          <a key={c.num} href={`#chap-${c.num}`} style={{ fontFamily: MONO, fontSize: 14, color: c.col, background: `${c.col}15`, border: `1px solid ${c.col}40`, padding: '4px 12px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.08em' }}>
            {c.num}. {c.title}
          </a>
        ))}
      </div>

      {/* Préambule */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, letterSpacing: '0.22em', background: 'rgba(209,183,124,0.10)', padding: '6px 16px', border: `1px solid rgba(209,183,124,0.30)` }}>PRÉAMBULE</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(209,183,124,0.25)' }} />
        </div>
        <RegBlock col="rgba(209,183,124,0.35)">
          <RegPara>Le Dispensaire a pour vocation de porter secours aux malades, blessés et nécessiteux du territoire, sans distinction de fortune, d'origine, de profession ou de confession.</RegPara>
          <RegPara>Fondé sur les principes de la médecine moderne tout en conservant les savoirs éprouvés de l'herboristerie et des remèdes traditionnels, le dispensaire s'efforce d'offrir des soins dignes, rigoureux et respectueux de la personne humaine.</RegPara>
          <RegPara>Tout membre du personnel médical, qu'il soit médecin, infirmier, étudiant, apprenti ou intendant, s'engage à respecter le présent règlement, garant de la discipline, de l'hygiène, de l'efficacité des soins et de l'honneur de la profession médicale.</RegPara>
        </RegBlock>
      </div>

      {/* Chapitre I */}
      <div id="chap-I" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[0].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[0].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[0]} />
        <RegPara>Tout membre du dispensaire devra se présenter dans une tenue propre, décente et adaptée à sa fonction.</RegPara>
        <RegPara>Les vêtements de travail devront être régulièrement lavés et entretenus afin de préserver la salubrité des locaux et la sécurité des patients.</RegPara>
        <RegPara>Le personnel médical devra faire preuve en toute circonstance de :</RegPara>
        <RegList items={['Respect', 'Patience', 'Discrétion', 'Courtoisie', 'Sang-froid']} />
        <RegPara>Les querelles, insultes, comportements agressifs ou attitudes portant atteinte à la réputation du dispensaire sont strictement interdits.</RegPara>
        <div style={{ background: 'rgba(139,64,64,0.10)', border: '1px solid rgba(139,64,64,0.30)', padding: '14px 20px' }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 6 }}>⚠ AVERTISSEMENT</div>
          <RegPara>L'état d'ivresse, l'usage abusif de substances altérant le jugement ou toute négligence mettant en danger un patient pourront entraîner des <strong style={{ color: '#DF9A88' }}>sanctions immédiates</strong>.</RegPara>
        </div>
      </div>

      {/* Chapitre II */}
      <div id="chap-II" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[1].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[1].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[1]} />
        <RegPara>Le dispensaire demeure au service de la population aussi longtemps que des soins sont nécessaires.</RegPara>
        <RegPara>Un médecin ou un infirmier devra être désigné pour assurer la permanence des soins lorsque la situation l'exige.</RegPara>
        <RegPara>En cas d'affluence importante ou d'urgence majeure, l'ensemble du personnel disponible pourra être rappelé afin de renforcer les effectifs.</RegPara>
        <RegPara>Les patients dont l'état nécessite une surveillance prolongée pourront être maintenus sous observation dans les locaux du dispensaire aussi longtemps que leur état le justifie.</RegPara>
        <RegPara>Tout événement notable devra être consigné dans les registres officiels de l'établissement.</RegPara>
      </div>

      {/* Chapitre III */}
      <div id="chap-III" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[2].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[2].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[2]} />
        <RegPara>Conformément aux connaissances médicales actuelles, l'hygiène constitue l'une des premières protections contre les maladies et les infections.</RegPara>
        <RegPara>Chaque membre du personnel devra :</RegPara>
        <RegList items={[
          'Se laver les mains avant et après chaque soin',
          'Nettoyer les instruments après utilisation',
          'Désinfecter les plaies avant tout traitement',
          'Maintenir les salles dans un état constant de propreté',
          "Veiller à l'aération régulière des locaux",
        ]} />
        <RegPara>Les instruments chirurgicaux devront être désinfectés à l'eau bouillante ou par tout procédé antiseptique reconnu avant chaque intervention.</RegPara>
        <RegPara>Tout linge souillé devra être remplacé ou nettoyé dans les plus brefs délais.</RegPara>
        <RegPara>Les patients atteints de maladies contagieuses pourront être isolés afin de limiter les risques de propagation.</RegPara>
      </div>

      {/* Chapitre IV */}
      <div id="chap-IV" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[3].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[3].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[3]} />
        <RegPara>Le dispensaire reconnaît l'utilité de la médecine scientifique ainsi que celle des remèdes naturels dont l'efficacité est reconnue.</RegPara>
        <RegPara>Les traitements devront toujours être adaptés à l'état du patient et fondés sur les connaissances médicales disponibles.</RegPara>
        <RegPara>Les interventions chirurgicales pourront être réalisées lorsque la situation l'exige, notamment :</RegPara>
        <RegList items={[
          'Traitement des blessures graves',
          'Extraction de projectiles',
          'Réduction de fractures',
          'Amputations de nécessité',
          'Drainage des infections',
        ]} />
        <RegPara>L'utilisation de l'éther ou du chloroforme est autorisée sous la supervision d'un médecin compétent.</RegPara>
        <RegPara>Aucun traitement expérimental ne pourra être administré sans l'accord du Directeur du dispensaire.</RegPara>
      </div>

      {/* Chapitre V */}
      <div id="chap-V" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[4].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[4].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[4]} />
        <RegPara>L'étude et l'usage des plantes médicinales font partie intégrante de l'enseignement dispensé à West Elizabeth.</RegPara>
        <RegPara>Les décoctions, infusions, onguents et élixirs préparés au dispensaire devront être consignés dans les registres du laboratoire.</RegPara>
        <RegPara>Parmi les plantes les plus couramment employées figurent notamment :</RegPara>
        <RegList items={['Camomille', 'Mélisse', 'Verveine', 'Tilleul', 'Arnica', 'Saule blanc', 'Menthe', 'Thym', 'Valériane']} />
        <RegPara>Le lait de pavot ne devra être administré qu'avec prudence et uniquement lorsque l'état du patient le justifie.</RegPara>
        <RegPara>Toute substance inconnue, dangereuse ou d'origine douteuse est interdite dans l'enceinte du dispensaire.</RegPara>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 14px' }}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>—</span>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.15em' }}>DES MÉDICAMENTS ET PRÉPARATIONS PHARMACEUTIQUES</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(209,183,124,0.18)' }} />
        </div>
        <RegPara>Le dispensaire reconnaît également l'usage des médicaments issus des avancées récentes de la médecine et de la pharmacie moderne.</RegPara>
        <RegPara>Lorsque l'état du malade le justifie, les praticiens sont autorisés à employer notamment :</RegPara>
        <RegList items={[
          'La quinine pour le traitement des fièvres et des accès paludéens',
          'Les préparations à base de morphine pour le soulagement des douleurs sévères',
          "Le chloroforme et l'éther lors des interventions chirurgicales",
          "L'acide phénique et autres antiseptiques destinés à prévenir les infections",
          'Les sels minéraux, fortifiants et toniques employés dans les états de faiblesse ou de convalescence',
          "Les préparations à base d'iode pour certaines affections de la peau et des plaies",
        ]} />
        <RegPara>Toute administration de médicament devra être adaptée à l'état du patient et consignée dans les registres du dispensaire.</RegPara>
        <RegPara>Le dispensaire considère que la médecine moderne et l'herboristerie ne s'opposent pas, mais se complètent. Les praticiens sont encouragés à employer le traitement le plus approprié à chaque situation, qu'il provienne des remèdes naturels ou des progrès récents de la science médicale.</RegPara>
        <RegPara>Les plantes médicinales demeurent toutefois au cœur de l'enseignement dispensé à West Elizabeth. Elles constituent souvent le premier recours dans le traitement des affections bénignes et représentent un savoir précieux transmis depuis plusieurs générations de praticiens.</RegPara>
        <RegPara>Tout médecin ou étudiant du dispensaire devra posséder des connaissances suffisantes en botanique médicale afin de reconnaître les principales plantes thérapeutiques, leurs usages, leurs bienfaits ainsi que leurs dangers potentiels.</RegPara>
      </div>

      {/* Chapitre VI */}
      <div id="chap-VI" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[5].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[5].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[5]} />
        <RegPara>Les médecins et infirmiers sont autorisés à se déplacer hors du dispensaire lorsque les circonstances l'exigent.</RegPara>
        <RegPara>Les visites à domicile peuvent être effectuées :</RegPara>
        <RegList items={[
          "Lorsqu'un patient est incapable de se déplacer",
          "Lorsqu'une urgence survient loin du dispensaire",
          "Lorsqu'une autorité sollicite officiellement l'assistance médicale",
        ]} />
        <RegPara>Tout soin réalisé à l'extérieur devra être inscrit dans les registres dès le retour du personnel concerné.</RegPara>
      </div>

      {/* Chapitre VII */}
      <div id="chap-VII" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[6].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[6].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[6]} />
        <RegPara>Le dispensaire participe à la formation de futurs praticiens.</RegPara>
        <RegPara>Les étudiants et apprentis sont tenus :</RegPara>
        <RegList items={[
          "D'obéir à leurs supérieurs",
          "D'étudier avec sérieux",
          "D'observer attentivement les soins",
          "De poser des questions lorsqu'ils ne comprennent pas une procédure",
        ]} />
        <RegPara>Aucun étudiant ne peut pratiquer seul une intervention dépassant son niveau de compétence.</RegPara>
        <RegPara>L'étude des maladies, de l'anatomie, des plantes médicinales et des règles d'hygiène est obligatoire.</RegPara>
      </div>

      {/* Chapitre VIII */}
      <div id="chap-VIII" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[7].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[7].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[7]} />
        <RegPara>Les informations confiées au personnel médical sont strictement confidentielles.</RegPara>
        <RegPara>Les dossiers, registres et correspondances du dispensaire ne peuvent être consultés que par le personnel autorisé.</RegPara>
        <RegPara>Aucune information concernant un patient ne devra être divulguée sans raison légitime.</RegPara>
        <RegPara>Le respect de la dignité et de la vie privée du malade constitue un devoir fondamental.</RegPara>
      </div>

      {/* Chapitre IX */}
      <div id="chap-IX" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[8].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[8].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[8]} />
        <RegPara>Tout membre du dispensaire s'engage à :</RegPara>
        <RegList items={[
          'Servir les malades avec honnêteté',
          'Respecter la vie humaine',
          "Préserver l'honneur de la profession",
          'Rechercher la vérité médicale plutôt que les superstitions',
          'Transmettre son savoir aux générations futures',
          "Faire preuve d'humilité devant les limites de la médecine",
        ]} />
        <RegPara>Le médecin doit se souvenir qu'il ne peut pas toujours guérir, mais qu'il peut toujours soulager.</RegPara>
      </div>

      {/* Chapitre X */}
      <div id="chap-X" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${REGLEMENT_CHAPITRES[9].col}40`, borderTop: `3px solid ${REGLEMENT_CHAPITRES[9].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...REGLEMENT_CHAPITRES[9]} />
        <RegPara>Toute violation du présent règlement pourra faire l'objet d'une procédure disciplinaire.</RegPara>
        <RegPara>Les sanctions pourront comprendre :</RegPara>
        <RegList items={[
          'Un avertissement verbal',
          'Un avertissement écrit',
          'Une suspension temporaire',
          'Une exclusion définitive du dispensaire',
        ]} />
        <RegPara>Les décisions disciplinaires relèvent de l'autorité du Directeur du Dispensaire ou du médecin chargé d'assurer son autorité en son absence.</RegPara>
        <RegPara>Tout différend, incident ou comportement répréhensible devra faire l'objet d'un rapport écrit détaillant les faits observés.</RegPara>
      </div>

      {/* Signature */}
      <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
        <RegPara>Fait à West Elizabeth, en l'an de grâce 1890.</RegPara>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.16em', marginBottom: 22 }}>DIRECTEUR DU DISPENSAIRE DE LITTLE CREEK</div>
      </div>
    </div>
  );
}

/* ── Serment d'Hippocrate (document mis en avant) ── */

function SermentHippocrateDocument() {
  return (
    <div style={{ marginTop: 50, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 1000, width: '100%', background: T.card, border: `1px solid ${T.gold}`, padding: 18, boxShadow: '0 0 40px rgba(74,62,32,0.14)' }}>
        <img
          src="/serment-hippocrate.png"
          alt="Serment d'Hippocrate — Dispensaire, 1890"
          style={{ width: '100%', height: 'auto', display: 'block', border: `1px solid ${T.border}` }}
        />
      </div>
    </div>
  );
}
/* ── Spécialités Proposées ── */

const SPECIALITES_LIST = [
  { titre: 'Médecine Générale',      col: '#A8B991', desc: 'Le médecin généraliste est le premier praticien consulté par la population. Il diagnostique les maladies courantes, soigne les blessures légères et oriente les patients vers une spécialité lorsque cela est nécessaire.' },
  { titre: 'Chirurgie',              col: '#DF9A88', desc: 'Le chirurgien intervient lors des blessures graves et des opérations nécessitant une intervention manuelle. Il traite notamment les fractures complexes, les plaies profondes, les amputations et certaines urgences vitales.' },
  { titre: 'Aliénisme',              col: '#6B4A78', desc: "L'aliénisme est la médecine des troubles de l'esprit. L'aliéniste accompagne les personnes souffrant de mélancolie, d'hystérie, de traumatismes, de dépendances ou d'autres affections mentales connues de l'époque." },
  { titre: 'Plantes Médicinales',    col: '#A8B991', desc: 'Le spécialiste des plantes médicinales étudie et prépare les remèdes naturels du dispensaire. Il utilise les propriétés thérapeutiques des plantes pour soulager les douleurs, combattre certaines maladies et favoriser la guérison.' },
  { titre: 'Traumatologie',          col: '#786030', desc: 'Le traumatologue prend en charge les blessures causées par les accidents, les chutes, les combats ou les activités dangereuses. Il traite les fractures, luxations, entorses et autres traumatismes physiques.' },
  { titre: 'Hygiène et Santé Publique', col: '#AAB9C6', desc: 'Cette spécialité veille à la prévention des maladies et à la protection de la population. Elle surveille les risques sanitaires, les épidémies, la salubrité des lieux publics et les mesures d\'hygiène au sein des dispensaires.' },
  { titre: 'Obstétrique',            col: '#7A5878', desc: "L'obstétricien accompagne les femmes durant la grossesse, l'accouchement et les suites de couches. Il veille à la santé de la mère et de l'enfant avant, pendant et après la naissance." },
  { titre: 'Ophtalmologie',          col: '#4A6878', desc: "L'ophtalmologiste est spécialisé dans les maladies et blessures des yeux. Il traite les troubles de la vue, les infections oculaires ainsi que les traumatismes affectant la vision." },
  { titre: 'Dentisterie',            col: '#8B7040', desc: 'Le dentiste soigne les affections de la bouche et des dents. Il traite les douleurs dentaires, les infections, les extractions et veille à la bonne santé bucco-dentaire des habitants.' },
] as const;

function SpecialitesDocument() {
  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '36px 20px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderBottom: pos.includes('bottom') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderLeft: pos.includes('left') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderRight: pos.includes('right') ? '2px solid rgba(209,183,124,0.45)' : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.3em', marginBottom: 10 }}>✦ CATALOGUE MÉDICAL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 8px', letterSpacing: '0.05em' }}>Spécialités Proposées</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>Disciplines médicales du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: '0 auto 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.2em' }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
      </div>

      {/* Liste des spécialités */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 36 }}>
        {SPECIALITES_LIST.map(s => (
          <div key={s.titre} style={{ background: T.paper, border: `1px solid ${s.col}40`, borderLeft: `4px solid ${s.col}`, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, background: `${s.col}18`, border: `2px solid ${s.col}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 18, color: s.col }}>✦</span>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 14, color: s.col, letterSpacing: '0.22em', marginBottom: 2 }}>SPÉCIALITÉ</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{s.titre}</div>
              </div>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${s.col}50, transparent)`, marginLeft: 8 }} />
            </div>
            <p style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.9, margin: 0, textAlign: 'justify' }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Note du Dispensaire */}
      <div style={{ background: T.card, border: `1px solid rgba(209,183,124,0.35)`, borderLeft: `4px solid ${T.gold}`, padding: '24px 28px' }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, letterSpacing: '0.22em', background: 'rgba(209,183,124,0.10)', padding: '5px 14px', border: `1px solid rgba(209,183,124,0.30)`, display: 'inline-block', marginBottom: 16 }}>NOTE DU DISPENSAIRE</div>
        <p style={{ fontFamily: BODY, fontSize: 16, color: T.text, lineHeight: 1.9, margin: 0, textAlign: 'justify' }}>
          Un médecin peut posséder plusieurs spécialités. Toutefois, chaque praticien demeure avant tout un serviteur de la médecine et se doit d'apporter assistance à toute personne nécessitant des soins, quelle que soit la nature de son mal.
        </p>
      </div>
    </div>
  );
}

const PEC = '#D1B77C';
const PEC_LIGHT = '#C02020';

function ProtocoleEpidemieDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const pecBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PEC}40`, borderTop: `3px solid ${PEC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const pecTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const pecSection = (label: string, content: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${PEC}30`, borderLeft: `4px solid ${PEC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );
  const pecTriage = (col: string, label: string, items: string[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderTop: `3px solid ${col}`, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: col, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      <RegList items={items} />
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${PEC}60`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${PEC}80` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${PEC}80` : 'none', borderLeft: pos.includes('left') ? `2px solid ${PEC}80` : 'none', borderRight: pos.includes('right') ? `2px solid ${PEC}80` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ PROTOCOLE SANITAIRE — URGENCE MAXIMALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: PEC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>⚠️ Gestion d&apos;une Épidémie</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>À l&apos;usage du personnel médical du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${PEC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? PEC_LIGHT : T.border}`, background: version === v ? `${PEC}40` : 'transparent', color: version === v ? PEC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Une épidémie est déclarée lorsqu&apos;une maladie contagieuse dépasse le stade du simple Risque Sanitaire et menace directement une partie importante de la population.</RegPara>
            <RegPara>La mission de l&apos;ORDRES DES MÉDECINS n&apos;est plus uniquement de soigner les malades, mais également de limiter la propagation de la maladie, protéger les populations saines et maintenir l&apos;organisation des soins.</RegPara>
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Chaque membre de l&apos;ORDRES DES MÉDECINS est tenu d&apos;appliquer strictement le présent protocole jusqu&apos;à la levée officielle de l&apos;Épidémie.</p>
            </RegBlock>
          </RegBlock>

          {/* I. Déclaration */}
          {pecBlock(<>
            {pecTitle('ARTICLE I', "Déclaration de l'Épidémie")}
            <RegPara>L&apos;Épidémie est déclarée uniquement par le Directeur Médical ou son représentant. Elle peut être prononcée lorsque plusieurs des critères suivants sont réunis :</RegPara>
            <RegList items={['multiplication rapide des cas ;', 'propagation dans plusieurs villes ;', 'apparition de nombreux décès ;', 'maladie hautement contagieuse confirmée ;', "incapacité des dispensaires à absorber normalement les nouveaux malades ;", 'risque majeur pour la population.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>La déclaration d&apos;Épidémie entraîne immédiatement l&apos;application des mesures exceptionnelles.</p>
            </RegBlock>
          </>)}

          {/* II. Mise en alerte */}
          {pecBlock(<>
            {pecTitle('ARTICLE II', 'Mise en Alerte des Dispensaires')}
            <RegPara>Dès la déclaration, tous les dispensaires passent en <strong>fonctionnement d&apos;urgence</strong>.</RegPara>
            <RegPara>Le Directeur Médical peut :</RegPara>
            <RegList items={["rappeler l'ensemble du personnel disponible ;", 'suspendre les consultations non urgentes ;', 'ouvrir des salles supplémentaires ;', 'répartir les médecins selon les besoins ;', 'organiser des permanences prolongées.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les urgences vitales demeurent prioritaires.</p>
            </RegBlock>
          </>)}

          {/* III. Triage */}
          {pecBlock(<>
            {pecTitle('ARTICLE III', 'Triage des Patients')}
            <RegPara>Tous les patients sont évalués dès leur arrivée et répartis en trois catégories :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 14 }}>
              {pecTriage('#3A7A3A', '🟢 CAS LÉGERS', ['Soins ambulatoires.', 'Retour au domicile avec surveillance.'])}
              {pecTriage('#8A7A10', '🟡 CAS SUSPECTS', ['Isolement immédiat.', 'Examens complémentaires.', 'Observation quotidienne.'])}
              {pecTriage('#8A1010', '🔴 CAS GRAVES', ['Hospitalisation immédiate.', 'Surveillance permanente.', 'Traitements intensifs selon les moyens disponibles.'])}
            </div>
          </>)}

          {/* IV. Isolement */}
          {pecBlock(<>
            {pecTitle('ARTICLE IV', "Mesures d'Isolement")}
            <RegPara>Les malades contagieux sont installés dans des salles séparées. Ils disposent :</RegPara>
            <RegList items={["d'un lit individuel ;", "d'ustensiles personnels ;", 'de linge réservé ;', "d'une ventilation permanente."]} />
            <div style={{ height: 10 }} />
            <RegList items={['Les visites sont limitées aux cas indispensables.', 'Le personnel limite les déplacements entre les différentes salles.']} />
          </>)}

          {/* V. Hygiène */}
          {pecBlock(<>
            {pecTitle('ARTICLE V', 'Hygiène Renforcée')}
            <RegPara>Pendant toute la durée de l&apos;Épidémie :</RegPara>
            <RegList items={['lavage des mains obligatoire avant et après chaque soin ;', 'désinfection des instruments après chaque patient ;', 'ébullition du linge contaminé ;', 'nettoyage renforcé des locaux ;', 'aération des salles plusieurs fois par jour.']} />
            <div style={{ height: 12 }} />
            <RegPara>Les préparations utilisées comprennent notamment :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {pecSection('EAU VULNÉRAIRE', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Nettoyage des blessures et des surfaces.</p>)}
              {pecSection('ACIDE PHÉNIQUE', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Instruments, pansements, certaines plaies.</p>)}
              {pecSection("TEINTURE D'IODE", <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Désinfection de la peau et des petites plaies.</p>)}
              {pecSection('SOLUTIONS VINAIGRÉES', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Assainissement antiseptique des locaux.</p>)}
            </div>
          </>)}

          {/* VI. Population */}
          {pecBlock(<>
            {pecTitle('ARTICLE VI', 'Information de la Population')}
            <RegPara>Le Directeur Médical informe régulièrement les autorités civiles. La population est invitée à :</RegPara>
            <RegList items={['éviter les rassemblements ;', 'limiter les déplacements inutiles ;', "faire bouillir l'eau ;", 'signaler rapidement tout malade ;', 'respecter les consignes médicales.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les habitants présentant des symptômes doivent consulter immédiatement un dispensaire.</p>
            </RegBlock>
          </>)}

          {/* VII. Surveillance épidémiologique */}
          {pecBlock(<>
            {pecTitle('ARTICLE VII', 'Surveillance Épidémiologique')}
            <RegPara>Chaque dispensaire transmet quotidiennement :</RegPara>
            <RegList items={['nombre de nouveaux cas ;', 'nombre de patients hospitalisés ;', 'nombre de guérisons ;', 'nombre de décès ;', "évolution des symptômes observés."]} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Ces informations permettent de suivre la progression de l&apos;Épidémie.</p>
            </RegBlock>
          </>)}

          {/* VIII. Décès */}
          {pecBlock(<>
            {pecTitle('ARTICLE VIII', 'Gestion des Décès')}
            <RegPara>Lorsqu&apos;un malade succombe :</RegPara>
            <RegList items={['le corps est manipulé avec précaution ;', 'le linge est détruit ou désinfecté ;', 'la chambre est entièrement nettoyée ;', 'les personnes ayant été en contact sont surveillées.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Le respect de ces mesures limite les nouvelles contaminations.</p>
            </RegBlock>
          </>)}

          {/* IX. Levée */}
          {pecBlock(<>
            {pecTitle("ARTICLE IX", "Levée de l'Épidémie")}
            <RegPara>Le Directeur Médical peut déclarer la fin de l&apos;Épidémie lorsque :</RegPara>
            <RegList items={["aucun nouveau cas n'est recensé depuis plusieurs jours ;", 'les derniers malades sont guéris ou stabilisés ;', "aucun nouveau foyer n'apparaît ;", 'la propagation est considérée comme maîtrisée.']} />
            <RegPara>Les dispensaires retrouvent alors progressivement leur fonctionnement habituel.</RegPara>
          </>)}

          {/* X. Devoirs */}
          {pecBlock(<>
            {pecTitle('ARTICLE X', 'Devoirs du Personnel Médical')}
            <RegPara>Pendant toute la durée de l&apos;Épidémie, chaque membre de l&apos;ORDRES DES MÉDECINS doit :</RegPara>
            <RegList items={['respecter strictement les protocoles sanitaires ;', 'protéger les autres patients ;', 'transmettre quotidiennement les informations médicales ;', 'rassurer la population tout en restant honnête sur la situation ;', 'poursuivre les soins avec calme, discipline et impartialité.']} />
            <RegCitation text="Le médecin demeure un exemple de sang-froid au milieu de la crise." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Une épidémie constitue l&apos;une des plus grandes épreuves que puisse connaître une communauté. La discipline, l&apos;organisation, l&apos;antisepsie, l&apos;isolement des malades et la coopération entre les dispensaires permettent souvent de sauver davantage de vies que les traitements eux-mêmes.</RegPara>
            <RegCitation text="La vigilance, la science et l'humanité demeurent les premières armes contre la contagion." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Déclaration */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>DÉCLARATION DE L&apos;ÉPIDÉMIE</div>
            <RegPara>Une <strong>Épidémie</strong> est déclarée par le <strong>Directeur Médical</strong> lorsque :</RegPara>
            <RegList items={['les cas augmentent rapidement ;', 'plusieurs villes sont touchées ;', 'la maladie est fortement contagieuse ;', 'les décès se multiplient ;', 'les dispensaires sont fortement sollicités.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Des mesures exceptionnelles sont immédiatement appliquées.</p>
            </RegBlock>
          </RegBlock>

          {/* Organisation & Triage */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ORGANISATION ET TRIAGE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pecSection('FONCTIONNEMENT D\'URGENCE', <>
                <RegList items={["Rappel de tout le personnel disponible.", "Suspension des consultations non urgentes.", "Ouverture de salles supplémentaires.", "Répartition des médecins selon les besoins.", "Permanences prolongées."]} />
                <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Les urgences vitales restent prioritaires.</p>
              </>)}
              <div>
                {pecTriage('#3A7A3A', '🟢 CAS LÉGERS', ['Soins ambulatoires.', 'Retour au domicile avec surveillance.'])}
                {pecTriage('#8A7A10', '🟡 CAS SUSPECTS', ['Isolement immédiat.', 'Observation médicale quotidienne.'])}
                {pecTriage('#8A1010', '🔴 CAS GRAVES', ['Hospitalisation.', 'Surveillance permanente.', 'Traitements intensifs selon les ressources disponibles.'])}
              </div>
            </div>
          </RegBlock>

          {/* Isolement & Hygiène */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ISOLEMENT ET HYGIÈNE RENFORCÉE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pecSection('ISOLEMENT DES CONTAGIEUX', <RegList items={['Salle dédiée.', 'Lit individuel.', 'Linge réservé.', 'Ustensiles personnels.', 'Visites limitées.']} />)}
              {pecSection('HYGIÈNE OBLIGATOIRE', <RegList items={['Lavage des mains avant et après chaque soin.', 'Désinfection après chaque patient.', 'Stérilisation des instruments.', 'Ébullition du linge contaminé.', 'Nettoyage quotidien des locaux.', 'Aération régulière.']} />)}
              {pecSection('PRODUITS UTILISÉS', <RegList items={['Eau Vulnéraire.', 'Acide phénique.', "Teinture d'iode.", 'Solutions vinaigrées antiseptiques.']} />)}
            </div>
          </RegBlock>

          {/* Population & Surveillance */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>PROTECTION ET SURVEILLANCE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pecSection('RECOMMANDATIONS POPULATION', <RegList items={['Éviter les rassemblements.', 'Limiter les déplacements inutiles.', "Faire bouillir l'eau.", 'Consulter rapidement en cas de symptômes.', 'Respecter les mesures sanitaires.']} />)}
              {pecSection('RAPPORT QUOTIDIEN DISPENSAIRE', <RegList items={['Nouveaux cas.', 'Hospitalisations.', 'Guérisons.', 'Décès.', 'Évolution de la maladie.']} />)}
              {pecSection('GESTION DES DÉCÈS', <RegList items={['Manipulation prudente du corps.', 'Désinfection complète de la chambre.', 'Destruction ou désinfection du linge.', 'Surveillance des personnes en contact.']} />)}
            </div>
          </RegBlock>

          {/* Levée */}
          {pecBlock(<>
            {pecTitle("FIN DE L'ÉPIDÉMIE")}
            <RegList items={["Aucun nouveau cas depuis plusieurs jours.", "Les derniers malades sont guéris ou stabilisés.", "Aucun nouveau foyer n'est découvert.", "La propagation est maîtrisée."]} />
            <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les dispensaires reprennent progressivement leur fonctionnement habituel.</p>
          </>)}

          {/* À retenir */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={["Une Épidémie constitue une urgence sanitaire majeure.", "Le triage, l'isolement et l'organisation des dispensaires sont prioritaires.", "L'antisepsie, la désinfection et l'hygiène limitent la propagation.", 'Le personnel médical protège autant la population que les malades.', "Une surveillance quotidienne permet de suivre l'évolution de la crise.", "L'Épidémie n'est levée que lorsque la propagation est totalement maîtrisée."]} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

const PSC = '#6A1010';
const PSC_LIGHT = '#B83030';

function ProtocoleSanitaireDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const pscBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PSC}40`, borderTop: `3px solid ${PSC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const pscTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const pscSection = (label: string, content: React.ReactNode, accent?: string) => (
    <div style={{ background: T.card, border: `1px solid ${accent ?? PSC}30`, borderLeft: `4px solid ${accent ?? PSC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: accent ?? PSC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );
  const pscAlert = (col: string, label: string, items: string[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderTop: `3px solid ${col}`, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 14, color: col, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      <RegList items={items} />
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${PSC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${PSC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${PSC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${PSC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${PSC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ PROTOCOLE SANITAIRE OFFICIEL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: PSC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🛡️ Gestion d&apos;un Risque Sanitaire</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>À l&apos;usage du personnel médical du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${PSC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? PSC_LIGHT : T.border}`, background: version === v ? `${PSC}30` : 'transparent', color: version === v ? PSC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Toute maladie inhabituelle ou augmentation soudaine de cas similaires doit être considérée avec la plus grande prudence. Avant qu&apos;une véritable épidémie ne s&apos;installe, il existe une période durant laquelle une intervention rapide peut encore empêcher la propagation de la maladie.</RegPara>
            <RegPara>Le présent protocole établit les mesures que doivent appliquer les membres de l&apos;ORDRES DES MÉDECINS lorsqu&apos;un <strong>Risque Sanitaire</strong> est déclaré. Son objectif est de protéger la population, préserver le personnel soignant et contenir la maladie avant qu&apos;elle ne devienne une menace pour l&apos;ensemble des comtés.</RegPara>
          </RegBlock>

          {/* I. Déclenchement */}
          {pscBlock(<>
            {pscTitle('ARTICLE I', 'Déclenchement du Risque Sanitaire')}
            <RegPara>Un Risque Sanitaire peut être déclaré par le Directeur Médical ou son représentant lorsqu&apos;au moins l&apos;une des situations suivantes est constatée :</RegPara>
            <RegList items={['apparition de plusieurs patients présentant les mêmes symptômes dans une courte période ;', "découverte d'une maladie inhabituelle ou inconnue ;", "suspicion de contamination d'un puits, d'une rivière ou d'une réserve d'eau ;", 'augmentation anormale des cas de fièvre, diarrhée, toux ou infections respiratoires ;', "présence d'une maladie transmissible chez les animaux pouvant atteindre l'homme ;", "suspicion d'intoxication alimentaire touchant plusieurs personnes."]} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>La déclaration d&apos;un Risque Sanitaire ne signifie pas qu&apos;une épidémie est installée, mais qu&apos;une surveillance renforcée devient nécessaire.</p>
            </RegBlock>
          </>)}

          {/* II. Mesures immédiates */}
          {pscBlock(<>
            {pscTitle('ARTICLE II', 'Mesures Immédiates')}
            <RegPara>Dès la déclaration du Risque Sanitaire, chaque dispensaire applique les mesures suivantes :</RegPara>
            <RegList items={["ouverture d'un registre sanitaire spécifique ;", 'recensement quotidien des nouveaux cas ;', 'examen systématique des personnes présentant des symptômes similaires ;', 'désinfection renforcée des salles de consultation ;', 'stérilisation des instruments après chaque utilisation ;', 'renouvellement plus fréquent du linge médical.']} />
            <div style={{ height: 10 }} />
            <RegPara>Le responsable du dispensaire informe quotidiennement la Direction Médicale de l&apos;évolution de la situation.</RegPara>
          </>)}

          {/* III. Surveillance patients */}
          {pscBlock(<>
            {pscTitle('ARTICLE III', 'Surveillance des Patients')}
            <RegPara>Chaque malade fait l&apos;objet d&apos;un suivi régulier comprenant :</RegPara>
            <RegList items={['prise de température ;', 'contrôle du pouls ;', 'observation de la respiration ;', 'évolution des symptômes ;', "recherche d'autres cas dans son entourage."]} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Tout aggravement doit être signalé immédiatement.</p>
            </RegBlock>
          </>)}

          {/* IV. Hygiène */}
          {pscBlock(<>
            {pscTitle('ARTICLE IV', "Mesures d'Hygiène")}
            <RegPara>Afin de limiter toute propagation, le personnel applique rigoureusement les règles suivantes :</RegPara>
            <RegList items={['lavage des mains avant et après chaque soin ;', 'utilisation de linge propre pour chaque patient ;', 'désinfection des tables, instruments et surfaces ;', 'destruction ou ébullition du linge contaminé ;', 'aération complète des locaux plusieurs fois par jour ;', "entretien quotidien des salles d'attente."]} />
            <div style={{ height: 12 }} />
            <RegPara>Les préparations antiseptiques du dispensaire sont utilisées selon les besoins :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {pscSection('EAU VULNÉRAIRE', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Nettoyage des blessures et des surfaces.</p>)}
              {pscSection('ACIDE PHÉNIQUE', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Instruments, pansements, certaines plaies.</p>)}
              {pscSection("TEINTURE D'IODE", <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Désinfection de la peau et des petites plaies.</p>)}
              {pscSection('SOLUTIONS VINAIGRÉES', <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, margin: 0 }}>Assainissement antiseptique des locaux.</p>)}
            </div>
          </>)}

          {/* V. Population */}
          {pscBlock(<>
            {pscTitle('ARTICLE V', 'Information de la Population')}
            <RegPara>Lorsque le Risque Sanitaire est déclaré, la population est invitée à :</RegPara>
            <RegList items={["faire bouillir l'eau destinée à la consommation ;", 'éviter les contacts rapprochés avec les personnes malades ;', 'maintenir les habitations propres et aérées ;', 'signaler rapidement tout nouveau malade au dispensaire ;', 'ne pas partager les ustensiles de repas avec une personne atteinte ;', 'éviter les rassemblements inutiles lorsque la maladie paraît contagieuse.']} />
            <RegCitation text="La prévention demeure le meilleur traitement." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* VI. Organisation */}
          {pscBlock(<>
            {pscTitle('ARTICLE VI', 'Organisation des Dispensaires')}
            <RegPara>Les dispensaires restent ouverts mais adaptent leur fonctionnement. Le Directeur Médical peut décider :</RegPara>
            <RegList items={["d'augmenter les permanences ;", 'de répartir les médecins entre plusieurs établissements ;', 'de reporter les consultations non urgentes ;', "de réserver une salle aux patients suspects."]} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les soins urgents demeurent prioritaires.</p>
            </RegBlock>
          </>)}

          {/* VII. Évolution */}
          {pscBlock(<>
            {pscTitle('ARTICLE VII', 'Évolution du Risque')}
            <RegPara>Le Risque Sanitaire fait l&apos;objet d&apos;une réévaluation quotidienne. Trois situations sont possibles :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 14 }}>
              {pscAlert('#3A7A3A', '🟢 AMÉLIORATION', ['Diminution progressive des nouveaux cas.', 'Absence de propagation.', 'Retour progressif au fonctionnement habituel.'])}
              {pscAlert('#8A7A10', '🟡 STABILISATION', ['Nombre de cas inchangé.', 'Maintien des mesures de surveillance.', 'Poursuite des investigations.'])}
              {pscAlert('#8A1010', '🔴 AGGRAVATION', ["Lorsque les cas augmentent rapidement, que plusieurs villes sont touchées ou que la mortalité s'élève de manière inhabituelle, le Directeur Médical peut déclarer un Risque Sanitaire Critique, première étape précédant une éventuelle déclaration d'épidémie."])}
            </div>
          </>)}

          {/* VIII. Levée */}
          {pscBlock(<>
            {pscTitle('ARTICLE VIII', 'Levée du Risque Sanitaire')}
            <RegPara>Le Directeur Médical peut lever le Risque Sanitaire lorsque :</RegPara>
            <RegList items={["aucun nouveau cas n'est observé depuis plusieurs jours ;", "l'origine de la contamination est identifiée et maîtrisée ;", 'les malades évoluent favorablement ;', "aucun foyer secondaire n'est découvert."]} />
            <RegPara>Les registres sanitaires sont alors archivés afin de conserver une trace de l&apos;événement.</RegPara>
          </>)}

          {/* IX. Devoirs */}
          {pscBlock(<>
            {pscTitle('ARTICLE IX', 'Devoirs du Personnel Médical')}
            <RegPara>Chaque membre de l&apos;ORDRES DES MÉDECINS est tenu de :</RegPara>
            <RegList items={['signaler tout cas suspect ;', "appliquer rigoureusement les règles d'hygiène ;", 'rassurer la population sans minimiser le danger ;', 'respecter les décisions de la Direction Médicale ;', 'transmettre quotidiennement les informations nécessaires au suivi de la situation.']} />
            <RegCitation text="La discipline, la vigilance et la coopération de tous permettent souvent d'éviter qu'un simple Risque Sanitaire ne devienne une véritable épidémie." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le Risque Sanitaire constitue la première ligne de défense de la santé publique. Une réaction rapide, une surveillance attentive, une hygiène irréprochable et une bonne coordination entre les dispensaires permettent bien souvent d&apos;interrompre la propagation d&apos;une maladie avant qu&apos;elle ne menace l&apos;ensemble de la population.</RegPara>
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Déclenchement */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>DÉCLENCHEMENT</div>
            <RegPara>Un <strong>Risque Sanitaire</strong> peut être déclaré lorsqu&apos;apparaissent :</RegPara>
            <RegList items={['plusieurs malades présentant les mêmes symptômes ;', "une maladie inhabituelle ou inconnue ;", "une suspicion de contamination de l'eau ou des aliments ;", 'une hausse importante des cas de fièvre, diarrhée ou toux ;', "une maladie animale transmissible à l'Homme ;", 'une intoxication alimentaire touchant plusieurs personnes.']} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Le Risque Sanitaire n&apos;est pas encore une épidémie, mais une période de surveillance renforcée.</p>
            </RegBlock>
          </RegBlock>

          {/* Mesures & Surveillance */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>MESURES IMMÉDIATES ET SURVEILLANCE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('LES DISPENSAIRES DOIVENT', <RegList items={["Ouvrir un registre sanitaire.", "Recenser chaque nouveau cas.", "Examiner systématiquement les malades suspects.", "Renforcer la désinfection des locaux.", "Stériliser les instruments après chaque utilisation.", "Renouveler plus fréquemment le linge médical."]} />)}
              {pscSection('SUIVI DE CHAQUE MALADE', <>
                <RegList items={['Température.', 'Pouls.', 'Respiration.', 'Évolution des symptômes.', "Recherche de nouveaux cas dans son entourage."]} />
                <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Tout aggravement est signalé immédiatement.</p>
              </>)}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>La Direction Médicale est informée quotidiennement.</p>
          </RegBlock>

          {/* Hygiène */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>HYGIÈNE OBLIGATOIRE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('MESURES DU PERSONNEL', <RegList items={['Lavage des mains avant et après chaque soin.', 'Linge propre pour chaque patient.', 'Désinfection des surfaces et instruments.', 'Ébullition ou destruction du linge contaminé.', 'Aération régulière des locaux.']} />)}
              {pscSection('PRÉPARATIONS UTILISÉES', <RegList items={['Eau Vulnéraire.', 'Acide phénique.', "Teinture d'iode.", 'Solutions vinaigrées antiseptiques.']} />)}
            </div>
          </RegBlock>

          {/* Population & Organisation */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>POPULATION ET ORGANISATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('LES HABITANTS SONT INVITÉS À', <RegList items={["Faire bouillir l'eau.", 'Maintenir leurs habitations propres.', 'Éviter les contacts avec les personnes malades.', 'Signaler rapidement tout nouveau cas.', 'Ne pas partager les ustensiles.', 'Limiter les rassemblements si nécessaire.']} />)}
              {pscSection('LE DIRECTEUR MÉDICAL PEUT', <RegList items={["Augmenter les permanences.", "Répartir les médecins entre les dispensaires.", "Reporter les consultations non urgentes.", "Ouvrir une salle réservée aux cas suspects."]} />)}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les urgences restent toujours prioritaires.</p>
          </RegBlock>

          {/* Évolution */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ÉVOLUTION DU RISQUE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {pscAlert('#3A7A3A', '🟢 AMÉLIORATION', ['Baisse du nombre de cas.', 'Absence de propagation.', 'Retour progressif au fonctionnement normal.'])}
              {pscAlert('#8A7A10', '🟡 STABILISATION', ['Nombre de cas stable.', 'Maintien de la surveillance.', 'Poursuite des investigations.'])}
              {pscAlert('#8A1010', '🔴 AGGRAVATION → RISQUE CRITIQUE', ['Cas qui augmentent rapidement.', 'Plusieurs villes touchées.', 'Mortalité en hausse.', 'Le Directeur Médical peut déclarer un Risque Sanitaire Critique, étape précédant une éventuelle Épidémie.'])}
            </div>
          </div>

          {/* Levée */}
          {pscBlock(<>
            {pscTitle('LEVÉE DU RISQUE SANITAIRE')}
            <RegList items={["Aucun nouveau cas depuis plusieurs jours.", "La source de contamination est maîtrisée.", "Les malades évoluent favorablement.", "Aucun nouveau foyer n'apparaît."]} />
            <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les registres sont ensuite archivés.</p>
          </>)}

          {/* À retenir */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 14, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={["Le Risque Sanitaire est une phase de vigilance, pas encore une épidémie.", 'Tous les cas suspects doivent être signalés et surveillés.', "L'hygiène, la désinfection et l'aération sont les premières protections.", 'Les dispensaires restent ouverts mais renforcent leur organisation.', "Si la maladie continue de se propager, le Risque Sanitaire Critique peut être déclaré avant le passage au Protocole Épidémique."]} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

type ShelfItem = { id: string; icon: string; t1: string; t2?: string; col?: string };
const SHELF_ORDER = ['Doctrine & Enseignement', 'Guides & Manuels', 'Pharmacie', 'Chirurgie & Antisepsie', 'Obstétrique & Physiologie', 'Maladies & Traumatismes'];
const BUILTIN_SHELVES: { label: string; items: ShelfItem[] }[] = [
  { label: 'Documents Officiels', items: [
    { id: 'reglement-interne',     icon: '⚖',  t1: 'Règlement',      t2: 'Interne',         col: 'rouge' },
    { id: 'serment-hippocrate',    icon: '⚕',  t1: 'Serment',        t2: "d'Hippocrate",    col: 'rouge' },
    { id: 'specialites-proposees', icon: '✦',  t1: 'Spécialités',    t2: 'Proposées',       col: 'rouge' },
    { id: 'protocole-sanitaire',   icon: '🛡️', t1: 'Protocole',      t2: 'Sanitaire',       col: 'rouge' },
    { id: 'protocole-epidemie',    icon: '⚠️', t1: 'Protocole',      t2: 'Épidémie',        col: 'rouge' },
  ]},
  ...SHELF_ORDER.map(label => ({ label, items: COURS.filter(c => c.shelf === label).map(c => ({ id: c.id, icon: c.icon, t1: c.t1, t2: c.t2, col: c.col })) })),
];
const COURS_BY_ID = new Map(COURS.map(c => [c.id, c]));
const OFFICIAL_IDS = ['reglement-interne', 'serment-hippocrate', 'specialites-proposees', 'protocole-sanitaire', 'protocole-epidemie'];

const BUILTIN_IDS = new Set(BUILTIN_SHELVES.flatMap(s => s.items.map(i => i.id)));

const BOOK_COLS: Record<string, { bg: string; spine: string; border: string }> = {
  rouge:  { bg: 'linear-gradient(160deg,#2e0a0a,#1e0404 55%,#280808)', spine: '#8C2828', border: '#4a0e0e' },
  vert:   { bg: 'linear-gradient(160deg,#0c2a0a,#071904 55%,#0a2208)', spine: '#3CB83A', border: '#164e14' },
  bleu:   { bg: 'linear-gradient(160deg,#060d22,#030916 55%,#060b1c)', spine: '#3870E0', border: '#101e58' },
  violet: { bg: 'linear-gradient(160deg,#16082a,#0c041c 55%,#120622)', spine: '#9A3CD0', border: '#380e52' },
  marron: { bg: 'linear-gradient(160deg,#38160a,#240e04 55%,#2e1208)', spine: '#C87030', border: '#5e2c10' },
};
const BOOK_DEFAULT = { bg: 'linear-gradient(160deg,#160c08,#0e0804 55%,#120a06)', spine: '#3a2010', border: '#214452' };

function Book({ icon, t1, t2, col, selected, onClick }: { icon: string; t1: string; t2?: string; col?: string; selected: boolean; onClick: () => void }) {
  const c = col ? (BOOK_COLS[col] ?? BOOK_DEFAULT) : BOOK_DEFAULT;
  return (
    <div
      className="bib-book"
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      style={{
        width: 152, minHeight: 118, flexShrink: 0, position: 'relative',
        background: c.bg,
        border: selected ? `1.5px solid ${T.gold}` : `1px solid ${c.border}`,
        borderLeft: selected ? `4px solid ${T.gold}` : `4px solid ${c.spine}`,
        borderRadius: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 9px 10px 13px',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 1px ${T.gold}, 0 4px 16px rgba(209,183,124,0.18)` : '1px 2px 6px rgba(0,0,0,0.7)',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(to right, ${c.spine}bb, ${c.spine}66, transparent)`, borderRadius: '2px 0 0 2px' }} />
      <div style={{ position: 'absolute', top: 4, left: 8,  width: 8, height: 8, borderTop: `1px solid ${c.border}`, borderLeft:   `1px solid ${c.border}` }} />
      <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: `1px solid ${c.border}`, borderRight:  `1px solid ${c.border}` }} />
      <div style={{ position: 'absolute', bottom: 4, left: 8,  width: 8, height: 8, borderBottom: `1px solid ${c.border}`, borderLeft:  `1px solid ${c.border}` }} />
      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderBottom: `1px solid ${c.border}`, borderRight: `1px solid ${c.border}` }} />
      <div style={{ position: 'absolute', right: -4, top: 5, bottom: 5, width: 4, background: 'repeating-linear-gradient(180deg,#d4c4a0,#d4c4a0 1px,#b4a480 1px,#b4a480 2px)', borderRadius: '0 1px 1px 0', opacity: 0.35 }} />
      <div style={{ width: '100%', padding: '8px 10px', background: 'linear-gradient(168deg,#7a5414,#4e3208 30%,#6a4810 55%,#3e2608 75%,#5a3e0e 100%)', border: '1.5px solid #8a5e18', position: 'relative', textAlign: 'center', boxShadow: 'inset 0 2px 4px rgba(220,170,65,0.28),inset 0 -2px 4px rgba(74,62,32,0.14),0 2px 5px rgba(74,62,32,0.14)' }}>
        <div style={{ position: 'absolute', inset: 3, border: '1px solid rgba(160,110,25,0.3)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 3, left: 5, right: 5, height: 1, background: 'linear-gradient(to right,transparent,rgba(240,200,80,0.5) 25%,rgba(255,220,100,0.65) 50%,rgba(240,200,80,0.5) 75%,transparent)' }} />
        <div style={{ position: 'absolute', top: 3,    left:  3, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#c09020,#6a4208)', boxShadow: '0 1px 2px rgba(74,62,32,0.14)' }} />
        <div style={{ position: 'absolute', top: 3,    right: 3, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#c09020,#6a4208)', boxShadow: '0 1px 2px rgba(74,62,32,0.14)' }} />
        <div style={{ position: 'absolute', bottom: 3, left:  3, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#c09020,#6a4208)', boxShadow: '0 1px 2px rgba(74,62,32,0.14)' }} />
        <div style={{ position: 'absolute', bottom: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,#c09020,#6a4208)', boxShadow: '0 1px 2px rgba(74,62,32,0.14)' }} />
        <span style={{ display: 'block', fontSize: 14, color: '#9a7828', marginBottom: 3, position: 'relative', zIndex: 1 }}>{icon}</span>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 14, color: '#D1B77C', lineHeight: 1.55, textShadow: '0 1px 2px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>{t1}</span>
        {t2 && <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 14, color: '#D1B77C', lineHeight: 1.55, textShadow: '0 1px 2px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>{t2}</span>}
      </div>
    </div>
  );
}

function ShelfRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0 4px' }}>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(20,50,110,0.6))' }} />
        <span style={{ fontFamily: MONO, fontSize: 14, color: '#D1B77C', fontStyle: 'italic', letterSpacing: '0.2em', border: '1px solid rgba(20,50,110,0.6)', background: 'linear-gradient(135deg, #04080e, #02050a)', padding: '3px 16px 4px', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(209,183,124,0.06)' }}>✦ {label} ✦</span>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(to left, transparent, rgba(20,50,110,0.6))' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '2px 0 6px' }}>
        {children}
      </div>
      <div style={{ height: 14, background: 'linear-gradient(to bottom, #060c18, #040910 18%, #030810 50%, #020508 100%)', borderTop: '2px solid rgba(20,50,110,0.6)', margin: '0 -14px', boxShadow: '0 5px 14px rgba(74,62,32,0.14)' }} />
    </div>
  );
}

function BiblioEtageres({
  categories, openCatId, setOpenCatId,
  creatingCat, setCreatingCat, newCatNom, setNewCatNom, newCatIcon, setNewCatIcon, createCategory,
}: {
  categories: BiblioCategorie[];
  openCatId: string | null;
  setOpenCatId: (id: string) => void;
  creatingCat: boolean;
  setCreatingCat: (v: boolean) => void;
  newCatNom: string;
  setNewCatNom: (v: string) => void;
  newCatIcon: string;
  setNewCatIcon: (v: string) => void;
  createCategory: () => void;
}) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('Tout le catalogue');
  const userCats = categories.filter(c => !BUILTIN_IDS.has(c.id));
  const groups = [...BUILTIN_SHELVES.map(s => ({ label: s.label, items: s.items.map(b => ({ id: b.id, title: categories.find(c => c.id === b.id)?.nom ?? [b.t1, b.t2].filter(Boolean).join(' ') })) })), { label: 'Vos documents', items: userCats.map(c => ({ id: c.id, title: c.nom })) }];
  const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = groups.filter(g => section === 'Tout le catalogue' || g.label === section).map(g => ({ ...g, items: g.items.filter(b => normalize(b.title).includes(normalize(query))) })).filter(g => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return <div className="library-catalogue">
    <header className="library-heading">
      <div><p className="library-eyebrow">LITTLE CREEK · COLLECTION MÉDICALE · 1890</p><h1>La Bibliothèque</h1><p className="library-intro">Le savoir au service des soins.</p></div>
      <div className="library-seal"><strong>{total}</strong><span>ouvrages à consulter</span></div>
    </header>
    <div className="library-layout">
      <aside className="library-index"><p className="library-eyebrow">TABLE DES MATIÈRES</p>
        <nav aria-label="Collections de la bibliothèque">{['Tout le catalogue', ...groups.map(g => g.label)].map(label => <button key={label} aria-pressed={section === label} onClick={() => setSection(label)}>{label}<span>{label === 'Tout le catalogue' ? total : groups.find(g => g.label === label)?.items.length}</span></button>)}</nav>
        <p className="library-index-note">Traités, protocoles et enseignements du dispensaire.</p>
      </aside>
      <div className="library-main">
        <div className="library-tools"><label><span>Rechercher un ouvrage</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Titre, discipline, mot-clé…" /></label><button className="library-add" onClick={() => setCreatingCat(!creatingCat)}>Nouvelle catégorie</button></div>
        {creatingCat && <form className="library-create" onSubmit={e => { e.preventDefault(); createCategory(); }}><label>Nom de la catégorie<input value={newCatNom} onChange={e => setNewCatNom(e.target.value)} placeholder="Ex. Pharmacopée" autoFocus required /></label><button type="submit">Créer</button><button type="button" onClick={() => { setCreatingCat(false); setNewCatNom(''); }}>Annuler</button></form>}
        <div aria-live="polite" className="library-count">{visible.reduce((n, g) => n + g.items.length, 0)} ouvrages · {section}</div>
        {!visible.length && <p className="library-empty">Aucun ouvrage dans cette sélection. Essayez un autre titre ou une autre collection.</p>}
        {visible.map(g => <section className="library-section" key={g.label}><div className="library-section-heading"><h2>{g.label}</h2><span>{String(g.items.length).padStart(2, '0')}</span></div><div className="library-grid">{g.items.map(b => <button className="library-volume" title={b.title} aria-label={b.title} key={b.id} onClick={() => setOpenCatId(b.id)}><span className="library-volume-label">DISPENSAIRE DE LITTLE CREEK</span><h3>{(() => { const book = BUILTIN_SHELVES.flatMap(s => s.items).find(i => i.id === b.id); return book ? [book.t1, book.t2].filter(Boolean).join(' ') : b.title; })()}</h3><span className="library-volume-bottom"><span>LC</span><span aria-hidden="true">→</span></span></button>)}</div></section>)}
      </div>
    </div>
  </div>;
}

export default function BibliothequePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<BiblioCategorie[]>(DEFAULT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);

  const [openCatId, setOpenCatId] = useState<string | null>(null);
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatNom, setNewCatNom] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);

  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const [delCatConfirm, setDelCatConfirm] = useState<string | null>(null);

  const [editingDoc, setEditingDoc] = useState<string | null>(null); // 'new' ou id du document
  const [docTitre, setDocTitre] = useState('');
  const [docContenu, setDocContenu] = useState('');

  const [delDocConfirm, setDelDocConfirm] = useState<string | null>(null);

  useEffect(() => {
    load().then(cats => {
      setCategories(cats);
      setHydrated(true);
      const cat = searchParams.get('cat');
      if (cat) setOpenCatId(cat);
    });
  }, []);

  const openCat = categories.find(c => c.id === openCatId) ?? null;

  async function createCategory() {
    const nom = newCatNom.trim();
    if (!nom) return;
    const cat: BiblioCategorie = { id: uid(), nom, icon: newCatIcon || ICONS[0], documents: [] };
    setCategories(prev => [...prev, cat]);
    setNewCatNom(''); setNewCatIcon(ICONS[0]); setCreatingCat(false);
    const result = await createCategoryApi(cat);
    if (result) setCategories(result);
  }

  async function renameCategory(id: string) {
    const nom = renameVal.trim();
    if (!nom) { setRenamingCat(null); return; }
    const icon = categories.find(c => c.id === id)?.icon ?? ICONS[0];
    setCategories(prev => prev.map(c => c.id === id ? { ...c, nom } : c));
    setRenamingCat(null);
    const result = await renameCategoryApi(id, nom, icon);
    if (result) setCategories(result);
  }

  async function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDelCatConfirm(null);
    if (openCatId === id) setOpenCatId(null);
    const result = await deleteCategoryApi(id);
    if (result) setCategories(result);
  }

  function startNewDoc() {
    setDocTitre(''); setDocContenu(''); setEditingDoc('new');
  }

  function startEditDoc(doc: BiblioDoc) {
    setDocTitre(doc.titre); setDocContenu(doc.contenu); setEditingDoc(doc.id);
  }

  async function saveDoc() {
    if (!openCat) return;
    const titre = docTitre.trim();
    if (!titre) return;
    const doc: BiblioDoc = editingDoc === 'new'
      ? { id: uid(), titre, contenu: docContenu, date: rpDate() }
      : { ...(openCat.documents.find(d => d.id === editingDoc) as BiblioDoc), titre, contenu: docContenu };
    setCategories(prev => prev.map(c => {
      if (c.id !== openCat.id) return c;
      const idx = c.documents.findIndex(d => d.id === doc.id);
      return { ...c, documents: idx === -1 ? [...c.documents, doc] : c.documents.map(d => d.id === doc.id ? doc : d) };
    }));
    setEditingDoc(null); setDocTitre(''); setDocContenu('');
    const result = await upsertDocApi(openCat.id, doc);
    if (result) setCategories(result);
  }

  async function removeDoc(id: string) {
    if (!openCat) return;
    setCategories(prev => prev.map(c => c.id === openCat.id ? { ...c, documents: c.documents.filter(d => d.id !== id) } : c));
    setDelDocConfirm(null);
    if (openDocId === id) setOpenDocId(null);
    const result = await deleteDocApi(openCat.id, id);
    if (result) setCategories(result);
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        .biblio-card { transition: border-color 0.2s, transform 0.2s; }
        .biblio-card:hover { border-color: ${T.gold}88 !important; transform: translateY(-2px); }
        .bib-book { transition: transform 0.13s ease, box-shadow 0.13s, border-color 0.13s; }
        .bib-book:hover { transform: scale(1.05) translateY(-5px) !important; box-shadow: 0 10px 24px rgba(74,62,32,0.14), 0 3px 8px rgba(74,62,32,0.14) !important; position: relative; z-index: 3; }
      `}</style>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
        <button
          onClick={() => openCat ? setOpenCatId(null) : router.push('/redm')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          ← RETOUR
        </button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.16em' }}>
          DISPENSAIRE · BIBLIOTHÈQUE{openCat ? ` · ${openCat.nom.toUpperCase()}` : ''}
        </span>
      </div>

      {!openCat && (
        <BiblioEtageres
          categories={categories}
          openCatId={openCatId}
          setOpenCatId={setOpenCatId}
          creatingCat={creatingCat}
          setCreatingCat={setCreatingCat}
          newCatNom={newCatNom}
          setNewCatNom={setNewCatNom}
          newCatIcon={newCatIcon}
          setNewCatIcon={setNewCatIcon}
          createCategory={createCategory}
        />
      )}

      {openCat && openCat.id === 'reglement-interne' && (
        <ReglementDocument />
      )}

      {openCat && openCat.id === 'serment-hippocrate' && (
        <SermentHippocrateDocument />
      )}

      {openCat && openCat.id === 'specialites-proposees' && (
        <SpecialitesDocument />
      )}

      {openCat && openCat.id === 'protocole-sanitaire' && (
        <ProtocoleSanitaireDocument />
      )}

      {openCat && openCat.id === 'protocole-epidemie' && (
        <ProtocoleEpidemieDocument />
      )}

      {openCat && COURS_BY_ID.has(openCat.id) && (
        <CoursDocument cours={COURS_BY_ID.get(openCat.id)!} />
      )}

      {openCat && !OFFICIAL_IDS.includes(openCat.id) && !COURS_BY_ID.has(openCat.id) && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 50, height: 50, background: 'rgba(209,183,124,0.08)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{openCat.icon}</div>
            {renamingCat === openCat.id ? (
              <input
                style={{ ...inp, width: 'auto', flex: '1 1 240px', fontSize: 20, fontFamily: DISPLAY }}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') renameCategory(openCat.id); if (e.key === 'Escape') setRenamingCat(null); }}
              />
            ) : (
              <h1 style={{ fontFamily: DISPLAY, fontSize: 26, color: T.gold, margin: 0 }}>{openCat.nom}</h1>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {renamingCat === openCat.id ? (
                <>
                  <button onClick={() => renameCategory(openCat.id)} style={btnGold}>✔</button>
                  <button onClick={() => setRenamingCat(null)} style={btn}>✕</button>
                </>
              ) : (
                <button onClick={() => { setRenamingCat(openCat.id); setRenameVal(openCat.nom); }} style={btn}>✎ RENOMMER</button>
              )}
              {delCatConfirm === openCat.id ? (
                <>
                  <button onClick={() => removeCategory(openCat.id)} style={btnRed}>SUPPRIMER CETTE CATÉGORIE ?</button>
                  <button onClick={() => setDelCatConfirm(null)} style={btn}>✕</button>
                </>
              ) : (
                <button onClick={() => setDelCatConfirm(openCat.id)} style={btnRed}>✕ SUPPRIMER</button>
              )}
            </div>
          </div>

          {editingDoc && (
            <div style={{ background: T.card, border: `1px solid ${T.gold}`, padding: '20px 22px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>TITRE DU DOCUMENT</label>
                <input style={inp} value={docTitre} onChange={e => setDocTitre(e.target.value)} placeholder="Ex : Règlement intérieur du dispensaire" autoFocus />
              </div>
              <div>
                <label style={lbl}>CONTENU</label>
                <textarea
                  style={{ ...inp, minHeight: 220, fontFamily: BODY, fontSize: 15, lineHeight: 1.7, resize: 'vertical' }}
                  value={docContenu}
                  onChange={e => setDocContenu(e.target.value)}
                  placeholder="Rédigez le contenu du document..."
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveDoc} style={btnGold}>✔ ENREGISTRER</button>
                <button onClick={() => setEditingDoc(null)} style={btn}>ANNULER</button>
              </div>
            </div>
          )}

          {!editingDoc && (
            <button onClick={startNewDoc} style={{ ...btnGold, marginBottom: 20 }}>+ NOUVEAU DOCUMENT</button>
          )}

          {openCat.documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{openCat.icon}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, letterSpacing: '0.06em' }}>AUCUN DOCUMENT DANS CETTE CATÉGORIE</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openCat.documents.map(doc => (
                <div key={doc.id} style={{ background: T.card, border: `1px solid ${T.border}` }}>
                  <button
                    onClick={() => setOpenDocId(openDocId === doc.id ? null : doc.id)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div>
                      <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.text }}>{doc.titre}</div>
                      <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, marginTop: 4, letterSpacing: '0.08em' }}>AJOUTÉ LE {doc.date}</div>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold }}>{openDocId === doc.id ? '▲' : '▼'}</span>
                  </button>
                  {openDocId === doc.id && (
                    <div style={{ borderTop: `1px solid ${T.border}`, padding: '18px 20px' }}>
                      <div style={{ fontFamily: BODY, fontSize: 15, color: T.text, lineHeight: 1.85, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                        {doc.contenu || <span style={{ color: T.muted, fontStyle: 'italic' }}>Aucun contenu rédigé.</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEditDoc(doc)} style={btn}>✎ MODIFIER</button>
                        {delDocConfirm === doc.id ? (
                          <>
                            <button onClick={() => removeDoc(doc.id)} style={btnRed}>SUPPRIMER ?</button>
                            <button onClick={() => setDelDocConfirm(null)} style={btn}>✕</button>
                          </>
                        ) : (
                          <button onClick={() => setDelDocConfirm(doc.id)} style={btnRed}>✕ SUPPRIMER</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
