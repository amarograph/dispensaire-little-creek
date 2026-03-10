'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── THÈME FIVEM ─────────────────────────────────────────────────────────────
const MONO    = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

const T = {
  bg:        '#070D1C',
  card:      '#060C1A',
  cardHov:   '#0C1628',
  border:    'rgba(249,115,22,0.20)',
  borderSub: 'rgba(255,255,255,0.07)',
  orange:    '#F97316',
  orangeDim: 'rgba(249,115,22,0.12)',
  text:      '#E2E8F0',
  muted:     '#94A3B8',
  dim:       '#475569',
  dimmer:    '#334155',
};

// Couleurs de gravité
const GC = {
  CRITIQUE: { dot: '#A855F7', text: '#C084FC', border: 'rgba(168,85,247,0.40)', bg: 'rgba(168,85,247,0.10)', label: '● CRITIQUE' },
  ELEVEE:   { dot: '#EF4444', text: '#F87171', border: 'rgba(239,68,68,0.40)',  bg: 'rgba(239,68,68,0.10)',  label: '● ÉLEVÉE'  },
  MOYENNE:  { dot: '#EAB308', text: '#FDE047', border: 'rgba(234,179,8,0.40)',  bg: 'rgba(234,179,8,0.10)',  label: '● MOYENNE' },
  FAIBLE:   { dot: '#4ADE80', text: '#4ADE80', border: 'rgba(74,222,128,0.40)', bg: 'rgba(74,222,128,0.10)', label: '● FAIBLE'  },
} as const;

type Gravite = keyof typeof GC;

function gs(g: string) {
  return GC[(g as Gravite)] ?? GC.FAIBLE;
}

// Couleur constante vitale
function ccv(key: string, val: string) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return { border: T.borderSub, bg: T.card, color: T.dim };
  const bad = (key === 'fc' && (n < 60 || n > 100))
           || (key === 'spo2' && n < 95)
           || (key === 'temperature' && (n < 36.1 || n > 37.8));
  return bad
    ? { border: 'rgba(239,68,68,0.50)', bg: 'rgba(239,68,68,0.08)', color: '#F87171' }
    : { border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.06)', color: '#4ADE80' };
}

function taColor(val: string) {
  const sys = parseFloat((val || '').split('/')[0]);
  if (!sys || sys === 0) return { border: T.borderSub, bg: T.card, color: T.dim };
  return (sys < 90 || sys > 140)
    ? { border: 'rgba(239,68,68,0.50)', bg: 'rgba(239,68,68,0.08)', color: '#F87171' }
    : { border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.06)', color: '#4ADE80' };
}

// ─── SECTION ─────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, { accent: string; glow: string }> = {
  orange: { accent: '#F97316', glow: 'rgba(249,115,22,0.18)' },
  red:    { accent: '#F87171', glow: 'rgba(248,113,113,0.15)' },
  purple: { accent: '#C084FC', glow: 'rgba(192,132,252,0.15)' },
  cyan:   { accent: '#38BDF8', glow: 'rgba(56,189,248,0.15)'  },
  green:  { accent: '#4ADE80', glow: 'rgba(74,222,128,0.15)'  },
  yellow: { accent: '#FDE047', glow: 'rgba(253,224,71,0.15)'  },
};

