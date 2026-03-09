'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const blessures = [
  // Fractures & Os
  { label: 'Fracture simple', categorie: 'Os & Articulations', diagnostic: 'Fracture simple du membre', fc: '95', ta: '125/80', spo2: '97', temperature: '37.0', douleur: '6/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + Attelle' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', fc: '110', ta: '110/70', spo2: '96', temperature: '37.2', douleur: '8/10', examen: 'Radiologie + bilan sanguin', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + Céfazoline 2g IV + pansement stérile + immobilisation + chirurgie' },
  { label: 'Fissure osseuse', categorie: 'Os & Articulations', diagnostic: 'Fissure osseuse non déplacée', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + Attelle + repos' },
  { label: 'Luxation', categorie: 'Os & Articulations', diagnostic: 'Luxation articulaire', fc: '100', ta: '130/80', spo2: '98', temperature: '37.0', douleur: '7/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Kétoprofène 100mg x2/jour + réduction articulaire + écharpe' },
  { label: 'Entorse', categorie: 'Os & Articulations', diagnostic: 'Entorse ligamentaire', fc: '80', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique + radiologie si besoin', traitement: 'Ibuprofène 400mg x3/jour + Diclofénac gel 1% x3/jour + attelle + repos' },
  { label: 'Contusion osseuse', categorie: 'Os & Articulations', diagnostic: 'Contusion osseuse sans fracture visible', fc: '78', ta: '118/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + glace + repos' },

  // Plaies
  { label: 'Plaie ouverte / lacération', categorie: 'Plaies', diagnostic: 'Plaie profonde avec atteinte des tissus mous', fc: '95', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Amoxicilline/acide clavulanique 1g x3/jour + désinfection + suture + pansement' },
  { label: 'Plaie superficielle', categorie: 'Plaies', diagnostic: 'Plaie superficielle cutanée', fc: '78', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '2/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour si douleur + Chlorhexidine locale + pansement' },
  { label: 'Hématome', categorie: 'Plaies', diagnostic: 'Hématome sous-cutané post-traumatique', fc: '80', ta: '120/80', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Diclofénac gel 1% x3/jour + glace' },
  { label: 'Écrasement de membre', categorie: 'Plaies', diagnostic: 'Traumatisme par écrasement avec risque de syndrome de loge', fc: '115', ta: '110/70', spo2: '96', temperature: '37.5', douleur: '9/10', examen: 'Radiologie + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + NaCl 0.9% IV + immobilisation + surveillance chirurgicale' },
  { label: 'Amputation traumatique', categorie: 'Plaies', diagnostic: 'Amputation traumatique partielle ou complète', fc: '140', ta: '90/60', spo2: '93', temperature: '36.5', douleur: '10/10', examen: 'Examen clinique + bilan sanguin', traitement: 'Morphine 5mg IV + Acide tranexamique 1g IV + Céfazoline 2g IV + garrot/pansement compressif + chirurgie' },
  { label: 'Corps étranger dans plaie', categorie: 'Plaies', diagnostic: 'Plaie avec corps étranger inclus', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Radiologie', traitement: 'Lidocaïne 1% locale + Paracétamol 1g x3/jour + Amoxicilline/acide clavulanique 1g x3/jour + extraction + pansement' },

  // Armes
  { label: 'BPB traversante', categorie: 'Armes', diagnostic: 'Plaie par balle traversante', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', douleur: '9/10', examen: 'Scanner + radiologie + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + Céfazoline 2g IV + perfusion + chirurgie si nécessaire' },
  { label: 'BPB non traversante', categorie: 'Armes', diagnostic: 'Plaie par balle non traversante avec projectile retenu', fc: '110', ta: '115/75', spo2: '96', temperature: '37.0', douleur: '8/10', examen: 'Radiologie + scanner', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 4mg IV + Amoxicilline/acide clavulanique 1g x3/jour + pansement + extraction chirurgicale si besoin' },
  { label: 'Arme blanche', categorie: 'Armes', diagnostic: 'Plaie pénétrante par arme blanche', fc: '110', ta: '115/75', spo2: '95', temperature: '37.0', douleur: '8/10', examen: 'Examen clinique + scanner si profondeur', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + Amoxicilline/acide clavulanique 1g x3/jour + suture ou chirurgie' },
  { label: 'Éclats métalliques', categorie: 'Armes', diagnostic: 'Plaie avec fragments métalliques', fc: '100', ta: '120/80', spo2: '97', temperature: '37.0', douleur: '6/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Lidocaïne 1% locale + Amoxicilline/acide clavulanique 1g x3/jour + extraction + pansement' },

  // Brûlures
  { label: 'Brûlure 1er degré', categorie: 'Brûlures', diagnostic: 'Brûlure superficielle du 1er degré', fc: '85', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + crème apaisante + hydratation' },
  { label: 'Brûlure 2e degré superficiel', categorie: 'Brûlures', diagnostic: 'Brûlure du 2e degré superficiel', fc: '100', ta: '125/80', spo2: '98', temperature: '37.2', douleur: '7/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 4mg IV si douleur + Sulfadiazine argentique 1% + pansement' },
  { label: 'Brûlure 2e degré profond', categorie: 'Brûlures', diagnostic: 'Brûlure du 2e degré profond', fc: '110', ta: '115/70', spo2: '97', temperature: '37.5', douleur: '8/10', examen: 'Examen clinique + bilan sanguin si étendue', traitement: 'Paracétamol 1g x3/jour + Morphine 3 à 5mg IV + Sulfadiazine argentique 1% + pansement spécialisé' },
  { label: 'Brûlure 3e degré', categorie: 'Brûlures', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', fc: '130', ta: '100/65', spo2: '95', temperature: '38.0', douleur: '10/10', examen: 'Examen clinique + bilan sanguin', traitement: 'Morphine 3 à 5mg IV + Ringer lactate IV + pansement stérile + chirurgie' },
  { label: 'Brûlure chimique', categorie: 'Brûlures', diagnostic: 'Brûlure chimique cutanée', fc: '105', ta: '120/75', spo2: '97', temperature: '37.2', douleur: '7/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV si douleur + rinçage abondant + pansement' },
  { label: 'Brûlure électrique', categorie: 'Brûlures', diagnostic: 'Brûlure électrique avec risque de lésion profonde', fc: '115', ta: '120/75', spo2: '96', temperature: '37.5', douleur: '7/10', examen: 'ECG + bilan sanguin', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + perfusion IV + surveillance cardiaque' },

  // Crâne
  { label: 'Traumatisme crânien léger', categorie: 'Crâne & Neurologie', diagnostic: 'Traumatisme crânien léger', fc: '85', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Scanner cérébral si besoin + examen neurologique', traitement: 'Paracétamol 1g x3/jour + surveillance neurologique' },
  { label: 'Commotion cérébrale', categorie: 'Crâne & Neurologie', diagnostic: 'Commotion cérébrale', fc: '90', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen neurologique + scanner si signes d\'alerte', traitement: 'Paracétamol 1g x3/jour + repos neurologique' },
  { label: 'Traumatisme crânien sévère', categorie: 'Crâne & Neurologie', diagnostic: 'Traumatisme crânien sévère', fc: '120', ta: '150/90', spo2: '93', temperature: '38.0', douleur: '9/10', examen: 'Scanner cérébral + bilan sanguin', traitement: 'Intubation si besoin + Mannitol 0.25 à 1g/kg IV ou NaCl hypertonique + soins intensifs' },
  { label: 'Hémorragie intracrânienne', categorie: 'Crâne & Neurologie', diagnostic: 'Hémorragie intracrânienne traumatique', fc: '110', ta: '170/100', spo2: '94', temperature: '38.0', douleur: '10/10', examen: 'Scanner cérébral', traitement: 'Mannitol 0.25 à 1g/kg IV ou NaCl hypertonique + neurochirurgie' },
  { label: 'Plaie du cuir chevelu', categorie: 'Crâne & Neurologie', diagnostic: 'Plaie du cuir chevelu', fc: '95', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique', traitement: 'Lidocaïne 1% locale + Paracétamol 1g x3/jour + suture/agrafes + pansement' },

  // Polytraumatisme
  { label: 'Polytraumatisme', categorie: 'Traumatismes graves', diagnostic: 'Polytraumatisme', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', douleur: '10/10', examen: 'Scanner corps entier + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + perfusion/transfusion + chirurgie selon lésions' },
  { label: 'Traumatisme thoracique', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme thoracique', fc: '120', ta: '110/70', spo2: '91', temperature: '37.0', douleur: '8/10', examen: 'Radiographie thorax + scanner', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + oxygène + drain thoracique si besoin' },
  { label: 'Traumatisme abdominal', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme abdominal', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', douleur: '8/10', examen: 'FAST + scanner abdomino-pelvien', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + perfusion + chirurgie si hémorragie' },
  { label: 'Traumatisme rachidien', categorie: 'Traumatismes graves', diagnostic: 'Suspicion de traumatisme rachidien', fc: '95', ta: '115/75', spo2: '95', temperature: '37.0', douleur: '7/10', examen: 'Scanner rachis', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + immobilisation rachidienne' },
  { label: 'Traumatisme pelvien', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme pelvien avec risque hémorragique', fc: '130', ta: '95/60', spo2: '94', temperature: '37.0', douleur: '9/10', examen: 'Radiographie bassin + scanner', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + ceinture pelvienne + chirurgie/embolisation' },

  // Muscles
  { label: 'Élongation musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Élongation musculaire', fc: '78', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + repos' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Déchirure musculaire partielle', fc: '90', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '6/10', examen: 'Échographie', traitement: 'Paracétamol 1g x3/jour + Kétoprofène 100mg x2/jour + repos + compression' },
  { label: 'Rupture de tendon', categorie: 'Muscles & Tendons', diagnostic: 'Rupture tendineuse', fc: '88', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '6/10', examen: 'Échographie ou IRM', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + immobilisation + chirurgie si besoin' },
  { label: 'Contracture musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Contracture musculaire', fc: '75', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + repos' },

  // Tête
  { label: 'Cocard / hématome orbitaire', categorie: 'Tête & Yeux', diagnostic: 'Hématome orbitaire', fc: '80', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen oculaire', traitement: 'Paracétamol 1g x3/jour + glace' },
  { label: 'Corps étranger dans l\'œil', categorie: 'Tête & Yeux', diagnostic: 'Corps étranger cornéen', fc: '82', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '4/10', examen: 'Lampe à fente', traitement: 'Érythromycine ophtalmique 0.5% x4/jour + retrait du corps étranger' },
  { label: 'Perforation oculaire', categorie: 'Tête & Yeux', diagnostic: 'Plaie perforante du globe oculaire', fc: '100', ta: '130/80', spo2: '97', temperature: '37.0', douleur: '8/10', examen: 'Scanner orbitaire', traitement: 'Morphine 2 à 4mg IV + Céfazoline 2g IV + coque de protection + chirurgie urgente' },
  { label: 'Fracture du nez', categorie: 'Tête & Yeux', diagnostic: 'Fracture des os propres du nez', fc: '85', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + glace + réduction si besoin' },
  { label: 'Traumatisme dentaire', categorie: 'Tête & Yeux', diagnostic: 'Traumatisme dento-alvéolaire', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen bucco-dentaire', traitement: 'Paracétamol 1g x3/jour + Amoxicilline 1g x3/jour + contention / soin dentaire urgent' },

  // Autres
  { label: 'Intoxication', categorie: 'Autres', diagnostic: 'Intoxication aiguë', fc: '110', ta: '110/70', spo2: '94', temperature: '37.5', douleur: '5/10', examen: 'Bilan sanguin + ECG', traitement: 'Charbon activé 50g + perfusion IV + antidote si connu' },
  { label: 'Réaction allergique', categorie: 'Autres', diagnostic: 'Réaction allergique aiguë', fc: '115', ta: '100/65', spo2: '93', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique', traitement: 'Adrénaline 0.3 à 0.5mg IM + Cétirizine 10mg + Méthylprednisolone 40 à 80mg IV' },
  { label: 'Crise d\'asthme', categorie: 'Autres', diagnostic: 'Exacerbation aiguë d\'asthme', fc: '120', ta: '130/80', spo2: '90', temperature: '37.0', douleur: '5/10', examen: 'Auscultation + saturation', traitement: 'Salbutamol 2.5 à 5mg nébulisé + Ipratropium 0.5mg nébulisé + Prednisone 40mg/jour' },
  { label: 'Hypothermie', categorie: 'Autres', diagnostic: 'Hypothermie', fc: '50', ta: '90/60', spo2: '92', temperature: '32.0', douleur: '3/10', examen: 'Température centrale + ECG', traitement: 'Réchauffement passif/actif + NaCl 0.9% tiédi IV' },
  { label: 'Coup de chaleur', categorie: 'Autres', diagnostic: 'Hyperthermie par coup de chaleur', fc: '145', ta: '100/60', spo2: '94', temperature: '40.5', douleur: '4/10', examen: 'Température centrale + bilan sanguin', traitement: 'Refroidissement rapide + NaCl 0.9% IV' },
  { label: 'Noyade', categorie: 'Autres', diagnostic: 'Détresse respiratoire secondaire à immersion', fc: '130', ta: '105/70', spo2: '88', temperature: '35.0', douleur: '4/10', examen: 'Gaz du sang + radiographie thorax', traitement: 'Oxygène + ventilation si besoin + surveillance hospitalière' },
];

const categories = [...new Set(blessures.map(b => b.categorie))];

const templateConfigs: Record<string, {
  title: string;
  icon: string;
  fields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
  template: string;
  hasBlessures?: boolean;
}> = {
  traumatologie: {
    title: 'Traumatologie',
    icon: '🦴',
    hasBlessures: true,
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Sullivan', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Eleanor', required: true },
      { key: 'age', label: 'Âge / Date de naissance', type: 'text', placeholder: 'Ex: 28 ans' },
      { key: 'motif', label: 'Motif de consultation', type: 'textarea', placeholder: 'Ex: AVP moto à haute vitesse', required: true },
      { key: 'antecedents', label: 'Antécédents médicaux', type: 'textarea', placeholder: 'Ex: antécédents chirurgicaux au genou droit' },
      { key: 'traitements_cours', label: 'Traitements en cours', type: 'text', placeholder: 'Ex: aucun' },
      { key: 'circonstances', label: 'Circonstances de l\'événement', type: 'textarea', placeholder: 'Ex: chute de moto à ~100km/h' },
      { key: 'fc', label: 'FC (fréquence cardiaque)', type: 'text', placeholder: 'Ex: 88 bpm' },
      { key: 'ta', label: 'TA (tension artérielle)', type: 'text', placeholder: 'Ex: 120/80 mmHg' },
      { key: 'spo2', label: 'SpO₂', type: 'text', placeholder: 'Ex: 98%' },
      { key: 'temperature', label: 'Température', type: 'text', placeholder: 'Ex: 37.2°C' },
      { key: 'douleur', label: 'Douleur (EVA /10)', type: 'text', placeholder: 'Ex: 7/10' },
      { key: 'examen', label: 'Examen clinique', type: 'textarea', placeholder: 'État général, observations...', required: true },
      { key: 'radiographie', label: 'Radiographie', type: 'textarea', placeholder: 'Ex: microlésions rotule...' },
      { key: 'irm', label: 'IRM / Scanner', type: 'textarea', placeholder: 'Ex: microdéchirures...' },
      { key: 'analyses', label: 'Analyses', type: 'text', placeholder: 'Ex: bilan sanguin normal' },
      { key: 'diagnostic_principal', label: 'Diagnostic principal', type: 'text', placeholder: 'Ex: traumatisme genou droit', required: true },
      { key: 'diagnostic_secondaire', label: 'Diagnostic secondaire', type: 'text', placeholder: 'Ex: contusion tibiale' },
      { key: 'soins', label: 'Soins effectués', type: 'textarea', placeholder: 'Ex: nettoyage plaie, suture...' },
      { key: 'chirurgie', label: 'Intervention chirurgicale', type: 'text', placeholder: 'Ex: aucune / réduction fracture' },
      { key: 'traitements_admin', label: 'Traitements administrés', type: 'textarea', placeholder: 'Ex: morphine 5mg IV' },
      { key: 'antalgique', label: 'Antalgique prescrit', type: 'text', placeholder: 'Ex: Paracétamol 1g x3/jour' },
      { key: 'anti_inflammatoire', label: 'Anti-inflammatoire', type: 'text', placeholder: 'Ex: Ibuprofène 400mg x3/jour' },
      { key: 'antibiotique', label: 'Antibiotique', type: 'text', placeholder: 'Ex: aucun' },
      { key: 'autre_traitement', label: 'Autre traitement', type: 'text', placeholder: 'Ex: attelle Zimmer' },
      { key: 'repos', label: 'Repos / immobilisation', type: 'text', placeholder: 'Ex: attelle 3 semaines' },
      { key: 'restrictions', label: 'Restrictions physiques', type: 'text', placeholder: 'Ex: pas d\'appui' },
      { key: 'surveillance', label: 'Surveillance particulière', type: 'text', placeholder: 'Ex: surveiller œdème' },
      { key: 'suivi_date', label: 'Date du prochain contrôle', type: 'date', placeholder: '' },
      { key: 'examens_suivi', label: 'Examens de suivi', type: 'text', placeholder: 'Ex: radio de contrôle' },
      { key: 'conclusion', label: 'Conclusion', type: 'textarea', placeholder: 'Résumé de l\'état et évolution attendue', required: true },
      { key: 'medecin', label: 'Médecin', type: 'text', placeholder: 'Ex: Dr Tellez Eziel', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `RAPPORT MÉDICAL
===============

Date : {{date}}                    Heure : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge / Date de naissance : {{age}}

MOTIF DE CONSULTATION
---------------------
{{motif}}

CONTEXTE / ANTÉCÉDENTS
----------------------
Antécédents médicaux connus : {{antecedents}}
Traitements en cours : {{traitements_cours}}
Circonstances de l'événement : {{circonstances}}

CONSTANTES VITALES
------------------
FC : {{fc}} bpm
TA : {{ta}} mmHg
SpO₂ : {{spo2}} %
Température : {{temperature}} °C
Douleur (EVA /10) : {{douleur}}

EXAMEN CLINIQUE
---------------
{{examen}}

EXAMENS COMPLÉMENTAIRES
-----------------------
Radiographie : {{radiographie}}
IRM / Scanner : {{irm}}
Analyses : {{analyses}}

DIAGNOSTIC
----------
Diagnostic principal : {{diagnostic_principal}}
Diagnostic secondaire : {{diagnostic_secondaire}}

PRISE EN CHARGE / ACTES RÉALISÉS
---------------------------------
Soins effectués : {{soins}}
Intervention chirurgicale : {{chirurgie}}
Traitements administrés : {{traitements_admin}}

TRAITEMENT PRESCRIT
-------------------
Antalgique : {{antalgique}}
Anti-inflammatoire : {{anti_inflammatoire}}
Antibiotique : {{antibiotique}}
Autre traitement : {{autre_traitement}}

RECOMMANDATIONS
---------------
Repos / immobilisation : {{repos}}
Restrictions physiques : {{restrictions}}
Surveillance particulière : {{surveillance}}

SUIVI MÉDICAL
-------------
Date du prochain contrôle : {{suivi_date}}
Examens de suivi nécessaires : {{examens_suivi}}

CONCLUSION
----------
{{conclusion}}

PERSONNEL MÉDICAL
-----------------
Médecin : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  chirurgie: {
    title: 'Chirurgie',
    icon: '🔪',
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Dupont', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Jean', required: true },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 35 ans' },
      { key: 'type_intervention', label: 'Type d\'intervention', type: 'text', placeholder: 'Ex: appendicectomie', required: true },
      { key: 'indication', label: 'Indication opératoire', type: 'textarea', placeholder: 'Pourquoi cette opération ?' },
      { key: 'deroulement', label: 'Déroulement de l\'opération', type: 'textarea', placeholder: 'Comment s\'est passée l\'opération ?', required: true },
      { key: 'complications', label: 'Complications éventuelles', type: 'textarea', placeholder: 'Ex: aucune / saignement contrôlé...' },
      { key: 'postop', label: 'Consignes post-opératoires', type: 'textarea', placeholder: 'Ex: repos, pansement à changer...' },
      { key: 'medecin', label: 'Chirurgien', type: 'text', placeholder: 'Ex: Dr Martin', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `COMPTE-RENDU OPÉRATOIRE
=======================

Date : {{date}}                    Heure : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge : {{age}}

TYPE D'INTERVENTION
-------------------
{{type_intervention}}

INDICATION OPÉRATOIRE
---------------------
{{indication}}

DÉROULEMENT DE L'INTERVENTION
------------------------------
{{deroulement}}

COMPLICATIONS PEROPÉRATOIRES
-----------------------------
{{complications}}

CONSIGNES POST-OPÉRATOIRES
---------------------------
{{postop}}

PERSONNEL MÉDICAL
-----------------
Chirurgien : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  consultation: {
    title: 'Consultation générale',
    icon: '🩺',
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Mme Lefebvre', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Marie', required: true },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 42 ans' },
      { key: 'motif', label: 'Motif de consultation', type: 'text', placeholder: 'Ex: douleurs abdominales', required: true },
      { key: 'symptomes', label: 'Symptômes décrits', type: 'textarea', placeholder: 'Ce que le patient ressent', required: true },
      { key: 'antecedents', label: 'Antécédents', type: 'textarea', placeholder: 'Ex: aucun' },
      { key: 'examen', label: 'Examen clinique', type: 'textarea', placeholder: 'Résultats de votre examen' },
      { key: 'diagnostic', label: 'Diagnostic', type: 'text', placeholder: 'Ex: gastro-entérite aiguë', required: true },
      { key: 'traitement', label: 'Traitement prescrit', type: 'textarea', placeholder: 'Médicaments, posologie...' },
      { key: 'conseils', label: 'Conseils au patient', type: 'textarea', placeholder: 'Ex: repos, hydratation...' },
      { key: 'suivi', label: 'Suivi', type: 'text', placeholder: 'Ex: revoir dans 1 semaine si pas d\'amélioration' },
      { key: 'medecin', label: 'Médecin', type: 'text', placeholder: 'Ex: Dr Bernard', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `COMPTE-RENDU DE CONSULTATION
============================

Date : {{date}}                    Heure : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge : {{age}}

MOTIF DE CONSULTATION
---------------------
{{motif}}

SYMPTÔMES DÉCRITS
-----------------
{{symptomes}}

ANTÉCÉDENTS
-----------
{{antecedents}}

EXAMEN CLINIQUE
---------------
{{examen}}

DIAGNOSTIC
----------
{{diagnostic}}

TRAITEMENT PRESCRIT
-------------------
{{traitement}}

CONSEILS AU PATIENT
-------------------
{{conseils}}

SUIVI
-----
{{suivi}}

PERSONNEL MÉDICAL
-----------------
Médecin : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  urgence: {
    title: 'Urgence vitale',
    icon: '🚨',
    hasBlessures: true,
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure d\'arrivée', type: 'time', placeholder: '', required: true },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Garcia', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Pablo', required: true },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 30 ans' },
      { key: 'motif', label: 'Nature de l\'urgence', type: 'text', placeholder: 'Ex: arrêt cardiaque, polytraumatisme...', required: true },
      { key: 'fc', label: 'FC', type: 'text', placeholder: 'Ex: 120 bpm' },
      { key: 'ta', label: 'TA', type: 'text', placeholder: 'Ex: 80/50 mmHg' },
      { key: 'spo2', label: 'SpO₂', type: 'text', placeholder: 'Ex: 88%' },
      { key: 'temperature', label: 'Température', type: 'text', placeholder: 'Ex: 38.5°C' },
      { key: 'douleur', label: 'Douleur (EVA /10)', type: 'text', placeholder: 'Ex: 9/10' },
      { key: 'gestes', label: 'Gestes d\'urgence réalisés', type: 'textarea', placeholder: 'Ex: intubation, massage cardiaque...', required: true },
      { key: 'medicaments', label: 'Médicaments administrés', type: 'textarea', placeholder: 'Ex: adrénaline 1mg IV...' },
      { key: 'evolution', label: 'Évolution', type: 'textarea', placeholder: 'Ex: stabilisation, transfert...', required: true },
      { key: 'medecin', label: 'Médecin urgentiste', type: 'text', placeholder: 'Ex: Dr Rousseau', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `RAPPORT D'URGENCE VITALE
========================

Date : {{date}}                    Heure d'arrivée : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge : {{age}}

NATURE DE L'URGENCE
-------------------
{{motif}}

CONSTANTES VITALES À L'ARRIVÉE
-------------------------------
FC : {{fc}} bpm
TA : {{ta}} mmHg
SpO₂ : {{spo2}} %
Température : {{temperature}} °C
Douleur (EVA /10) : {{douleur}}

GESTES D'URGENCE RÉALISÉS
--------------------------
{{gestes}}

MÉDICAMENTS ADMINISTRÉS
------------------------
{{medicaments}}

ÉVOLUTION ET ORIENTATION
------------------------
{{evolution}}

PERSONNEL MÉDICAL
-----------------
Médecin urgentiste : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  intoxication: {
    title: 'Intoxication',
    icon: '☠️',
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Torres', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Diego', required: true },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 25 ans' },
      { key: 'substance', label: 'Substance(s) en cause', type: 'text', placeholder: 'Ex: alcool, cocaïne...', required: true },
      { key: 'dose', label: 'Dose / quantité estimée', type: 'text', placeholder: 'Ex: ~500ml alcool fort' },
      { key: 'symptomes', label: 'Symptômes observés', type: 'textarea', placeholder: 'Ex: confusion, vomissements...', required: true },
      { key: 'fc', label: 'FC', type: 'text', placeholder: 'Ex: 110 bpm' },
      { key: 'ta', label: 'TA', type: 'text', placeholder: 'Ex: 95/60 mmHg' },
      { key: 'spo2', label: 'SpO₂', type: 'text', placeholder: 'Ex: 94%' },
      { key: 'traitement', label: 'Traitement administré', type: 'textarea', placeholder: 'Ex: perfusion, charbon activé...', required: true },
      { key: 'antidote', label: 'Antidote utilisé', type: 'text', placeholder: 'Ex: Narcan (naloxone)' },
      { key: 'evolution', label: 'Évolution', type: 'textarea', placeholder: 'Ex: amélioration progressive...' },
      { key: 'recommandations', label: 'Recommandations de suivi', type: 'textarea', placeholder: 'Ex: consultation addictologie...' },
      { key: 'medecin', label: 'Médecin', type: 'text', placeholder: 'Ex: Dr Chen', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `RAPPORT D'INTOXICATION
======================

Date : {{date}}                    Heure : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge : {{age}}

SUBSTANCE(S) EN CAUSE
---------------------
Substance(s) : {{substance}}
Dose / quantité estimée : {{dose}}

TABLEAU CLINIQUE
----------------
Symptômes observés : {{symptomes}}

CONSTANTES VITALES
------------------
FC : {{fc}} bpm
TA : {{ta}} mmHg
SpO₂ : {{spo2}} %

PRISE EN CHARGE ET TRAITEMENT
------------------------------
{{traitement}}

ANTIDOTE UTILISÉ
----------------
{{antidote}}

ÉVOLUTION
---------
{{evolution}}

RECOMMANDATIONS DE SUIVI
------------------------
{{recommandations}}

PERSONNEL MÉDICAL
-----------------
Médecin : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  psychiatrie: {
    title: 'Psychiatrie',
    icon: '🧠',
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Mme Blanc', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Sophie', required: true },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 32 ans' },
      { key: 'motif', label: 'Motif de consultation', type: 'text', placeholder: 'Ex: crise anxieuse', required: true },
      { key: 'comportement', label: 'Comportement et état mental observé', type: 'textarea', placeholder: 'Ex: agitation, discours incohérent...', required: true },
      { key: 'antecedents', label: 'Antécédents psychiatriques', type: 'textarea', placeholder: 'Ex: dépression connue...' },
      { key: 'diagnostic', label: 'Diagnostic psychiatrique', type: 'text', placeholder: 'Ex: épisode dépressif majeur', required: true },
      { key: 'traitement', label: 'Traitement prescrit', type: 'textarea', placeholder: 'Ex: anxiolytiques...' },
      { key: 'suivi', label: 'Suivi recommandé', type: 'textarea', placeholder: 'Ex: consultation psychiatre dans 1 semaine...' },
      { key: 'medecin', label: 'Médecin psychiatre', type: 'text', placeholder: 'Ex: Dr Moreau', required: true },
      { key: 'assistant', label: 'Assistant / Étudiant', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    template: `BILAN PSYCHIATRIQUE
===================

Date : {{date}}                    Heure : {{heure}}

IDENTITÉ DU PATIENT
-------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge : {{age}}

MOTIF DE CONSULTATION
---------------------
{{motif}}

EXAMEN PSYCHIATRIQUE
--------------------
Comportement et état mental : {{comportement}}

ANTÉCÉDENTS PSYCHIATRIQUES
---------------------------
{{antecedents}}

DIAGNOSTIC
----------
{{diagnostic}}

PLAN DE TRAITEMENT
------------------
{{traitement}}

RECOMMANDATIONS ET SUIVI
------------------------
{{suivi}}

PERSONNEL MÉDICAL
-----------------
Médecin psychiatre : {{medecin}}
Assistant / Étudiant : {{assistant}}

Signature : ___________________________`,
  },
  legiste: {
    title: 'Médecin légiste',
    icon: '🔍',
    fields: [
      { key: 'date', label: 'Date d\'examen', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure', type: 'time', placeholder: '' },
      { key: 'nom', label: 'Nom de la victime', type: 'text', placeholder: 'Ex: M. Noir', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Inconnu' },
      { key: 'age', label: 'Âge estimé', type: 'text', placeholder: 'Ex: ~40 ans' },
      { key: 'lieu', label: 'Lieu de découverte', type: 'text', placeholder: 'Ex: entrepôt abandonné...' },
      { key: 'circonstances', label: 'Circonstances', type: 'textarea', placeholder: 'Ex: retrouvé sans vie, blessure par balle...' },
      { key: 'examen_externe', label: 'Examen externe du corps', type: 'textarea', placeholder: 'Ex: blessures visibles...', required: true },
      { key: 'lesions', label: 'Lésions constatées', type: 'textarea', placeholder: 'Ex: plaie pénétrante thoracique...', required: true },
      { key: 'cause_deces', label: 'Cause probable du décès', type: 'text', placeholder: 'Ex: hémorragie interne massive', required: true },
      { key: 'conclusions', label: 'Conclusions médico-légales', type: 'textarea', placeholder: 'Ex: mort violente, homicide probable...', required: true },
      { key: 'medecin', label: 'Médecin légiste', type: 'text', placeholder: 'Ex: Dr Legrand', required: true },
    ],
    template: `RAPPORT MÉDICO-LÉGAL
====================

Date d'examen : {{date}}           Heure : {{heure}}

IDENTITÉ DE LA VICTIME
----------------------
Nom : {{nom}}
Prénom : {{prenom}}
Âge estimé : {{age}}

CIRCONSTANCES DE DÉCOUVERTE
----------------------------
Lieu : {{lieu}}
Circonstances : {{circonstances}}

EXAMEN EXTERNE
--------------
{{examen_externe}}

LÉSIONS TRAUMATIQUES CONSTATÉES
--------------------------------
{{lesions}}

CAUSE ET MÉCANISME DU DÉCÈS
----------------------------
Cause probable : {{cause_deces}}

CONCLUSIONS MÉDICO-LÉGALES
---------------------------
{{conclusions}}

PERSONNEL MÉDICAL
-----------------
Médecin légiste : {{medecin}}

Signature : ___________________________`,
  },
  deces: {
    title: 'Certificat de décès',
    icon: '📋',
    fields: [
      { key: 'nom', label: 'Nom du défunt', type: 'text', placeholder: 'Ex: M. Durant', required: true },
      { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Pierre', required: true },
      { key: 'date_naissance', label: 'Date de naissance', type: 'date', placeholder: '' },
      { key: 'date_deces', label: 'Date du décès', type: 'date', placeholder: '', required: true },
      { key: 'heure_deces', label: 'Heure du décès', type: 'time', placeholder: '' },
      { key: 'lieu_deces', label: 'Lieu du décès', type: 'text', placeholder: 'Ex: Hôpital de Los Santos', required: true },
      { key: 'cause_immediate', label: 'Cause immédiate du décès', type: 'text', placeholder: 'Ex: arrêt cardiaque', required: true },
      { key: 'cause_initiale', label: 'Cause initiale', type: 'text', placeholder: 'Ex: polytraumatisme suite à AVP' },
      { key: 'medecin', label: 'Médecin certificateur', type: 'text', placeholder: 'Ex: Dr Petit', required: true },
    ],
    template: `CERTIFICAT DE DÉCÈS
===================

IDENTITÉ DU DÉFUNT
------------------
Nom : {{nom}}
Prénom : {{prenom}}
Date de naissance : {{date_naissance}}

CONSTATATION DU DÉCÈS
---------------------
Date du décès : {{date_deces}}
Heure du décès : {{heure_deces}}
Lieu du décès : {{lieu_deces}}

CAUSE DU DÉCÈS
--------------
Cause immédiate : {{cause_immediate}}
Cause initiale / pathologie sous-jacente : {{cause_initiale}}

DÉCLARATION OFFICIELLE
----------------------
Je soussigné(e), certifie avoir constaté le décès de la personne désignée ci-dessus.

MÉDECIN CERTIFICATEUR
---------------------
Médecin : {{medecin}}

Signature : ___________________________`,
  },
};

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const config = templateConfigs[templateId];
  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedReport, setGeneratedReport] = useState('');
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showBlessures, setShowBlessures] = useState(false);
  const [categorieActive, setCategorieActive] = useState(categories[0]);

  if (!config) {
    return <div className="text-red-400">Template introuvable.</div>;
  }

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  function appliquerBlessure(b: typeof blessures[0]) {
    setValues(prev => ({
      ...prev,
      diagnostic_principal: b.diagnostic,
      fc: b.fc,
      ta: b.ta,
      spo2: b.spo2,
      temperature: b.temperature,
      douleur: b.douleur,
      examen: b.examen,
      traitements_admin: b.traitement,
      motif: prev.motif || b.label,
    }));
    setShowBlessures(false);
  }

  async function generateReport() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: config.template, values }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setGeneratedReport(data.report);
      setStep('preview');
    } catch {
      setError('Erreur lors de la génération du rapport.');
    }
    setLoading(false);
  }

  async function saveReport() {
    setSaving(true);
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non authentifié'); setSaving(false); return; }

    const patientName = `${values['nom'] || ''} ${values['prenom'] || ''}`.trim() || 'Inconnu';
    const filename = `${templateId}_${patientName.replace(/\s/g, '_')}_${Date.now()}.txt`;
    const storagePath = `${user.id}/${filename}`;

    const { error: archiveError } = await supabase.from('archives').insert({
      owner_id: user.id,
      universe: 'fivem',
      template_name: config.title,
      patient_name: patientName,
      storage_path: storagePath,
      filename,
      field_values: values,
      rendered_body: generatedReport,
    });

    if (archiveError) {
      setError('Erreur lors de la sauvegarde : ' + archiveError.message);
      setSaving(false);
      return;
    }
    router.push('/fivem/archives');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <button onClick={() => step === 'preview' ? setStep('form') : router.back()} className="text-gray-400 hover:text-white transition">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-orange-400">{config.icon} {config.title}</h1>
        <span className="text-xs text-gray-500 bg-slate-800 px-2 py-1 rounded-full">
          {step === 'form' ? 'Étape 1 : Informations' : 'Étape 2 : Rapport généré'}
        </span>
      </div>

      {step === 'form' && (
        <>
          {config.hasBlessures && (
            <div className="mb-6">
              <button
                onClick={() => setShowBlessures(!showBlessures)}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-orange-300 font-medium rounded-xl px-6 py-3 transition flex items-center justify-between"
              >
                <span>🩹 Raccourcis blessures — remplissage automatique</span>
                <span>{showBlessures ? '▲' : '▼'}</span>
              </button>

              {showBlessures && (
                <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  {/* Catégories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategorieActive(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full transition ${
                          categorieActive === cat
                            ? 'bg-orange-700 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {/* Blessures de la catégorie */}
                  <div className="flex flex-wrap gap-2">
                    {blessures.filter(b => b.categorie === categorieActive).map(b => (
                      <button
                        key={b.label}
                        onClick={() => appliquerBlessure(b)}
                        className="text-xs bg-slate-700 hover:bg-orange-800 border border-slate-600 hover:border-orange-600 text-gray-200 px-3 py-1.5 rounded-lg transition"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-800/30 border border-orange-900/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-300">💡 Remplissez les informations — le rapport se génère automatiquement.</p>
          </div>

          <div className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.key} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <label className="block text-sm text-gray-300 mb-2 font-medium">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    rows={3}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition resize-y text-sm"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={values[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}

          <div className="mt-8">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl px-8 py-4 transition text-lg"
            >
              {loading ? '⏳ Génération en cours...' : '📄 Générer le rapport'}
            </button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="bg-slate-800/30 border border-orange-900/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-300">📄 Voici le rapport généré. Vous pouvez le modifier avant de sauvegarder.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <textarea
              value={generatedReport}
              onChange={e => setGeneratedReport(e.target.value)}
              rows={30}
              className="w-full bg-transparent text-white text-sm font-mono focus:outline-none resize-y leading-relaxed"
            />
          </div>
          {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
          <div className="mt-8 flex gap-4">
            <button
              onClick={saveReport}
              disabled={saving}
              className="flex-1 bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl px-8 py-4 transition"
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder dans les archives'}
            </button>
            <button
              onClick={() => setStep('form')}
              className="border border-slate-600 hover:border-slate-400 text-gray-400 hover:text-white font-medium rounded-xl px-6 py-4 transition"
            >
              ✏️ Modifier
            </button>
          </div>
        </>
      )}
    </div>
  );
}