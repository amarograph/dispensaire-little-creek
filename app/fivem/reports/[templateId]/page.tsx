'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const blessures = [
  { label: 'Fracture simple', categorie: 'Os & Articulations', diagnostic: 'Fracture simple du membre', gravite: '🟡 Jaune', fc: '95', ta: '125/80', spo2: '97', temperature: '37.0', douleur: '6/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + Attelle' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', gravite: '🔴 Rouge', fc: '110', ta: '110/70', spo2: '96', temperature: '37.2', douleur: '8/10', examen: 'Radiologie + bilan sanguin', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + Céfazoline 2g IV + pansement stérile + immobilisation + chirurgie' },
  { label: 'Fissure osseuse', categorie: 'Os & Articulations', diagnostic: 'Fissure osseuse non déplacée', gravite: '🟡 Jaune', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + Attelle + repos' },
  { label: 'Luxation', categorie: 'Os & Articulations', diagnostic: 'Luxation articulaire', gravite: '🟡 Jaune', fc: '100', ta: '130/80', spo2: '98', temperature: '37.0', douleur: '7/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Kétoprofène 100mg x2/jour + réduction articulaire + écharpe' },
  { label: 'Entorse', categorie: 'Os & Articulations', diagnostic: 'Entorse ligamentaire', gravite: '🟢 Vert', fc: '80', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique + radiologie si besoin', traitement: 'Ibuprofène 400mg x3/jour + Diclofénac gel 1% x3/jour + attelle + repos' },
  { label: 'Contusion osseuse', categorie: 'Os & Articulations', diagnostic: 'Contusion osseuse sans fracture visible', gravite: '🟢 Vert', fc: '78', ta: '118/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + glace + repos' },
  { label: 'Plaie ouverte / lacération', categorie: 'Plaies', diagnostic: 'Plaie profonde avec atteinte des tissus mous', gravite: '🟡 Jaune', fc: '95', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Amoxicilline/acide clavulanique 1g x3/jour + désinfection + suture + pansement' },
  { label: 'Plaie superficielle', categorie: 'Plaies', diagnostic: 'Plaie superficielle cutanée', gravite: '🟢 Vert', fc: '78', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '2/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour si douleur + Chlorhexidine locale + pansement' },
  { label: 'Hématome', categorie: 'Plaies', diagnostic: 'Hématome sous-cutané post-traumatique', gravite: '🟢 Vert', fc: '80', ta: '120/80', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Diclofénac gel 1% x3/jour + glace' },
  { label: 'Écrasement de membre', categorie: 'Plaies', diagnostic: 'Traumatisme par écrasement avec risque de syndrome de loge', gravite: '🔴 Rouge', fc: '115', ta: '110/70', spo2: '96', temperature: '37.5', douleur: '9/10', examen: 'Radiologie + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + NaCl 0.9% IV + immobilisation + surveillance chirurgicale' },
  { label: 'Amputation traumatique', categorie: 'Plaies', diagnostic: 'Amputation traumatique partielle ou complète', gravite: '⚫ Noir', fc: '140', ta: '90/60', spo2: '93', temperature: '36.5', douleur: '10/10', examen: 'Examen clinique + bilan sanguin', traitement: 'Morphine 5mg IV + Acide tranexamique 1g IV + Céfazoline 2g IV + garrot/pansement compressif + chirurgie' },
  { label: 'Corps étranger dans plaie', categorie: 'Plaies', diagnostic: 'Plaie avec corps étranger inclus', gravite: '🟡 Jaune', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Radiologie', traitement: 'Lidocaïne 1% locale + Paracétamol 1g x3/jour + Amoxicilline/acide clavulanique 1g x3/jour + extraction + pansement' },
  { label: 'BPB traversante', categorie: 'Armes', diagnostic: 'Plaie par balle traversante', gravite: '🔴 Rouge', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', douleur: '9/10', examen: 'Scanner + radiologie + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + Céfazoline 2g IV + perfusion + chirurgie si nécessaire' },
  { label: 'BPB non traversante', categorie: 'Armes', diagnostic: 'Plaie par balle non traversante avec projectile retenu', gravite: '🔴 Rouge', fc: '110', ta: '115/75', spo2: '96', temperature: '37.0', douleur: '8/10', examen: 'Radiologie + scanner', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 4mg IV + Amoxicilline/acide clavulanique 1g x3/jour + pansement + extraction chirurgicale si besoin' },
  { label: 'Arme blanche', categorie: 'Armes', diagnostic: 'Plaie pénétrante par arme blanche', gravite: '🔴 Rouge', fc: '110', ta: '115/75', spo2: '95', temperature: '37.0', douleur: '8/10', examen: 'Examen clinique + scanner si profondeur', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + Amoxicilline/acide clavulanique 1g x3/jour + suture ou chirurgie' },
  { label: 'Éclats métalliques', categorie: 'Armes', diagnostic: 'Plaie avec fragments métalliques', gravite: '🟡 Jaune', fc: '100', ta: '120/80', spo2: '97', temperature: '37.0', douleur: '6/10', examen: 'Radiologie', traitement: 'Paracétamol 1g x3/jour + Lidocaïne 1% locale + Amoxicilline/acide clavulanique 1g x3/jour + extraction + pansement' },
  { label: 'Brûlure 1er degré', categorie: 'Brûlures', diagnostic: 'Brûlure superficielle du 1er degré', gravite: '🟢 Vert', fc: '85', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + crème apaisante + hydratation' },
  { label: 'Brûlure 2e degré superficiel', categorie: 'Brûlures', diagnostic: 'Brûlure du 2e degré superficiel', gravite: '🟡 Jaune', fc: '100', ta: '125/80', spo2: '98', temperature: '37.2', douleur: '7/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 4mg IV si douleur + Sulfadiazine argentique 1% + pansement' },
  { label: 'Brûlure 2e degré profond', categorie: 'Brûlures', diagnostic: 'Brûlure du 2e degré profond', gravite: '🔴 Rouge', fc: '110', ta: '115/70', spo2: '97', temperature: '37.5', douleur: '8/10', examen: 'Examen clinique + bilan sanguin si étendue', traitement: 'Paracétamol 1g x3/jour + Morphine 3 à 5mg IV + Sulfadiazine argentique 1% + pansement spécialisé' },
  { label: 'Brûlure 3e degré', categorie: 'Brûlures', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', gravite: '⚫ Noir', fc: '130', ta: '100/65', spo2: '95', temperature: '38.0', douleur: '10/10', examen: 'Examen clinique + bilan sanguin', traitement: 'Morphine 3 à 5mg IV + Ringer lactate IV + pansement stérile + chirurgie' },
  { label: 'Brûlure chimique', categorie: 'Brûlures', diagnostic: 'Brûlure chimique cutanée', gravite: '🔴 Rouge', fc: '105', ta: '120/75', spo2: '97', temperature: '37.2', douleur: '7/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV si douleur + rinçage abondant + pansement' },
  { label: 'Brûlure électrique', categorie: 'Brûlures', diagnostic: 'Brûlure électrique avec risque de lésion profonde', gravite: '🔴 Rouge', fc: '115', ta: '120/75', spo2: '96', temperature: '37.5', douleur: '7/10', examen: 'ECG + bilan sanguin', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + perfusion IV + surveillance cardiaque' },
  { label: 'Traumatisme crânien léger', categorie: 'Crâne & Neurologie', diagnostic: 'Traumatisme crânien léger', gravite: '🟡 Jaune', fc: '85', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Scanner cérébral si besoin + examen neurologique', traitement: 'Paracétamol 1g x3/jour + surveillance neurologique' },
  { label: 'Commotion cérébrale', categorie: 'Crâne & Neurologie', diagnostic: 'Commotion cérébrale', gravite: '🟡 Jaune', fc: '90', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen neurologique + scanner si signes d\'alerte', traitement: 'Paracétamol 1g x3/jour + repos neurologique' },
  { label: 'Traumatisme crânien sévère', categorie: 'Crâne & Neurologie', diagnostic: 'Traumatisme crânien sévère', gravite: '⚫ Noir', fc: '120', ta: '150/90', spo2: '93', temperature: '38.0', douleur: '9/10', examen: 'Scanner cérébral + bilan sanguin', traitement: 'Intubation si besoin + Mannitol 0.25 à 1g/kg IV ou NaCl hypertonique + soins intensifs' },
  { label: 'Hémorragie intracrânienne', categorie: 'Crâne & Neurologie', diagnostic: 'Hémorragie intracrânienne traumatique', gravite: '⚫ Noir', fc: '110', ta: '170/100', spo2: '94', temperature: '38.0', douleur: '10/10', examen: 'Scanner cérébral', traitement: 'Mannitol 0.25 à 1g/kg IV ou NaCl hypertonique + neurochirurgie' },
  { label: 'Plaie du cuir chevelu', categorie: 'Crâne & Neurologie', diagnostic: 'Plaie du cuir chevelu', gravite: '🟡 Jaune', fc: '95', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique', traitement: 'Lidocaïne 1% locale + Paracétamol 1g x3/jour + suture/agrafes + pansement' },
  { label: 'Polytraumatisme', categorie: 'Traumatismes graves', diagnostic: 'Polytraumatisme', gravite: '⚫ Noir', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', douleur: '10/10', examen: 'Scanner corps entier + bilan sanguin', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + perfusion/transfusion + chirurgie selon lésions' },
  { label: 'Traumatisme thoracique', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme thoracique', gravite: '🔴 Rouge', fc: '120', ta: '110/70', spo2: '91', temperature: '37.0', douleur: '8/10', examen: 'Radiographie thorax + scanner', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + oxygène + drain thoracique si besoin' },
  { label: 'Traumatisme abdominal', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme abdominal', gravite: '🔴 Rouge', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', douleur: '8/10', examen: 'FAST + scanner abdomino-pelvien', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + perfusion + chirurgie si hémorragie' },
  { label: 'Traumatisme rachidien', categorie: 'Traumatismes graves', diagnostic: 'Suspicion de traumatisme rachidien', gravite: '🔴 Rouge', fc: '95', ta: '115/75', spo2: '95', temperature: '37.0', douleur: '7/10', examen: 'Scanner rachis', traitement: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV + immobilisation rachidienne' },
  { label: 'Traumatisme pelvien', categorie: 'Traumatismes graves', diagnostic: 'Traumatisme pelvien avec risque hémorragique', gravite: '⚫ Noir', fc: '130', ta: '95/60', spo2: '94', temperature: '37.0', douleur: '9/10', examen: 'Radiographie bassin + scanner', traitement: 'Morphine 2 à 5mg IV + Acide tranexamique 1g IV + ceinture pelvienne + chirurgie/embolisation' },
  { label: 'Élongation musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Élongation musculaire', gravite: '🟢 Vert', fc: '78', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + repos' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Déchirure musculaire partielle', gravite: '🟡 Jaune', fc: '90', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '6/10', examen: 'Échographie', traitement: 'Paracétamol 1g x3/jour + Kétoprofène 100mg x2/jour + repos + compression' },
  { label: 'Rupture de tendon', categorie: 'Muscles & Tendons', diagnostic: 'Rupture tendineuse', gravite: '🟡 Jaune', fc: '88', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '6/10', examen: 'Échographie ou IRM', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + immobilisation + chirurgie si besoin' },
  { label: 'Contracture musculaire', categorie: 'Muscles & Tendons', diagnostic: 'Contracture musculaire', gravite: '🟢 Vert', fc: '75', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + repos' },
  { label: 'Cocard / hématome orbitaire', categorie: 'Tête & Yeux', diagnostic: 'Hématome orbitaire', gravite: '🟢 Vert', fc: '80', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '3/10', examen: 'Examen oculaire', traitement: 'Paracétamol 1g x3/jour + glace' },
  { label: 'Corps étranger dans l\'œil', categorie: 'Tête & Yeux', diagnostic: 'Corps étranger cornéen', gravite: '🟡 Jaune', fc: '82', ta: '120/75', spo2: '99', temperature: '37.0', douleur: '4/10', examen: 'Lampe à fente', traitement: 'Érythromycine ophtalmique 0.5% x4/jour + retrait du corps étranger' },
  { label: 'Perforation oculaire', categorie: 'Tête & Yeux', diagnostic: 'Plaie perforante du globe oculaire', gravite: '🔴 Rouge', fc: '100', ta: '130/80', spo2: '97', temperature: '37.0', douleur: '8/10', examen: 'Scanner orbitaire', traitement: 'Morphine 2 à 4mg IV + Céfazoline 2g IV + coque de protection + chirurgie urgente' },
  { label: 'Fracture du nez', categorie: 'Tête & Yeux', diagnostic: 'Fracture des os propres du nez', gravite: '🟡 Jaune', fc: '85', ta: '125/80', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen clinique', traitement: 'Paracétamol 1g x3/jour + Ibuprofène 400mg x3/jour + glace + réduction si besoin' },
  { label: 'Traumatisme dentaire', categorie: 'Tête & Yeux', diagnostic: 'Traumatisme dento-alvéolaire', gravite: '🟡 Jaune', fc: '85', ta: '120/75', spo2: '98', temperature: '37.0', douleur: '5/10', examen: 'Examen bucco-dentaire', traitement: 'Paracétamol 1g x3/jour + Amoxicilline 1g x3/jour + contention / soin dentaire urgent' },
  { label: 'Intoxication', categorie: 'Autres', diagnostic: 'Intoxication aiguë', gravite: '🔴 Rouge', fc: '110', ta: '110/70', spo2: '94', temperature: '37.5', douleur: '5/10', examen: 'Bilan sanguin + ECG', traitement: 'Charbon activé 50g + perfusion IV + antidote si connu' },
  { label: 'Réaction allergique', categorie: 'Autres', diagnostic: 'Réaction allergique aiguë', gravite: '🔴 Rouge', fc: '115', ta: '100/65', spo2: '93', temperature: '37.0', douleur: '4/10', examen: 'Examen clinique', traitement: 'Adrénaline 0.3 à 0.5mg IM + Cétirizine 10mg + Méthylprednisolone 40 à 80mg IV' },
  { label: 'Crise d\'asthme', categorie: 'Autres', diagnostic: 'Exacerbation aiguë d\'asthme', gravite: '🔴 Rouge', fc: '120', ta: '130/80', spo2: '90', temperature: '37.0', douleur: '5/10', examen: 'Auscultation + saturation', traitement: 'Salbutamol 2.5 à 5mg nébulisé + Ipratropium 0.5mg nébulisé + Prednisone 40mg/jour' },
  { label: 'Hypothermie', categorie: 'Autres', diagnostic: 'Hypothermie', gravite: '🔴 Rouge', fc: '50', ta: '90/60', spo2: '92', temperature: '32.0', douleur: '3/10', examen: 'Température centrale + ECG', traitement: 'Réchauffement passif/actif + NaCl 0.9% tiédi IV' },
  { label: 'Coup de chaleur', categorie: 'Autres', diagnostic: 'Hyperthermie par coup de chaleur', gravite: '🔴 Rouge', fc: '145', ta: '100/60', spo2: '94', temperature: '40.5', douleur: '4/10', examen: 'Température centrale + bilan sanguin', traitement: 'Refroidissement rapide + NaCl 0.9% IV' },
  { label: 'Noyade', categorie: 'Autres', diagnostic: 'Détresse respiratoire secondaire à immersion', gravite: '🔴 Rouge', fc: '130', ta: '105/70', spo2: '88', temperature: '35.0', douleur: '4/10', examen: 'Gaz du sang + radiographie thorax', traitement: 'Oxygène + ventilation si besoin + surveillance hospitalière' },
];

const categories = [...new Set(blessures.map(b => b.categorie))];

const TEMPLATE = `⚕️ RAPPORT D'INTERVENTION MÉDICALE — SAMS

📅 Date : {{date}}
🕐 Heure de prise en charge : {{heure}}
🏥 Patient : {{prenom}} {{nom}}
📋 Motif : {{motif}}
📍 Localisation : {{localisation}}
⚠️ Gravité des blessures : {{gravite}}


---

🩺 État initial à l'admission

État de conscience du patient : {{conscience}}

Description de l'état général à l'arrivée : {{etat_general}}

Blessure / symptôme principal : {{diagnostic}}
Localisation précise : {{localisation_precise}}
Niveau de douleur : {{douleur}}/10
Signes cliniques observés : {{signes_cliniques}}
Observations complémentaires : {{observations}}

---

🫀 Constantes vitales

FC : {{fc}} bpm
TA : {{ta}} mmHg
SpO₂ : {{spo2}} %
Température : {{temperature}} °C
Douleur : {{douleur}}/10

État des constantes à l'admission : {{etat_constantes}}

---

🔬 Examens réalisés

Type d'examen : {{type_examen}}

Résultats : {{resultats_examen}}

Observations médicales : {{observations_examen}}

---

🔪 Prise en charge et protocole de soins

{{protocole}}

Déroulement de la procédure : {{deroulement}}

---

🩹 État final du patient

État général après prise en charge : {{etat_final}}

Constantes : {{constantes_finales}}

Évolution de la douleur : {{evolution_douleur}}

Complications éventuelles : {{complications}}

---

💊 Prescription à la sortie

Antalgique : {{antalgique}}

Anti-inflammatoire : {{anti_inflammatoire}}

Antibiotique (si nécessaire) : {{antibiotique}}

Soins locaux : {{soins_locaux}}

Repos : {{repos}}

---

📌 Recommandations

Durée d'ATA (si nécessaire) : {{ata}}

Restrictions physiques : {{restrictions}}

Surveillance des symptômes : {{surveillance}}

---

📅 Suivi médical

Date du contrôle : {{suivi_date}}

Examens complémentaires si nécessaire : {{examens_suivi}}

Observations : {{observations_suivi}}

---

✍️ Rapport rédigé par {{redacteur}}

📅 Date : {{date}}`;

const fields = [
  { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
  { key: 'heure', label: 'Heure de prise en charge', type: 'time', placeholder: '' },
  { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Brooks', required: true },
  { key: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Ex: Jackson', required: true },
  { key: 'motif', label: 'Motif', type: 'text', placeholder: 'Ex: Blessure par arme à feu', required: true },
  { key: 'localisation', label: 'Localisation générale', type: 'text', placeholder: 'Ex: Torse — flanc droit abdominal' },
  { key: 'gravite', label: 'Gravité', type: 'text', placeholder: 'Ex: 🔴 Rouge' },
  { key: 'conscience', label: 'État de conscience', type: 'text', placeholder: 'Ex: Patient conscient, orienté et coopérant' },
  { key: 'etat_general', label: 'État général à l\'arrivée', type: 'textarea', placeholder: 'Description générale...' },
  { key: 'diagnostic', label: 'Blessure / symptôme principal', type: 'text', placeholder: 'Ex: Plaie par balle non traversante', required: true },
  { key: 'localisation_precise', label: 'Localisation précise', type: 'text', placeholder: 'Ex: Flanc droit abdominal' },
  { key: 'douleur', label: 'Niveau de douleur (/10)', type: 'text', placeholder: 'Ex: 7' },
  { key: 'signes_cliniques', label: 'Signes cliniques observés', type: 'textarea', placeholder: 'Ex: Douleur à la palpation, absence de détresse respiratoire...' },
  { key: 'observations', label: 'Observations complémentaires', type: 'textarea', placeholder: 'Ex: Pas de signe d\'atteinte viscérale...' },
  { key: 'fc', label: 'FC (bpm)', type: 'text', placeholder: 'Ex: 88' },
  { key: 'ta', label: 'TA (mmHg)', type: 'text', placeholder: 'Ex: 121/79' },
  { key: 'spo2', label: 'SpO₂ (%)', type: 'text', placeholder: 'Ex: 98' },
  { key: 'temperature', label: 'Température (°C)', type: 'text', placeholder: 'Ex: 36.9' },
  { key: 'etat_constantes', label: 'État des constantes', type: 'text', placeholder: 'Ex: Constantes stables à l\'admission' },
  { key: 'type_examen', label: 'Type d\'examen réalisé', type: 'textarea', placeholder: 'Ex: Exploration clinique, radiologie...' },
  { key: 'resultats_examen', label: 'Résultats', type: 'textarea', placeholder: 'Ex: Aucune atteinte d\'organe interne...' },
  { key: 'observations_examen', label: 'Observations médicales', type: 'textarea', placeholder: 'Ex: Tissu mou intact...' },
  { key: 'protocole', label: 'Protocole de soins (liste avec •)', type: 'textarea', placeholder: '• Désinfection\n• Suture\n• Pansement...' },
  { key: 'deroulement', label: 'Déroulement de la procédure', type: 'textarea', placeholder: 'Ex: La procédure s\'est déroulée sans complication...' },
  { key: 'etat_final', label: 'État final du patient', type: 'textarea', placeholder: 'Ex: Patient stabilisé après prise en charge...' },
  { key: 'constantes_finales', label: 'Constantes finales', type: 'text', placeholder: 'Ex: Constantes satisfaisantes' },
  { key: 'evolution_douleur', label: 'Évolution de la douleur', type: 'text', placeholder: 'Ex: Douleur contrôlée après antalgiques' },
  { key: 'complications', label: 'Complications éventuelles', type: 'text', placeholder: 'Ex: Aucune complication' },
  { key: 'antalgique', label: 'Antalgique', type: 'text', placeholder: 'Ex: Paracétamol 1g x3/jour' },
  { key: 'anti_inflammatoire', label: 'Anti-inflammatoire', type: 'text', placeholder: 'Ex: Ibuprofène 400mg x3/jour' },
  { key: 'antibiotique', label: 'Antibiotique', type: 'text', placeholder: 'Ex: aucun' },
  { key: 'soins_locaux', label: 'Soins locaux', type: 'textarea', placeholder: 'Ex: Pansement quotidien...' },
  { key: 'repos', label: 'Repos', type: 'text', placeholder: 'Ex: Repos relatif recommandé' },
  { key: 'ata', label: 'Durée d\'ATA', type: 'text', placeholder: 'Ex: 24 à 48 heures' },
  { key: 'restrictions', label: 'Restrictions physiques', type: 'textarea', placeholder: 'Ex: Éviter les efforts physiques...' },
  { key: 'surveillance', label: 'Surveillance des symptômes', type: 'textarea', placeholder: '• douleur importante\n• fièvre\n• saignement...' },
  { key: 'suivi_date', label: 'Date du contrôle', type: 'text', placeholder: 'Ex: Dans les 24h suivant la sortie' },
  { key: 'examens_suivi', label: 'Examens complémentaires de suivi', type: 'text', placeholder: 'Ex: Radio de contrôle' },
  { key: 'observations_suivi', label: 'Observations suivi', type: 'text', placeholder: 'Ex: Vérification cicatrisation' },
  { key: 'redacteur', label: 'Rapport rédigé par', type: 'text', placeholder: 'Ex: Ambulancier Ethan Skoll', required: true },
];

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedReport, setGeneratedReport] = useState('');
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showBlessures, setShowBlessures] = useState(false);
  const [categorieActive, setCategorieActive] = useState(categories[0]);

  const titles: Record<string, { title: string; icon: string }> = {
    traumatologie: { title: 'Traumatologie', icon: '🦴' },
    chirurgie: { title: 'Chirurgie', icon: '🔪' },
    consultation: { title: 'Consultation générale', icon: '🩺' },
    urgence: { title: 'Urgence vitale', icon: '🚨' },
    intoxication: { title: 'Intoxication', icon: '☠️' },
    psychiatrie: { title: 'Psychiatrie', icon: '🧠' },
    legiste: { title: 'Médecin légiste', icon: '🔍' },
    deces: { title: 'Certificat de décès', icon: '📋' },
  };

  const config = titles[templateId];
  if (!config) return <div className="text-red-400">Template introuvable.</div>;

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  function appliquerBlessure(b: typeof blessures[0]) {
    setValues(prev => ({
      ...prev,
      diagnostic: b.diagnostic,
      gravite: b.gravite,
      fc: b.fc,
      ta: b.ta,
      spo2: b.spo2,
      temperature: b.temperature,
      douleur: b.douleur,
      type_examen: b.examen,
      antalgique: b.traitement.split(' + ')[0] || '',
      protocole: b.traitement.split(' + ').map(t => `• ${t}`).join('\n'),
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
        body: JSON.stringify({ template: TEMPLATE, values }),
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
          {/* Raccourcis blessures */}
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
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategorieActive(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full transition ${
                        categorieActive === cat ? 'bg-orange-700 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
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

          <div className="bg-slate-800/30 border border-orange-900/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-300">💡 Remplissez les informations — le rapport se génère automatiquement.</p>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
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
              rows={40}
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