function Section({ icon, title, color = 'orange', children }: {
  icon: string; title: string; color?: string; children: React.ReactNode;
}) {
  const c = SECTION_COLORS[color] ?? SECTION_COLORS.orange;
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${c.accent}`,
      marginBottom: 18,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 28px',
        borderBottom: `1px solid ${T.border}`,
        background: c.glow,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{
          fontFamily: MONO, fontSize: 18, fontWeight: 700,
          color: c.accent, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{title}</span>
      </div>
      <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>
    </div>
  );
}

// ─── LABEL ───────────────────────────────────────────────────────────────────
function L({ t, req }: { t: string; req?: boolean }) {
  return (
    <label style={{
      display: 'block', fontFamily: MONO, fontSize: 16, fontWeight: 700,
      letterSpacing: '0.13em', textTransform: 'uppercase', color: T.dim, marginBottom: 6,
    }}>
      {t}{req && <span style={{ color: '#F87171', marginLeft: 4 }}>*</span>}
    </label>
  );
}

// ─── INPUT DE BASE ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.35)',
  border: `1px solid ${T.borderSub}`,
  padding: '12px 18px',
  color: T.text,
  fontFamily: DISPLAY, fontSize: 18,
  outline: 'none',
  transition: 'border-color 0.15s',
};

function FI({ k, v, s, type = 'text', ph = '' }: {
  k: string; v: Record<string, string>; s: (k: string, val: string) => void; type?: string; ph?: string;
}) {
  return (
    <input
      type={type} value={v[k] || ''} onChange={e => s(k, e.target.value)}
      placeholder={ph}
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = T.orange)}
      onBlur={e => (e.target.style.borderColor = T.borderSub.toString())}
    />
  );
}

function FT({ k, v, s, ph = '', rows = 3 }: {
  k: string; v: Record<string, string>; s: (k: string, val: string) => void; ph?: string; rows?: number;
}) {
  return (
    <textarea
      value={v[k] || ''} onChange={e => s(k, e.target.value)}
      rows={rows} placeholder={ph}
      style={{ ...inputStyle, resize: 'vertical' }}
      onFocus={e => (e.target.style.borderColor = T.orange)}
      onBlur={e => (e.target.style.borderColor = T.borderSub.toString())}
    />
  );
}

// ─── CHIP ─────────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, ac }: {
  label: string; active?: boolean; onClick: () => void;
  ac?: { border: string; bg: string; color: string };
}) {
  const activeStyle = ac
    ? { border: `1px solid ${ac.border}`, background: ac.bg, color: ac.color }
    : { border: `1px solid ${T.orange}`, background: T.orangeDim, color: T.orange };
  const inactiveStyle = {
    border: `1px solid ${T.borderSub}`, background: 'transparent', color: T.dim,
  };
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: MONO, fontSize: 16, letterSpacing: '0.07em',
        padding: '9px 18px',
        cursor: 'pointer', transition: 'all 0.15s',
        ...(active ? activeStyle : inactiveStyle),
      }}
    >
      {label}
    </button>
  );
}

// ─── BLESSURES ────────────────────────────────────────────────────────────────
const blessures = [
  { label: 'Fracture simple', categorie: 'Os & Articulations', motif: 'Fracture simple', gravite: 'MOYENNE', conscience: 'Conscient, orienté et coopérant', diagnostic: 'Fracture simple du membre', localisation_precise: 'Bras, jambe, poignet ou cheville', douleur: '7', signes_cliniques: 'Douleur importante, impotence fonctionnelle partielle, œdème local.', observations: 'Suspicion de fracture simple sans exposition osseuse.', fc: '95', ta: '125/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fracture simple visible à la radiographie.', protocole: "• Évaluation clinique complète du membre atteint\n• Vérification de la douleur, de la mobilité et de l'impotence fonctionnelle\n• Contrôle vasculo-nerveux distal (pouls, sensibilité, coloration)\n• Réalisation d'une radiographie pour confirmation diagnostique\n• Mise au repos immédiate du membre traumatisé\n• Immobilisation par attelle adaptée à la zone atteinte\n• Application de glace localement pour limiter l'œdème\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si absence de contre-indication\n• Surveillance de l'évolution de la douleur et du gonflement\n• Orientation ou suivi orthopédique si nécessaire", complications: 'Aucune', repos: 'Repos strict du membre', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle', ata: 'Non requis', restrictions: "Pas d'appui sur le membre", surveillance: '• Douleur croissante\n• Œdème important\n• Engourdissement' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', motif: 'Fracture ouverte', gravite: 'ELEVEE', conscience: 'Conscient douloureux, coopérant', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', localisation_precise: 'Segment osseux atteint avec plaie ouverte', douleur: '9', signes_cliniques: 'Douleur intense, saignement, déformation du membre, exposition osseuse.', observations: 'Urgence traumatique avec risque infectieux et hémorragique.', fc: '110', ta: '110/70', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Fracture ouverte confirmée avec atteinte des tissus mous.', protocole: "• Évaluation rapide de la gravité et du saignement\n• Contrôle de l'hémorragie par pansement stérile compressif\n• Contrôle vasculo-nerveux distal avant immobilisation\n• Réalisation d'une radiographie du segment atteint\n• Mise en place d'une immobilisation stricte du membre\n• Administration de Paracétamol 1 g et Morphine IV selon intensité de la douleur\n• Début d'une antibiothérapie par Céfazoline 2 g IV\n• Vérification du statut antitétanique\n• Préparation à la prise en charge chirurgicale orthopédique\n• Surveillance rapprochée des constantes et de la douleur", complications: 'Risque infectieux et hémorragique', repos: 'Repos strict et hospitalisation', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun en première intention', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Pansement stérile compressif + immobilisation', ata: '48 à 96 heures', restrictions: 'Aucun appui, aucune mobilisation du membre atteint', surveillance: '• Saignement persistant\n• Fièvre\n• Engourdissement\n• Douleur croissante' },
  { label: 'Luxation', categorie: 'Os & Articulations', motif: 'Luxation', gravite: 'MOYENNE', conscience: 'Conscient, orienté et douloureux', diagnostic: 'Luxation articulaire', localisation_precise: 'Épaule, doigt ou genou', douleur: '8', signes_cliniques: 'Déformation articulaire, impotence fonctionnelle, douleur intense.', observations: "Vérifier l'absence de fracture associée avant réduction.", fc: '100', ta: '130/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Luxation confirmée sans fracture associée visible.', protocole: "• Évaluation clinique de l'articulation atteinte\n• Vérification de la déformation, de la douleur et de l'impotence\n• Contrôle vasculo-nerveux distal avant toute manœuvre\n• Réalisation d'une radiographie avant réduction\n• Administration de Paracétamol 1 g et Kétoprofène 100 mg\n• Réduction articulaire selon technique adaptée\n• Contrôle radiologique après réduction\n• Immobilisation par écharpe ou attelle selon l'articulation\n• Recommandation de repos et suivi orthopédique", complications: 'Aucune post-réduction immédiate', repos: 'Repos articulaire strict', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Écharpe ou immobilisation', ata: 'Non requis', restrictions: "Pas de mobilisation forcée de l'articulation", surveillance: '• Douleur persistante\n• Déformation résiduelle\n• Engourdissement distal' },
  { label: 'Entorse', categorie: 'Os & Articulations', motif: 'Entorse', gravite: 'FAIBLE', conscience: 'Conscient, orienté', diagnostic: 'Entorse ligamentaire', localisation_precise: 'Cheville, genou ou poignet', douleur: '6', signes_cliniques: 'Œdème, douleur à la mobilisation, gêne fonctionnelle.', observations: 'Atteinte ligamentaire probable sans fracture visible.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique + radiologie si besoin', resultats_examen: "Suspicion d'entorse sans anomalie osseuse majeure.", protocole: "• Évaluation de la douleur et de l'amplitude articulaire\n• Recherche d'un gonflement ou d'une instabilité\n• Réalisation d'une radiographie si doute fracturaire\n• Mise en place du protocole repos, glace, compression, élévation\n• Immobilisation légère par attelle ou bandage\n• Administration d'Ibuprofène 400 mg et application de Diclofénac gel 1 %\n• Recommandation de repos et limitation des appuis\n• Réévaluation si persistance de la douleur ou aggravation", complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol si besoin', anti_inflammatoire: 'Ibuprofène 400mg x3/jour + Diclofénac gel 1 % x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + glace', ata: 'Non requis', restrictions: "Limiter l'appui et les mouvements brusques", surveillance: '• Œdème important\n• Douleur persistante\n• Difficulté à poser le membre' },
  { label: 'Plaie ouverte', categorie: 'Plaies & Traumatismes', motif: 'Plaie ouverte / lacération', gravite: 'MOYENNE', conscience: 'Conscient, coopérant', diagnostic: 'Plaie profonde avec atteinte des tissus mous', localisation_precise: 'Zone cutanée atteinte', douleur: '6', signes_cliniques: 'Plaie ouverte, saignement modéré, douleur locale, bords irréguliers possibles.', observations: "Pas d'atteinte vasculaire ou nerveuse évidente.", fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie profonde sans atteinte organique visible.', protocole: "• Évaluation de la profondeur et de l'étendue de la plaie\n• Contrôle du saignement par compression locale\n• Nettoyage abondant au sérum physiologique\n• Désinfection soigneuse de la zone lésée\n• Vérification de l'absence de corps étranger ou d'atteinte profonde\n• Suture si nécessaire selon les berges de la plaie\n• Mise en place d'un pansement stérile\n• Administration de Paracétamol 1 g et Amoxicilline/acide clavulanique 1 g\n• Vérification du statut vaccinal antitétanique\n• Surveillance locale de la cicatrisation", complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Désinfection + suture + pansement', ata: 'Non requis', restrictions: 'Éviter les mouvements de traction sur la zone suturée', surveillance: '• Rougeur\n• Écoulement\n• Fièvre\n• Douleur croissante' },
  { label: 'Balle traversante', categorie: 'Plaies par armes', motif: 'Blessure par balle traversante', gravite: 'CRITIQUE', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle traversante', localisation_precise: "Zone d'impact projectile", douleur: '9', signes_cliniques: "Orifice d'entrée et de sortie, saignement, douleur intense, risque lésionnel profond.", observations: 'Risque hémorragique interne et externe.', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes instables', type_examen: 'Scanner + radiologie + bilan sanguin', resultats_examen: 'Trajectoire du projectile confirmée.', protocole: "• Évaluation ABC initiale et contrôle du saignement\n• Repérage des orifices d'entrée et de sortie\n• Mise sous surveillance continue des constantes\n• Réalisation d'une imagerie adaptée avec scanner et radiologie\n• Mise en place d'un accès veineux et d'une perfusion\n• Administration de Morphine IV selon la douleur\n• Administration d'Acide tranexamique 1 g IV\n• Début d'une antibioprophylaxie par Céfazoline 2 g IV\n• Préparation à une exploration ou chirurgie selon la localisation et la stabilité\n• Surveillance de l'état hémodynamique et respiratoire", complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Pansement stérile + contrôle hémorragique', ata: '96 heures', restrictions: 'Repos strict et surveillance continue', surveillance: '• Saignement\n• Chute de TA\n• Dyspnée\n• Altération de conscience' },
  { label: 'Arme blanche', categorie: 'Plaies par armes', motif: 'Blessure par arme blanche', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Plaie pénétrante par arme blanche', localisation_precise: 'Zone de pénétration', douleur: '8', signes_cliniques: "Plaie profonde, saignement, douleur importante, risque d'atteinte profonde.", observations: "Profondeur variable selon l'arme et la localisation.", fc: '110', ta: '115/75', spo2: '95', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + scanner si profondeur', resultats_examen: 'Plaie pénétrante confirmée.', protocole: "• Contrôle local du saignement\n• Évaluation de la profondeur et de la trajectoire de la plaie\n• Recherche de signes d'atteinte vasculaire, nerveuse ou viscérale\n• Réalisation d'un scanner si la profondeur est importante ou douteuse\n• Désinfection locale et pansement stérile\n• Administration de Paracétamol 1 g et Morphine IV si nécessaire\n• Début d'une antibiothérapie par Amoxicilline/acide clavulanique 1 g\n• Suture si possible ou orientation chirurgicale si plaie profonde\n• Surveillance du saignement et de la douleur", complications: 'Risque hémorragique', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Désinfection + pansement + suture si possible', ata: '48 à 72 heures', restrictions: 'Repos strict selon localisation', surveillance: '• Saignement\n• Fièvre\n• Douleur croissante\n• Gêne fonctionnelle' },
  { label: 'Brûlure 1er degré', categorie: 'Brûlures', motif: 'Brûlure du 1er degré', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Brûlure superficielle du 1er degré', localisation_precise: 'Zone cutanée atteinte', douleur: '4', signes_cliniques: 'Rougeur cutanée, douleur modérée, chaleur locale.', observations: 'Atteinte superficielle simple sans phlyctène.', fc: '85', ta: '120/75', spo2: '99', temperature: '36.8', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Brûlure superficielle confirmée.', protocole: "• Évaluation de l'étendue et de la profondeur de la brûlure\n• Refroidissement local précoce si récent\n• Nettoyage doux de la zone atteinte\n• Application d'une crème apaisante ou hydratante adaptée\n• Administration de Paracétamol 1 g si douleur\n• Conseils d'hydratation et de protection de la peau\n• Surveillance de l'évolution locale", complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Crème apaisante', ata: 'Non requis', restrictions: 'Éviter soleil, frottements et chaleur', surveillance: '• Rougeur persistante\n• Douleur croissante\n• Cloques' },
  { label: 'Brûlure 3e degré', categorie: 'Brûlures', motif: 'Brûlure du 3e degré', gravite: 'CRITIQUE', conscience: 'Conscient ou altéré selon étendue', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Lésion profonde, nécrose, peau cartonnée, atteinte étendue possible.', observations: 'Urgence spécialisée si surface importante.', fc: '130', ta: '100/65', spo2: '95', temperature: '37.1', etat_constantes: 'Constantes instables possibles', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Brûlure du 3e degré confirmée.', protocole: "• Évaluation immédiate de la gravité et de l'étendue de la brûlure\n• Protection stérile des zones atteintes\n• Mise en place d'une voie veineuse et apport de Ringer lactate IV si nécessaire\n• Administration de Morphine IV pour prise en charge antalgique\n• Surveillance rapprochée des constantes et de la douleur\n• Préparation à une prise en charge chirurgicale spécialisée\n• Hospitalisation et surveillance des signes de choc ou d'infection", complications: "Risque de choc et d'infection", repos: 'Hospitalisation', antalgique: 'Morphine 3 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon indication', soins_locaux: 'Pansement stérile', ata: '96 heures', restrictions: 'Repos strict et surveillance intensive', surveillance: '• Chute tensionnelle\n• Fièvre\n• Altération de conscience\n• Aggravation cutanée' },
  { label: 'Polytraumatisme', categorie: 'Traumatismes majeurs', motif: 'Polytraumatisme', gravite: 'CRITIQUE', conscience: 'Altération possible', diagnostic: 'Polytraumatisme', localisation_precise: 'Multiples zones corporelles', douleur: '10', signes_cliniques: 'Douleurs multiples, lésions associées, instabilité hémodynamique possible.', observations: 'Risque vital majeur.', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', etat_constantes: 'Constantes instables', type_examen: 'Scanner corps entier + bilan sanguin', resultats_examen: 'Multiples lésions traumatiques identifiées.', protocole: "• Évaluation prioritaire des fonctions vitales selon l'ordre de gravité\n• Contrôle des saignements extériorisés et immobilisation des lésions suspectées\n• Mise sous surveillance continue et accès veineux rapide\n• Réalisation d'un bilan sanguin complet et d'un scanner corps entier\n• Administration de Morphine IV pour la douleur\n• Administration d'Acide tranexamique 1 g IV si suspicion hémorragique\n• Mise en route de perfusion et transfusion si nécessaire\n• Coordination avec chirurgie ou spécialités concernées\n• Admission en secteur critique", complications: 'Choc hémorragique', repos: 'Soins intensifs', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon lésions', soins_locaux: 'Pansements + immobilisations selon lésions', ata: '96 heures', restrictions: 'Repos absolu et surveillance continue', surveillance: '• Chute tensionnelle\n• Désaturation\n• Altération neurologique\n• Saignement' },
  { label: 'TC léger', categorie: 'Neurologie & Tête', motif: 'Traumatisme crânien léger', gravite: 'MOYENNE', conscience: 'Conscient, orienté', diagnostic: 'Traumatisme crânien léger', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: 'Céphalées, vertiges, douleur post-traumatique, nausées possibles.', observations: 'Pas de déficit neurologique majeur constaté.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Scanner cérébral si besoin + examen neurologique', resultats_examen: "Aucune hémorragie intracrânienne retrouvée.", protocole: "• Évaluation neurologique initiale avec contrôle de l'orientation\n• Recherche de perte de connaissance, vomissements ou amnésie\n• Surveillance de la douleur et de l'état de vigilance\n• Réalisation d'un scanner si nécessaire selon le contexte\n• Administration de Paracétamol 1 g\n• Repos neurologique avec limitation des stimulations\n• Réévaluation si apparition de symptômes d'alerte", complications: 'Aucune', repos: 'Repos neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: 'Non requis', restrictions: "Pas de conduite, pas d'effort intense, pas de sport", surveillance: '• Vomissements\n• Somnolence\n• Céphalées croissantes\n• Troubles de conscience' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', motif: 'Déchirure musculaire', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Déchirure musculaire partielle', localisation_precise: 'Muscle atteint', douleur: '7', signes_cliniques: 'Douleur vive, impotence partielle, hématome possible.', observations: "Lésion musculaire partielle confirmable à l'imagerie.", fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie', resultats_examen: 'Déchirure musculaire partielle confirmée.', protocole: "• Examen clinique du muscle lésé avec recherche de déficit fonctionnel\n• Réalisation d'une échographie si besoin de confirmation\n• Mise au repos stricte du muscle atteint\n• Application de compression et de glace\n• Administration de Paracétamol 1 g et Kétoprofène 100 mg si absence de contre-indication\n• Limitation des mouvements douloureux\n• Réévaluation médicale avant reprise progressive", complications: 'Aucune', repos: 'Repos strict puis progressif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Compression + glace', ata: 'Non requis', restrictions: 'Aucun effort musculaire sur la zone', surveillance: '• Hématome important\n• Douleur croissante\n• Impotence persistante' },
];

const categories = [...new Set(blessures.map(b => b.categorie))];

// ─── TEMPLATE RAPPORT ─────────────────────────────────────────────────────────
const TEMPLATE = `⚕️ RAPPORT D'INTERVENTION MÉDICALE — SAMS

📅 Date : {{date}}
🕐 Heure de prise en charge : {{heure}}
🏥 Patient : {{civilite}} {{prenom}} {{nom}}
📋 Motif : {{motif}}
📍 Localisation : {{localisation}}
🚦 Triage : {{triage}}
⚠️ Gravité : {{gravite}}

---

🩺 État initial à l'admission

État de conscience : {{conscience}}
Cause de la blessure : {{causes_blessure}}
Type de blessure : {{types_blessure}}
Blessure / symptôme principal : {{diagnostic}}
Localisation : {{localisation_precise}} {{localisation_libre}}
Niveau de douleur : {{douleur}}/10
Douleur par zone : {{douleur_zones_detail}}
Signes cliniques observés : {{signes_cliniques}}
Observations complémentaires : {{observations}}

---

🫀 Constantes vitales

FC : {{fc}} bpm
TA : {{ta}} mmHg
SpO₂ : {{spo2}} %
Température : {{temperature}} °C
État des constantes : {{etat_constantes}}

---

🔬 Examens réalisés

Type d'examen : {{type_examen}}
Résultats : {{resultats_examen}}

---

🔪 Prise en charge et protocole de soins

{{protocole}}

---

🩹 État final du patient

Complications éventuelles : {{complications}}

---

💊 Prescription à la sortie

Antalgique : {{antalgique}}
Anti-inflammatoire : {{anti_inflammatoire}}
Antibiotique : {{antibiotique}}
Soins locaux : {{soins_locaux}}
Repos : {{repos}}

---

📌 Recommandations

Durée d'ATA : {{ata}}
Restrictions physiques : {{restrictions}}
Surveillance des symptômes :
{{surveillance}}

---

📅 Suivi médical

Date du contrôle : {{suivi_date}}
Examens complémentaires : {{examens_suivi}}
Observations : {{observations_suivi}}

---

✍️ Rapport rédigé par {{redacteur}} — {{date}}`;

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function TraumatologiePage() {
  const router = useRouter();

  const [vals, setVals]     = useState<Record<string, string>>({ civilite: 'Monsieur', gravite: 'FAIBLE' });
  const [report, setReport] = useState('');
  const [step, setStep]     = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');
  const [showB, setShowB]     = useState(false);
  const [cat, setCat]         = useState(categories[0]);

  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }));

  function toggleList(key: string, val: string) {
    const arr = (vals[key] || '').split(', ').filter(Boolean);
    const i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
    set(key, arr.join(', '));
  }

  function applyB(b: typeof blessures[0]) {
    setVals(p => ({
      ...p,
      gravite: b.gravite,
      conscience: b.conscience,
      diagnostic: b.diagnostic,
      types_blessure: b.label.includes('Fracture') ? 'Fracture'
        : b.label.includes('Brûlure') ? 'Brulure'
        : b.label.includes('balle') ? 'Balle'
        : b.label.includes('blanche') ? 'Couteau'
        : b.label.includes('Noyade') ? 'Noyade'
        : 'Autre',
      localisation_precise: '',
      localisation_libre: '',
      observations: b.localisation_precise,
      douleur: b.douleur,
      signes_cliniques: b.signes_cliniques,
      fc: b.fc, ta: b.ta, spo2: b.spo2, temperature: b.temperature,
      etat_constantes: b.etat_constantes,
      type_examen: b.type_examen, resultats_examen: b.resultats_examen,
      protocole: b.protocole, complications: b.complications, repos: b.repos,
      antalgique: b.antalgique, anti_inflammatoire: b.anti_inflammatoire,
      antibiotique: b.antibiotique, soins_locaux: b.soins_locaux,
      ata: b.ata, restrictions: b.restrictions, surveillance: b.surveillance,
    }));
    setShowB(false);
  }

  async function generate() {
    setLoading(true); setErr('');
    const g = vals.gravite;
    const gt = g === 'CRITIQUE' ? '🟣 CRITIQUE' : g === 'ELEVEE' ? '🔴 ÉLEVÉE' : g === 'MOYENNE' ? '🟡 MOYENNE' : '🟢 FAIBLE';
    const motif = [vals.motifs_selection, vals.motif_libre].filter(Boolean).join(' — ');
    const triageMap: Record<string, string> = { VERT: '🟢 Blessures mineures', JAUNE: '🟡 Urgence différée', ROUGE: '🔴 Urgence vitale', NOIR: '⚫ Décès' };
    const triage = triageMap[vals.triage || ''] || '';
    const zones = (vals.douleur_zones || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const douleur_zones_detail = zones.map((z: string) => {
      const v = vals[`douleur_${z.replace(/[^a-zA-Z0-9]/g, '_')}`] || '';
      return v ? `${z}: ${v}/10` : null;
    }).filter(Boolean).join(' | ');

    const allVals = { ...vals, gravite: gt, motif, triage, douleur_zones_detail };

    function cleanTemplate(tpl: string): string {
      let result = tpl.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
        const v = allVals[key];
        return (v !== undefined && v !== null && String(v).trim() !== '') ? String(v).trim() : '__EMPTY__';
      });
      result = result.split('\n').filter(l => !l.trim().includes('__EMPTY__')).join('\n');
      result = result.replace(/---\s*\n(\s*\n)*---/g, '---');
      result = result.replace(/\n{3,}/g, '\n\n');
      return result;
    }

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: cleanTemplate(TEMPLATE), values: allVals }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report); setStep('preview');
    } catch { setErr('Erreur lors de la génération.'); }
    setLoading(false);
  }

  async function save() {
    setSaving(true); setErr('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr('Non authentifié'); setSaving(false); return; }
    const name = `${vals.prenom || ''} ${vals.nom || ''}`.trim() || 'Inconnu';
    const filename = `traumatologie_${name.replace(/\s/g, '_')}_${Date.now()}.txt`;
    const { error: e } = await supabase.from('archives').insert({
      owner_id: user.id, universe: 'fivem', template_name: 'Traumatologie',
      patient_name: name, storage_path: `${user.id}/${filename}`,
      filename, field_values: vals, rendered_body: report,
    });
    if (e) { setErr('Erreur : ' + e.message); setSaving(false); return; }
    router.push('/fivem/archives');
  }

  const g = gs(vals.gravite || 'FAIBLE');

  // ── Styles réutilisables ──────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    fontFamily: MONO, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.18s',
    border: 'none', outline: 'none',
  };

  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  return (
    <div style={{ fontFamily: DISPLAY, maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 18 }}>
        <button
          onClick={() => step === 'preview' ? setStep('form') : router.back()}
          style={{
            ...btnBase, fontSize: 17,
            background: 'transparent',
            border: `1px solid ${T.border}`,
            color: T.muted, padding: '11px 26px',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = T.orange; (e.target as HTMLElement).style.borderColor = T.orange; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = T.muted; (e.target as HTMLElement).style.borderColor = T.border; }}
        >
          ← RETOUR
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 16, color: T.orange, letterSpacing: '0.18em', marginBottom: 6 }}>
            ■ MDT › RAPPORTS › TRAUMATOLOGIE
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, color: T.text, letterSpacing: '0.03em', lineHeight: 1 }}>
            🦴 Traumatologie
          </div>
        </div>

        <div style={{
          fontFamily: MONO, fontSize: 17,
          padding: '6px 16px',
          border: `1px solid ${T.border}`,
          color: T.orange, background: T.orangeDim,
          letterSpacing: '0.12em',
        }}>
          {step === 'form' ? 'FORMULAIRE' : 'RAPPORT GÉNÉRÉ'}
        </div>
      </div>

      {/* ══ FORMULAIRE ══════════════════════════════════════════════════════ */}
      {step === 'form' && (<>

        {/* ── RACCOURCIS BLESSURES ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowB(!showB)}
            style={{
              ...btnBase, width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 20px', fontSize: 17,
              background: 'rgba(56,189,248,0.04)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: '#38BDF8',
            }}
          >
            <span>🩹 RACCOURCIS BLESSURES — REMPLISSAGE AUTOMATIQUE</span>
            <span style={{ color: T.dim, fontWeight: 400 }}>{showB ? '▲' : '▼'}</span>
          </button>

          {showB && (
            <div style={{
              marginTop: 2, padding: 16,
              background: 'rgba(0,0,0,0.45)',
              border: `1px solid ${T.borderSub}`,
              borderTop: 'none',
            }}>
              {/* Catégories */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    ...btnBase, fontSize: 16, padding: '5px 14px',
                    background: cat === c ? T.orangeDim : 'transparent',
                    border: `1px solid ${cat === c ? T.orange : T.borderSub}`,
                    color: cat === c ? T.orange : T.dim,
                    fontWeight: cat === c ? 700 : 400,
                  }}>{c}</button>
                ))}
              </div>

              {/* Blessures */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {blessures.filter(b => b.categorie === cat).map(b => {
                  const gc = gs(b.gravite);
                  return (
                    <button key={b.label} onClick={() => applyB(b)} style={{
                      ...btnBase, fontSize: 16, padding: '9px 18px',
                      background: gc.bg, border: `1px solid ${gc.border}`,
                      color: gc.text, fontWeight: 400,
                    }}>{b.label}</button>
                  );
                })}
              </div>

              {/* Légende */}
              <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.borderSub}` }}>
                {Object.entries(GC).reverse().map(([k, c]) => (
                  <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 16, color: c.text }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── S1 : INFOS GÉNÉRALES ─────────────────────────────────────────── */}
        <Section icon="📋" title="Informations générales" color="orange">
          <div style={grid2}>
            <div>
              <L t="Date" req />
              <FI k="date" v={vals} s={set} type="date" />
            </div>
            <div>
              <L t="Heure de prise en charge" />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="time" value={vals.heure || ''} onChange={e => set('heure', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => set('heure', new Date().toTimeString().slice(0, 5))}
                  style={{
                    ...btnBase, fontSize: 16, padding: '0 18px',
                    background: T.orangeDim, border: `1px solid ${T.border}`,
                    color: T.orange, whiteSpace: 'nowrap',
                  }}
                >MAINTENANT</button>
              </div>
            </div>
          </div>

          <div>
            <L t="Civilité" />
            <div style={{ display: 'flex', gap: 8 }}>
              {['Monsieur', 'Madame'].map(c => (
                <button key={c} onClick={() => set('civilite', c)} style={{
                  ...btnBase, fontSize: 18, padding: '8px 22px',
                  background: vals.civilite === c ? T.orange : 'transparent',
                  border: `1px solid ${vals.civilite === c ? T.orange : T.borderSub}`,
                  color: vals.civilite === c ? '#fff' : T.dim,
                }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={grid2}>
            <div><L t="Nom du patient" req /><FI k="nom" v={vals} s={set} ph="Nom Prénom" /></div>
            <div><L t="Prénom" /><FI k="prenom" v={vals} s={set} ph="Ex: Jackson" /></div>
          </div>

          <div>
            <L t="Motif de déclenchement" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Blessure par balle', 'Couteau', 'AVP', 'Chute', 'Noyade', 'Rixe', 'Acc. travail', 'Malaise', 'Brulure', 'Overdose'].map(m => (
                <Chip key={m} label={m}
                  active={(vals.motifs_selection || '').includes(m)}
                  onClick={() => toggleList('motifs_selection', m)} />
              ))}
            </div>
            <input value={vals.motif_libre || ''} onChange={e => set('motif_libre', e.target.value)}
              placeholder="Autre motif ou précisions..." style={inputStyle} />
          </div>

          <div>
            <L t="Lieu d'intervention" />
            <FI k="localisation" v={vals} s={set} ph="Adresse ou quartier..." />
          </div>

          <div>
            <L t="Triage" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {[
                { val: 'VERT',  label: 'Blessures mineures', dot: '#4ADE80', ac: { border: '#4ADE80', bg: 'rgba(74,222,128,0.12)', color: '#4ADE80' } },
                { val: 'JAUNE', label: 'Urgence différée',   dot: '#EAB308', ac: { border: '#EAB308', bg: 'rgba(234,179,8,0.12)',  color: '#FDE047' } },
                { val: 'ROUGE', label: 'Urgence vitale',     dot: '#EF4444', ac: { border: '#EF4444', bg: 'rgba(239,68,68,0.12)',  color: '#F87171' } },
                { val: 'NOIR',  label: 'Décès',              dot: '#94A3B8', ac: { border: '#94A3B8', bg: 'rgba(148,163,184,0.12)',color: '#CBD5E1' } },
              ].map(t => (
                <Chip key={t.val} label={t.label}
                  active={vals.triage === t.val}
                  onClick={() => set('triage', vals.triage === t.val ? '' : t.val)}
                  ac={t.ac} />
              ))}
            </div>
          </div>
        </Section>

        {/* ── S2 : BLESSURES ───────────────────────────────────────────────── */}
        <Section icon="🩹" title="Blessures" color="red">
          <div>
            <L t="Cause de la blessure" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Blessure par balle', 'Couteau', 'AVP', 'Chute', 'Noyade', 'Rixe', 'Acc. travail', 'Malaise', 'Brulure', 'Overdose'].map(c => (
                <Chip key={c} label={c}
                  active={(vals.causes_blessure || '').includes(c)}
                  onClick={() => toggleList('causes_blessure', c)}
                  ac={{ border: '#F97316', bg: 'rgba(249,115,22,0.12)', color: '#FB923C' }} />
              ))}
            </div>
          </div>

          <div>
            <L t="Type de blessure(s)" req />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Balle', 'Couteau', 'Brulure', 'Fracture', 'AVP', 'Chute', 'Noyade', 'Intoxication', 'Autre'].map(t => (
                <Chip key={t} label={t}
                  active={(vals.types_blessure || '').includes(t)}
                  onClick={() => toggleList('types_blessure', t)}
                  ac={{ border: '#F87171', bg: 'rgba(248,113,113,0.12)', color: '#F87171' }} />
              ))}
            </div>
            <input value={vals.diagnostic || ''} onChange={e => set('diagnostic', e.target.value)}
              placeholder="Blessure / symptôme principal..." style={inputStyle} />
          </div>

          <div>
            <L t="Localisation" req />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Tête', 'Visage', 'Cou', 'Épaule G.', 'Épaule D.', 'Thorax', 'Abdomen', 'Dos', 'Bras G.', 'Bras D.', 'Main G.', 'Main D.', 'Bassin', 'Jambe G.', 'Jambe D.', 'Pied G.', 'Pied D.'].map(l => (
                <Chip key={l} label={l}
                  active={(vals.localisation_precise || '').includes(l)}
                  onClick={() => toggleList('localisation_precise', l)}
                  ac={{ border: '#F87171', bg: 'rgba(248,113,113,0.12)', color: '#F87171' }} />
              ))}
            </div>
            <input value={vals.localisation_libre || ''} onChange={e => set('localisation_libre', e.target.value)}
              placeholder="Précisez si nécessaire..." style={inputStyle} />
          </div>

          <div style={grid2}>
            <div><L t="Signes cliniques" /><FT k="signes_cliniques" v={vals} s={set} ph="Observations cliniques..." rows={3} /></div>
            <div><L t="Observations" /><FT k="observations" v={vals} s={set} ph="Ex : Segment osseux atteint..." rows={3} /></div>
          </div>
        </Section>

        {/* ── S3 : CONSTANTES VITALES ──────────────────────────────────────── */}
        <Section icon="🫀" title="Constantes vitales" color="purple">
          <div style={grid2}>
            {[
              { k: 'fc', l: 'FC', u: 'bpm', n: 'Normal : 60–100', p: '88' },
              { k: 'spo2', l: 'SPO2', u: '%', n: 'Normal : 95–100', p: '98' },
              { k: 'temperature', l: 'Température', u: '°C', n: 'Normal : 36.1–37.8', p: '36.9' },
            ].map(({ k, l, u, n, p }) => {
              const c = ccv(k, vals[k] || '');
              return (
                <div key={k}>
                  <L t={l} />
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: `1px solid ${c.border}`, background: c.bg, overflow: 'hidden',
                  }}>
                    <input type="text" value={vals[k] || ''} onChange={e => set(k, e.target.value)}
                      placeholder={p}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        padding: '12px 18px', color: c.color,
                        fontFamily: MONO, fontSize: 17,
                      }} />
                    <span style={{ padding: '0 12px', fontFamily: MONO, fontSize: 16, color: c.color, opacity: 0.7 }}>{u}</span>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 16, color: T.muted, marginTop: 5 }}>{n}</p>
                </div>
              );
            })}

            <div>
              <L t="Tension artérielle" />
              {(() => {
                const c = taColor(vals.ta || '');
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: `1px solid ${c.border}`, background: c.bg, overflow: 'hidden',
                  }}>
                    <input type="text" value={vals.ta?.split('/')[0] || ''}
                      onChange={e => set('ta', `${e.target.value}/${vals.ta?.split('/')[1] || ''}`)}
                      placeholder="120"
                      style={{ width: 56, background: 'transparent', border: 'none', outline: 'none', padding: '9px 10px', color: c.color, fontFamily: MONO, fontSize: 17, textAlign: 'right' }} />
                    <span style={{ color: T.dim, fontWeight: 700 }}>/</span>
                    <input type="text" value={vals.ta?.split('/')[1] || ''}
                      onChange={e => set('ta', `${vals.ta?.split('/')[0] || ''}/${e.target.value}`)}
                      placeholder="80"
                      style={{ width: 56, background: 'transparent', border: 'none', outline: 'none', padding: '9px 10px', color: c.color, fontFamily: MONO, fontSize: 14 }} />
                    <span style={{ padding: '0 12px', fontFamily: MONO, fontSize: 16, color: c.color, opacity: 0.7 }}>mmHg</span>
                  </div>
                );
              })()}
              <p style={{ fontFamily: MONO, fontSize: 16, color: T.muted, marginTop: 5 }}>Normal : 120/80</p>
            </div>
          </div>

          <div>
            <L t="Douleur par zone" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Tête', 'Visage', 'Cou', 'Épaule G.', 'Épaule D.', 'Thorax', 'Abdomen', 'Dos', 'Bras G.', 'Bras D.', 'Main G.', 'Main D.', 'Bassin', 'Jambe G.', 'Jambe D.', 'Pied G.', 'Pied D.'].map(z => (
                <Chip key={z} label={z}
                  active={(vals.douleur_zones || '').includes(z)}
                  onClick={() => toggleList('douleur_zones', z)}
                  ac={{ border: '#C084FC', bg: 'rgba(192,132,252,0.12)', color: '#C084FC' }} />
              ))}
            </div>

            {(vals.douleur_zones || '').split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(vals.douleur_zones || '').split(',').map(s => s.trim()).filter(Boolean).map(zone => {
                  const key = `douleur_${zone.replace(/[^a-zA-Z0-9]/g, '_')}`;
                  const v = vals[key] || '';
                  const n = parseFloat(v);
                  const col = !v || isNaN(n) ? { border: T.borderSub, bg: T.card, color: T.dim }
                    : n >= 8 ? { border: 'rgba(239,68,68,0.50)', bg: 'rgba(239,68,68,0.08)', color: '#F87171' }
                    : n >= 5 ? { border: 'rgba(234,179,8,0.50)',  bg: 'rgba(234,179,8,0.08)',  color: '#FDE047' }
                    : { border: 'rgba(74,222,128,0.45)', bg: 'rgba(74,222,128,0.06)', color: '#4ADE80' };
                  return (
                    <div key={zone} style={{ display: 'flex', alignItems: 'center', border: `1px solid ${col.border}`, background: col.bg, overflow: 'hidden' }}>
                      <span style={{ padding: '0 12px', fontFamily: MONO, fontSize: 16, color: T.muted, whiteSpace: 'nowrap' }}>{zone}</span>
                      <input type="number" min="0" max="10" value={v} onChange={e => set(key, e.target.value)}
                        placeholder="0–10"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '8px 6px', color: col.color, fontFamily: MONO, fontSize: 16, textAlign: 'right' }} />
                      <span style={{ padding: '0 10px', fontFamily: MONO, fontSize: 16, color: col.color, opacity: 0.6 }}>/10</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={grid2}>
            <div><L t="Douleur globale (/10)" /><FI k="douleur" v={vals} s={set} ph="Ex: 7" /></div>
            <div><L t="État des constantes" /><FI k="etat_constantes" v={vals} s={set} ph="Ex: Constantes stables" /></div>
          </div>
        </Section>

        {/* ── S4 : SOINS ───────────────────────────────────────────────────── */}
        <Section icon="💉" title="Soins effectués" color="cyan">
          <div><L t="Protocole de soins" /><FT k="protocole" v={vals} s={set} ph={'• Désinfection\n• Suture\n• Pansement...'} rows={4} /></div>
          <div style={grid2}>
            <div><L t="Antalgique" /><FI k="antalgique" v={vals} s={set} ph="Ex: Paracétamol 1g x3/jour" /></div>
            <div><L t="Anti-inflammatoire" /><FI k="anti_inflammatoire" v={vals} s={set} ph="Ex: Ibuprofène 400mg" /></div>
            <div><L t="Antibiotique" /><FI k="antibiotique" v={vals} s={set} ph="Ex: Aucun" /></div>
            <div><L t="Soins locaux" /><FT k="soins_locaux" v={vals} s={set} ph="Ex: Pansement quotidien..." rows={2} /></div>
          </div>
          <div><L t="Examens réalisés" /><FI k="type_examen" v={vals} s={set} ph="Ex: Radiologie, scanner..." /></div>
          <div><L t="Résultats examens" /><FT k="resultats_examen" v={vals} s={set} ph="Ex: Aucune atteinte interne..." rows={2} /></div>
        </Section>

        {/* ── S5 : GRAVITÉ ─────────────────────────────────────────────────── */}
        <Section icon="⚠️" title="Gravité & État" color="yellow">
          <div>
            <L t="Gravité" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE'] as const).map(gv => {
                const gc = GC[gv];
                const active = vals.gravite === gv;
                return (
                  <button key={gv} onClick={() => set('gravite', gv)} style={{
                    ...btnBase, fontSize: 17, padding: '8px 18px',
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: active ? gc.bg : 'transparent',
                    border: `1px solid ${active ? gc.border : T.borderSub}`,
                    color: active ? gc.text : T.dim,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: gc.dot, display: 'inline-block' }} />
                    {gv}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <L t="État de conscience" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Conscient orienté', 'Conscient douloureux', 'Inconscient', 'Non coopératif', 'Altéré'].map(c => (
                <Chip key={c} label={c}
                  active={vals.conscience === c}
                  onClick={() => set('conscience', vals.conscience === c ? '' : c)}
                  ac={{ border: '#FDE047', bg: 'rgba(253,224,71,0.12)', color: '#FDE047' }} />
              ))}
            </div>
            <input value={vals.conscience || ''} onChange={e => set('conscience', e.target.value)}
              placeholder="Précisez..." style={inputStyle} />
          </div>

          <div><L t="Complications éventuelles" /><FT k="complications" v={vals} s={set} ph="Ex: Aucune complication" rows={2} /></div>
        </Section>

        {/* ── S6 : RECOMMANDATIONS ─────────────────────────────────────────── */}
        <Section icon="📌" title="Recommandations de suivi" color="green">
          <div style={grid2}>
            <div><L t="Durée d'ATA" /><FI k="ata" v={vals} s={set} ph="Ex: 24 à 48 heures" /></div>
            <div><L t="Repos" /><FI k="repos" v={vals} s={set} ph="Ex: Repos relatif" /></div>
          </div>
          <div><L t="Restrictions physiques" /><FT k="restrictions" v={vals} s={set} ph="Ex: Éviter les efforts physiques..." rows={2} /></div>
          <div><L t="Surveillance des symptômes" /><FT k="surveillance" v={vals} s={set} ph={'• Douleur importante\n• Fièvre\n• Saignement...'} rows={3} /></div>
          <div style={grid2}>
            <div><L t="Date du contrôle" /><FI k="suivi_date" v={vals} s={set} ph="Ex: Dans les 24h" /></div>
            <div><L t="Examens de suivi" /><FI k="examens_suivi" v={vals} s={set} ph="Ex: Radio de contrôle" /></div>
          </div>
          <div><L t="Observations suivi" /><FI k="observations_suivi" v={vals} s={set} ph="Ex: Vérification cicatrisation" /></div>
        </Section>

        {/* ── S7 : RÉDACTEUR ───────────────────────────────────────────────── */}
        <Section icon="✍️" title="Rapport rédigé par" color="orange">
          <div><L t="Nom & Grade" req /><FI k="redacteur" v={vals} s={set} ph="Ex: Ambulancier Ethan Skoll" /></div>
        </Section>

        {err && <p style={{ fontFamily: MONO, fontSize: 16, color: '#F87171', marginTop: 8 }}>{err}</p>}

        {/* ── BOUTON GÉNÉRER ───────────────────────────────────────────────── */}
        <button
          onClick={generate} disabled={loading}
          style={{
            ...btnBase, width: '100%', marginTop: 8,
            padding: '20px 36px', fontSize: 19,
            background: loading ? T.orangeDim : 'linear-gradient(135deg, #F97316, #C2410C)',
            border: `1px solid ${T.orange}`,
            color: '#fff',
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 0 24px rgba(249,115,22,0.30)',
          }}
        >
          {loading ? '⏳ GÉNÉRATION EN COURS...' : '📄 GÉNÉRER LE RAPPORT'}
        </button>
      </>)}

      {/* ══ PRÉVISUALISATION ════════════════════════════════════════════════ */}
      {step === 'preview' && (<>
        {/* Badge gravité + patient */}
        <div style={{
          padding: '12px 20px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          background: g.bg, border: `1px solid ${g.border}`,
          borderLeft: `3px solid ${g.dot}`,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 700, color: g.text, letterSpacing: '0.12em' }}>{g.label}</span>
          <span style={{ color: T.borderSub }}>—</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 19, color: T.muted }}>{vals.civilite} {vals.prenom} {vals.nom}</span>
        </div>

        {/* Rapport */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderLeft: `3px solid ${T.orange}`,
          padding: '20px 24px',
        }}>
          <textarea
            value={report} onChange={e => setReport(e.target.value)} rows={50}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'transparent', border: 'none', outline: 'none',
              color: T.text, fontFamily: MONO, fontSize: 17,
              lineHeight: 1.7, resize: 'vertical',
            }}
          />
        </div>

        {err && <p style={{ fontFamily: MONO, fontSize: 16, color: '#F87171', marginTop: 8 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={save} disabled={saving} style={{
            ...btnBase, flex: 1, padding: '18px 36px', fontSize: 18,
            background: saving ? T.orangeDim : 'linear-gradient(135deg, #F97316, #C2410C)',
            border: `1px solid ${T.orange}`, color: '#fff',
            opacity: saving ? 0.6 : 1,
            boxShadow: saving ? 'none' : '0 0 20px rgba(249,115,22,0.25)',
          }}>
            {saving ? '💾 SAUVEGARDE...' : '💾 SAUVEGARDER DANS LES ARCHIVES'}
          </button>
          <button onClick={() => setStep('form')} style={{
            ...btnBase, padding: '18px 28px', fontSize: 18,
            background: 'transparent',
            border: `1px solid ${T.borderSub}`,
            color: T.muted,
          }}>✏️ MODIFIER</button>
        </div>
      </>)}
    </div>
  );
}
