'use client';

import { useState, useEffect, useRef } from 'react';
import './bibliotheque.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', paper: '#214452', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5', sepia: '#D4B896' };

const LS = 'redm_bibliotheque_v1';

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
  { id: 'guide-herboriste',     nom: "Guide de l'Herboriste",   icon: '🌿', documents: [] },
  { id: 'specialites-proposees', nom: 'Spécialités Proposées',  icon: '✦',  documents: [] },
  { id: 'protocole-sanitaire',   nom: 'Protocole Sanitaire — Gestion d\'un Risque Sanitaire', icon: '🛡️', documents: [] },
  { id: 'protocole-epidemie',    nom: 'Protocole Sanitaire — Gestion d\'une Épidémie', icon: '⚠️', documents: [] },
  { id: 'doctrine-purete',      nom: 'Doctrine de Pureté et de Santé Naturelle', icon: '🌿', documents: [] },
  { id: 'botanique-medicale',   nom: 'Cours de Botanique Médicale — Les Plantes Purificatrices', icon: '🌱', documents: [] },
  { id: 'manuel-infirmiers',    nom: 'Manuel des Soins Infirmiers — Les Fondamentaux et Soins Autorisés', icon: '🩹', documents: [] },
  { id: 'doctrine-cataplasmes', nom: 'Doctrine des Cataplasmes et de leur Usage Thérapeutique', icon: '🫙', documents: [] },
  { id: 'manuel-medecin',       nom: 'Manuel de Médecine à Base de Plantes et de Pharmacologie Médicale', icon: '🩺', documents: [] },
  { id: 'medecine-generale',    nom: 'Cours de Médecine Générale — Traitement des Affections Communes', icon: '📋', documents: [] },
  { id: 'theorie-germes',       nom: 'Cours d\'Instruction Scientifique — La Théorie des Germes et ses Applications', icon: '🔬', documents: [] },
  { id: 'pharmacie-antidouleurs', nom: 'Cours de Pharmacie Médicale — Doctrine des Anti-Douleurs Naturels et Pharmaceutiques', icon: '⚗', documents: [] },
  { id: 'pharmacie-sedatifs',    nom: 'Cours de Pharmacie Médicale — Doctrine des Sédatifs Naturels et Pharmaceutiques',    icon: '💤', documents: [] },
  { id: 'chirurgie-suture',      nom: 'Cours de Chirurgie Médicale — Doctrine des Points de Suture, de l\'Antisepsie et de la Cicatrisation', icon: '🔪', documents: [] },
  { id: 'obstetrique-i',         nom: 'Cours d\'Obstétrique I — Reconnaissance de la grossesse et suivi de la mère', icon: '👶', documents: [] },
  { id: 'obstetrique-ii',        nom: 'Cours d\'Obstétrique II — De l\'Accouchement et des Complications Obstétricales', icon: '🤱', documents: [] },
  { id: 'obstetrique-iii',       nom: 'Cours d\'Obstétrique III — Soins de la Mère et du Nouveau-né', icon: '🍼', documents: [] },
  { id: 'traitement-physio',     nom: 'Cours de Traitement Physiologique — Soins des Fractures et Convalescence', icon: '🦴', documents: [] },
  { id: 'traumatologie',         nom: 'Cours de Traumatologie — Traitement des Traumatismes des Membres', icon: '🩹', documents: [] },
  { id: 'guide-zoonoses',        nom: 'Guide des Zoonoses — Maladies Transmissibles de l\'Animal à l\'Homme', icon: '🐾', documents: [] },
  { id: 'maladies-infantiles',   nom: 'Cours des Maladies Infantiles Courantes — Diagnostic, Traitement et Prévention', icon: '🧒', documents: [] },
  { id: 'fievres-communes',      nom: 'Traité des Fièvres Communes — Diagnostic, Traitement et Prévention', icon: '🌡️', documents: [] },
  { id: 'tuberculose',           nom: 'Cours de Pathologie Médicale — La Tuberculose — Diagnostic, Traitement et Prévention', icon: '🫁', documents: [] },
  { id: 'desinfection-steri',    nom: 'Manuel de Désinfection et de Stérilisation — Selon les principes de Pasteur, Lister et de l\'Antisepsie Moderne', icon: '🔬', documents: [] },
  { id: 'chirurgie-trauma',      nom: 'Cours de Chirurgie Traumatologique — Traitement des Plaies Graves, des Blessures par Balle et des Infections Chirurgicales', icon: '🩻', documents: [] },
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

function load(): BiblioCategorie[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    const cats = Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CATEGORIES;
    return ensureBuiltinCategories(cleanupOldReglementDoc(cats));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function save(d: BiblioCategorie[]) {
  try { localStorage.setItem(LS, JSON.stringify(d)); } catch {}
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 12, letterSpacing: '0.10em', padding: '9px 16px', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.25)', color: T.muted };
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
        <div style={{ fontFamily: MONO, fontSize: 11, color: col, letterSpacing: '0.22em', marginBottom: 2 }}>CHAPITRE {num}</div>
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
      <div style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.12em' }}>— {author}</div>
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
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.3em', marginBottom: 10 }}>✦ DOCUMENT OFFICIEL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 8px', letterSpacing: '0.05em' }}>📜 Règlement Général du Dispensaire</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>Révisé et approuvé en l'an de grâce 1890</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>SOUS LA DIRECTION DU DOCTEUR FRANÇOIS DE MILLET · MÉDECIN FORMÉ À PARIS</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: '0 auto 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.2em' }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
      </div>

      {/* Sommaire */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: 'rgba(209,183,124,0.04)', border: `1px solid rgba(209,183,124,0.18)` }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SOMMAIRE</span>
        {REGLEMENT_CHAPITRES.map(c => (
          <a key={c.num} href={`#chap-${c.num}`} style={{ fontFamily: MONO, fontSize: 12, color: c.col, background: `${c.col}15`, border: `1px solid ${c.col}40`, padding: '4px 12px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.08em' }}>
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
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 6 }}>⚠ AVERTISSEMENT</div>
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
          <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, letterSpacing: '0.18em' }}>—</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.15em' }}>DES MÉDICAMENTS ET PRÉPARATIONS PHARMACEUTIQUES</span>
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
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.16em', marginBottom: 22 }}>DIRECTEUR DU DISPENSAIRE DE LITTLE CREEK</div>
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

/* ── Guide de l'Herboriste (document mis en avant) ── */

const HERBORISTE_CHAPITRES = [
  { num: 'I',   title: 'PLANTES CALMANTES ET SOPORIFIQUES',          icon: '🌙', col: '#6B4A78' },
  { num: 'II',  title: 'PLANTES TONIQUES ET FORTIFIANTES',            icon: '⚡', col: '#786030' },
  { num: 'III', title: 'PLANTES CICATRISANTES ET ANTI-INFECTIEUSES',  icon: '🩹', col: '#A8B991' },
  { num: 'IV',  title: 'PLANTES DIGESTIVES ET DÉPURATIVES',           icon: '🌾', col: '#AAB9C6' },
  { num: 'V',   title: 'SUBSTANCES DANGEREUSES ET USAGES PROHIBÉS',   icon: '☠',  col: '#EADCB9' },
] as const;

function PlantFiche({ nom, latin, icon, apparence, vertus, preparation, danger }: { nom: string; latin?: string; icon: string; apparence: string; vertus: string; preparation: string; danger?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h3 style={{ fontFamily: DISPLAY, fontSize: 19, color: T.gold, margin: 0 }}>{nom}</h3>
        {latin && <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, fontStyle: 'italic', letterSpacing: '0.05em' }}>{latin}</span>}
      </div>
      <RegPara><strong style={{ color: T.sepia }}>Apparence — </strong>{apparence}</RegPara>
      <RegPara><strong style={{ color: T.sepia }}>Vertus — </strong>{vertus}</RegPara>
      <RegPara><strong style={{ color: T.sepia }}>Préparation — </strong>{preparation}</RegPara>
      {danger && (
        <div style={{ background: 'rgba(139,64,64,0.10)', border: '1px solid rgba(139,64,64,0.30)', padding: '12px 16px', marginTop: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 6 }}>⚠ PRÉCAUTION</div>
          <RegPara>{danger}</RegPara>
        </div>
      )}
    </div>
  );
}

function GuideHerboristeDocument() {
  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '36px 20px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderBottom: pos.includes('bottom') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderLeft: pos.includes('left') ? '2px solid rgba(209,183,124,0.45)' : 'none', borderRight: pos.includes('right') ? '2px solid rgba(209,183,124,0.45)' : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.3em', marginBottom: 10 }}>✦ MANUEL DE BOTANIQUE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 8px', letterSpacing: '0.05em' }}>🌿 Guide de l'Herboriste</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>Plantes, racines et champignons du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>RECUEIL ÉTABLI PAR MÈRE AGATHE VOCLAIN · HERBORISTE DU DISPENSAIRE</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: '0 auto 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.2em' }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
      </div>

      {/* Sommaire */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: 'rgba(209,183,124,0.04)', border: `1px solid rgba(209,183,124,0.18)` }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SOMMAIRE</span>
        {HERBORISTE_CHAPITRES.map(c => (
          <a key={c.num} href={`#herb-chap-${c.num}`} style={{ fontFamily: MONO, fontSize: 12, color: c.col, background: `${c.col}15`, border: `1px solid ${c.col}40`, padding: '4px 12px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.08em' }}>
            {c.num}. {c.title}
          </a>
        ))}
      </div>

      {/* Avant-propos */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, letterSpacing: '0.22em', background: 'rgba(209,183,124,0.10)', padding: '6px 16px', border: `1px solid rgba(209,183,124,0.30)` }}>AVANT-PROPOS</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(209,183,124,0.25)' }} />
        </div>
        <RegBlock col="rgba(209,183,124,0.35)">
          <RegPara>Conformément au Chapitre V du Règlement Général, tout médecin, infirmier ou apprenti du dispensaire doit posséder des connaissances suffisantes en botanique médicale.</RegPara>
          <RegPara>Le présent guide recense les plantes, racines et champignons les plus couramment employés ou rencontrés sur le territoire de West Elizabeth : leur apparence, leurs vertus reconnues, leur mode de préparation, ainsi que les précautions à observer.</RegPara>
          <RegPara>Il ne remplace en aucun cas le jugement du médecin. En cas de doute sur l'identification d'une plante ou sur le dosage d'une préparation, mieux vaut s'abstenir que risquer la santé d'un patient.</RegPara>
        </RegBlock>
      </div>

      {/* Chapitre I — Plantes calmantes et soporifiques */}
      <div id="herb-chap-I" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${HERBORISTE_CHAPITRES[0].col}40`, borderTop: `3px solid ${HERBORISTE_CHAPITRES[0].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...HERBORISTE_CHAPITRES[0]} />
        <PlantFiche
          nom="Camomille"
          latin="Matricaria chamomilla"
          icon="🌼"
          apparence="Petites fleurs blanches au cœur jaune doré, semblables à de modestes marguerites, poussant en abondance le long des chemins et dans les prés ensoleillés."
          vertus="L'infusion de camomille apaise les nerfs, favorise un sommeil profond et soulage les maux d'estomac, les crampes et les inflammations légères. En compresse tiède, elle calme également les yeux irrités."
          preparation="Infuser une poignée de fleurs séchées dans l'eau bouillante pendant dix minutes ; à boire le soir ou après les repas."
        />
        <PlantFiche
          nom="Pavot somnifère"
          latin="Papaver somniferum"
          icon="🌺"
          apparence="Grande fleur aux pétales fragiles, rouges ou mauve pâle, dont la capsule renferme un suc laiteux qui durcit et brunit à l'air libre."
          vertus="Le lait de pavot séché constitue le plus puissant calmant de la douleur connu du dispensaire : il endort la souffrance, calme la toux violente et procure un sommeil profond aux patients les plus éprouvés."
          preparation="Récolte du suc par incision des capsules encore vertes, séchage à l'ombre, puis dilution en teinture (laudanum) administrée à la goutte, sous contrôle strict d'un médecin."
          danger="Conformément au Règlement Général (Chapitre V), l'usage du lait de pavot doit rester exceptionnel et toujours supervisé. Une dose excessive ralentit la respiration jusqu'à l'arrêt et peut provoquer une dépendance irrémédiable."
        />
        <PlantFiche
          nom="Perce-Neige Violet"
          icon="🔔"
          apparence="Petite fleur d'hiver aux clochettes violacées, poussant à l'ombre des rochers dans les hauteurs enneigées de West Elizabeth et fleurissant dès les premiers redoux."
          vertus="En infusion très diluée, elle calme les tremblements nerveux et les douleurs musculaires profondes ; certains anciens du territoire l'emploient contre les crises de mal tombant."
          preparation="Quelques pétales séchés infusés longuement dans l'eau frémissante, jamais plus d'une tasse par jour."
          danger="La plante entière est toxique consommée fraîche ou en trop grande quantité : nausées, vertiges et troubles du rythme cardiaque. À réserver aux praticiens expérimentés."
        />
        <PlantFiche
          nom="Aubépine"
          latin="Crataegus monogyna"
          icon="🍒"
          apparence="Arbuste épineux aux petites fleurs blanches odorantes au printemps, puis aux baies rouges (cenelles) à l'automne, très commun dans les haies de West Elizabeth."
          vertus="L'infusion de fleurs et de baies calme les palpitations, apaise l'anxiété et soutient un cœur fatigué ; particulièrement recommandée aux patients âgés ou éprouvés par un choc émotionnel."
          preparation="Infusion de fleurs séchées, ou légère décoction de baies, à prendre le soir avant le coucher."
        />
      </div>

      {/* Chapitre II — Plantes toniques et fortifiantes */}
      <div id="herb-chap-II" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${HERBORISTE_CHAPITRES[1].col}40`, borderTop: `3px solid ${HERBORISTE_CHAPITRES[1].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...HERBORISTE_CHAPITRES[1]} />
        <PlantFiche
          nom="Alaska Ginseng"
          latin="Oplopanax horridus"
          icon="🌱"
          apparence="Racine noueuse et pâle, rapportée des contrées froides du nord par les trappeurs, à l'odeur terreuse et légèrement poivrée."
          vertus="Fortifiant puissant contre l'épuisement, le froid et la fatigue prolongée ; redonne des forces aux convalescents, aux blessés et aux voyageurs exténués."
          preparation="Racine séchée râpée et infusée longuement, ou mâchée directement en petite quantité lors des longues veilles."
        />
        <PlantFiche
          nom="Panax quinquefolius"
          icon="🪴"
          apparence="Plante forestière discrète à la racine fourchue rappelant une silhouette humaine, de plus en plus rare dans les sous-bois du territoire."
          vertus="Tonique général : stimule l'organisme affaibli, améliore la concentration et la résistance au stress. Particulièrement utile aux patients en convalescence longue."
          preparation="Racine séchée coupée fine et infusée, ou réduite en poudre mêlée à du miel pour en adoucir le goût amer."
        />
        <PlantFiche
          nom="Sauge Rouge"
          latin="Salvia coccinea"
          icon="🌿"
          apparence="Plante aromatique aux feuilles veloutées teintées de rouge, dégageant une odeur forte et camphrée, poussant sur les terrains secs et bien exposés."
          vertus="Excellente contre les maux de gorge, les inflammations de la bouche et les rhumes ; stimule également la digestion après un repas copieux."
          preparation="Gargarisme à base d'une infusion concentrée pour la gorge, ou infusion légère après les repas pour la digestion."
        />
        <PlantFiche
          nom="Sauge du colibris"
          latin="Salvia spathacea"
          icon="🌸"
          apparence="Variété de sauge sauvage aux fleurs tubulaires d'un rouge éclatant, butinée par les colibris, poussant en altitude sur les terrains rocailleux."
          vertus="Ses vapeurs, inhalées en fumigation, dégagent les voies respiratoires et soulagent l'asthme et les bronchites ; en infusion légère, elle apaise également les nerfs."
          preparation="Feuilles séchées brûlées en fumigation dans une pièce close, ou infusées avec modération pour un usage interne."
        />
      </div>

      {/* Chapitre III — Plantes cicatrisantes et anti-infectieuses */}
      <div id="herb-chap-III" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${HERBORISTE_CHAPITRES[2].col}40`, borderTop: `3px solid ${HERBORISTE_CHAPITRES[2].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...HERBORISTE_CHAPITRES[2]} />
        <PlantFiche
          nom="Achillée millefeuille"
          latin="Achillea millefolium"
          icon="🌾"
          apparence="Plante aux feuilles finement découpées et aux ombelles de petites fleurs blanches ou rosées, très commune dans les prairies et le long des talus."
          vertus="Surnommée l'herbe aux coupures : appliquée sur une plaie, elle ralentit le saignement et favorise la cicatrisation. En infusion, elle fait également baisser la fièvre."
          preparation="Feuilles fraîches écrasées et appliquées directement sur une coupure propre, ou infusion de la plante séchée en cas de fièvre."
        />
        <PlantFiche
          nom="Aloe Verra"
          latin="Aloe vera"
          icon="🌵"
          apparence="Plante grasse aux longues feuilles charnues et épineuses, gorgées d'un gel transparent et rafraîchissant."
          vertus="Le gel apaise instantanément les brûlures, les coups de soleil et les irritations de la peau, et accélère la guérison des plaies superficielles."
          preparation="Fendre une feuille en deux et appliquer le gel directement sur la zone affectée, plusieurs fois par jour."
        />
        <PlantFiche
          nom="Échinacée"
          latin="Echinacea purpurea"
          icon="🌸"
          apparence="Grande fleur aux pétales pourpres retombants autour d'un cœur épineux, poussant dans les prairies herbeuses de West Elizabeth."
          vertus="Stimule les défenses naturelles de l'organisme ; recommandée dès les premiers signes de rhume, d'angine ou d'infection pour en freiner la progression."
          preparation="Décoction de racine et de fleurs séchées, à prendre dès l'apparition des symptômes et poursuivie plusieurs jours."
        />
        <PlantFiche
          nom="Cassis"
          latin="Ribes nigrum"
          icon="🫐"
          apparence="Arbuste aux petites baies noires luisantes, regroupées en grappes, à l'odeur musquée caractéristique."
          vertus="Les baies et les feuilles soulagent les douleurs articulaires et les inflammations, et fortifient la vue et les vaisseaux sanguins."
          preparation="Infusion de feuilles séchées pour les articulations, ou sirop de baies pour fortifier l'organisme durant l'hiver."
        />
        <PlantFiche
          nom="Champignon Bolai Bai"
          icon="🍄"
          apparence="Champignon rare à chair épaisse et chapeau brun-roux, poussant au pied des arbres morts dans les forêts humides, reconnaissable à son odeur de terre mouillée."
          vertus="Réduit en cataplasme, il possède une action désinfectante remarquable sur les plaies profondes et les abcès, freinant l'infection en attendant les soins du médecin."
          preparation="Chair fraîche écrasée en cataplasme, appliquée sous un bandage propre et renouvelée chaque jour."
          danger="Plusieurs champignons toxiques lui ressemblent fortement. Seul un membre du personnel formé à son identification doit en effectuer la récolte."
        />
      </div>

      {/* Chapitre IV — Plantes digestives et dépuratives */}
      <div id="herb-chap-IV" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${HERBORISTE_CHAPITRES[3].col}40`, borderTop: `3px solid ${HERBORISTE_CHAPITRES[3].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...HERBORISTE_CHAPITRES[3]} />
        <PlantFiche
          nom="Rhubarbe"
          latin="Rheum rhabarbarum"
          icon="🌱"
          apparence="Grande plante aux larges feuilles et aux tiges charnues rougeâtres, cultivée dans le potager du dispensaire."
          vertus="La tige, en légère décoction, stimule la digestion et soulage la constipation ; à dose plus forte, elle agit comme purgatif."
          preparation="Décoction de tige fraîche coupée en morceaux, le dosage étant adapté selon l'effet recherché."
          danger="Les feuilles de rhubarbe sont toxiques et ne doivent jamais être employées : seule la tige est utilisée."
        />
        <PlantFiche
          nom="Figue de barbarie"
          latin="Opuntia ficus-indica"
          icon="🌵"
          apparence="Cactus aux raquettes épineuses surmontées de fruits rouges sucrés, poussant sur les terrains arides du sud du territoire."
          vertus="La pulpe du fruit et les raquettes pelées apaisent les inflammations de l'estomac et des intestins, et aident à soutenir les patients affaiblis."
          preparation="Pulpe du fruit consommée fraîche, ou raquettes débarrassées de leurs épines, cuites puis appliquées en cataplasme sur les inflammations externes."
        />
        <PlantFiche
          nom="Verge d'or"
          latin="Solidago virgaurea"
          icon="🌼"
          apparence="Hautes tiges couronnées de petites fleurs jaune vif disposées en panache, fleurissant en abondance à la fin de l'été dans les friches."
          vertus="Favorise l'élimination par les reins et soulage les douleurs urinaires et les œdèmes ; utile pour soutenir l'organisme après une longue maladie."
          preparation="Infusion de sommités fleuries séchées, à boire à distance des repas."
        />
        <PlantFiche
          nom="Absinthe"
          latin="Artemisia absinthium"
          icon="🌿"
          apparence="Plante grise-argentée très aromatique, à l'odeur amère et pénétrante, poussant sur les talus secs et bien exposés."
          vertus="En infusion très diluée et de courte durée, elle stimule l'appétit, facilite la digestion et aide à chasser les vers intestinaux."
          preparation="Quelques feuilles séchées infusées brièvement, jamais en cure prolongée ni à forte concentration."
          danger="À forte dose ou en usage prolongé, l'absinthe est neurotoxique : elle provoque tremblements, convulsions et hallucinations. Son usage sous forme de liqueur est à proscrire au sein du dispensaire."
        />
      </div>

      {/* Chapitre V — Substances dangereuses et usages prohibés */}
      <div id="herb-chap-V" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${HERBORISTE_CHAPITRES[4].col}40`, borderTop: `3px solid ${HERBORISTE_CHAPITRES[4].col}`, padding: '28px 32px' }}>
        <RegSectionHeader {...HERBORISTE_CHAPITRES[4]} />
        <RegPara>Certaines espèces rencontrées sur le territoire ne possèdent aucune vertu médicinale reconnue et ne doivent en aucun cas entrer dans la composition d'une préparation du dispensaire.</RegPara>
        <PlantFiche
          nom="Amanite Tulouche"
          icon="🍄"
          apparence="Champignon de belle apparence, chapeau rouge ou orangé tacheté de blanc, poussant à l'automne au pied des conifères — aisément confondu avec des espèces comestibles par un œil non averti."
          vertus="Aucune vertu thérapeutique ne justifie son emploi au dispensaire."
          preparation="Aucune. La récolte, la conservation et l'usage de cette espèce sont interdits dans l'enceinte du dispensaire."
          danger="Hautement toxique : l'ingestion provoque des troubles digestifs violents, des hallucinations et un délire, et peut entraîner la mort en l'absence de traitement immédiat. Toute découverte parmi les réserves doit être signalée et détruite sans délai."
        />
      </div>

      {/* Signature */}
      <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
        <RegPara>Recueil tenu à jour dans la réserve botanique du dispensaire, à l'usage du personnel médical.</RegPara>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.sepia, marginBottom: 2 }}>Mère Agathe Voclain</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.16em', marginBottom: 22 }}>HERBORISTE DU DISPENSAIRE DE LITTLE CREEK</div>
        <RegCitation text="La nature met à notre portée plus de remèdes que nous n'aurons jamais le temps d'en apprendre ; à nous de les connaître avec humilité et de les employer avec mesure." author="Mère Agathe Voclain" />
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
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.3em', marginBottom: 10 }}>✦ CATALOGUE MÉDICAL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 8px', letterSpacing: '0.05em' }}>Spécialités Proposées</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.muted, marginBottom: 6 }}>Disciplines médicales du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${T.gold}, transparent)`, margin: '0 auto 14px' }} />
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.2em' }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
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
                <div style={{ fontFamily: MONO, fontSize: 10, color: s.col, letterSpacing: '0.22em', marginBottom: 2 }}>SPÉCIALITÉ</div>
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

/* ── Doctrine de Pureté et de Santé Naturelle ── */

const DOCTRINE_ARTICLES = [
  { num: 'I',    title: "DE L'ESPRIT DE L'HYGIÈNE",                      icon: '🌿', col: '#5A8878' },
  { num: 'II',   title: "DE L'HYGIÈNE PERSONNELLE",                      icon: '🧼', col: '#4A9888' },
  { num: 'III',  title: "DE L'EAU ET DE LA SALUBRITÉ PUBLIQUE",          icon: '💧', col: '#4878A8' },
  { num: 'IV',   title: "DE L'AIR ET DE LA TRANSMISSION DES FIÈVRES",    icon: '🌬', col: '#6888A8' },
  { num: 'V',    title: "DE LA PROPRETÉ DES LIEUX ET DU MATÉRIEL",       icon: '✨', col: '#7A8878' },
  { num: 'VI',   title: "DE LA TRANSMISSION DES MALADIES INFECTIEUSES",  icon: '🦠', col: '#786848' },
  { num: 'VII',  title: "DE L'HYGIÈNE DU MALADE",                        icon: '🏥', col: '#6A7A68' },
  { num: 'VIII', title: "APPLICATION SELON LES GRADES",                   icon: '📜', col: '#5A6888' },
  { num: 'IX',   title: "DISCIPLINE ET MORALITÉ DU SOIGNANT",             icon: '⚖',  col: '#786050' },
  { num: 'X',    title: "REMÈDES HYGIÉNIQUES DU DISPENSAIRE",             icon: '⚗',  col: '#A8B991' },
  { num: 'XI',   title: "SERMENT DU SERVITEUR DE SANTÉ",                  icon: '✦',  col: '#8A7848' },
] as const;

function ArticleHeader({ num, title, icon, col }: { num: string; title: string; icon: string; col: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
      <div style={{ width: 50, height: 50, background: `${col}20`, border: `2px solid ${col}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 14, color: col, textAlign: 'center', lineHeight: 1.1 }}>{num}</span>
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: col, letterSpacing: '0.22em', marginBottom: 2 }}>ARTICLE {num}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.sepia, letterSpacing: '0.06em' }}>{icon} {title}</div>
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${col}60, transparent)`, marginLeft: 8 }} />
    </div>
  );
}

function DoctrinePureteDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');
  const DC = '#5A8878';

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${DC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${DC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${DC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${DC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${DC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: DC, letterSpacing: '0.3em', marginBottom: 10 }}>✦ DOCTRINE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: DC, margin: '0 0 8px', letterSpacing: '0.04em' }}>🌿 Doctrine de Pureté et de Santé Naturelle</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Fondée sur les travaux du Docteur Pasteur et la sagesse des plantes</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${DC}, transparent)`, margin: '0 auto 18px' }} />
        {/* Toggle version */}
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${DC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${DC}28` : 'transparent', color: version === 'complete' ? DC : T.dim, borderRight: `1px solid ${DC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${DC}28` : 'transparent', color: version === 'resume' ? DC : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${DC}50`}>
            <RegPara>La Doctrine de Pureté et de Santé Naturelle enseigne que la première médecine réside dans l'hygiène, la prévention et le respect des lois naturelles. Inspirée des découvertes du docteur Pasteur et de la médecine par les plantes, elle affirme que la maladie prospère dans la saleté, l'eau corrompue, l'air vicié et le manque de propreté.</RegPara>
            <RegPara>Chaque soignant a le devoir de maintenir une hygiène irréprochable : mains propres, vêtements propres, matériel désinfecté et locaux entretenus. L'eau doit être saine, filtrée et bouillie ; l'air doit être renouvelé régulièrement par l'aération des bâtiments. Les malades doivent être entourés de propreté, de lumière et d'un environnement sain favorisant leur rétablissement.</RegPara>
            <RegPara>Cette doctrine unit la science des germes à la sagesse des remèdes naturels. Elle reconnaît l'utilité des plantes médicinales pour purifier, apaiser et soutenir la guérison, sans jamais négliger les règles fondamentales d'hygiène.</RegPara>
            <RegPara>Enfin, elle rappelle que la discipline, le calme et l'exemplarité du soignant participent eux aussi à la santé publique. Préserver la pureté de l'eau, de l'air, du corps et du lieu de soin est considéré comme le premier devoir de tout serviteur de la médecine.</RegPara>
          </RegBlock>
          <RegCitation text="Pur de main, pur de cœur, pur de lieu — ainsi naît la guérison." author="Devise du Dispensaire" />
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `rgba(90,136,120,0.05)`, border: `1px solid ${DC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>ARTICLES</span>
            {DOCTRINE_ARTICLES.map(a => (
              <a key={a.num} href={`#doc-art-${a.num}`} style={{ fontFamily: MONO, fontSize: 11, color: a.col, background: `${a.col}15`, border: `1px solid ${a.col}40`, padding: '3px 10px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>
                {a.num}
              </a>
            ))}
          </div>

          {/* Préambule */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DC, letterSpacing: '0.22em', background: `${DC}18`, padding: '6px 16px', border: `1px solid ${DC}40` }}>PRÉAMBULE</div>
              <div style={{ flex: 1, height: 1, background: `${DC}35` }} />
            </div>
            <RegBlock col={`${DC}45`}>
              <RegPara>En ce dispensaire dédié à la médecine par les plantes et à la lumière de la science moderne, il est reconnu que la propreté du lieu, la pureté de l'air et la salubrité de l'eau sont les premiers remparts contre la maladie. Les découvertes récentes du Docteur Louis Pasteur ont révélé que nombre de fièvres et d'infections ne proviennent point des miasmes du passé, mais d'êtres invisibles, de germes vivants, que l'on peut chasser par la chaleur, la propreté et les remèdes naturels.</RegPara>
              <RegPara>Ainsi, toute personne servant en ce dispensaire, qu'elle soit Apprenti, Infirmier ou Apprenti-Médecin, doit unir la sagesse des plantes à la science de la propreté, afin de préserver la vie humaine dans sa forme la plus pure.</RegPara>
            </RegBlock>
          </div>

          {/* Article I */}
          <div id="doc-art-I" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[0].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[0].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[0]} />
            <RegPara>L'hygiène est une doctrine de vie. Elle n'est point un luxe, mais une science ; non point une habitude, mais un devoir. Elle protège contre les germes invisibles, qui naissent et se multiplient dans la saleté, l'eau stagnante, l'air vicié et le linge souillé.</RegPara>
            <RegPara>Celui qui garde la propreté autour de lui combat la maladie autant qu'un remède la guérit.</RegPara>
          </div>

          {/* Article II */}
          <div id="doc-art-II" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[1].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[1].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[1]} />
            <RegPara>Chaque membre du dispensaire doit être lui-même un exemple de salubrité. Le corps impur attire la fièvre comme l'eau stagnante attire la vermine.</RegPara>
            <RegList items={['Se laver les mains avant et après tout soin.', 'Porter linge propre et habit clair.', 'Couvrir les plaies ou les éraflures.', 'Bannir toute odeur forte (tabac, parfums, boissons).']} />
            <RegPara>Les apprentis apprendront que les germes se logent d'abord dans les mains, et qu'une main propre sauve plus de vies qu'un remède mal préparé.</RegPara>
          </div>

          {/* Article III */}
          <div id="doc-art-III" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[2].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[2].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[2]} />
            <RegPara>L'eau est la source de la vie, mais aussi celle du mal lorsqu'elle est corrompue. Les fièvres typhoïdes, dysenteries et choléras se transmettent souvent par les eaux souillées.</RegPara>
            <RegPara>Toute eau servant à boire, laver ou préparer les remèdes sera :</RegPara>
            <RegList items={['Puisée d\'une source saine.', 'Filtrée au charbon ou au linge.', 'Bouillie avant usage.', 'Purifiée, au besoin, par infusion de thym, romarin ou sauge — plantes purificatrices.']} />
            <RegPara>Aucun récipient ne doit rester découvert. Les apprentis signaleront immédiatement toute odeur ou trouble suspect dans l'eau.</RegPara>
          </div>

          {/* Article IV */}
          <div id="doc-art-IV" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[3].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[3].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[3]} />
            <RegPara>L'air impur porte les germes comme le vent porte les graines. Les chambres mal aérées ou trop humides favorisent la fièvre, la toux et la faiblesse du sang.</RegPara>
            <RegList items={['Ouvrir les fenêtres deux fois par jour.', 'Éviter la stagnation de l\'air : feu léger, courant d\'air doux, lumière du jour.', 'Faire brûler, à heure fixe, lavande, sauge ou romarin : leurs essences chassent les miasmes et fortifient les poumons.']} />
            <div style={{ background: 'rgba(72,120,168,0.10)', border: '1px solid rgba(72,120,168,0.30)', padding: '14px 20px', marginTop: 10 }}>
              <RegPara>Il est défendu de laisser dormir un malade dans une chambre close ou sans soleil. <strong style={{ color: '#7AAAD8' }}>L'air clair est un médicament invisible.</strong></RegPara>
            </div>
          </div>

          {/* Article V */}
          <div id="doc-art-V" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[4].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[4].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[4]} />
            <RegPara>Les germes invisibles s'attachent aux surfaces et aux instruments. Ce que l'œil ne voit pas, la fièvre le perçoit.</RegPara>
            <RegList items={['Laver chaque instrument à l\'eau bouillante après usage.', 'Nettoyer les tables, sols et murs à l\'eau vinaigrée.', 'Brûler le linge souillé par le sang ou le pus.', 'Conserver les herbes dans des bocaux secs, propres, fermés hermétiquement.']} />
            <RegPara>Le Médecin-Chef rappelle que le fer mal lavé peut transmettre la mort autant qu'un poison.</RegPara>
          </div>

          {/* Article VI */}
          <div id="doc-art-VI" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[5].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[5].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[5]} />
            <RegPara>Les fièvres ne se transmettent pas par le regard ni par la volonté des dieux, mais par le contact du malade, de ses vêtements, de son souffle ou de son eau.</RegPara>
            <RegPara>Les apprentis et infirmiers doivent :</RegPara>
            <RegList items={['Éviter de toucher un malade contagieux sans linge propre ou gants de toile.', 'Brûler les draps après décès.', 'Désinfecter les chambres par fumigation végétale.', 'Laver le sol et les murs à l\'eau chaude et au vinaigre.']} />
            <RegPara>Les apprentis-médecins étudieront les causes invisibles des contagions selon la théorie des germes : ils apprendront que le microbe se nourrit de saleté et meurt de chaleur et de propreté.</RegPara>
          </div>

          {/* Article VII */}
          <div id="doc-art-VII" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[6].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[6].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[6]} />
            <RegPara>Le malade doit être entouré d'air pur et de linge propre. Ses mains et son visage seront lavés chaque matin. La pièce sera aérée, le lit refait, et les draps changés dès qu'ils se chargent d'humidité.</RegPara>
            <RegPara>Nulle nourriture ne restera dans sa chambre. Les plantes purificatrices — lavande, thym, eucalyptus, menthe — peuvent être suspendues au chevet du lit.</RegPara>
          </div>

          {/* Article VIII */}
          <div id="doc-art-VIII" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[7].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[7].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[7]} />
            {[
              { grade: 'Apprentis',         col: '#786848', items: ['Exécutent les tâches de propreté et de purification.', 'Apprennent les gestes qui chassent les germes : lavage, aération, désinfection.', 'Observent et consignent les signes d\'insalubrité.'] },
              { grade: 'Infirmiers',         col: '#A8B991', items: ['Assurent l\'entretien des chambres, la stérilisation du matériel et la préparation des solutions antiseptiques.', 'Enseignent la discipline hygiénique et veillent à la sécurité des soins.'] },
              { grade: 'Apprentis-Médecins', col: '#4878A8', items: ['Étudient la science pasteurienne, la cause microbienne des maladies, et l\'influence des éléments — air, eau, saleté — sur la santé publique.', 'Établissent des protocoles et supervisent leur application au dispensaire.'] },
            ].map(g => (
              <div key={g.grade} style={{ marginBottom: 18, background: T.card, border: `1px solid ${g.col}35`, borderLeft: `3px solid ${g.col}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: g.col, marginBottom: 10 }}>{g.grade}</div>
                <RegList items={g.items} />
              </div>
            ))}
          </div>

          {/* Article IX */}
          <div id="doc-art-IX" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[8].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[8].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[8]} />
            <RegPara>L'ordre extérieur doit refléter l'ordre intérieur. Un esprit agité souille le soin autant qu'une main sale.</RegPara>
            <RegPara>Chaque membre du dispensaire doit : parler avec calme, agir avec douceur, obéir aux règles sans discussion inutile.</RegPara>
            <RegPara>La pureté du lieu commence dans le cœur de celui qui le sert.</RegPara>
          </div>

          {/* Article X */}
          <div id="doc-art-X" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[9].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[9].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[9]} />
            <RegPara>Trois préparations sont tenues en usage permanent au dispensaire :</RegPara>
            {[
              { nom: 'La Solution Vinaigrée du Dispensaire', desc: 'Vinaigre, romarin, thym, lavande et ail. Utilisée pour la désinfection des sols, instruments et linges.' },
              { nom: 'La Fumigation de Lavande et de Sauge', desc: 'Purification de l\'air et des chambres de convalescence.' },
              { nom: "L'Eau Clarifiée", desc: 'Eau bouillie et filtrée, parfumée de camomille ou de menthe pour la toilette du malade.' },
            ].map(r => (
              <div key={r.nom} style={{ background: T.card, border: `1px solid rgba(90,136,120,0.30)`, borderLeft: `3px solid #5A8878`, padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DC, marginBottom: 6 }}>{r.nom}</div>
                <RegPara>{r.desc}</RegPara>
              </div>
            ))}
          </div>

          {/* Article XI */}
          <div id="doc-art-XI" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${DOCTRINE_ARTICLES[10].col}40`, borderTop: `3px solid ${DOCTRINE_ARTICLES[10].col}`, padding: '26px 30px' }}>
            <ArticleHeader {...DOCTRINE_ARTICLES[10]} />
            <div style={{ margin: '12px 0', padding: '24px 28px', borderLeft: `3px solid ${DC}`, background: `${DC}08`, position: 'relative' }}>
              <span style={{ position: 'absolute', top: -14, left: 16, fontFamily: DISPLAY, fontSize: 42, color: DC, opacity: 0.30, lineHeight: 1 }}>"</span>
              <p style={{ fontFamily: BODY, fontSize: 16, color: T.sepia, fontStyle: 'italic', lineHeight: 1.9, margin: '0 0 8px', paddingTop: 10 }}>
                Je jure devant mes pairs et sous le regard de la Nature de préserver la pureté de l'eau, la clarté de l'air, et la propreté du lieu. Je combattrai la saleté comme on combat la fièvre. J'unirai la science du végétal à la sagesse de la propreté. Et par la main propre et l'esprit calme, je servirai la vie.
              </p>
              <div style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.12em' }}>— Serment du serviteur de santé</div>
            </div>
          </div>

          {/* Devise */}
          <RegCitation text="Pur de main, pur de cœur, pur de lieu — ainsi naît la guérison." author="Devise du Dispensaire" />
        </div>
      )}
    </div>
  );
}

/* ── Cours de Botanique Médicale — Les Plantes Purificatrices ── */

const BC = '#6A8850';
const BC_LIGHT = '#8AAA70';

const PLANTES = [
  {
    num: '1', nom: 'Thym', lat: 'Thymus vulgaris', icon: '🌿', col: '#8A7040',
    desc: "Plante du soleil et du feu. Antiseptique majeur, il détruit les germes dans l'air, les plaies et les eaux.",
    usages: ["Infusion pour désinfecter les plaies et purifier la gorge.", "Fumigation pour chasser les miasmes.", "Macération dans le vinaigre pour préparer la Solution du Dispensaire."],
    devise: '"Où je passe, la fièvre recule."',
  },
  {
    num: '2', nom: 'Lavande', lat: 'Lavandula officinalis', icon: '💜', col: '#7060A0',
    desc: "Symbole de propreté et de calme. Son parfum purifie l'air, apaise le cœur et éloigne les parasites.",
    usages: ["Fumigation dans les chambres des malades.", "Infusion pour les bains et la toilette.", "Poche de fleurs séchées dans les linges et armoires."],
    devise: '"Je purifie par le parfum et j\'apaise par la douceur."',
  },
  {
    num: '3', nom: 'Romarin', lat: 'Rosmarinus officinalis', icon: '🌿', col: '#A8B991',
    desc: "Plante tonique et solaire. Elle ranime le sang et désinfecte les instruments comme les pièces.",
    usages: ["Décoction pour le nettoyage des tables et ustensiles.", "Infusion dans le vinaigre pour la désinfection du matériel.", "Fumigation dans les salles d'opérations."],
    devise: '"Je rends force au lieu et chaleur au sang."',
  },
  {
    num: '4', nom: 'Sauge', lat: 'Salvia officinalis', icon: '🍃', col: '#607850',
    desc: 'Son nom vient du latin salvare, "sauver". Plante sacrée des guérisseurs, elle est antiseptique, astringente et purifiante.',
    usages: ["Gargarismes contre les maux de bouche et de gorge.", "Fumigation pour assainir les chambres.", "Cataplasmes sur plaies ou fièvres."],
    devise: '"Qui a de la sauge dans son jardin n\'a point besoin du médecin."',
  },
  {
    num: '5', nom: 'Eucalyptus', lat: 'Eucalyptus globulus', icon: '🌱', col: '#488870',
    desc: "Originaire d'Australie, introduit récemment en Europe. Son essence combat les affections respiratoires et purifie l'air des marais et fièvres.",
    usages: ["Inhalations pour dégager les voies respiratoires.", "Fumigation contre les germes dans les salles closes.", "Feuilles suspendues pour éloigner les insectes."],
    devise: '"Je chasse l\'air impur et rends souffle au poumon."',
  },
  {
    num: '6', nom: 'Ail', lat: 'Allium sativum', icon: '🧄', col: '#907860',
    desc: "Plante du peuple, rustique et puissante. Véritable antiseptique naturel, interne et externe.",
    usages: ["Broyez une gousse dans le vinaigre pour désinfecter une plaie.", "Ingestion pour purifier le sang et fortifier les défenses.", "Usage dans les préparations préventives en temps d'épidémie."],
    devise: '"Je protège par ma force, fût-elle âcre."',
  },
  {
    num: '7', nom: 'Menthe', lat: 'Mentha piperita', icon: '🌿', col: '#40887A',
    desc: "Rafraîchissante, stimulante, clarifiante. Elle ranime l'esprit et chasse les odeurs.",
    usages: ["Infusion pour rafraîchir la bouche et le ventre.", "Fumigation ou bouquet pour purifier les chambres d'été.", "Application en compresse sur le front fiévreux."],
    devise: '"Je rends la clarté à l\'air et la fraîcheur à la pensée."',
  },
] as const;

const MELANGES = [
  {
    nom: 'Vinaigre des Quatre Voleurs',
    desc: 'Mélange traditionnel du dispensaire : Ail, Romarin, Thym, Sauge et Lavande macérés dans le vinaigre de vin.',
    usage: 'Désinfectant universel pour mains, instruments, tables et plaies légères.',
  },
  {
    nom: 'Fumigation du Médecin-Chef',
    desc: 'Lavande, Sauge, Romarin et Eucalyptus séchés, brûlés sur braises.',
    usage: 'À utiliser chaque matin dans les salles fermées ou après décès.',
  },
  {
    nom: 'Eau Clarifiée',
    desc: 'Eau bouillie, filtrée, parfumée de Menthe et de Camomille.',
    usage: 'Utilisée pour la toilette du malade, la boisson et les compresses.',
  },
] as const;

function BotaniqueMedicaleDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${BC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${BC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${BC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${BC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${BC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: BC, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE BOTANIQUE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: BC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🌱 Les Plantes Purificatrices</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Tradition des herboristes &amp; science de l'hygiène naturelle</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${BC}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${BC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${BC}28` : 'transparent', color: version === 'complete' ? BC_LIGHT : T.dim, borderRight: `1px solid ${BC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${BC}28` : 'transparent', color: version === 'resume' ? BC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${BC}50`}>
            <RegPara>Les Plantes Purificatrices occupent une place essentielle dans la médecine naturelle du dispensaire. Reconnues à la fois par la tradition des herboristes et par les avancées de la science moderne, elles contribuent à préserver la santé en purifiant l'air, l'eau, le corps et les lieux de soin.</RegPara>
            <RegPara>Leur action repose sur trois principes fondamentaux : assainir l'environnement, protéger l'organisme contre les infections et favoriser le bien-être physique comme moral. Parmi les plus importantes figurent le thym, la lavande, le romarin, la sauge, l'eucalyptus, l'ail et la menthe, chacun possédant des vertus spécifiques de désinfection, de purification ou de fortification.</RegPara>
            <RegPara>Ces plantes sont utilisées sous diverses formes : infusions, décoctions, fumigations, compresses ou préparations médicinales. Elles entrent également dans la composition de remèdes traditionnels du dispensaire, tels que le Vinaigre des Quatre Voleurs, les fumigations purificatrices ou l'Eau Clarifiée.</RegPara>
            <RegPara>Au-delà de leurs propriétés médicinales, les plantes purificatrices rappellent l'importance de vivre en harmonie avec la nature. Leur préparation et leur usage exigent rigueur, respect et discipline, car elles constituent un complément essentiel aux règles d'hygiène et de salubrité enseignées au dispensaire.</RegPara>
          </RegBlock>
          <div style={{ background: T.paper, border: `1px solid ${BC}40`, borderLeft: `4px solid ${BC}`, padding: '18px 24px', margin: '24px 0' }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: BC, letterSpacing: '0.2em', marginBottom: 8 }}>PRINCIPE FONDAMENTAL</div>
            <RegPara>La nature entretient la vie ; lorsqu'elle est comprise et respectée, elle devient l'une des plus fidèles alliées de la santé humaine.</RegPara>
          </div>
          <RegCitation text="Là où la plante pousse, la maladie recule ; là où elle agit, la santé prospère." author="Devise du Dispensaire" />
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: BC_LIGHT, letterSpacing: '0.22em', background: `${BC}18`, padding: '6px 16px', border: `1px solid ${BC}40` }}>PRÉAMBULE</div>
              <div style={{ flex: 1, height: 1, background: `${BC}35` }} />
            </div>
            <RegBlock col={`${BC}45`}>
              <RegPara>Depuis les temps anciens, la nature a offert à l'homme les moyens de se guérir par elle-même. Les plantes ne sont point seulement des remèdes : elles sont les gardiennes silencieuses de la pureté, purifiant l'air, l'eau, le sang et l'esprit. Le progrès scientifique a révélé, par l'observation et l'expérience, que certaines plantes possèdent des vertus antiseptiques, désinfectantes ou assainissantes, capables de combattre les germes et les miasmes dont la science moderne a prouvé l'existence.</RegPara>
              <RegPara>Le Dispensaire de Blackwater, fidèle à l'enseignement de la nature et éclairé par la science de Pasteur, enseigne ici l'usage méthodique des plantes purificatrices : celles qui maintiennent la santé du corps et la salubrité du lieu.</RegPara>
            </RegBlock>
          </div>

          {/* I. Doctrine de pureté végétale */}
          <div style={{ marginBottom: 36, background: T.paper, border: `1px solid ${BC}40`, borderTop: `3px solid ${BC}`, padding: '26px 30px' }}>
            <ArticleHeader num="I" title="DE LA DOCTRINE DE PURETÉ VÉGÉTALE" icon="🌿" col={BC} />
            <RegPara>La plante purificatrice agit de trois manières :</RegPara>
            <RegList items={["Par l'air, qu'elle parfume et désinfecte.", "Par l'eau, qu'elle clarifie et rend salubre.", "Par le corps, qu'elle nettoie, protège et fortifie."]} />
            <RegPara>Elles remplacent avantageusement les remèdes chimiques lorsque l'on veut soigner avec douceur et respect du vivant. Elles sont l'expression la plus simple de la loi naturelle : la vie entretient la vie.</RegPara>
          </div>

          {/* II. Plantes */}
          <div style={{ marginBottom: 36, background: T.paper, border: `1px solid ${BC}40`, borderTop: `3px solid ${BC}`, padding: '26px 30px' }}>
            <ArticleHeader num="II" title="DES PRINCIPALES PLANTES PURIFICATRICES ET LEURS USAGES" icon="🌱" col={BC} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {PLANTES.map(p => (
                <div key={p.num} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `4px solid ${p.col}`, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: p.col, background: `${p.col}18`, padding: '3px 10px', border: `1px solid ${p.col}40`, letterSpacing: '0.1em' }}>{p.num}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: 20, color: p.col }}>{p.icon} {p.nom}</span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, fontStyle: 'italic' }}>{p.lat}</span>
                  </div>
                  <RegPara>{p.desc}</RegPara>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: p.col, letterSpacing: '0.14em', margin: '10px 0 6px' }}>USAGES :</div>
                  <RegList items={p.usages as unknown as string[]} />
                  <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${p.col}25` }}>
                    <em>Devise : {p.devise}</em>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* III. Mélanges */}
          <div style={{ marginBottom: 36, background: T.paper, border: `1px solid ${BC}40`, borderTop: `3px solid ${BC}`, padding: '26px 30px' }}>
            <ArticleHeader num="III" title="DES MÉLANGES PURIFICATEURS DU DISPENSAIRE" icon="⚗" col={BC} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MELANGES.map((m, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${BC}35`, borderLeft: `3px solid ${BC}`, padding: '16px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: BC_LIGHT, marginBottom: 8 }}>{m.nom}</div>
                  <RegPara>{m.desc}</RegPara>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: BC, marginTop: 6, letterSpacing: '0.08em' }}>{m.usage}</div>
                </div>
              ))}
            </div>
          </div>

          {/* IV. Science et spiritualité */}
          <div style={{ marginBottom: 36, background: T.paper, border: `1px solid ${BC}40`, borderTop: `3px solid ${BC}`, padding: '26px 30px' }}>
            <ArticleHeader num="IV" title="DE LA SCIENCE ET DE LA SPIRITUALITÉ DES PLANTES PURIFICATRICES" icon="✨" col={BC} />
            <RegPara>Leur pouvoir ne réside pas seulement dans leurs sucs ou leurs essences, mais dans leur harmonie avec la vie. Elles sont le souffle du monde végétal, messagères du soleil dans la matière. Chaque herbe purificatrice agit à la fois sur le corps et sur l'esprit :</RegPara>
            <RegList items={["Elle guérit, éclaire et enseigne la discipline intérieure."]} />
            <RegPara>Ainsi, celui qui prépare une fumigation ou une infusion doit le faire avec esprit calme et main pure, car la plante répond à la disposition de celui qui la sert.</RegPara>
          </div>

          {/* Conclusion */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: BC_LIGHT, letterSpacing: '0.22em', background: `${BC}18`, padding: '6px 16px', border: `1px solid ${BC}40` }}>CONCLUSION</div>
              <div style={{ flex: 1, height: 1, background: `${BC}35` }} />
            </div>
            <RegBlock col={`${BC}45`}>
              <RegPara>Les plantes purificatrices sont le souffle de la Terre au service de la santé humaine. Elles unissent le savoir ancestral des herboristes et la science nouvelle de l'hygiène. Là où la plante pousse, la maladie recule ; là où elle est brûlée, l'air se fait plus pur.</RegPara>
              <RegPara>Puissent les serviteurs du Dispensaire de Blackwater ne jamais oublier que la nature, lorsqu'on la comprend et qu'on la respecte, est la plus fidèle des alliées contre la corruption des corps et des âmes.</RegPara>
            </RegBlock>
          </div>

          <RegCitation text="Là où la plante pousse, la maladie recule ; là où elle agit, la santé prospère." author="Devise du Dispensaire" />
        </div>
      )}
    </div>
  );
}

/* ── Manuel des Soins Infirmiers ── */

const MC = '#A04848';
const MC_LIGHT = '#C07878';

const REMEDIES_VEGETAUX = [
  { nom: "Teinture Mère d'Échinacée", usages: ["Soutien de l'organisme.", "Fièvres modérées.", "Prévention des infections."] },
  { nom: "Décoction Fébrifuge",        usages: ["Réduction des états fébriles.", "Accompagnement des maladies infectieuses légères."] },
  { nom: "Sirop Pectoral",             usages: ["Toux.", "Irritations de la gorge.", "Bronchites légères."] },
  { nom: "Décoction Expectorante",     usages: ["Évacuation des sécrétions pulmonaires.", "Affections respiratoires."] },
  { nom: "Macération de Panax",        usages: ["Fatigue.", "Faiblesse générale.", "Convalescence."] },
  { nom: "Vin Quinquiné",              usages: ["État de faiblesse.", "Fièvres récurrentes.", "Convalescence."] },
];

const REMEDIES_EXTERNES = [
  { nom: "Eau Vulnéraire",    usages: ["Nettoyage des plaies.", "Désinfection légère.", "Contusions."] },
  { nom: "Onguent Vulnéraire", usages: ["Plaies superficielles.", "Écorchures.", "Brûlures mineures."] },
  { nom: "Pommade Camphrée",  usages: ["Douleurs musculaires.", "Entorses.", "Courbatures."] },
  { nom: "Baume Résineux",    usages: ["Protection des plaies.", "Irritations cutanées.", "Douleurs articulaires légères."] },
];

const REMEDIES_CONTROLE = [
  { nom: "Laudanum",           usages: ["Douleurs sévères.", "Agitation importante.", "Insomnies graves."] },
  { nom: "Élixir Parégorique", usages: ["Toux persistante.", "Douleurs modérées.", "Troubles digestifs."] },
];

function ManuelInfirmiersDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${MC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${MC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${MC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${MC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${MC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: MC, letterSpacing: '0.3em', marginBottom: 10 }}>✦ FORMATION MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: MC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🩹 Manuel des Soins Infirmiers</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Les Fondamentaux et Soins Autorisés</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${MC}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${MC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${MC}28` : 'transparent', color: version === 'complete' ? MC_LIGHT : T.dim, borderRight: `1px solid ${MC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${MC}28` : 'transparent', color: version === 'resume' ? MC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${MC}50`}>
            <RegPara>L'infirmier du Dispensaire agit sous l'autorité des médecins. Sa mission principale est d'observer les malades, administrer les traitements autorisés, assurer leur confort et signaler toute aggravation de leur état.</RegPara>
          </RegBlock>

          {[
            { titre: 'Connaissances fondamentales', items: ["Les bases de l'anatomie humaine.", "La surveillance du pouls, de la respiration et de la température.", "Les règles d'hygiène et de prévention des infections.", "L'utilisation correcte des remèdes du dispensaire."] },
            { titre: "Règles d'hygiène", items: ["Se laver les mains avant et après chaque soin.", "Nettoyer les instruments utilisés.", "Maintenir les chambres propres et aérées.", "Changer régulièrement le linge des patients.", "Désinfecter les plaies selon les procédures établies."] },
            { titre: 'Soins autorisés', items: ["Nettoyer et bander les plaies légères.", "Désinfecter les blessures mineures.", "Administrer les remèdes prescrits.", "Assurer l'hydratation et le repos des patients.", "Surveiller les malades de jour comme de nuit."] },
            { titre: 'Suivi médical', items: ["Date et heure.", "Signes vitaux.", "Soins administrés.", "Médicaments utilisés.", "Évolution de l'état du patient."] },
          ].map(section => (
            <div key={section.titre} style={{ marginBottom: 24, background: T.paper, border: `1px solid ${MC}30`, borderLeft: `3px solid ${MC}`, padding: '18px 22px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 12 }}>{section.titre}</div>
              <RegList items={section.items} />
            </div>
          ))}

          {/* Traitements autorisés */}
          <div style={{ marginBottom: 24, background: T.paper, border: `1px solid ${MC}30`, borderLeft: `3px solid ${MC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 14 }}>Traitements autorisés</div>
            {[
              { label: 'Remèdes végétaux', items: ["Teinture Mère d'Échinacée", "Décoction Fébrifuge", "Sirop Pectoral", "Décoction Expectorante", "Macération de Panax", "Vin Quinquiné"], col: '#A8B991' },
              { label: 'Préparations externes', items: ["Eau Vulnéraire", "Onguent Vulnéraire", "Pommade Camphrée", "Baume Résineux"], col: '#4878A8' },
              { label: 'Sous autorisation médicale', items: ["Laudanum", "Élixir Parégorique"], col: '#A06028' },
            ].map(cat => (
              <div key={cat.label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${MC}20` }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: cat.col, letterSpacing: '0.14em', marginBottom: 6 }}>{cat.label.toUpperCase()}</div>
                <RegList items={cat.items} />
              </div>
            ))}
          </div>

          {/* Ce qu'un infirmier ne peut pas faire */}
          <div style={{ marginBottom: 24, background: `rgba(160,72,72,0.05)`, border: `1px solid ${MC}40`, borderLeft: `4px solid ${MC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 12 }}>Ce qu'un infirmier ne peut pas faire</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MC, letterSpacing: '0.12em', marginBottom: 8 }}>SANS PRÉSENCE OU AUTORISATION D'UN MÉDECIN :</div>
            <RegList items={["Réaliser une intervention chirurgicale.", "Modifier une prescription.", "Administrer seul du Laudanum ou de l'Élixir Parégorique.", "Poser un diagnostic médical définitif.", "Créer ou expérimenter de nouveaux traitements."]} />
          </div>

          {/* Devoirs */}
          <div style={{ marginBottom: 24, background: T.paper, border: `1px solid ${MC}30`, borderLeft: `3px solid ${MC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 12 }}>Devoirs de l'infirmier</div>
            <RegList items={["Respect.", "Discrétion.", "Patience.", "Compassion.", "Rigueur."]} />
            <RegPara>Sa mission n'est pas seulement de soigner, mais également de rassurer, accompagner et soulager les malades confiés à ses soins.</RegPara>
          </div>
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `rgba(160,72,72,0.05)`, border: `1px solid ${MC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>CHAPITRES</span>
            {['I','II','III','IV','V','VI','VII','VIII'].map(n => (
              <a key={n} href={`#inf-ch-${n}`} style={{ fontFamily: MONO, fontSize: 11, color: MC, background: `${MC}15`, border: `1px solid ${MC}40`, padding: '3px 10px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>{n}</a>
            ))}
          </div>

          {/* Chapitre I */}
          <div id="inf-ch-I" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="I" title="OBJECTIF DU MANUEL" icon="📋" col={MC} />
            <RegPara>Le présent manuel a pour vocation de former les infirmiers du Dispensaire à l'art de soigner, surveiller, assister et soulager les malades sous l'autorité des médecins.</RegPara>
            <RegPara>L'infirmier constitue le premier soutien du patient. Il observe, accompagne, administre les traitements autorisés et signale sans délai toute aggravation de l'état du malade.</RegPara>
            <RegPara>Son rôle n'est point de remplacer le médecin, mais de prolonger son action par une surveillance attentive et des soins rigoureux.</RegPara>
          </div>

          {/* Chapitre II */}
          <div id="inf-ch-II" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="II" title="SCIENCES FONDAMENTALES" icon="🔬" col={MC} />
            {[
              { titre: '1. Anatomie simplifiée', intro: "L'infirmier doit connaître les principaux systèmes du corps humain :", systemes: [
                { nom: 'Cœur et circulation', points: ["Observation du pouls.", "Reconnaissance des signes de faiblesse circulatoire.", "Surveillance des hémorragies."] },
                { nom: 'Poumons et respiration', points: ["Observation de la fréquence respiratoire.", "Détection des difficultés respiratoires.", "Surveillance de la toux et des expectorations."] },
                { nom: 'Appareil digestif', points: ["Observation de l'appétit.", "Surveillance des douleurs abdominales.", "Observation des selles et vomissements."] },
                { nom: 'Peau et tissus externes', points: ["Identification des plaies.", "Surveillance des infections.", "Observation des brûlures et inflammations."] },
              ]},
            ].map(sec => (
              <div key={sec.titre} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 12 }}>{sec.titre}</div>
                <RegPara>{sec.intro}</RegPara>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {sec.systemes.map(s => (
                    <div key={s.nom} style={{ background: T.card, border: `1px solid ${MC}30`, borderLeft: `3px solid ${MC}`, padding: '12px 16px' }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 15, color: MC_LIGHT, marginBottom: 8 }}>{s.nom}</div>
                      <RegList items={s.points} />
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 12 }}>L'infirmier ne pratique aucune intervention chirurgicale sans supervision médicale.</div>
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 10 }}>2. Physiologie pratique</div>
              <RegPara>L'infirmier doit surveiller quotidiennement :</RegPara>
              <RegList items={["Température corporelle.", "Pouls.", "Respiration.", "Hydratation.", "Alimentation.", "État général du patient."]} />
              <RegPara>Toute anomalie doit être signalée au médecin.</RegPara>
            </div>

            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 10 }}>3. Hygiène et prévention</div>
              <RegPara>Chaque infirmier doit :</RegPara>
              <RegList items={["Se laver les mains avant et après chaque soin.", "Nettoyer les instruments utilisés.", "Maintenir les salles propres et aérées.", "Changer régulièrement les draps des patients.", "Désinfecter les plaies selon les procédures établies."]} />
              <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 8 }}>L'hygiène demeure la première défense contre les infections.</div>
            </div>
          </div>

          {/* Chapitre III */}
          <div id="inf-ch-III" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="III" title="PHARMACOLOGIE ÉLÉMENTAIRE" icon="⚗" col={MC} />
            <RegPara>L'infirmier est autorisé à administrer certains remèdes simples préparés par le dispensaire.</RegPara>

            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: '#8AAA70', marginBottom: 12, marginTop: 4 }}>Remèdes végétaux</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {REMEDIES_VEGETAUX.map(r => (
                <div key={r.nom} style={{ background: T.card, border: '1px solid rgba(90,120,72,0.35)', borderLeft: '3px solid #A8B991', padding: '12px 18px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#8AAA70', minWidth: 200, flexShrink: 0 }}>{r.nom}</div>
                  <div style={{ flex: 1 }}><RegList items={r.usages} /></div>
                </div>
              ))}
            </div>

            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: '#7AA8C8', marginBottom: 12 }}>Préparations externes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {REMEDIES_EXTERNES.map(r => (
                <div key={r.nom} style={{ background: T.card, border: '1px solid rgba(72,120,168,0.35)', borderLeft: '3px solid #4878A8', padding: '12px 18px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#7AA8C8', minWidth: 200, flexShrink: 0 }}>{r.nom}</div>
                  <div style={{ flex: 1 }}><RegList items={r.usages} /></div>
                </div>
              ))}
            </div>

            <div style={{ background: `rgba(160,72,72,0.06)`, border: `1px solid ${MC}40`, borderLeft: `4px solid ${MC}`, padding: '18px 22px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MC_LIGHT, marginBottom: 12 }}>Médicaments sous contrôle médical</div>
              <RegPara>Les produits suivants ne peuvent être administrés qu'après validation d'un médecin :</RegPara>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REMEDIES_CONTROLE.map(r => (
                  <div key={r.nom} style={{ background: T.card, border: `1px solid ${MC}35`, borderLeft: `3px solid ${MC}`, padding: '12px 18px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 15, color: MC_LIGHT, minWidth: 200, flexShrink: 0 }}>{r.nom}</div>
                    <div style={{ flex: 1 }}><RegList items={r.usages} /></div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 12 }}>L'infirmier ne peut jamais modifier seul les doses prescrites.</div>
            </div>
          </div>

          {/* Chapitre IV */}
          <div id="inf-ch-IV" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="IV" title="DIAGNOSTIC INFIRMIER ET SUIVI" icon="📊" col={MC} />
            <RegPara>L'infirmier doit consigner :</RegPara>
            <RegList items={["Température.", "Pouls.", "Respiration.", "Évolution des blessures.", "Réactions aux médicaments.", "État moral du patient."]} />
            <RegPara>Le registre doit mentionner :</RegPara>
            <RegList items={["Date.", "Heure.", "Soins administrés.", "Médicaments utilisés.", "Observations."]} />
          </div>

          {/* Chapitre V */}
          <div id="inf-ch-V" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="V" title="SOINS AUTORISÉS AUX INFIRMIERS" icon="🩹" col={MC} />
            {[
              { titre: 'Blessures légères', intro: "L'infirmier peut :", items: ["Nettoyer une plaie superficielle.", "Poser un bandage simple.", "Appliquer un onguent.", "Désinfecter une blessure mineure."] },
              { titre: 'Affections courantes', intro: "L'infirmier peut traiter :", items: ["Fièvres légères.", "Rhumes.", "Toux simples.", "Fatigue passagère.", "Troubles digestifs bénins."] },
              { titre: 'Surveillance des malades', intro: "L'infirmier assure :", items: ["L'hydratation.", "Le repos du patient.", "La distribution des remèdes prescrits.", "La surveillance nocturne."] },
            ].map(cat => (
              <div key={cat.titre} style={{ marginBottom: 16, background: T.card, border: `1px solid ${MC}30`, borderLeft: `3px solid ${MC}`, padding: '14px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: MC_LIGHT, marginBottom: 8 }}>{cat.titre}</div>
                <RegPara>{cat.intro}</RegPara>
                <RegList items={cat.items} />
              </div>
            ))}
          </div>

          {/* Chapitre VI */}
          <div id="inf-ch-VI" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="VI" title="MATÉRIEL INFIRMIER" icon="🧰" col={MC} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: MC_LIGHT, marginBottom: 10 }}>Instruments</div>
                <RegList items={["Thermomètre.", "Stéthoscope.", "Compresses.", "Bandages.", "Attelles simples.", "Flacons de préparation.", "Mortier et pilon.", "Carnet de suivi."]} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: MC_LIGHT, marginBottom: 10 }}>Produits médicaux</div>
                <RegList items={["Eau Vulnéraire.", "Onguent Vulnéraire.", "Pommade Camphrée.", "Baume Résineux.", "Teinture Mère d'Échinacée.", "Décoction Fébrifuge.", "Sirop Pectoral.", "Décoction Expectorante.", "Macération de Panax.", "Vin Quinquiné."]} />
              </div>
            </div>
          </div>

          {/* Chapitre VII */}
          <div id="inf-ch-VII" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="VII" title="ÉTHIQUE ET DEVOIRS DE L'INFIRMIER" icon="⚖" col={MC} />
            <RegPara>L'infirmier s'engage à :</RegPara>
            <RegList items={["Respecter la dignité du patient.", "Préserver le secret médical.", "Signaler toute aggravation au médecin.", "Observer avec rigueur.", "Faire preuve de patience et de compassion.", "Respecter les prescriptions médicales."]} />
            <RegPara>Il doit se souvenir que sa mission première n'est pas seulement de soigner, mais également de rassurer, accompagner et soulager.</RegPara>
          </div>

          {/* Chapitre VIII */}
          <div id="inf-ch-VIII" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${MC}40`, borderTop: `3px solid ${MC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="VIII" title="MÉTHODE PÉDAGOGIQUE" icon="📖" col={MC} />
            <RegPara>L'enseignement infirmier repose sur :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { titre: 'Théorie',              items: ["Anatomie.", "Physiologie.", "Pharmacologie élémentaire.", "Hygiène."] },
                { titre: 'Pratique',             items: ["Soins des plaies.", "Préparation des remèdes.", "Surveillance des malades.", "Tenue des registres."] },
                { titre: 'Observation clinique', items: ["Études de cas.", "Accompagnement des médecins.", "Exercices de diagnostic infirmier."] },
              ].map(cat => (
                <div key={cat.titre} style={{ background: T.card, border: `1px solid ${MC}30`, borderTop: `2px solid ${MC}`, padding: '14px 18px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: MC_LIGHT, marginBottom: 10 }}>{cat.titre}</div>
                  <RegList items={cat.items} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, background: `rgba(160,72,72,0.06)`, border: `1px solid ${MC}40`, borderLeft: `4px solid ${MC}`, padding: '14px 20px' }}>
              <RegPara>Aucun infirmier ne sera autorisé à exercer seul tant qu'il n'aura pas démontré sa maîtrise des connaissances fondamentales et des règles du dispensaire.</RegPara>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Doctrine des Cataplasmes ── */

const CC = '#7A5830';
const CC_LIGHT = '#A07850';

const CATAPLASMES = [
  {
    id: 'A', nom: 'Cataplasme Purifiant', col: '#A8B991',
    usage:       ["Plaies infectées.", "Blessures souillées.", "Inflammations locales."],
    composition: ["Argile verte.", "Thym.", "Romarin.", "Miel.", "Vinaigre tiède."],
    effets:      ["Absorbe les impuretés.", "Assainit la plaie.", "Réduit l'inflammation."],
  },
  {
    id: 'B', nom: 'Cataplasme Cicatrisant', col: '#4878A8',
    usage:       ["Coupures.", "Sutures récentes.", "Brûlures légères.", "Cicatrisation difficile."],
    composition: ["Racine de consoude.", "Plantain.", "Miel.", "Infusion de sauge."],
    effets:      ["Favorise la régénération des tissus.", "Protège la peau.", "Accélère la cicatrisation."],
  },
  {
    id: 'C', nom: 'Cataplasme Calmant et Anti-Douleur', col: '#706888',
    usage:       ["Contusions.", "Douleurs musculaires.", "Courbatures.", "Sutures douloureuses."],
    composition: ["Camomille.", "Lavande.", "Argile blanche.", "Miel."],
    effets:      ["Soulage la douleur.", "Apaise les tensions musculaires.", "Favorise le repos."],
  },
  {
    id: 'D', nom: 'Cataplasme du Feu Apaisé', col: '#A04848',
    usage:       ["Brûlures.", "Rougeurs.", "Inflammations de la peau."],
    composition: ["Millepertuis.", "Argile blanche.", "Miel.", "Feuilles de plantain pilées."],
    effets:      ["Rafraîchit la peau.", "Limite l'inflammation.", "Favorise une cicatrisation propre."],
  },
  {
    id: 'E', nom: 'Cataplasme de la Fracture', col: '#7A5830',
    usage:       ["Fractures consolidées.", "Entorses.", "Douleurs osseuses."],
    composition: ["Consoude.", "Prêle.", "Romarin.", "Miel."],
    effets:      ["Accompagne la consolidation osseuse.", "Réduit les douleurs profondes.", "Favorise la récupération."],
  },
  {
    id: 'F', nom: 'Cataplasme de Dégorgement', col: '#507850',
    usage:       ["Abcès.", "Gonflements.", "Inflammations localisées."],
    composition: ["Argile verte.", "Charbon végétal.", "Feuilles de chou ou d'ortie.", "Infusion de thym."],
    effets:      ["Réduit l'enflure.", "Favorise le drainage.", "Limite la suppuration."],
  },
  {
    id: 'G', nom: 'Cataplasme du Cœur Calme', col: '#406880',
    usage:       ["Nervosité.", "Agitation.", "Insomnies.", "Fièvres nerveuses."],
    composition: ["Lavande.", "Valériane.", "Tilleul.", "Miel."],
    effets:      ["Apaise les nerfs.", "Favorise le sommeil.", "Réduit les palpitations liées à l'anxiété."],
  },
] as const;

const PLANTES_TABLE_FULL = [
  ["Thym",            "Purifiant",     "Aide à assainir les plaies"],
  ["Romarin",         "Régénérant",    "Favorise la récupération des tissus"],
  ["Sauge",           "Antiseptique",  "Assainit et protège les tissus"],
  ["Consoude",        "Réparatrice",   "Soutient la consolidation osseuse"],
  ["Plantain",        "Cicatrisant",   "Apaise et protège la peau"],
  ["Miel",            "Protecteur",    "Favorise la cicatrisation"],
  ["Argile verte",    "Absorbante",    "Draine les impuretés"],
  ["Camomille",       "Apaisante",     "Soulage douleurs et inflammations"],
  ["Lavande",         "Calmante",      "Favorise le repos et la détente"],
  ["Valériane",       "Sédative",      "Apaise les troubles nerveux"],
  ["Tilleul",         "Relaxant",      "Favorise le sommeil"],
  ["Charbon végétal", "Absorbant",     "Aide à assainir les tissus"],
] as const;

const PLANTES_TABLE_RESUME = [
  ["Thym",            "Assainissement des plaies"],
  ["Romarin",         "Régénération des tissus"],
  ["Sauge",           "Protection des tissus"],
  ["Consoude",        "Consolidation osseuse"],
  ["Plantain",        "Cicatrisation"],
  ["Camomille",       "Douleurs et inflammations"],
  ["Lavande",         "Repos et détente"],
  ["Valériane",       "Calme nerveux"],
  ["Tilleul",         "Sommeil et relaxation"],
  ["Argile verte",    "Absorption des impuretés"],
  ["Charbon végétal", "Drainage des tissus"],
  ["Miel",            "Protection et cicatrisation"],
] as const;

const tblCell: React.CSSProperties = { padding: '9px 14px', fontFamily: 'var(--body)', fontSize: 14, borderBottom: `1px solid ${CC}25`, color: '#C8B898', verticalAlign: 'top' };
const tblHead: React.CSSProperties = { ...tblCell, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', color: CC_LIGHT, background: `${CC}18`, paddingTop: 10, paddingBottom: 10 };

function CataplasmesTable({ cols, rows }: { cols: string[]; rows: readonly (readonly string[])[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${CC}35`, marginTop: 10 }}>
      <thead>
        <tr>{cols.map(c => <th key={c} style={tblHead}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : `${CC}08` }}>
            {row.map((cell, j) => (
              <td key={j} style={{ ...tblCell, fontFamily: j === 0 ? DISPLAY : BODY, color: j === 0 ? CC_LIGHT : '#C8B898', fontSize: j === 0 ? 15 : 14 }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CataplasmeCard({ cat, compact = false }: { cat: typeof CATAPLASMES[number]; compact?: boolean }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${cat.col}45`, borderTop: `3px solid ${cat.col}`, padding: compact ? '14px 18px' : '22px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: cat.col, background: `${cat.col}18`, border: `1px solid ${cat.col}40`, padding: '3px 10px', letterSpacing: '0.12em' }}>{cat.id}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: compact ? 17 : 20, color: cat.col }}>{cat.nom}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 14 }}>
        {[
          { label: 'USAGE', items: cat.usage },
          { label: 'COMPOSITION', items: cat.composition },
          { label: 'EFFETS', items: cat.effets },
        ].map(col => (
          <div key={col.label}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: cat.col, letterSpacing: '0.18em', marginBottom: 6 }}>{col.label}</div>
            <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'none' }}>
              {(col.items as readonly string[]).map((item, i) => (
                <li key={i} style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 2, position: 'relative', paddingLeft: 12 }}>
                  <span style={{ position: 'absolute', left: 0, color: cat.col, fontSize: 10, top: 4 }}>▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctrineCataplasmeDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${CC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${CC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${CC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${CC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${CC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: CC, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE MÉDECINE VÉGÉTALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: CC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🫙 Doctrine des Cataplasmes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>et de leur Usage Thérapeutique</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${CC}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${CC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${CC}28` : 'transparent', color: version === 'complete' ? CC_LIGHT : T.dim, borderRight: `1px solid ${CC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${CC}28` : 'transparent', color: version === 'resume' ? CC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${CC}50`}>
            <RegPara>Le cataplasme est un traitement externe utilisant des plantes médicinales, de l'argile ou d'autres substances naturelles appliquées directement sur la peau afin de soulager la douleur, réduire les inflammations et favoriser la guérison.</RegPara>
          </RegBlock>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={{ background: T.paper, border: `1px solid ${CC}30`, borderLeft: `3px solid ${CC}`, padding: '16px 20px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 17, color: CC_LIGHT, marginBottom: 10 }}>Règles fondamentales</div>
              <RegList items={["Utiliser du matériel propre.", "Se laver les mains.", "Employer de l'eau bouillie puis tiédie.", "Appliquer le cataplasme tiède, jamais brûlant.", "Nettoyer la peau entre chaque application."]} />
            </div>
            <div style={{ background: T.paper, border: `1px solid ${CC}30`, borderLeft: `3px solid ${CC}`, padding: '16px 20px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 17, color: CC_LIGHT, marginBottom: 10 }}>Durée habituelle</div>
              <RegList items={["Entre 15 et 30 minutes.", "Renouveler selon l'état du malade.", "Retirer avant dessèchement complet.", "Interrompre en cas d'irritation."]} />
            </div>
          </div>

          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: CC_LIGHT, marginBottom: 16, letterSpacing: '0.04em' }}>Les principaux cataplasmes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {CATAPLASMES.map(cat => <CataplasmeCard key={cat.id} cat={cat} compact />)}
          </div>

          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: CC_LIGHT, marginBottom: 12, letterSpacing: '0.04em' }}>Principales plantes à connaître</div>
          <CataplasmesTable cols={['Plante', 'Utilité']} rows={PLANTES_TABLE_RESUME} />

          <div style={{ marginTop: 28, background: `${CC}08`, border: `1px solid ${CC}40`, borderLeft: `4px solid ${CC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, color: CC_LIGHT, marginBottom: 10 }}>À retenir</div>
            <RegList items={["Chaque cataplasme possède un usage précis.", "Toujours respecter l'hygiène et la température d'application.", "Renouveler régulièrement les cataplasmes.", "Observer l'évolution du patient.", "Interrompre le traitement en cas d'irritation ou d'aggravation."]} />
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 10 }}>Le bon praticien choisit toujours le cataplasme adapté à la blessure plutôt que le remède le plus puissant.</div>
          </div>
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `${CC}08`, border: `1px solid ${CC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SECTIONS</span>
            {['Préambule','I','II','III','IV','V','Conclusion'].map(n => (
              <a key={n} href={`#cat-${n}`} style={{ fontFamily: MONO, fontSize: 11, color: CC, background: `${CC}15`, border: `1px solid ${CC}40`, padding: '3px 10px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>{n}</a>
            ))}
          </div>

          {/* Préambule */}
          <div id="cat-Préambule" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CC_LIGHT, letterSpacing: '0.22em', background: `${CC}18`, padding: '6px 16px', border: `1px solid ${CC}40` }}>PRÉAMBULE</div>
              <div style={{ flex: 1, height: 1, background: `${CC}35` }} />
            </div>
            <RegBlock col={`${CC}45`}>
              <RegPara>Le cataplasme figure parmi les plus anciens outils de la médecine. Employé depuis des générations par les guérisseurs, herboristes et praticiens, il permet d'appliquer directement sur la chair les propriétés de certaines plantes et substances naturelles.</RegPara>
              <RegPara>Le Dispensaire, fidèle à l'union du savoir traditionnel et des connaissances médicales modernes, enseigne l'art de préparer et d'utiliser les cataplasmes dans le traitement des blessures, inflammations et diverses affections du corps.</RegPara>
              <RegPara>Un cataplasme bien préparé peut soulager la douleur, favoriser la cicatrisation et accompagner le rétablissement du malade. Mal utilisé ou négligé, il peut au contraire retarder la guérison ou favoriser l'infection.</RegPara>
              <RegPara>Ainsi, tout soignant doit connaître la composition, la préparation et les indications de chaque cataplasme avant son emploi.</RegPara>
            </RegBlock>
          </div>

          {/* I. Règles générales */}
          <div id="cat-I" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CC}40`, borderTop: `3px solid ${CC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="I" title="DES RÈGLES GÉNÉRALES DU CATAPLASME" icon="📋" col={CC} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {[
                { titre: 'La propreté',          texte: "Le linge, les récipients et les mains du soignant doivent être propres. L'eau utilisée sera préalablement bouillie puis refroidie jusqu'à une température convenable." },
                { titre: 'La température',        texte: "La chaleur excessive brûle les tissus. Le froid excessif diminue l'efficacité du traitement. Le cataplasme doit être appliqué tiède, sans provoquer d'inconfort au patient." },
                { titre: "La durée d'application", texte: "La durée habituelle varie entre quinze et trente minutes selon l'affection traitée. Le cataplasme peut être renouvelé plusieurs fois par jour selon l'avis du médecin." },
                { titre: 'Le linge',              texte: "On privilégiera la toile de coton ou de lin propre. Le linge utilisé devra être lavé après chaque usage." },
                { titre: "L'attention du soignant", texte: "La préparation attentive et l'application rigoureuse participent directement à l'efficacité du traitement. Toute négligence peut compromettre les résultats." },
              ].map(r => (
                <div key={r.titre} style={{ background: T.card, border: `1px solid ${CC}30`, borderLeft: `3px solid ${CC}`, padding: '14px 18px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CC_LIGHT, marginBottom: 8 }}>{r.titre}</div>
                  <RegPara>{r.texte}</RegPara>
                </div>
              ))}
            </div>
          </div>

          {/* II. Classification */}
          <div id="cat-II" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CC}40`, borderTop: `3px solid ${CC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="II" title="CLASSIFICATION DES CATAPLASMES DU DISPENSAIRE" icon="🫙" col={CC} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {CATAPLASMES.map(cat => <CataplasmeCard key={cat.id} cat={cat} />)}
            </div>
          </div>

          {/* III. Durée et entretien */}
          <div id="cat-III" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CC}40`, borderTop: `3px solid ${CC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="III" title="DE LA DURÉE ET DE L'ENTRETIEN" icon="⏱" col={CC} />
            <RegList items={[
              "Les cataplasmes doivent être renouvelés régulièrement et retirés avant leur dessèchement complet.",
              "La peau devra être nettoyée entre chaque application à l'aide d'eau tiède ou d'une solution légèrement vinaigrée.",
              "Le linge utilisé devra être remplacé ou lavé après chaque emploi.",
              "Les cataplasmes purifiants ne doivent jamais être enfermés sous des tissus imperméables afin de permettre l'aération des tissus.",
              "Le traitement doit être adapté à l'évolution de l'état du malade et interrompu si une irritation apparaît.",
            ]} />
          </div>

          {/* IV. Tableau des plantes */}
          <div id="cat-IV" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CC}40`, borderTop: `3px solid ${CC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="IV" title="DES PRINCIPALES PLANTES DU DISPENSAIRE" icon="🌿" col={CC} />
            <CataplasmesTable cols={['Plante', 'Usage principal', 'Vertu reconnue']} rows={PLANTES_TABLE_FULL} />
          </div>

          {/* V. Principes */}
          <div id="cat-V" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CC}40`, borderTop: `3px solid ${CC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="V" title="DES PRINCIPES DU BON USAGE" icon="⚖" col={CC} />
            <RegPara>Chaque cataplasme doit être préparé avec soin, appliqué avec méthode et surveillé avec attention.</RegPara>
            <RegPara>Le soignant doit toujours observer les réactions du malade et adapter le traitement selon l'évolution de son état.</RegPara>
            <RegPara>Une plante mal préparée ou un pansement négligé peuvent compromettre la guérison autant qu'une blessure mal traitée.</RegPara>
            <RegPara>Le rôle du praticien est d'associer les ressources de la nature aux connaissances médicales de son temps afin d'offrir au malade le traitement le plus adapté.</RegPara>
          </div>

          {/* Conclusion */}
          <div id="cat-Conclusion" style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CC_LIGHT, letterSpacing: '0.22em', background: `${CC}18`, padding: '6px 16px', border: `1px solid ${CC}40` }}>CONCLUSION</div>
              <div style={{ flex: 1, height: 1, background: `${CC}35` }} />
            </div>
            <RegBlock col={`${CC}45`}>
              <RegPara>Le cataplasme demeure l'un des outils les plus précieux de la médecine végétale.</RegPara>
              <RegPara>Employé avec discernement, il permet de soulager la douleur, d'accompagner la cicatrisation et de favoriser le rétablissement du malade.</RegPara>
              <RegPara>Sous ses apparences simples se cache une discipline exigeant observation, patience et connaissance des plantes.</RegPara>
              <RegPara>Quiconque maîtrise l'art du cataplasme possède un savoir précieux, car il sait utiliser les ressources de la nature pour soutenir l'œuvre du médecin et le retour à la santé.</RegPara>
            </RegBlock>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Manuel de Médecine à Base de Plantes et de Pharmacologie Médicale ── */

const MMC = '#304870';
const MMC_LIGHT = '#5878A0';

const TRAITEMENTS = [
  ["Fièvres",              "Tilleul, Saule, Vin Quinquiné"],
  ["Douleurs légères",     "Saule, Valériane"],
  ["Douleurs sévères",     "Laudanum"],
  ["Toux persistante",     "Élixir Parégorique, Sirop Pectoral"],
  ["Troubles digestifs",   "Camomille, Menthe"],
  ["Infections légères",   "Thym, Échinacée"],
  ["Convalescence",        "Macération de Panax"],
  ["Plaies et blessures",  "Eau Vulnéraire"],
  ["Cicatrisation",        "Onguent Vulnéraire"],
  ["Douleurs musculaires", "Pommade Camphrée"],
  ["Inflammations locales","Baume Résineux"],
  ["Brûlures",             "Millepertuis, Plantain"],
] as const;

function MedTable({ rows }: { rows: readonly (readonly string[])[] }) {
  const hStyle: React.CSSProperties = { padding: '9px 14px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: MMC_LIGHT, background: `${MMC}20`, borderBottom: `1px solid ${MMC}40`, textAlign: 'left' };
  const tdStyle: React.CSSProperties = { padding: '9px 14px', fontFamily: BODY, fontSize: 14, color: '#EADCB9', borderBottom: `1px solid ${MMC}20`, verticalAlign: 'top' };
  const td0Style: React.CSSProperties = { ...tdStyle, fontFamily: DISPLAY, fontSize: 15, color: MMC_LIGHT };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${MMC}35`, marginTop: 10 }}>
      <thead><tr><th style={hStyle}>AFFECTION</th><th style={hStyle}>TRAITEMENT PRINCIPAL</th></tr></thead>
      <tbody>
        {rows.map(([a, t], i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : `${MMC}08` }}>
            <td style={td0Style}>{a}</td>
            <td style={tdStyle}>{t}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ManuelMedecinDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const chapterBlock = (id: string, children: React.ReactNode) => (
    <div id={id} style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MMC}40`, borderTop: `3px solid ${MMC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );

  const subSection = (titre: string, content: React.ReactNode) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MMC_LIGHT, marginBottom: 10 }}>{titre}</div>
      {content}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${MMC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${MMC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${MMC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${MMC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${MMC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: MMC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ FORMATION MÉDICALE SUPÉRIEURE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: MMC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🩺 Manuel de Médecine à Base de Plantes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>et de Pharmacologie Médicale</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${MMC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${MMC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${MMC}30` : 'transparent', color: version === 'complete' ? MMC_LIGHT : T.dim, borderRight: `1px solid ${MMC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${MMC}30` : 'transparent', color: version === 'resume' ? MMC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          {/* Connaissances fondamentales */}
          <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MMC}35`, borderTop: `3px solid ${MMC}`, padding: '22px 26px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: MMC_LIGHT, marginBottom: 18 }}>Connaissances fondamentales</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { titre: 'Anatomie',    items: ["Système circulatoire.", "Système respiratoire.", "Appareil digestif.", "Système nerveux.", "Muscles, os et articulations."] },
                { titre: 'Physiologie', items: ["Température corporelle.", "Pouls.", "Respiration.", "Digestion.", "Hydratation.", "Réflexes."] },
                { titre: 'Pathologie',  items: ["Tuberculose.", "Typhoïde.", "Diphtérie.", "Pneumonie.", "Choléra.", "Syphilis.", "Grippe.", "Fièvres diverses."] },
              ].map(s => (
                <div key={s.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderLeft: `3px solid ${MMC}`, padding: '12px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: MMC_LIGHT, marginBottom: 8 }}>{s.titre}</div>
                  <RegList items={s.items} />
                </div>
              ))}
            </div>
          </div>

          {/* Hygiène */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${MMC}35`, borderLeft: `4px solid ${MMC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MMC_LIGHT, marginBottom: 10 }}>Hygiène et microbiologie</div>
            <RegPara>Les travaux de Pasteur et de Koch ont démontré le rôle des microbes dans la transmission des maladies. L'antisepsie est désormais une obligation médicale.</RegPara>
            <RegList items={["Se laver les mains.", "Désinfecter les instruments.", "Faire bouillir l'eau utilisée pour les soins.", "Maintenir les locaux propres.", "Isoler les malades contagieux."]} />
          </div>

          {/* Pharmacologie */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${MMC}35`, borderTop: `3px solid ${MMC}`, padding: '22px 26px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: MMC_LIGHT, marginBottom: 16 }}>Pharmacologie du Dispensaire</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { titre: 'Remèdes végétaux',        col: '#A8B991', items: ["Tilleul.", "Saule.", "Camomille.", "Menthe.", "Thym.", "Consoude.", "Millepertuis.", "Valériane.", "Échinacée.", "Panax."] },
                { titre: 'Préparations médicales',  col: '#7A5830', items: ["Laudanum.", "Élixir Parégorique.", "Vin Quinquiné.", "Eau Vulnéraire.", "Onguent Vulnéraire.", "Pommade Camphrée.", "Baume Résineux."] },
                { titre: 'Produits modernes',       col: '#604878', items: ["Quinine.", "Chloroforme.", "Éther.", "Acide phénique.", "Teinture d'iode."] },
              ].map(cat => (
                <div key={cat.titre} style={{ background: T.card, border: `1px solid ${cat.col}40`, borderLeft: `3px solid ${cat.col}`, padding: '12px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: cat.col === '#A8B991' ? '#8AAA70' : cat.col === '#7A5830' ? '#A07850' : '#9878B8', marginBottom: 8 }}>{cat.titre}</div>
                  <RegList items={cat.items} />
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${MMC}35`, borderTop: `3px solid ${MMC}`, padding: '22px 26px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: MMC_LIGHT, marginBottom: 16 }}>Diagnostic médical</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { titre: 'Observation', items: ["Peau.", "Yeux.", "Langue.", "Fatigue.", "Démarche."] },
                { titre: 'Palpation',   items: ["Douleurs.", "Gonflements.", "Fractures."] },
                { titre: 'Auscultation',items: ["Cœur.", "Poumons."] },
                { titre: 'Examens',     items: ["Urines.", "Expectorations.", "Selles.", "Sécrétions."] },
              ].map(d => (
                <div key={d.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderLeft: `3px solid ${MMC}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, marginBottom: 8 }}>{d.titre}</div>
                  <RegList items={d.items} />
                </div>
              ))}
            </div>
          </div>

          {/* Traitements */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: MMC_LIGHT, marginBottom: 12 }}>Traitements principaux</div>
            <MedTable rows={TRAITEMENTS} />
          </div>

          {/* Matériel */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${MMC}35`, borderTop: `3px solid ${MMC}`, padding: '22px 26px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 21, color: MMC_LIGHT, marginBottom: 16 }}>Matériel essentiel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { titre: 'Diagnostic',  items: ["Stéthoscope.", "Thermomètre.", "Microscope simple.", "Spéculum.", "Otoscope."] },
                { titre: 'Chirurgie',   items: ["Scalpel.", "Pinces.", "Ciseaux."] },
                { titre: 'Pharmacie',   items: ["Mortier et pilon.", "Flacons.", "Pipettes.", "Fioles graduées."] },
                { titre: 'Hygiène',     items: ["Compresses.", "Bandages.", "Eau bouillie.", "Alcool.", "Vinaigre.", "Acide phénique."] },
              ].map(m => (
                <div key={m.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderLeft: `3px solid ${MMC}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, marginBottom: 8 }}>{m.titre}</div>
                  <RegList items={m.items} />
                </div>
              ))}
            </div>
          </div>

          {/* Éthique */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${MMC}35`, borderLeft: `4px solid ${MMC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MMC_LIGHT, marginBottom: 10 }}>Éthique du médecin</div>
            <RegList items={["Respecter ses patients.", "Préserver le secret médical.", "Obtenir l'accord du malade lorsque cela est possible.", "Tenir des registres précis.", "Utiliser les traitements avec prudence.", "Maintenir ses connaissances à jour."]} />
          </div>

          {/* À retenir */}
          <div style={{ background: `${MMC}08`, border: `1px solid ${MMC}40`, borderLeft: `4px solid ${MMC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MMC_LIGHT, marginBottom: 10 }}>À retenir</div>
            <RegPara>Le médecin de 1890 ne se limite plus aux plantes médicinales. Il doit savoir associer :</RegPara>
            <RegList items={["La médecine végétale.", "Les médicaments modernes.", "Les règles d'hygiène de Pasteur et Lister.", "L'observation clinique.", "L'expérience pratique."]} />
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 10 }}>Un bon médecin n'est pas celui qui connaît le plus de remèdes, mais celui qui sait choisir le traitement le plus adapté à chaque malade.</div>
          </div>
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* En-tête Partie I */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 15, color: MMC_LIGHT, letterSpacing: '0.22em', background: `${MMC}18`, padding: '8px 20px', border: `1px solid ${MMC}45` }}>PARTIE I</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.sepia }}>Médecins : Fondamentaux et Traitements</div>
            <div style={{ flex: 1, height: 1, background: `${MMC}35` }} />
          </div>

          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `${MMC}08`, border: `1px solid ${MMC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>CHAPITRES</span>
            {['I','II','III','IV','V','VI','VII'].map(n => (
              <a key={n} href={`#med-ch-${n}`} style={{ fontFamily: MONO, fontSize: 11, color: MMC_LIGHT, background: `${MMC}15`, border: `1px solid ${MMC}40`, padding: '3px 10px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>{n}</a>
            ))}
          </div>

          {/* Ch. I */}
          {chapterBlock('med-ch-I', <>
            <RegSectionHeader num="I" title="OBJECTIF DU MANUEL" icon="📋" col={MMC_LIGHT} />
            <RegPara>Le présent manuel a pour objectif de former les médecins du Dispensaire à l'art de diagnostiquer, traiter et prévenir les maladies en associant les connaissances de la médecine moderne aux ressources éprouvées de la médecine végétale.</RegPara>
            <RegPara>Le praticien devra savoir observer, raisonner, prescrire et adapter ses traitements selon l'état du malade, tout en tenant un registre précis de ses observations.</RegPara>
            <RegPara>La médecine repose autant sur la science que sur l'expérience du médecin.</RegPara>
          </>)}

          {/* Ch. II */}
          {chapterBlock('med-ch-II', <>
            <RegSectionHeader num="II" title="SCIENCES FONDAMENTALES" icon="🔬" col={MMC_LIGHT} />

            {subSection('1. Anatomie', <>
              <RegPara>Le médecin doit posséder une connaissance approfondie du corps humain.</RegPara>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { sys: 'Système circulatoire',  items: ["Cœur.", "Artères.", "Veines.", "Capillaires.", "Observation du pouls et des hémorragies."] },
                  { sys: 'Système respiratoire',  items: ["Poumons.", "Trachée.", "Bronches.", "Diaphragme."] },
                  { sys: 'Appareil digestif',     items: ["Estomac.", "Foie.", "Intestins.", "Rate."] },
                  { sys: 'Système nerveux',       items: ["Cerveau.", "Moelle épinière.", "Nerfs périphériques."] },
                  { sys: 'Tissus externes',        items: ["Peau.", "Muscles.", "Os.", "Articulations."] },
                ].map(s => (
                  <div key={s.sys} style={{ background: T.card, border: `1px solid ${MMC}30`, borderLeft: `3px solid ${MMC}`, padding: '12px 14px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, marginBottom: 8 }}>{s.sys}</div>
                    <RegList items={s.items} />
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 12 }}>La dissection demeure l'un des meilleurs moyens d'acquérir une connaissance anatomique précise.</div>
            </>)}

            {subSection('2. Physiologie', <>
              <RegPara>Le médecin doit comprendre le fonctionnement normal du corps. Il surveille :</RegPara>
              <RegList items={["Température corporelle.", "Pouls.", "Respiration.", "Digestion.", "Hydratation.", "État de conscience.", "Réflexes."]} />
              <RegPara>L'étude de la physiologie permet de reconnaître rapidement toute anomalie.</RegPara>
            </>)}

            {subSection('3. Pathologie Générale', <>
              <RegPara>Le médecin doit connaître les maladies infectieuses, les affections respiratoires, les maladies digestives, les traumatismes, les troubles nerveux et les maladies chroniques.</RegPara>
              <RegPara>Les principales affections rencontrées en 1890 sont :</RegPara>
              <RegList items={["Tuberculose.", "Typhoïde.", "Diphtérie.", "Pneumonie.", "Choléra.", "Syphilis.", "Grippe.", "Fièvres diverses."]} />
            </>)}

            {subSection('4. Microbiologie et Hygiène', <>
              <RegPara>Les travaux récents de Pasteur et de Koch ont démontré l'importance des microbes dans la propagation de nombreuses maladies.</RegPara>
              <RegPara>Le médecin doit :</RegPara>
              <RegList items={["Se laver les mains avant chaque intervention.", "Désinfecter les instruments.", "Faire bouillir l'eau utilisée pour les soins.", "Nettoyer régulièrement les salles.", "Isoler les malades contagieux."]} />
              <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 8 }}>L'antisepsie constitue désormais une composante essentielle de la médecine moderne.</div>
            </>)}

            {subSection('5. Pharmacologie Végétale et Pharmaceutique', <>
              <RegPara>Le médecin doit connaître :</RegPara>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { titre: 'Remèdes végétaux',        col: '#A8B991', colL: '#8AAA70', items: ["Tilleul.", "Saule.", "Camomille.", "Menthe.", "Thym.", "Consoude.", "Millepertuis.", "Valériane.", "Échinacée.", "Panax."] },
                  { titre: 'Préparations médicales',  col: '#7A5830', colL: '#A07850', items: ["Laudanum.", "Élixir Parégorique.", "Vin Quinquiné.", "Eau Vulnéraire.", "Onguent Vulnéraire.", "Pommade Camphrée.", "Baume Résineux."] },
                  { titre: 'Agents médicaux modernes',col: '#604878', colL: '#9878B8', items: ["Quinine.", "Chloroforme.", "Éther.", "Acide phénique.", "Teinture d'iode."] },
                ].map(cat => (
                  <div key={cat.titre} style={{ background: T.card, border: `1px solid ${cat.col}45`, borderLeft: `3px solid ${cat.col}`, padding: '14px 18px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 15, color: cat.colL, marginBottom: 10 }}>{cat.titre}</div>
                    <RegList items={cat.items} />
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 12 }}>Le dosage doit toujours être adapté à l'âge, à la constitution et à l'état général du malade.</div>
            </>)}
          </>)}

          {/* Ch. III */}
          {chapterBlock('med-ch-III', <>
            <RegSectionHeader num="III" title="DIAGNOSTIC" icon="🔍" col={MMC_LIGHT} />
            <RegPara>Le diagnostic repose sur :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { titre: 'Observation',         items: ["Couleur de la peau.", "État des yeux.", "Aspect de la langue.", "Démarche.", "Fatigue."] },
                { titre: 'Palpation',           items: ["Douleurs.", "Gonflements.", "Fractures.", "Température locale."] },
                { titre: 'Auscultation',        items: ["Poumons.", "Cœur."] },
                { titre: 'Analyse des antécédents', items: ["Maladies passées.", "Blessures anciennes.", "Habitudes de vie."] },
                { titre: 'Examens simples',     items: ["Urines.", "Expectorations.", "Selles.", "Sécrétions."] },
              ].map(d => (
                <div key={d.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderLeft: `3px solid ${MMC}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, marginBottom: 8 }}>{d.titre}</div>
                  <RegList items={d.items} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic' }}>Tout diagnostic doit être consigné dans les registres du dispensaire.</div>
          </>)}

          {/* Ch. IV */}
          {chapterBlock('med-ch-IV', <>
            <RegSectionHeader num="IV" title="TRAITEMENTS AUTORISÉS" icon="💊" col={MMC_LIGHT} />
            <MedTable rows={TRAITEMENTS} />
            <div style={{ marginTop: 18, background: `${MMC}08`, border: `1px solid ${MMC}35`, borderLeft: `4px solid ${MMC}`, padding: '14px 18px' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: MMC_LIGHT, letterSpacing: '0.18em', marginBottom: 8 }}>DEVOIR DU PRATICIEN</div>
              <RegList items={["Adapter le traitement.", "Surveiller le malade.", "Réévaluer régulièrement l'évolution.", "Modifier les prescriptions si nécessaire."]} />
            </div>
          </>)}

          {/* Ch. V */}
          {chapterBlock('med-ch-V', <>
            <RegSectionHeader num="V" title="MATÉRIEL DU MÉDECIN" icon="🧰" col={MMC_LIGHT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              {[
                { titre: 'Instruments de diagnostic', items: ["Stéthoscope.", "Thermomètre.", "Spéculum.", "Otoscope.", "Microscope simple.", "Loupes médicales.", "Scalpel.", "Pinces.", "Ciseaux chirurgicaux."] },
                { titre: 'Matériel pharmaceutique',  items: ["Mortier et pilon.", "Filtres.", "Flacons.", "Pipettes.", "Fioles graduées.", "Pots à onguents."] },
                { titre: "Matériel d'hygiène",       items: ["Linges propres.", "Compresses.", "Bandages.", "Eau bouillie.", "Alcool.", "Vinaigre.", "Acide phénique."] },
              ].map(m => (
                <div key={m.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderTop: `2px solid ${MMC}`, padding: '14px 18px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: MMC_LIGHT, marginBottom: 10 }}>{m.titre}</div>
                  <RegList items={m.items} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic' }}>Instruments spécialisés : appareil de mesure de la pression artérielle (rare), matériel d'anesthésie à l'éther ou au chloroforme.</div>
          </>)}

          {/* Ch. VI */}
          {chapterBlock('med-ch-VI', <>
            <RegSectionHeader num="VI" title="ÉTHIQUE ET DÉONTOLOGIE" icon="⚖" col={MMC_LIGHT} />
            <RegPara>Le médecin s'engage à :</RegPara>
            <RegList items={["Respecter chaque patient.", "Préserver le secret médical.", "Obtenir l'accord du malade lorsque son état le permet.", "Consigner fidèlement ses observations.", "Utiliser les traitements avec prudence.", "Maintenir ses connaissances à jour."]} />
            <div style={{ marginTop: 12, padding: '14px 18px', background: `${MMC}08`, border: `1px solid ${MMC}35`, borderLeft: `4px solid ${MMC}` }}>
              <RegPara>Le médecin ne promet jamais la guérison, mais doit toujours poursuivre le soulagement et le bien-être du malade.</RegPara>
            </div>
          </>)}

          {/* Ch. VII */}
          {chapterBlock('med-ch-VII', <>
            <RegSectionHeader num="VII" title="MÉTHODE PÉDAGOGIQUE" icon="📖" col={MMC_LIGHT} />
            <RegPara>L'enseignement médical repose sur quatre piliers :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              {[
                { titre: 'Théorie',             items: ["Anatomie.", "Physiologie.", "Pathologie.", "Pharmacologie."] },
                { titre: 'Observation clinique',items: ["Auscultation.", "Palpation.", "Diagnostic."] },
                { titre: 'Pratique médicale',   items: ["Préparation des remèdes.", "Utilisation des médicaments.", "Traitement des plaies.", "Antisepsie."] },
                { titre: 'Études de cas',        items: ["Fièvres.", "Blessures.", "Infections.", "Troubles digestifs.", "Troubles nerveux.", "Accidents de chasse ou de cheval."] },
              ].map(p => (
                <div key={p.titre} style={{ background: T.card, border: `1px solid ${MMC}30`, borderTop: `2px solid ${MMC}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, marginBottom: 8 }}>{p.titre}</div>
                  <RegList items={p.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* Conclusion */}
          <div id="med-Conclusion" style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MMC_LIGHT, letterSpacing: '0.22em', background: `${MMC}18`, padding: '6px 16px', border: `1px solid ${MMC}40` }}>CONCLUSION</div>
              <div style={{ flex: 1, height: 1, background: `${MMC}35` }} />
            </div>
            <RegBlock col={`${MMC}45`}>
              <RegPara>Le médecin de 1890 ne se limite plus à la simple connaissance des plantes. Il doit maîtriser les progrès récents de la médecine, comprendre les maladies, appliquer les règles d'hygiène modernes et utiliser avec discernement les ressources de la pharmacologie comme celles de la nature.</RegPara>
              <RegPara>La compétence d'un praticien ne se mesure pas seulement à son savoir, mais également à sa capacité d'observer, de comprendre et d'adapter ses soins aux besoins de chaque malade.</RegPara>
            </RegBlock>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Cours de Médecine Générale ── */

const GMC = '#6A7830';
const GMC_LIGHT = '#9AAA50';

const AFFECTIONS = [
  {
    num: 'I', nom: 'Abcès', col: '#A04848',
    symptomes: ["Gonflement douloureux.", "Rougeur.", "Chaleur locale.", "Fièvre éventuelle.", "Présence de pus."],
    traitement: ["Cataplasme Purifiant à base d'argile verte, thym et romarin.", "Nettoyage à l'eau bouillie.", "Désinfection à l'Eau Vulnéraire.", "Application de miel et de sauge après drainage."],
    chirurgie: ["Incision au bistouri désinfecté.", "Évacuation complète du pus.", "Nettoyage de la cavité.", "Pansement quotidien."],
    chirurgieNote: "Lorsque l'abcès ne s'ouvre pas naturellement.",
  },
  {
    num: 'II', nom: 'Piqûres et Morsures', col: '#786040',
    symptomes: ["Douleur.", "Rougeur.", "Gonflement.", "Fièvre éventuelle."],
    traitement: ["Plantain écrasé (piqûres).", "Vinaigre froid (piqûres).", "Cataplasme de lavande et argile (piqûres).", "Lavage immédiat à l'eau bouillie (morsures).", "Désinfection à l'Eau Vulnéraire.", "Application de miel et d'ail."],
    chirurgie: ["En cas d'infection profonde, nécrose ou gangrène uniquement."],
    complement: "Les morsures suspectes nécessitent une surveillance médicale prolongée.",
  },
  {
    num: 'III', nom: 'Ampoules', col: '#7A5830',
    symptomes: ["Cloque remplie de liquide.", "Douleur au frottement."],
    traitement: ["Ne pas percer inutilement.", "Nettoyer si ouverture naturelle.", "Protection par linge propre.", "Application de miel et lavande."],
    chirurgie: null,
  },
  {
    num: 'IV', nom: 'Anémie (Faiblesse du Sang)', col: '#606880',
    symptomes: ["Fatigue.", "Pâleur.", "Essoufflement.", "Étourdissements."],
    traitement: ["Ortie.", "Prêle.", "Romarin.", "Alimentation riche.", "Bouillons nutritifs.", "Repos."],
    complement: "Le Vin Quinquiné peut être administré lors des convalescences prolongées.",
    chirurgie: null,
  },
  {
    num: 'V', nom: 'Maux de Gorge', col: '#A8B991',
    symptomes: ["Douleur.", "Difficulté à avaler.", "Toux.", "Fièvre légère."],
    traitement: ["Gargarismes de sauge et miel.", "Infusion de thym.", "Cataplasme tiède sur le cou."],
    complement: "Sirop Pectoral pour toux persistante. Élixir Parégorique sur prescription médicale.",
    chirurgie: ["Drainage d'abcès amygdalien si nécessaire."],
  },
  {
    num: 'VI', nom: 'Apoplexie', col: '#486880',
    symptomes: ["Paralysie soudaine.", "Difficulté à parler.", "Chute brutale.", "Altération de la conscience."],
    conduite: ["Maintenir la tête légèrement surélevée.", "Dégager les vêtements.", "Assurer une bonne ventilation.", "Observer les fonctions vitales."],
    chirurgie: null,
  },
  {
    num: 'VII', nom: 'Asphyxie', col: '#704840',
    symptomes: ["Difficulté respiratoire sévère.", "Cyanose.", "Inconscience."],
    conduite: ["Libérer les voies respiratoires.", "Ouvrir les vêtements.", "Maintenir l'apport d'air frais.", "Pratiquer la respiration artificielle si nécessaire."],
    chirurgie: ["Extraction d'un corps étranger si visible."],
  },
  {
    num: 'VIII', nom: 'Asthme', col: '#488870',
    symptomes: ["Respiration sifflante.", "Oppression thoracique.", "Toux sèche."],
    traitement: ["Infusion de thym.", "Plantain.", "Eucalyptus.", "Cataplasme chaud sur la poitrine."],
    conduite: ["Éviter la poussière.", "Aérer les pièces.", "Éviter les fumées."],
    chirurgie: null,
    complement: "Surveillance médicale constante dans les cas sévères.",
  },
  {
    num: 'IX', nom: 'Bronchite', col: '#5A7060',
    symptomes: ["Toux grasse.", "Expectorations.", "Fièvre modérée."],
    traitement: ["Sirop Pectoral.", "Infusion de thym.", "Guimauve.", "Sauge."],
    complement: "L'Élixir Parégorique peut être administré pour calmer la toux persistante.",
    chirurgie: null,
  },
  {
    num: 'X', nom: 'Brûlures', col: '#A06030',
    symptomes: ["Rougeur.", "Douleur.", "Cloques.", "Atteinte des tissus."],
    traitement: ["Refroidissement immédiat à l'eau.", "Cataplasme de millepertuis.", "Plantain.", "Miel."],
    complement: "Application d'Onguent Vulnéraire pour favoriser la cicatrisation.",
    chirurgie: ["Retrait des tissus morts en cas de brûlure sévère."],
  },
] as const;

const REMEDES_GEN = [
  { nom: 'Laudanum',          col: '#A04848', usages: ["Douleurs sévères.", "Agitation importante.", "Insomnies graves."] },
  { nom: 'Élixir Parégorique', col: '#786040', usages: ["Toux persistante.", "Irritations respiratoires.", "Douleurs modérées."] },
  { nom: 'Vin Quinquiné',     col: '#606880', usages: ["Fatigue.", "Fièvres prolongées.", "Convalescence."] },
  { nom: 'Eau Vulnéraire',    col: '#A8B991', usages: ["Nettoyer les plaies.", "Prévenir les infections."] },
  { nom: 'Onguent Vulnéraire', col: '#4878A8', usages: ["Favoriser la cicatrisation.", "Protéger les tissus lésés."] },
  { nom: 'Pommade Camphrée',  col: '#7A5830', usages: ["Douleurs musculaires.", "Entorses.", "Contusions."] },
  { nom: 'Baume Résineux',    col: '#488070', usages: ["Inflammations locales.", "Irritations de la peau.", "Douleurs articulaires."] },
] as const;

function AffectionBlock({ aff, compact }: { aff: typeof AFFECTIONS[number]; compact?: boolean }) {
  const a = aff as any;
  return (
    <div style={{ background: T.paper, border: `1px solid ${a.col}40`, borderLeft: `4px solid ${a.col}`, padding: compact ? '14px 18px' : '20px 24px', marginBottom: compact ? 10 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: a.col, background: `${a.col}18`, border: `1px solid ${a.col}40`, padding: '3px 8px', letterSpacing: '0.1em', flexShrink: 0 }}>{a.num}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: compact ? 17 : 20, color: a.col }}>{a.nom}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {a.symptomes && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: a.col, letterSpacing: '0.16em', marginBottom: 5 }}>SYMPTÔMES</div>
            <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'none' }}>
              {(a.symptomes as string[]).map((s: string, i: number) => <li key={i} style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, position: 'relative', paddingLeft: 10 }}><span style={{ position: 'absolute', left: 0, color: a.col, fontSize: 9, top: 4 }}>▸</span>{s}</li>)}
            </ul>
          </div>
        )}
        {(a.traitement || a.conduite) && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: a.col, letterSpacing: '0.16em', marginBottom: 5 }}>{a.conduite && !a.traitement ? 'CONDUITE' : 'TRAITEMENT'}</div>
            <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'none' }}>
              {((a.traitement ?? a.conduite) as string[]).map((s: string, i: number) => <li key={i} style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, position: 'relative', paddingLeft: 10 }}><span style={{ position: 'absolute', left: 0, color: a.col, fontSize: 9, top: 4 }}>▸</span>{s}</li>)}
            </ul>
            {a.conduite && a.traitement && (
              <><div style={{ fontFamily: MONO, fontSize: 10, color: a.col, letterSpacing: '0.16em', marginBottom: 5, marginTop: 8 }}>RECOMMANDATIONS</div>
              <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'none' }}>
                {(a.conduite as string[]).map((s: string, i: number) => <li key={i} style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, position: 'relative', paddingLeft: 10 }}><span style={{ position: 'absolute', left: 0, color: a.col, fontSize: 9, top: 4 }}>▸</span>{s}</li>)}
              </ul></>
            )}
          </div>
        )}
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: a.col, letterSpacing: '0.16em', marginBottom: 5 }}>CHIRURGIE</div>
          {a.chirurgie ? (
            <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'none' }}>
              {(a.chirurgie as string[]).map((s: string, i: number) => <li key={i} style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, position: 'relative', paddingLeft: 10 }}><span style={{ position: 'absolute', left: 0, color: a.col, fontSize: 9, top: 4 }}>▸</span>{s}</li>)}
            </ul>
          ) : (
            <span style={{ fontFamily: BODY, fontSize: 13, color: T.dim, fontStyle: 'italic' }}>Aucune.</span>
          )}
          {a.chirurgieNote && <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, fontStyle: 'italic', margin: '6px 0 0' }}>{a.chirurgieNote}</p>}
        </div>
      </div>
      {a.complement && !compact && (
        <div style={{ marginTop: 10, padding: '8px 14px', background: `${a.col}08`, borderLeft: `2px solid ${a.col}50`, fontFamily: BODY, fontSize: 13, color: T.muted, fontStyle: 'italic' }}>{a.complement}</div>
      )}
    </div>
  );
}

function MedecineGeneraleDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${GMC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${GMC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${GMC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${GMC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${GMC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: GMC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE MÉDECINE GÉNÉRALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: GMC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>📋 Traitement des Affections Communes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>et leurs Remèdes</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${GMC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${GMC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${GMC}28` : 'transparent', color: version === 'complete' ? GMC_LIGHT : T.dim, borderRight: `1px solid ${GMC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${GMC}28` : 'transparent', color: version === 'resume' ? GMC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${GMC}50`}>
            <RegPara>La médecine générale constitue la base de toute pratique médicale. Elle permet au médecin d'identifier, traiter et surveiller les maladies et blessures les plus fréquentes rencontrées au sein du Dispensaire.</RegPara>
          </RegBlock>

          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: GMC_LIGHT, marginBottom: 14, marginTop: 10, letterSpacing: '0.04em' }}>Affections courantes et traitements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {AFFECTIONS.map(aff => <AffectionBlock key={aff.num} aff={aff} compact />)}
          </div>

          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: GMC_LIGHT, marginBottom: 14, letterSpacing: '0.04em' }}>Remèdes modernes du Dispensaire</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 28 }}>
            {REMEDES_GEN.map(r => (
              <div key={r.nom} style={{ background: T.card, border: `1px solid ${r.col}40`, borderLeft: `3px solid ${r.col}`, padding: '12px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: r.col === '#A04848' ? '#C07878' : r.col === '#4878A8' ? '#7AA8C8' : r.col === '#488070' ? '#70A898' : '#C0A870', marginBottom: 8 }}>{r.nom}</div>
                <RegList items={r.usages as unknown as string[]} />
              </div>
            ))}
          </div>

          <div style={{ background: `${GMC}08`, border: `1px solid ${GMC}40`, borderLeft: `4px solid ${GMC}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: GMC_LIGHT, marginBottom: 10 }}>Principes fondamentaux</div>
            <RegList items={["Maintenir une hygiène rigoureuse.", "Observer attentivement les symptômes.", "Adapter le traitement à chaque malade.", "Associer médecine végétale et médecine moderne.", "Réserver la chirurgie aux situations nécessaires.", "Toujours surveiller l'évolution du patient."]} />
            <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, fontStyle: 'italic', marginTop: 10 }}>Le médecin de 1890 doit savoir combiner les remèdes traditionnels, les médicaments modernes, les principes d'hygiène de Pasteur et l'observation clinique afin d'offrir le traitement le plus adapté à chaque patient.</div>
          </div>
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `${GMC}08`, border: `1px solid ${GMC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SECTIONS</span>
            {['Prémb','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'].map(n => (
              <a key={n} href={`#gm-${n}`} style={{ fontFamily: MONO, fontSize: 11, color: GMC_LIGHT, background: `${GMC}15`, border: `1px solid ${GMC}40`, padding: '3px 8px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>{n}</a>
            ))}
          </div>

          {/* Préambule */}
          <div id="gm-Prémb" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: GMC_LIGHT, letterSpacing: '0.22em', background: `${GMC}18`, padding: '6px 16px', border: `1px solid ${GMC}40` }}>PRÉAMBULE</div>
              <div style={{ flex: 1, height: 1, background: `${GMC}35` }} />
            </div>
            <RegBlock col={`${GMC}45`}>
              <RegPara>La médecine générale constitue le fondement de l'art médical. Elle ne s'intéresse pas seulement aux grandes épidémies ou aux blessures graves, mais également aux affections quotidiennes qui touchent la population.</RegPara>
              <RegPara>Au Dispensaire, tout médecin doit savoir reconnaître les maladies les plus fréquentes, en comprendre les causes, soulager les symptômes et déterminer le moment où une intervention plus importante devient nécessaire.</RegPara>
              <RegPara>La médecine moderne repose désormais sur l'observation, l'hygiène, les connaissances scientifiques récentes et l'emploi raisonné des remèdes naturels comme des préparations pharmaceutiques.</RegPara>
            </RegBlock>
          </div>

          {/* Affections I–X */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {AFFECTIONS.map(aff => (
              <div key={aff.num} id={`gm-${aff.num}`}>
                <AffectionBlock aff={aff} />
              </div>
            ))}
          </div>

          {/* XI. Principes généraux */}
          <div id="gm-XI" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${GMC}40`, borderTop: `3px solid ${GMC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="XI" title="PRINCIPES GÉNÉRAUX DU DISPENSAIRE" icon="⚖" col={GMC_LIGHT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { titre: 'Hygiène',     texte: "L'air sain, l'eau propre et la propreté des locaux constituent les premières défenses contre la maladie." },
                { titre: 'Observation', texte: "Toute douleur ou anomalie doit être étudiée avant d'être traitée." },
                { titre: 'Traitement',  texte: "La médecine végétale et la médecine moderne se complètent. Le praticien emploie le traitement le plus adapté à l'état du malade." },
                { titre: 'Chirurgie',   texte: "La chirurgie demeure un dernier recours lorsque les traitements conservateurs ne suffisent plus." },
              ].map(p => (
                <div key={p.titre} style={{ background: T.card, border: `1px solid ${GMC}30`, borderTop: `2px solid ${GMC}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: GMC_LIGHT, marginBottom: 8 }}>{p.titre}</div>
                  <RegPara>{p.texte}</RegPara>
                </div>
              ))}
            </div>
          </div>

          {/* XII. Remèdes modernes */}
          <div id="gm-XII" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${GMC}40`, borderTop: `3px solid ${GMC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="XII" title="DES REMÈDES MODERNES DU DISPENSAIRE" icon="💊" col={GMC_LIGHT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {REMEDES_GEN.map(r => {
                const rLight = r.col === '#A04848' ? '#C07878' : r.col === '#4878A8' ? '#7AA8C8' : r.col === '#488070' ? '#70A898' : '#C0A870';
                return (
                  <div key={r.nom} style={{ background: T.card, border: `1px solid ${r.col}40`, borderLeft: `4px solid ${r.col}`, padding: '16px 20px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 17, color: rLight, marginBottom: 10 }}>{r.nom}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: r.col, letterSpacing: '0.16em', marginBottom: 6 }}>UTILISÉ POUR</div>
                    <RegList items={r.usages as unknown as string[]} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conclusion */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: GMC_LIGHT, letterSpacing: '0.22em', background: `${GMC}18`, padding: '6px 16px', border: `1px solid ${GMC}40` }}>CONCLUSION</div>
              <div style={{ flex: 1, height: 1, background: `${GMC}35` }} />
            </div>
            <RegBlock col={`${GMC}45`}>
              <RegPara>La médecine générale est la base de toute pratique médicale. Elle permet au praticien de reconnaître les affections courantes, d'apporter les premiers soins et d'orienter le malade vers un traitement adapté.</RegPara>
              <RegPara>Le médecin de 1890 ne se limite plus aux seuls remèdes traditionnels. Il associe désormais les connaissances de la médecine moderne, les principes d'hygiène de Pasteur et Lister, ainsi que les ressources de la pharmacologie et de la médecine végétale afin d'offrir les meilleurs soins possibles à ses patients.</RegPara>
            </RegBlock>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Cours de Pharmacie Médicale — Anti-Douleurs ── */

const PAC = '#7A5090';
const PAC_LIGHT = '#A878B8';

const PLANTES_AD = [
  {
    nom: 'Saule Blanc', col: '#486880',
    usage: ["Fièvres.", "Douleurs articulaires.", "Maux de tête.", "Courbatures."],
    note: "Contient de la salicine, précurseur naturel de l'aspirine.",
    application: null,
  },
  {
    nom: 'Millepertuis', col: '#906030',
    usage: ["Brûlures.", "Douleurs nerveuses.", "Inflammations."],
    application: ["Huile médicinale.", "Cataplasmes."],
    note: null,
  },
  {
    nom: 'Reine-des-Prés', col: '#A8B991',
    usage: ["Douleurs articulaires.", "États fébriles.", "Maux de tête."],
    application: null, note: null,
  },
  {
    nom: 'Clou de Girofle', col: '#8A5030',
    usage: ["Douleurs dentaires.", "Plaies de la bouche."],
    application: null, note: null,
  },
  {
    nom: 'Camomille Romaine', col: '#7A6030',
    usage: ["Douleurs digestives.", "Contusions.", "Tensions musculaires."],
    application: null, note: null,
  },
  {
    nom: 'Menthe Poivrée', col: '#488870',
    usage: ["Migraines.", "Maux de ventre.", "Douleurs musculaires légères."],
    application: null, note: null,
  },
  {
    nom: 'Consoude', col: '#4878A8',
    usage: ["Fractures.", "Contusions.", "Douleurs profondes.", "Cicatrisation."],
    application: null, note: null,
  },
] as const;

const CATAPLASMES_AD = [
  { nom: 'Cataplasme du Médecin',       col: '#A04848', ingredients: ["Consoude.", "Sauge.", "Miel.", "Argile."],                 usages: ["Plaies.", "Fractures.", "Sutures."] },
  { nom: 'Cataplasme du Soldat',         col: '#A8B991', ingredients: ["Romarin.", "Lavande.", "Prêle."],                          usages: ["Courbatures.", "Douleurs du dos.", "Fatigue musculaire."] },
  { nom: 'Cataplasme de la Paix Blanche', col: '#706888', ingredients: ["Camomille.", "Millepertuis.", "Miel."],                   usages: ["Brûlures.", "Coupures.", "Inflammations de la peau."] },
] as const;

const PREPARATIONS_INT = [
  { nom: 'Infusion du Calme Profond',    col: '#486880', ingredients: ["Saule blanc.", "Camomille.", "Tilleul."],            usages: ["Douleurs légères.", "Repos nocturne."] },
  { nom: "Infusion du Guerrier Guéri",   col: '#A8B991', ingredients: ["Reine-des-Prés.", "Ortie.", "Romarin."],             usages: ["Convalescence.", "Douleurs résiduelles."] },
  { nom: 'Vin Médicinal de Romarin',     col: '#7A5830', ingredients: null,                                                   usages: ["Fatigue.", "Douleurs liées au froid.", "Faiblesse générale."] },
] as const;

const PREPARATIONS_PHARMA_AD = [
  { nom: 'Laudanum',           col: '#A04848', usages: ["Douleurs sévères.", "Blessures graves.", "Suites opératoires."],                   prescription: true,  admin: ["Exclusivement sur prescription médicale.", "Surveillance obligatoire du patient."],  precautions: ["Ne jamais dépasser la dose prescrite.", "Réservé aux cas où les remèdes végétaux ne suffisent plus."] },
  { nom: 'Élixir Parégorique', col: '#786040', usages: ["Toux douloureuse.", "Irritations respiratoires.", "Douleurs légères à modérées."],   prescription: false, admin: ["En faibles quantités.", "Selon l'état du malade."],                              precautions: ["Respect strict du dosage."] },
  { nom: 'Pommade Camphrée',   col: '#7A5830', usages: ["Douleurs musculaires.", "Entorses.", "Courbatures.", "Contusions."],                  prescription: false, admin: ["Application locale par massage doux."],                                             precautions: [] },
  { nom: 'Baume Résineux',     col: '#488070', usages: ["Inflammations légères.", "Douleurs articulaires.", "Irritations cutanées."],          prescription: false, admin: ["Application externe sur la zone douloureuse."],                                     precautions: [] },
] as const;

function PharmacieAntidouleurDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${PAC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${PAC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${PAC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${PAC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${PAC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: PAC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE PHARMACIE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: PAC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>⚗ Doctrine des Anti-Douleurs</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Naturels et Pharmaceutiques</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${PAC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${PAC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${PAC}28` : 'transparent', color: version === 'complete' ? PAC_LIGHT : T.dim, borderRight: `1px solid ${PAC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${PAC}28` : 'transparent', color: version === 'resume' ? PAC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${PAC}50`}>
            <RegPara>La douleur est un signal utile pour le médecin, mais lorsqu'elle devient excessive, elle affaiblit le malade et ralentit sa guérison. Le rôle du praticien est donc de soulager la souffrance tout en recherchant sa cause.</RegPara>
            <RegPara>Au Dispensaire, les remèdes végétaux demeurent les premiers alliés du médecin, mais ils peuvent être complétés par des préparations pharmaceutiques modernes lorsque la situation l'exige.</RegPara>
          </RegBlock>

          {/* Principes */}
          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${PAC}30`, borderLeft: `4px solid ${PAC}`, padding: '16px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: PAC_LIGHT, marginBottom: 10 }}>Principes fondamentaux</div>
            <RegList items={["Identifier l'origine de la douleur avant de la traiter.", "Nettoyer et soigner la cause du mal avant d'administrer un anti-douleur.", "Employer le traitement le moins agressif possible.", "Privilégier les applications externes lorsque cela suffit.", "Surveiller attentivement les effets du traitement."]} />
          </div>

          {/* Plantes */}
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: PAC_LIGHT, marginBottom: 12, letterSpacing: '0.04em' }}>Principales Plantes Anti-Douleurs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 22 }}>
            {PLANTES_AD.map(p => {
              const pAny = p as any;
              return (
                <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `3px solid ${p.col}`, padding: '12px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: p.col, marginBottom: 8 }}>{p.nom}</div>
                  <RegList items={p.usage as unknown as string[]} />
                  {pAny.note && <div style={{ fontFamily: BODY, fontSize: 12, color: T.dim, fontStyle: 'italic', marginTop: 6 }}>{pAny.note}</div>}
                </div>
              );
            })}
          </div>

          {/* Cataplasmes */}
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: PAC_LIGHT, marginBottom: 12, letterSpacing: '0.04em' }}>Cataplasmes Anti-Douleurs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
            {CATAPLASMES_AD.map(c => (
              <div key={c.nom} style={{ background: T.card, border: `1px solid ${c.col}40`, borderLeft: `3px solid ${c.col}`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: c.col, marginBottom: 8 }}>{c.nom}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: c.col, letterSpacing: '0.14em', marginBottom: 4 }}>COMPOSITION</div>
                <RegList items={c.ingredients as unknown as string[]} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: c.col, letterSpacing: '0.14em', margin: '8px 0 4px' }}>USAGE</div>
                <RegList items={c.usages as unknown as string[]} />
              </div>
            ))}
          </div>

          {/* Préparations internes */}
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: PAC_LIGHT, marginBottom: 12, letterSpacing: '0.04em' }}>Préparations Internes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
            {PREPARATIONS_INT.map(p => {
              const pAny = p as any;
              return (
                <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `3px solid ${p.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: p.col, marginBottom: 8 }}>{p.nom}</div>
                  {pAny.ingredients && <><div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', marginBottom: 4 }}>COMPOSITION</div><RegList items={pAny.ingredients} /></>}
                  <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', margin: '8px 0 4px' }}>USAGE</div>
                  <RegList items={p.usages as unknown as string[]} />
                </div>
              );
            })}
          </div>

          {/* Préparations modernes */}
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: PAC_LIGHT, marginBottom: 12, letterSpacing: '0.04em' }}>Préparations Modernes du Dispensaire</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 22 }}>
            {PREPARATIONS_PHARMA_AD.map(p => (
              <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `3px solid ${p.col}`, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: p.col }}>{p.nom}</div>
                  {p.prescription && <span style={{ fontFamily: MONO, fontSize: 9, color: '#A04848', background: 'rgba(160,72,72,0.15)', border: '1px solid rgba(160,72,72,0.4)', padding: '2px 6px', letterSpacing: '0.08em' }}>PRESCRIPTION</span>}
                </div>
                <RegList items={p.usages as unknown as string[]} />
              </div>
            ))}
          </div>

          {/* Précautions */}
          <div style={{ marginBottom: 22, background: `${PAC}08`, border: `1px solid ${PAC}40`, borderLeft: `4px solid ${PAC}`, padding: '16px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: PAC_LIGHT, marginBottom: 10 }}>Précautions</div>
            <RegList items={["Respecter les dosages.", "Observer les réactions du malade.", "Consigner les traitements dans le registre médical.", "Utiliser les préparations à base de salicine avec prudence chez les patients affaiblis."]} />
          </div>

          <div style={{ background: `${PAC}06`, border: `1px solid ${PAC}35`, padding: '16px 22px' }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PAC_LIGHT, letterSpacing: '0.18em', marginBottom: 8 }}>À RETENIR</div>
            <div style={{ fontFamily: BODY, fontSize: 15, color: T.sepia, fontStyle: 'italic', lineHeight: 1.8 }}>Le médecin de 1890 doit associer les remèdes naturels aux progrès récents de la pharmacie. Le bon praticien ne cherche pas à faire disparaître la douleur à tout prix, mais à soulager le malade tout en traitant la cause véritable de sa souffrance.</div>
          </div>
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          {/* Sommaire */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 36, padding: '14px 18px', background: `${PAC}08`, border: `1px solid ${PAC}30` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.16em', marginRight: 8, alignSelf: 'center' }}>SECTIONS</span>
            {['Prémb','I','II','III','IV','V','VI','Concl'].map(n => (
              <a key={n} href={`#pad-${n}`} style={{ fontFamily: MONO, fontSize: 11, color: PAC_LIGHT, background: `${PAC}15`, border: `1px solid ${PAC}40`, padding: '3px 8px', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.07em' }}>{n}</a>
            ))}
          </div>

          {/* Préambule */}
          <div id="pad-Prémb" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: PAC_LIGHT, letterSpacing: '0.22em', background: `${PAC}18`, padding: '6px 16px', border: `1px solid ${PAC}40` }}>PRÉAMBULE</div>
              <div style={{ flex: 1, height: 1, background: `${PAC}35` }} />
            </div>
            <RegBlock col={`${PAC}45`}>
              <RegPara>La douleur n'est pas toujours l'ennemie du médecin : elle renseigne sur l'état du malade et guide souvent le diagnostic. Toutefois, lorsqu'elle devient excessive, elle épuise les forces du patient, ralentit sa guérison et compromet son rétablissement.</RegPara>
              <RegPara>Au Dispensaire, le médecin apprend à soulager la douleur avec discernement, en employant d'abord les ressources de la médecine végétale puis, lorsque la situation l'exige, les préparations pharmaceutiques modernes.</RegPara>
              <RegPara>Les plantes demeurent les premières alliées du praticien, mais elles peuvent être associées aux progrès récents de la médecine afin d'offrir au malade le traitement le plus adapté.</RegPara>
            </RegBlock>
          </div>

          {/* I. Règles générales */}
          <div id="pad-I" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="I" title="RÈGLES GÉNÉRALES" icon="📋" col={PAC_LIGHT} />
            <RegList items={[
              "Employer le traitement le moins agressif permettant un soulagement efficace.",
              "Le médecin doit toujours rechercher l'équilibre entre le confort du malade et la préservation de ses forces.",
              "Identifier l'origine de la douleur avant de la traiter.",
              "Nettoyer et soigner la cause du mal avant d'administrer un anti-douleur.",
              "Privilégier les applications externes lorsque cela suffit.",
            ]} />
          </div>

          {/* II. Plantes */}
          <div id="pad-II" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="II" title="PRINCIPALES PLANTES ANTI-DOULEURS" icon="🌿" col={PAC_LIGHT} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PLANTES_AD.map(p => {
                const pAny = p as any;
                return (
                  <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `4px solid ${p.col}`, padding: '16px 20px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 19, color: p.col, marginBottom: 10 }}>{p.nom}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: pAny.application ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.16em', marginBottom: 5 }}>USAGE</div>
                        <RegList items={p.usage as unknown as string[]} />
                      </div>
                      {pAny.application && (
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.16em', marginBottom: 5 }}>APPLICATION</div>
                          <RegList items={pAny.application} />
                        </div>
                      )}
                      {pAny.note && (
                        <div style={{ background: `${p.col}10`, border: `1px solid ${p.col}30`, padding: '10px 14px', alignSelf: 'start' }}>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', marginBottom: 4 }}>NOTE</div>
                          <div style={{ fontFamily: BODY, fontSize: 13, color: T.muted, fontStyle: 'italic' }}>{pAny.note}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* III. Cataplasmes */}
          <div id="pad-III" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="III" title="CATAPLASMES ANTI-DOULEURS" icon="🫙" col={PAC_LIGHT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {CATAPLASMES_AD.map(c => (
                <div key={c.nom} style={{ background: T.card, border: `1px solid ${c.col}40`, borderTop: `3px solid ${c.col}`, padding: '18px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: c.col, marginBottom: 12 }}>{c.nom}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: c.col, letterSpacing: '0.14em', marginBottom: 5 }}>COMPOSITION</div>
                  <RegList items={c.ingredients as unknown as string[]} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: c.col, letterSpacing: '0.14em', margin: '10px 0 5px' }}>UTILISÉ POUR</div>
                  <RegList items={c.usages as unknown as string[]} />
                </div>
              ))}
            </div>
          </div>

          {/* IV. Préparations internes */}
          <div id="pad-IV" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="IV" title="PRÉPARATIONS INTERNES" icon="🫖" col={PAC_LIGHT} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {PREPARATIONS_INT.map(p => {
                const pAny = p as any;
                return (
                  <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderTop: `3px solid ${p.col}`, padding: '18px 20px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 16, color: p.col, marginBottom: 12 }}>{p.nom}</div>
                    {pAny.ingredients && <><div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', marginBottom: 5 }}>COMPOSITION</div><RegList items={pAny.ingredients} /></>}
                    <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', margin: '10px 0 5px' }}>UTILISÉE POUR</div>
                    <RegList items={p.usages as unknown as string[]} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* V. Précautions */}
          <div id="pad-V" style={{ marginBottom: 28, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="V" title="PRÉCAUTIONS ET DEVOIR DU SOIGNANT" icon="⚖" col={PAC_LIGHT} />
            <RegPara>Les préparations à base de salicine doivent être utilisées avec prudence chez les malades présentant une grande faiblesse, des troubles digestifs importants ou une sensibilité particulière aux remèdes végétaux.</RegPara>
            <RegList items={["Respecter les dosages.", "Observer les réactions du malade.", "Consigner les traitements dans le registre médical.", "Surveiller attentivement l'évolution du patient."]} />
          </div>

          {/* VI. Préparations modernes */}
          <div id="pad-VI" style={{ marginBottom: 36, background: T.paper, border: `1px solid ${PAC}40`, borderTop: `3px solid ${PAC}`, padding: '26px 30px' }}>
            <RegSectionHeader num="VI" title="PRÉPARATIONS ANTI-DOULEURS MODERNES DU DISPENSAIRE" icon="💊" col={PAC_LIGHT} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PREPARATIONS_PHARMA_AD.map(p => (
                <div key={p.nom} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `4px solid ${p.col}`, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 19, color: p.col }}>{p.nom}</div>
                    {p.prescription && <span style={{ fontFamily: MONO, fontSize: 10, color: '#A04848', background: 'rgba(160,72,72,0.15)', border: '1px solid rgba(160,72,72,0.45)', padding: '3px 10px', letterSpacing: '0.1em' }}>PRESCRIPTION MÉDICALE OBLIGATOIRE</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: p.precautions.length ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.16em', marginBottom: 5 }}>USAGE</div>
                      <RegList items={p.usages as unknown as string[]} />
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.16em', marginBottom: 5 }}>ADMINISTRATION</div>
                      <RegList items={p.admin as unknown as string[]} />
                    </div>
                    {p.precautions.length > 0 && (
                      <div style={{ background: `${p.col}08`, border: `1px solid ${p.col}30`, padding: '10px 14px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', marginBottom: 5 }}>PRÉCAUTIONS</div>
                        <RegList items={p.precautions as unknown as string[]} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conclusion */}
          <div id="pad-Concl">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: PAC_LIGHT, letterSpacing: '0.22em', background: `${PAC}18`, padding: '6px 16px', border: `1px solid ${PAC}40` }}>CONCLUSION</div>
              <div style={{ flex: 1, height: 1, background: `${PAC}35` }} />
            </div>
            <RegBlock col={`${PAC}45`}>
              <RegPara>La plante demeure l'une des plus anciennes alliées du médecin. Employée avec discernement, elle soulage les douleurs, accompagne la guérison et préserve les forces du malade.</RegPara>
              <RegPara>Les progrès récents de la médecine permettent désormais d'associer ces remèdes naturels à des préparations pharmaceutiques plus puissantes lorsque la situation l'exige.</RegPara>
              <RegPara>Au Dispensaire, l'anti-douleur n'est pas destiné à masquer la maladie, mais à accompagner le malade vers son rétablissement tout en permettant au médecin de traiter la véritable cause de sa souffrance.</RegPara>
            </RegBlock>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pharmacie Sédatifs
// ─────────────────────────────────────────────────────────────────────────────
const SC       = '#3A4868';
const SC_LIGHT = '#6878B0';

type SedatifData = {
  nom: string; surnom: string; col: string;
  vertus: string[]; admin: string[];
  precautions?: string[]; danger?: string; prescription?: boolean;
};
type AnesthData = { nom: string; surnom: string; col: string; usage: string[]; danger: string; };
type CataplSedData = { nom: string; application: string; effet: string; };

const SEDATIFS_LEGERS: SedatifData[] = [
  {
    nom: 'Camomille', surnom: '"La Douce Quiétude"', col: '#486880',
    vertus: ['Calme le système nerveux', "Réduit l'anxiété légère", "Favorise l'endormissement naturel"],
    admin: ['Infusion de 5 à 10 minutes', 'Deux à trois tasses par jour', "En cataplasme sur le front en cas d'agitation"],
  },
  {
    nom: 'Valériane', surnom: '"Le Cœur Apaisé"', col: '#5060A0',
    vertus: ['Réduit les palpitations nerveuses', "Atténue les douleurs musculaires d'origine nerveuse", 'Induit un sommeil profond et réparateur'],
    admin: ["Décoction de racine : 10 minutes d'ébullition", 'Une tasse le soir, trente minutes avant le sommeil', 'Ne pas dépasser deux tasses par jour'],
    precautions: ['Éviter en cas de travaux nécessitant vigilance', 'Effets cumulatifs sur plusieurs jours'],
  },
  {
    nom: "Fleur d'Oranger", surnom: '"Le Repos de l\'Âme"', col: '#706888',
    vertus: ["Apaise les états d'inquiétude", 'Régule les émotions en crise', 'Adoucit les troubles du sommeil légers'],
    admin: ['Infusion de 8 minutes', 'Une à deux tasses quotidiennes', 'En inhalation : quelques gouttes sur un linge chaud'],
  },
];

const SEDATIFS_MODERES: SedatifData[] = [
  {
    nom: 'Mélisse', surnom: '"L\'Esprit Tranquille"', col: '#507050',
    vertus: ["Sédation nerveuse modérée", "Apaise les spasmes digestifs d'origine anxieuse", 'Calme les douleurs de tête liées au stress'],
    admin: ['Infusion concentrée : 15 minutes', 'Maximum deux tasses par jour', 'Peut être combinée à la valériane'],
    precautions: ['Éviter en cas de grossesse'],
  },
  {
    nom: 'Houblon', surnom: '"Le Sommeil Profond"', col: '#706030',
    vertus: ['Sédation musculaire et nerveuse', 'Traitement des insomnies tenaces', "Réduction des états d'hyperexcitation"],
    admin: ["Décoction de cônes : 12 minutes", 'Une tasse le soir uniquement', "En sachet sous l'oreiller pour effet léger"],
    precautions: ['Déconseillé aux personnes mélancoliques', 'Peut accentuer la dépression'],
  },
  {
    nom: 'Élixir Parégorique', surnom: '"Le Calme du Souffle"', col: '#7A5830',
    vertus: ['Sédation respiratoire et nerveuse', 'Apaise les quintes de toux sèches nocturnes', 'Calme les douleurs thoraciques légères'],
    admin: ["5 à 15 gouttes dans de l'eau", 'Deux fois par jour maximum', 'Surveillance de la respiration conseillée'],
    precautions: ["Contient de l'opium en faible concentration"],
    prescription: true,
  },
  {
    nom: 'Valériane Concentrée', surnom: '"La Nuit Sûre"', col: '#5060A0',
    vertus: ['Sédation profonde sans perte de conscience', 'Traitement des douleurs neuropathiques modérées', 'Calme les convulsions légères'],
    admin: ["Extrait teinturé : 10 à 20 gouttes dans l'eau", 'Une seule prise journalière', 'Toujours associée à une surveillance'],
    precautions: ['Dose à ne jamais dépasser', 'Effets sur 6 à 8 heures'],
    prescription: true,
  },
];

const SEDATIFS_FORTS: SedatifData[] = [
  {
    nom: 'Laudanum', surnom: '"Le Voile Noir"', col: '#7A3030',
    vertus: ['Sédation profonde et rapide', 'Suppression des douleurs intenses', 'Calme les convulsions sévères'],
    admin: ["2 à 10 gouttes dans un verre d'eau", 'Administration unique ou espacée de 6 heures minimum', 'Surveillance constante du patient obligatoire'],
    danger: 'Accoutumance rapide. Surdosage potentiellement mortel. Dose mortelle : 20 gouttes chez un adulte fragile.',
    prescription: true,
  },
  {
    nom: 'Lait de Pavot', surnom: '"Le Sommeil Imposé"', col: '#904040',
    vertus: ['Sédation totale pour soins douloureux', 'Annihile la perception de la douleur', 'Utilisé avant les interventions chirurgicales mineures'],
    admin: ["Une cuillère à café dans l'eau tiède", 'Administration unique par consultation', 'Patient allongé, surveillance constante'],
    danger: 'Dépression respiratoire possible. Ne jamais combiner avec le laudanum ou l\'éther.',
    prescription: true,
  },
  {
    nom: 'Jus de Laitue Sauvage', surnom: '"L\'Opium du Pauvre"', col: '#5A7030',
    vertus: ['Sédation modérée à forte selon concentration', 'Moins dangereux que le laudanum', 'Accessible en territoire isolé'],
    admin: ['Décoction épaisse de tiges fraîches', "Deux cuillerées à soupe dans l'eau", 'Effets en 20 à 40 minutes'],
    precautions: ['Concentration variable selon la plante', 'Toujours démarrer avec faible dose'],
  },
];

const ANESTHESIQUES_SED: AnesthData[] = [
  {
    nom: 'Éther', surnom: '"Le Souffle du Néant"', col: '#304060',
    usage: ['Anesthésie générale pour chirurgie', 'Administré par inhalation sur un linge imbibé', 'Induction en 2 à 5 minutes', "Surveillance respiratoire impérative tout au long de l'acte"],
    danger: "Hautement inflammable. Ne jamais approcher d'une flamme. Réveil difficile, nausées fréquentes.",
  },
  {
    nom: 'Chloroforme', surnom: '"Le Voile Blanc"', col: '#4A3068',
    usage: ["Anesthésie d'urgence ou chirurgicale", 'Quelques gouttes sur un linge, application sur nez et bouche', "Induction plus rapide que l'éther (1 à 2 minutes)", 'Réservé aux chirurgies longues et douloureuses'],
    danger: "DANGER EXTRÊME : arrêt respiratoire possible si dose dépassée. Fenêtre thérapeutique très étroite. Nécessite expérience confirmée.",
  },
];

const CATAPLASMES_SED: CataplSedData[] = [
  {
    nom: 'Cataplasme de Lavande et Argile',
    application: 'Appliquer tiède sur les tempes et le front, maintenir 20 minutes',
    effet: 'Calme les céphalées nerveuses, favorise la détente musculaire du cuir chevelu',
  },
  {
    nom: 'Cataplasme de Camomille et Miel',
    application: "Appliquer chaud sur le plexus solaire, couvrir d'un linge de laine",
    effet: "Soulage les tensions abdominales d'origine nerveuse, favorise un endormissement doux",
  },
  {
    nom: 'Huile de Millepertuis',
    application: 'Masser doucement les tempes, la nuque et le bas du dos avec l\'huile tiédie',
    effet: 'Apaise le système nerveux périphérique, réduit les contractures et l\'agitation physique',
  },
];

const ECHELLE_SED = [
  ["LÉGER",    "Camomille, Fleur d'Oranger",               "1–3 h",    "Conservée",               "Anxiété, insomnie légère"],
  ["LÉGER+",   "Valériane, Mélisse, Houblon",              "3–6 h",    "Conservée (somnolence)",  "Insomnie, agitation"],
  ["MODÉRÉ",   "Élixir parégorique, Valériane concentrée", "4–8 h",    "Altérée",                 "Douleurs neuropathiques, convulsions légères"],
  ["FORT",     "Laudanum, Lait de Pavot, Laitue Sauvage",  "6–12 h",   "Très altérée",            "Douleurs intenses, interventions mineures"],
  ["EXTRÊME",  "Éther, Chloroforme",                       "Variable", "Nulle (anesthésie)",       "Chirurgie uniquement"],
] as const;

function PharmacieSedartifsDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${SC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${SC}60` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${SC}60` : 'none', borderLeft: pos.includes('left') ? `2px solid ${SC}60` : 'none', borderRight: pos.includes('right') ? `2px solid ${SC}60` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: SC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE PHARMACIE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: SC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>💤 Doctrine des Sédatifs</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Naturels et Pharmaceutiques</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${SC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${SC}50` }}>
          <button onClick={() => setVersion('complete')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'complete' ? `${SC}28` : 'transparent', color: version === 'complete' ? SC_LIGHT : T.dim, borderRight: `1px solid ${SC}40` }}>
            VERSION COMPLÈTE
          </button>
          <button onClick={() => setVersion('resume')} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em', padding: '8px 22px', cursor: 'pointer', border: 'none', background: version === 'resume' ? `${SC}28` : 'transparent', color: version === 'resume' ? SC_LIGHT : T.dim }}>
            VERSION RÉSUMÉE
          </button>
        </div>
      </div>

      {/* ── VERSION RÉSUMÉE ── */}
      {version === 'resume' && (
        <div>
          <RegBlock col={`${SC}50`}>
            <RegPara>Le sédatif est un outil de miséricorde entre les mains du médecin compétent et un instrument de mort entre les mains de l'ignorant. Ces substances endorment la douleur, calment l'agitation et permettent les soins difficiles — mais elles peuvent également supprimer la respiration et créer une dépendance irréversible.</RegPara>
          </RegBlock>

          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${SC}30`, borderLeft: `4px solid ${SC}`, padding: '16px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: SC_LIGHT, marginBottom: 10 }}>Principes fondamentaux</div>
            <RegList items={["Le sédatif n'est jamais la première réponse — les méthodes douces d'abord.", "Toute substance modérée ou forte exige la présence d'un praticien.", "La dose minimale efficace est toujours la dose recommandée.", "Jamais deux sédatifs forts simultanément.", "Les substances à prescription ne se délivrent qu'avec autorisation médicale."]} />
          </div>

          {[
            { titre: 'Sédatifs Légers', col: '#486880', light: '#7898B0', list: SEDATIFS_LEGERS },
            { titre: 'Sédatifs Modérés', col: '#706030', light: '#9A8050', list: SEDATIFS_MODERES },
            { titre: 'Sédatifs Forts', col: '#7A3030', light: '#A05050', list: SEDATIFS_FORTS },
          ].map(({ titre, col, light, list }) => (
            <div key={titre} style={{ marginBottom: 16, background: T.paper, border: `1px solid ${col}30`, borderLeft: `4px solid ${col}`, padding: '14px 20px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 16, color: light, marginBottom: 8 }}>{titre}</div>
              {list.map(s => (
                <div key={s.nom} style={{ marginBottom: 4, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, minWidth: 160 }}>{s.nom}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.05em' }}>{s.surnom}</span>
                  {s.prescription && <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', letterSpacing: '0.1em' }}>PRESCRIPTION</span>}
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginBottom: 16, background: T.paper, border: '1px solid #30406040', borderLeft: '4px solid #304060', padding: '14px 20px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#6878A0', marginBottom: 8 }}>Anesthésiques — Chirurgie uniquement</div>
            {ANESTHESIQUES_SED.map(a => (
              <div key={a.nom} style={{ marginBottom: 4, display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, minWidth: 160 }}>{a.nom}</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.05em' }}>{a.surnom}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', letterSpacing: '0.1em' }}>PRESCRIPTION</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 22, background: T.paper, border: `1px solid ${SC}30`, borderLeft: `4px solid ${SC}`, padding: '16px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: SC_LIGHT, marginBottom: 10 }}>Préparations Externes</div>
            {CATAPLASMES_SED.map(c => (
              <div key={c.nom} style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold }}>{c.nom} — </span>
                <span style={{ fontFamily: BODY, fontSize: 14, color: T.sepia }}>{c.effet}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: SC_LIGHT, marginBottom: 10 }}>Échelle Simplifiée des Sédatifs</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Niveau', 'Durée', 'Conscience', 'Indications'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: SC_LIGHT, background: `${SC}20`, borderBottom: `1px solid ${SC}40`, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(ECHELLE_SED as unknown as string[][]).map(row => (
                  <tr key={row[0]}>
                    <td style={{ padding: '8px 12px', fontFamily: DISPLAY, fontSize: 14, color: SC_LIGHT, borderBottom: `1px solid ${SC}20` }}>{row[0]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: BODY, fontSize: 13, color: '#EADCB9', borderBottom: `1px solid ${SC}20` }}>{row[2]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: BODY, fontSize: 13, color: '#EADCB9', borderBottom: `1px solid ${SC}20` }}>{row[3]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: BODY, fontSize: 13, color: T.sepia, borderBottom: `1px solid ${SC}20` }}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <RegCitation text="Le sédatif endort la douleur — il n'en guérit pas la cause. Soignez d'abord, sédatez ensuite." author="Doctrine du Dispensaire, 1890" />
        </div>
      )}

      {/* ── VERSION COMPLÈTE ── */}
      {version === 'complete' && (
        <div>
          <RegBlock col={`${SC}50`}>
            <RegPara>Le sédatif est une arme à double tranchant. Utilisé avec discernement, il apporte le repos, la sérénité et permet les soins douloureux. Mal dosé ou employé sans vigilance, il peut précipiter le malade dans un sommeil sans retour. Le médecin du Dispensaire doit maîtriser ces substances avec la même rigueur que le bistouri.</RegPara>
            <RegPara>Ce cours distingue quatre degrés de sédation : les agents légers accessibles à tous, les agents modérés qui requièrent prudence, les agents forts à prescription obligatoire, et les anesthésiques chirurgicaux qui ne sauraient être employés sans l'expérience d'un médecin confirmé.</RegPara>
          </RegBlock>

          <RegSectionHeader num="I" title="Règles Générales d'Administration" icon="⚖" col={SC} />
          <div style={{ marginBottom: 22 }}>
            {[
              "Le sédatif n'est jamais la première réponse. Il est administré lorsque les méthodes douces ont échoué ou que l'urgence médicale le justifie absolument.",
              "Toute substance modérée ou forte nécessite la présence d'un praticien tout au long de son effet. Le patient ne doit jamais être laissé seul.",
              "La dose minimale efficace est toujours la dose recommandée. L'excès ne guérit pas plus vite — il tue.",
              "Jamais deux sédatifs forts simultanément. Les synergies entre l'opium, l'éther et le chloroforme peuvent être mortelles et imprévisibles.",
              "Les substances à prescription obligatoire ne doivent pas être dispensées sans l'autorisation expresse du médecin traitant. Aucune exception.",
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12, padding: '12px 18px', background: T.paper, border: `1px solid ${SC}25`, borderLeft: `3px solid ${SC}80` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 20, color: SC_LIGHT, flexShrink: 0, lineHeight: 1 }}>{i + 1}.</span>
                <span style={{ fontFamily: BODY, fontSize: 15, color: T.sepia, lineHeight: 1.6 }}>{rule}</span>
              </div>
            ))}
          </div>

          <RegSectionHeader num="II" title="Les Principaux Sédatifs" icon="💤" col={SC} />

          {/* Légers */}
          <div style={{ marginBottom: 8, padding: '8px 14px', background: 'rgba(72,104,128,0.12)', border: '1px solid rgba(72,104,128,0.40)', borderLeft: '3px solid #486880' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#7898B0', letterSpacing: '0.22em' }}>✦ SÉDATIFS LÉGERS ✦</span>
          </div>
          {SEDATIFS_LEGERS.map(s => (
            <div key={s.nom} style={{ marginBottom: 14, background: T.paper, border: `1px solid ${s.col}30`, borderLeft: `4px solid ${s.col}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px 10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{s.nom}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em' }}>{s.surnom}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 18px 14px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>VERTUS</div>
                  {s.vertus.map((v, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {v}</div>)}
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>ADMINISTRATION</div>
                  {s.admin.map((a, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {a}</div>)}
                  {s.precautions && s.precautions.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: '#A06050', letterSpacing: '0.2em', marginBottom: 4 }}>PRÉCAUTIONS</div>
                      {s.precautions.map((p, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 13, color: '#A07060', marginBottom: 2 }}>⚠ {p}</div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Modérés */}
          <div style={{ marginBottom: 8, marginTop: 22, padding: '8px 14px', background: 'rgba(112,96,48,0.12)', border: '1px solid rgba(112,96,48,0.40)', borderLeft: '3px solid #706030' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#9A8050', letterSpacing: '0.22em' }}>✦ SÉDATIFS MODÉRÉS ✦</span>
          </div>
          {SEDATIFS_MODERES.map(s => (
            <div key={s.nom} style={{ marginBottom: 14, background: T.paper, border: `1px solid ${s.col}30`, borderLeft: `4px solid ${s.col}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px 10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{s.nom}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em' }}>{s.surnom}</div>
                {s.prescription && <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', letterSpacing: '0.15em', padding: '3px 8px', border: '1px solid #C0505060', background: 'rgba(192,80,80,0.08)' }}>PRESCRIPTION REQUISE</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 18px 14px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>VERTUS</div>
                  {s.vertus.map((v, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {v}</div>)}
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>ADMINISTRATION</div>
                  {s.admin.map((a, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {a}</div>)}
                  {s.precautions && s.precautions.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: '#A06050', letterSpacing: '0.2em', marginBottom: 4 }}>PRÉCAUTIONS</div>
                      {s.precautions.map((p, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 13, color: '#A07060', marginBottom: 2 }}>⚠ {p}</div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Forts */}
          <div style={{ marginBottom: 8, marginTop: 22, padding: '8px 14px', background: 'rgba(122,48,48,0.12)', border: '1px solid rgba(122,48,48,0.40)', borderLeft: '3px solid #7A3030' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#A05050', letterSpacing: '0.22em' }}>✦ SÉDATIFS FORTS ✦</span>
          </div>
          {SEDATIFS_FORTS.map(s => (
            <div key={s.nom} style={{ marginBottom: 14, background: T.paper, border: `1px solid ${s.col}30`, borderLeft: `4px solid ${s.col}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px 10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{s.nom}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em' }}>{s.surnom}</div>
                {s.prescription && <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', letterSpacing: '0.15em', padding: '3px 8px', border: '1px solid #C0505060', background: 'rgba(192,80,80,0.08)' }}>PRESCRIPTION OBLIGATOIRE</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 18px 14px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>VERTUS</div>
                  {s.vertus.map((v, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {v}</div>)}
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>ADMINISTRATION</div>
                  {s.admin.map((a, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {a}</div>)}
                  {s.precautions && s.precautions.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: '#A06050', letterSpacing: '0.2em', marginBottom: 4 }}>PRÉCAUTIONS</div>
                      {s.precautions.map((p, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 13, color: '#A07060', marginBottom: 2 }}>⚠ {p}</div>)}
                    </div>
                  )}
                  {s.danger && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(192,48,48,0.08)', border: '1px solid rgba(192,48,48,0.30)', borderLeft: '3px solid #EADCB9' }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: '#EADCB9', letterSpacing: '0.2em', marginBottom: 4 }}>⚠ DANGER</div>
                      <div style={{ fontFamily: BODY, fontSize: 13, color: '#C07070' }}>{s.danger}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Anesthésiques */}
          <div style={{ marginBottom: 8, marginTop: 22, padding: '8px 14px', background: 'rgba(48,64,96,0.15)', border: '1px solid rgba(48,64,96,0.50)', borderLeft: '3px solid #304060' }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#6878A0', letterSpacing: '0.22em' }}>✦ ANESTHÉSIQUES — CHIRURGIE UNIQUEMENT ✦</span>
          </div>
          {ANESTHESIQUES_SED.map(a => (
            <div key={a.nom} style={{ marginBottom: 14, background: T.paper, border: `1px solid ${a.col}40`, borderLeft: `4px solid ${a.col}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px 10px', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{a.nom}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em' }}>{a.surnom}</div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', letterSpacing: '0.15em', padding: '3px 8px', border: '1px solid #C0505060', background: 'rgba(192,80,80,0.08)' }}>PRESCRIPTION OBLIGATOIRE</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '0 18px 14px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em', marginBottom: 6 }}>USAGE</div>
                  {a.usage.map((u, i) => <div key={i} style={{ fontFamily: BODY, fontSize: 14, color: T.sepia, marginBottom: 3 }}>• {u}</div>)}
                </div>
                <div>
                  <div style={{ padding: '8px 12px', background: 'rgba(192,48,48,0.08)', border: '1px solid rgba(192,48,48,0.30)', borderLeft: '3px solid #EADCB9' }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: '#EADCB9', letterSpacing: '0.2em', marginBottom: 4 }}>⚠ DANGER</div>
                    <div style={{ fontFamily: BODY, fontSize: 13, color: '#C07070' }}>{a.danger}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <RegSectionHeader num="" title="Échelle des Sédatifs" icon="📊" col={SC} />
          <div style={{ marginBottom: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {['Niveau', 'Agents principaux', 'Durée', 'Conscience', 'Indications'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: SC_LIGHT, background: `${SC}20`, borderBottom: `1px solid ${SC}40`, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(ECHELLE_SED as unknown as string[][]).map((row, i) => (
                  <tr key={row[0]} style={{ background: i % 2 === 0 ? 'transparent' : `${SC}08` }}>
                    <td style={{ padding: '9px 14px', fontFamily: DISPLAY, fontSize: 15, color: SC_LIGHT, borderBottom: `1px solid ${SC}20` }}>{row[0]}</td>
                    <td style={{ padding: '9px 14px', fontFamily: BODY, fontSize: 14, color: '#EADCB9', borderBottom: `1px solid ${SC}20` }}>{row[1]}</td>
                    <td style={{ padding: '9px 14px', fontFamily: BODY, fontSize: 14, color: '#EADCB9', borderBottom: `1px solid ${SC}20` }}>{row[2]}</td>
                    <td style={{ padding: '9px 14px', fontFamily: BODY, fontSize: 14, color: '#EADCB9', borderBottom: `1px solid ${SC}20` }}>{row[3]}</td>
                    <td style={{ padding: '9px 14px', fontFamily: BODY, fontSize: 14, color: T.sepia, borderBottom: `1px solid ${SC}20` }}>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <RegSectionHeader num="III" title="Cataplasmes et Préparations Externes" icon="🌿" col={SC} />
          <RegBlock col={`${SC}30`}>
            <RegPara>Lorsque l'agitation ou la douleur nerveuse ne requiert pas de sédatif interne, les préparations externes offrent une alternative douce et sans risque de dépendance. Elles peuvent être utilisées en complément des sédatifs légers pour potentialiser leur effet.</RegPara>
          </RegBlock>
          <div style={{ marginBottom: 22 }}>
            {CATAPLASMES_SED.map((c, i) => (
              <div key={c.nom} style={{ marginBottom: 14, background: T.paper, border: `1px solid ${SC}25`, borderLeft: `4px solid ${SC}` }}>
                <div style={{ padding: '10px 18px 6px' }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.2em' }}>PRÉPARATION {i + 1} — </span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 18, color: T.gold }}>{c.nom}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '6px 18px 14px', gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.18em', marginBottom: 5 }}>APPLICATION</div>
                    <div style={{ fontFamily: BODY, fontSize: 14, color: T.sepia }}>{c.application}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: SC_LIGHT, letterSpacing: '0.18em', marginBottom: 5 }}>EFFET THÉRAPEUTIQUE</div>
                    <div style={{ fontFamily: BODY, fontSize: 14, color: T.sepia }}>{c.effet}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <RegSectionHeader num="IV" title="Dangers et Devoir du Médecin" icon="⚠" col={SC} />
          <div style={{ marginBottom: 20, padding: '18px 22px', background: 'rgba(192,48,48,0.06)', border: '1px solid rgba(192,48,48,0.25)', borderLeft: '4px solid #EADCB9' }}>
            <RegPara>Les sédatifs opiacés — laudanum, lait de pavot, élixir parégorique — créent une accoutumance. Un patient qui en consomme régulièrement peut développer une dépendance dont les symptômes de sevrage sont douloureux et potentiellement mortels. Le médecin doit noter toute administration dans le registre du malade et réduire progressivement la dose dès que l'état du patient le permet.</RegPara>
            <RegPara>Il est du devoir du praticien de refuser la délivrance de laudanum ou de chloroforme à tout individu qui ne présente pas de raison médicale valable. Ces substances tombent trop souvent entre de mauvaises mains. La responsabilité du médecin est entière.</RegPara>
            <RegPara>Face à un surdosage : maintenir le patient sur le côté pour éviter l'asphyxie, stimuler par friction vigoureuse, appliquer de l'eau froide sur le visage, ne jamais laisser seul. En cas d'arrêt respiratoire après chloroforme : réanimation par insufflation et compressions thoraciques immédiates.</RegPara>
          </div>

          <RegCitation text="Le sédatif est un outil de miséricorde entre les mains du médecin compétent et un instrument de mort entre les mains de l'ignorant. Que chaque praticien du Dispensaire use de ces remèdes avec la sagesse que la vie humaine mérite." author="Doctrine du Dispensaire, 1890" />
        </div>
      )}
    </div>
  );
}

/* ── Cours de Chirurgie Médicale ── */

const CHC = '#702020';
const CHC_LIGHT = '#DF9A88';

function ChirurgieDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const chBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CHC}40`, borderTop: `3px solid ${CHC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const secTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: CHC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${CHC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${CHC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${CHC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${CHC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${CHC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: CHC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE CHIRURGIE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: CHC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🔪 Doctrine des Points de Suture</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Antisepsie et Cicatrisation</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${CHC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? CHC_LIGHT : T.border}`, background: version === v ? `${CHC}30` : 'transparent', color: version === v ? CHC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${CHC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CHC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Savoir refermer une plaie, c'est comprendre le langage du corps.</RegPara>
            <RegPara>Une plaie mal préparée se corrompt ; une plaie proprement traitée retrouve peu à peu son intégrité. Chaque point de suture représente un engagement entre le savoir du chirurgien, la résistance du malade et les lois de la nature.</RegPara>
            <RegPara>Les progrès récents de la chirurgie, notamment les enseignements de <strong>Joseph Lister</strong>, ont démontré que la propreté des mains, des instruments et des pansements est aussi importante que l'habileté du praticien. Une chirurgie propre sauve davantage de vies qu'une chirurgie rapide.</RegPara>
            <RegPara>Au sein de l'ORDRES DES MÉDECINS - Hôpital de Little Creek - Dispensaire, la suture n'est jamais un acte de précipitation. Elle doit être réalisée avec calme, méthode et discernement, en associant les règles modernes de l'antisepsie aux propriétés reconnues des plantes médicinales.</RegPara>
            <RegCitation text="Car sans propreté, même le meilleur fil devient un danger." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Conditions préalables */}
          {chBlock(<>
            {secTitle('CHAPITRE I', 'Des Conditions Préalables à la Suture')}
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.sepia, marginBottom: 10 }}>1. État du patient</div>
            <RegPara>Avant toute intervention, le chirurgien doit apprécier l'état général du blessé. Le malade doit être installé dans un lieu calme, propre, bien éclairé et correctement ventilé.</RegPara>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CHC_LIGHT, marginBottom: 8, marginTop: 16 }}>Soulagement de la douleur</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Douleurs légères', items: ['Infusion de Camomille', 'Valériane', 'Mélisse'] },
                { label: 'Douleurs importantes', items: ['Laudanum (faible dose, sous surveillance)', 'Élixir Parégorique'] },
                { label: 'Chirurgie majeure', items: ['Anesthésie à l\'Éther', 'ou au Chloroforme (médecin expérimenté uniquement)'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${CHC}10`, border: `1px solid ${CHC}30`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: CHC_LIGHT, letterSpacing: '0.12em', marginBottom: 8 }}>{g.label.toUpperCase()}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.sepia, marginBottom: 10, marginTop: 20 }}>2. Antisepsie et propreté</div>
            <RegPara>Aucune plaie ne doit être suturée sans avoir été soigneusement nettoyée.</RegPara>
            <RegList items={['Laver soigneusement les mains au savon puis à l\'eau bouillie.', 'Désinfecter les instruments à l\'eau bouillante ou à l\'acide phénique.', 'Préparer un linge propre ou de la gaze stérilisée.', 'Faire bouillir le fil avant son utilisation.', 'Passer l\'aiguille à la flamme avant chaque intervention.']} />
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CHC_LIGHT, marginBottom: 8, marginTop: 16 }}>Nettoyage de la plaie</div>
            <RegPara>La plaie est irriguée abondamment avec de l'eau bouillie, puis désinfectée à l'aide d'une solution d'acide phénique diluée ou de teinture d'iode. Les préparations végétales du dispensaire favorisent ensuite la cicatrisation.</RegPara>
            <RegBlock col={`${CHC}50`}>
              <RegPara><strong>Une plaie contenant encore des corps étrangers, des tissus morts ou du pus ne doit jamais être refermée.</strong></RegPara>
            </RegBlock>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.sepia, marginBottom: 10, marginTop: 20 }}>3. Choix du matériel</div>
            <RegList items={['Aiguilles courbes', 'Porte-aiguille', 'Pinces chirurgicales', 'Ciseaux fins', 'Fil de soie ou de lin', 'Catgut (interventions internes)', 'Compresses propres et gaze stérilisée']} />
          </>)}

          {/* II. Points de suture */}
          {chBlock(<>
            {secTitle('CHAPITRE II', 'Des Principaux Points de Suture')}
            <RegPara>Le choix du point dépend de la localisation, de la profondeur et de la tension de la plaie. Le but est de rapprocher les tissus tout en permettant leur bonne cicatrisation.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 18 }}>
              {[
                { label: 'A. Point Simple', indic: 'Plaies propres, coupures nettes, petites incisions.', tech: 'Introduire l\'aiguille perpendiculairement à la peau. Traverser les deux berges. Nouer sans tension excessive. Espacer régulièrement.', note: 'Nettoyer autour des points avec une infusion de sauge ou de lavande.' },
                { label: 'B. Point en Croix', indic: 'Plaies larges, tissus sous tension, blessures profondes.', tech: 'Le fil est passé deux fois formant une croix. Maintien solide des berges. Laisser suffisamment d\'espace pour éviter la compression.', note: null },
                { label: 'C. Point de Renfort', indic: 'Fractures ouvertes, plaies musculaires importantes, régions sous forte tension.', tech: 'Point renforcé. Le membre est ensuite immobilisé.', note: null },
                { label: 'D. Point Sous-cutané', indic: 'Visage, cou, régions visibles.', tech: 'Le fil chemine sous la peau afin de limiter les cicatrices. Le catgut peut être laissé en place.', note: 'Retirer les fils après cicatrisation satisfaisante si ce n\'est pas du catgut.' },
              ].map(p => (
                <div key={p.label} style={{ background: T.card, border: `1px solid ${CHC}35`, borderTop: `2px solid ${CHC}`, padding: '16px 18px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: CHC_LIGHT, marginBottom: 8 }}>{p.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em', marginBottom: 6 }}>INDICATIONS</div>
                  <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, lineHeight: 1.7, margin: '0 0 10px' }}>{p.indic}</p>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em', marginBottom: 6 }}>TECHNIQUE</div>
                  <p style={{ fontFamily: BODY, fontSize: 14, color: T.text, lineHeight: 1.7, margin: '0 0 10px' }}>{p.tech}</p>
                  {p.note && <p style={{ fontFamily: BODY, fontSize: 13, color: T.muted, fontStyle: 'italic', margin: 0 }}>{p.note}</p>}
                </div>
              ))}
            </div>
          </>)}

          {/* III. Pansements */}
          {chBlock(<>
            {secTitle('CHAPITRE III', 'Des Pansements et des Préparations du Dispensaire')}
            <RegPara>Les plantes médicinales accompagnent la guérison mais ne remplacent jamais les règles d'antisepsie. Les cataplasmes ne doivent jamais être placés directement dans une plaie fraîchement suturée — ils sont appliqués autour du pansement.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
              {[
                { nom: 'Eau Vulnéraire', usage: 'Nettoyage des plaies.' },
                { nom: 'Onguent Vulnéraire', usage: 'Favorise la cicatrisation.' },
                { nom: 'Pommade Camphrée', usage: 'Douleurs musculaires.' },
                { nom: 'Baume Résineux', usage: 'Inflammations locales.' },
              ].map(r => (
                <div key={r.nom} style={{ background: `${CHC}08`, border: `1px solid ${CHC}30`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CHC_LIGHT, marginBottom: 4 }}>{r.nom}</div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: T.text }}>{r.usage}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: T.sepia, marginTop: 18, marginBottom: 10 }}>Préparations végétales complémentaires</div>
            <RegList items={['Consoude', 'Plantain', 'Calendula', 'Lavande', 'Sauge', 'Thym', 'Romarin', 'Miel']} />
          </>)}

          {/* IV. Surveillance */}
          {chBlock(<>
            {secTitle('CHAPITRE IV', 'Surveillance du Malade')}
            <RegPara>Le chirurgien examine quotidiennement son malade.</RegPara>
            <RegList items={['La température du patient.', 'La couleur et la chaleur de la peau autour de la plaie.', 'Les douleurs signalées.', "L'apparition éventuelle de pus ou de mauvaises odeurs.", 'Le pouls.']} />
            <RegBlock col={`${CHC}50`}>
              <RegPara>En présence d'une infection, une partie de la suture pourra être ouverte afin de permettre l'écoulement des matières purulentes. Toute fièvre persistante impose une surveillance médicale renforcée.</RegPara>
            </RegBlock>
          </>)}

          {/* V. Retrait */}
          {chBlock(<>
            {secTitle('CHAPITRE V', 'Retrait des Fils')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10 }}>
              {[
                { zone: 'Visage', delai: '4 à 6 jours' },
                { zone: 'Bras', delai: '7 à 10 jours' },
                { zone: 'Tronc', delai: '8 à 10 jours' },
                { zone: 'Jambes', delai: '10 à 14 jours' },
              ].map(r => (
                <div key={r.zone} style={{ background: `${CHC}10`, border: `1px solid ${CHC}35`, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, color: CHC_LIGHT, marginBottom: 6 }}>{r.zone}</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: T.text }}>{r.delai}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}><RegPara>Après retrait, la cicatrice est nettoyée puis protégée par un léger onguent cicatrisant.</RegPara></div>
          </>)}

          {/* VI. Plantes */}
          {chBlock(<>
            {secTitle('CHAPITRE VI', 'Les Plantes de la Cicatrisation')}
            <RegPara>Le règne végétal demeure un précieux auxiliaire du chirurgien.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 12 }}>
              {[
                { nom: 'Sauge', desc: 'Nettoie et assainit les plaies.' },
                { nom: 'Romarin', desc: 'Stimule la réparation des tissus.' },
                { nom: 'Lavande', desc: 'Apaise les douleurs et les inflammations.' },
                { nom: 'Thym', desc: 'Propriétés antiseptiques reconnues.' },
                { nom: 'Plantain', desc: 'Protège les tissus fragilisés.' },
                { nom: 'Consoude', desc: 'Favorise la consolidation des chairs.' },
                { nom: 'Calendula', desc: 'Accélère la cicatrisation.' },
                { nom: 'Échinacée', desc: 'Soutient les défenses naturelles du malade.' },
                { nom: 'Miel', desc: 'Protège la plaie et favorise une cicatrisation saine.' },
              ].map(p => (
                <div key={p.nom} style={{ background: `${CHC}08`, border: `1px solid ${CHC}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CHC_LIGHT, marginBottom: 4 }}>{p.nom}</div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: T.text }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${CHC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CHC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le véritable chirurgien ne se contente pas de fermer une plaie. Il prépare soigneusement son intervention, applique les règles de l'antisepsie, choisit le point de suture adapté, surveille quotidiennement son malade et accompagne la guérison par les ressources de la médecine comme de la nature.</RegPara>
            <RegCitation text="Le fil rapproche les chairs. La science prévient la corruption. Les plantes soutiennent la guérison. Ainsi, le chirurgien de 1890 unit le savoir moderne aux traditions éprouvées." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {chBlock(<>
            {secTitle('AVANT TOUTE SUTURE')}
            <RegList items={['Installer le patient dans un lieu propre, calme et bien éclairé.', 'Nettoyer soigneusement la plaie à l\'eau bouillie.', 'Désinfecter avec Acide phénique ou Teinture d\'iode.', 'Se laver les mains et stériliser les instruments.', 'Ne jamais refermer une plaie contenant du pus, des tissus morts ou des corps étrangers.']} />
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: T.sepia, marginBottom: 10, marginTop: 16 }}>Gestion de la douleur</div>
            <RegList items={['Douleur légère : Camomille, Valériane, Mélisse.', 'Douleur importante : Laudanum ou Élixir Parégorique (surveillance médicale).', 'Chirurgie majeure : Éther ou Chloroforme (médecin uniquement).']} />
          </>)}

          {chBlock(<>
            {secTitle('LES POINTS DE SUTURE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { label: 'Point Simple', desc: 'Plaies propres et peu profondes. Le plus utilisé.' },
                { label: 'Point en Croix', desc: 'Plaies larges ou sous tension. Renforce le maintien.' },
                { label: 'Point de Renfort', desc: 'Fractures ouvertes. Plaies musculaires importantes.' },
                { label: 'Point Sous-cutané', desc: 'Visage, cou et zones visibles. Limite les cicatrices.' },
              ].map(p => (
                <div key={p.label} style={{ background: `${CHC}10`, border: `1px solid ${CHC}35`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: CHC_LIGHT, marginBottom: 6 }}>{p.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: T.text, lineHeight: 1.65 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </>)}

          {chBlock(<>
            {secTitle('MATÉRIEL INDISPENSABLE')}
            <RegList items={['Aiguille courbe.', 'Porte-aiguille.', 'Pinces.', 'Ciseaux.', 'Fil de soie, lin ou catgut.', 'Compresses et gaze stérilisées.']} />
          </>)}

          {chBlock(<>
            {secTitle('SURVEILLANCE')}
            <RegPara>Contrôler chaque jour : rougeur, gonflement, chaleur, douleur, pus ou mauvaise odeur, température, pouls.</RegPara>
            <RegBlock col={`${CHC}50`}>
              <RegPara>Si infection : ouvrir légèrement la plaie pour permettre le drainage. Désinfecter avant toute nouvelle suture.</RegPara>
            </RegBlock>
          </>)}

          {chBlock(<>
            {secTitle('RETRAIT DES FILS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
              {[{ zone: 'Visage', delai: '4 – 6 jours' }, { zone: 'Bras', delai: '7 – 10 jours' }, { zone: 'Tronc', delai: '8 – 10 jours' }, { zone: 'Jambes', delai: '10 – 14 jours' }].map(r => (
                <div key={r.zone} style={{ background: `${CHC}10`, border: `1px solid ${CHC}30`, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CHC_LIGHT, marginBottom: 4 }}>{r.zone}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: T.text }}>{r.delai}</div>
                </div>
              ))}
            </div>
          </>)}

          {chBlock(<>
            {secTitle('PRÉPARATIONS DU DISPENSAIRE')}
            <RegList items={['Eau Vulnéraire : nettoyage.', 'Onguent Vulnéraire : cicatrisation.', 'Pommade Camphrée : douleurs musculaires.', 'Baume Résineux : inflammations.']} />
          </>)}

          {chBlock(<>
            {secTitle('PLANTES PRINCIPALES')}
            <RegList items={['Sauge', 'Thym', 'Lavande', 'Romarin', 'Plantain', 'Consoude', 'Calendula', 'Échinacée', 'Miel']} />
          </>)}

          <RegBlock col={`${CHC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CHC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['La propreté sauve plus de vies que la rapidité.', 'Toujours désinfecter avant de suturer.', 'Adapter le point de suture à la blessure.', 'Surveiller quotidiennement la cicatrisation.', 'Associer chirurgie moderne, antisepsie et médecine végétale.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours d'Obstétrique I ── */

const OBC = '#7A2050';
const OBC_LIGHT = '#C06090';

function ObstetriqueiDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const obBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${OBC}40`, borderTop: `3px solid ${OBC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const obTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: OBC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${OBC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${OBC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${OBC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${OBC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${OBC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: OBC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS D'OBSTÉTRIQUE I ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: OBC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>👶 Reconnaissance de la Grossesse</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Suivi de la mère · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${OBC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? OBC_LIGHT : T.border}`, background: version === v ? `${OBC}30` : 'transparent', color: version === v ? OBC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${OBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>L'obstétrique est l'art de veiller sur deux vies à la fois.</RegPara>
            <RegPara>Le médecin ne doit point seulement reconnaître l'état de grossesse ; il lui appartient également d'accompagner la mère tout au long de cette période, d'observer l'évolution de l'enfant et de prévenir les dangers pouvant menacer l'un comme l'autre.</RegPara>
            <RegPara>En cette année 1890, aucun procédé chimique ni appareil ne permet de confirmer précocement une grossesse. Le diagnostic repose donc sur l'observation, l'expérience et l'examen clinique.</RegPara>
            <RegCitation text="Le médecin doit toujours agir avec discrétion, patience et respect." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Signes présomptifs */}
          {obBlock(<>
            {obTitle('CHAPITRE I', 'Des Signes Présomptifs de la Grossesse')}
            <RegPara>Ces signes attirent l'attention du praticien mais ne suffisent jamais à confirmer une grossesse.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
              {[
                { label: 'Suspension des règles', items: ['Premier signe recherché.', 'Peut aussi être causée par une maladie, une anémie, une émotion importante, une fatigue excessive ou une mauvaise alimentation.'] },
                { label: 'Troubles digestifs', items: ['Nausées matinales.', 'Vomissements.', 'Modification de l\'appétit.', 'Dégoût de certains aliments.', 'Envies inhabituelles.'] },
                { label: 'Modifications des seins', items: ['Augmentation du volume.', 'Sensibilité.', 'Assombrissement de l\'aréole.', 'Apparition des tubercules de Montgomery.', 'Développement du réseau veineux.'] },
                { label: 'Changements généraux', items: ['Fatigue importante.', 'Somnolence.', 'Irritabilité.', 'Sensibilité aux odeurs.', 'Envies fréquentes d\'uriner.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${OBC}08`, border: `1px solid ${OBC}30`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC_LIGHT, marginBottom: 8 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
            <RegBlock col={`${OBC}40`}>
              <RegPara>Chaque grossesse étant différente, ces signes doivent toujours être interprétés avec prudence.</RegPara>
            </RegBlock>
          </>)}

          {/* II. Signes probables */}
          {obBlock(<>
            {obTitle('CHAPITRE II', 'Des Signes Probables')}
            <RegPara>L'examen clinique apporte des indices beaucoup plus fiables.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 16 }}>
              {[
                { label: 'Modifications du col', desc: 'Le col de l\'utérus devient progressivement plus souple. Les muqueuses prennent une coloration bleu violacé provoquée par l\'augmentation de la circulation sanguine.' },
                { label: 'Volume utérin', desc: 'Par le toucher bimanuel, le médecin apprécie le développement progressif de l\'utérus, son assouplissement et sa forme plus arrondie.' },
                { label: 'Développement abdominal', desc: 'Le ventre augmente régulièrement au fil des mois. Le praticien distingue cette évolution d\'une simple distension digestive ou d\'un excès d\'embonpoint.' },
              ].map(s => (
                <div key={s.label} style={{ background: T.card, border: `1px solid ${OBC}35`, borderTop: `2px solid ${OBC}`, padding: '16px 18px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: OBC_LIGHT, marginBottom: 8 }}>{s.label}</div>
                  <p style={{ fontFamily: BODY, fontSize: 15, color: T.text, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </>)}

          {/* III. Signes certains */}
          {obBlock(<>
            {obTitle('CHAPITRE III', 'Des Signes Certains')}
            <RegPara>Ces signes permettent d'affirmer une grossesse.</RegPara>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              {[
                { label: 'Mouvements du fœtus', desc: 'Ils apparaissent généralement entre le quatrième et le cinquième mois. Ils sont d\'abord ressentis par la mère puis confirmés par le médecin.' },
                { label: 'Palpation obstétricale', desc: 'Un praticien expérimenté peut reconnaître la tête, le dos, les membres et la position générale de l\'enfant.' },
                { label: 'Auscultation', desc: 'À l\'aide du stéthoscope obstétrical en bois, le médecin écoute les battements du cœur fœtal (120 à 160 battements par minute) et les souffles placentaires. Il s\'agit du signe le plus fiable dont dispose la médecine actuelle.' },
              ].map(s => (
                <div key={s.label} style={{ background: `${OBC}10`, border: `1px solid ${OBC}40`, borderLeft: `4px solid ${OBC}`, padding: '16px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: OBC_LIGHT, marginBottom: 6 }}>{s.label}</div>
                  <p style={{ fontFamily: BODY, fontSize: 15, color: T.text, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </>)}

          {/* IV. Anatomie */}
          {obBlock(<>
            {obTitle('CHAPITRE IV', 'Anatomie Obstétricale')}
            <RegPara>Tout médecin doit parfaitement connaître les organes de la reproduction féminine.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
              {[
                { nom: 'L\'utérus', desc: 'Organe destiné au développement de l\'enfant. Augmente progressivement jusqu\'à l\'accouchement.' },
                { nom: 'Le col de l\'utérus', desc: 'Demeure fermé durant la grossesse avant de se dilater au moment du travail.' },
                { nom: 'Le bassin', desc: 'Ses dimensions influencent directement le déroulement de l\'accouchement. Un bassin étroit peut compliquer la naissance.' },
                { nom: 'Le placenta', desc: 'Nourrit le fœtus et assure les échanges entre la mère et l\'enfant.' },
                { nom: 'Le cordon ombilical', desc: 'Transporte le sang nécessaire au développement du fœtus.' },
                { nom: 'Les membranes', desc: 'Protègent l\'enfant jusqu\'à la rupture naturelle des eaux.' },
              ].map(a => (
                <div key={a.nom} style={{ background: `${OBC}08`, border: `1px solid ${OBC}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC_LIGHT, marginBottom: 4 }}>{a.nom}</div>
                  <div style={{ fontFamily: BODY, fontSize: 14, color: T.text, lineHeight: 1.65 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* V. Développement */}
          {obBlock(<>
            {obTitle('CHAPITRE V', 'Du Développement du Fœtus')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {[
                { label: 'Premier trimestre', items: ['Formation des principaux organes.', 'La mère ressent principalement les premiers symptômes.'] },
                { label: 'Deuxième trimestre', items: ['Le fœtus grandit rapidement.', 'Les mouvements deviennent perceptibles.', 'Le cœur est facilement audible au stéthoscope.'] },
                { label: 'Troisième trimestre', items: ['Le développement est presque complet.', 'L\'enfant prend du poids.', 'Le médecin contrôle régulièrement la position.'] },
              ].map(t => (
                <div key={t.label} style={{ background: T.card, border: `1px solid ${OBC}35`, borderTop: `2px solid ${OBC}`, padding: '18px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 18, color: OBC_LIGHT, marginBottom: 10 }}>{t.label}</div>
                  <RegList items={t.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* VI. Surveillance */}
          {obBlock(<>
            {obTitle('CHAPITRE VI', 'Surveillance de la Grossesse')}
            <RegPara>Une consultation mensuelle est recommandée. Le médecin vérifie :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Température', 'Pouls', 'État général', 'Poids', 'Œdèmes', 'Évolution de l\'utérus', 'Mouvements du fœtus', 'Position de l\'enfant'].map(item => (
                <div key={item} style={{ background: `${OBC}08`, border: `1px solid ${OBC}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 14, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: OBC_LIGHT, fontSize: 10 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegBlock col={`${OBC}40`}>
              <RegPara>Chaque observation est consignée dans le registre obstétrical du dispensaire.</RegPara>
            </RegBlock>
          </>)}

          {/* VII. Conseils */}
          {obBlock(<>
            {obTitle('CHAPITRE VII', 'Conseils Donnés à la Future Mère')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${OBC}30`, borderLeft: `3px solid ${OBC}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC_LIGHT, marginBottom: 10 }}>Recommandé</div>
                <RegList items={['Une alimentation saine et variée.', 'De l\'eau propre et bouillie si nécessaire.', 'Des promenades quotidiennes sans excès.', 'Un sommeil suffisant.', 'Des vêtements confortables.', 'L\'abandon des corsets trop serrés.']} />
              </div>
              <div style={{ background: T.card, border: `1px solid rgba(180,70,70,0.35)`, borderLeft: `3px solid rgba(180,70,70,0.70)`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#C87060', marginBottom: 10 }}>À éviter</div>
                <RegList items={['Les travaux pénibles.', 'Les secousses importantes.', 'Les longues chevauchées.', 'Les émotions violentes.', 'La consommation excessive d\'alcool.']} />
              </div>
            </div>
          </>)}

          {/* VIII. Médicaments */}
          {obBlock(<>
            {obTitle('CHAPITRE VIII', 'Les Médicaments Autorisés Durant la Grossesse')}
            <RegPara>Le médecin doit toujours faire preuve de prudence. Peuvent être employés lorsque nécessaire :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Camomille', 'Mélisse', 'Tilleul', 'Menthe', 'Valériane (faible dose)'].map(m => (
                <div key={m} style={{ background: `${OBC}08`, border: `1px solid ${OBC}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 14, color: T.text }}>{m}</div>
              ))}
            </div>
            <RegBlock col="rgba(209,183,124,0.40)">
              <RegPara><strong>En cas de douleurs importantes :</strong> Laudanum uniquement si le bénéfice est supérieur au risque. Les médicaments puissants demeurent exceptionnels durant la grossesse.</RegPara>
            </RegBlock>
          </>)}

          {/* IX. Signes d'alerte */}
          {obBlock(<>
            {obTitle('CHAPITRE IX', 'Les Signes Devant Alerter')}
            <RegBlock col="rgba(180,70,70,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#C87060', letterSpacing: '0.16em', marginBottom: 10 }}>URGENCE MÉDICALE</div>
              <RegPara>Toute femme enceinte présentant l'un de ces signes doit être examinée immédiatement :</RegPara>
              <RegList items={['Saignements abondants.', 'Douleurs violentes.', 'Fièvre persistante.', 'Perte des mouvements du fœtus.', 'Écoulement anormal.', 'Convulsions.', 'Faiblesse extrême.']} />
            </RegBlock>
          </>)}

          {/* X. Éthique */}
          {obBlock(<>
            {obTitle('CHAPITRE X', 'Éthique de l\'Obstétricien')}
            <RegPara>Le praticien doit :</RegPara>
            <RegList items={['Respecter la dignité de la mère.', 'Préserver le secret médical.', 'Rassurer sans promettre l\'impossible.', 'Agir avec douceur et patience.', 'Protéger simultanément la mère et l\'enfant.']} />
            <RegCitation text="L'obstétricien ne soigne jamais un seul patient : il veille sur deux existences dont les destins sont intimement liés." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${OBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Reconnaître une grossesse constitue la première mission de l'obstétricien, mais certainement pas la dernière. Son devoir est d'accompagner la future mère tout au long de sa grossesse, d'observer avec rigueur chaque évolution, de prévenir les complications et de préparer les meilleures conditions possibles pour la naissance de l'enfant.</RegPara>
            <RegPara>En cette année 1890, la science progresse rapidement grâce aux travaux de Pasteur, Lister et des grands médecins européens. Pourtant, aucun instrument ne remplacera jamais le regard attentif, la main expérimentée et le jugement éclairé du praticien.</RegPara>
            <RegCitation text="La véritable obstétrique est avant tout l'alliance de la science, de l'observation et de l'humanité." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {obBlock(<>
            {obTitle('SIGNES PRÉSOMPTIFS')}
            <RegPara>Ils orientent le médecin sans confirmer la grossesse.</RegPara>
            <RegList items={['Absence des règles.', 'Nausées et vomissements.', 'Modifications de l\'appétit.', 'Sensibilité et augmentation du volume des seins.', 'Fatigue, somnolence, irritabilité.', 'Sensibilité accrue aux odeurs.', 'Envies fréquentes d\'uriner.']} />
          </>)}

          {obBlock(<>
            {obTitle('SIGNES PROBABLES')}
            <RegPara>L'examen clinique renforce le diagnostic.</RegPara>
            <RegList items={['Ramollissement du col de l\'utérus.', 'Coloration bleu violacé des muqueuses.', 'Augmentation du volume de l\'utérus.', 'Développement progressif de l\'abdomen.']} />
          </>)}

          {obBlock(<>
            {obTitle('SIGNES CERTAINS')}
            <RegPara>Seuls ces signes permettent d'affirmer la grossesse.</RegPara>
            <RegList items={['Mouvements du fœtus (4ᵉ à 5ᵉ mois).', 'Palpation de la tête, du dos et des membres.', 'Auscultation du cœur fœtal (120 à 160 battements/minute).']} />
          </>)}

          {obBlock(<>
            {obTitle('ANATOMIE OBSTÉTRICALE')}
            <RegPara>Le médecin doit connaître :</RegPara>
            <RegList items={['L\'utérus.', 'Le col de l\'utérus.', 'Le bassin.', 'Le placenta.', 'Le cordon ombilical.', 'Les membranes.']} />
          </>)}

          {obBlock(<>
            {obTitle('DÉVELOPPEMENT DU FŒTUS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Premier trimestre', items: ['Formation des organes.', 'Premiers signes chez la mère.'] },
                { label: 'Deuxième trimestre', items: ['Croissance rapide.', 'Premiers mouvements.', 'Battements cardiaques audibles.'] },
                { label: 'Troisième trimestre', items: ['Développement complet.', 'Prise de poids.', 'Contrôle de la position.'] },
              ].map(t => (
                <div key={t.label} style={{ background: `${OBC}10`, border: `1px solid ${OBC}30`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC_LIGHT, marginBottom: 6 }}>{t.label}</div>
                  <RegList items={t.items} />
                </div>
              ))}
            </div>
          </>)}

          {obBlock(<>
            {obTitle('SUIVI DE LA GROSSESSE')}
            <RegPara>Une consultation mensuelle est recommandée. Surveiller : température, pouls, état général, poids, œdèmes, évolution de l'utérus, position et mouvements du fœtus.</RegPara>
            <RegPara>Toutes les observations sont inscrites dans le registre obstétrical.</RegPara>
          </>)}

          {obBlock(<>
            {obTitle('CONSEILS À LA FUTURE MÈRE')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC_LIGHT, marginBottom: 8 }}>Favoriser</div>
                <RegList items={['Alimentation équilibrée.', 'Bonne hydratation.', 'Promenades modérées.', 'Repos suffisant.', 'Vêtements confortables.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#C87060', marginBottom: 8 }}>Éviter</div>
                <RegList items={['Travaux pénibles.', 'Longues chevauchées.', 'Émotions violentes.', 'Corsets trop serrés.', 'Abus d\'alcool.']} />
              </div>
            </div>
          </>)}

          {obBlock(<>
            {obTitle('MÉDICAMENTS AUTORISÉS')}
            <RegList items={['Camomille.', 'Mélisse.', 'Tilleul.', 'Menthe.', 'Valériane.']} />
            <RegBlock col="rgba(209,183,124,0.40)">
              <RegPara>En cas de douleur importante : Laudanum uniquement sous contrôle médical.</RegPara>
            </RegBlock>
          </>)}

          {obBlock(<>
            {obTitle('SIGNES D\'URGENCE')}
            <RegBlock col="rgba(180,70,70,0.50)">
              <RegPara>Consulter immédiatement en cas de :</RegPara>
              <RegList items={['Saignements.', 'Douleurs importantes.', 'Fièvre persistante.', 'Perte des mouvements du fœtus.', 'Convulsions.', 'Faiblesse extrême.', 'Écoulement anormal.']} />
            </RegBlock>
          </>)}

          <RegBlock col={`${OBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['La grossesse repose sur trois catégories de signes : présomptifs, probables et certains.', 'Aucun test ne permet de confirmer une grossesse : seul l\'examen clinique fait foi.', 'Le suivi mensuel permet de prévenir les complications.', 'L\'obstétricien protège à la fois la mère et l\'enfant.', 'L\'observation, la prudence et l\'hygiène demeurent les principaux outils du médecin.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours d'Obstétrique II ── */

const OBC2 = '#3A2060';
const OBC2_LIGHT = '#8A70C0';

function ObstetriqueIIDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const ob2Block = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${OBC2}40`, borderTop: `3px solid ${OBC2}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const ob2Title = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: OBC2_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${OBC2}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${OBC2}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${OBC2}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${OBC2}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${OBC2}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: OBC2_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS D'OBSTÉTRIQUE II ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: OBC2_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🤱 De l'Accouchement</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Complications obstétricales · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${OBC2_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? OBC2_LIGHT : T.border}`, background: version === v ? `${OBC2}30` : 'transparent', color: version === v ? OBC2_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${OBC2}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC2_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>L'accouchement est l'aboutissement naturel de la grossesse. Bien qu'il soit un phénomène physiologique, il peut à tout instant devenir une urgence mettant en péril la vie de la mère, de l'enfant ou des deux.</RegPara>
            <RegPara>Le rôle du médecin n'est pas de précipiter la naissance, mais de l'accompagner avec discernement, d'intervenir lorsque la nature ne suffit plus et d'assurer les meilleures conditions d'hygiène possibles.</RegPara>
            <RegCitation text="Depuis les travaux de Pasteur et de Lister, la propreté des mains, des instruments et du linge est devenue une règle fondamentale de toute pratique obstétricale." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Préparation */}
          {ob2Block(<>
            {ob2Title('CHAPITRE I', 'Préparation de l\'Accouchement')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: `${OBC2}08`, border: `1px solid ${OBC2}30`, borderLeft: `3px solid ${OBC2}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC2_LIGHT, marginBottom: 10 }}>Matériel</div>
                <RegList items={['Une chambre calme, propre et bien aérée.', 'De l\'eau bouillie.', 'Des linges propres.', 'Des compresses stérilisées.', 'Les instruments désinfectés.', 'Une source de lumière suffisante.']} />
              </div>
              <div style={{ background: `${OBC2}08`, border: `1px solid ${OBC2}30`, borderLeft: `3px solid ${OBC2}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC2_LIGHT, marginBottom: 10 }}>Le praticien</div>
                <RegList items={['Se laver soigneusement les mains.', 'Désinfecter les instruments à l\'eau bouillante ou à l\'acide phénique.', 'Préparer les médicaments uniquement si une complication survient.']} />
              </div>
            </div>
          </>)}

          {/* II. Trois phases */}
          {ob2Block(<>
            {ob2Title('CHAPITRE II', 'Les Trois Phases de l\'Accouchement')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  num: '1', label: 'La Dilatation',
                  desc: 'Elle débute avec les contractions régulières. Cette étape peut durer plusieurs heures.',
                  items: ['L\'ouverture progressive du col.', 'La fréquence des contractions.', 'L\'état général de la mère.', 'Les battements du cœur fœtal.'],
                  prefix: 'Le médecin surveille :',
                },
                {
                  num: '2', label: 'L\'Expulsion',
                  desc: 'Lorsque le col est entièrement dilaté, les efforts expulsifs commencent.',
                  items: ['Accompagner la naissance sans exercer de traction excessive.', 'Protéger le périnée afin de limiter les déchirures.', 'Vérifier l\'absence d\'enroulement du cordon autour du cou.', 'Accueillir le nouveau-né avec douceur.'],
                  prefix: 'Le praticien :',
                },
                {
                  num: '3', label: 'La Délivrance',
                  desc: 'Après la naissance de l\'enfant, le placenta est expulsé. Le médecin vérifie qu\'il est complet.',
                  items: ['Vérifier l\'intégrité du placenta.', 'Surveiller les saignements.', 'Toute rétention placentaire peut provoquer une hémorragie grave.'],
                  prefix: 'Points de vigilance :',
                },
              ].map(p => (
                <div key={p.num} style={{ background: T.card, border: `1px solid ${OBC2}35`, borderLeft: `4px solid ${OBC2}`, padding: '18px 22px', display: 'flex', gap: 16 }}>
                  <div style={{ width: 36, height: 36, background: `${OBC2}20`, border: `1px solid ${OBC2}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 18, color: OBC2_LIGHT, flexShrink: 0 }}>{p.num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: OBC2_LIGHT, marginBottom: 6 }}>{p.label}</div>
                    <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, margin: '0 0 8px', lineHeight: 1.6 }}>{p.desc}</p>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: OBC2_LIGHT, letterSpacing: '0.12em', marginBottom: 6 }}>{p.prefix}</div>
                    <RegList items={p.items} />
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* III. Présentations */}
          {ob2Block(<>
            {ob2Title('CHAPITRE III', 'Les Présentations du Fœtus')}
            <RegPara>Le médecin doit reconnaître la position de l'enfant avant et pendant le travail.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
              {[
                { label: 'Céphalique', icon: '✓', col: '#206040', desc: 'Position normale. Accouchement pouvant généralement se dérouler sans difficulté majeure.' },
                { label: 'Par le siège', icon: '⚠', col: '#8A6010', desc: 'Les fesses ou les pieds se présentent en premier. Surveillance étroite requise.' },
                { label: 'Transverse', icon: '⚡', col: '#8A2020', desc: 'Enfant placé horizontalement. Accouchement naturel très difficile, intervention souvent nécessaire.' },
                { label: 'Oblique', icon: '◆', col: '#5A3080', desc: 'Position intermédiaire pouvant évoluer vers une présentation normale ou pathologique. Surveillance constante.' },
              ].map(p => (
                <div key={p.label} style={{ background: T.card, border: `1px solid ${p.col}50`, borderTop: `3px solid ${p.col}`, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ color: p.col, fontSize: 16 }}>{p.icon}</span>
                    <div style={{ fontFamily: DISPLAY, fontSize: 16, color: p.col }}>{p.label}</div>
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* IV. Complications */}
          {ob2Block(<>
            {ob2Title('CHAPITRE IV', 'Les Principales Complications')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  label: 'Hémorragie', urgent: true,
                  desc: 'Peut survenir avant, pendant ou après l\'accouchement.',
                  items: ['Rechercher l\'origine.', 'Comprimer si nécessaire.', 'Administrer de l\'ergot de seigle lorsque cela est indiqué.', 'Surveiller constamment la mère.'],
                },
                {
                  label: 'Rétention du placenta', urgent: true,
                  desc: 'Le placenta ne s\'expulse pas complètement. Expose à l\'hémorragie et à l\'infection.',
                  items: ['Vérifier l\'intégrité du placenta.', 'Ne jamais forcer l\'extraction.', 'Surveiller les signes d\'infection.'],
                },
                {
                  label: 'Procidence du cordon', urgent: true,
                  desc: 'Le cordon descend avant l\'enfant. Urgence obstétricale majeure.',
                  items: ['Diminuer la compression du cordon.', 'Positionner la mère immédiatement.', 'Extraction rapide de l\'enfant indispensable.'],
                },
                {
                  label: 'Éclampsie', urgent: true,
                  desc: 'Convulsions, hypertension, perte de connaissance.',
                  items: ['Maintenir la mère au calme.', 'Prévenir les blessures lors des convulsions.', 'Une intervention rapide est indispensable.'],
                },
                {
                  label: 'Fièvre puerpérale', urgent: false,
                  desc: 'Survient généralement après l\'accouchement.',
                  items: ['Fièvre élevée.', 'Douleurs abdominales.', 'Mauvaises odeurs.', 'L\'antisepsie reste la meilleure prévention.'],
                },
                {
                  label: 'Travail prolongé', urgent: false,
                  desc: 'Contractions inefficaces ou progression interrompue.',
                  items: ['Évaluer la nécessité d\'une intervention.', 'Surveiller l\'état de la mère et du fœtus.', 'Ne pas précipiter sans indication claire.'],
                },
              ].map(c => (
                <div key={c.label} style={{ background: c.urgent ? 'rgba(180,160,113,0.06)' : `${OBC2}06`, border: `1px solid ${c.urgent ? 'rgba(180,60,60,0.40)' : OBC2 + '30'}`, borderLeft: `4px solid ${c.urgent ? '#B83030' : OBC2}`, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {c.urgent && <span style={{ fontFamily: MONO, fontSize: 10, color: '#DF9A88', background: 'rgba(180,60,60,0.12)', padding: '2px 7px', letterSpacing: '0.12em' }}>URGENCE</span>}
                    <div style={{ fontFamily: DISPLAY, fontSize: 17, color: c.urgent ? '#DF9A88' : OBC2_LIGHT }}>{c.label}</div>
                  </div>
                  <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, margin: '0 0 8px', lineHeight: 1.65 }}>{c.desc}</p>
                  <RegList items={c.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* V. Moyens thérapeutiques */}
          {ob2Block(<>
            {ob2Title('CHAPITRE V', 'Moyens Thérapeutiques')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: `${OBC2}08`, border: `1px solid ${OBC2}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC2_LIGHT, marginBottom: 10 }}>Médicaments</div>
                <RegList items={['Laudanum (douleurs importantes).', 'Éther.', 'Chloroforme.', 'Ergot de seigle.', 'Acide phénique.', 'Teinture d\'iode.']} />
              </div>
              <div style={{ background: T.card, border: `1px solid rgba(80,140,80,0.35)`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#A8B991', marginBottom: 10 }}>Préparations végétales</div>
                <RegList items={['Camomille.', 'Mélisse.', 'Tilleul.', 'Lavande.', 'Consoude.', 'Plantain.']} />
              </div>
            </div>
            <RegBlock col={`${OBC2}40`}>
              <RegPara>Les plantes demeurent les premiers remèdes lorsque l'état de la mère le permet.</RegPara>
            </RegBlock>
          </>)}

          {/* VI. Sage-femme */}
          {ob2Block(<>
            {ob2Title('CHAPITRE VI', 'Le Rôle de la Sage-Femme')}
            <RegPara>La sage-femme accompagne les accouchements simples.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div style={{ background: `${OBC2}08`, border: `1px solid ${OBC2}30`, borderLeft: `3px solid ${OBC2}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC2_LIGHT, marginBottom: 8 }}>Elle assure</div>
                <RegList items={['La surveillance du travail.', 'Les premiers soins à la mère.', 'Les premiers soins au nouveau-né.']} />
              </div>
              <div style={{ background: 'rgba(160,60,60,0.06)', border: '1px solid rgba(180,60,60,0.35)', borderLeft: '3px solid rgba(180,60,60,0.70)', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#DF9A88', marginBottom: 8 }}>Appel immédiat d'un médecin si</div>
                <RegList items={['Présentation anormale.', 'Hémorragie.', 'Absence de progression du travail.', 'Perte de connaissance de la mère.', 'Toute complication menaçante.']} />
              </div>
            </div>
          </>)}

          {/* VII. Éthique */}
          {ob2Block(<>
            {ob2Title('CHAPITRE VII', 'Éthique de l\'Obstétricien')}
            <RegList items={['Agir avec calme et sang-froid.', 'N\'intervenir jamais sans nécessité.', 'Privilégier toujours la sécurité de la mère et de l\'enfant.', 'Conserver une attitude rassurante et digne.']} />
            <RegCitation text="L'obstétricien ne lutte pas contre la nature ; il lui prête assistance lorsqu'elle ne peut plus agir seule." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${OBC2}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC2_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>L'accouchement demeure l'un des actes les plus exigeants de la médecine. Le praticien doit connaître les mécanismes naturels de la naissance, reconnaître rapidement les complications et intervenir avec discernement.</RegPara>
            <RegPara>En cette année 1890, les progrès de l'antisepsie, de l'observation clinique et de la chirurgie permettent de sauver un nombre croissant de mères et d'enfants.</RegPara>
            <RegCitation text="Le véritable obstétricien unit la science, l'expérience et l'humanité afin d'assurer la venue au monde de chaque enfant dans les meilleures conditions possibles." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {ob2Block(<>
            {ob2Title('PRÉPARATION DE L\'ACCOUCHEMENT')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC2_LIGHT, marginBottom: 8 }}>Matériel</div>
                <RegList items={['Chambre propre, calme et bien aérée.', 'Eau bouillie.', 'Linges et compresses propres.', 'Instruments désinfectés.', 'Bonne source de lumière.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC2_LIGHT, marginBottom: 8 }}>Le praticien</div>
                <RegList items={['Se laver les mains soigneusement.', 'Désinfecter les instruments (eau bouillante ou acide phénique).', 'Préparer les médicaments uniquement si nécessaire.']} />
              </div>
            </div>
          </>)}

          {ob2Block(<>
            {ob2Title('LES TROIS PHASES DU TRAVAIL')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { num: '1', label: 'Dilatation', items: ['Ouverture du col.', 'Fréquence des contractions.', 'État de la mère.', 'Battements du cœur fœtal.'] },
                { num: '2', label: 'Expulsion', items: ['Accompagner sans tirer.', 'Protéger le périnée.', 'Vérifier le cordon.', 'Accueillir avec précaution.'] },
                { num: '3', label: 'Délivrance', items: ['Vérifier le placenta complet.', 'Contrôler les saignements.', 'Surveiller la mère.'] },
              ].map(p => (
                <div key={p.num} style={{ background: `${OBC2}10`, border: `1px solid ${OBC2}30`, borderTop: `2px solid ${OBC2}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC2_LIGHT, marginBottom: 8 }}>{p.num}. {p.label}</div>
                  <RegList items={p.items} />
                </div>
              ))}
            </div>
          </>)}

          {ob2Block(<>
            {ob2Title('PRÉSENTATIONS DU FŒTUS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Céphalique', col: '#206040', note: 'Position normale.' },
                { label: 'Par le siège', col: '#8A6010', note: 'Surveillance renforcée.' },
                { label: 'Transverse', col: '#8A2020', note: 'Intervention souvent nécessaire.' },
                { label: 'Oblique', col: '#5A3080', note: 'Surveillance constante.' },
              ].map(p => (
                <div key={p.label} style={{ background: T.card, border: `1px solid ${p.col}40`, borderLeft: `3px solid ${p.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: p.col, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: T.muted }}>{p.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {ob2Block(<>
            {ob2Title('PRINCIPALES COMPLICATIONS')}
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Le médecin doit reconnaître rapidement :</RegPara>
              <RegList items={['Hémorragie.', 'Rétention du placenta.', 'Procidence du cordon.', 'Éclampsie.', 'Fièvre puerpérale.', 'Travail prolongé.']} />
              <RegPara>Toute complication impose une surveillance immédiate.</RegPara>
            </RegBlock>
          </>)}

          {ob2Block(<>
            {ob2Title('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC2_LIGHT, marginBottom: 8 }}>Médicaments</div>
                <RegList items={['Laudanum.', 'Éther.', 'Chloroforme.', 'Ergot de seigle.', 'Acide phénique.', 'Teinture d\'iode.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#A8B991', marginBottom: 8 }}>Végétaux</div>
                <RegList items={['Camomille.', 'Mélisse.', 'Lavande.', 'Tilleul.', 'Consoude.', 'Plantain.']} />
              </div>
            </div>
          </>)}

          {ob2Block(<>
            {ob2Title('RÔLE DE LA SAGE-FEMME')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: OBC2_LIGHT, marginBottom: 8 }}>Elle prend en charge</div>
                <RegList items={['Surveillance du travail.', 'Assistance à la naissance.', 'Premiers soins mère/enfant.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', marginBottom: 8 }}>Appel médecin si</div>
                <RegList items={['Présentation anormale.', 'Hémorragie.', 'Travail bloqué.', 'Perte de connaissance.', 'Complication grave.']} />
              </div>
            </div>
          </>)}

          <RegBlock col={`${OBC2}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC2_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Respecter une antisepsie rigoureuse avant tout accouchement.', 'Connaître les trois phases du travail.', 'Identifier les différentes présentations du fœtus.', 'Reconnaître rapidement les complications obstétricales.', 'Employer les médicaments avec prudence.', 'Les plantes complètent les soins mais ne remplacent jamais une intervention nécessaire.', 'L\'objectif premier est de protéger simultanément la mère et l\'enfant.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours d'Obstétrique III ── */

const OBC3 = '#1A5A40';
const OBC3_LIGHT = '#60A880';

function ObstetriqueIIIDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const ob3Block = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${OBC3}40`, borderTop: `3px solid ${OBC3}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const ob3Title = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: OBC3_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${OBC3}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${OBC3}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${OBC3}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${OBC3}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${OBC3}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: OBC3_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS D'OBSTÉTRIQUE III ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: OBC3_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🍼 Soins de la Mère et du Nouveau-né</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Post-partum · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${OBC3_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? OBC3_LIGHT : T.border}`, background: version === v ? `${OBC3}30` : 'transparent', color: version === v ? OBC3_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${OBC3}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC3_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>La naissance ne marque point la fin des devoirs du médecin, mais le commencement d'une nouvelle surveillance.</RegPara>
            <RegPara>Les heures et les jours qui suivent l'accouchement sont parmi les plus dangereux pour la mère comme pour l'enfant. Une hémorragie, une infection ou une faiblesse du nouveau-né peuvent rapidement compromettre des vies que l'accouchement avait pourtant préservées.</RegPara>
            <RegCitation text="Le praticien doit poursuivre ses soins avec la même vigilance qu'au cours de la grossesse et de la naissance." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Premiers soins à la mère */}
          {ob3Block(<>
            {ob3Title('CHAPITRE I', 'Les Premiers Soins à la Mère')}
            <RegPara>Après la délivrance, le médecin examine immédiatement la mère.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
              {['L\'importance des saignements.', 'La bonne contraction de l\'utérus.', 'L\'absence de déchirures importantes.', 'Le pouls.', 'La température.', 'L\'état général.'].map(item => (
                <div key={item} style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 14, color: T.text, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: OBC3_LIGHT, fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute hémorragie abondante constitue une urgence.</RegPara>
            </RegBlock>
            <RegPara>La mère doit être maintenue au repos dans une chambre propre, calme et correctement ventilée.</RegPara>
          </>)}

          {/* II. Premiers soins au nouveau-né */}
          {ob3Block(<>
            {ob3Title('CHAPITRE II', 'Les Premiers Soins au Nouveau-né')}
            <RegPara>Dès la naissance, le médecin ou la sage-femme :</RegPara>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {[
                { num: '1', label: 'Voies respiratoires', desc: 'Dégager les voies respiratoires. Vérifier la respiration. Stimuler doucement l\'enfant si nécessaire.' },
                { num: '2', label: 'Réchauffement', desc: 'Sécher soigneusement le nouveau-né. Le maintenir au chaud.' },
                { num: '3', label: 'Cordon ombilical', desc: 'Ligaturer avec un fil propre puis sectionner à l\'aide d\'un instrument désinfecté. Maintenir le moignon propre jusqu\'à sa chute naturelle.' },
              ].map(s => (
                <div key={s.num} style={{ background: T.card, border: `1px solid ${OBC3}35`, borderLeft: `4px solid ${OBC3}`, padding: '14px 18px', display: 'flex', gap: 14 }}>
                  <div style={{ width: 30, height: 30, background: `${OBC3}20`, border: `1px solid ${OBC3}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 16, color: OBC3_LIGHT, flexShrink: 0 }}>{s.num}</div>
                  <div>
                    <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC3_LIGHT, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontFamily: BODY, fontSize: 14, color: T.text, lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* III. Examen nouveau-né */}
          {ob3Block(<>
            {ob3Title('CHAPITRE III', 'Examen du Nouveau-né')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}30`, borderLeft: `3px solid ${OBC3}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 10 }}>Le praticien observe</div>
                <RegList items={['La respiration.', 'Les cris.', 'La coloration de la peau.', 'Les mouvements des membres.', 'La tonicité.', 'Les réflexes primitifs.']} />
              </div>
              <div style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}30`, borderLeft: `3px solid ${OBC3}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 10 }}>Il recherche également</div>
                <RegList items={['Des malformations apparentes.', 'Des fractures liées à l\'accouchement.', 'Des difficultés respiratoires.']} />
              </div>
            </div>
          </>)}

          {/* IV. Allaitement */}
          {ob3Block(<>
            {ob3Title('CHAPITRE IV', 'Allaitement')}
            <RegPara>Lorsque l'état de la mère le permet, l'allaitement est recommandé dès les premières heures.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 10 }}>Le médecin vérifie</div>
                <RegList items={['La bonne prise du sein.', 'La montée de lait.', 'L\'absence de douleurs importantes.', 'L\'état des mamelons.']} />
              </div>
              <RegBlock col={`${OBC3}40`}>
                <RegPara>Si l'allaitement est impossible, le nourrisson reçoit un lait animal convenablement préparé et administré avec la plus grande prudence.</RegPara>
              </RegBlock>
            </div>
          </>)}

          {/* V. Surveillance suites de couches */}
          {ob3Block(<>
            {ob3Title('CHAPITRE V', 'Surveillance des Suites de Couches')}
            <RegPara>Durant les semaines suivant l'accouchement, le médecin surveille :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div style={{ background: T.card, border: `1px solid ${OBC3}35`, borderTop: `2px solid ${OBC3}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC3_LIGHT, marginBottom: 10 }}>Chez la mère</div>
                <RegList items={['La température.', 'Les saignements.', 'Les douleurs.', 'La régression de l\'utérus.', 'L\'état psychologique.', 'La cicatrisation des déchirures.']} />
              </div>
              <div style={{ background: T.card, border: `1px solid ${OBC3}35`, borderTop: `2px solid ${OBC3}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: OBC3_LIGHT, marginBottom: 10 }}>Chez l'enfant</div>
                <RegList items={['La prise de poids.', 'La respiration.', 'L\'alimentation.', 'Le sommeil.', 'Le cordon ombilical.']} />
              </div>
            </div>
            <RegBlock col={`${OBC3}40`}>
              <RegPara>Chaque visite est inscrite dans le registre obstétrical.</RegPara>
            </RegBlock>
          </>)}

          {/* VI. Complications post-partum */}
          {ob3Block(<>
            {ob3Title('CHAPITRE VI', 'Les Complications du Post-partum')}
            <RegPara>Le praticien doit reconnaître rapidement :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.40)', borderLeft: '4px solid rgba(180,60,60,0.70)', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#DF9A88', marginBottom: 10 }}>Chez la mère</div>
                <RegList items={['Hémorragie secondaire.', 'Fièvre puerpérale.', 'Infection utérine.', 'Abcès mammaire.', 'Rétention de débris placentaires.', 'Épuisement important.']} />
              </div>
              <div style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.40)', borderLeft: '4px solid rgba(180,60,60,0.70)', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#DF9A88', marginBottom: 10 }}>Chez le nouveau-né</div>
                <RegList items={['Difficultés respiratoires.', 'Refus de téter.', 'Fièvre.', 'Faiblesse générale.', 'Infection du cordon.', 'Convulsions.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute aggravation impose une surveillance médicale immédiate.</RegPara>
            </RegBlock>
          </>)}

          {/* VII. Hygiène et antisepsie */}
          {ob3Block(<>
            {ob3Title('CHAPITRE VII', 'Hygiène et Antisepsie')}
            <RegPara>Les progrès récents de la médecine imposent des règles strictes. Le médecin veille à :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Se laver soigneusement les mains avant chaque soin.', 'Désinfecter les instruments.', 'Utiliser du linge propre.', 'Faire bouillir l\'eau destinée aux soins.', 'Renouveler régulièrement les pansements.'].map(item => (
                <div key={item} style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}30`, padding: '12px 14px', fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65 }}>{item}</div>
              ))}
            </div>
            <RegBlock col={`${OBC3}40`}>
              <RegPara>Une bonne hygiène demeure la meilleure protection contre la fièvre puerpérale.</RegPara>
            </RegBlock>
          </>)}

          {/* VIII. Médicaments */}
          {ob3Block(<>
            {ob3Title('CHAPITRE VIII', 'Médicaments et Préparations Autorisés')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ background: T.card, border: `1px solid rgba(80,140,80,0.35)`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#A8B991', marginBottom: 10 }}>Préparations végétales</div>
                <RegList items={['Camomille.', 'Mélisse.', 'Tilleul.', 'Lavande.', 'Plantain.', 'Consoude.']} />
              </div>
              <div style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 10 }}>Préparations du dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.']} />
              </div>
              <div style={{ background: T.card, border: `1px solid rgba(209,183,124,0.35)`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: T.gold, marginBottom: 10 }}>Médicaments modernes</div>
                <RegList items={['Laudanum (douleurs importantes uniquement).', 'Acide phénique (désinfection).', 'Teinture d\'iode.']} />
              </div>
            </div>
            <RegBlock col={`${OBC3}40`}>
              <RegPara>Toute prescription doit être adaptée à l'état de la mère.</RegPara>
            </RegBlock>
          </>)}

          {/* IX. Éthique */}
          {ob3Block(<>
            {ob3Title('CHAPITRE IX', 'Éthique de l\'Obstétricien')}
            <RegPara>Le devoir du médecin ne s'arrête pas à la naissance. Il accompagne la mère dans sa convalescence et veille au bon développement du nouveau-né.</RegPara>
            <RegList items={['Faire preuve de douceur.', 'Respecter la dignité de la famille.', 'Préserver le secret médical.', 'Rassurer sans négliger les signes de gravité.']} />
            <RegCitation text="La vigilance des premiers jours conditionne souvent la santé des semaines à venir." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${OBC3}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC3_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le succès d'un accouchement ne se mesure pas uniquement à la naissance de l'enfant. Il se juge également à la bonne santé de la mère durant les suites de couches et au développement harmonieux du nouveau-né.</RegPara>
            <RegPara>En cette année 1890, les progrès de l'antisepsie et de l'observation clinique permettent de réduire considérablement les complications du post-partum, à condition que le médecin demeure attentif, méthodique et rigoureux.</RegPara>
            <RegCitation text="Prendre soin de la mère, c'est protéger la famille. Prendre soin de l'enfant, c'est préparer l'avenir." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {ob3Block(<>
            {ob3Title('PREMIERS SOINS À LA MÈRE')}
            <RegPara>Après l'accouchement, le médecin vérifie :</RegPara>
            <RegList items={['Les saignements.', 'La bonne contraction de l\'utérus.', 'Les éventuelles déchirures.', 'Le pouls.', 'La température.', 'L\'état général.']} />
            <RegPara>La mère doit rester au repos dans une chambre propre, calme et bien aérée.</RegPara>
          </>)}

          {ob3Block(<>
            {ob3Title('PREMIERS SOINS AU NOUVEAU-NÉ')}
            <RegList items={['Dégager les voies respiratoires.', 'Vérifier la respiration.', 'Sécher et réchauffer l\'enfant.', 'Ligaturer puis couper le cordon avec un matériel désinfecté.', 'Maintenir le cordon propre jusqu\'à sa chute.']} />
          </>)}

          {ob3Block(<>
            {ob3Title('EXAMEN DU NOUVEAU-NÉ')}
            <RegList items={['La respiration.', 'Les cris.', 'La couleur de la peau.', 'Les mouvements.', 'Les réflexes.', 'Les éventuelles malformations ou blessures.']} />
          </>)}

          {ob3Block(<>
            {ob3Title('ALLAITEMENT')}
            <RegPara>Lorsque possible :</RegPara>
            <RegList items={['Débuter l\'allaitement dans les premières heures.', 'Vérifier la bonne prise du sein.', 'Surveiller la montée de lait.', 'Contrôler l\'état des mamelons.']} />
            <RegPara>En cas d'impossibilité, utiliser un lait animal préparé avec la plus grande hygiène.</RegPara>
          </>)}

          {ob3Block(<>
            {ob3Title('SURVEILLANCE DES SUITES DE COUCHES')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 8 }}>Chez la mère</div>
                <RegList items={['Température.', 'Pouls.', 'Saignements.', 'Douleurs.', 'Régression de l\'utérus.', 'Cicatrisation.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: OBC3_LIGHT, marginBottom: 8 }}>Chez le nouveau-né</div>
                <RegList items={['Respiration.', 'Alimentation.', 'Prise de poids.', 'Sommeil.', 'Cordon ombilical.']} />
              </div>
            </div>
            <RegPara>Toutes les observations sont consignées dans le registre obstétrical.</RegPara>
          </>)}

          {ob3Block(<>
            {ob3Title('COMPLICATIONS À RECONNAÎTRE')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.35)', borderLeft: '3px solid rgba(180,60,60,0.70)', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', marginBottom: 8 }}>Chez la mère</div>
                <RegList items={['Hémorragie.', 'Fièvre puerpérale.', 'Infection.', 'Abcès mammaire.', 'Rétention placentaire.', 'Épuisement.']} />
              </div>
              <div style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.35)', borderLeft: '3px solid rgba(180,60,60,0.70)', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', marginBottom: 8 }}>Chez le nouveau-né</div>
                <RegList items={['Difficultés respiratoires.', 'Refus de téter.', 'Fièvre.', 'Infection du cordon.', 'Convulsions.', 'Faiblesse.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute aggravation nécessite une intervention médicale immédiate.</RegPara>
            </RegBlock>
          </>)}

          {ob3Block(<>
            {ob3Title('HYGIÈNE ET ANTISEPSIE')}
            <RegList items={['Se laver les mains.', 'Désinfecter les instruments.', 'Utiliser des linges propres.', 'Employer de l\'eau bouillie.', 'Renouveler régulièrement les pansements.']} />
          </>)}

          {ob3Block(<>
            {ob3Title('MÉDICAMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Végétaux', col: '#A8B991', items: ['Camomille.', 'Mélisse.', 'Tilleul.', 'Lavande.', 'Plantain.', 'Consoude.'] },
                { label: 'Dispensaire', col: OBC3_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.'] },
                { label: 'Médicaments', col: T.gold, items: ['Laudanum (douleurs).', 'Acide phénique.', 'Teinture d\'iode.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${OBC3}08`, border: `1px solid ${OBC3}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${OBC3}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: OBC3_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['La surveillance se poursuit après la naissance.', 'La mère et le nouveau-né doivent être examinés quotidiennement.', 'L\'allaitement est privilégié lorsqu\'il est possible.', 'Une hygiène rigoureuse prévient la majorité des infections.', 'Toute complication doit être prise en charge rapidement.', 'Le rôle de l\'obstétricien est d\'assurer la santé de la mère comme celle de l\'enfant jusqu\'à leur complet rétablissement.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours de Traitement Physiologique ── */

const TPC = '#4A6080';
const TPC_LIGHT = '#80A8C8';

function TraitementPhysioDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const tpBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${TPC}40`, borderTop: `3px solid ${TPC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const tpTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${TPC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${TPC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${TPC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${TPC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${TPC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: TPC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE TRAITEMENT PHYSIOLOGIQUE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: TPC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🦴 Soins des Fractures et Convalescence</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Chirurgie osseuse · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${TPC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? TPC_LIGHT : T.border}`, background: version === v ? `${TPC}30` : 'transparent', color: version === v ? TPC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${TPC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Une fracture ne brise pas seulement un os ; elle éprouve la force du corps tout entier.</RegPara>
            <RegPara>Le devoir du médecin est de rétablir l'alignement des os, prévenir l'infection, soulager la douleur et accompagner le malade jusqu'à sa complète guérison.</RegPara>
            <RegPara>Les progrès récents de la chirurgie et de l'antisepsie, enseignés par les travaux de Lister et de Pasteur, ont considérablement réduit les complications des fractures. Cependant, les plantes médicinales demeurent de précieuses alliées durant la consolidation et la convalescence.</RegPara>
            <RegCitation text="Le véritable praticien associe désormais les connaissances modernes aux ressources éprouvées de la médecine végétale." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Reconnaissance */}
          {tpBlock(<>
            {tpTitle('CHAPITRE I', 'Reconnaissance des Fractures')}
            <RegPara>Avant tout traitement, le médecin doit déterminer la nature de la fracture.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
              {[
                { label: 'Fracture simple', col: '#206040', desc: 'L\'os est rompu sans ouverture de la peau.' },
                { label: 'Fracture ouverte', col: '#8A2020', desc: 'La peau est perforée. Le risque d\'infection est particulièrement élevé.' },
                { label: 'Fracture déplacée', col: '#8A6010', desc: 'Les fragments osseux ne sont plus correctement alignés.' },
                { label: 'Fracture multiple', col: '#5A3080', desc: 'Plusieurs cassures sur un même os. Résulte généralement d\'un traumatisme violent.' },
              ].map(f => (
                <div key={f.label} style={{ background: T.card, border: `1px solid ${f.col}50`, borderTop: `3px solid ${f.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: f.col, marginBottom: 6 }}>{f.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.16em', marginBottom: 10 }}>SIGNES CLINIQUES RECHERCHÉS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {['Douleur vive.', 'Impotence fonctionnelle.', 'Gonflement.', 'Déformation visible.', 'Mobilité anormale.', 'Crépitement osseux à la palpation.'].map(s => (
                  <div key={s} style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: TPC_LIGHT, fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>{s}
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* II. Principes généraux */}
          {tpBlock(<>
            {tpTitle('CHAPITRE II', 'Principes Généraux du Traitement')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Douleur */}
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `4px solid ${TPC}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TPC_LIGHT, marginBottom: 12 }}>Soulagement de la douleur</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Douleurs légères', items: ['Camomille.', 'Valériane.'] },
                    { label: 'Douleurs importantes', items: ['Élixir Parégorique.', 'Laudanum (sous surveillance).'] },
                    { label: 'Chirurgie / Réduction', items: ['Éther.', 'Chloroforme.'] },
                  ].map(g => (
                    <div key={g.label} style={{ background: T.paper, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 13, color: TPC_LIGHT, marginBottom: 6 }}>{g.label}</div>
                      <RegList items={g.items} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Antisepsie */}
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `4px solid ${TPC}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TPC_LIGHT, marginBottom: 12 }}>Antisepsie</div>
                <RegPara>Avant toute manipulation :</RegPara>
                <RegList items={['Lavage soigneux des mains.', 'Instruments désinfectés à l\'eau bouillante ou à l\'acide phénique.', 'Nettoyage de la peau.', 'Irrigation de la plaie avec de l\'eau bouillie.']} />
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: '#C87060', letterSpacing: '0.14em', marginBottom: 6 }}>EN CAS DE FRACTURE OUVERTE</div>
                  <RegList items={['Eau Vulnéraire.', 'Acide phénique dilué.', 'Teinture d\'iode lorsque nécessaire.']} />
                </div>
              </div>
              {/* Réduction */}
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `4px solid ${TPC}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TPC_LIGHT, marginBottom: 10 }}>Réduction</div>
                <RegPara>La réduction consiste à replacer les fragments osseux dans leur position naturelle. Elle doit être réalisée avec douceur. Aucune traction excessive ne doit être exercée.</RegPara>
                <RegCitation text="Toute réduction difficile doit être confiée au médecin le plus expérimenté." author="Doctrine du Dispensaire, 1890" />
              </div>
              {/* Immobilisation */}
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `4px solid ${TPC}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TPC_LIGHT, marginBottom: 10 }}>Immobilisation</div>
                <RegPara>Le membre est immobilisé selon les moyens disponibles :</RegPara>
                <RegList items={['Attelles de bois.', 'Gouttières.', 'Bandages.', 'Plâtre de Paris lorsque disponible.']} />
                <RegBlock col={`${TPC}40`}>
                  <RegPara>Une immobilisation correcte demeure le principal traitement des fractures.</RegPara>
                </RegBlock>
              </div>
            </div>
          </>)}

          {/* III. Traitement par type */}
          {tpBlock(<>
            {tpTitle('CHAPITRE III', 'Traitement selon le Type de Fracture')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  label: 'A. Fracture simple', col: '#206040',
                  steps: ['Réduction.', 'Immobilisation.', 'Surveillance quotidienne.'],
                  extra: 'Plantes recommandées : Consoude, Prêle, Romarin. Durée : bras 5-6 semaines, jambe 8-10 semaines.',
                },
                {
                  label: 'B. Fracture ouverte', col: '#8A2020',
                  steps: ['Retirer uniquement les tissus morts et corps étrangers.', 'Désinfecter soigneusement.', 'Suturer uniquement lorsque la plaie est propre.', 'Appliquer Eau Vulnéraire et Onguent Vulnéraire.', 'Poser des pansements propres.', 'Immobiliser.'],
                  extra: null,
                },
                {
                  label: 'C. Fracture multiple', col: '#5A3080',
                  steps: ['Contrôle de la douleur.', 'Réduction progressive.', 'Immobilisation prolongée.', 'Surveillance quotidienne.'],
                  extra: 'Les fragments encore vivants sont conservés. Seuls les fragments totalement libres sont retirés.',
                },
                {
                  label: 'D. Fracture déplacée', col: '#8A6010',
                  steps: ['Réduction sous surveillance médicale.', 'Anesthésie à l\'éther ou au chloroforme si nécessaire.', 'Immobilisation solide indispensable.'],
                  extra: null,
                },
              ].map(f => (
                <div key={f.label} style={{ background: T.card, border: `1px solid ${f.col}40`, borderLeft: `4px solid ${f.col}`, padding: '16px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: f.col, marginBottom: 10 }}>{f.label}</div>
                  <RegList items={f.steps} />
                  {f.extra && <RegBlock col={`${TPC}40`}><RegPara>{f.extra}</RegPara></RegBlock>}
                </div>
              ))}
            </div>
          </>)}

          {/* IV. Surveillance */}
          {tpBlock(<>
            {tpTitle('CHAPITRE IV', 'Surveillance de la Consolidation')}
            <RegPara>Chaque jour, le médecin contrôle :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Température.', 'Pouls.', 'Douleur.', 'Coloration du membre.', 'Chaleur locale.', 'Sensibilité.', 'Mobilité des doigts ou des orteils.'].map(item => (
                <div key={item} style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TPC_LIGHT, fontSize: 10 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute aggravation doit être immédiatement recherchée.</RegPara>
            </RegBlock>
          </>)}

          {/* V. Complications */}
          {tpBlock(<>
            {tpTitle('CHAPITRE V', 'Complications')}
            <RegPara>Le praticien doit reconnaître rapidement :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Infection.', 'Suppuration.', 'Gangrène.', 'Hémorragie.', 'Retard de consolidation.', 'Mauvaise position de l\'os.'].map(c => (
                <div key={c} style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.35)', padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#DF9A88', fontSize: 10 }}>◆</span>{c}
                </div>
              ))}
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Une fièvre persistante ou une mauvaise odeur de la plaie imposent un examen complet.</RegPara>
            </RegBlock>
          </>)}

          {/* VI. Médecine végétale */}
          {tpBlock(<>
            {tpTitle('CHAPITRE VI', 'Médecine Végétale et Pharmaceutique')}
            <RegPara>Les plantes accompagnent la consolidation sans remplacer les traitements chirurgicaux.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 14 }}>
              <div style={{ background: T.card, border: 'rgba(80,140,80,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#A8B991', marginBottom: 10 }}>Préparations végétales</div>
                <RegList items={['Consoude.', 'Prêle.', 'Ortie.', 'Plantain.', 'Romarin.', 'Lavande.', 'Sauge.', 'Calendula.', 'Échinacée.']} />
              </div>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TPC_LIGHT, marginBottom: 10 }}>Préparations du dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: T.gold, marginBottom: 10 }}>Médicaments</div>
                <RegList items={['Laudanum.', 'Élixir Parégorique.', 'Éther.', 'Chloroforme.', 'Acide phénique.', 'Teinture d\'iode.']} />
              </div>
            </div>
          </>)}

          {/* VII. Convalescence */}
          {tpBlock(<>
            {tpTitle('CHAPITRE VII', 'Convalescence')}
            <RegPara>Une fois la consolidation obtenue, le médecin recommande :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `3px solid ${TPC}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TPC_LIGHT, marginBottom: 10 }}>Alimentation et soins</div>
                <RegList items={['Bouillons, légumes et lait.', 'Infusions de consoude, prêle ou ortie.', 'Massages légers à la Pommade Camphrée ou à l\'huile de Millepertuis.'] } />
              </div>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}30`, borderLeft: `3px solid ${TPC}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TPC_LIGHT, marginBottom: 10 }}>Mobilisation progressive</div>
                <RegList items={['Reprise progressive de la marche.', 'Mouvements doux des articulations.', 'Éviter le repos excessif qui retarde le retour de la mobilité.']} />
              </div>
            </div>
          </>)}

          {/* VIII. Éthique */}
          {tpBlock(<>
            {tpTitle('CHAPITRE VIII', 'Éthique du Praticien')}
            <RegPara>Le médecin traite autant la fracture que le malade.</RegPara>
            <RegList items={['Soulager la douleur.', 'Prévenir l\'infection.', 'Surveiller quotidiennement la consolidation.', 'Adapter les traitements selon l\'évolution.']} />
            <RegCitation text="La patience demeure l'un des meilleurs remèdes de la chirurgie osseuse." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${TPC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le traitement d'une fracture repose sur quatre principes fondamentaux : reconnaître correctement la blessure, réduire l'os avec précision, immobiliser solidement le membre, prévenir toute infection.</RegPara>
            <RegPara>En cette année 1890, l'association de l'antisepsie moderne, des techniques chirurgicales et de la médecine végétale permet d'obtenir une consolidation plus sûre et une convalescence plus rapide.</RegPara>
            <RegCitation text="Le véritable médecin ne cherche pas seulement à réparer un os : il accompagne le malade jusqu'à ce qu'il retrouve pleinement sa force et son autonomie." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {tpBlock(<>
            {tpTitle('RECONNAÎTRE UNE FRACTURE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Simple', col: '#206040', note: 'Os rompu, peau intacte.' },
                { label: 'Ouverte', col: '#8A2020', note: 'Peau perforée, risque infectieux élevé.' },
                { label: 'Déplacée', col: '#8A6010', note: 'Fragments mal alignés.' },
                { label: 'Multiple', col: '#5A3080', note: 'Plusieurs cassures, traumatisme violent.' },
              ].map(f => (
                <div key={f.label} style={{ background: T.card, border: `1px solid ${f.col}40`, borderLeft: `3px solid ${f.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: f.col, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted }}>{f.note}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.12em', marginBottom: 8 }}>SIGNES PRINCIPAUX</div>
              <RegList items={['Douleur vive.', 'Déformation du membre.', 'Gonflement.', 'Impossibilité de mouvement.', 'Crépitement osseux.']} />
            </div>
          </>)}

          {tpBlock(<>
            {tpTitle('PRINCIPES DU TRAITEMENT')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TPC_LIGHT, marginBottom: 8 }}>Douleur</div>
                <RegList items={['Légère : Camomille, Valériane.', 'Importante : Élixir Parégorique, Laudanum.', 'Chirurgie : Éther, Chloroforme.']} />
              </div>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TPC_LIGHT, marginBottom: 8 }}>Antisepsie</div>
                <RegList items={['Laver les mains.', 'Désinfecter les instruments.', 'Nettoyer à l\'eau bouillie.', 'Fracture ouverte : Eau Vulnéraire + Acide phénique.']} />
              </div>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TPC_LIGHT, marginBottom: 8 }}>Réduction</div>
                <RegList items={['Remettre l\'os en place avec douceur.', 'Ne jamais forcer.', 'Appel médecin expérimenté si difficile.']} />
              </div>
              <div style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TPC_LIGHT, marginBottom: 8 }}>Immobilisation</div>
                <RegList items={['Attelles, gouttières, bandages.', 'Plâtre de Paris si disponible.', 'Indispensable à la consolidation.']} />
              </div>
            </div>
          </>)}

          {tpBlock(<>
            {tpTitle('TRAITEMENT PAR TYPE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Simple', col: '#206040', items: ['Réduction.', 'Immobilisation.', 'Surveillance quotidienne.'] },
                { label: 'Ouverte', col: '#8A2020', items: ['Nettoyage complet.', 'Désinfection.', 'Retrait tissus morts.', 'Immobilisation.'] },
                { label: 'Multiple', col: '#5A3080', items: ['Contrôle douleur.', 'Réduction progressive.', 'Immobilisation prolongée.'] },
                { label: 'Déplacée', col: '#8A6010', items: ['Réduction sous surveillance.', 'Anesthésie si nécessaire.', 'Immobilisation solide.'] },
              ].map(f => (
                <div key={f.label} style={{ background: T.card, border: `1px solid ${f.col}40`, borderTop: `2px solid ${f.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: f.col, marginBottom: 8 }}>{f.label}</div>
                  <RegList items={f.items} />
                </div>
              ))}
            </div>
          </>)}

          {tpBlock(<>
            {tpTitle('SURVEILLANCE')}
            <RegPara>Contrôler chaque jour :</RegPara>
            <RegList items={['Température.', 'Pouls.', 'Douleur.', 'Couleur du membre.', 'Chaleur locale.', 'Sensibilité.', 'Mobilité des doigts ou des orteils.']} />
          </>)}

          {tpBlock(<>
            {tpTitle('COMPLICATIONS')}
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Surveiller l'apparition de :</RegPara>
              <RegList items={['Infection.', 'Suppuration.', 'Gangrène.', 'Hémorragie.', 'Retard de consolidation.', 'Mauvais alignement de l\'os.']} />
              <RegPara>Toute aggravation impose un nouvel examen.</RegPara>
            </RegBlock>
          </>)}

          {tpBlock(<>
            {tpTitle('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Végétaux', col: '#A8B991', items: ['Consoude.', 'Prêle.', 'Ortie.', 'Plantain.', 'Romarin.', 'Lavande.', 'Sauge.', 'Calendula.', 'Échinacée.'] },
                { label: 'Dispensaire', col: TPC_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.'] },
                { label: 'Médicaments', col: T.gold, items: ['Laudanum.', 'Élixir Parégorique.', 'Éther.', 'Chloroforme.', 'Acide phénique.', 'Teinture d\'iode.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${TPC}08`, border: `1px solid ${TPC}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          {tpBlock(<>
            {tpTitle('CONVALESCENCE')}
            <RegList items={['Repos adapté.', 'Reprise progressive de la marche.', 'Exercices doux.', 'Massages légers.', 'Alimentation riche (bouillons, légumes, lait).', 'Infusions fortifiantes : Consoude, Prêle, Ortie.']} />
          </>)}

          <RegBlock col={`${TPC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TPC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Identifier correctement le type de fracture avant toute intervention.', 'Soulager la douleur selon sa gravité.', 'Désinfecter avant toute manipulation.', 'Réduire puis immobiliser correctement le membre.', 'Surveiller quotidiennement l\'évolution.', 'Associer chirurgie, antisepsie et médecine végétale pour favoriser une consolidation durable.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours de Traumatologie ── */

const TRU = '#6A3A10';
const TRU_LIGHT = '#C07030';

function TraumatologieDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const truBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${TRU}40`, borderTop: `3px solid ${TRU}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const truTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${TRU}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${TRU}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${TRU}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${TRU}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${TRU}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: TRU_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE TRAUMATOLOGIE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: TRU_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🩹 Traumatismes des Membres</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Foulures, entorses, luxations · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${TRU_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? TRU_LIGHT : T.border}`, background: version === v ? `${TRU}30` : 'transparent', color: version === v ? TRU_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${TRU}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Les membres de l'homme sont les premiers instruments de son travail, de sa défense et de sa subsistance. Ils sont également les plus exposés aux blessures causées par les chutes, les chevaux, les armes, les outils ou les efforts excessifs.</RegPara>
            <RegPara>Le médecin doit reconnaître rapidement la nature du traumatisme, soulager la douleur, prévenir les complications et favoriser une récupération complète.</RegPara>
            <RegCitation text="Les progrès récents de la chirurgie, de l'antisepsie et de la pharmacologie permettent désormais d'obtenir une guérison plus rapide, à condition de respecter les règles de la médecine moderne sans négliger les bienfaits de la médecine végétale." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Reconnaissance */}
          {truBlock(<>
            {truTitle('CHAPITRE I', 'Reconnaître les Traumatismes')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Foulure', col: '#206040', desc: 'Étirement des ligaments sans rupture importante.' },
                { label: 'Entorse', col: '#8A6010', desc: 'Déchirure partielle ou complète des ligaments avec gonflement et douleur importante.' },
                { label: 'Luxation', col: '#8A2020', desc: 'Déplacement d\'une articulation avec perte de son alignement naturel.' },
                { label: 'Déboîtement ancien', col: '#5A3080', desc: 'Luxation non réduite ayant cicatrisé dans une mauvaise position.' },
              ].map(t => (
                <div key={t.label} style={{ background: T.card, border: `1px solid ${t.col}50`, borderTop: `3px solid ${t.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: t.col, marginBottom: 6 }}>{t.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65 }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.16em', marginBottom: 10 }}>SIGNES CLINIQUES RECHERCHÉS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {['Douleur.', 'Gonflement.', 'Chaleur locale.', 'Déformation.', 'Impotence fonctionnelle.', 'Perte de mobilité.', 'Coloration anormale.', 'Diminution de la sensibilité.'].map(s => (
                <div key={s} style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TRU_LIGHT, fontSize: 10, flexShrink: 0 }}>◆</span>{s}
                </div>
              ))}
            </div>
          </>)}

          {/* II. Principes généraux */}
          {truBlock(<>
            {truTitle('CHAPITRE II', 'Principes Généraux du Traitement')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, borderLeft: `4px solid ${TRU}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TRU_LIGHT, marginBottom: 12 }}>Soulagement de la douleur</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Douleurs légères', items: ['Camomille.', 'Valériane.'] },
                    { label: 'Douleurs modérées', items: ['Élixir Parégorique.'] },
                    { label: 'Douleurs importantes', items: ['Laudanum (sous surveillance).'] },
                    { label: 'Réduction difficile', items: ['Éther.', 'Chloroforme.'] },
                  ].map(g => (
                    <div key={g.label} style={{ background: T.paper, border: `1px solid ${TRU}25`, padding: '12px 14px' }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 13, color: TRU_LIGHT, marginBottom: 6 }}>{g.label}</div>
                      <RegList items={g.items} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, borderLeft: `4px solid ${TRU}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TRU_LIGHT, marginBottom: 10 }}>Antisepsie</div>
                <RegList items={['Lavage soigneux des mains.', 'Désinfection des instruments.', 'Nettoyage du membre à l\'eau bouillie.', 'Acide phénique ou Teinture d\'iode lorsqu\'une plaie est présente.']} />
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, borderLeft: `4px solid ${TRU}`, padding: '18px 22px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: TRU_LIGHT, marginBottom: 10 }}>Immobilisation</div>
                <RegPara>Tout membre traumatisé est immobilisé jusqu'à confirmation du diagnostic.</RegPara>
                <RegList items={['Écharpes.', 'Attelles.', 'Bandages.', 'Gouttières.', 'Plâtre lorsque nécessaire.']} />
              </div>
            </div>
          </>)}

          {/* III. Froid et chaleur */}
          {truBlock(<>
            {truTitle('CHAPITRE III', 'Traitement par le Froid et la Chaleur')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(40,80,160,0.08)', border: '1px solid rgba(40,80,160,0.35)', borderTop: '3px solid rgba(40,80,160,0.70)', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#6080C0', marginBottom: 10 }}>Premières 24 heures</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#6080C0', letterSpacing: '0.12em', marginBottom: 8 }}>APPLIQUER</div>
                <RegList items={['Compresses froides.', 'Eau fraîche.', 'Linges humides.']} />
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#6080C0', letterSpacing: '0.12em', margin: '10px 0 8px' }}>LE FROID LIMITE</div>
                <RegList items={['La douleur.', 'L\'œdème.', 'L\'inflammation.']} />
              </div>
              <div style={{ background: 'rgba(160,80,40,0.08)', border: '1px solid rgba(160,80,40,0.35)', borderTop: '3px solid rgba(160,80,40,0.70)', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, color: '#C07050', marginBottom: 10 }}>Après 24 heures</div>
                <RegList items={['Chaleur modérée.', 'Cataplasmes tièdes.', 'Massages légers lorsque l\'inflammation disparaît.']} />
                <RegBlock col="rgba(160,80,40,0.40)">
                  <RegPara>Cette alternance favorise la circulation sanguine et la réparation des tissus.</RegPara>
                </RegBlock>
              </div>
            </div>
          </>)}

          {/* IV. Traitement par traumatisme */}
          {truBlock(<>
            {truTitle('CHAPITRE IV', 'Traitement selon le Traumatisme')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  label: 'Foulure', col: '#206040',
                  steps: ['Repos.', 'Froid.', 'Bandage léger.', 'Reprise progressive des mouvements.'],
                  plantes: ['Camomille.', 'Lavande.', 'Romarin.'],
                  note: null,
                },
                {
                  label: 'Entorse', col: '#8A6010',
                  steps: ['Immobilisation.', 'Froid pendant vingt-quatre heures.', 'Chaleur progressive.', 'Bandage compressif.'],
                  plantes: ['Consoude.', 'Prêle.', 'Plantain.'],
                  note: 'Le médecin surveille l\'apparition d\'une instabilité articulaire.',
                },
                {
                  label: 'Luxation', col: '#8A2020',
                  steps: ['Vérifier la sensibilité, la coloration et la circulation avant toute réduction.', 'Réduction avec douceur, dans l\'axe de l\'articulation.', 'Immobilisation.', 'Surveillance neurologique.', 'Contrôle quotidien.'],
                  plantes: null,
                  note: null,
                },
                {
                  label: 'Déboîtement ancien', col: '#5A3080',
                  steps: ['Ne jamais réduire avec violence.', 'Diminuer les douleurs.', 'Préserver la mobilité restante.', 'Améliorer le confort du malade.'],
                  plantes: null,
                  note: null,
                },
              ].map(t => (
                <div key={t.label} style={{ background: T.card, border: `1px solid ${t.col}40`, borderLeft: `4px solid ${t.col}`, padding: '16px 20px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: t.col, marginBottom: 10 }}>{t.label}</div>
                  <RegList items={t.steps} />
                  {t.note && <RegBlock col={`${TRU}40`}><RegPara>{t.note}</RegPara></RegBlock>}
                  {t.plantes && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: '#A8B991', letterSpacing: '0.12em', marginBottom: 6 }}>PRÉPARATIONS VÉGÉTALES</div>
                      <RegList items={t.plantes} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>)}

          {/* V. Surveillance */}
          {truBlock(<>
            {truTitle('CHAPITRE V', 'Surveillance')}
            <RegPara>Le médecin contrôle quotidiennement :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Douleur.', 'Gonflement.', 'Chaleur.', 'Coloration.', 'Mobilité.', 'Sensibilité.', 'Pouls périphérique.'].map(item => (
                <div key={item} style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TRU_LIGHT, fontSize: 10 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute aggravation impose une réévaluation complète.</RegPara>
            </RegBlock>
          </>)}

          {/* VI. Complications */}
          {truBlock(<>
            {truTitle('CHAPITRE VI', 'Complications')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {['Compression nerveuse.', 'Mauvaise circulation.', 'Infection.', 'Suppuration.', 'Gangrène.', 'Ankylose.', 'Instabilité articulaire persistante.'].map(c => (
                <div key={c} style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.35)', padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#DF9A88', fontSize: 10 }}>◆</span>{c}
                </div>
              ))}
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Toute perte de sensibilité ou disparition du pouls constitue une urgence.</RegPara>
            </RegBlock>
          </>)}

          {/* VII. Traitements */}
          {truBlock(<>
            {truTitle('CHAPITRE VII', 'Traitements du Dispensaire')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ background: T.card, border: 'rgba(80,140,80,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#A8B991', marginBottom: 10 }}>Préparations végétales</div>
                <RegList items={['Consoude.', 'Prêle.', 'Plantain.', 'Lavande.', 'Romarin.', 'Sauge.', 'Calendula.', 'Échinacée.']} />
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TRU_LIGHT, marginBottom: 10 }}>Préparations pharmaceutiques</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: T.gold, marginBottom: 10 }}>Médicaments</div>
                <RegList items={['Laudanum.', 'Élixir Parégorique.', 'Éther.', 'Chloroforme.', 'Acide phénique.', 'Teinture d\'iode.']} />
              </div>
            </div>
          </>)}

          {/* VIII. Rééducation */}
          {truBlock(<>
            {truTitle('CHAPITRE VIII', 'Rééducation')}
            <RegPara>Une immobilisation prolongée entraîne une perte de force. Lorsque le traumatisme est consolidé, le médecin recommande :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, borderLeft: `3px solid ${TRU}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TRU_LIGHT, marginBottom: 10 }}>Exercices progressifs</div>
                <RegList items={['Reprise progressive des mouvements.', 'Exercices simples.', 'Marche progressive.']} />
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}30`, borderLeft: `3px solid ${TRU}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: TRU_LIGHT, marginBottom: 10 }}>Soins et alimentation</div>
                <RegList items={['Massages doux après disparition de l\'inflammation.', 'Alimentation riche en bouillons, légumes et lait.']} />
              </div>
            </div>
          </>)}

          {/* IX. Éthique */}
          {truBlock(<>
            {truTitle('CHAPITRE IX', 'Éthique du Traumatologue')}
            <RegPara>Le praticien ne cherche jamais à forcer une articulation ou un membre. Il agit avec méthode, patience et douceur.</RegPara>
            <RegCitation text="La qualité d'un traitement dépend autant de la précision du geste que de la surveillance quotidienne." author="Doctrine du Dispensaire, 1890" />
            <RegPara>Le repos, la médecine moderne et les plantes médicinales sont complémentaires dans le traitement des traumatismes.</RegPara>
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${TRU}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le traitement des traumatismes des membres repose sur cinq principes essentiels : reconnaître correctement la blessure, soulager la douleur avec discernement, réduire sans brutalité, immobiliser efficacement, accompagner la rééducation jusqu'au retour complet des fonctions.</RegPara>
            <RegCitation text="L'expérience, la patience et l'observation demeurent les premières qualités d'un bon traumatologue." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {truBlock(<>
            {truTitle('RECONNAÎTRE LE TRAUMATISME')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Foulure', col: '#206040', note: 'Étirement ligamentaire, peau intacte.' },
                { label: 'Entorse', col: '#8A6010', note: 'Déchirure partielle ou totale des ligaments.' },
                { label: 'Luxation', col: '#8A2020', note: 'Déplacement articulaire, urgence médicale.' },
                { label: 'Déboîtement ancien', col: '#5A3080', note: 'Luxation cicatrisée en mauvaise position.' },
              ].map(t => (
                <div key={t.label} style={{ background: T.card, border: `1px solid ${t.col}40`, borderLeft: `3px solid ${t.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: t.col, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted }}>{t.note}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.12em', marginBottom: 8 }}>SIGNES PRINCIPAUX</div>
            <RegList items={['Douleur.', 'Gonflement.', 'Chaleur locale.', 'Déformation.', 'Perte de mobilité.', 'Diminution de la sensibilité.', 'Coloration anormale.']} />
          </>)}

          {truBlock(<>
            {truTitle('PRINCIPES DU TRAITEMENT')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TRU_LIGHT, marginBottom: 8 }}>Douleur</div>
                <RegList items={['Légère : Camomille, Valériane.', 'Modérée : Élixir Parégorique.', 'Importante : Laudanum.', 'Chirurgie : Éther, Chloroforme.']} />
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TRU_LIGHT, marginBottom: 8 }}>Antisepsie</div>
                <RegList items={['Laver les mains.', 'Désinfecter les instruments.', 'Nettoyer à l\'eau bouillie.', 'Acide phénique ou Teinture d\'iode si plaie.']} />
              </div>
              <div style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: TRU_LIGHT, marginBottom: 8 }}>Immobilisation</div>
                <RegList items={['Écharpes, attelles, gouttières.', 'Bandages.', 'Plâtre si nécessaire.']} />
              </div>
            </div>
          </>)}

          {truBlock(<>
            {truTitle('FROID ET CHALEUR')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(40,80,160,0.06)', border: '1px solid rgba(40,80,160,0.30)', padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#6080C0', marginBottom: 8 }}>Premières 24h</div>
                <RegList items={['Compresses froides.', 'Eau fraîche.', 'Linges humides.']} />
              </div>
              <div style={{ background: 'rgba(160,80,40,0.06)', border: '1px solid rgba(160,80,40,0.30)', padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#C07050', marginBottom: 8 }}>Après 24h</div>
                <RegList items={['Chaleur modérée.', 'Cataplasmes tièdes.', 'Massages légers si inflammation disparue.']} />
              </div>
            </div>
          </>)}

          {truBlock(<>
            {truTitle('TRAITEMENT SELON LE TRAUMATISME')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Foulure', col: '#206040', items: ['Repos.', 'Froid.', 'Bandage léger.', 'Reprise progressive.'] },
                { label: 'Entorse', col: '#8A6010', items: ['Immobilisation.', 'Froid puis chaleur.', 'Bandage compressif.', 'Surveillance articulaire.'] },
                { label: 'Luxation', col: '#8A2020', items: ['Vérifier circulation et sensibilité.', 'Réduction dans l\'axe.', 'Immobilisation.', 'Surveillance quotidienne.'] },
                { label: 'Déboîtement ancien', col: '#5A3080', items: ['Ne jamais forcer la réduction.', 'Soulager la douleur.', 'Préserver la mobilité restante.'] },
              ].map(t => (
                <div key={t.label} style={{ background: T.card, border: `1px solid ${t.col}40`, borderTop: `2px solid ${t.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: t.col, marginBottom: 8 }}>{t.label}</div>
                  <RegList items={t.items} />
                </div>
              ))}
            </div>
          </>)}

          {truBlock(<>
            {truTitle('SURVEILLANCE')}
            <RegPara>Contrôler chaque jour :</RegPara>
            <RegList items={['Douleur.', 'Gonflement.', 'Chaleur.', 'Couleur du membre.', 'Sensibilité.', 'Mobilité.', 'Pouls périphérique.']} />
          </>)}

          {truBlock(<>
            {truTitle('COMPLICATIONS')}
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Rechercher :</RegPara>
              <RegList items={['Compression nerveuse.', 'Mauvaise circulation.', 'Infection.', 'Suppuration.', 'Gangrène.', 'Ankylose.', 'Instabilité articulaire.']} />
              <RegPara>Toute perte de sensibilité ou absence de pouls constitue une urgence.</RegPara>
            </RegBlock>
          </>)}

          {truBlock(<>
            {truTitle('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Végétaux', col: '#A8B991', items: ['Consoude.', 'Prêle.', 'Plantain.', 'Lavande.', 'Romarin.', 'Sauge.', 'Calendula.', 'Échinacée.'] },
                { label: 'Dispensaire', col: TRU_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Pommade Camphrée.', 'Baume Résineux.'] },
                { label: 'Médicaments', col: T.gold, items: ['Laudanum.', 'Élixir Parégorique.', 'Éther.', 'Chloroforme.', 'Acide phénique.', 'Teinture d\'iode.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${TRU}08`, border: `1px solid ${TRU}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          {truBlock(<>
            {truTitle('RÉÉDUCATION')}
            <RegList items={['Exercices progressifs.', 'Reprise de la marche.', 'Massages doux (après disparition de l\'inflammation).', 'Alimentation riche.', 'Repos adapté.']} />
          </>)}

          <RegBlock col={`${TRU}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TRU_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Identifier précisément le type de traumatisme.', 'Soulager la douleur selon sa gravité.', 'Respecter une antisepsie rigoureuse.', 'Immobiliser correctement le membre.', 'Surveiller quotidiennement la circulation, la sensibilité et la mobilité.', 'Associer médecine moderne et médecine végétale pour favoriser une récupération complète.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Guide des Zoonoses ── */

const ZON = '#3A4820';
const ZON_LIGHT = '#7A9040';

function ZoonosesDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const zonBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${ZON}40`, borderTop: `3px solid ${ZON}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const zonTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const zonDisease = (label: string, col: string, children: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderLeft: `4px solid ${col}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 17, color: col, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${ZON}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${ZON}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${ZON}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${ZON}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${ZON}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: ZON_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ GUIDE DES ZOONOSES ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: ZON_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🐾 Maladies de l'Animal à l'Homme</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Médecine rurale · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${ZON_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? ZON_LIGHT : T.border}`, background: version === v ? `${ZON}30` : 'transparent', color: version === v ? ZON_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${ZON}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Les habitants des campagnes vivent quotidiennement au contact des animaux domestiques et sauvages. Cette proximité favorise la transmission de certaines maladies appelées zoonoses, pouvant atteindre aussi bien les éleveurs que les chasseurs, les bouchers, les vétérinaires ou les simples habitants.</RegPara>
            <RegPara>Le médecin rural doit savoir reconnaître ces affections, protéger la population, limiter leur propagation et appliquer les règles modernes d'hygiène désormais enseignées par la médecine.</RegPara>
            <RegCitation text="La prévention demeure le meilleur traitement." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Rage */}
          {zonBlock(<>
            {zonTitle('CHAPITRE I', 'De la Rage')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>ORIGINE</div>
                <RegPara>Transmise par morsure ou griffure d'un animal infecté :</RegPara>
                <RegList items={['Chien.', 'Renard.', 'Loup.', 'Chat.', 'Chauve-souris ou animaux sauvages.']} />
              </div>
              <div style={{ background: 'rgba(160,80,40,0.06)', border: '1px solid rgba(160,80,40,0.30)', padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#C07050', letterSpacing: '0.14em', marginBottom: 8 }}>CHEZ L'ANIMAL</div>
                <RegList items={['Agressivité inhabituelle.', 'Salivation abondante.', 'Difficultés à avaler.', 'Agitation ou errance.', 'Attaques sans provocation.']} />
              </div>
              <div style={{ background: 'rgba(180,160,113,0.06)', border: '1px solid rgba(180,60,60,0.30)', padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 8 }}>CHEZ L'HOMME</div>
                <RegList items={['Douleur autour de la morsure.', 'Fièvre.', 'Anxiété.', 'Difficultés à avaler.', 'Spasmes de la gorge.', 'Agitation croissante.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 8 }}>URGENCE — CONDUITE À TENIR</div>
              <RegList items={['Laver immédiatement la plaie à l\'eau bouillie et au savon.', 'Désinfecter avec Eau Vulnéraire ou Acide phénique.', 'Appliquer une Teinture d\'iode si nécessaire.', 'Surveiller l\'animal lorsqu\'il peut être capturé.', 'Déclarer le cas aux autorités locales.', 'Orienter vers la méthode préventive de Pasteur lorsque possible.']} />
            </RegBlock>
            <RegBlock col={`${ZON}40`}>
              <RegPara>Les plantes ne guérissent pas la rage. Elles servent uniquement à prévenir les infections secondaires : Thym, Romarin, Plantain, Échinacée.</RegPara>
            </RegBlock>
          </>)}

          {/* II. Charbon */}
          {zonBlock(<>
            {zonTitle('CHAPITRE II', 'Du Charbon')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>ORIGINE</div>
                <RegList items={['Bovins, moutons, chèvres.', 'Peaux contaminées.', 'Sols infectés.']} />
              </div>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>SIGNES</div>
                <RegList items={['Bouton noir central.', 'Rougeur importante.', 'Fièvre.', 'Douleur.', 'Ganglions.']} />
              </div>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>TRAITEMENT</div>
                <RegList items={['Désinfection immédiate.', 'Eau Vulnéraire.', 'Acide phénique.', 'Pansement propre.', 'Surveillance quotidienne.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Les animaux morts du charbon ne doivent jamais être ouverts. Ils doivent être brûlés ou enterrés profondément afin d'éviter toute contamination.</RegPara>
            </RegBlock>
            <RegPara>Plantes recommandées : Thym, Lavande, Calendula. Consoude uniquement après disparition de l'infection.</RegPara>
          </>)}

          {/* III. Gale + IV. Teigne */}
          {zonBlock(<>
            {zonTitle('CHAPITRES III ET IV', 'Gale et Teigne')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}35`, borderTop: `2px solid ${ZON}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: ZON_LIGHT, marginBottom: 12 }}>Gale</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.12em', marginBottom: 6 }}>SIGNES</div>
                <RegList items={['Démangeaisons importantes.', 'Sillons cutanés.', 'Rougeurs.', 'Lésions de grattage.']} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.12em', margin: '10px 0 6px' }}>TRAITEMENT</div>
                <RegList items={['Bain chaud.', 'Pommade au soufre.', 'Lavage vêtements à l\'eau bouillante.', 'Désinfection literie et habitation.']} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: '#A8B991', letterSpacing: '0.12em', margin: '10px 0 6px' }}>PLANTES</div>
                <RegList items={['Lavande.', 'Noyer.', 'Thym.']} />
              </div>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}35`, borderTop: `2px solid ${ZON}`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 17, color: ZON_LIGHT, marginBottom: 12 }}>Teigne</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.12em', marginBottom: 6 }}>ORIGINE</div>
                <RegPara>Transmise par chats, chiens, chevaux ou objets contaminés.</RegPara>
                <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.12em', margin: '10px 0 6px' }}>SIGNES</div>
                <RegList items={['Plaques dépilées.', 'Cheveux cassés.', 'Démangeaisons.', 'Pellicules épaisses.']} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.12em', margin: '10px 0 6px' }}>TRAITEMENT</div>
                <RegList items={['Raser la zone atteinte.', 'Nettoyer avec Eau Vulnéraire.', 'Désinfecter les objets de toilette.', 'Ne jamais partager peignes ou brosses.']} />
                <div style={{ fontFamily: MONO, fontSize: 10, color: '#A8B991', letterSpacing: '0.12em', margin: '10px 0 6px' }}>PLANTES</div>
                <RegList items={['Thym.', 'Ortie.', 'Huile de ricin.']} />
              </div>
            </div>
          </>)}

          {/* V. Autres zoonoses */}
          {zonBlock(<>
            {zonTitle('CHAPITRE V', 'Autres Zoonoses Importantes')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { label: 'Rouget du porc', col: '#DF9A88', transmission: 'Manipulation de viande infectée.', signes: ['Rougeur de la peau.', 'Fièvre.', 'Douleur.'], traitement: 'Nettoyage, antisepsie, surveillance.' },
                { label: 'Tuberculose bovine', col: '#8A6010', transmission: 'Lait cru. Contact avec bovins malades.', signes: ['Symptômes respiratoires.', 'Fatigue progressive.'], traitement: 'Faire bouillir le lait. Surveiller les troupeaux.' },
                { label: 'Morve', col: '#5A3080', transmission: 'Chevaux malades.', signes: ['Écoulement nasal.', 'Ulcérations.', 'Fièvre.'], traitement: 'Isolement de l\'animal malade.' },
                { label: 'Trichinose', col: '#6A3A10', transmission: 'Viande de porc insuffisamment cuite.', signes: ['Douleurs musculaires.', 'Fièvre.', 'Troubles digestifs.'], traitement: 'Cuire complètement la viande.' },
                { label: 'Échinococcose', col: '#206040', transmission: 'Chiens infestés.', signes: ['Douleurs abdominales.', 'Fatigue.'], traitement: 'Hygiène des mains. Éviter les viscères contaminés.' },
              ].map(z => (
                <div key={z.label} style={{ background: T.card, border: `1px solid ${z.col}35`, borderLeft: `3px solid ${z.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: z.col, marginBottom: 6 }}>{z.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.10em', marginBottom: 4 }}>TRANSMISSION</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginBottom: 8, lineHeight: 1.6 }}>{z.transmission}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.10em', marginBottom: 4 }}>SIGNES</div>
                  <RegList items={z.signes} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: ZON_LIGHT, letterSpacing: '0.10em', margin: '6px 0 4px' }}>PRÉVENTION</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.text, lineHeight: 1.6 }}>{z.traitement}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* VI. Prévention générale */}
          {zonBlock(<>
            {zonTitle('CHAPITRE VI', 'Prévention Générale')}
            <RegPara>Le médecin recommande :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Lavage soigneux des mains.', 'Désinfection immédiate des plaies.', 'Cuisson complète des viandes.', 'Faire bouillir le lait.', 'Entretien régulier des étables.', 'Isolement des animaux malades.', 'Destruction sécurisée des carcasses contaminées.'].map(item => (
                <div key={item} style={{ background: `${ZON}08`, border: `1px solid ${ZON}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: ZON_LIGHT, fontSize: 10, flexShrink: 0 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegBlock col={`${ZON}40`}>
              <RegPara>La propreté demeure la première protection contre les zoonoses.</RegPara>
            </RegBlock>
          </>)}

          {/* VII. Médicaments */}
          {zonBlock(<>
            {zonTitle('CHAPITRE VII', 'Médicaments et Préparations')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}30`, padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: ZON_LIGHT, marginBottom: 10 }}>Préparations du dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: T.gold, marginBottom: 10 }}>Désinfectants</div>
                <RegList items={['Acide phénique.', 'Teinture d\'iode.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(80,140,80,0.35) solid 1px', padding: '16px 20px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#A8B991', marginBottom: 10 }}>Plantes médicinales</div>
                <RegList items={['Thym.', 'Romarin.', 'Plantain.', 'Calendula.', 'Lavande.', 'Échinacée.', 'Ortie.', 'Consoude (phase de réparation).']} />
              </div>
            </div>
          </>)}

          {/* VIII. Devoir */}
          {zonBlock(<>
            {zonTitle('CHAPITRE VIII', 'Devoir du Médecin')}
            <RegList items={['Reconnaître rapidement les maladies contagieuses.', 'Protéger les familles.', 'Isoler les malades lorsque cela est nécessaire.', 'Informer les autorités en cas d\'épizootie.', 'Instruire les habitants des mesures d\'hygiène.']} />
            <RegCitation text="Le médecin rural protège autant la population que les troupeaux." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${ZON}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>La médecine de 1890 ne sépare plus les progrès scientifiques des ressources de la nature. L'observation clinique, l'antisepsie, la pharmacologie moderne et les plantes médicinales constituent les quatre piliers de la lutte contre les zoonoses.</RegPara>
            <RegCitation text="Le médecin éclairé sait que prévenir une maladie vaut toujours mieux que tenter de la guérir. Par la vigilance, l'hygiène et le savoir, il protège les hommes comme les animaux dont dépend la vie des campagnes." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {zonBlock(<>
            {zonTitle('PRINCIPALES ZOONOSES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { label: 'Rage', col: '#DF9A88', note: 'Morsure animale — urgence.' },
                { label: 'Charbon', col: '#8A3010', note: 'Bovins, peaux, sols.' },
                { label: 'Gale', col: '#6A4A10', note: 'Parasite cutané.' },
                { label: 'Teigne', col: '#5A3080', note: 'Chats, chiens, chevaux.' },
                { label: 'Rouget du porc', col: '#DF9A88', note: 'Viande infectée.' },
                { label: 'Tuberculose bovine', col: '#8A6010', note: 'Lait cru.' },
                { label: 'Morve', col: '#5A3080', note: 'Chevaux malades.' },
                { label: 'Trichinose', col: '#6A3A10', note: 'Viande insuffisamment cuite.' },
                { label: 'Échinococcose', col: '#206040', note: 'Chiens infestés.' },
              ].map(z => (
                <div key={z.label} style={{ background: T.card, border: `1px solid ${z.col}35`, borderLeft: `3px solid ${z.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, color: z.col, marginBottom: 4 }}>{z.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 11, color: T.muted }}>{z.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {zonBlock(<>
            {zonTitle('RAGE — CONDUITE D\'URGENCE')}
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegList items={['Laver la plaie immédiatement.', 'Désinfecter : Eau Vulnéraire ou Acide phénique.', 'Teinture d\'iode si nécessaire.', 'Isoler et surveiller l\'animal.', 'Orienter vers la méthode de Pasteur.']} />
            </RegBlock>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#C07050', marginBottom: 8 }}>Signes chez l'animal</div>
                <RegList items={['Agressivité.', 'Salivation abondante.', 'Difficulté à avaler.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', marginBottom: 8 }}>Signes chez l'homme</div>
                <RegList items={['Douleur morsure.', 'Fièvre.', 'Anxiété.', 'Spasmes.']} />
              </div>
            </div>
          </>)}

          {zonBlock(<>
            {zonTitle('CHARBON')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: ZON_LIGHT, marginBottom: 8 }}>Signes</div>
                <RegList items={['Bouton noir.', 'Rougeur.', 'Fièvre.', 'Gonflement.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: ZON_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Désinfection.', 'Pansement propre.', 'Surveillance quotidienne.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Ne jamais ouvrir une carcasse contaminée.</RegPara>
            </RegBlock>
          </>)}

          {zonBlock(<>
            {zonTitle('GALE ET TEIGNE')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: ZON_LIGHT, marginBottom: 8 }}>Gale</div>
                <RegList items={['Bain chaud.', 'Pommade au soufre.', 'Laver vêtements et literie.', 'Plantes : Lavande, Noyer, Thym.']} />
              </div>
              <div style={{ background: `${ZON}08`, border: `1px solid ${ZON}25`, padding: '12px 14px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: ZON_LIGHT, marginBottom: 8 }}>Teigne</div>
                <RegList items={['Raser la zone.', 'Désinfection Eau Vulnéraire.', 'Ne pas partager les objets.', 'Plantes : Thym, Ortie.']} />
              </div>
            </div>
          </>)}

          {zonBlock(<>
            {zonTitle('AUTRES ZOONOSES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { label: 'Rouget du porc', col: '#DF9A88', note: 'Rougeurs, fièvre, douleurs. Antisepsie.' },
                { label: 'Tuberculose bovine', col: '#8A6010', note: 'Lait cru. Toujours faire bouillir.' },
                { label: 'Morve', col: '#5A3080', note: 'Chevaux. Isolement animal.' },
                { label: 'Trichinose', col: '#6A3A10', note: 'Porc. Cuire complètement.' },
                { label: 'Échinococcose', col: '#206040', note: 'Chiens. Hygiène des mains.' },
              ].map(z => (
                <div key={z.label} style={{ background: T.card, border: `1px solid ${z.col}35`, borderLeft: `3px solid ${z.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, color: z.col, marginBottom: 4 }}>{z.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{z.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {zonBlock(<>
            {zonTitle('PRÉVENTION')}
            <RegList items={['Se laver les mains.', 'Désinfecter les plaies.', 'Faire bouillir le lait.', 'Bien cuire les viandes.', 'Entretenir les étables.', 'Isoler les animaux malades.', 'Détruire correctement les carcasses contaminées.']} />
          </>)}

          {zonBlock(<>
            {zonTitle('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Dispensaire', col: ZON_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.'] },
                { label: 'Désinfectants', col: T.gold, items: ['Acide phénique.', 'Teinture d\'iode.'] },
                { label: 'Plantes', col: '#A8B991', items: ['Thym.', 'Romarin.', 'Plantain.', 'Lavande.', 'Calendula.', 'Échinacée.', 'Ortie.', 'Consoude (réparation).'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${ZON}08`, border: `1px solid ${ZON}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${ZON}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: ZON_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Les zoonoses sont des maladies transmissibles de l\'animal à l\'homme.', 'L\'hygiène et l\'antisepsie sont les meilleures protections.', 'La rage nécessite une prise en charge immédiate.', 'Le lait doit être bouilli et les viandes correctement cuites.', 'Les animaux malades doivent être isolés et signalés.', 'Le médecin associe médecine moderne, antisepsie et médecine végétale pour protéger les populations rurales.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours de Chirurgie Traumatologique ── */

const CTR = '#5A1E30';
const CTR_LIGHT = '#A84868';

function ChirurgieTraumaDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const ctrBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${CTR}60`, borderTop: `3px solid ${CTR_LIGHT}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const ctrTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: CTR_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const urgBox = (children: React.ReactNode) => (
    <div style={{ background: 'rgba(180,160,113,0.08)', border: '1px solid rgba(180,160,113,0.35)', borderLeft: '4px solid #DF9A88', padding: '12px 16px', marginTop: 10 }}>
      {children}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${CTR_LIGHT}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${CTR_LIGHT}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${CTR_LIGHT}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${CTR_LIGHT}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${CTR_LIGHT}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: CTR_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE CHIRURGIE TRAUMATOLOGIQUE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: CTR_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🩻 Chirurgie Traumatologique</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Plaies Graves · Blessures par Balle · Infections Chirurgicales</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${CTR_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? CTR_LIGHT : T.border}`, background: version === v ? `${CTR}50` : 'transparent', color: version === v ? CTR_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${CTR_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CTR_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>La chirurgie traumatique est sans doute l'épreuve la plus exigeante de l'art médical. Dans les territoires de East Wellster's et de West Elizabeth, les blessures sont nombreuses : accidents agricoles, chutes de cheval, morsures, coups de couteau, tirs d'armes à feu ou explosions minières.</RegPara>
            <RegPara>Le chirurgien ne doit jamais se laisser guider par la précipitation. Une plaie mal observée, mal nettoyée ou refermée trop tôt devient rapidement le siège de la corruption des chairs, de la gangrène ou de la septicémie.</RegPara>
            <RegCitation text="Grâce aux enseignements de Pasteur et de Lister, le devoir du médecin est d'empêcher la pénétration des germes, de détruire ceux déjà présents et d'accompagner les forces naturelles de guérison." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Principes */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE I', 'Principes Fondamentaux de la Chirurgie Traumatique')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
              {[
                { num: 'I', label: 'Observer avant d\'agir', col: '#3C657E', items: ['Origine du traumatisme.', 'Profondeur de la plaie.', 'Importance du saignement.', 'Présence d\'un projectile.', 'Atteinte d\'un os, tendon ou organe.'] },
                { num: 'II', label: 'Sauver la vie avant le membre', col: '#DF9A88', items: ['Comprimer la plaie.', 'Élever le membre si possible.', 'Appliquer un bandage compressif.'] },
                { num: 'III', label: 'Soulager la douleur', col: '#8060A0', items: ['Légère : Camomille, Valériane.', 'Modérée : Élixir Parégorique.', 'Importante : Laudanum.', 'Chirurgie majeure : Éther, Chloroforme.'] },
                { num: 'IV', label: 'Prévenir l\'infection', col: '#40806A', items: ['Lavage soigneux des mains.', 'Instruments stérilisés.', 'Peau nettoyée.', 'Acide phénique ou Teinture d\'iode.'] },
                { num: 'V', label: 'Respecter les tissus', col: '#907030', items: ['Retirer les corps étrangers.', 'Retirer les tissus manifestement morts.', 'Conserver tout tissu vivant.'] },
              ].map(p => (
                <div key={p.num} style={{ background: T.card, border: `1px solid ${p.col}35`, borderTop: `3px solid ${p.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: p.col, letterSpacing: '0.14em', marginBottom: 4 }}>RÈGLE {p.num}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: p.col, marginBottom: 10 }}>{p.label}</div>
                  <RegList items={p.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* II. Évaluation */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE II', 'Évaluation de la Plaie')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Profondeur', col: CTR_LIGHT, items: ['Superficielle.', 'Profonde.', 'Pénétrante.'] },
                { label: 'Saignement', col: '#DF9A88', items: ['Faible.', 'Modéré.', 'Abondant.'] },
                { label: 'Contamination', col: '#907030', items: ['Terre.', 'Vêtements.', 'Bois.', 'Plomb.', 'Poudre.', 'Fragments osseux.'] },
                { label: 'Lésions associées', col: '#3C657E', items: ['Fracture.', 'Luxation.', 'Atteinte tendineuse.', 'Lésion nerveuse.', 'Atteinte vasculaire.'] },
              ].map(s => (
                <div key={s.label} style={{ background: `${CTR}08`, border: `1px solid ${s.col}35`, borderLeft: `3px solid ${s.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: s.col, marginBottom: 8 }}>{s.label}</div>
                  <RegList items={s.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* III. Antisepsie chirurgicale */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE III', 'Antisepsie Chirurgicale')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(190px, 1fr))', gap: 10 }}>
              {[
                { label: 'Mains du chirurgien', col: '#3C657E', items: ['Lavage au savon et eau chaude.', 'Brossage soigneux.', 'Désinfection à l\'alcool ou Acide phénique.'] },
                { label: 'Instruments', col: '#8080B0', items: ['Eau bouillante.', 'Acide phénique.'] },
                { label: 'Peau du blessé', col: '#40806A', items: ['Lavage.', 'Rasage si nécessaire.', 'Désinfection à la Teinture d\'iode.'] },
                { label: 'Pansements', col: '#907030', items: ['Propres.', 'Secs.', 'Renouvelés régulièrement.'] },
              ].map(s => (
                <div key={s.label} style={{ background: T.card, border: `1px solid ${s.col}35`, borderLeft: `4px solid ${s.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: s.col, marginBottom: 8 }}>{s.label}</div>
                  <RegList items={s.items} />
                </div>
              ))}
            </div>
            {urgBox(<RegPara>Toute plaie souillée est irriguée abondamment avant toute fermeture.</RegPara>)}
          </>)}

          {/* IV. Classification */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE IV', 'Classification des Plaies')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { label: 'Simples', col: '#60A060', note: 'Propres, peu profondes, sans atteinte importante.' },
                { label: 'Profondes', col: '#3C657E', note: 'Atteignent les muscles ou les tendons.' },
                { label: 'Pénétrantes', col: '#8060A0', note: 'Risque de lésion d\'un organe.' },
                { label: 'Par balle', col: '#C07030', note: 'Projectile ou trajectoire traversante.' },
                { label: 'Infectées', col: '#DF9A88', note: 'Rougeur, douleur, suppuration, fièvre.' },
                { label: 'Gangreneuses', col: '#8A1010', note: 'Tissus noirs, odeur fétide. Urgence absolue.' },
              ].map(c => (
                <div key={c.label} style={{ background: `${c.col}10`, border: `1px solid ${c.col}35`, borderTop: `3px solid ${c.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: c.col, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted }}>{c.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* V. Plaies simples */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE V', 'Traitement des Plaies Simples')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Conduite</div>
                <RegList items={['Nettoyage abondant.', 'Désinfection.', 'Contrôle du saignement.', 'Rapprochement des berges.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes médicinales</div>
                <RegList items={['Calendula.', 'Plantain.', 'Lavande.', 'Consoude (après disparition de l\'infection).']} />
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8, marginTop: 10 }}>Dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.']} />
              </div>
            </div>
            <RegBlock col={`${CTR_LIGHT}40`}>
              <RegPara>Vérifier quotidiennement : température, douleur, coloration, écoulement.</RegPara>
            </RegBlock>
          </>)}

          {/* VI. Blessures par balle */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE VI', 'Traitement des Blessures par Balle')}
            <RegPara>Les blessures par armes à feu associent souvent destruction des tissus, hémorragie et contamination profonde. Une petite ouverture peut cacher des lésions considérables.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
              {[
                {
                  label: 'A. Plaie traversante', col: '#C07030',
                  caract: ['Orifice d\'entrée petit et régulier.', 'Orifice de sortie plus large.', 'Projectile ayant traversé le corps.'],
                  traite: ['Retirer les vêtements souillés.', 'Irriguer à l\'eau bouillie puis Eau Vulnéraire.', 'Contrôler l\'hémorragie.', 'Rechercher fracture ou lésion d\'organe.', 'Ne jamais refermer entièrement.', 'Conserver un drainage naturel.'],
                },
                {
                  label: 'B. Projectile logé', col: '#A05020',
                  caract: ['Un seul orifice visible.', 'Projectile retenu dans les tissus.'],
                  traite: ['Désinfecter la région.', 'Antalgique si nécessaire.', 'Extraire uniquement si facilement accessible.', 'Laisser en place si l\'extraction est plus risquée.', 'Lavage, drainage, pansement antiseptique.'],
                },
                {
                  label: 'C. Projectile fragmenté', col: '#8A4020',
                  caract: ['Plusieurs fragments de plomb.'],
                  traite: ['Retirer uniquement les fragments accessibles.', 'Retirer les tissus nécrosés et débris.', 'Préserver les tissus vivants.', 'Éviter toute exploration excessive.'],
                },
                {
                  label: 'D. Plaie avec fracture', col: '#5A3080',
                  caract: ['Projectile atteignant un os.'],
                  traite: ['Nettoyage minutieux.', 'Retrait des éclats libres.', 'Immobilisation par attelles ou plâtre.', 'Drainage.', 'Surveillance quotidienne.'],
                },
              ].map(b => (
                <div key={b.label} style={{ background: T.card, border: `1px solid ${b.col}35`, borderLeft: `4px solid ${b.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: b.col, marginBottom: 10 }}>{b.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: b.col, letterSpacing: '0.12em', marginBottom: 5 }}>CARACTÉRISTIQUES</div>
                  <RegList items={b.caract} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: b.col, letterSpacing: '0.12em', margin: '8px 0 5px' }}>TRAITEMENT</div>
                  <RegList items={b.traite} />
                </div>
              ))}
            </div>
          </>)}

          {/* VII. Plaies infectées */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE VII', 'Plaies Gravement Infectées')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(180,160,113,0.08)', border: '1px solid rgba(180,160,113,0.35)', borderLeft: '4px solid #DF9A88', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#DF9A88', marginBottom: 8 }}>Signes d'alerte</div>
                <RegList items={['Rougeur importante.', 'Chaleur locale.', 'Gonflement.', 'Douleur croissante.', 'Écoulement purulent.', 'Mauvaise odeur.', 'Fièvre.', 'Frissons.']} />
              </div>
              <div>
                <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Débridement</div>
                  <RegPara>Ablation des tissus morts. Les tissus nécrosés entretiennent l'infection et empêchent la cicatrisation. Toujours suivi d'un lavage abondant.</RegPara>
                </div>
                <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Drainage</div>
                  <RegPara>Toute collection de pus doit être évacuée. Une plaie infectée ne doit jamais être refermée avant disparition complète de la suppuration.</RegPara>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, color: T.gold, fontStyle: 'italic', marginTop: 8, padding: '6px 10px', background: 'rgba(209,183,124,0.08)', border: '1px solid rgba(209,183,124,0.25)' }}>« Là où le pus s'accumule, il faut lui ouvrir un chemin. »</div>
                </div>
              </div>
            </div>
          </>)}

          {/* VIII. Médecine végétale */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE VIII', 'Médecine Végétale en Chirurgie')}
            <RegPara>Les plantes ne remplacent jamais l'antisepsie moderne. Elles complètent les soins et favorisent la cicatrisation.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
              {[
                { plant: 'Thym', col: '#A8B991', usage: 'Lavage antiseptique, compresses.' },
                { plant: 'Romarin', col: '#60A880', usage: 'Assainissement des plaies, stimulation de la circulation.' },
                { plant: 'Lavande', col: '#8080C0', usage: 'Calme l\'inflammation, nettoie les tissus.' },
                { plant: 'Plantain', col: '#70A060', usage: 'Apaise les douleurs et irritations.' },
                { plant: 'Calendula', col: '#C09030', usage: 'Très utile durant la réparation des tissus.' },
                { plant: 'Consoude', col: '#508050', usage: 'Uniquement après disparition de toute infection. Accélère la consolidation.' },
                { plant: 'Échinacée', col: '#8070A0', usage: 'Soutient les défenses naturelles pendant la convalescence.' },
              ].map(p => (
                <div key={p.plant} style={{ background: `${p.col}10`, border: `1px solid ${p.col}35`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: p.col, marginBottom: 4 }}>{p.plant}</div>
                  <div style={{ fontFamily: BODY, fontSize: 12, color: T.muted }}>{p.usage}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* IX. Sutures */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE IX', 'Les Sutures')}
            <RegPara>Le rapprochement des tissus ne doit être réalisé qu'après un nettoyage complet. Une suture trop précoce enferme l'infection.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Point simple</div>
                <RegList items={['Indiqué pour les plaies propres.', 'Faible tension.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Point en croix</div>
                <RegList items={['Plaies profondes.', 'Zones soumises à une forte tension.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Retrait des fils</div>
                <RegList items={['5ᵉ au 8ᵉ jour : plaies simples.', '8ᵉ au 12ᵉ jour : plaies profondes.']} />
                <RegPara>Toute rougeur ou suppuration impose un examen immédiat.</RegPara>
              </div>
            </div>
          </>)}

          {/* X. Fractures ouvertes */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE X', 'Fractures Ouvertes')}
            <RegPara>Toute fracture ouverte associe une blessure osseuse et une plaie contaminée.</RegPara>
            <RegList items={['Désinfection complète.', 'Retrait des corps étrangers.', 'Immobilisation.', 'Drainage si nécessaire.', 'Surveillance quotidienne.']} />
            {urgBox(<RegPara>Risque principal : gangrène et infection osseuse. Urgence majeure.</RegPara>)}
          </>)}

          {/* XI. Gangrène */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XI', 'Gangrène')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(140,10,10,0.08)', border: '1px solid rgba(140,10,10,0.35)', borderLeft: '4px solid #8A1010', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: '#DF9A88', marginBottom: 8 }}>Signes</div>
                <RegList items={['Peau noire.', 'Odeur fétide.', 'Perte de sensibilité.', 'Absence de circulation.']} />
              </div>
              <div>
                <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Traitement</div>
                  <RegList items={['Retrait des tissus morts.', 'Désinfection large.', 'Surveillance de l\'évolution.']} />
                  <RegPara>L'amputation peut devenir le seul moyen de sauver la vie du malade.</RegPara>
                </div>
              </div>
            </div>
          </>)}

          {/* XII. Amputation */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XII', 'Amputations')}
            <RegPara>L'amputation demeure l'ultime recours. Elle ne doit jamais être pratiquée dans la précipitation, uniquement lorsque la conservation du membre met en péril la vie du malade.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Indications</div>
                <RegList items={['Gangrène étendue.', 'Fracture ouverte irréparable.', 'Destruction complète du membre.', 'Écrasement majeur des tissus.', 'Hémorragie impossible à contrôler.', 'Septicémie menaçant la vie.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Préparation</div>
                <RegList items={['Calmer le malade.', 'Anesthésique adapté (Éther ou Chloroforme).', 'Instruments stérilisés.', 'Désinfection large de la peau.', 'Présence d\'un assistant indispensable.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: CTR_LIGHT, marginBottom: 8 }}>Principes opératoires</div>
                <RegList items={['Choisir une zone où les tissus sont sains.', 'Sectionner rapidement les parties molles.', 'Ligaturer soigneusement les vaisseaux.', 'Régulariser les extrémités osseuses.', 'Refermer sans tension si possible.', 'Laisser un drainage si infection persistante.']} />
              </div>
            </div>
          </>)}

          {/* XIII. Surveillance post-op */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XIII', 'Surveillance Post-Opératoire')}
            <RegPara>L'opération ne marque jamais la fin du traitement. Les jours qui suivent sont souvent les plus dangereux.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(190px, 1fr))', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Contrôle quotidien</div>
                <RegList items={['Température.', 'Pouls.', 'Respiration.', 'Douleur.', 'Couleur de la plaie.', 'Présence d\'écoulement.', 'Odeur du pansement.']} />
                <RegPara>Toute modification brutale doit alerter immédiatement.</RegPara>
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Pansements</div>
                <RegList items={['Renouvelés chaque jour.', 'Changés immédiatement si humides ou souillés.', 'Chaque changement précédé du lavage des mains.']} />
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8, marginTop: 10 }}>Surveillance des sutures</div>
                <RegList items={['Rougeur, gonflement, douleur, pus, ouverture des berges.', 'Points retirés si infection pour permettre le drainage.']} />
              </div>
            </div>
          </>)}

          {/* XIV. Complications */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XIV', 'Complications Chirurgicales')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Hémorragie secondaire', col: '#DF9A88', items: ['Comprimer immédiatement.', 'Rechercher le vaisseau responsable.', 'Nouvelle ligature si nécessaire.'] },
                { label: 'Infection', col: '#B05030', items: ['Fièvre persistante.', 'Douleur croissante.', 'Pus abondant, mauvaise odeur.', 'Nouveau lavage, drainage, désinfection.'] },
                { label: 'Septicémie', col: '#8A1020', items: ['Forte fièvre.', 'Frissons.', 'Grande faiblesse.', 'Confusion.', 'Accélération du pouls.', 'Pronostic réservé.'] },
              ].map(c => (
                <div key={c.label} style={{ background: `${c.col}08`, border: `1px solid ${c.col}35`, borderLeft: `4px solid ${c.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: c.col, marginBottom: 10 }}>{c.label}</div>
                  <RegList items={c.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* XV. Convalescence */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XV', 'Convalescence')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(190px, 1fr))', gap: 12 }}>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Alimentation</div>
                <RegList items={['Bouillons nourrissants.', 'Viandes bien cuites.', 'Légumes frais.', 'Pain.', 'Fruits lorsque la saison le permet.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Médicaments</div>
                <RegList items={['Eau Vulnéraire / Onguent Vulnéraire.', 'Élixir Parégorique.', 'Laudanum (usage limité).', 'Quinine (si fièvre palustre associée).']} />
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8, marginTop: 8 }}>Plantes</div>
                <RegList items={['Calendula.', 'Plantain.', 'Consoude.', 'Lavande.', 'Romarin.', 'Échinacée.', 'Camomille.']} />
              </div>
              <div style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: CTR_LIGHT, marginBottom: 8 }}>Rééducation</div>
                <RegList items={['Mobilisation progressive dès que la douleur le permet.', 'Mouvements doux.', 'Massages légers autour de la cicatrice.', 'Reprise progressive de la marche si possible.']} />
                <RegPara>L'immobilité prolongée favorise la raideur et l'affaiblissement musculaire.</RegPara>
              </div>
            </div>
          </>)}

          {/* XVI. Devoir */}
          {ctrBlock(<>
            {ctrTitle('CHAPITRE XVI', 'Devoir du Chirurgien')}
            <RegList items={['Maintenir une observation attentive.', 'Appliquer une antisepsie irréprochable.', 'Pratiquer une technique opératoire réfléchie.', 'Assurer une surveillance quotidienne.', 'Conduire les soins avec calme et méthode.']} />
            <RegCitation text="La science guide sa main, mais la patience demeure sa première qualité." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${CTR_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CTR_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>La chirurgie traumatique de l'année 1890 ne repose plus uniquement sur l'habileté du bistouri. Les découvertes de Pasteur et de Lister ont démontré que la propreté, l'antisepsie et la prévention des infections sont les fondements de toute intervention réussie.</RegPara>
            <RegPara>Le praticien doit associer la chirurgie moderne aux ressources de la pharmacologie et de la médecine végétale : ils se complètent pour offrir au malade les meilleures chances de guérison.</RegPara>
            <RegCitation text="Le véritable chirurgien ne se contente pas de refermer une plaie : il préserve la vie, restaure la fonction du membre et accompagne le malade jusqu'à son complet rétablissement." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Principes */}
          {ctrBlock(<>
            {ctrTitle('PRINCIPES FONDAMENTAUX')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {[
                { label: 'I — Observer avant d\'agir', col: '#3C657E' },
                { label: 'II — Sauver la vie avant le membre', col: '#DF9A88' },
                { label: 'III — Soulager la douleur', col: '#8060A0' },
                { label: 'IV — Prévenir l\'infection', col: '#40806A' },
                { label: 'V — Respecter les tissus', col: '#907030' },
              ].map(p => (
                <div key={p.label} style={{ background: `${p.col}10`, border: `1px solid ${p.col}35`, borderLeft: `3px solid ${p.col}`, padding: '10px 14px', fontFamily: BODY, fontSize: 13, color: p.col }}>
                  {p.label}
                </div>
              ))}
            </div>
          </>)}

          {/* Éval + Antalgique */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('ÉVALUATION')}
                <RegList items={['Origine du traumatisme.', 'Profondeur de la plaie.', 'Importance de l\'hémorragie.', 'Présence d\'un projectile.', 'Fracture éventuelle.', 'Atteinte tendons, nerfs, vaisseaux.']} />
              </div>
              <div>
                {ctrTitle('ANTALGIE')}
                <RegList items={['Légère : Camomille, Valériane.', 'Modérée : Élixir Parégorique.', 'Importante : Laudanum.', 'Chirurgie majeure : Éther, Chloroforme.']} />
              </div>
            </div>
          </>)}

          {/* Antisepsie + Classification */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('ANTISEPSIE')}
                <RegList items={['Lavage soigneux des mains.', 'Instruments stérilisés.', 'Peau désinfectée.', 'Acide phénique ou Teinture d\'iode.']} />
                {urgBox(<RegPara>Une plaie sale ne doit jamais être refermée.</RegPara>)}
              </div>
              <div>
                {ctrTitle('CLASSIFICATION')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Simples', col: '#60A060' },
                    { label: 'Profondes', col: '#3C657E' },
                    { label: 'Pénétrantes', col: '#8060A0' },
                    { label: 'Par balle', col: '#C07030' },
                    { label: 'Infectées', col: '#DF9A88' },
                    { label: 'Gangreneuses', col: '#8A1010' },
                  ].map(c => (
                    <div key={c.label} style={{ background: `${c.col}10`, border: `1px solid ${c.col}30`, padding: '5px 10px', fontFamily: BODY, fontSize: 13, color: c.col }}>
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* Blessures par balle */}
          {ctrBlock(<>
            {ctrTitle('BLESSURES PAR BALLE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Traversante', col: '#C07030', items: ['Nettoyage.', 'Désinfection.', 'Contrôle saignement.', 'Drainage.', 'Pansement quotidien.'] },
                { label: 'Projectile logé', col: '#A05020', items: ['Extraction si accessible.', 'Lavage abondant.', 'Drainage.', 'Surveillance.'] },
                { label: 'Projectile fragmenté', col: '#8A4020', items: ['Fragments visibles seulement.', 'Préserver les tissus sains.'] },
                { label: 'Avec fracture', col: '#5A3080', items: ['Désinfection.', 'Immobilisation.', 'Drainage.', 'Surveillance quotidienne.'] },
              ].map(b => (
                <div key={b.label} style={{ background: T.card, border: `1px solid ${b.col}35`, borderTop: `3px solid ${b.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: b.col, marginBottom: 8 }}>{b.label}</div>
                  <RegList items={b.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* Infectées + Végétaux */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('PLAIES INFECTÉES')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {['Rougeur', 'Gonflement', 'Chaleur', 'Douleur', 'Pus', 'Odeur', 'Fièvre'].map(s => (
                    <div key={s} style={{ background: 'rgba(180,160,113,0.08)', border: '1px solid rgba(180,160,113,0.30)', padding: '4px 10px', fontFamily: MONO, fontSize: 11, color: '#DF9A88' }}>⚠ {s}</div>
                  ))}
                </div>
                <RegList items={['Débridement.', 'Drainage.', 'Lavages répétés.', 'Désinfection.', 'Surveillance rapprochée.']} />
              </div>
              <div>
                {ctrTitle('PLANTES MÉDICINALES')}
                <RegList items={['Thym.', 'Romarin.', 'Lavande.', 'Plantain.', 'Calendula.', 'Consoude (après guérison).', 'Échinacée.']} />
              </div>
            </div>
          </>)}

          {/* Sutures + Fractures */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('SUTURES')}
                <RegList items={['Point simple : plaies propres, faible tension.', 'Point en croix : plaies profondes, forte tension.', 'Retrait : 5–8 j (simples), 8–12 j (profondes).']} />
              </div>
              <div>
                {ctrTitle('FRACTURES OUVERTES')}
                <RegList items={['Désinfection complète.', 'Retrait des corps étrangers.', 'Immobilisation.', 'Drainage si nécessaire.', 'Surveillance quotidienne.']} />
              </div>
            </div>
          </>)}

          {/* Gangrène + Amputation */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('GANGRÈNE')}
                <div style={{ background: 'rgba(140,10,10,0.08)', border: '1px solid rgba(140,10,10,0.35)', borderLeft: '4px solid #8A1010', padding: '10px 12px', marginBottom: 8 }}>
                  <RegList items={['Tissus noirs.', 'Odeur fétide.', 'Absence de sensibilité.', 'Perte de circulation.']} />
                </div>
                <RegList items={['Retrait des tissus morts.', 'Désinfection.', 'Amputation si menace vitale.']} />
              </div>
              <div>
                {ctrTitle('AMPUTATION')}
                <div style={{ fontFamily: DISPLAY, fontSize: 13, color: CTR_LIGHT, marginBottom: 4 }}>Indications</div>
                <RegList items={['Gangrène.', 'Fracture irréparable.', 'Écrasement majeur.', 'Hémorragie incontrôlable.', 'Septicémie.']} />
                <div style={{ fontFamily: DISPLAY, fontSize: 13, color: CTR_LIGHT, marginBottom: 4, marginTop: 8 }}>Principes</div>
                <RegList items={['Anesthésie (Éther, Chloroforme).', 'Ligature des vaisseaux.', 'Section dans les tissus sains.', 'Drainage si nécessaire.']} />
              </div>
            </div>
          </>)}

          {/* Surveillance + Complications */}
          {ctrBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {ctrTitle('SURVEILLANCE POST-OP')}
                <RegList items={['Température.', 'Pouls.', 'Douleur.', 'Couleur de la plaie.', 'Écoulement.', 'Odeur.', 'Cicatrisation.']} />
                <RegPara>Changer immédiatement tout pansement humide ou souillé.</RegPara>
              </div>
              <div>
                {ctrTitle('COMPLICATIONS')}
                {[
                  { label: 'Hémorragie secondaire', col: '#DF9A88' },
                  { label: 'Infection', col: '#B05030' },
                  { label: 'Septicémie', col: '#8A1020' },
                ].map(c => (
                  <div key={c.label} style={{ background: `${c.col}08`, border: `1px solid ${c.col}30`, padding: '7px 10px', marginBottom: 6, fontFamily: BODY, fontSize: 13, color: c.col }}>
                    ⚠ {c.label}
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* Convalescence */}
          {ctrBlock(<>
            {ctrTitle('CONVALESCENCE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                { label: 'Alimentation', col: CTR_LIGHT, items: ['Bouillons nourrissants.', 'Viandes cuites.', 'Légumes frais.', 'Fruits.'] },
                { label: 'Dispensaire', col: CTR_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Élixir Parégorique.', 'Laudanum.'] },
                { label: 'Végétaux', col: '#A8B991', items: ['Calendula.', 'Plantain.', 'Consoude.', 'Lavande.', 'Romarin.', 'Échinacée.'] },
                { label: 'Rééducation', col: '#8080B0', items: ['Mobilisation progressive.', 'Mouvements doux.', 'Massages légers.', 'Reprise de la marche.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${CTR}08`, border: `1px solid ${CTR_LIGHT}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${CTR_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: CTR_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Toute plaie doit être examinée avant d\'être traitée.', 'L\'antisepsie est indispensable avant, pendant et après toute intervention.', 'Une plaie infectée ne doit jamais être refermée sans drainage.', 'Les blessures par balle nécessitent une exploration prudente et une surveillance prolongée.', 'L\'amputation reste un dernier recours destiné à sauver la vie du patient.', 'Le chirurgien associe chirurgie moderne, antisepsie, pharmacologie et médecine végétale pour optimiser la guérison.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Manuel de Désinfection et de Stérilisation ── */

const DSI = '#283848';
const DSI_LIGHT = '#3C657E';

function DesinfectionDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const dsiBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${DSI}70`, borderTop: `3px solid ${DSI_LIGHT}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const dsiTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const dsiMethod = (label: string, col: string, content: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${col}35`, borderLeft: `4px solid ${col}`, padding: '14px 18px', marginBottom: 10 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 16, color: col, marginBottom: 8 }}>{label}</div>
      {content}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${DSI_LIGHT}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${DSI_LIGHT}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${DSI_LIGHT}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${DSI_LIGHT}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${DSI_LIGHT}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: DSI_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ MANUEL DE DÉSINFECTION ET DE STÉRILISATION ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: DSI_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🔬 Désinfection et Stérilisation</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Selon les principes de Pasteur, Lister et de l'Antisepsie Moderne</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${DSI_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? DSI_LIGHT : T.border}`, background: version === v ? `${DSI}60` : 'transparent', color: version === v ? DSI_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${DSI_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Les progrès de la médecine ont démontré que la plupart des infections chirurgicales ne proviennent ni du mauvais air, ni d'une faiblesse du malade, mais de micro-organismes invisibles introduits dans les plaies.</RegPara>
            <RegPara>Les travaux de Louis Pasteur ont établi la théorie des germes, tandis que Joseph Lister a démontré qu'une antisepsie rigoureuse réduit considérablement les infections et la mortalité opératoire.</RegPara>
            <RegCitation text="Le médecin de 1890 doit désormais faire de la propreté une véritable méthode scientifique." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Principes */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE I', 'Principes de l\'Antisepsie')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: DSI_LIGHT, marginBottom: 8 }}>Le praticien doit toujours :</div>
                <RegList items={['Empêcher l\'introduction des germes.', 'Détruire ceux déjà présents.', 'Maintenir les plaies propres jusqu\'à leur cicatrisation.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 15, color: DSI_LIGHT, marginBottom: 8 }}>Les trois fondements :</div>
                <RegList items={['Stérilisation des instruments.', 'Désinfection des mains et de la peau.', 'Emploi d\'antiseptiques adaptés.']} />
              </div>
            </div>
          </>)}

          {/* II. Stérilisation */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE II', 'Stérilisation des Instruments')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 12 }}>
              {dsiMethod('Eau bouillante', '#3C657E', (
                <>
                  <RegPara>Méthode privilégiée. Les instruments métalliques sont plongés dans l'eau bouillante durant <strong style={{ color: DSI_LIGHT }}>20 à 30 minutes</strong>.</RegPara>
                </>
              ))}
              {dsiMethod('Acide phénique', '#8080B0', (
                <div>
                  <RegPara>Utilisé pour instruments, pansements et irrigation des plaies.</RegPara>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, background: `rgba(128,128,176,0.10)`, border: `1px solid rgba(128,128,176,0.30)`, padding: '6px 10px', fontFamily: MONO, fontSize: 12, color: '#8080B0' }}>5 % — instruments</div>
                    <div style={{ flex: 1, background: `rgba(128,128,176,0.10)`, border: `1px solid rgba(128,128,176,0.30)`, padding: '6px 10px', fontFamily: MONO, fontSize: 12, color: '#8080B0' }}>2 % — plaies</div>
                  </div>
                </div>
              ))}
              {dsiMethod('Alcool', '#70A8A0', (
                <RegList items={['Désinfection rapide.', 'Conservation temporaire des instruments.', 'Nettoyage de la peau.']} />
              ))}
              {dsiMethod('Flamme', '#C07040', (
                <RegPara>Les aiguilles et petits instruments métalliques peuvent être rapidement passés à la flamme.</RegPara>
              ))}
            </div>
            <RegBlock col={`${DSI_LIGHT}40`}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>CONSERVATION APRÈS STÉRILISATION</div>
              <RegList items={['Sécher les instruments.', 'Ranger dans une boîte propre et fermée.', 'Manipuler avec des mains désinfectées.']} />
            </RegBlock>
          </>)}

          {/* III. Désinfection des mains */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE III', 'Désinfection des Mains')}
            <RegPara>Avant chaque soin, le praticien procède à :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Lavage au savon.', 'Brossage des ongles.', 'Rinçage à l\'eau propre.', 'Désinfection à l\'alcool ou à l\'acide phénique dilué.'].map((item, i) => (
                <div key={item} style={{ background: `${DSI}10`, border: `1px solid ${DSI_LIGHT}30`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: DSI_LIGHT, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: `rgba(180,60,40,0.08)`, border: `1px solid rgba(180,60,40,0.30)` }}>
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#DF9A88' }}>Les mains ne doivent plus toucher de surface souillée avant l'intervention.</span>
            </div>
          </>)}

          {/* IV. Préparation du patient */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE IV', 'Préparation du Patient')}
            <RegPara>Avant toute intervention :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8, marginTop: 10 }}>
              {['Laver soigneusement la peau.', 'Retirer les salissures.', 'Raser si nécessaire la zone opératoire.', 'Appliquer de l\'alcool.', 'Terminer par une désinfection à la Teinture d\'iode ou à l\'Acide phénique.'].map((item, i) => (
                <div key={item} style={{ background: `${DSI}10`, border: `1px solid ${DSI_LIGHT}30`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: DSI_LIGHT, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}>{item}</span>
                </div>
              ))}
            </div>
          </>)}

          {/* V. Traitement des plaies */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE V', 'Traitement des Plaies')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div style={{ background: `${DSI}08`, border: `1px solid ${DSI_LIGHT}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DSI_LIGHT, marginBottom: 8 }}>Préparations du dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, marginBottom: 8 }}>Désinfectants</div>
                <RegList items={['Acide phénique.', 'Teinture d\'iode.']} />
              </div>
            </div>
            <RegBlock col={`${DSI_LIGHT}40`}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>LES PANSEMENTS DOIVENT TOUJOURS RESTER</div>
              <RegList items={['Propres.', 'Secs.', 'Régulièrement renouvelés.']} />
            </RegBlock>
          </>)}

          {/* VI. Hygiène des locaux */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE VI', 'Hygiène des Locaux')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DSI_LIGHT, marginBottom: 8 }}>Entretien quotidien</div>
                <RegList items={['Balayer quotidiennement.', 'Laver à l\'eau chaude.', 'Aérer régulièrement.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DSI_LIGHT, marginBottom: 8 }}>Linge et literie</div>
                <RegList items={['Draps changés après chaque malade.', 'Linge très souillé brûlé si nécessaire.', 'Matelas exposés au soleil régulièrement.', 'Matelas remplacés lorsqu\'insalubres.']} />
              </div>
            </div>
          </>)}

          {/* VII. Bloc opératoire */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE VII', 'Antisepsie au Bloc Opératoire')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Avant l\'intervention', col: '#3C657E', items: ['Instruments stérilisés.', 'Mains désinfectées.', 'Peau préparée.', 'Pansements prêts.'] },
                { label: 'Pendant l\'intervention', col: '#7080B0', items: ['Éviter toute contamination.', 'Limiter les manipulations inutiles.', 'Irriguer les plaies si nécessaire.'] },
                { label: 'Après l\'intervention', col: '#6090A0', items: ['Pansement propre.', 'Surveillance quotidienne.', 'Changement immédiat si le pansement devient humide.'] },
              ].map(phase => (
                <div key={phase.label} style={{ background: T.card, border: `1px solid ${phase.col}35`, borderTop: `3px solid ${phase.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 15, color: phase.col, marginBottom: 10 }}>{phase.label}</div>
                  <RegList items={phase.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* VIII. Plaies particulières */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE VIII', 'Plaies Particulières')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Plaies par balle', col: '#A04020', items: ['Lavage abondant.', 'Retrait des corps étrangers accessibles.', 'Désinfection.', 'Drainage si nécessaire.', 'Pansement antiseptique.'] },
                { label: 'Plaies profondes', col: '#8060A0', items: ['Nettoyage soigneux.', 'Drainage lorsque nécessaire.', 'Ne jamais refermer une plaie infectée.'] },
                { label: 'Gangrène', col: '#DF9A88', items: ['Retrait des tissus morts.', 'Amputation si extension importante menaçant la vie du malade.'] },
              ].map(p => (
                <div key={p.label} style={{ background: T.card, border: `1px solid ${p.col}35`, borderLeft: `4px solid ${p.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 16, color: p.col, marginBottom: 10 }}>{p.label}</div>
                  <RegList items={p.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* IX. Complications */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE IX', 'Complications à Surveiller')}
            <RegPara>Le médecin recherche quotidiennement :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 10 }}>
              {[
                { signe: 'Rougeur.', col: '#DF9A88' },
                { signe: 'Chaleur excessive.', col: '#C07030' },
                { signe: 'Douleur importante.', col: '#B04040' },
                { signe: 'Écoulement purulent.', col: '#908030' },
                { signe: 'Mauvaise odeur.', col: '#708030' },
                { signe: 'Fièvre.', col: '#EADCB9' },
                { signe: 'Retard de cicatrisation.', col: '#506080' },
              ].map(s => (
                <div key={s.signe} style={{ background: `${s.col}10`, border: `1px solid ${s.col}35`, padding: '8px 12px', fontFamily: BODY, fontSize: 13, color: s.col }}>
                  ⚠ {s.signe}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', background: `rgba(180,60,40,0.08)`, border: `1px solid rgba(180,60,40,0.30)` }}>
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#DF9A88' }}>Toute aggravation impose une nouvelle désinfection et un examen complet.</span>
            </div>
          </>)}

          {/* X. Devoir */}
          {dsiBlock(<>
            {dsiTitle('CHAPITRE X', 'Devoir du Médecin')}
            <RegList items={['Maintenir une propreté irréprochable.', 'Appliquer les règles d\'antisepsie à chaque intervention.', 'Enseigner les mesures d\'hygiène aux familles.', 'Protéger les autres malades contre les infections.']} />
            <RegCitation text="La négligence est souvent plus dangereuse que la maladie elle-même." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${DSI_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>L'antisepsie constitue l'un des plus grands progrès de la médecine moderne. En appliquant rigoureusement les principes de Pasteur et de Lister, le médecin de 1890 réduit considérablement les infections, améliore la cicatrisation et augmente les chances de survie de ses malades.</RegPara>
            <RegCitation text="La propreté, la discipline et la méthode demeurent les premiers instruments du praticien, avant même le bistouri." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Principes */}
          {dsiBlock(<>
            {dsiTitle('PRINCIPES FONDAMENTAUX')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DSI_LIGHT, marginBottom: 8 }}>Le médecin doit toujours</div>
                <RegList items={['Empêcher la contamination des plaies.', 'Détruire les germes présents.', 'Maintenir une antisepsie rigoureuse jusqu\'à la guérison.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: DSI_LIGHT, marginBottom: 8 }}>Les trois piliers</div>
                <RegList items={['Stérilisation des instruments.', 'Désinfection des mains et de la peau.', 'Utilisation d\'antiseptiques adaptés.']} />
              </div>
            </div>
          </>)}

          {/* Stérilisation */}
          {dsiBlock(<>
            {dsiTitle('STÉRILISATION DES INSTRUMENTS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Eau bouillante', col: '#3C657E', content: ['Ébullition 20 à 30 minutes.', 'Méthode de référence.'] },
                { label: 'Acide phénique', col: '#8080B0', content: ['5 % — instruments.', '2 % — plaies.'] },
                { label: 'Alcool', col: '#70A8A0', content: ['Désinfection rapide.', 'Nettoyage de la peau.'] },
                { label: 'Flamme', col: '#C07040', content: ['Aiguilles et petits instruments.'] },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}35`, borderTop: `3px solid ${m.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: m.col, marginBottom: 8 }}>{m.label}</div>
                  <RegList items={m.content} />
                </div>
              ))}
            </div>
            <RegBlock col={`${DSI_LIGHT}40`}>
              <RegPara>Conservation : sécher, ranger dans boîte fermée, manipuler avec mains désinfectées.</RegPara>
            </RegBlock>
          </>)}

          {/* Mains + Patient */}
          {dsiBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {dsiTitle('DÉSINFECTION DES MAINS')}
                {['Lavage au savon.', 'Brossage des ongles.', 'Rinçage à l\'eau propre.', 'Désinfection alcool ou acide phénique dilué.'].map((item, i) => (
                  <div key={item} style={{ background: `${DSI}10`, border: `1px solid ${DSI_LIGHT}25`, padding: '7px 12px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: DSI_LIGHT, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}>{item}</span>
                  </div>
                ))}
              </div>
              <div>
                {dsiTitle('PRÉPARATION DU PATIENT')}
                {['Laver la peau.', 'Raser la zone opératoire si nécessaire.', 'Désinfecter avec de l\'alcool.', 'Appliquer Teinture d\'iode ou Acide phénique.'].map((item, i) => (
                  <div key={item} style={{ background: `${DSI}10`, border: `1px solid ${DSI_LIGHT}25`, padding: '7px 12px', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: DSI_LIGHT, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* Plaies + Locaux */}
          {dsiBlock(<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                {dsiTitle('TRAITEMENT DES PLAIES')}
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Acide phénique.', 'Teinture d\'iode.']} />
                <RegBlock col={`${DSI_LIGHT}40`}><RegPara>Pansements : propres, secs, régulièrement renouvelés.</RegPara></RegBlock>
              </div>
              <div>
                {dsiTitle('HYGIÈNE DES LOCAUX')}
                <RegList items={['Balayer et laver quotidiennement.', 'Aérer correctement.', 'Draps changés après chaque malade.', 'Linge souillé désinfecté ou brûlé.', 'Matelas exposés au soleil régulièrement.']} />
              </div>
            </div>
          </>)}

          {/* Antisepsie chirurgicale */}
          {dsiBlock(<>
            {dsiTitle('ANTISEPSIE CHIRURGICALE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Avant', col: '#3C657E', items: ['Instruments stérilisés.', 'Mains désinfectées.', 'Peau préparée.', 'Pansements prêts.'] },
                { label: 'Pendant', col: '#7080B0', items: ['Limiter toute contamination.', 'Matériel propre uniquement.', 'Irriguer si nécessaire.'] },
                { label: 'Après', col: '#6090A0', items: ['Pansement antiseptique.', 'Surveillance quotidienne.', 'Changement immédiat si souillé.'] },
              ].map(phase => (
                <div key={phase.label} style={{ background: T.card, border: `1px solid ${phase.col}35`, borderTop: `2px solid ${phase.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: phase.col, marginBottom: 8 }}>{phase.label}</div>
                  <RegList items={phase.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* Plaies particulières */}
          {dsiBlock(<>
            {dsiTitle('PLAIES PARTICULIÈRES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Plaies par balle', col: '#A04020', items: ['Lavage abondant.', 'Désinfection.', 'Retrait corps étrangers.', 'Drainage si nécessaire.'] },
                { label: 'Plaies profondes', col: '#8060A0', items: ['Nettoyage soigneux.', 'Drainage.', 'Ne jamais refermer si infectée.'] },
                { label: 'Gangrène', col: '#DF9A88', items: ['Retrait des tissus morts.', 'Amputation si menace vitale.'] },
              ].map(p => (
                <div key={p.label} style={{ background: T.card, border: `1px solid ${p.col}35`, borderLeft: `4px solid ${p.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: p.col, marginBottom: 8 }}>{p.label}</div>
                  <RegList items={p.items} />
                </div>
              ))}
            </div>
          </>)}

          {/* Complications */}
          {dsiBlock(<>
            {dsiTitle('COMPLICATIONS À SURVEILLER')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { signe: 'Rougeur', col: '#DF9A88' },
                { signe: 'Chaleur importante', col: '#C07030' },
                { signe: 'Douleur croissante', col: '#B04040' },
                { signe: 'Écoulement purulent', col: '#908030' },
                { signe: 'Mauvaise odeur', col: '#708030' },
                { signe: 'Fièvre', col: '#EADCB9' },
                { signe: 'Retard cicatrisation', col: '#506080' },
              ].map(s => (
                <div key={s.signe} style={{ background: `${s.col}10`, border: `1px solid ${s.col}35`, padding: '8px 12px', fontFamily: BODY, fontSize: 13, color: s.col }}>
                  ⚠ {s.signe}
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${DSI_LIGHT}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: DSI_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Une antisepsie rigoureuse réduit fortement les infections.', 'Toujours stériliser les instruments avant chaque intervention.', 'Désinfecter les mains, la peau et les plaies.', 'Maintenir des locaux propres, aérés et désinfectés.', 'Les préparations du dispensaire complètent les antiseptiques modernes.', 'La propreté, la méthode et la discipline sont les premières qualités d\'un bon praticien.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Traité des Fièvres Communes ── */

const FIE = '#8A2810';
const FIE_LIGHT = '#D06840';

function FievresDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const fieBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${FIE}40`, borderTop: `3px solid ${FIE}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const fieTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: FIE_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const fieDisease = (label: string, col: string, sections: { title: string; content: React.ReactNode }[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderLeft: `4px solid ${col}`, padding: '18px 22px', marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19, color: col, marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {sections.map(s => (
          <div key={s.title} style={{ background: `${FIE}06`, border: `1px solid ${FIE}20`, padding: '12px 14px' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: col, letterSpacing: '0.12em', marginBottom: 6 }}>{s.title}</div>
            {s.content}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${FIE}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${FIE}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${FIE}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${FIE}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${FIE}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: FIE_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ TRAITÉ DES FIÈVRES COMMUNES ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: FIE_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🌡️ Fièvres Communes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Diagnostic, Traitement et Prévention · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${FIE_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? FIE_LIGHT : T.border}`, background: version === v ? `${FIE}30` : 'transparent', color: version === v ? FIE_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${FIE}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: FIE_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Les fièvres demeurent l'une des principales causes de consultation dans les campagnes. Elles peuvent résulter d'infections, d'eaux souillées, d'aliments contaminés, d'épidémies saisonnières ou de maladies propres aux régions marécageuses.</RegPara>
            <RegPara>Depuis les travaux de Pasteur et de Koch, le médecin sait désormais que de nombreuses fièvres sont provoquées par des micro-organismes invisibles. L'hygiène, la désinfection et l'observation clinique sont devenues les premiers moyens de lutte contre ces maladies.</RegPara>
            <RegCitation text="Le praticien doit reconnaître rapidement l'origine de la fièvre, prévenir les complications et soutenir les forces du malade jusqu'à sa guérison." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Fièvre typhoïde */}
          {fieBlock(<>
            {fieTitle('CHAPITRE I', 'De la Fièvre Typhoïde')}
            {fieDisease('Fièvre Typhoïde', '#B03020', [
              {
                title: 'ORIGINE',
                content: (
                  <div>
                    <RegList items={['Eau contaminée.', 'Aliments souillés.', 'Mauvaise évacuation des eaux usées.', 'Hygiène insuffisante.']} />
                    <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Les villages utilisant des puits proches des latrines sont particulièrement exposés.</p>
                  </div>
                ),
              },
              { title: 'SIGNES', content: <RegList items={['Fièvre élevée et continue.', 'Céphalées.', 'Langue sèche.', 'Douleurs abdominales.', 'Ballonnements.', 'Diarrhée.', 'Grande faiblesse.', 'Pouls rapide.']} /> },
              { title: 'TRAITEMENT', content: <RegList items={['Repos strict.', 'Eau bouillie en abondance.', 'Alimentation légère.', 'Surveillance quotidienne.', 'Isolement du malade.', 'Désinfection du linge et des ustensiles.']} /> },
              { title: 'PLANTES', content: <RegList items={['Achillée millefeuille.', 'Menthe.', 'Sauge.', 'Camomille.', 'Guimauve.']} /> },
            ])}
            <RegBlock col="rgba(180,60,40,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#D05050', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS À SURVEILLER</div>
              <RegList items={['Hémorragie intestinale.', 'Perforation digestive.', 'Déshydratation.', 'Affaiblissement général.']} />
            </RegBlock>
          </>)}

          {/* II. Fièvres intestinales */}
          {fieBlock(<>
            {fieTitle('CHAPITRE II', 'Des Fièvres Intestinales')}
            {fieDisease('Fièvres Intestinales', '#A05020', [
              { title: 'ORIGINE', content: <RegList items={['Aliments avariés.', 'Eau contaminée.', 'Mauvaise conservation des viandes.', 'Hygiène alimentaire insuffisante.']} /> },
              { title: 'SIGNES', content: <RegList items={['Fièvre modérée.', 'Diarrhée.', 'Vomissements.', 'Douleurs abdominales.', 'Soif importante.', 'Amaigrissement.']} /> },
              { title: 'TRAITEMENT', content: <RegList items={['Eau bouillie.', 'Repos.', 'Alimentation légère.', 'Surveillance de la déshydratation.', 'Hygiène rigoureuse.']} /> },
              { title: 'PLANTES', content: <RegList items={['Thym.', 'Menthe.', 'Guimauve.', 'Camomille.', 'Mauve.']} /> },
            ])}
            <RegBlock col="rgba(180,60,40,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#D05050', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS</div>
              <RegList items={['Déshydratation.', 'Épuisement.', 'Infection généralisée.']} />
            </RegBlock>
          </>)}

          {/* III. Fièvre palustre */}
          {fieBlock(<>
            {fieTitle('CHAPITRE III', 'De la Fièvre Palustre (Malaria)')}
            {fieDisease('Fièvre Palustre', '#206048', [
              {
                title: 'ORIGINE',
                content: (
                  <div>
                    <RegList items={['Régions marécageuses.', 'Forte présence de moustiques.']} />
                    <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Les observations médicales montrent qu'elle survient principalement dans les zones où abondent les moustiques.</p>
                  </div>
                ),
              },
              {
                title: 'SIGNES',
                content: (
                  <div>
                    <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginBottom: 4 }}>Par accès :</p>
                    <RegList items={['Frissons.', 'Forte chaleur.', 'Sueurs abondantes.']} />
                    <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, margin: '6px 0 4px' }}>S'y associent :</p>
                    <RegList items={['Fatigue importante.', 'Pâleur.', 'Amaigrissement.', 'Augmentation du volume de la rate.']} />
                  </div>
                ),
              },
              { title: 'PLANTES', content: <RegList items={['Quinquina.', 'Gentiane.', 'Saule blanc.', 'Romarin.', 'Lavande.']} /> },
            ])}
            <div style={{ background: `rgba(32,96,72,0.10)`, border: `1px solid rgba(32,96,72,0.35)`, borderLeft: `4px solid #206048`, padding: '14px 18px', marginBottom: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#40A080', letterSpacing: '0.14em', marginBottom: 8 }}>TRAITEMENT</div>
              <RegList items={['Repos.', 'Hydratation.', 'Éloignement temporaire des zones marécageuses.', 'Protection contre les moustiques lorsque cela est possible.']} />
              <div style={{ marginTop: 12, padding: '10px 14px', background: `rgba(32,96,72,0.12)`, border: `1px solid rgba(32,96,72,0.40)` }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 15, color: '#40A080' }}>La Quinine</span>
                <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}> demeure le traitement de référence contre la fièvre palustre.</span>
              </div>
            </div>
            <RegBlock col="rgba(180,60,40,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#D05050', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS</div>
              <RegList items={['Accès répétés.', 'Anémie.', 'Épuisement.', 'Atteinte de la rate.']} />
            </RegBlock>
          </>)}

          {/* IV. Autres fièvres */}
          {fieBlock(<>
            {fieTitle('CHAPITRE IV', 'Autres Fièvres Courantes')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {[
                {
                  label: 'Fièvre grippale', col: '#5A3080',
                  signes: ['Fièvre.', 'Courbatures.', 'Toux.', 'Fatigue.'],
                  traitement: ['Repos.', 'Hydratation.', 'Alimentation légère.'],
                },
                {
                  label: 'Fièvres de plaies', col: '#B05020',
                  signes: ['Suppuration possible.', 'Chaleur locale.', 'Rougeur.', 'Fièvre.'],
                  traitement: ['Rechercher la suppuration.', 'Nettoyer la plaie.', 'Désinfecter immédiatement.'],
                },
                {
                  label: 'Fièvres éruptives', col: '#8A4010',
                  signes: ['Accompagnent rougeole, scarlatine, varicelle.', 'Éruption cutanée.', 'Fièvre variable.'],
                  traitement: ['Traitement selon la maladie responsable.', 'Isolement si contagieuse.'],
                },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}40`, borderTop: `3px solid ${m.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: m.col, marginBottom: 10 }}>{m.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: FIE_LIGHT, letterSpacing: '0.12em', marginBottom: 5 }}>SIGNES</div>
                  <RegList items={m.signes} />
                  <div style={{ fontFamily: MONO, fontSize: 10, color: FIE_LIGHT, letterSpacing: '0.12em', margin: '8px 0 5px' }}>TRAITEMENT</div>
                  <RegList items={m.traitement} />
                </div>
              ))}
            </div>
          </>)}

          {/* V. Prévention */}
          {fieBlock(<>
            {fieTitle('CHAPITRE V', 'Prévention')}
            <RegPara>Le médecin recommande :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Eau systématiquement bouillie lorsque sa qualité est douteuse.', 'Lavage des mains.', 'Désinfection des plaies.', 'Nettoyage des logements.', 'Entretien des puits.', 'Éloignement des eaux stagnantes.', 'Cuisson complète des aliments.'].map(item => (
                <div key={item} style={{ background: `${FIE}08`, border: `1px solid ${FIE}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: FIE_LIGHT, fontSize: 10, flexShrink: 0 }}>◆</span>{item}
                </div>
              ))}
            </div>
            <RegCitation text="La prévention demeure le meilleur traitement." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* VI. Traitements */}
          {fieBlock(<>
            {fieTitle('CHAPITRE VI', 'Traitements Autorisés')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ background: `${FIE}08`, border: `1px solid ${FIE}30`, padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: FIE_LIGHT, marginBottom: 8 }}>Préparations du dispensaire</div>
                <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, marginBottom: 8 }}>Désinfectants</div>
                <RegList items={['Acide phénique.', 'Teinture d\'iode.']} />
              </div>
              <div style={{ background: T.card, border: 'rgba(180,100,60,0.35) solid 1px', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#D06840', marginBottom: 8 }}>Médicaments</div>
                <RegList items={['Quinine.', 'Laudanum (douleurs importantes).', 'Élixir Parégorique.']} />
              </div>
            </div>
            <div style={{ background: T.card, border: 'rgba(80,140,80,0.35) solid 1px', padding: '14px 16px' }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Préparations végétales</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}>
                {['Camomille.', 'Menthe.', 'Sauge.', 'Guimauve.', 'Thym.', 'Achillée.', 'Romarin.', 'Lavande.', 'Gentiane.', 'Saule blanc.'].map(p => (
                  <div key={p} style={{ fontFamily: BODY, fontSize: 13, color: T.text, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#A8B991', fontSize: 9 }}>◆</span>{p}
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* VII. Devoir */}
          {fieBlock(<>
            {fieTitle('CHAPITRE VII', 'Devoir du Médecin')}
            <RegList items={['Identifier rapidement l\'origine de la fièvre.', 'Maintenir une bonne hydratation.', 'Surveiller quotidiennement le malade.', 'Prévenir les complications.', 'Protéger l\'entourage contre les maladies contagieuses.']} />
            <RegCitation text="L'observation attentive permet souvent de distinguer une fièvre bénigne d'une affection mettant la vie en danger." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${FIE}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: FIE_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Les fièvres communes demeurent parmi les maladies les plus fréquentes des campagnes. Grâce aux progrès de l'antisepsie, à une meilleure compréhension des maladies infectieuses, à la Quinine contre le paludisme et aux ressources de la médecine végétale, le médecin de 1890 dispose désormais de moyens plus efficaces pour soulager ses malades.</RegPara>
            <RegCitation text="Le véritable praticien associe toujours l'hygiène, l'observation clinique, la pharmacologie moderne et les plantes médicinales afin d'offrir les meilleurs soins possibles." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {fieBlock(<>
            {fieTitle('PRINCIPALES FIÈVRES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { label: 'Fièvre typhoïde', col: '#B03020', note: 'Eau/aliments contaminés, très grave.' },
                { label: 'Fièvres intestinales', col: '#A05020', note: 'Aliments avariés, déshydratation.' },
                { label: 'Fièvre palustre', col: '#206048', note: 'Marais, moustiques, accès répétés.' },
                { label: 'Fièvre grippale', col: '#5A3080', note: 'Toux, courbatures, repos.' },
                { label: 'Fièvres de plaies', col: '#B05020', note: 'Infection locale, désinfecter.' },
                { label: 'Fièvres éruptives', col: '#8A4010', note: 'Rougeole, scarlatine, varicelle.' },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}35`, borderLeft: `3px solid ${m.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, color: m.col, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 11, color: T.muted }}>{m.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {fieBlock(<>
            {fieTitle('FIÈVRE TYPHOÏDE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#B03020', marginBottom: 8 }}>Origine</div>
                <RegList items={['Eau contaminée.', 'Aliments souillés.', 'Mauvaise hygiène.', 'Puits proches des latrines.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#B03020', marginBottom: 8 }}>Signes</div>
                <RegList items={['Fièvre élevée et continue.', 'Céphalées.', 'Langue sèche.', 'Douleurs abdominales.', 'Diarrhée.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: FIE_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Repos strict.', 'Eau bouillie.', 'Alimentation légère.', 'Isolement.', 'Désinfection.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Achillée.', 'Menthe.', 'Sauge.', 'Camomille.', 'Guimauve.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,40,0.50)">
              <RegPara>Complications : Hémorragie intestinale, Perforation digestive, Déshydratation.</RegPara>
            </RegBlock>
          </>)}

          {fieBlock(<>
            {fieTitle('FIÈVRES INTESTINALES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A05020', marginBottom: 8 }}>Signes</div>
                <RegList items={['Fièvre modérée.', 'Vomissements.', 'Diarrhée.', 'Douleurs abdominales.', 'Soif importante.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: FIE_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Hydratation.', 'Repos.', 'Alimentation légère.', 'Surveillance déshydratation.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Thym.', 'Menthe.', 'Guimauve.', 'Camomille.', 'Mauve.']} />
              </div>
            </div>
          </>)}

          {fieBlock(<>
            {fieTitle('FIÈVRE PALUSTRE (MALARIA)')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#206048', marginBottom: 8 }}>Signes</div>
                <RegList items={['Frissons.', 'Forte fièvre.', 'Sueurs abondantes.', 'Fatigue.', 'Pâleur.', 'Augmentation de la rate.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: FIE_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Repos.', 'Hydratation.', 'Éloignement des marais.']} />
                <div style={{ marginTop: 10, padding: '8px 10px', background: `rgba(32,96,72,0.12)`, border: `1px solid rgba(32,96,72,0.35)` }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 13, color: '#40A080' }}>Quinine</span>
                  <span style={{ fontFamily: BODY, fontSize: 12, color: T.muted }}> — traitement de référence.</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Quinquina.', 'Gentiane.', 'Saule blanc.', 'Romarin.', 'Lavande.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,40,0.50)">
              <RegPara>Complications : Anémie, Épuisement, Atteinte de la rate.</RegPara>
            </RegBlock>
          </>)}

          {fieBlock(<>
            {fieTitle('AUTRES FIÈVRES FRÉQUENTES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Fièvre grippale', col: '#5A3080', items: ['Fièvre.', 'Courbatures.', 'Toux.', 'Fatigue.'] },
                { label: 'Fièvres de plaies', col: '#B05020', items: ['Infection d\'une blessure.', 'Désinfection immédiate.'] },
                { label: 'Fièvres éruptives', col: '#8A4010', items: ['Rougeole.', 'Scarlatine.', 'Varicelle.'] },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}35`, borderTop: `2px solid ${m.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: m.col, marginBottom: 8 }}>{m.label}</div>
                  <RegList items={m.items} />
                </div>
              ))}
            </div>
          </>)}

          {fieBlock(<>
            {fieTitle('PRÉVENTION')}
            <RegList items={['Faire bouillir l\'eau.', 'Se laver les mains.', 'Désinfecter les plaies.', 'Nettoyer les logements.', 'Entretenir les puits.', 'Éviter les eaux stagnantes.', 'Bien cuire les aliments.']} />
          </>)}

          {fieBlock(<>
            {fieTitle('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {[
                { label: 'Dispensaire', col: FIE_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.'] },
                { label: 'Désinfectants', col: T.gold, items: ['Acide phénique.', 'Teinture d\'iode.'] },
                { label: 'Médicaments', col: '#D06840', items: ['Quinine.', 'Laudanum.', 'Élixir Parégorique.'] },
                { label: 'Végétaux', col: '#A8B991', items: ['Achillée.', 'Camomille.', 'Menthe.', 'Sauge.', 'Guimauve.', 'Thym.', 'Romarin.', 'Lavande.', 'Gentiane.', 'Saule blanc.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${FIE}08`, border: `1px solid ${FIE}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${FIE}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: FIE_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Identifier rapidement l\'origine de la fièvre.', 'Maintenir une bonne hydratation et le repos du malade.', 'Appliquer une hygiène et une antisepsie rigoureuses.', 'La Quinine est le traitement de référence contre la fièvre palustre.', 'Les préparations végétales complètent les soins mais ne remplacent pas les traitements médicaux.', 'La prévention, l\'observation clinique et la surveillance quotidienne restent les meilleurs moyens de lutter contre les fièvres communes.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

/* ── Cours des Maladies Infantiles ── */

const MIC = '#1A4A5A';
const MIC_LIGHT = '#4A90A8';

function MaladiesInfantilesDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const micBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${MIC}40`, borderTop: `3px solid ${MIC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const micTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: MIC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const micDisease = (label: string, col: string, sections: { title: string; content: React.ReactNode }[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderLeft: `4px solid ${col}`, padding: '18px 22px', marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19, color: col, marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {sections.map(s => (
          <div key={s.title} style={{ background: `${MIC}06`, border: `1px solid ${MIC}20`, padding: '12px 14px' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: col, letterSpacing: '0.12em', marginBottom: 6 }}>{s.title}</div>
            {s.content}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${MIC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${MIC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${MIC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${MIC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${MIC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: MIC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DES MALADIES INFANTILES ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: MIC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🧒 Maladies Infantiles Courantes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Diagnostic, Traitement et Prévention · À l'usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${MIC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? MIC_LIGHT : T.border}`, background: version === v ? `${MIC}30` : 'transparent', color: version === v ? MIC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${MIC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MIC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Les enfants constituent les patients les plus fragiles du dispensaire. Leur jeune âge, leur faible résistance aux maladies contagieuses et les conditions de vie parfois précaires des campagnes rendent indispensable une surveillance médicale attentive.</RegPara>
            <RegPara>Le médecin doit reconnaître rapidement les maladies infantiles, limiter leur propagation, soulager les symptômes et prévenir les complications qui demeurent, en cette année 1890, une cause fréquente de mortalité.</RegPara>
            <RegCitation text="L'hygiène, l'antisepsie, une alimentation adaptée et l'observation clinique demeurent les meilleurs alliés du praticien." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Rougeole */}
          {micBlock(<>
            {micTitle('CHAPITRE I', 'De la Rougeole')}
            {micDisease('Rougeole', '#DF9A88', [
              {
                title: 'ORIGINE',
                content: <p style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, margin: 0 }}>Maladie virale très contagieuse, transmise par l'air et les sécrétions respiratoires. Touche particulièrement écoles et logements mal ventilés.</p>,
              },
              {
                title: 'SIGNES',
                content: <RegList items={['Fièvre élevée.', 'Fatigue importante.', 'Conjonctivite.', 'Toux sèche.', 'Taches blanchâtres dans la bouche.', 'Éruption rouge débutant au visage.', 'Sensibilité à la lumière.']} />,
              },
              {
                title: 'TRAITEMENT',
                content: <RegList items={['Repos complet.', 'Chambre propre, tempérée et bien aérée.', 'Hydratation abondante.', 'Alimentation légère.', 'Nettoyage des yeux et du nez.']} />,
              },
              {
                title: 'PLANTES',
                content: <RegList items={['Tilleul.', 'Mauve.', 'Guimauve.', 'Camomille.', 'Violette.']} />,
              },
            ])}
            <RegBlock col="rgba(180,60,60,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS À SURVEILLER</div>
              <RegList items={['Bronchite.', 'Pneumonie.', 'Otite.', 'Déshydratation.']} />
            </RegBlock>
          </>)}

          {/* II. Diphtérie */}
          {micBlock(<>
            {micTitle('CHAPITRE II', 'De la Diphtérie')}
            {micDisease('Diphtérie', '#8A2020', [
              {
                title: 'ORIGINE',
                content: <p style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, margin: 0 }}>Maladie bactérienne extrêmement contagieuse atteignant principalement la gorge. Une membrane blanchâtre peut obstruer progressivement les voies respiratoires.</p>,
              },
              {
                title: 'SIGNES',
                content: <RegList items={['Gorge douloureuse.', 'Difficulté à avaler.', 'Voix rauque.', 'Membranes blanchâtres.', 'Respiration difficile.', 'Fièvre.', 'Fatigue importante.']} />,
              },
              {
                title: 'TRAITEMENT',
                content: <RegList items={['Isolement immédiat.', 'Désinfection de la gorge.', 'Eau Vulnéraire selon les besoins.', 'Surveillance respiratoire permanente.', 'Alimentation liquide.']} />,
              },
              {
                title: 'PLANTES',
                content: <RegList items={['Sauge.', 'Thym.', 'Menthe.', 'Primevère.', 'Guimauve.']} />,
              },
            ])}
            <RegBlock col={`${MIC}40`}>
              <RegPara>Depuis les récentes découvertes médicales, le sérum antidiphtérique commence à être employé dans certains grands établissements médicaux, bien qu'il demeure encore peu disponible dans les dispensaires ruraux.</RegPara>
            </RegBlock>
            <RegBlock col="rgba(180,60,60,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS</div>
              <RegList items={['Asphyxie.', 'Pneumonie.', 'Paralysie.', 'Épuisement général.']} />
              <RegPara>Toute aggravation impose une surveillance médicale constante.</RegPara>
            </RegBlock>
          </>)}

          {/* III. Coqueluche */}
          {micBlock(<>
            {micTitle('CHAPITRE III', 'De la Coqueluche')}
            {micDisease('Coqueluche', '#5A3080', [
              {
                title: 'ORIGINE',
                content: <p style={{ fontFamily: BODY, fontSize: 13, color: T.text, lineHeight: 1.65, margin: 0 }}>Maladie très contagieuse des voies respiratoires touchant principalement les jeunes enfants.</p>,
              },
              {
                title: 'SIGNES',
                content: <RegList items={['Toux répétitive.', 'Difficulté à reprendre son souffle.', 'Sifflement inspiratoire.', 'Vomissements après les quintes.', 'Fatigue.', 'Crises nocturnes.']} />,
              },
              {
                title: 'TRAITEMENT',
                content: <RegList items={['Repos.', 'Chambre bien ventilée.', 'Humidification de l\'air.', 'Alimentation adaptée.', 'Surveillance nocturne.']} />,
              },
              {
                title: 'PLANTES',
                content: <RegList items={['Guimauve.', 'Mauve.', 'Réglisse.', 'Coquelicot.', 'Lavande.', 'Romarin.']} />,
              },
            ])}
            <RegBlock col="rgba(180,60,60,0.50)">
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#DF9A88', letterSpacing: '0.14em', marginBottom: 8 }}>COMPLICATIONS</div>
              <RegList items={['Bronchite.', 'Pneumonie.', 'Convulsions.', 'Amaigrissement.']} />
            </RegBlock>
          </>)}

          {/* IV. Autres maladies */}
          {micBlock(<>
            {micTitle('CHAPITRE IV', 'Autres Maladies Infantiles Fréquentes')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {[
                {
                  label: 'Scarlatine', col: '#C07030',
                  signes: ['Forte fièvre.', 'Gorge rouge.', 'Éruption diffuse.', 'Langue rouge.'],
                  note: 'Isolement. Hygiène rigoureuse indispensable.',
                },
                {
                  label: 'Oreillons', col: '#8A6010',
                  signes: ['Gonflement des glandes salivaires.', 'Douleur à la mastication.', 'Fièvre modérée.'],
                  note: 'Repos et alimentation molle recommandés.',
                },
                {
                  label: 'Varicelle', col: '#206040',
                  signes: ['Éruption de petites vésicules.', 'Démangeaisons.', 'Fièvre légère.'],
                  note: 'Maintenir les lésions propres pour éviter les infections.',
                },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}40`, borderTop: `3px solid ${m.col}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 17, color: m.col, marginBottom: 10 }}>{m.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: MIC_LIGHT, letterSpacing: '0.12em', marginBottom: 6 }}>SIGNES</div>
                  <RegList items={m.signes} />
                  <RegBlock col={`${MIC}30`}><RegPara>{m.note}</RegPara></RegBlock>
                </div>
              ))}
            </div>
          </>)}

          {/* V. Prévention */}
          {micBlock(<>
            {micTitle('CHAPITRE V', 'Prévention')}
            <RegPara>Le médecin recommande :</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 12 }}>
              {['Isolement des enfants contagieux.', 'Lavage fréquent des mains.', 'Aération quotidienne des habitations.', 'Linge propre.', 'Désinfection des objets utilisés par le malade.', 'Alimentation suffisante.', 'Surveillance des épidémies.'].map(item => (
                <div key={item} style={{ background: `${MIC}08`, border: `1px solid ${MIC}25`, padding: '10px 12px', fontFamily: BODY, fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: MIC_LIGHT, fontSize: 10, flexShrink: 0 }}>◆</span>{item}
                </div>
              ))}
            </div>
          </>)}

          {/* VI. Traitements */}
          {micBlock(<>
            {micTitle('CHAPITRE VI', 'Traitements Autorisés')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(200px, 1fr))', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ background: `${MIC}08`, border: `1px solid ${MIC}30`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MIC_LIGHT, marginBottom: 8 }}>Préparations du dispensaire</div>
                  <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.']} />
                </div>
                <div style={{ background: T.card, border: 'rgba(209,183,124,0.35) solid 1px', padding: '14px 16px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, marginBottom: 8 }}>Désinfectants</div>
                  <RegList items={['Acide phénique.', 'Teinture d\'iode.']} />
                </div>
              </div>
              <div style={{ background: T.card, border: 'rgba(80,140,80,0.35) solid 1px', padding: '14px 16px' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Préparations végétales</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}>
                  {['Camomille.', 'Tilleul.', 'Mauve.', 'Guimauve.', 'Sauge.', 'Thym.', 'Menthe.', 'Lavande.', 'Romarin.', 'Violette.', 'Primevère.'].map(p => (
                    <div key={p} style={{ fontFamily: BODY, fontSize: 13, color: T.text, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#A8B991', fontSize: 9 }}>◆</span>{p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* VII. Devoir */}
          {micBlock(<>
            {micTitle('CHAPITRE VII', 'Devoir du Médecin')}
            <RegList items={['Reconnaître rapidement les maladies contagieuses.', 'Protéger les autres enfants.', 'Surveiller les complications.', 'Rassurer les familles.', 'Appliquer les règles d\'antisepsie.']} />
            <RegCitation text="La douceur, la patience et l'observation sont les premières qualités du médecin des enfants." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${MIC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MIC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Les maladies infantiles demeurent parmi les principales causes de mortalité en cette année 1890. Le médecin ne peut empêcher toutes les épidémies, mais il peut en limiter les conséquences grâce à une reconnaissance précoce, une hygiène rigoureuse, l'antisepsie moderne et des soins adaptés.</RegPara>
            <RegCitation text="Protéger l'enfant, c'est préserver l'avenir de la famille et de la communauté." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {micBlock(<>
            {micTitle('PRINCIPALES MALADIES INFANTILES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                { label: 'Rougeole', col: '#DF9A88', note: 'Virale, éruption rouge, très contagieuse.' },
                { label: 'Diphtérie', col: '#8A2020', note: 'Bactérienne, membrane gorge, urgence.' },
                { label: 'Coqueluche', col: '#5A3080', note: 'Toux en quintes, crises nocturnes.' },
                { label: 'Scarlatine', col: '#C07030', note: 'Fièvre, gorge rouge, éruption.' },
                { label: 'Oreillons', col: '#8A6010', note: 'Gonflement glandes salivaires.' },
                { label: 'Varicelle', col: '#206040', note: 'Vésicules, démangeaisons, bénigne.' },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}35`, borderLeft: `3px solid ${m.col}`, padding: '10px 12px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, color: m.col, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 11, color: T.muted }}>{m.note}</div>
                </div>
              ))}
            </div>
          </>)}

          {micBlock(<>
            {micTitle('ROUGEOLE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', marginBottom: 8 }}>Signes</div>
                <RegList items={['Fièvre élevée.', 'Fatigue.', 'Conjonctivite.', 'Toux sèche.', 'Éruption rouge au visage.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MIC_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Repos complet.', 'Chambre aérée.', 'Hydratation.', 'Alimentation légère.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Tilleul.', 'Mauve.', 'Guimauve.', 'Camomille.', 'Violette.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Complications : Bronchite, Pneumonie, Otite, Déshydratation.</RegPara>
            </RegBlock>
          </>)}

          {micBlock(<>
            {micTitle('DIPHTÉRIE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#8A2020', marginBottom: 8 }}>Signes</div>
                <RegList items={['Gorge douloureuse.', 'Voix rauque.', 'Membrane blanchâtre.', 'Respiration difficile.', 'Fièvre.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MIC_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Isolement immédiat.', 'Désinfection gorge.', 'Eau Vulnéraire.', 'Surveillance respiratoire.', 'Alimentation liquide.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Sauge.', 'Thym.', 'Menthe.', 'Primevère.', 'Guimauve.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Complications : Asphyxie, Pneumonie, Paralysie, Épuisement.</RegPara>
            </RegBlock>
          </>)}

          {micBlock(<>
            {micTitle('COQUELUCHE')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#5A3080', marginBottom: 8 }}>Signes</div>
                <RegList items={['Toux en quintes.', 'Sifflement inspiratoire.', 'Vomissements.', 'Crises nocturnes.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: MIC_LIGHT, marginBottom: 8 }}>Traitement</div>
                <RegList items={['Repos.', 'Air bien ventilé et humidifié.', 'Surveillance nocturne.']} />
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#A8B991', marginBottom: 8 }}>Plantes</div>
                <RegList items={['Guimauve.', 'Mauve.', 'Réglisse.', 'Coquelicot.', 'Lavande.']} />
              </div>
            </div>
            <RegBlock col="rgba(180,60,60,0.50)">
              <RegPara>Complications : Bronchite, Pneumonie, Convulsions, Amaigrissement.</RegPara>
            </RegBlock>
          </>)}

          {micBlock(<>
            {micTitle('AUTRES MALADIES FRÉQUENTES')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Scarlatine', col: '#C07030', items: ['Fièvre.', 'Gorge rouge.', 'Éruption cutanée.'] },
                { label: 'Oreillons', col: '#8A6010', items: ['Gonflement glandes salivaires.', 'Douleur.', 'Fièvre modérée.'] },
                { label: 'Varicelle', col: '#206040', items: ['Vésicules.', 'Démangeaisons.', 'Fièvre légère.'] },
              ].map(m => (
                <div key={m.label} style={{ background: T.card, border: `1px solid ${m.col}35`, borderTop: `2px solid ${m.col}`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: m.col, marginBottom: 8 }}>{m.label}</div>
                  <RegList items={m.items} />
                </div>
              ))}
            </div>
          </>)}

          {micBlock(<>
            {micTitle('PRÉVENTION')}
            <RegList items={['Isoler les enfants contagieux.', 'Se laver les mains.', 'Aérer les habitations.', 'Désinfecter le linge et les objets.', 'Maintenir une alimentation adaptée.', 'Surveiller les épidémies.']} />
          </>)}

          {micBlock(<>
            {micTitle('TRAITEMENTS AUTORISÉS')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-sit, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Dispensaire', col: MIC_LIGHT, items: ['Eau Vulnéraire.', 'Onguent Vulnéraire.'] },
                { label: 'Désinfectants', col: T.gold, items: ['Acide phénique.', 'Teinture d\'iode.'] },
                { label: 'Végétaux', col: '#A8B991', items: ['Camomille.', 'Tilleul.', 'Mauve.', 'Guimauve.', 'Sauge.', 'Thym.', 'Menthe.', 'Lavande.', 'Romarin.', 'Violette.', 'Primevère.'] },
              ].map(g => (
                <div key={g.label} style={{ background: `${MIC}08`, border: `1px solid ${MIC}25`, padding: '12px 14px' }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: g.col, marginBottom: 6 }}>{g.label}</div>
                  <RegList items={g.items} />
                </div>
              ))}
            </div>
          </>)}

          <RegBlock col={`${MIC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MIC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Les maladies infantiles sont très contagieuses et nécessitent un diagnostic précoce.', 'L\'isolement des malades limite la propagation des épidémies.', 'Une bonne hygiène, l\'antisepsie et une alimentation adaptée favorisent la guérison.', 'Les préparations végétales soulagent les symptômes mais ne remplacent pas les soins médicaux.', 'Le médecin doit surveiller attentivement les complications respiratoires, neurologiques et infectieuses jusqu\'au rétablissement complet de l\'enfant.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

const TBC = '#6A1818';
const TBC_LIGHT = '#DF9A88';

function TuberculoseDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const tbcBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${TBC}40`, borderTop: `3px solid ${TBC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const tbcTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const tbcSection = (label: string, content: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${TBC}30`, borderLeft: `4px solid ${TBC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TBC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${TBC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${TBC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${TBC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${TBC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${TBC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: TBC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS DE PATHOLOGIE MÉDICALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: TBC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🫁 La Tuberculose</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>Diagnostic, Traitement et Prévention · À l&apos;usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${TBC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? TBC_LIGHT : T.border}`, background: version === v ? `${TBC}30` : 'transparent', color: version === v ? TBC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>La tuberculose, autrefois appelée <strong>phtisie pulmonaire</strong>, demeure l&apos;une des maladies les plus meurtrières de notre époque.</RegPara>
            <RegPara>Les travaux du docteur <strong>Robert Koch</strong>, publiés en 1882, ont démontré que cette affection est provoquée par un bacille microscopique transmissible d&apos;un individu à l&apos;autre.</RegPara>
            <RegPara>Le médecin de 1890 ne peut encore guérir cette maladie, mais il possède désormais les connaissances nécessaires pour ralentir son évolution, soulager les malades et limiter sa propagation.</RegPara>
            <RegCitation text="L'isolement, l'hygiène et une alimentation fortifiante demeurent les principales armes contre ce fléau." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Nature */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE I', 'Nature de la Maladie')}
            <RegPara>La tuberculose atteint principalement les poumons. Elle peut également toucher :</RegPara>
            <RegList items={['les os ;', 'les ganglions ;', 'les reins ;', 'les intestins ;', 'les méninges ;', 'la peau.']} />
            <div style={{ height: 12 }} />
            <RegPara>Le bacille tuberculeux se transmet principalement par les gouttelettes projetées lors de la toux, des crachats ou de la parole.</RegPara>
            <RegPara>Les logements mal aérés, la promiscuité, la malnutrition et la fatigue favorisent son développement.</RegPara>
          </>)}

          {/* II. Signes */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE II', 'Signes Cliniques')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {tbcSection('SIGNES HABITUELS', <RegList items={['Toux persistante.', 'Crachats répétés.', 'Présence éventuelle de sang.', 'Amaigrissement progressif.', 'Fatigue importante.', 'Fièvre légère mais prolongée.', 'Sueurs nocturnes abondantes.', 'Douleurs thoraciques.', 'Essoufflement.']} />)}
              {tbcSection('FORMES AVANCÉES', <RegList items={['Grande faiblesse.', 'Respiration difficile.', 'Expectoration abondante.', 'Cachexie.']} />)}
            </div>
          </>)}

          {/* III. Examen */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE III', 'Examen Médical')}
            <RegPara>Le praticien procède à :</RegPara>
            <RegList items={["l'interrogatoire du malade ;", "l'auscultation des poumons ;", 'la percussion thoracique ;', "l'observation des crachats ;", 'la surveillance du poids ;', 'le contrôle quotidien de la température.']} />
            <RegBlock col={`${TBC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Une toux persistante de plusieurs semaines doit toujours faire suspecter une tuberculose.</p>
            </RegBlock>
          </>)}

          {/* IV. Conduite */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE IV', 'Conduite à Tenir')}
            <RegPara>Le malade est placé dans une chambre :</RegPara>
            <RegList items={['propre ;', 'sèche ;', 'bien ventilée ;', 'largement exposée au soleil.']} />
            <div style={{ height: 12 }} />
            <RegPara>Le repos est indispensable. Le malade doit éviter les efforts physiques importants.</RegPara>
            <RegList items={["Les crachats sont recueillis dans un récipient contenant un désinfectant puis détruits.", "Le linge est bouilli avant d'être réutilisé.", "Les ustensiles restent exclusivement réservés au malade."]} />
          </>)}

          {/* V. Traitement */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE V', 'Traitement')}
            <RegBlock col={`rgba(180,160,113,0.40)`}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.14em', marginBottom: 8 }}>AVERTISSEMENT</div>
              <RegPara>Aucun remède connu ne permet encore d&apos;éliminer définitivement le bacille tuberculeux. Le traitement consiste à soutenir les forces naturelles de l&apos;organisme.</RegPara>
            </RegBlock>
            <RegPara>Le médecin recommande :</RegPara>
            <RegList items={['repos prolongé ;', 'air pur ;', 'exposition modérée au soleil ;', 'alimentation riche ;', 'hydratation régulière.']} />
            <div style={{ height: 16 }} />
            {tbcSection('MÉDICAMENTS', <RegList items={["Élixir Parégorique contre la toux douloureuse.", "Laudanum uniquement en cas de douleurs importantes.", "Eau Vulnéraire pour les soins locaux lorsque nécessaire."]} />)}
            <div style={{ height: 8 }} />
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.18em', marginBottom: 12 }}>PRÉPARATIONS VÉGÉTALES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {tbcSection('INFUSION DU SOUFFLE', <>
                <RegList items={['Thym.', 'Guimauve.', 'Plantain.', 'Réglisse.']} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Apaise la toux et facilite l&apos;expectoration.</p>
              </>)}
              {tbcSection('INFUSION FORTIFIANTE', <>
                <RegList items={['Ortie.', 'Romarin.', 'Échinacée.']} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Soutient les forces du malade.</p>
              </>)}
              {tbcSection('SIROP PECTORAL', <>
                <RegList items={['Miel.', 'Guimauve.', 'Sauge.', 'Thym.']} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Calme l&apos;irritation des voies respiratoires.</p>
              </>)}
              {tbcSection('FUMIGATIONS', <>
                <RegList items={['Thym.', 'Eucalyptus.', 'Lavande.']} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Améliorent le confort respiratoire.</p>
              </>)}
            </div>
          </>)}

          {/* VI. Prévention */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE VI', 'Prévention')}
            <RegPara>Le médecin enseigne à la population :</RegPara>
            <RegList items={['ouvrir quotidiennement les fenêtres ;', 'éviter les logements humides ;', 'ne jamais cracher au sol ;', 'faire bouillir le linge souillé ;', 'désinfecter les crachats ;', 'éviter les contacts prolongés avec les personnes contagieuses ;', 'maintenir une alimentation suffisante.']} />
          </>)}

          {/* VII. Complications */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE VII', 'Complications')}
            <RegPara>Le praticien surveille attentivement l&apos;apparition des complications suivantes :</RegPara>
            <RegList items={['hémoptysie (crachats de sang) ;', 'pneumonie ;', 'insuffisance respiratoire ;', 'amaigrissement extrême ;', "extension de la maladie vers les os, les reins, les intestins ou les méninges."]} />
            <RegBlock col={`${TBC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Toute aggravation nécessite une surveillance médicale renforcée.</p>
            </RegBlock>
          </>)}

          {/* VIII. Aggravation */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE VIII', "Conduite à Tenir en cas d'Aggravation")}
            <RegPara>Malgré des soins attentifs, la tuberculose peut poursuivre son évolution et atteindre un stade où la guérison n&apos;est plus possible. Le rôle du médecin devient alors de ralentir les complications, de soulager les souffrances et de préserver la dignité du malade.</RegPara>
            <div style={{ height: 12 }} />
            {tbcSection("SIGNES D'AGGRAVATION", <RegList items={['Toux incessante ou très douloureuse.', 'Crachats abondants ou contenant du sang (hémoptysie).', 'Fièvre élevée et persistante.', 'Essoufflement même au repos.', 'Amaigrissement rapide.', "Perte complète de l'appétit.", 'Grande faiblesse empêchant la marche.', 'Confusion ou altération de la conscience.']} />)}
            <div style={{ height: 10 }} />
            {tbcSection('CONDUITE MÉDICALE', <>
              <RegList items={['Maintenir le repos absolu.', "Installer le malade en position demi-assise afin de faciliter la respiration.", "Poursuivre l'aération quotidienne de la chambre sans exposer le malade au froid.", 'Maintenir une hygiène irréprochable du linge, des ustensiles et de la chambre.', 'Proposer une alimentation légère mais riche en bouillons, lait, œufs et miel.', "Administrer les traitements destinés à calmer la toux, la douleur et l'agitation.", 'Contrôler chaque jour la température, le pouls, la respiration et l\'état général.']} />
              <RegBlock col={`${TBC}50`}>
                <p style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>En cas d&apos;hémoptysie importante, le malade doit rester parfaitement immobile, éviter tout effort ou toute parole inutile et être surveillé sans interruption.</p>
              </RegBlock>
            </>)}
            <div style={{ height: 10 }} />
            {tbcSection('SOINS DE CONFORT', <>
              <RegPara>Lorsque la guérison n&apos;est plus envisageable, le devoir du médecin est d&apos;apporter au malade le plus grand soulagement possible.</RegPara>
              <RegList items={['Diminuer les douleurs.', 'Calmer les quintes de toux.', 'Maintenir une respiration aussi confortable que possible.', 'Assurer une hydratation régulière.', 'Préserver une chambre propre, calme, sèche et bien ventilée.', 'Soutenir moralement le malade et sa famille.']} />
              <RegCitation text="Même lorsqu'il ne peut plus guérir, le médecin ne cesse jamais de soigner." author="Doctrine du Dispensaire, 1890" />
            </>)}
            <div style={{ height: 10 }} />
            {tbcSection("PROTECTION DE L'ENTOURAGE", <RegList items={["Les crachats doivent toujours être recueillis dans un récipient contenant un désinfectant avant d'être détruits.", 'Le linge doit être bouilli avant son lavage.', "Les ustensiles du malade ne doivent jamais être partagés.", "Les enfants, les personnes âgées et les personnes affaiblies doivent éviter les contacts prolongés avec le malade.", 'La chambre doit être largement aérée plusieurs fois par jour.']} />)}
          </>)}

          {/* IX. Devoir */}
          {tbcBlock(<>
            {tbcTitle('CHAPITRE IX', 'Devoir du Médecin')}
            <RegPara>Le praticien doit :</RegPara>
            <RegList items={['reconnaître rapidement les premiers signes ;', 'isoler les malades contagieux ;', 'protéger les familles ;', 'maintenir une hygiène irréprochable ;', 'soutenir le malade tout au long de son traitement.']} />
            <RegCitation text="Le médecin ne soigne pas seulement la maladie : il protège également la communauté contre sa propagation." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>La tuberculose demeure l&apos;un des plus grands défis médicaux de notre temps. Si la science ne permet pas encore d&apos;en obtenir la guérison complète, les découvertes de Robert Koch ont profondément transformé la compréhension de cette maladie.</RegPara>
            <RegPara>Par l&apos;observation clinique, l&apos;isolement des malades, l&apos;antisepsie, une alimentation fortifiante et les soins du dispensaire, le médecin peut ralentir son évolution, limiter les contaminations et améliorer les conditions de vie des patients.</RegPara>
            <RegCitation text="Lorsqu'il ne peut plus vaincre la maladie, son devoir reste inchangé : soulager la souffrance, préserver la dignité du malade et protéger ceux qui l'entourent." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Nature */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>NATURE DE LA MALADIE</div>
            <RegPara>La tuberculose (ou phtisie pulmonaire) est une maladie infectieuse provoquée par le bacille découvert par <strong>Robert Koch</strong> en 1882.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
              {tbcSection('ORGANES TOUCHÉS', <RegList items={['Poumons (principal).', 'Os.', 'Ganglions.', 'Reins.', 'Intestins.', 'Méninges.', 'Peau.']} />)}
              {tbcSection('TRANSMISSION', <RegList items={['Toux.', 'Crachats.', 'Gouttelettes respiratoires.']} />)}
              {tbcSection('FACTEURS DE RISQUE', <RegList items={['Logements humides, mal ventilés.', 'Promiscuité.', 'Malnutrition.']} />)}
            </div>
          </RegBlock>

          {/* Signes */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>SIGNES CLINIQUES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {tbcSection('SIGNES HABITUELS', <RegList items={['Toux persistante.', 'Crachats fréquents.', 'Présence de sang.', 'Amaigrissement.', 'Fatigue.', 'Fièvre légère prolongée.', 'Sueurs nocturnes.', 'Douleurs thoraciques.', 'Essoufflement.']} />)}
              {tbcSection('FORMES AVANCÉES', <RegList items={['Grande faiblesse.', 'Difficultés respiratoires.', 'Expectoration abondante.', 'Cachexie.']} />)}
            </div>
            <RegBlock col={`${TBC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Une toux persistante de plusieurs semaines doit toujours faire suspecter une tuberculose.</p>
            </RegBlock>
          </RegBlock>

          {/* Examen */}
          {tbcBlock(<>
            {tbcTitle('EXAMEN MÉDICAL')}
            <RegList items={["Interrogatoire du malade.", "Auscultation des poumons.", "Percussion thoracique.", "Observation des crachats.", "Surveillance du poids.", "Contrôle quotidien de la température."]} />
          </>)}

          {/* Conduite & Traitement */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONDUITE À TENIR ET TRAITEMENT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {tbcSection('CHAMBRE DU MALADE', <RegList items={['Propre.', 'Sèche.', 'Bien ventilée.', 'Exposée à la lumière.']} />)}
              {tbcSection("MESURES D'HYGIÈNE", <RegList items={['Repos prolongé.', 'Limitation des efforts.', 'Désinfection des crachats.', 'Linge bouilli.', 'Ustensiles réservés au malade.']} />)}
              {tbcSection('TRAITEMENT GÉNÉRAL', <RegList items={['Repos.', 'Air pur.', 'Soleil modéré.', 'Alimentation riche.', 'Hydratation régulière.']} />)}
            </div>
            <div style={{ height: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {tbcSection('MÉDICAMENTS', <RegList items={['Élixir Parégorique : toux.', 'Laudanum : douleurs.', 'Eau Vulnéraire : soins locaux.']} />)}
              {tbcSection('INFUSION DU SOUFFLE', <RegList items={['Thym.', 'Guimauve.', 'Plantain.', 'Réglisse.']} />)}
              {tbcSection('INFUSION FORTIFIANTE', <RegList items={['Ortie.', 'Romarin.', 'Échinacée.']} />)}
              {tbcSection('SIROP PECTORAL', <RegList items={['Miel.', 'Guimauve.', 'Sauge.', 'Thym.']} />)}
              {tbcSection('FUMIGATIONS', <RegList items={['Thym.', 'Lavande.', 'Eucalyptus.']} />)}
            </div>
          </RegBlock>

          {/* Prévention & Complications */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉVENTION ET COMPLICATIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {tbcSection('PRÉVENTION', <RegList items={['Aérer quotidiennement.', 'Éviter les logements humides.', 'Ne jamais cracher au sol.', 'Faire bouillir le linge souillé.', 'Désinfecter les crachats.', 'Éviter les contacts prolongés.', 'Alimentation suffisante.']} />)}
              {tbcSection('COMPLICATIONS À SURVEILLER', <RegList items={['Hémoptysie.', 'Pneumonie.', 'Insuffisance respiratoire.', 'Amaigrissement extrême.', 'Atteinte des autres organes.']} />)}
            </div>
          </RegBlock>

          {/* Aggravation */}
          <RegBlock col={`rgba(180,160,113,0.40)`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>AGGRAVATION DE LA MALADIE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {tbcSection("SIGNES D'ALERTE", <RegList items={['Toux incessante.', 'Crachats sanglants abondants.', 'Fièvre élevée persistante.', 'Essoufflement au repos.', 'Amaigrissement rapide.', "Perte d'appétit.", 'Faiblesse extrême.', 'Altération de la conscience.']} />)}
              {tbcSection('CONDUITE MÉDICALE', <>
                <RegList items={['Repos absolu.', 'Position demi-assise.', 'Aération quotidienne.', 'Hygiène rigoureuse.', 'Alimentation légère.', 'Traitements antitussifs et antidouleurs.', 'Surveillance quotidienne.']} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>En cas d&apos;hémoptysie importante : immobilité totale, surveillance constante.</p>
              </>)}
              {tbcSection('SOINS DE CONFORT', <RegList items={['Soulager les douleurs.', 'Calmer la toux.', 'Respiration confortable.', 'Hydratation.', 'Chambre calme et propre.', 'Soutien moral.']} />)}
              {tbcSection("PROTECTION DE L'ENTOURAGE", <RegList items={['Désinfecter les crachats.', 'Faire bouillir le linge.', 'Ne pas partager les ustensiles.', 'Éviter les contacts avec les personnes fragiles.', 'Aérer la chambre plusieurs fois par jour.']} />)}
            </div>
          </RegBlock>

          {/* À retenir */}
          <RegBlock col={`${TBC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TBC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['La tuberculose est une maladie contagieuse transmise principalement par la toux et les crachats.', "Le diagnostic repose sur l'observation clinique et l'auscultation.", "Aucun traitement curatif n'existe en 1890.", "L'isolement, l'hygiène et une alimentation fortifiante constituent les principales armes contre la maladie.", 'Les préparations du dispensaire soulagent les symptômes mais ne remplacent pas le repos et les mesures sanitaires.', 'En phase terminale, le devoir du médecin est de soulager le malade tout en protégeant son entourage contre la contagion.']} />
          </RegBlock>
        </div>
      )}
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
      <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const pecSection = (label: string, content: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${PEC}30`, borderLeft: `4px solid ${PEC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: PEC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );
  const pecTriage = (col: string, label: string, items: string[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderTop: `3px solid ${col}`, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: col, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
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
        <div style={{ fontFamily: MONO, fontSize: 12, color: PEC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ PROTOCOLE SANITAIRE — URGENCE MAXIMALE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: PEC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>⚠️ Gestion d&apos;une Épidémie</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>À l&apos;usage du personnel médical du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${PEC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? PEC_LIGHT : T.border}`, background: version === v ? `${PEC}40` : 'transparent', color: version === v ? PEC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Une épidémie est déclarée lorsqu&apos;une maladie contagieuse dépasse le stade du simple Risque Sanitaire et menace directement une partie importante de la population.</RegPara>
            <RegPara>La mission de l&apos;ORDRES DES MÉDECINS n&apos;est plus uniquement de soigner les malades, mais également de limiter la propagation de la maladie, protéger les populations saines et maintenir l&apos;organisation des soins.</RegPara>
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Chaque membre de l&apos;ORDRES DES MÉDECINS est tenu d&apos;appliquer strictement le présent protocole jusqu&apos;à la levée officielle de l&apos;Épidémie.</p>
            </RegBlock>
          </RegBlock>

          {/* I. Déclaration */}
          {pecBlock(<>
            {pecTitle('ARTICLE I', "Déclaration de l'Épidémie")}
            <RegPara>L&apos;Épidémie est déclarée uniquement par le Directeur Médical ou son représentant. Elle peut être prononcée lorsque plusieurs des critères suivants sont réunis :</RegPara>
            <RegList items={['multiplication rapide des cas ;', 'propagation dans plusieurs villes ;', 'apparition de nombreux décès ;', 'maladie hautement contagieuse confirmée ;', "incapacité des dispensaires à absorber normalement les nouveaux malades ;", 'risque majeur pour la population.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>La déclaration d&apos;Épidémie entraîne immédiatement l&apos;application des mesures exceptionnelles.</p>
            </RegBlock>
          </>)}

          {/* II. Mise en alerte */}
          {pecBlock(<>
            {pecTitle('ARTICLE II', 'Mise en Alerte des Dispensaires')}
            <RegPara>Dès la déclaration, tous les dispensaires passent en <strong>fonctionnement d&apos;urgence</strong>.</RegPara>
            <RegPara>Le Directeur Médical peut :</RegPara>
            <RegList items={["rappeler l'ensemble du personnel disponible ;", 'suspendre les consultations non urgentes ;', 'ouvrir des salles supplémentaires ;', 'répartir les médecins selon les besoins ;', 'organiser des permanences prolongées.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les urgences vitales demeurent prioritaires.</p>
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
              {pecSection('EAU VULNÉRAIRE', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Nettoyage des blessures et des surfaces.</p>)}
              {pecSection('ACIDE PHÉNIQUE', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Instruments, pansements, certaines plaies.</p>)}
              {pecSection("TEINTURE D'IODE", <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Désinfection de la peau et des petites plaies.</p>)}
              {pecSection('SOLUTIONS VINAIGRÉES', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Assainissement antiseptique des locaux.</p>)}
            </div>
          </>)}

          {/* VI. Population */}
          {pecBlock(<>
            {pecTitle('ARTICLE VI', 'Information de la Population')}
            <RegPara>Le Directeur Médical informe régulièrement les autorités civiles. La population est invitée à :</RegPara>
            <RegList items={['éviter les rassemblements ;', 'limiter les déplacements inutiles ;', "faire bouillir l'eau ;", 'signaler rapidement tout malade ;', 'respecter les consignes médicales.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les habitants présentant des symptômes doivent consulter immédiatement un dispensaire.</p>
            </RegBlock>
          </>)}

          {/* VII. Surveillance épidémiologique */}
          {pecBlock(<>
            {pecTitle('ARTICLE VII', 'Surveillance Épidémiologique')}
            <RegPara>Chaque dispensaire transmet quotidiennement :</RegPara>
            <RegList items={['nombre de nouveaux cas ;', 'nombre de patients hospitalisés ;', 'nombre de guérisons ;', 'nombre de décès ;', "évolution des symptômes observés."]} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Ces informations permettent de suivre la progression de l&apos;Épidémie.</p>
            </RegBlock>
          </>)}

          {/* VIII. Décès */}
          {pecBlock(<>
            {pecTitle('ARTICLE VIII', 'Gestion des Décès')}
            <RegPara>Lorsqu&apos;un malade succombe :</RegPara>
            <RegList items={['le corps est manipulé avec précaution ;', 'le linge est détruit ou désinfecté ;', 'la chambre est entièrement nettoyée ;', 'les personnes ayant été en contact sont surveillées.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Le respect de ces mesures limite les nouvelles contaminations.</p>
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
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Une épidémie constitue l&apos;une des plus grandes épreuves que puisse connaître une communauté. La discipline, l&apos;organisation, l&apos;antisepsie, l&apos;isolement des malades et la coopération entre les dispensaires permettent souvent de sauver davantage de vies que les traitements eux-mêmes.</RegPara>
            <RegCitation text="La vigilance, la science et l'humanité demeurent les premières armes contre la contagion." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Déclaration */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>DÉCLARATION DE L&apos;ÉPIDÉMIE</div>
            <RegPara>Une <strong>Épidémie</strong> est déclarée par le <strong>Directeur Médical</strong> lorsque :</RegPara>
            <RegList items={['les cas augmentent rapidement ;', 'plusieurs villes sont touchées ;', 'la maladie est fortement contagieuse ;', 'les décès se multiplient ;', 'les dispensaires sont fortement sollicités.']} />
            <RegBlock col={`${PEC}60`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Des mesures exceptionnelles sont immédiatement appliquées.</p>
            </RegBlock>
          </RegBlock>

          {/* Organisation & Triage */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ORGANISATION ET TRIAGE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pecSection('FONCTIONNEMENT D\'URGENCE', <>
                <RegList items={["Rappel de tout le personnel disponible.", "Suspension des consultations non urgentes.", "Ouverture de salles supplémentaires.", "Répartition des médecins selon les besoins.", "Permanences prolongées."]} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Les urgences vitales restent prioritaires.</p>
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
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ISOLEMENT ET HYGIÈNE RENFORCÉE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pecSection('ISOLEMENT DES CONTAGIEUX', <RegList items={['Salle dédiée.', 'Lit individuel.', 'Linge réservé.', 'Ustensiles personnels.', 'Visites limitées.']} />)}
              {pecSection('HYGIÈNE OBLIGATOIRE', <RegList items={['Lavage des mains avant et après chaque soin.', 'Désinfection après chaque patient.', 'Stérilisation des instruments.', 'Ébullition du linge contaminé.', 'Nettoyage quotidien des locaux.', 'Aération régulière.']} />)}
              {pecSection('PRODUITS UTILISÉS', <RegList items={['Eau Vulnéraire.', 'Acide phénique.', "Teinture d'iode.", 'Solutions vinaigrées antiseptiques.']} />)}
            </div>
          </RegBlock>

          {/* Population & Surveillance */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>PROTECTION ET SURVEILLANCE</div>
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
            <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les dispensaires reprennent progressivement leur fonctionnement habituel.</p>
          </>)}

          {/* À retenir */}
          <RegBlock col={`${PEC}60`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PEC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
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
      <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const pscSection = (label: string, content: React.ReactNode, accent?: string) => (
    <div style={{ background: T.card, border: `1px solid ${accent ?? PSC}30`, borderLeft: `4px solid ${accent ?? PSC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: accent ?? PSC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );
  const pscAlert = (col: string, label: string, items: string[]) => (
    <div style={{ background: T.card, border: `1px solid ${col}40`, borderTop: `3px solid ${col}`, padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: col, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
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
        <div style={{ fontFamily: MONO, fontSize: 12, color: PSC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ PROTOCOLE SANITAIRE OFFICIEL ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: PSC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🛡️ Gestion d&apos;un Risque Sanitaire</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>À l&apos;usage du personnel médical du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${PSC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? PSC_LIGHT : T.border}`, background: version === v ? `${PSC}30` : 'transparent', color: version === v ? PSC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Toute maladie inhabituelle ou augmentation soudaine de cas similaires doit être considérée avec la plus grande prudence. Avant qu&apos;une véritable épidémie ne s&apos;installe, il existe une période durant laquelle une intervention rapide peut encore empêcher la propagation de la maladie.</RegPara>
            <RegPara>Le présent protocole établit les mesures que doivent appliquer les membres de l&apos;ORDRES DES MÉDECINS lorsqu&apos;un <strong>Risque Sanitaire</strong> est déclaré. Son objectif est de protéger la population, préserver le personnel soignant et contenir la maladie avant qu&apos;elle ne devienne une menace pour l&apos;ensemble des comtés.</RegPara>
          </RegBlock>

          {/* I. Déclenchement */}
          {pscBlock(<>
            {pscTitle('ARTICLE I', 'Déclenchement du Risque Sanitaire')}
            <RegPara>Un Risque Sanitaire peut être déclaré par le Directeur Médical ou son représentant lorsqu&apos;au moins l&apos;une des situations suivantes est constatée :</RegPara>
            <RegList items={['apparition de plusieurs patients présentant les mêmes symptômes dans une courte période ;', "découverte d'une maladie inhabituelle ou inconnue ;", "suspicion de contamination d'un puits, d'une rivière ou d'une réserve d'eau ;", 'augmentation anormale des cas de fièvre, diarrhée, toux ou infections respiratoires ;', "présence d'une maladie transmissible chez les animaux pouvant atteindre l'homme ;", "suspicion d'intoxication alimentaire touchant plusieurs personnes."]} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>La déclaration d&apos;un Risque Sanitaire ne signifie pas qu&apos;une épidémie est installée, mais qu&apos;une surveillance renforcée devient nécessaire.</p>
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
              <p style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Tout aggravement doit être signalé immédiatement.</p>
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
              {pscSection('EAU VULNÉRAIRE', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Nettoyage des blessures et des surfaces.</p>)}
              {pscSection('ACIDE PHÉNIQUE', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Instruments, pansements, certaines plaies.</p>)}
              {pscSection("TEINTURE D'IODE", <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Désinfection de la peau et des petites plaies.</p>)}
              {pscSection('SOLUTIONS VINAIGRÉES', <p style={{ fontFamily: BODY, fontSize: 12, color: T.text, margin: 0 }}>Assainissement antiseptique des locaux.</p>)}
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
              <p style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Les soins urgents demeurent prioritaires.</p>
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
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>Le Risque Sanitaire constitue la première ligne de défense de la santé publique. Une réaction rapide, une surveillance attentive, une hygiène irréprochable et une bonne coordination entre les dispensaires permettent bien souvent d&apos;interrompre la propagation d&apos;une maladie avant qu&apos;elle ne menace l&apos;ensemble de la population.</RegPara>
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Déclenchement */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>DÉCLENCHEMENT</div>
            <RegPara>Un <strong>Risque Sanitaire</strong> peut être déclaré lorsqu&apos;apparaissent :</RegPara>
            <RegList items={['plusieurs malades présentant les mêmes symptômes ;', "une maladie inhabituelle ou inconnue ;", "une suspicion de contamination de l'eau ou des aliments ;", 'une hausse importante des cas de fièvre, diarrhée ou toux ;', "une maladie animale transmissible à l'Homme ;", 'une intoxication alimentaire touchant plusieurs personnes.']} />
            <RegBlock col={`${PSC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Le Risque Sanitaire n&apos;est pas encore une épidémie, mais une période de surveillance renforcée.</p>
            </RegBlock>
          </RegBlock>

          {/* Mesures & Surveillance */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>MESURES IMMÉDIATES ET SURVEILLANCE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('LES DISPENSAIRES DOIVENT', <RegList items={["Ouvrir un registre sanitaire.", "Recenser chaque nouveau cas.", "Examiner systématiquement les malades suspects.", "Renforcer la désinfection des locaux.", "Stériliser les instruments après chaque utilisation.", "Renouveler plus fréquemment le linge médical."]} />)}
              {pscSection('SUIVI DE CHAQUE MALADE', <>
                <RegList items={['Température.', 'Pouls.', 'Respiration.', 'Évolution des symptômes.', "Recherche de nouveaux cas dans son entourage."]} />
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Tout aggravement est signalé immédiatement.</p>
              </>)}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>La Direction Médicale est informée quotidiennement.</p>
          </RegBlock>

          {/* Hygiène */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>HYGIÈNE OBLIGATOIRE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('MESURES DU PERSONNEL', <RegList items={['Lavage des mains avant et après chaque soin.', 'Linge propre pour chaque patient.', 'Désinfection des surfaces et instruments.', 'Ébullition ou destruction du linge contaminé.', 'Aération régulière des locaux.']} />)}
              {pscSection('PRÉPARATIONS UTILISÉES', <RegList items={['Eau Vulnéraire.', 'Acide phénique.', "Teinture d'iode.", 'Solutions vinaigrées antiseptiques.']} />)}
            </div>
          </RegBlock>

          {/* Population & Organisation */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>POPULATION ET ORGANISATION</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {pscSection('LES HABITANTS SONT INVITÉS À', <RegList items={["Faire bouillir l'eau.", 'Maintenir leurs habitations propres.', 'Éviter les contacts avec les personnes malades.', 'Signaler rapidement tout nouveau cas.', 'Ne pas partager les ustensiles.', 'Limiter les rassemblements si nécessaire.']} />)}
              {pscSection('LE DIRECTEUR MÉDICAL PEUT', <RegList items={["Augmenter les permanences.", "Répartir les médecins entre les dispensaires.", "Reporter les consultations non urgentes.", "Ouvrir une salle réservée aux cas suspects."]} />)}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les urgences restent toujours prioritaires.</p>
          </RegBlock>

          {/* Évolution */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ÉVOLUTION DU RISQUE</div>
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
            <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Les registres sont ensuite archivés.</p>
          </>)}

          {/* À retenir */}
          <RegBlock col={`${PSC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: PSC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={["Le Risque Sanitaire est une phase de vigilance, pas encore une épidémie.", 'Tous les cas suspects doivent être signalés et surveillés.', "L'hygiène, la désinfection et l'aération sont les premières protections.", 'Les dispensaires restent ouverts mais renforcent leur organisation.', "Si la maladie continue de se propager, le Risque Sanitaire Critique peut être déclaré avant le passage au Protocole Épidémique."]} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

const TGC = '#1A3A5A';
const TGC_LIGHT = '#5090C0';

function TheorieGermesDocument() {
  const [version, setVersion] = useState<'complete' | 'resume'>('complete');

  const tgcBlock = (children: React.ReactNode) => (
    <div style={{ marginBottom: 28, background: T.paper, border: `1px solid ${TGC}40`, borderTop: `3px solid ${TGC}`, padding: '26px 30px' }}>
      {children}
    </div>
  );
  const tgcTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 4 }}>✦ {label} ✦</div>
      {sub && <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.sepia, letterSpacing: '0.05em' }}>{sub}</div>}
    </div>
  );
  const tgcSection = (label: string, content: React.ReactNode) => (
    <div style={{ background: T.card, border: `1px solid ${TGC}30`, borderLeft: `4px solid ${TGC_LIGHT}`, padding: '16px 20px', marginBottom: 14 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: TGC_LIGHT, letterSpacing: '0.18em', marginBottom: 10 }}>{label}</div>
      {content}
    </div>
  );
  const tgcSavant = (name: string, items: string[]) => (
    <div style={{ background: T.card, border: `1px solid ${TGC}30`, borderTop: `3px solid ${TGC_LIGHT}`, padding: '18px 22px', marginBottom: 14 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 19, color: TGC_LIGHT, marginBottom: 12 }}>{name}</div>
      <RegList items={items} />
    </div>
  );

  return (
    <div style={{ marginTop: 50 }}>
      {/* Bandeau */}
      <div style={{ textAlign: 'center', marginBottom: 30, padding: '36px 20px', background: T.card, border: `1px solid ${TGC}50`, position: 'relative', overflow: 'hidden' }}>
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
          <div key={pos} style={{ position: 'absolute', top: pos.includes('top') ? 12 : 'auto', bottom: pos.includes('bottom') ? 12 : 'auto', left: pos.includes('left') ? 12 : 'auto', right: pos.includes('right') ? 12 : 'auto', width: 28, height: 28, borderTop: pos.includes('top') ? `2px solid ${TGC}70` : 'none', borderBottom: pos.includes('bottom') ? `2px solid ${TGC}70` : 'none', borderLeft: pos.includes('left') ? `2px solid ${TGC}70` : 'none', borderRight: pos.includes('right') ? `2px solid ${TGC}70` : 'none' }} />
        ))}
        <div style={{ fontFamily: MONO, fontSize: 12, color: TGC_LIGHT, letterSpacing: '0.3em', marginBottom: 10 }}>✦ COURS D&apos;INSTRUCTION SCIENTIFIQUE ✦</div>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 32, color: TGC_LIGHT, margin: '0 0 8px', letterSpacing: '0.04em' }}>🔬 La Théorie des Germes</h2>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: T.muted, marginBottom: 6 }}>et ses Applications · À l&apos;usage des praticiens du Dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.12em', marginBottom: 14 }}>COMTÉ DE WEST ELIZABETH - DISPENSAIRE DE LITTLE CREEK - L'AN 1890</div>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${TGC_LIGHT}, transparent)`, margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {(['complete', 'resume'] as const).map(v => (
            <button key={v} onClick={() => setVersion(v)} style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', padding: '7px 18px', cursor: 'pointer', border: `1px solid ${version === v ? TGC_LIGHT : T.border}`, background: version === v ? `${TGC}30` : 'transparent', color: version === v ? TGC_LIGHT : T.muted }}>
              {v === 'complete' ? 'VERSION COMPLÈTE' : 'VERSION RÉSUMÉE'}
            </button>
          ))}
        </div>
      </div>

      {version === 'complete' && (
        <div>
          {/* Préambule */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>PRÉAMBULE</div>
            <RegPara>Pendant des siècles, les médecins attribuèrent les épidémies, les fièvres et les infections aux miasmes, aux déséquilibres des humeurs ou aux influences du climat. Si ces théories expliquaient imparfaitement certains phénomènes, elles ne permettaient ni de comprendre véritablement la contagion, ni de la prévenir efficacement.</RegPara>
            <RegPara>Les découvertes de <strong>Louis Pasteur</strong>, de <strong>Robert Koch</strong>, de <strong>Joseph Lister</strong> et de nombreux savants de cette fin de siècle ont profondément transformé la médecine. Il est désormais établi que de nombreuses maladies sont provoquées par des organismes microscopiques, appelés <strong>germes</strong>, capables de se multiplier et de se transmettre d&apos;un individu à un autre.</RegPara>
            <RegPara>Cette théorie fonde désormais l&apos;hygiène moderne, l&apos;antisepsie chirurgicale et les mesures de santé publique appliquées dans les dispensaires.</RegPara>
            <RegCitation text="La propreté constitue désormais l'un des premiers traitements du médecin." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>

          {/* I. Nature des germes */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE I', 'Nature des Germes')}
            <RegPara>Les germes sont des organismes invisibles à l&apos;œil nu. Ils comprennent notamment :</RegPara>
            <RegList items={['les bacilles ;', 'les microbes ;', 'certains champignons microscopiques.']} />
            <div style={{ height: 12 }} />
            <RegPara>On les retrouve dans : l&apos;air, l&apos;eau, le sol, les aliments, les vêtements, les instruments médicaux et le corps humain.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 14 }}>
              {tgcSection('ILS SE DÉVELOPPENT DANS', <RegList items={['la chaleur ;', "l'humidité ;", 'les matières organiques ;', 'les lieux mal entretenus.']} />)}
              {tgcSection('ILS SONT DÉTRUITS PAR', <RegList items={["la chaleur ;", "l'ébullition ;", 'certains antiseptiques ;', 'la lumière solaire ;', 'une hygiène rigoureuse.']} />)}
            </div>
          </>)}

          {/* II. Transmission */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE II', 'Modes de Transmission')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {tgcSection('PAR L\'AIR', <>
                <RegPara>Lorsqu&apos;un malade tousse, éternue ou parle, de fines gouttelettes contenant des germes sont dispersées dans l&apos;atmosphère.</RegPara>
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>Les maladies respiratoires comme la tuberculose utilisent principalement cette voie.</p>
              </>)}
              {tgcSection('PAR L\'EAU', <>
                <RegPara>Une eau contaminée peut transmettre : la fièvre typhoïde, le choléra, diverses infections intestinales.</RegPara>
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>Toute eau suspecte doit être bouillie avant consommation.</p>
              </>)}
              {tgcSection('PAR LES ALIMENTS', <>
                <RegPara>Les aliments mal conservés ou souillés favorisent le développement de nombreux microbes.</RegPara>
                <RegList items={['Cuisson suffisante.', 'Bonne conservation.', 'Préparation dans des conditions propres.']} />
              </>)}
              {tgcSection('PAR LE CONTACT', <>
                <RegPara>Les mains sales, les vêtements contaminés, les instruments non désinfectés ou les pansements souillés transmettent facilement les germes.</RegPara>
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>Le lavage des mains constitue l&apos;une des mesures les plus importantes de la médecine moderne.</p>
              </>)}
              {tgcSection('PAR LES PLAIES', <>
                <RegPara>Une blessure ouverte représente une porte d&apos;entrée privilégiée pour les microbes.</RegPara>
                <RegList items={['Nettoyée.', 'Désinfectée.', 'Protégée rapidement.']} />
              </>)}
            </div>
          </>)}

          {/* III. Découvertes */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE III', 'Les Découvertes Scientifiques')}
            {tgcSavant('Louis Pasteur', ["La génération spontanée n'existe pas.", 'Les microbes sont responsables de nombreuses fermentations.', 'La chaleur détruit les germes.', 'Certains vaccins permettent de prévenir certaines maladies.'])}
            {tgcSavant('Robert Koch', ['Il identifie plusieurs agents responsables de maladies graves.', 'Il découvre notamment le bacille de la tuberculose en 1882.', 'Ses travaux permettent de relier chaque maladie infectieuse à un germe précis.'])}
            {tgcSavant('Joseph Lister', ["Il applique les découvertes de Pasteur à la chirurgie.", "Une désinfection rigoureuse réduit les infections.", "Elle diminue la mortalité opératoire et améliore la cicatrisation.", "Ses méthodes deviennent la référence dans les établissements médicaux modernes."])}
          </>)}

          {/* IV. Applications */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE IV', 'Applications au Dispensaire')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {tgcSection('HYGIÈNE DES MAINS', <RegList items={['Lavage au savon.', 'Brossage des ongles.', 'Rinçage abondant.', "Désinfection à l'alcool ou à l'Acide phénique."]} />)}
              {tgcSection('INSTRUMENTS', <RegList items={['Lavés.', "Stérilisés à l'eau bouillante.", 'Désinfectés avant chaque intervention.', 'Conservés dans un endroit propre et sec.']} />)}
              {tgcSection('PRÉPARATION DU PATIENT', <RegList items={['Lavage de la peau.', 'Rasage si nécessaire.', "Désinfection à la Teinture d'iode ou à l'Acide phénique."]} />)}
              {tgcSection('LINGE', <RegList items={['Bouilli.', 'Désinfecté.', 'Remplacé régulièrement.', 'Très contaminé : peut être détruit.']} />)}
              {tgcSection('LOCAUX', <RegList items={['Aérer quotidiennement toutes les salles.', 'Nettoyer les sols.', 'Désinfecter régulièrement les chambres.', 'Maintenir un environnement sec et lumineux.']} />)}
            </div>
          </>)}

          {/* V. Maladies contagieuses */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE V', 'Lutte contre les Maladies Contagieuses')}
            <RegPara>Lorsqu&apos;une maladie infectieuse est suspectée, le médecin doit :</RegPara>
            <RegList items={['isoler immédiatement le malade ;', 'limiter les visites ;', 'désinfecter les objets utilisés ;', 'réserver les ustensiles au patient ;', 'faire bouillir le linge ;', 'recueillir et désinfecter les crachats ;', 'renforcer la surveillance des autres malades.']} />
            <RegBlock col={`${TGC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Le respect de ces mesures protège la population autant que le personnel soignant.</p>
            </RegBlock>
          </>)}

          {/* VI. Antiseptiques */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE VI', 'Les Antiseptiques du Dispensaire')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {tgcSection('ACIDE PHÉNIQUE', <RegList items={['Instruments.', 'Pansements.', 'Certaines plaies.']} />)}
              {tgcSection("TEINTURE D'IODE", <RegList items={['Préparer la peau.', 'Désinfecter les petites plaies.']} />)}
              {tgcSection('EAU VULNÉRAIRE', <>
                <RegList items={['Nettoyer les blessures.', 'Favoriser une cicatrisation propre.']} />
              </>)}
              {tgcSection('ONGUENT VULNÉRAIRE', <>
                <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>Appliqué après désinfection afin de protéger les tissus en cours de réparation.</p>
              </>)}
            </div>
          </>)}

          {/* VII. Plantes */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE VII', 'Les Plantes Antiseptiques')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              {tgcSection('THYM', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Antiseptique · purifiant.</p></>)}
              {tgcSection('LAVANDE', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Calme l&apos;inflammation · assainit les plaies.</p></>)}
              {tgcSection('ROMARIN', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Stimule la circulation · assainit les locaux.</p></>)}
              {tgcSection('SAUGE', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Désinfecte la bouche · facilite les gargarismes.</p></>)}
              {tgcSection('EUCALYPTUS', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Améliore le confort respiratoire · utilisé en fumigation.</p></>)}
              {tgcSection('AIL', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Antiseptique naturel.</p></>)}
              {tgcSection('ÉCHINACÉE', <><p style={{ fontFamily: BODY, fontSize: 12, color: T.text, marginBottom: 4, lineHeight: 1.5 }}>Soutient les défenses naturelles de l&apos;organisme.</p></>)}
            </div>
            <div style={{ height: 10 }} />
            <RegPara>Ces plantes sont utilisées sous forme d&apos;infusions, de décoctions, de fumigations, de cataplasmes ou de solutions vinaigrées.</RegPara>
          </>)}

          {/* VIII. Contamination */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE VIII', 'Conduite à Tenir en cas de Contamination')}
            <RegPara>Lorsqu&apos;une contamination est suspectée, le praticien doit immédiatement :</RegPara>
            <RegList items={['isoler le malade ;', 'identifier la source probable de contamination ;', 'désinfecter les instruments et les locaux ;', 'remplacer ou faire bouillir le linge ;', "renforcer l'hygiène des mains ;", 'surveiller les autres personnes ayant été en contact avec le malade.']} />
            <RegBlock col={`${TGC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Toute apparition de fièvre, de suppuration ou d&apos;épidémie doit être signalée au responsable médical.</p>
            </RegBlock>
          </>)}

          {/* IX. Devoir */}
          {tgcBlock(<>
            {tgcTitle('CHAPITRE IX', 'Devoir du Médecin')}
            <RegPara>Le praticien moderne ne combat plus seulement les symptômes. Il lutte également contre leur cause.</RegPara>
            <RegPara>Son devoir est de :</RegPara>
            <RegList items={["appliquer rigoureusement les règles d'hygiène ;", 'enseigner les principes de la théorie des germes ;', 'protéger les malades et leurs familles ;', 'maintenir un dispensaire propre et sain ;', "prévenir les épidémies avant qu'elles ne se propagent."]} />
            <RegCitation text="La propreté constitue désormais l'un des premiers traitements du médecin." author="Doctrine du Dispensaire, 1890" />
          </>)}

          {/* Conclusion */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>CONCLUSION</div>
            <RegPara>La théorie des germes représente l&apos;une des plus grandes avancées scientifiques du siècle. Grâce aux découvertes de Pasteur, Koch et Lister, la médecine comprend désormais que les maladies infectieuses ne sont ni des fatalités ni des châtiments, mais les conséquences de micro-organismes pouvant être combattus par la science, l&apos;hygiène et la discipline.</RegPara>
            <RegPara>Les antiseptiques modernes, les préparations du dispensaire et les plantes médicinales agissent de manière complémentaire. Ensemble, ils permettent de limiter les infections, de protéger les malades et d&apos;améliorer les chances de guérison.</RegPara>
            <RegCitation text="Un lieu propre, une eau saine, un air renouvelé et des mains soigneusement lavées demeurent les plus puissants remèdes contre les maladies contagieuses." author="Doctrine du Dispensaire, 1890" />
          </RegBlock>
        </div>
      )}

      {version === 'resume' && (
        <div>
          {/* Nature */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>LA THÉORIE DES GERMES</div>
            <RegPara>Les travaux de <strong>Louis Pasteur</strong>, <strong>Robert Koch</strong> et de leurs contemporains ont démontré que de nombreuses maladies sont provoquées par des micro-organismes invisibles appelés <strong>germes</strong>.</RegPara>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 12 }}>
              {tgcSection('ILS VIVENT DANS', <RegList items={["l'air ;", "l'eau ;", 'le sol ;', 'les aliments ;', 'le linge ;', 'les instruments ;', 'le corps humain.']} />)}
              {tgcSection('ILS SE DÉVELOPPENT DANS', <RegList items={['lieux humides ;', 'lieux sales ;', 'lieux mal ventilés.']} />)}
              {tgcSection('ILS SONT LIMITÉS PAR', <RegList items={['la propreté ;', 'la chaleur ;', 'la lumière ;', 'les désinfectants.']} />)}
            </div>
          </RegBlock>

          {/* Transmission */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>TRANSMISSION DES MALADIES</div>
            <RegList items={['Toux et gouttelettes respiratoires.', 'Crachats.', "Eau contaminée.", 'Aliments souillés.', 'Mains sales.', 'Instruments mal désinfectés.', 'Linge contaminé.']} />
            <RegBlock col={`${TGC}50`}>
              <p style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.12em', margin: 0 }}>Toute personne malade peut devenir une source de contagion si les règles d&apos;hygiène ne sont pas respectées.</p>
            </RegBlock>
          </RegBlock>

          {/* Pasteur */}
          {tgcBlock(<>
            {tgcTitle('LES DÉCOUVERTES DE PASTEUR')}
            <RegList items={["Les germes ne naissent pas spontanément.", "La chaleur détruit les micro-organismes.", "La stérilisation empêche les infections.", "Certaines maladies peuvent être prévenues grâce à la vaccination."]} />
            <p style={{ fontFamily: BODY, fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>Ses travaux constituent le fondement de l&apos;antisepsie moderne.</p>
          </>)}

          {/* Applications */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>APPLICATIONS AU DISPENSAIRE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {tgcSection('AIR', <RegList items={['Aération quotidienne des salles.', 'Isolement des malades contagieux.']} />)}
              {tgcSection('EAU', <RegList items={['Eau bouillie avant consommation.', 'Nettoyage régulier des récipients.']} />)}
              {tgcSection('INSTRUMENTS', <RegList items={["Stérilisation à l'eau bouillante.", "Désinfection à l'Acide phénique ou à l'alcool."]} />)}
              {tgcSection('LINGE', <RegList items={['Linge propre pour chaque malade.', 'Linge souillé bouilli ou détruit.']} />)}
              {tgcSection('PERSONNEL', <RegList items={['Lavage des mains avant et après chaque soin.', 'Vêtements propres.', "Reconnaître rapidement les signes d'une infection."]} />)}
            </div>
          </RegBlock>

          {/* Antiseptiques & Plantes */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 12 }}>ANTISEPTIQUES ET PLANTES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {tgcSection('PRÉPARATIONS DU DISPENSAIRE', <RegList items={['Eau Vulnéraire.', 'Onguent Vulnéraire.', 'Acide phénique.', "Teinture d'iode."]} />)}
              {tgcSection('PLANTES ANTISEPTIQUES', <RegList items={['Thym : antiseptique et purifiant.', 'Lavande : antiseptique et apaisante.', 'Romarin : assainissant.', 'Sauge : désinfectante.', 'Eucalyptus : respiratoire.', 'Ail : antiseptique naturel.', 'Échinacée : défenses naturelles.']} />)}
            </div>
          </RegBlock>

          {/* Contamination */}
          {tgcBlock(<>
            {tgcTitle('CONDUITE EN CAS DE CONTAMINATION')}
            <RegList items={['Isoler immédiatement le malade.', 'Désinfecter le matériel utilisé.', 'Faire bouillir le linge contaminé.', 'Désinfecter les crachats ou les liquides biologiques.', 'Nettoyer soigneusement les locaux.', 'Renforcer la surveillance des autres patients.']} />
          </>)}

          {/* À retenir */}
          <RegBlock col={`${TGC}50`}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: TGC_LIGHT, letterSpacing: '0.22em', marginBottom: 10 }}>À RETENIR</div>
            <RegList items={['Les germes sont responsables de nombreuses maladies infectieuses.', "La transmission s'effectue principalement par l'air, l'eau, les aliments et le contact.", "L'antisepsie repose sur la stérilisation, la désinfection et une hygiène rigoureuse.", 'Les préparations du dispensaire et les plantes médicinales complètent efficacement les mesures sanitaires.', 'Un lieu propre, une eau saine, un air renouvelé et des mains lavées demeurent les meilleurs moyens de prévenir les infections.', 'Le médecin de 1890 doit unir les découvertes scientifiques de Pasteur et Koch aux ressources de la médecine végétale afin de protéger le malade et la communauté.']} />
          </RegBlock>
        </div>
      )}
    </div>
  );
}

const BUILTIN_SHELVES: { label: string; items: { id: string; icon: string; t1: string; t2?: string; col?: string }[] }[] = [
  { label: 'Documents Officiels', items: [
    { id: 'reglement-interne',     icon: '⚖',  t1: 'Règlement',      t2: 'Interne',         col: 'rouge' },
    { id: 'serment-hippocrate',    icon: '⚕',  t1: 'Serment',        t2: "d'Hippocrate",    col: 'rouge' },
    { id: 'specialites-proposees', icon: '✦',  t1: 'Spécialités',    t2: 'Proposées',       col: 'rouge' },
    { id: 'protocole-sanitaire',   icon: '🛡️', t1: 'Protocole',      t2: 'Sanitaire',       col: 'rouge' },
    { id: 'protocole-epidemie',    icon: '⚠️', t1: 'Protocole',      t2: 'Épidémie',        col: 'rouge' },
  ]},
  { label: 'Doctrine & Enseignement', items: [
    { id: 'doctrine-purete',      icon: '🌿', t1: 'Doctrine de',    t2: 'Pureté',          col: 'vert' },
    { id: 'botanique-medicale',   icon: '🌱', t1: 'Botanique',      t2: 'Médicale',        col: 'vert' },
    { id: 'doctrine-cataplasmes', icon: '🫙', t1: 'Doctrine des',   t2: 'Cataplasmes',     col: 'vert' },
    { id: 'medecine-generale',    icon: '📋', t1: 'Médecine',       t2: 'Générale',        col: 'bleu' },
    { id: 'theorie-germes',       icon: '🔬', t1: 'Théorie',        t2: 'des Germes',      col: 'bleu' },
  ]},
  { label: 'Guides & Manuels', items: [
    { id: 'guide-herboriste',   icon: '🌿', t1: "Guide de",        t2: "l'Herboriste",    col: 'vert' },
    { id: 'manuel-infirmiers',  icon: '🩹', t1: 'Manuel des',      t2: 'Infirmiers' },
    { id: 'manuel-medecin',     icon: '🩺', t1: 'Manuel du',       t2: 'Médecin' },
    { id: 'guide-zoonoses',     icon: '🐾', t1: 'Guide des',       t2: 'Zoonoses' },
  ]},
  { label: 'Pharmacie', items: [
    { id: 'pharmacie-antidouleurs', icon: '⚗',  t1: 'Pharmacie',   t2: 'Anti-douleurs' },
    { id: 'pharmacie-sedatifs',     icon: '💤', t1: 'Pharmacie',   t2: 'Sédatifs' },
  ]},
  { label: 'Chirurgie & Antisepsie', items: [
    { id: 'chirurgie-suture',   icon: '🔪', t1: 'Chirurgie',      t2: 'Sutures',         col: 'violet' },
    { id: 'desinfection-steri', icon: '🔬', t1: 'Désinfection &', t2: 'Stérilisation',   col: 'violet' },
    { id: 'chirurgie-trauma',   icon: '🩻', t1: 'Chirurgie',      t2: 'Traumatologique', col: 'violet' },
  ]},
  { label: 'Obstétrique & Physiologie', items: [
    { id: 'obstetrique-i',     icon: '👶', t1: 'Obstétrique',    t2: 'I' },
    { id: 'obstetrique-ii',    icon: '🤱', t1: 'Obstétrique',    t2: 'II' },
    { id: 'obstetrique-iii',   icon: '🍼', t1: 'Obstétrique',    t2: 'III' },
    { id: 'traitement-physio', icon: '🦴', t1: 'Traitement',     t2: 'Physiologique' },
  ]},
  { label: 'Maladies & Traumatismes', items: [
    { id: 'maladies-infantiles', icon: '🧒', t1: 'Maladies',      t2: 'Infantiles',      col: 'marron' },
    { id: 'fievres-communes',    icon: '🌡️', t1: 'Fièvres',       t2: 'Communes',        col: 'marron' },
    { id: 'tuberculose',         icon: '🫁', t1: 'Pathologie',    t2: 'Médicale',        col: 'marron' },
    { id: 'traumatologie',       icon: '🩹', t1: 'Traumatologie',                         col: 'marron' },
  ]},
];

const BUILTIN_IDS = new Set(BUILTIN_SHELVES.flatMap(s => s.items.map(i => i.id)));

interface LayoutGroup { label: string; items: { id: string; title: string }[] }
interface LayoutOverride { groups: LayoutGroup[] }

function bookMeta(id: string, categories: BiblioCategorie[]) {
  const builtin = BUILTIN_SHELVES.flatMap(s => s.items).find(i => i.id === id);
  if (builtin) return { icon: builtin.icon, col: builtin.col, defaultTitle: [builtin.t1, builtin.t2].filter(Boolean).join(' ') };
  const cat = categories.find(c => c.id === id);
  return { icon: cat?.icon ?? '📖', col: undefined as string | undefined, defaultTitle: cat?.nom ?? id };
}

function defaultGroups(categories: BiblioCategorie[]): LayoutGroup[] {
  const userCats = categories.filter(c => !BUILTIN_IDS.has(c.id));
  return [
    ...BUILTIN_SHELVES.map(s => ({ label: s.label, items: s.items.map(b => ({ id: b.id, title: categories.find(c => c.id === b.id)?.nom ?? [b.t1, b.t2].filter(Boolean).join(' ') })) })),
    ...userCats.map(c => ({ label: c.nom, items: [{ id: c.id, title: c.nom }] })),
  ];
}

function effectiveGroups(categories: BiblioCategorie[], override: LayoutOverride | null): LayoutGroup[] {
  if (!override?.groups?.length) return defaultGroups(categories);
  const base = override.groups;
  const knownIds = new Set(base.flatMap(g => g.items.map(i => i.id)));
  const missing = categories.filter(c => !knownIds.has(c.id));
  if (!missing.length) return base;
  return [...base, ...missing.map(c => ({ label: c.nom, items: [{ id: c.id, title: c.nom }] }))];
}

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
        <span style={{ display: 'block', fontSize: 12, color: '#9a7828', marginBottom: 3, position: 'relative', zIndex: 1 }}>{icon}</span>
        <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 11, color: '#D1B77C', lineHeight: 1.55, textShadow: '0 1px 2px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>{t1}</span>
        {t2 && <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 11, color: '#D1B77C', lineHeight: 1.55, textShadow: '0 1px 2px rgba(0,0,0,0.8)', position: 'relative', zIndex: 1 }}>{t2}</span>}
      </div>
    </div>
  );
}

function ShelfRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0 4px' }}>
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(20,50,110,0.6))' }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: '#D1B77C', fontStyle: 'italic', letterSpacing: '0.2em', border: '1px solid rgba(20,50,110,0.6)', background: 'linear-gradient(135deg, #04080e, #02050a)', padding: '3px 16px 4px', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(209,183,124,0.06)' }}>✦ {label} ✦</span>
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
  devMode, layoutOverride, onSaveLayout,
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
  devMode: boolean;
  layoutOverride: LayoutOverride | null;
  onSaveLayout: (groups: LayoutGroup[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('Tout le catalogue');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState('');
  const dragRef = useRef<{ fromLabel: string; id: string } | null>(null);

  const groups = effectiveGroups(categories, layoutOverride);
  const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = groups.filter(g => section === 'Tout le catalogue' || g.label === section).map(g => ({ ...g, items: g.items.filter(b => normalize(b.title).includes(normalize(query))) })).filter(g => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  function startRename(id: string, current: string) {
    if (!devMode) return;
    setEditingId(id);
    setEditingVal(current);
  }
  function commitRename() {
    if (!editingId) return;
    const val = editingVal.trim();
    if (val) {
      const next = groups.map(g => {
        const items = g.items.map(it => it.id === editingId ? { ...it, title: val } : it);
        // Étagère à livre unique portant le même nom que le livre (catégorie créée par un dev) : on renomme aussi l'étagère.
        const soloRename = g.items.length === 1 && g.items[0].id === editingId && g.label === g.items[0].title;
        return { ...g, label: soloRename ? val : g.label, items };
      });
      onSaveLayout(next);
    }
    setEditingId(null);
  }

  function handleDrop(toLabel: string, beforeId: string | null) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!devMode || !drag) return;
    const next = groups.map(g => ({ ...g, items: [...g.items] }));
    const fromGroup = next.find(g => g.label === drag.fromLabel);
    const toGroup = next.find(g => g.label === toLabel);
    if (!fromGroup || !toGroup) return;
    const idx = fromGroup.items.findIndex(it => it.id === drag.id);
    if (idx === -1) return;
    const [moved] = fromGroup.items.splice(idx, 1);
    if (beforeId) {
      const insertAt = toGroup.items.findIndex(it => it.id === beforeId);
      toGroup.items.splice(insertAt === -1 ? toGroup.items.length : insertAt, 0, moved);
    } else {
      toGroup.items.push(moved);
    }
    onSaveLayout(next);
  }

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
        {devMode && <div style={{ margin: '0 0 14px', padding: '8px 14px', background: 'rgba(209,183,124,0.10)', border: `1px solid ${T.gold}`, fontFamily: MONO, fontSize: 12, color: T.gold, letterSpacing: '0.06em' }}>MODE DEV — glissez un ouvrage pour le déplacer, cliquez sur ✎ pour renommer une catégorie</div>}
        <div aria-live="polite" className="library-count">{visible.reduce((n, g) => n + g.items.length, 0)} ouvrages · {section}</div>
        {!visible.length && <p className="library-empty">Aucun ouvrage dans cette sélection. Essayez un autre titre ou une autre collection.</p>}
        {visible.map(g => (
          <section className="library-section" key={g.label}>
            <div className="library-section-heading"><h2>{g.label}</h2><span>{String(g.items.length).padStart(2, '0')}</span></div>
            <div
              className="library-grid"
              onDragOver={e => devMode && e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleDrop(g.label, null); }}
            >
              {g.items.map(b => (
                devMode && editingId === b.id ? (
                  <div key={b.id} className="library-volume" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <input
                      autoFocus
                      value={editingVal}
                      onChange={e => setEditingVal(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                      style={{ width: '100%', fontFamily: MONO, fontSize: 12, background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.gold}`, color: T.text, padding: '6px 8px', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <div
                    key={b.id}
                    className="library-volume"
                    role="button"
                    tabIndex={0}
                    title={b.title}
                    aria-label={b.title}
                    draggable={devMode}
                    onDragStart={() => { dragRef.current = { fromLabel: g.label, id: b.id }; }}
                    onDragOver={e => devMode && e.preventDefault()}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(g.label, b.id); }}
                    onClick={() => !devMode && setOpenCatId(b.id)}
                    style={{ cursor: devMode ? 'grab' : 'pointer' }}
                  >
                    <span className="library-volume-label">DISPENSAIRE DE LITTLE CREEK</span>
                    <h3>{b.title}</h3>
                    <span className="library-volume-bottom"><span>LC</span><span aria-hidden="true">→</span></span>
                    {devMode && (
                      <button
                        onClick={e => { e.stopPropagation(); startRename(b.id, b.title); }}
                        title="Renommer"
                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, fontSize: 11, background: 'rgba(0,0,0,0.55)', border: `1px solid ${T.gold}`, color: T.gold, cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                      >✎</button>
                    )}
                  </div>
                )
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </div>;
}

export default function BibliothequePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { roles } = useRedmSession();
  const canDev = isAdmin(roles);
  const [devMode, setDevMode] = useState(false);
  const [layoutOverride, setLayoutOverride] = useState<LayoutOverride | null>(null);
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
    setCategories(load());
    setHydrated(true);
    const cat = searchParams.get('cat');
    if (cat) setOpenCatId(cat);
  }, []);

  useEffect(() => {
    if (hydrated) save(categories);
  }, [categories, hydrated]);

  useEffect(() => {
    fetch('/api/redm/bibliotheque-layout')
      .then(r => r.json())
      .then(d => { if (d && d.groups) setLayoutOverride(d); })
      .catch(() => {});
  }, []);

  function saveLayout(groups: LayoutGroup[]) {
    const next = { groups };
    setLayoutOverride(next);
    fetch('/api/redm/bibliotheque-layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {});
  }

  const openCat = categories.find(c => c.id === openCatId) ?? null;
  const reglementCat = categories.find(c => c.id === 'reglement-interne') ?? null;
  const sermentCat = categories.find(c => c.id === 'serment-hippocrate') ?? null;
  const guideHerboristeCat = categories.find(c => c.id === 'guide-herboriste') ?? null;
  const specialitesCat   = categories.find(c => c.id === 'specialites-proposees') ?? null;
  const doctrinePureteCat    = categories.find(c => c.id === 'doctrine-purete') ?? null;
  const botaniqueMedicaleCat = categories.find(c => c.id === 'botanique-medicale') ?? null;
  const manuelInfirmiersCat      = categories.find(c => c.id === 'manuel-infirmiers') ?? null;
  const doctrineCataplasmesCat   = categories.find(c => c.id === 'doctrine-cataplasmes') ?? null;
  const manuelMedecinCat         = categories.find(c => c.id === 'manuel-medecin') ?? null;
  const medecineGeneraleCat      = categories.find(c => c.id === 'medecine-generale') ?? null;
  const theorieGermesCat         = categories.find(c => c.id === 'theorie-germes')    ?? null;
  const pharmacieAntidouleursCat = categories.find(c => c.id === 'pharmacie-antidouleurs') ?? null;
  const pharmacieSedatifsCat     = categories.find(c => c.id === 'pharmacie-sedatifs')     ?? null;
  const chirurgieSutureCat       = categories.find(c => c.id === 'chirurgie-suture')        ?? null;
  const obstetriqueICat          = categories.find(c => c.id === 'obstetrique-i')            ?? null;
  const obstetriqueIICat         = categories.find(c => c.id === 'obstetrique-ii')            ?? null;
  const obstetriqueIIICat        = categories.find(c => c.id === 'obstetrique-iii')            ?? null;
  const traitementPhysioCat      = categories.find(c => c.id === 'traitement-physio')           ?? null;
  const traumatologieCat         = categories.find(c => c.id === 'traumatologie')               ?? null;
  const guideZoonosesCat         = categories.find(c => c.id === 'guide-zoonoses')              ?? null;
  const maladiesInfantilesCat    = categories.find(c => c.id === 'maladies-infantiles')         ?? null;
  const fievresCommunesCat       = categories.find(c => c.id === 'fievres-communes')            ?? null;
  const tuberculoseCat           = categories.find(c => c.id === 'tuberculose')                 ?? null;
  const desinfectionSteriCat     = categories.find(c => c.id === 'desinfection-steri')          ?? null;
  const chirurgieTraumaCat       = categories.find(c => c.id === 'chirurgie-trauma')            ?? null;

  function createCategory() {
    const nom = newCatNom.trim();
    if (!nom) return;
    const cat: BiblioCategorie = { id: uid(), nom, icon: newCatIcon || ICONS[0], documents: [] };
    setCategories(prev => [...prev, cat]);
    setNewCatNom(''); setNewCatIcon(ICONS[0]); setCreatingCat(false);
  }

  function renameCategory(id: string) {
    const nom = renameVal.trim();
    if (!nom) { setRenamingCat(null); return; }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, nom } : c));
    setRenamingCat(null);
  }

  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDelCatConfirm(null);
    if (openCatId === id) setOpenCatId(null);
  }

  function startNewDoc() {
    setDocTitre(''); setDocContenu(''); setEditingDoc('new');
  }

  function startEditDoc(doc: BiblioDoc) {
    setDocTitre(doc.titre); setDocContenu(doc.contenu); setEditingDoc(doc.id);
  }

  function saveDoc() {
    if (!openCat) return;
    const titre = docTitre.trim();
    if (!titre) return;
    setCategories(prev => prev.map(c => {
      if (c.id !== openCat.id) return c;
      if (editingDoc === 'new') {
        const doc: BiblioDoc = { id: uid(), titre, contenu: docContenu, date: rpDate() };
        return { ...c, documents: [...c.documents, doc] };
      }
      return { ...c, documents: c.documents.map(d => d.id === editingDoc ? { ...d, titre, contenu: docContenu } : d) };
    }));
    setEditingDoc(null); setDocTitre(''); setDocContenu('');
  }

  function removeDoc(id: string) {
    if (!openCat) return;
    setCategories(prev => prev.map(c => c.id === openCat.id ? { ...c, documents: c.documents.filter(d => d.id !== id) } : c));
    setDelDocConfirm(null);
    if (openDocId === id) setOpenDocId(null);
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
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.16em' }}>
          DISPENSAIRE · BIBLIOTHÈQUE{openCat ? ` · ${openCat.nom.toUpperCase()}` : ''}
        </span>
        {canDev && !openCat && (
          <button
            onClick={() => setDevMode(v => !v)}
            title="Basculer le mode dev"
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer',
              padding: '7px 14px', borderRadius: 20,
              background: devMode ? 'rgba(209,183,124,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${devMode ? T.gold : T.border}`,
              color: devMode ? T.gold : T.muted,
            }}
          >
            <span style={{
              width: 30, height: 16, borderRadius: 10, position: 'relative', flexShrink: 0,
              background: devMode ? T.gold : 'rgba(255,255,255,0.15)', transition: 'background 0.15s',
            }}>
              <span style={{
                position: 'absolute', top: 2, left: devMode ? 16 : 2, width: 12, height: 12, borderRadius: '50%',
                background: '#102B3B', transition: 'left 0.15s',
              }} />
            </span>
            MODE DEV {devMode ? 'ON' : 'OFF'}
          </button>
        )}
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
          devMode={canDev && devMode}
          layoutOverride={layoutOverride}
          onSaveLayout={saveLayout}
        />
      )}

      {openCat && openCat.id === 'reglement-interne' && (
        <ReglementDocument />
      )}

      {openCat && openCat.id === 'serment-hippocrate' && (
        <SermentHippocrateDocument />
      )}

      {openCat && openCat.id === 'guide-herboriste' && (
        <GuideHerboristeDocument />
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

      {openCat && openCat.id === 'doctrine-purete' && (
        <DoctrinePureteDocument />
      )}

      {openCat && openCat.id === 'botanique-medicale' && (
        <BotaniqueMedicaleDocument />
      )}

      {openCat && openCat.id === 'manuel-infirmiers' && (
        <ManuelInfirmiersDocument />
      )}

      {openCat && openCat.id === 'doctrine-cataplasmes' && (
        <DoctrineCataplasmeDocument />
      )}

      {openCat && openCat.id === 'manuel-medecin' && (
        <ManuelMedecinDocument />
      )}

      {openCat && openCat.id === 'medecine-generale' && (
        <MedecineGeneraleDocument />
      )}

      {openCat && openCat.id === 'theorie-germes' && (
        <TheorieGermesDocument />
      )}

      {openCat && openCat.id === 'pharmacie-antidouleurs' && (
        <PharmacieAntidouleurDocument />
      )}

      {openCat && openCat.id === 'pharmacie-sedatifs' && (
        <PharmacieSedartifsDocument />
      )}

      {openCat && openCat.id === 'chirurgie-suture' && (
        <ChirurgieDocument />
      )}

      {openCat && openCat.id === 'obstetrique-i' && (
        <ObstetriqueiDocument />
      )}

      {openCat && openCat.id === 'obstetrique-ii' && (
        <ObstetriqueIIDocument />
      )}

      {openCat && openCat.id === 'obstetrique-iii' && (
        <ObstetriqueIIIDocument />
      )}

      {openCat && openCat.id === 'traitement-physio' && (
        <TraitementPhysioDocument />
      )}

      {openCat && openCat.id === 'traumatologie' && (
        <TraumatologieDocument />
      )}

      {openCat && openCat.id === 'guide-zoonoses' && (
        <ZoonosesDocument />
      )}

      {openCat && openCat.id === 'maladies-infantiles' && (
        <MaladiesInfantilesDocument />
      )}

      {openCat && openCat.id === 'fievres-communes' && (
        <FievresDocument />
      )}

      {openCat && openCat.id === 'tuberculose' && (
        <TuberculoseDocument />
      )}

      {openCat && openCat.id === 'desinfection-steri' && (
        <DesinfectionDocument />
      )}

      {openCat && openCat.id === 'chirurgie-trauma' && (
        <ChirurgieTraumaDocument />
      )}

      {openCat && openCat.id !== 'reglement-interne' && openCat.id !== 'serment-hippocrate' && openCat.id !== 'guide-herboriste' && openCat.id !== 'specialites-proposees' && openCat.id !== 'protocole-sanitaire' && openCat.id !== 'protocole-epidemie' && openCat.id !== 'doctrine-purete' && openCat.id !== 'botanique-medicale' && openCat.id !== 'manuel-infirmiers' && openCat.id !== 'doctrine-cataplasmes' && openCat.id !== 'manuel-medecin' && openCat.id !== 'medecine-generale' && openCat.id !== 'theorie-germes' && openCat.id !== 'pharmacie-antidouleurs' && openCat.id !== 'pharmacie-sedatifs' && openCat.id !== 'chirurgie-suture' && openCat.id !== 'obstetrique-i' && openCat.id !== 'obstetrique-ii' && openCat.id !== 'obstetrique-iii' && openCat.id !== 'traitement-physio' && openCat.id !== 'traumatologie' && openCat.id !== 'guide-zoonoses' && openCat.id !== 'maladies-infantiles' && openCat.id !== 'fievres-communes' && openCat.id !== 'tuberculose' && openCat.id !== 'desinfection-steri' && openCat.id !== 'chirurgie-trauma' && (
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
                      <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, marginTop: 4, letterSpacing: '0.08em' }}>AJOUTÉ LE {doc.date}</div>
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
