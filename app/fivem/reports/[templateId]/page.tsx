'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── BLESSURES ────────────────────────────────────────────────────────────────
const blessures = [
  { label: 'Fracture simple', categorie: 'Os & Articulations', motif: 'Fracture simple', gravite: 'MOYENNE', conscience: 'Conscient, orienté et coopérant', diagnostic: 'Fracture simple du membre', localisation_precise: 'Bras, jambe, poignet ou cheville', douleur: '7', signes_cliniques: 'Douleur importante, impotence fonctionnelle partielle, œdème local.', observations: 'Suspicion de fracture simple sans exposition osseuse.', fc: '95', ta: '125/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fracture simple visible à la radiographie.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Immobilisation par attelle', complications: 'Aucune', repos: 'Repos strict du membre', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle', ata: 'Non requis', restrictions: "Pas d'appui sur le membre", surveillance: '• Douleur croissante\n• Œdème important\n• Engourdissement' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', motif: 'Fracture ouverte', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', localisation_precise: 'Segment osseux atteint', douleur: '9', signes_cliniques: 'Plaie ouverte avec exposition osseuse, saignement, douleur intense.', observations: 'Risque infectieux élevé.', fc: '110', ta: '110/70', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Fracture ouverte confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Céfazoline 2 g IV\n• Pansement stérile\n• Immobilisation\n• Chirurgie', complications: 'Risque infectieux', repos: 'Hospitalisation et repos strict', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Pansement stérile + immobilisation', ata: '48 à 72 heures', restrictions: 'Aucun appui, aucun effort', surveillance: '• Fièvre\n• Rougeur ou écoulement\n• Douleur croissante' },
  { label: 'Fissure osseuse', categorie: 'Os & Articulations', motif: 'Fissure osseuse', gravite: 'LEGERE', conscience: 'Conscient, orienté', diagnostic: 'Fissure osseuse non déplacée', localisation_precise: 'Os atteint', douleur: '5', signes_cliniques: 'Douleur localisée, œdème léger, mobilisation douloureuse.', observations: 'Pas de déplacement osseux.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fine ligne de fissure visible sans déplacement.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Attelle\n• Repos', complications: 'Aucune', repos: 'Repos fonctionnel', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + repos', ata: 'Non requis', restrictions: 'Éviter les efforts', surveillance: '• Douleur croissante\n• Gonflement' },
  { label: 'Luxation', categorie: 'Os & Articulations', motif: 'Luxation', gravite: 'MOYENNE', conscience: 'Conscient et orienté', diagnostic: 'Luxation articulaire', localisation_precise: 'Épaule, doigt ou genou', douleur: '8', signes_cliniques: 'Déformation articulaire visible, douleur intense, impotence fonctionnelle.', observations: 'Pas de fracture associée visible.', fc: '100', ta: '130/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Luxation confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Kétoprofène 100 mg x2/jour\n• Réduction articulaire\n• Écharpe', complications: 'Aucune', repos: 'Repos articulaire', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Réduction articulaire + écharpe', ata: '24 à 48 heures', restrictions: 'Immobilisation du membre', surveillance: '• Douleur persistante\n• Perte de mobilité' },
  { label: 'Entorse', categorie: 'Os & Articulations', motif: 'Entorse', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Entorse ligamentaire', localisation_precise: 'Cheville, genou ou poignet', douleur: '6', signes_cliniques: 'Œdème, douleur à la mobilisation, sensibilité ligamentaire.', observations: 'Pas de fracture radiologique.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique + radiologie si besoin', resultats_examen: 'Atteinte ligamentaire probable.', protocole: '• Ibuprofène 400 mg x3/jour\n• Attelle\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour si douleur', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + glace', ata: 'Non requis', restrictions: 'Éviter la marche prolongée', surveillance: '• Gonflement\n• Douleur à la mise en charge' },
  { label: 'Contusion osseuse', categorie: 'Os & Articulations', motif: 'Contusion osseuse', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Contusion osseuse sans fracture visible', localisation_precise: 'Zone osseuse traumatisée', douleur: '4', signes_cliniques: 'Douleur localisée, ecchymose, sensibilité à la palpation.', observations: 'Absence de fracture visible.', fc: '78', ta: '118/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Radiologie', resultats_examen: 'Aucune fracture visible.', protocole: '• Paracétamol 1 g x3/jour\n• Glace\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Glace + repos', ata: 'Non requis', restrictions: 'Activité réduite', surveillance: '• Douleur persistante\n• Gonflement' },
  { label: 'Plaie ouverte', categorie: 'Plaies', motif: 'Plaie ouverte / lacération', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Plaie profonde avec atteinte des tissus mous', localisation_precise: 'Zone cutanée atteinte', douleur: '6', signes_cliniques: 'Plaie ouverte avec saignement modéré, douleur locale.', observations: "Pas d'atteinte vasculaire évidente.", fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie profonde sans atteinte organique.', protocole: '• Paracétamol 1 g x3/jour\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Désinfection\n• Suture\n• Pansement', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Désinfection + suture + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Chaleur\n• Écoulement' },
  { label: 'Plaie superficielle', categorie: 'Plaies', motif: 'Plaie superficielle', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Plaie superficielle cutanée', localisation_precise: 'Peau superficielle', douleur: '3', signes_cliniques: 'Plaie peu profonde, saignement faible, douleur légère.', observations: "Pas d'atteinte profonde.", fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Plaie superficielle simple.', protocole: '• Chlorhexidine locale\n• Pansement', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour si douleur', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Chlorhexidine + pansement', ata: 'Non requis', restrictions: 'Aucune', surveillance: '• Rougeur\n• Gonflement' },
  { label: 'Hématome', categorie: 'Plaies', motif: 'Hématome', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Hématome sous-cutané post-traumatique', localisation_precise: 'Zone de choc', douleur: '4', signes_cliniques: 'Ecchymose, gonflement local, douleur modérée.', observations: 'Pas de signe de fracture associée.', fc: '80', ta: '120/80', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Hématome simple.', protocole: '• Paracétamol 1 g x3/jour\n• Diclofénac gel 1 % x3/jour\n• Glace', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Diclofénac gel 1% x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Augmentation du volume\n• Douleur croissante' },
  { label: 'Écrasement de membre', categorie: 'Plaies', motif: 'Écrasement de membre', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme par écrasement avec risque de syndrome de loge', localisation_precise: 'Membre écrasé', douleur: '9', signes_cliniques: 'Douleur intense, œdème majeur, risque de compression vasculo-nerveuse.', observations: 'Surveillance chirurgicale nécessaire.', fc: '115', ta: '110/70', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Traumatisme sévère du membre, lésions tissulaires importantes.', protocole: '• Morphine 2 à 5 mg IV\n• NaCl 0.9 % IV\n• Immobilisation\n• Surveillance chirurgicale', complications: 'Risque de syndrome de loge', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Immobilisation + surveillance chirurgicale', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Douleur intense\n• Perte de sensibilité\n• Cyanose' },
  { label: 'Amputation traumatique', categorie: 'Plaies', motif: 'Amputation traumatique', gravite: 'GRAVE', conscience: 'Conscient ou altéré selon hémorragie', diagnostic: 'Amputation traumatique partielle ou complète', localisation_precise: 'Segment amputé', douleur: '0', signes_cliniques: 'Section partielle ou complète, hémorragie importante, douleur majeure.', observations: 'Risque vital hémorragique.', fc: '140', ta: '90/60', spo2: '0', temperature: '36.4', etat_constantes: 'Constantes instables', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Amputation traumatique confirmée.', protocole: '• Morphine 5 mg IV\n• Acide tranexamique 1 g IV\n• Céfazoline 2 g IV\n• Garrot/pansement compressif\n• Chirurgie', complications: 'Choc hémorragique possible', repos: 'Hospitalisation en urgence', antalgique: 'Morphine 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Garrot + pansement compressif + chirurgie', ata: '72 heures minimum', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Infection\n• Douleur fantôme' },
  { label: 'Corps étranger plaie', categorie: 'Plaies', motif: 'Corps étranger dans une plaie', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Plaie avec corps étranger inclus', localisation_precise: 'Tissus mous atteints', douleur: '5', signes_cliniques: 'Douleur locale, inflammation, gêne mécanique possible.', observations: "Présence probable d'un corps étranger.", fc: '85', ta: '120/75', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Corps étranger visualisé dans la plaie.', protocole: '• Lidocaïne 1 % locale\n• Paracétamol 1 g x3/jour\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Extraction\n• Pansement', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'BPB traversante', categorie: 'Armes', motif: 'Blessure par balle traversante', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle traversante', localisation_precise: "Zone d'impact projectile", douleur: '9', signes_cliniques: "Plaie pénétrante avec orifice d'entrée et de sortie, saignement possible.", observations: 'Risque hémorragique interne et externe.', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes instables', type_examen: 'Scanner + radiologie + bilan sanguin', resultats_examen: 'Trajectoire du projectile confirmée.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Céfazoline 2 g IV\n• Perfusion\n• Chirurgie si nécessaire', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Pansement stérile + chirurgie si nécessaire', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Fièvre\n• Douleur thoracique ou abdominale' },
  { label: 'BPB non traversante', categorie: 'Armes', motif: 'Blessure par balle non traversante', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle non traversante avec projectile retenu', localisation_precise: "Zone d'impact projectile", douleur: '9', signes_cliniques: "Plaie pénétrante sans orifice de sortie, douleur intense, saignement.", observations: 'Projectile retenu dans les tissus.', fc: '110', ta: '115/75', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + scanner', resultats_examen: 'Projectile localisé dans les tissus.', protocole: '• Morphine 2 à 4 mg IV\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Pansement\n• Extraction chirurgicale si besoin', complications: 'Risque infectieux et hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 4mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Pansement + extraction chirurgicale si besoin', ata: '24 à 48 heures', restrictions: 'Aucun effort physique', surveillance: '• Douleur abdominale\n• Fièvre\n• Saignement' },
  { label: 'Arme blanche', categorie: 'Armes', motif: 'Blessure par arme blanche', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Plaie pénétrante par arme blanche', localisation_precise: 'Zone de pénétration', douleur: '8', signes_cliniques: 'Plaie profonde, saignement, douleur importante.', observations: "Profondeur variable, risque d'atteinte organique.", fc: '110', ta: '115/75', spo2: '95', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + scanner si profondeur', resultats_examen: 'Plaie pénétrante confirmée.', protocole: '• Morphine 2 à 5 mg IV\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Suture ou chirurgie', complications: 'Risque hémorragique', repos: 'Surveillance hospitalière', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Suture ou chirurgie', ata: '24 à 48 heures', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Fièvre\n• Douleur croissante' },
  { label: 'Éclats métalliques', categorie: 'Armes', motif: 'Éclats métalliques / fragments', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Plaie avec fragments métalliques', localisation_precise: 'Zone atteinte par éclats', douleur: '7', signes_cliniques: 'Plaies multiples ou localisées, douleur, inflammation locale.', observations: 'Présence possible de plusieurs fragments.', fc: '100', ta: '120/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fragments métalliques visibles.', protocole: '• Paracétamol 1 g x3/jour\n• Lidocaïne 1 % locale\n• Extraction\n• Pansement', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Aucune', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'Brûlure 1er degré', categorie: 'Brûlures', motif: 'Brûlure du 1er degré', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Brûlure superficielle du 1er degré', localisation_precise: 'Zone cutanée atteinte', douleur: '4', signes_cliniques: 'Rougeur cutanée, douleur modérée, absence de cloques.', observations: 'Atteinte superficielle simple.', fc: '85', ta: '120/75', spo2: '99', temperature: '36.8', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Brûlure superficielle confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Crème apaisante\n• Hydratation', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: "Crème apaisante + hydratation", ata: 'Non requis', restrictions: "Éviter l'exposition solaire", surveillance: '• Cloque\n• Infection' },
  { label: 'Brûlure 2e sup.', categorie: 'Brûlures', motif: 'Brûlure du 2e degré superficiel', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Brûlure du 2e degré superficiel', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Cloques, rougeur, douleur vive.', observations: 'Atteinte dermique superficielle.', fc: '100', ta: '125/80', spo2: '98', temperature: '37.2', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure du 2e degré superficiel confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 4 mg IV si douleur\n• Sulfadiazine argentique 1 %\n• Pansement', complications: 'Risque infectieux', repos: 'Repos', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Sulfadiazine argentique 1% + pansement', ata: '24 à 48 heures', restrictions: "Éviter contact avec l'eau", surveillance: '• Fièvre\n• Écoulement\n• Odeur' },
  { label: 'Brûlure 2e prof.', categorie: 'Brûlures', motif: 'Brûlure du 2e degré profond', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Brûlure du 2e degré profond', localisation_precise: 'Zone cutanée atteinte', douleur: '9', signes_cliniques: 'Atteinte cutanée profonde, douleur importante, peau lésée.', observations: 'Surveillance spécialisée si étendue.', fc: '110', ta: '115/70', spo2: '97', temperature: '37.3', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + bilan sanguin si étendue', resultats_examen: 'Brûlure profonde confirmée.', protocole: '• Morphine 3 à 5 mg IV\n• Sulfadiazine argentique 1 %\n• Pansement spécialisé', complications: 'Risque infectieux et cicatriciel', repos: 'Surveillance hospitalière', antalgique: 'Morphine 3 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Sulfadiazine argentique 1% + pansement spécialisé', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Fièvre\n• Nécrose\n• Infection' },
  { label: 'Brûlure 3e degré', categorie: 'Brûlures', motif: 'Brûlure du 3e degré', gravite: 'GRAVE', conscience: 'Conscient ou altéré selon étendue', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', localisation_precise: 'Zone cutanée atteinte', douleur: '0', signes_cliniques: 'Peau nécrosée, atteinte profonde, zone parfois insensible.', observations: 'Risque vital si étendue importante.', fc: '130', ta: '100/65', spo2: '95', temperature: '37.1', etat_constantes: 'Constantes instables possibles', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Brûlure du 3e degré confirmée.', protocole: '• Morphine 3 à 5 mg IV\n• Ringer lactate IV\n• Pansement stérile\n• Chirurgie', complications: "Risque de choc et d'infection", repos: 'Hospitalisation', antalgique: 'Morphine 3 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Pansement stérile + chirurgie', ata: '72 heures minimum', restrictions: 'Aucun effort', surveillance: '• Infection\n• Nécrose étendue\n• Sepsis' },
  { label: 'Brûlure chimique', categorie: 'Brûlures', motif: 'Brûlure chimique', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Brûlure chimique cutanée', localisation_precise: 'Zone exposée au produit', douleur: '7', signes_cliniques: 'Lésion cutanée douloureuse après contact chimique.', observations: 'Importance du rinçage immédiat.', fc: '105', ta: '120/75', spo2: '97', temperature: '36.9', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure chimique confirmée.', protocole: '• Rinçage abondant\n• Morphine 2 à 5 mg IV si douleur\n• Pansement', complications: "Risque d'aggravation locale", repos: 'Repos et surveillance', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Rinçage abondant + pansement', ata: '24 heures', restrictions: 'Éviter tout contact avec le produit', surveillance: '• Rougeur persistante\n• Douleur\n• Fièvre' },
  { label: 'Brûlure électrique', categorie: 'Brûlures', motif: 'Brûlure électrique', gravite: 'GRAVE', conscience: 'Conscient à surveiller', diagnostic: 'Brûlure électrique avec risque de lésion profonde', localisation_precise: "Point d'entrée et de sortie électrique", douleur: '7', signes_cliniques: 'Lésions cutanées parfois limitées avec atteinte profonde possible.', observations: 'Surveillance cardiaque indispensable.', fc: '115', ta: '120/75', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'ECG + bilan sanguin', resultats_examen: "Brûlure électrique confirmée.", protocole: '• Morphine 2 à 5 mg IV\n• Perfusion IV\n• Surveillance cardiaque', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Perfusion IV + surveillance cardiaque', ata: '24 à 48 heures', restrictions: 'Aucune activité physique', surveillance: '• Troubles du rythme\n• Douleur musculaire\n• Urines foncées' },
  { label: 'TC léger', categorie: 'Crâne & Neurologie', motif: 'Traumatisme crânien léger', gravite: 'LEGERE', conscience: 'Conscient orienté', diagnostic: 'Traumatisme crânien léger', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: 'Céphalées, vertiges, douleur post-traumatique.', observations: 'Pas de déficit neurologique.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Scanner cérébral si besoin + examen neurologique', resultats_examen: "Pas d'hémorragie intracrânienne.", protocole: '• Paracétamol 1 g x3/jour\n• Surveillance neurologique', complications: 'Aucune', repos: 'Repos neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Surveillance neurologique', ata: '24 heures', restrictions: "Pas d'écran, pas d'effort", surveillance: '• Vomissements\n• Perte de conscience\n• Céphalées intenses' },
  { label: 'Commotion cérébrale', categorie: 'Crâne & Neurologie', motif: 'Commotion cérébrale', gravite: 'MOYENNE', conscience: 'Conscient, parfois confus initialement', diagnostic: 'Commotion cérébrale', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: "Céphalées, nausées, vertiges.", observations: 'Surveillance neurologique recommandée.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: "Examen neurologique + scanner si signes d'alerte", resultats_examen: 'Pas de lésion intracrânienne visible.', protocole: '• Paracétamol 1 g x3/jour\n• Repos neurologique', complications: 'Aucune complication immédiate', repos: 'Repos strict neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Repos neurologique strict', ata: '24 à 48 heures', restrictions: "Pas d'écran, pas d'effort", surveillance: '• Confusion\n• Vomissements\n• Troubles visuels' },
  { label: 'TC sévère', categorie: 'Crâne & Neurologie', motif: 'Traumatisme crânien sévère', gravite: 'GRAVE', conscience: 'Altérée ou fluctuante', diagnostic: 'Traumatisme crânien sévère', localisation_precise: 'Crâne', douleur: '0', signes_cliniques: 'Altération neurologique, céphalées sévères, vomissements, baisse de vigilance.', observations: 'Risque vital neurologique.', fc: '120', ta: '150/90', spo2: '93', temperature: '37.1', etat_constantes: 'Constantes instables neurologiquement', type_examen: 'Scanner cérébral + bilan sanguin', resultats_examen: 'Lésion intracrânienne possible, surveillance intensive nécessaire.', protocole: '• Intubation si besoin\n• Mannitol 0.25 à 1 g/kg IV\n• Soins intensifs', complications: "Risque d'hypertension intracrânienne", repos: 'Soins intensifs', antalgique: 'Morphine si toléré', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Intubation si besoin + soins intensifs', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Perte de conscience\n• Convulsions\n• Troubles respiratoires' },
  { label: 'Hémorragie intracrânienne', categorie: 'Crâne & Neurologie', motif: 'Hémorragie intracrânienne', gravite: 'GRAVE', conscience: 'Altérée possible', diagnostic: 'Hémorragie intracrânienne traumatique', localisation_precise: 'Encéphale', douleur: '9', signes_cliniques: 'Céphalées sévères, vomissements, troubles neurologiques, baisse de vigilance.', observations: 'Urgence neurochirurgicale possible.', fc: '110', ta: '170/100', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Scanner cérébral', resultats_examen: 'Saignement intracrânien visible.', protocole: '• Mannitol 0.25 à 1 g/kg IV\n• Neurochirurgie', complications: 'Hypertension intracrânienne', repos: 'Hospitalisation en urgence', antalgique: 'Aucun (contre-indiqué)', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Mannitol IV + neurochirurgie', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Perte de conscience\n• Convulsions\n• Paralysie' },
  { label: 'Plaie cuir chevelu', categorie: 'Crâne & Neurologie', motif: 'Plaie du cuir chevelu', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Plaie du cuir chevelu', localisation_precise: 'Cuir chevelu', douleur: '5', signes_cliniques: 'Plaie saignante du cuir chevelu, douleur locale.', observations: 'Vérifier absence de traumatisme crânien associé.', fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie cutanée du cuir chevelu sans complication apparente.', protocole: '• Lidocaïne 1 % locale\n• Suture/agrafes\n• Pansement', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Suture/agrafes + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'Polytraumatisme', categorie: 'Traumatismes graves', motif: 'Polytraumatisme', gravite: 'GRAVE', conscience: 'Altération possible', diagnostic: 'Polytraumatisme', localisation_precise: 'Multiples zones corporelles', douleur: '0', signes_cliniques: 'Douleurs multiples, instabilité hémodynamique, lésions associées.', observations: 'Risque vital majeur.', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', etat_constantes: 'Constantes instables', type_examen: 'Scanner corps entier + bilan sanguin', resultats_examen: 'Multiples lésions traumatiques.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Perfusion/transfusion\n• Chirurgie selon lésions', complications: 'Choc hémorragique', repos: 'Soins intensifs', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon lésions', soins_locaux: 'Perfusion/transfusion + chirurgie selon lésions', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Choc hémorragique\n• Défaillance organique\n• Sepsis' },
  { label: 'Traumatisme thoracique', categorie: 'Traumatismes graves', motif: 'Traumatisme thoracique', gravite: 'GRAVE', conscience: 'Conscient douloureux ou dyspnéique', diagnostic: 'Traumatisme thoracique', localisation_precise: 'Thorax', douleur: '8', signes_cliniques: 'Douleur thoracique, gêne respiratoire, possible détresse ventilatoire.', observations: 'Risque de pneumothorax ou hémothorax.', fc: '120', ta: '110/70', spo2: '91', temperature: '36.8', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Radiographie thorax + scanner', resultats_examen: 'Traumatisme thoracique confirmé.', protocole: '• Morphine 2 à 5 mg IV\n• Oxygène\n• Drain thoracique si besoin', complications: 'Détresse respiratoire', repos: 'Surveillance hospitalière', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Oxygène + drain thoracique si besoin', ata: '48 à 72 heures', restrictions: 'Aucun effort respiratoire', surveillance: '• Dyspnée\n• Douleur thoracique\n• Cyanose' },
  { label: 'Traumatisme abdominal', categorie: 'Traumatismes graves', motif: 'Traumatisme abdominal', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme abdominal', localisation_precise: 'Abdomen', douleur: '8', signes_cliniques: "Douleur abdominale, défense possible, risque d'hémorragie interne.", observations: "Urgence si instabilité hémodynamique.", fc: '125', ta: '100/65', spo2: '94', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'FAST + scanner abdomino-pelvien', resultats_examen: 'Traumatisme abdominal confirmé, atteinte interne possible.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Perfusion\n• Chirurgie si hémorragie', complications: 'Hémorragie interne', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Perfusion + chirurgie si hémorragie', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Douleur abdominale\n• Rigidité\n• Choc' },
  { label: 'Traumatisme rachidien', categorie: 'Traumatismes graves', motif: 'Traumatisme rachidien', gravite: 'GRAVE', conscience: 'Conscient à surveiller', diagnostic: 'Suspicion de traumatisme rachidien', localisation_precise: 'Rachis cervical, dorsal ou lombaire', douleur: '7', signes_cliniques: 'Douleur rachidienne, limitation de mobilisation, déficit neurologique possible.', observations: 'Immobilisation stricte recommandée.', fc: '95', ta: '115/75', spo2: '95', temperature: '36.7', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner rachis', resultats_examen: 'Lésion rachidienne à confirmer ou exclure.', protocole: '• Morphine 2 à 5 mg IV\n• Immobilisation rachidienne', complications: 'Risque neurologique', repos: 'Immobilisation stricte', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Immobilisation rachidienne', ata: '48 à 72 heures', restrictions: 'Immobilisation totale', surveillance: '• Paralysie\n• Paresthésies\n• Perte de sensibilité' },
  { label: 'Traumatisme pelvien', categorie: 'Traumatismes graves', motif: 'Traumatisme pelvien', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme pelvien avec risque hémorragique', localisation_precise: 'Bassin', douleur: '9', signes_cliniques: 'Douleur pelvienne majeure, instabilité possible.', observations: 'Risque hémorragique interne important.', fc: '130', ta: '95/60', spo2: '94', temperature: '36.7', etat_constantes: 'Constantes instables', type_examen: 'Radiographie bassin + scanner', resultats_examen: 'Traumatisme pelvien confirmé.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Ceinture pelvienne\n• Chirurgie/embolisation', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Ceinture pelvienne + chirurgie/embolisation', ata: '72 heures minimum', restrictions: 'Aucun appui', surveillance: '• Choc hémorragique\n• Douleur pelvienne\n• Hématurie' },
  { label: 'Élongation musculaire', categorie: 'Muscles & Tendons', motif: 'Élongation musculaire', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Élongation musculaire', localisation_precise: 'Muscle atteint', douleur: '4', signes_cliniques: "Douleur à l'effort et à l'étirement, sans perte fonctionnelle majeure.", observations: 'Atteinte musculaire légère.', fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Élongation musculaire probable.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Repos + glace', ata: 'Non requis', restrictions: "Éviter l'effort physique", surveillance: '• Douleur croissante\n• Contracture' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', motif: 'Déchirure musculaire', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Déchirure musculaire partielle', localisation_precise: 'Muscle atteint', douleur: '7', signes_cliniques: 'Douleur vive, impotence partielle, hématome possible.', observations: 'Lésion musculaire partielle.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie', resultats_examen: 'Déchirure musculaire partielle confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Kétoprofène 100 mg x2/jour\n• Repos\n• Compression', complications: 'Aucune', repos: 'Repos strict puis progressif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Compression + repos', ata: '24 à 48 heures', restrictions: "Pas d'effort physique", surveillance: '• Hématome\n• Douleur à la contraction' },
  { label: 'Rupture de tendon', categorie: 'Muscles & Tendons', motif: 'Rupture de tendon', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Rupture tendineuse', localisation_precise: 'Tendon atteint', douleur: '7', signes_cliniques: 'Perte fonctionnelle, douleur locale, déficit moteur ciblé.', observations: 'Atteinte tendineuse significative.', fc: '88', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie ou IRM', resultats_examen: 'Rupture tendineuse confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Immobilisation\n• Chirurgie si besoin', complications: 'Perte fonctionnelle prolongée', repos: 'Repos et immobilisation', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Immobilisation + chirurgie si besoin', ata: '48 heures', restrictions: 'Aucun appui', surveillance: '• Douleur persistante\n• Perte de mobilité' },
  { label: 'Contracture musculaire', categorie: 'Muscles & Tendons', motif: 'Contracture musculaire', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Contracture musculaire', localisation_precise: 'Muscle contracturé', douleur: '3', signes_cliniques: 'Raideur musculaire, douleur modérée à la mobilisation.', observations: 'Contracture simple.', fc: '75', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Contracture musculaire probable.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Repos', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Chaleur + repos', ata: 'Non requis', restrictions: "Éviter l'effort", surveillance: '• Douleur persistante' },
  { label: 'Cocard / hématome orb.', categorie: 'Tête & Yeux', motif: 'Cocard / hématome orbitaire', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Hématome orbitaire', localisation_precise: 'Région orbitaire', douleur: '4', signes_cliniques: 'Ecchymose péri-orbitaire, douleur locale, gonflement.', observations: 'Vision à vérifier systématiquement.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen oculaire', resultats_examen: 'Hématome orbitaire simple.', protocole: '• Paracétamol 1 g x3/jour\n• Glace', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Vision floue\n• Douleur oculaire' },
  { label: "Corps étranger œil", categorie: 'Tête & Yeux', motif: "Corps étranger dans l'œil", gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Corps étranger cornéen', localisation_precise: 'Cornée ou conjonctive', douleur: '6', signes_cliniques: 'Douleur oculaire, larmoiement, rougeur, sensation de gêne.', observations: 'Extraction nécessaire si visible.', fc: '82', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Lampe à fente', resultats_examen: 'Corps étranger cornéen confirmé.', protocole: '• Érythromycine ophtalmique 0.5 % x4/jour\n• Retrait du corps étranger', complications: 'Irritation cornéenne', repos: 'Repos visuel', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: "Érythromycine ophtalmique 0.5% x4/jour", soins_locaux: 'Retrait du corps étranger', ata: 'Non requis', restrictions: "Éviter de frotter l'œil", surveillance: '• Rougeur\n• Larmoiement\n• Vision floue' },
  { label: 'Perforation oculaire', categorie: 'Tête & Yeux', motif: 'Perforation oculaire', gravite: 'GRAVE', conscience: 'Conscient douloureux', diagnostic: 'Plaie perforante du globe oculaire', localisation_precise: 'Globe oculaire', douleur: '9', signes_cliniques: 'Douleur intense, baisse de vision, traumatisme oculaire majeur.', observations: 'Urgence ophtalmologique chirurgicale.', fc: '100', ta: '130/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner orbitaire', resultats_examen: 'Plaie perforante confirmée.', protocole: '• Morphine 2 à 4 mg IV\n• Céfazoline 2 g IV\n• Coque de protection\n• Chirurgie urgente', complications: 'Risque de perte visuelle', repos: 'Hospitalisation urgente', antalgique: 'Morphine 2 à 4mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Coque de protection + chirurgie urgente', ata: '48 heures minimum', restrictions: 'Aucun effort oculaire', surveillance: '• Perte de vision\n• Douleur oculaire\n• Infection' },
  { label: 'Fracture du nez', categorie: 'Tête & Yeux', motif: 'Fracture du nez', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Fracture des os propres du nez', localisation_precise: 'Nez', douleur: '5', signes_cliniques: 'Douleur nasale, œdème, déformation possible, épistaxis.', observations: 'Réduction si déplacement important.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Fracture nasale probable ou confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Glace\n• Réduction si besoin', complications: 'Aucune complication immédiate', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace + réduction si besoin', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Épistaxis\n• Obstruction nasale\n• Déviation' },
  { label: 'Traumatisme dentaire', categorie: 'Tête & Yeux', motif: 'Traumatisme dentaire', gravite: 'LEGERE', conscience: 'Conscient', diagnostic: 'Traumatisme dento-alvéolaire', localisation_precise: 'Dents ou alvéole dentaire', douleur: '5', signes_cliniques: 'Douleur dentaire, mobilité, fracture ou déplacement de dent possible.', observations: 'Avis dentaire urgent recommandé.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen bucco-dentaire', resultats_examen: 'Atteinte dento-alvéolaire confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Amoxicilline 1 g x3/jour\n• Contention / soin dentaire urgent', complications: 'Atteinte dentaire persistante', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline 1g x3/jour', soins_locaux: 'Contention / soin dentaire urgent', ata: 'Non requis', restrictions: 'Alimentation molle', surveillance: '• Douleur persistante\n• Abcès\n• Mobilité dentaire' },
  { label: 'Intoxication', categorie: 'Autres', motif: 'Intoxication', gravite: 'GRAVE', conscience: 'Conscient ou altéré selon toxique', diagnostic: 'Intoxication aiguë', localisation_precise: 'Systémique', douleur: '4', signes_cliniques: 'Troubles généraux, nausées, malaise, signes variables selon toxique.', observations: 'Nécessite identification du produit si possible.', fc: '110', ta: '110/70', spo2: '94', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Bilan sanguin + ECG', resultats_examen: 'Troubles biologiques ou cardiaques possibles selon toxique.', protocole: '• Charbon activé 50 g\n• Perfusion IV\n• Antidote si connu', complications: 'Troubles cardiorespiratoires possibles', repos: 'Surveillance hospitalière', antalgique: 'Selon substance', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Charbon activé 50g + perfusion IV + antidote si connu', ata: '24 à 48 heures', restrictions: 'Aucune consommation', surveillance: '• Troubles de conscience\n• Vomissements\n• Arythmie' },
  { label: 'Réaction allergique', categorie: 'Autres', motif: 'Réaction allergique', gravite: 'GRAVE', conscience: 'Conscient', diagnostic: 'Réaction allergique aiguë', localisation_precise: 'Systémique', douleur: '3', signes_cliniques: 'Urticaire, prurit, œdème, gêne respiratoire possible.', observations: "Risque d'anaphylaxie.", fc: '115', ta: '100/65', spo2: '93', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique', resultats_examen: 'Réaction allergique confirmée.', protocole: '• Adrénaline 0.3 à 0.5 mg IM\n• Cétirizine 10 mg\n• Méthylprednisolone 40 à 80 mg IV', complications: 'Choc anaphylactique possible', repos: 'Surveillance', antalgique: 'Aucun', anti_inflammatoire: 'Méthylprednisolone 40 à 80mg IV', antibiotique: 'Aucun', soins_locaux: 'Adrénaline 0.3 à 0.5mg IM + Cétirizine 10mg', ata: '24 heures', restrictions: "Éviter l'allergène", surveillance: '• Urticaire\n• Dyspnée\n• Choc anaphylactique' },
  { label: "Crise d'asthme", categorie: 'Autres', motif: "Crise d'asthme", gravite: 'MOYENNE', conscience: 'Conscient dyspnéique', diagnostic: "Exacerbation aiguë d'asthme", localisation_precise: 'Voies respiratoires', douleur: '4', signes_cliniques: 'Dyspnée, sifflements respiratoires, oppression thoracique.', observations: 'Bronchospasme aigu.', fc: '120', ta: '130/80', spo2: '90', temperature: '36.7', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Auscultation + saturation', resultats_examen: 'Bronchospasme confirmé.', protocole: '• Salbutamol 2.5 à 5 mg nébulisé\n• Ipratropium 0.5 mg nébulisé\n• Prednisone 40 mg/jour', complications: 'Détresse respiratoire possible', repos: 'Surveillance respiratoire', antalgique: 'Aucun', anti_inflammatoire: 'Prednisone 40mg/jour', antibiotique: 'Aucun', soins_locaux: 'Salbutamol + Ipratropium nébulisés', ata: '24 à 48 heures', restrictions: "Éviter les efforts", surveillance: '• Dyspnée\n• Sibilances\n• Cyanose' },
  { label: 'Hypothermie', categorie: 'Autres', motif: 'Hypothermie', gravite: 'GRAVE', conscience: 'Conscient ralenti ou altéré', diagnostic: 'Hypothermie', localisation_precise: 'Systémique', douleur: '2', signes_cliniques: 'Froid intense, frissons, ralentissement général, conscience altérée possible.', observations: 'Température centrale abaissée.', fc: '50', ta: '90/60', spo2: '92', temperature: '34.0', etat_constantes: 'Constantes altérées', type_examen: 'Température centrale + ECG', resultats_examen: 'Hypothermie confirmée.', protocole: '• Réchauffement passif/actif\n• NaCl 0.9 % tiédi IV', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Réchauffement passif/actif + NaCl 0.9% tiédi IV', ata: '24 à 48 heures', restrictions: 'Éviter le froid', surveillance: '• Troubles du rythme\n• Confusion\n• Frissons' },
  { label: 'Coup de chaleur', categorie: 'Autres', motif: 'Coup de chaleur', gravite: 'GRAVE', conscience: 'Conscient altéré possible', diagnostic: 'Hyperthermie par coup de chaleur', localisation_precise: 'Systémique', douleur: '5', signes_cliniques: 'Hyperthermie, malaise, tachycardie, altération neurologique possible.', observations: 'Urgence médicale thermique.', fc: '145', ta: '100/60', spo2: '94', temperature: '40.5', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Température centrale + bilan sanguin', resultats_examen: 'Hyperthermie importante confirmée.', protocole: '• Refroidissement rapide\n• NaCl 0.9 % IV', complications: 'Risque neurologique et rénal', repos: 'Hospitalisation', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Refroidissement rapide + NaCl 0.9% IV', ata: '24 à 48 heures', restrictions: 'Éviter la chaleur', surveillance: '• Température > 40°C\n• Confusion\n• Convulsions' },
  { label: 'Noyade', categorie: 'Autres', motif: 'Noyade', gravite: 'GRAVE', conscience: 'Conscient ou altéré selon gravité', diagnostic: 'Détresse respiratoire secondaire à immersion', localisation_precise: 'Respiratoire', douleur: '4', signes_cliniques: 'Dyspnée, toux, désaturation, détresse respiratoire possible.', observations: 'Surveillance respiratoire impérative.', fc: '130', ta: '105/70', spo2: '88', temperature: '35.8', etat_constantes: 'Constantes respiratoires instables', type_examen: 'Gaz du sang + radiographie thorax', resultats_examen: 'Atteinte respiratoire post-immersion confirmée.', protocole: '• Oxygène\n• Ventilation si besoin\n• Surveillance hospitalière', complications: 'Détresse respiratoire aiguë', repos: 'Hospitalisation', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Oxygène + ventilation si besoin', ata: '24 à 48 heures', restrictions: 'Aucune activité aquatique', surveillance: '• Dyspnée\n• Toux\n• Cyanose' },
];

const categories = [...new Set(blessures.map(b => b.categorie))];

const TEMPLATE = `⚕️ RAPPORT D'INTERVENTION MÉDICALE — SAMS

📅 Date : {{date}}
🕐 Heure de prise en charge : {{heure}}
🏥 Patient : {{civilite}} {{prenom}} {{nom}}
📋 Motif : {{motif}}
📍 Localisation : {{localisation}}
⚠️ Gravité : {{gravite}}

---

🩺 État initial à l'admission

État de conscience : {{conscience}}
Cause de la blessure : {{causes_blessure}}
Type de blessure : {{types_blessure}}
Blessure / symptôme principal : {{diagnostic}}
Localisation : {{localisation_precise}} {{localisation_libre}}
Niveau de douleur : {{douleur}}/10
Signes cliniques observés : {{signes_cliniques}}
Observations complémentaires : {{observations}}

---

🫀 Constantes vitales

FC : {{fc}} bpm | TA : {{ta}} mmHg | SpO₂ : {{spo2}} % | Température : {{temperature}} °C
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function gs(g: string) {
  if (g === 'GRAVE')   return { dot: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-500/10',     label: '● GRAVE',   active: 'border-red-500 bg-red-500/15 text-red-400' };
  if (g === 'MOYENNE') return { dot: 'bg-yellow-400',  text: 'text-yellow-400',  border: 'border-yellow-400/40',  bg: 'bg-yellow-400/10',  label: '● MOYENNE', active: 'border-yellow-400 bg-yellow-400/15 text-yellow-400' };
  return                      { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', label: '● LÉGÈRE',  active: 'border-emerald-400 bg-emerald-400/15 text-emerald-400' };
}

function ccv(key: string, val: string) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return 'text-gray-600 border-gray-700 bg-gray-900';
  if (key === 'fc'          && (n < 60 || n > 100))   return 'text-red-400 border-red-500/50 bg-red-500/10';
  if (key === 'spo2'        && n < 95)                 return 'text-red-400 border-red-500/50 bg-red-500/10';
  if (key === 'temperature' && (n < 36.1 || n > 37.8)) return 'text-red-400 border-red-500/50 bg-red-500/10';
  return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
}

function taColor(val: string) {
  const sys = parseFloat((val || '').split('/')[0]);
  if (!sys || sys === 0) return 'text-gray-600 border-gray-700 bg-gray-900';
  if (sys < 90 || sys > 140) return 'text-red-400 border-red-500/50 bg-red-500/10';
  return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
}

// ─── COMPOSANTS ──────────────────────────────────────────────────────────────
function Section({ icon, title, color = 'cyan', children }: { icon: string; title: string; color?: string; children: React.ReactNode }) {
  const c: Record<string,string> = {
    cyan:   'text-cyan-400 border-cyan-500/20 bg-cyan-500/4',
    red:    'text-red-400 border-red-500/20 bg-red-500/4',
    yellow: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/4',
    green:  'text-emerald-400 border-emerald-500/20 bg-emerald-500/4',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/4',
    orange: 'text-orange-400 border-orange-500/20 bg-orange-500/4',
  };
  const [hdr, bdr, bg] = (c[color]||c.cyan).split(' ');
  return (
    <div className={`rounded-2xl border ${bdr} ${bg} mb-4 overflow-hidden`} style={{background:'rgba(0,0,0,0.25)'}}>
      <div className={`flex items-center gap-2 px-5 py-3 border-b ${bdr}`}>
        <span>{icon}</span>
        <span className={`text-xs font-bold tracking-widest uppercase ${hdr}`}>{title}</span>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

const L = ({ t, req }: { t: string; req?: boolean }) => (
  <label className="block text-xs font-semibold tracking-widest uppercase text-gray-600 mb-1.5">
    {t}{req && <span className="text-red-400 ml-1">*</span>}
  </label>
);

const baseInput = "w-full bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-white placeholder-gray-700 focus:outline-none focus:border-white/25 transition text-sm";

function FI({ k, v, s, type='text', ph='' }: { k:string; v:Record<string,string>; s:(k:string,val:string)=>void; type?:string; ph?:string }) {
  return <input type={type} value={v[k]||''} onChange={e=>s(k,e.target.value)} placeholder={ph} className={baseInput}/>;
}

function FT({ k, v, s, ph='', rows=3 }: { k:string; v:Record<string,string>; s:(k:string,val:string)=>void; ph?:string; rows?:number }) {
  return <textarea value={v[k]||''} onChange={e=>s(k,e.target.value)} rows={rows} placeholder={ph} className={`${baseInput} resize-y`}/>;
}

function Chip({ label, active, onClick, ac }: { label:string; active?:boolean; onClick:()=>void; ac?:string }) {
  return (
    <button onClick={onClick} className={`text-xs px-3 py-1.5 rounded-full border transition ${active?(ac||'border-cyan-400 bg-cyan-500/15 text-cyan-300'):'border-white/10 text-gray-600 hover:border-white/20 hover:text-gray-400'}`}>
      {label}
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const tid = params.templateId as string;

  const [vals, setVals] = useState<Record<string,string>>({ civilite:'Monsieur', gravite:'LEGERE' });
  const [report, setReport] = useState('');
  const [step, setStep] = useState<'form'|'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showB, setShowB] = useState(false);
  const [cat, setCat] = useState(categories[0]);

  const configs: Record<string,{title:string;icon:string}> = {
    traumatologie:{title:'Traumatologie',icon:'🦴'}, chirurgie:{title:'Chirurgie',icon:'🔪'},
    consultation:{title:'Consultation générale',icon:'🩺'}, urgence:{title:'Urgence vitale',icon:'🚨'},
    intoxication:{title:'Intoxication',icon:'☠️'}, psychiatrie:{title:'Psychiatrie',icon:'🧠'},
    legiste:{title:'Médecin légiste',icon:'🔍'}, deces:{title:'Certificat de décès',icon:'📋'},
  };
  const cfg = configs[tid];
  if (!cfg) return <div className="text-red-400 p-8">Template introuvable.</div>;

  const set = (k:string, v:string) => setVals(p=>({...p,[k]:v}));

  function toggleList(key:string, val:string) {
    const arr = (vals[key]||'').split(', ').filter(Boolean);
    const i = arr.indexOf(val);
    if (i>=0) arr.splice(i,1); else arr.push(val);
    set(key, arr.join(', '));
  }

  function applyB(b: typeof blessures[0]) {
    setVals(p=>({...p,
      // ── Ce que le raccourci NE touche PAS ──────────────────
      // motifs_selection, motif_libre, localisation (lieu), nom, prenom, date, heure, civilite, redacteur
      // ── Ce que le raccourci REMPLIT ────────────────────────
      gravite:        b.gravite,
      conscience:     b.conscience,
      diagnostic:     b.diagnostic,        // description médicale de la blessure
      types_blessure: b.label.includes('Fracture') ? 'Fracture'
                    : b.label.includes('Brûlure')  ? 'Brulure'
                    : b.label.includes('BPB') || b.label.includes('balle') ? 'Balle'
                    : b.label.includes('Couteau') || b.label.includes('blanche') ? 'Couteau'
                    : b.label.includes('Noyade') ? 'Noyade'
                    : b.label.includes('Intox') || b.label.includes('allerg') ? 'Intoxication'
                    : b.label.includes('AVP') ? 'AVP'
                    : b.label.includes('Chute') ? 'Chute'
                    : 'Autre',
      // Localisation : chips vides, champ libre vide
      localisation_precise: '',
      localisation_libre:   '',
      // Observations ← localisation précise médicale du raccourci
      observations:         b.localisation_precise,
      douleur:              b.douleur,
      signes_cliniques:     b.signes_cliniques,
      fc:b.fc, ta:b.ta, spo2:b.spo2, temperature:b.temperature,
      etat_constantes:b.etat_constantes,
      type_examen:b.type_examen, resultats_examen:b.resultats_examen,
      protocole:b.protocole, complications:b.complications, repos:b.repos,
      antalgique:b.antalgique, anti_inflammatoire:b.anti_inflammatoire,
      antibiotique:b.antibiotique, soins_locaux:b.soins_locaux,
      ata:b.ata, restrictions:b.restrictions, surveillance:b.surveillance,
    }));
    setShowB(false);
  }

  async function generate() {
    setLoading(true); setErr('');
    const gt = vals.gravite==='GRAVE'?'🔴 GRAVE':vals.gravite==='MOYENNE'?'🟡 MOYENNE':'🟢 LÉGÈRE';
    // Fusionner les motifs multi-sélection + champ libre
    const motifParts = [vals.motifs_selection, vals.motif_libre].filter(Boolean);
    const motif = motifParts.join(' — ') || '—';
    try {
      const res = await fetch('/api/generate-report',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({template:TEMPLATE,values:{...vals,gravite:gt,motif}})});
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      setReport(data.report); setStep('preview');
    } catch { setErr('Erreur lors de la génération.'); }
    setLoading(false);
  }

  async function save() {
    setSaving(true); setErr('');
    const supabase = createClient();
    const {data:{user}} = await supabase.auth.getUser();
    if(!user){setErr('Non authentifié');setSaving(false);return;}
    const name=`${vals.prenom||''} ${vals.nom||''}`.trim()||'Inconnu';
    const filename=`${tid}_${name.replace(/\s/g,'_')}_${Date.now()}.txt`;
    const {error:e} = await supabase.from('archives').insert({
      owner_id:user.id, universe:'fivem', template_name:cfg.title,
      patient_name:name, storage_path:`${user.id}/${filename}`,
      filename, field_values:vals, rendered_body:report,
    });
    if(e){setErr('Erreur : '+e.message);setSaving(false);return;}
    router.push('/fivem/archives');
  }

  const g = gs(vals.gravite||'LEGERE');

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={()=>step==='preview'?setStep('form'):router.back()} className="text-gray-600 hover:text-white transition text-sm">← Retour</button>
        <h1 className="text-xl font-bold text-white">{cfg.icon} {cfg.title}</h1>
        <span className="text-xs text-gray-600 bg-white/4 px-2 py-1 rounded-full border border-white/8">{step==='form'?'Formulaire':'Rapport généré'}</span>
      </div>

      {step==='form' && (<>
        {/* RACCOURCIS */}
        <div className="mb-4">
          <button onClick={()=>setShowB(!showB)}
            className="w-full flex items-center justify-between px-5 py-3 rounded-2xl border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-widest uppercase hover:bg-cyan-500/8 transition" style={{background:'rgba(6,182,212,0.04)'}}>
            <span>🩹 Raccourcis blessures — remplissage automatique</span>
            <span className="text-gray-600">{showB?'▲':'▼'}</span>
          </button>
          {showB && (
            <div className="mt-2 rounded-2xl border border-white/8 p-4" style={{background:'rgba(0,0,0,0.4)'}}>
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map(c=>(
                  <button key={c} onClick={()=>setCat(c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${cat===c?'border-cyan-400 bg-cyan-500/15 text-cyan-300':'border-white/10 text-gray-600 hover:text-gray-400 hover:border-white/20'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {blessures.filter(b=>b.categorie===cat).map(b=>{
                  const s=gs(b.gravite);
                  return (
                    <button key={b.label} onClick={()=>applyB(b)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition ${s.border} ${s.bg} ${s.text} hover:opacity-70`}>
                      {b.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/8">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>LÉGÈRE</span>
                <span className="flex items-center gap-1.5 text-xs text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>MOYENNE</span>
                <span className="flex items-center gap-1.5 text-xs text-red-400"><span className="w-2 h-2 rounded-full bg-red-500"></span>GRAVE</span>
              </div>
            </div>
          )}
        </div>

        {/* S1 INFOS GÉNÉRALES */}
        <Section icon="📋" title="Informations générales" color="cyan">
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Date" req/><FI k="date" v={vals} s={set} type="date"/></div>
            <div>
              <L t="Heure de prise en charge"/>
              <div className="flex gap-2">
                <input type="time" value={vals.heure||''} onChange={e=>set('heure',e.target.value)} className="flex-1 bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/25 transition text-sm"/>
                <button onClick={()=>set('heure',new Date().toTimeString().slice(0,5))} className="px-3 text-xs font-bold border border-white/10 rounded-xl text-gray-500 hover:border-white/25 hover:text-white transition whitespace-nowrap">MAINTENANT</button>
              </div>
            </div>
          </div>
          <div>
            <L t="Civilité"/>
            <div className="flex gap-2">
              {['Monsieur','Madame'].map(c=>(
                <button key={c} onClick={()=>set('civilite',c)} className={`px-4 py-1.5 rounded-full text-sm border transition ${vals.civilite===c?'bg-cyan-500 border-cyan-400 text-white font-bold':'border-white/10 text-gray-500 hover:border-white/20'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div><L t="Nom du patient" req/><FI k="nom" v={vals} s={set} ph="Nom Prénom"/></div>
          <div><L t="Prénom"/><FI k="prenom" v={vals} s={set} ph="Ex: Jackson"/></div>
          <div>
            {/* MOTIF : multi-sélection + champ libre. Le raccourci ne touche PAS ce champ. */}
            <L t="Motif de déclenchement"/>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Blessure par balle','Couteau','AVP','Chute','Noyade','Rixe','Acc. travail','Malaise','Brulure','Overdose'].map(m=>(
                <Chip key={m} label={m} active={(vals.motifs_selection||'').includes(m)} onClick={()=>toggleList('motifs_selection',m)}/>
              ))}
            </div>
            <input value={vals.motif_libre||''} onChange={e=>set('motif_libre',e.target.value)} placeholder="Autre motif ou précisions..." className={baseInput}/>
          </div>
          <div><L t="Lieu d'intervention"/><FI k="localisation" v={vals} s={set} ph="Adresse ou quartier..."/></div>
        </Section>

        {/* S2 BLESSURES */}
        <Section icon="🩹" title="Blessures" color="red">

          {/* CAUSE DE LA BLESSURE (multi-select) */}
          <div>
            <L t="Cause de la blessure"/>
            <div className="flex flex-wrap gap-2">
              {['Blessure par balle','Couteau','AVP','Chute','Noyade','Rixe','Acc. travail','Malaise','Brulure','Overdose'].map(c=>(
                <Chip key={c} label={c} active={(vals.causes_blessure||'').includes(c)} onClick={()=>toggleList('causes_blessure',c)} ac="border-orange-500 bg-orange-500/15 text-orange-300"/>
              ))}
            </div>
          </div>

          {/* TYPE DE BLESSURE (multi-select) */}
          <div>
            <L t="Type de blessure(s)" req/>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Balle','Couteau','Brulure','Fracture','AVP','Chute','Noyade','Intoxication','Autre'].map(t=>(
                <Chip key={t} label={t} active={(vals.types_blessure||'').includes(t)} onClick={()=>toggleList('types_blessure',t)} ac="border-red-500 bg-red-500/15 text-red-300"/>
              ))}
            </div>
            {/* champ texte libre pour le diagnostic principal (rempli par raccourci) */}
            <input value={vals.diagnostic||''} onChange={e=>set('diagnostic',e.target.value)} placeholder="Blessure / symptôme principal..." className={baseInput}/>
          </div>

          {/* LOCALISATION : chips multi-select + champ vide au départ */}
          <div>
            <L t="Localisation" req/>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Tête','Visage','Cou','Épaule G.','Épaule D.','Thorax','Abdomen','Dos','Bras G.','Bras D.','Main G.','Main D.','Bassin','Jambe G.','Jambe D.','Pied G.','Pied D.'].map(l=>(
                <Chip key={l} label={l} active={(vals.localisation_precise||'').includes(l)} onClick={()=>toggleList('localisation_precise',l)} ac="border-red-500 bg-red-500/15 text-red-300"/>
              ))}
            </div>
            {/* champ toujours vide à l'init et après raccourci */}
            <input value={vals.localisation_libre||''} onChange={e=>set('localisation_libre',e.target.value)} placeholder="Précisez si nécessaire..." className={baseInput}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><L t="Signes cliniques"/><FT k="signes_cliniques" v={vals} s={set} ph="Observations cliniques..." rows={3}/></div>
            {/* Observations = localisation précise médicale venue du raccourci */}
            <div><L t="Observations"/><FT k="observations" v={vals} s={set} ph="Ex : Segment osseux atteint, zone lésée..." rows={3}/></div>
          </div>
        </Section>

        {/* S3 CONSTANTES */}
        <Section icon="🫀" title="Constantes vitales" color="purple">
          <div className="grid grid-cols-2 gap-4">
            {[{k:'fc',l:'FC',u:'bpm',n:'Normal : 60–100',p:'88'},{k:'spo2',l:'SPO2',u:'%',n:'Normal : 95–100',p:'98'},{k:'temperature',l:'Température',u:'°C',n:'Normal : 36.1–37.8',p:'36.9'}].map(({k,l,u,n,p})=>{
              const cc=ccv(k,vals[k]||'');
              return (
                <div key={k}>
                  <L t={l}/>
                  <div className={`flex items-center border rounded-xl overflow-hidden ${cc}`}>
                    <input type="text" value={vals[k]||''} onChange={e=>set(k,e.target.value)} placeholder={p} className="flex-1 bg-transparent px-4 py-2.5 text-current placeholder-gray-700 focus:outline-none text-sm font-mono"/>
                    <span className="px-3 text-xs font-bold opacity-50">{u}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">{n}</p>
                </div>
              );
            })}
            <div>
              <L t="Tension artérielle"/>
              <div className={`flex items-center border rounded-xl overflow-hidden ${taColor(vals.ta||'')}`}>
                <input type="text" value={vals.ta?.split('/')[0]||''} onChange={e=>set('ta',`${e.target.value}/${vals.ta?.split('/')[1]||''}`)} placeholder="120" className="w-16 bg-transparent px-4 py-2.5 text-current placeholder-gray-700 focus:outline-none text-sm font-mono"/>
                <span className="text-gray-600 font-bold">/</span>
                <input type="text" value={vals.ta?.split('/')[1]||''} onChange={e=>set('ta',`${vals.ta?.split('/')[0]||''}/${e.target.value}`)} placeholder="80" className="w-16 bg-transparent px-4 py-2.5 text-current placeholder-gray-700 focus:outline-none text-sm font-mono"/>
                <span className="px-3 text-xs font-bold opacity-50">mmHg</span>
              </div>
              <p className="text-xs text-gray-700 mt-1">Normal : 120/80</p>
            </div>
          </div>
          <div>
            <L t="Douleur par zone"/>
            <div className="flex flex-wrap gap-2">
              {['Tête','Visage','Cou','Épaule G.','Épaule D.','Thorax','Abdomen','Dos','Bras G.','Bras D.','Main G.','Main D.','Bassin','Jambe G.','Jambe D.','Pied G.','Pied D.'].map(z=>(
                <Chip key={z} label={z} active={vals.douleur_zones?.includes(z)} onClick={()=>{toggleList('douleur_zones',z);if(!vals.douleur)set('douleur','5');}} ac="border-purple-400 bg-purple-500/15 text-purple-300"/>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Douleur (/10)"/><FI k="douleur" v={vals} s={set} ph="Ex: 7"/></div>
            <div><L t="État des constantes"/><FI k="etat_constantes" v={vals} s={set} ph="Ex: Constantes stables"/></div>
          </div>
        </Section>

        {/* S4 SOINS */}
        <Section icon="💉" title="Soins effectués" color="cyan">
          <div><L t="Protocole de soins"/><FT k="protocole" v={vals} s={set} ph={"• Désinfection\n• Suture\n• Pansement..."} rows={4}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Antalgique"/><FI k="antalgique" v={vals} s={set} ph="Ex: Paracétamol 1g x3/jour"/></div>
            <div><L t="Anti-inflammatoire"/><FI k="anti_inflammatoire" v={vals} s={set} ph="Ex: Ibuprofène 400mg"/></div>
            <div><L t="Antibiotique"/><FI k="antibiotique" v={vals} s={set} ph="Ex: Aucun"/></div>
            <div><L t="Soins locaux"/><FT k="soins_locaux" v={vals} s={set} ph="Ex: Pansement quotidien..." rows={2}/></div>
          </div>
          <div><L t="Examens réalisés"/><FI k="type_examen" v={vals} s={set} ph="Ex: Radiologie, scanner..."/></div>
          <div><L t="Résultats examens"/><FT k="resultats_examen" v={vals} s={set} ph="Ex: Aucune atteinte interne..." rows={2}/></div>
        </Section>

        {/* S5 GRAVITÉ */}
        <Section icon="⚠️" title="Gravité & Opération" color="yellow">
          <div>
            <L t="Gravité"/>
            <div className="flex gap-3">
              {(['LEGERE','MOYENNE','GRAVE'] as const).map(gv=>{
                const s=gs(gv);
                return (
                  <button key={gv} onClick={()=>set('gravite',gv)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-widest transition ${vals.gravite===gv?s.active:'border-white/10 text-gray-600 hover:border-white/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dot}`}></span>{gv}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <L t="État de conscience"/>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Conscient orienté','Conscient douloureux','Inconscient','Non coopératif','Altéré'].map(c=>(
                <Chip key={c} label={c} active={vals.conscience===c} onClick={()=>set('conscience',vals.conscience===c?'':c)} ac="border-yellow-400 bg-yellow-500/15 text-yellow-300"/>
              ))}
            </div>
            <input value={vals.conscience||''} onChange={e=>set('conscience',e.target.value)} placeholder="Précisez..." className={baseInput}/>
          </div>
          <div><L t="Complications éventuelles"/><FT k="complications" v={vals} s={set} ph="Ex: Aucune complication" rows={2}/></div>
        </Section>

        {/* S6 RECOMMANDATIONS */}
        <Section icon="📌" title="Recommandations de suivi" color="green">
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Durée d'ATA"/><FI k="ata" v={vals} s={set} ph="Ex: 24 à 48 heures"/></div>
            <div><L t="Repos"/><FI k="repos" v={vals} s={set} ph="Ex: Repos relatif"/></div>
          </div>
          <div><L t="Restrictions physiques"/><FT k="restrictions" v={vals} s={set} ph="Ex: Éviter les efforts physiques..." rows={2}/></div>
          <div><L t="Surveillance des symptômes"/><FT k="surveillance" v={vals} s={set} ph={"• Douleur importante\n• Fièvre\n• Saignement..."} rows={3}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Date du contrôle"/><FI k="suivi_date" v={vals} s={set} ph="Ex: Dans les 24h"/></div>
            <div><L t="Examens de suivi"/><FI k="examens_suivi" v={vals} s={set} ph="Ex: Radio de contrôle"/></div>
          </div>
          <div><L t="Observations suivi"/><FI k="observations_suivi" v={vals} s={set} ph="Ex: Vérification cicatrisation"/></div>
        </Section>

        {/* S7 RÉDACTEUR */}
        <Section icon="✍️" title="Rapport rédigé par" color="orange">
          <div><L t="Nom & Grade" req/><FI k="redacteur" v={vals} s={set} ph="Ex: Ambulancier Ethan Skoll"/></div>
        </Section>

        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        <button onClick={generate} disabled={loading}
          className="w-full mt-2 bg-white/6 hover:bg-white/10 disabled:opacity-40 border border-white/15 text-white font-bold rounded-2xl px-8 py-4 transition text-sm tracking-widest uppercase">
          {loading?'⏳ Génération...':'📄 Générer le rapport'}
        </button>
      </>)}

      {step==='preview' && (<>
        <div className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${g.border} ${g.bg}`}>
          <span className={`text-xs font-bold tracking-widest ${g.text}`}>{g.label}</span>
          <span className="text-gray-600">—</span>
          <span className="text-gray-400 text-sm">{vals.civilite} {vals.prenom} {vals.nom}</span>
        </div>
        <div className="rounded-2xl border border-white/8 p-6" style={{background:'rgba(0,0,0,0.3)'}}>
          <textarea value={report} onChange={e=>setReport(e.target.value)} rows={50}
            className="w-full bg-transparent text-white text-sm font-mono focus:outline-none resize-y leading-relaxed"/>
        </div>
        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        <div className="mt-6 flex gap-4">
          <button onClick={save} disabled={saving}
            className="flex-1 bg-white/6 hover:bg-white/10 disabled:opacity-40 border border-white/15 text-white font-bold rounded-2xl px-8 py-4 transition text-sm tracking-widest uppercase">
            {saving?'💾 Sauvegarde...':'💾 Sauvegarder dans les archives'}
          </button>
          <button onClick={()=>setStep('form')} className="border border-white/10 hover:border-white/20 text-gray-600 hover:text-white font-bold rounded-2xl px-6 py-4 transition text-sm">✏️ Modifier</button>
        </div>
      </>)}
    </div>
  );
}
