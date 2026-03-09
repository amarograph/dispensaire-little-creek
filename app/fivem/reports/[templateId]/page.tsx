'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const blessures = [
  { label: 'Fracture simple', categorie: 'Os & Articulations', motif: 'Fracture simple', gravite: '🟠 Orange', conscience: 'Conscient, orienté et coopérant', diagnostic: 'Fracture simple du membre', localisation_precise: 'Bras, jambe, poignet ou cheville', douleur: '7', signes_cliniques: 'Douleur importante, impotence fonctionnelle partielle, œdème local.', observations: 'Suspicion de fracture simple sans exposition osseuse.', fc: '95', ta: '125/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fracture simple visible à la radiographie.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Immobilisation par attelle', complications: 'Aucune', repos: 'Repos strict du membre', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle', ata: 'Non requis', restrictions: "Pas d'appui sur le membre", surveillance: '• Douleur croissante\n• Œdème important\n• Engourdissement' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', motif: 'Fracture ouverte', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', localisation_precise: 'Segment osseux atteint', douleur: '9', signes_cliniques: 'Plaie ouverte avec exposition osseuse, saignement, douleur intense.', observations: 'Risque infectieux élevé.', fc: '110', ta: '110/70', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Fracture ouverte confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Céfazoline 2 g IV\n• Pansement stérile\n• Immobilisation\n• Chirurgie', complications: 'Risque infectieux', repos: 'Hospitalisation et repos strict', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Pansement stérile + immobilisation', ata: '48 à 72 heures', restrictions: 'Aucun appui, aucun effort', surveillance: '• Fièvre\n• Rougeur ou écoulement\n• Douleur croissante' },
  { label: 'Fissure osseuse', categorie: 'Os & Articulations', motif: 'Fissure osseuse', gravite: '🟡 Jaune', conscience: 'Conscient, orienté', diagnostic: 'Fissure osseuse non déplacée', localisation_precise: 'Os atteint', douleur: '5', signes_cliniques: 'Douleur localisée, œdème léger, mobilisation douloureuse.', observations: 'Pas de déplacement osseux.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fine ligne de fissure visible sans déplacement.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Attelle\n• Repos', complications: 'Aucune', repos: 'Repos fonctionnel', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + repos', ata: 'Non requis', restrictions: 'Éviter les efforts', surveillance: '• Douleur croissante\n• Gonflement' },
  { label: 'Luxation', categorie: 'Os & Articulations', motif: 'Luxation', gravite: '🟠 Orange', conscience: 'Conscient et orienté', diagnostic: 'Luxation articulaire', localisation_precise: 'Épaule, doigt ou genou', douleur: '8', signes_cliniques: 'Déformation articulaire visible, douleur intense, impotence fonctionnelle.', observations: 'Pas de fracture associée visible.', fc: '100', ta: '130/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Luxation confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Kétoprofène 100 mg x2/jour\n• Réduction articulaire\n• Écharpe', complications: 'Aucune', repos: 'Repos articulaire', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Réduction articulaire + écharpe', ata: '24 à 48 heures', restrictions: 'Immobilisation du membre', surveillance: '• Douleur persistante\n• Perte de mobilité' },
  { label: 'Entorse', categorie: 'Os & Articulations', motif: 'Entorse', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Entorse ligamentaire', localisation_precise: 'Cheville, genou ou poignet', douleur: '6', signes_cliniques: 'Œdème, douleur à la mobilisation, sensibilité ligamentaire.', observations: 'Pas de fracture radiologique.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique + radiologie si besoin', resultats_examen: 'Atteinte ligamentaire probable.', protocole: '• Ibuprofène 400 mg x3/jour\n• Diclofénac gel 1 % x3/jour\n• Attelle\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour si douleur', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + glace', ata: 'Non requis', restrictions: 'Éviter la marche prolongée', surveillance: '• Gonflement\n• Douleur à la mise en charge' },
  { label: 'Contusion osseuse', categorie: 'Os & Articulations', motif: 'Contusion osseuse', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Contusion osseuse sans fracture visible', localisation_precise: 'Zone osseuse traumatisée', douleur: '4', signes_cliniques: 'Douleur localisée, ecchymose, sensibilité à la palpation.', observations: 'Absence de fracture visible.', fc: '78', ta: '118/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Radiologie', resultats_examen: 'Aucune fracture visible.', protocole: '• Paracétamol 1 g x3/jour\n• Glace\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Glace + repos', ata: 'Non requis', restrictions: 'Activité réduite', surveillance: '• Douleur persistante\n• Gonflement' },
  { label: 'Plaie ouverte / lacération', categorie: 'Plaies', motif: 'Plaie ouverte / lacération', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Plaie profonde avec atteinte des tissus mous', localisation_precise: 'Zone cutanée atteinte', douleur: '6', signes_cliniques: 'Plaie ouverte avec saignement modéré, douleur locale.', observations: "Pas d'atteinte vasculaire évidente.", fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie profonde sans atteinte organique.', protocole: '• Paracétamol 1 g x3/jour\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Désinfection\n• Suture\n• Pansement', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Désinfection + suture + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Chaleur\n• Écoulement' },
  { label: 'Plaie superficielle', categorie: 'Plaies', motif: 'Plaie superficielle', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Plaie superficielle cutanée', localisation_precise: 'Peau superficielle', douleur: '3', signes_cliniques: 'Plaie peu profonde, saignement faible, douleur légère.', observations: "Pas d'atteinte profonde.", fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Plaie superficielle simple.', protocole: '• Paracétamol 1 g x3/jour si douleur\n• Chlorhexidine locale\n• Pansement', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour si douleur', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Chlorhexidine + pansement', ata: 'Non requis', restrictions: 'Aucune', surveillance: '• Rougeur\n• Gonflement' },
  { label: 'Hématome', categorie: 'Plaies', motif: 'Hématome', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Hématome sous-cutané post-traumatique', localisation_precise: 'Zone de choc', douleur: '4', signes_cliniques: 'Ecchymose, gonflement local, douleur modérée.', observations: 'Pas de signe de fracture associée.', fc: '80', ta: '120/80', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Hématome simple.', protocole: '• Paracétamol 1 g x3/jour\n• Diclofénac gel 1 % x3/jour\n• Glace', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Diclofénac gel 1% x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Augmentation du volume\n• Douleur croissante' },
  { label: 'Écrasement de membre', categorie: 'Plaies', motif: 'Écrasement de membre', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme par écrasement avec risque de syndrome de loge', localisation_precise: 'Membre écrasé', douleur: '9', signes_cliniques: 'Douleur intense, œdème majeur, risque de compression vasculo-nerveuse.', observations: 'Surveillance chirurgicale nécessaire.', fc: '115', ta: '110/70', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Traumatisme sévère du membre, lésions tissulaires importantes.', protocole: '• Morphine 2 à 5 mg IV\n• NaCl 0.9 % IV\n• Immobilisation\n• Surveillance chirurgicale', complications: 'Risque de syndrome de loge', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Immobilisation + surveillance chirurgicale', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Douleur intense\n• Perte de sensibilité\n• Cyanose' },
  { label: 'Amputation traumatique', categorie: 'Plaies', motif: 'Amputation traumatique', gravite: '🔴 Rouge', conscience: 'Conscient ou altéré selon hémorragie', diagnostic: 'Amputation traumatique partielle ou complète', localisation_precise: 'Segment amputé', douleur: '10', signes_cliniques: 'Section partielle ou complète, hémorragie importante, douleur majeure.', observations: 'Risque vital hémorragique.', fc: '140', ta: '90/60', spo2: '93', temperature: '36.4', etat_constantes: 'Constantes instables', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Amputation traumatique confirmée.', protocole: '• Morphine 5 mg IV\n• Acide tranexamique 1 g IV\n• Céfazoline 2 g IV\n• Garrot/pansement compressif\n• Chirurgie', complications: 'Choc hémorragique possible', repos: 'Hospitalisation en urgence', antalgique: 'Morphine 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Garrot + pansement compressif + chirurgie', ata: '72 heures minimum', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Infection\n• Douleur fantôme' },
  { label: 'Corps étranger dans plaie', categorie: 'Plaies', motif: 'Corps étranger dans une plaie', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Plaie avec corps étranger inclus', localisation_precise: 'Tissus mous atteints', douleur: '5', signes_cliniques: 'Douleur locale, inflammation, gêne mécanique possible.', observations: "Présence probable d'un corps étranger.", fc: '85', ta: '120/75', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Corps étranger visualisé dans la plaie.', protocole: '• Lidocaïne 1 % locale\n• Paracétamol 1 g x3/jour\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Extraction\n• Pansement', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'BPB traversante', categorie: 'Armes', motif: 'Blessure par balle traversante', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle traversante', localisation_precise: "Zone d'impact projectile", douleur: '9', signes_cliniques: "Plaie pénétrante avec orifice d'entrée et de sortie, saignement possible.", observations: 'Risque hémorragique interne et externe.', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes instables', type_examen: 'Scanner + radiologie + bilan sanguin', resultats_examen: 'Trajectoire du projectile confirmée.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Céfazoline 2 g IV\n• Perfusion\n• Chirurgie si nécessaire', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Pansement stérile + chirurgie si nécessaire', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Fièvre\n• Douleur thoracique ou abdominale' },
  { label: 'BPB non traversante', categorie: 'Armes', motif: 'Blessure par balle non traversante', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle non traversante avec projectile retenu', localisation_precise: "Zone d'impact projectile", douleur: '9', signes_cliniques: "Plaie pénétrante sans orifice de sortie, douleur intense, saignement.", observations: 'Projectile retenu dans les tissus.', fc: '110', ta: '115/75', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + scanner', resultats_examen: 'Projectile localisé dans les tissus.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 4 mg IV\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Pansement\n• Extraction chirurgicale si besoin', complications: 'Risque infectieux et hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 4mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Pansement + extraction chirurgicale si besoin', ata: '24 à 48 heures', restrictions: 'Aucun effort physique', surveillance: '• Douleur abdominale\n• Fièvre\n• Saignement' },
  { label: 'Arme blanche', categorie: 'Armes', motif: 'Blessure par arme blanche', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Plaie pénétrante par arme blanche', localisation_precise: 'Zone de pénétration', douleur: '8', signes_cliniques: 'Plaie profonde, saignement, douleur importante.', observations: "Profondeur variable, risque d'atteinte organique.", fc: '110', ta: '115/75', spo2: '95', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + scanner si profondeur', resultats_examen: 'Plaie pénétrante confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Suture ou chirurgie', complications: 'Risque hémorragique', repos: 'Surveillance hospitalière', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Suture ou chirurgie', ata: '24 à 48 heures', restrictions: 'Aucun effort', surveillance: '• Saignement\n• Fièvre\n• Douleur croissante' },
  { label: 'Éclats métalliques', categorie: 'Armes', motif: 'Éclats métalliques / fragments', gravite: '🟠 Orange', conscience: 'Conscient', diagnostic: 'Plaie avec fragments métalliques', localisation_precise: 'Zone atteinte par éclats', douleur: '7', signes_cliniques: 'Plaies multiples ou localisées, douleur, inflammation locale.', observations: 'Présence possible de plusieurs fragments.', fc: '100', ta: '120/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fragments métalliques visibles.', protocole: '• Paracétamol 1 g x3/jour\n• Lidocaïne 1 % locale\n• Amoxicilline/acide clavulanique 1 g x3/jour\n• Extraction\n• Pansement', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Aucune', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'Brûlure 1er degré', categorie: 'Brûlures', motif: 'Brûlure du 1er degré', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Brûlure superficielle du 1er degré', localisation_precise: 'Zone cutanée atteinte', douleur: '4', signes_cliniques: 'Rougeur cutanée, douleur modérée, absence de cloques.', observations: 'Atteinte superficielle simple.', fc: '85', ta: '120/75', spo2: '99', temperature: '36.8', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Brûlure superficielle confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Crème apaisante\n• Hydratation', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: "Crème apaisante + hydratation", ata: 'Non requis', restrictions: "Éviter l'exposition solaire", surveillance: '• Cloque\n• Infection' },
  { label: 'Brûlure 2e degré superficiel', categorie: 'Brûlures', motif: 'Brûlure du 2e degré superficiel', gravite: '🟠 Orange', conscience: 'Conscient', diagnostic: 'Brûlure du 2e degré superficiel', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Cloques, rougeur, douleur vive.', observations: 'Atteinte dermique superficielle.', fc: '100', ta: '125/80', spo2: '98', temperature: '37.2', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure du 2e degré superficiel confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 4 mg IV si douleur\n• Sulfadiazine argentique 1 %\n• Pansement', complications: 'Risque infectieux', repos: 'Repos', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Sulfadiazine argentique 1% + pansement', ata: '24 à 48 heures', restrictions: "Éviter contact avec l'eau", surveillance: '• Fièvre\n• Écoulement\n• Odeur' },
  { label: 'Brûlure 2e degré profond', categorie: 'Brûlures', motif: 'Brûlure du 2e degré profond', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Brûlure du 2e degré profond', localisation_precise: 'Zone cutanée atteinte', douleur: '9', signes_cliniques: 'Atteinte cutanée profonde, douleur importante, peau lésée.', observations: 'Surveillance spécialisée si étendue.', fc: '110', ta: '115/70', spo2: '97', temperature: '37.3', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + bilan sanguin si étendue', resultats_examen: 'Brûlure profonde confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 3 à 5 mg IV\n• Sulfadiazine argentique 1 %\n• Pansement spécialisé', complications: 'Risque infectieux et cicatriciel', repos: 'Surveillance hospitalière', antalgique: 'Morphine 3 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Sulfadiazine argentique 1% + pansement spécialisé', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Fièvre\n• Nécrose\n• Infection' },
  { label: 'Brûlure 3e degré', categorie: 'Brûlures', motif: 'Brûlure du 3e degré', gravite: '🔴 Rouge', conscience: 'Conscient ou altéré selon étendue', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Peau nécrosée, atteinte profonde, zone parfois insensible.', observations: 'Risque vital si étendue importante.', fc: '130', ta: '100/65', spo2: '95', temperature: '37.1', etat_constantes: 'Constantes instables possibles', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Brûlure du 3e degré confirmée.', protocole: '• Morphine 3 à 5 mg IV\n• Ringer lactate IV\n• Pansement stérile\n• Chirurgie', complications: "Risque de choc et d'infection", repos: 'Hospitalisation', antalgique: 'Morphine 3 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Pansement stérile + chirurgie', ata: '72 heures minimum', restrictions: 'Aucun effort', surveillance: '• Infection\n• Nécrose étendue\n• Sepsis' },
  { label: 'Brûlure chimique', categorie: 'Brûlures', motif: 'Brûlure chimique', gravite: '🟠 Orange', conscience: 'Conscient', diagnostic: 'Brûlure chimique cutanée', localisation_precise: 'Zone exposée au produit', douleur: '7', signes_cliniques: 'Lésion cutanée douloureuse après contact chimique.', observations: 'Importance du rinçage immédiat.', fc: '105', ta: '120/75', spo2: '97', temperature: '36.9', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure chimique confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV si douleur\n• Rinçage abondant\n• Pansement', complications: "Risque d'aggravation locale", repos: 'Repos et surveillance', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Rinçage abondant + pansement', ata: '24 heures', restrictions: 'Éviter tout contact avec le produit', surveillance: '• Rougeur persistante\n• Douleur\n• Fièvre' },
  { label: 'Brûlure électrique', categorie: 'Brûlures', motif: 'Brûlure électrique', gravite: '🔴 Rouge', conscience: 'Conscient à surveiller', diagnostic: 'Brûlure électrique avec risque de lésion profonde', localisation_precise: "Point d'entrée et de sortie électrique", douleur: '7', signes_cliniques: 'Lésions cutanées parfois limitées avec atteinte profonde possible.', observations: 'Surveillance cardiaque indispensable.', fc: '115', ta: '120/75', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'ECG + bilan sanguin', resultats_examen: "Brûlure électrique confirmée, recherche d'atteinte profonde.", protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Perfusion IV\n• Surveillance cardiaque', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Perfusion IV + surveillance cardiaque', ata: '24 à 48 heures', restrictions: 'Aucune activité physique', surveillance: '• Troubles du rythme\n• Douleur musculaire\n• Urines foncées' },
  { label: 'Traumatisme crânien léger', categorie: 'Crâne & Neurologie', motif: 'Traumatisme crânien léger', gravite: '🟡 Jaune', conscience: 'Conscient orienté', diagnostic: 'Traumatisme crânien léger', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: 'Céphalées, vertiges, douleur post-traumatique.', observations: 'Pas de déficit neurologique.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Scanner cérébral si besoin + examen neurologique', resultats_examen: "Pas d'hémorragie intracrânienne.", protocole: '• Paracétamol 1 g x3/jour\n• Surveillance neurologique', complications: 'Aucune', repos: 'Repos neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Surveillance neurologique', ata: '24 heures', restrictions: "Pas d'écran, pas d'effort", surveillance: '• Vomissements\n• Perte de conscience\n• Céphalées intenses' },
  { label: 'Commotion cérébrale', categorie: 'Crâne & Neurologie', motif: 'Commotion cérébrale', gravite: '🟡 Jaune', conscience: 'Conscient, parfois confus initialement', diagnostic: 'Commotion cérébrale', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: "Céphalées, nausées, vertiges, trouble bref de l'orientation possible.", observations: 'Surveillance neurologique recommandée.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: "Examen neurologique + scanner si signes d'alerte", resultats_examen: 'Pas de lésion intracrânienne visible si imagerie réalisée.', protocole: '• Paracétamol 1 g x3/jour\n• Repos neurologique', complications: 'Aucune complication immédiate', repos: 'Repos strict neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Repos neurologique strict', ata: '24 à 48 heures', restrictions: "Pas d'écran, pas d'effort", surveillance: '• Confusion\n• Vomissements\n• Troubles visuels' },
  { label: 'Traumatisme crânien sévère', categorie: 'Crâne & Neurologie', motif: 'Traumatisme crânien sévère', gravite: '🔴 Rouge', conscience: 'Altérée ou fluctuante', diagnostic: 'Traumatisme crânien sévère', localisation_precise: 'Crâne', douleur: '10', signes_cliniques: 'Altération neurologique, céphalées sévères, vomissements, baisse de vigilance.', observations: 'Risque vital neurologique.', fc: '120', ta: '150/90', spo2: '93', temperature: '37.1', etat_constantes: 'Constantes instables neurologiquement', type_examen: 'Scanner cérébral + bilan sanguin', resultats_examen: 'Lésion intracrânienne possible, surveillance intensive nécessaire.', protocole: '• Intubation si besoin\n• Mannitol 0.25 à 1 g/kg IV ou NaCl hypertonique\n• Soins intensifs', complications: "Risque d'hypertension intracrânienne", repos: 'Soins intensifs', antalgique: 'Morphine si toléré', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Intubation si besoin + soins intensifs', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Perte de conscience\n• Convulsions\n• Troubles respiratoires' },
  { label: 'Hémorragie intracrânienne', categorie: 'Crâne & Neurologie', motif: 'Hémorragie intracrânienne', gravite: '🔴 Rouge', conscience: 'Altérée possible', diagnostic: 'Hémorragie intracrânienne traumatique', localisation_precise: 'Encéphale', douleur: '9', signes_cliniques: 'Céphalées sévères, vomissements, troubles neurologiques, baisse de vigilance.', observations: 'Urgence neurochirurgicale possible.', fc: '110', ta: '170/100', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Scanner cérébral', resultats_examen: 'Saignement intracrânien visible.', protocole: '• Mannitol 0.25 à 1 g/kg IV ou NaCl hypertonique\n• Neurochirurgie', complications: 'Hypertension intracrânienne', repos: 'Hospitalisation en urgence', antalgique: 'Aucun (contre-indiqué)', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Mannitol IV + neurochirurgie', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Perte de conscience\n• Convulsions\n• Paralysie' },
  { label: 'Plaie du cuir chevelu', categorie: 'Crâne & Neurologie', motif: 'Plaie du cuir chevelu', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Plaie du cuir chevelu', localisation_precise: 'Cuir chevelu', douleur: '5', signes_cliniques: 'Plaie saignante du cuir chevelu, douleur locale.', observations: 'Vérifier absence de traumatisme crânien associé.', fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie cutanée du cuir chevelu sans complication apparente.', protocole: '• Lidocaïne 1 % locale\n• Paracétamol 1 g x3/jour\n• Suture/agrafes\n• Pansement', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Suture/agrafes + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller la plaie', surveillance: '• Rougeur\n• Écoulement\n• Fièvre' },
  { label: 'Polytraumatisme', categorie: 'Traumatismes graves', motif: 'Polytraumatisme', gravite: '🔴 Rouge', conscience: 'Altération possible', diagnostic: 'Polytraumatisme', localisation_precise: 'Multiples zones corporelles', douleur: '10', signes_cliniques: 'Douleurs multiples, instabilité hémodynamique, lésions associées.', observations: 'Risque vital majeur.', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', etat_constantes: 'Constantes instables', type_examen: 'Scanner corps entier + bilan sanguin', resultats_examen: 'Multiples lésions traumatiques.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Perfusion/transfusion\n• Chirurgie selon lésions', complications: 'Choc hémorragique', repos: 'Soins intensifs', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon lésions', soins_locaux: 'Perfusion/transfusion + chirurgie selon lésions', ata: '72 heures minimum', restrictions: 'Aucune activité', surveillance: '• Choc hémorragique\n• Défaillance organique\n• Sepsis' },
  { label: 'Traumatisme thoracique', categorie: 'Traumatismes graves', motif: 'Traumatisme thoracique', gravite: '🔴 Rouge', conscience: 'Conscient douloureux ou dyspnéique', diagnostic: 'Traumatisme thoracique', localisation_precise: 'Thorax', douleur: '8', signes_cliniques: 'Douleur thoracique, gêne respiratoire, possible détresse ventilatoire.', observations: 'Risque de pneumothorax ou hémothorax.', fc: '120', ta: '110/70', spo2: '91', temperature: '36.8', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Radiographie thorax + scanner', resultats_examen: 'Traumatisme thoracique confirmé.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Oxygène\n• Drain thoracique si besoin', complications: 'Détresse respiratoire', repos: 'Surveillance hospitalière', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Oxygène + drain thoracique si besoin', ata: '48 à 72 heures', restrictions: 'Aucun effort respiratoire', surveillance: '• Dyspnée\n• Douleur thoracique\n• Cyanose' },
  { label: 'Traumatisme abdominal', categorie: 'Traumatismes graves', motif: 'Traumatisme abdominal', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme abdominal', localisation_precise: 'Abdomen', douleur: '8', signes_cliniques: "Douleur abdominale, défense possible, risque d'hémorragie interne.", observations: "Urgence si instabilité hémodynamique.", fc: '125', ta: '100/65', spo2: '94', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'FAST + scanner abdomino-pelvien', resultats_examen: 'Traumatisme abdominal confirmé, atteinte interne possible.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Perfusion\n• Chirurgie si hémorragie', complications: 'Hémorragie interne', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Perfusion + chirurgie si hémorragie', ata: '48 à 72 heures', restrictions: 'Aucun effort', surveillance: '• Douleur abdominale\n• Rigidité\n• Choc' },
  { label: 'Traumatisme rachidien', categorie: 'Traumatismes graves', motif: 'Traumatisme rachidien', gravite: '🔴 Rouge', conscience: 'Conscient à surveiller', diagnostic: 'Suspicion de traumatisme rachidien', localisation_precise: 'Rachis cervical, dorsal ou lombaire', douleur: '7', signes_cliniques: 'Douleur rachidienne, limitation de mobilisation, déficit neurologique possible.', observations: 'Immobilisation stricte recommandée.', fc: '95', ta: '115/75', spo2: '95', temperature: '36.7', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner rachis', resultats_examen: 'Lésion rachidienne à confirmer ou exclure.', protocole: '• Paracétamol 1 g x3/jour\n• Morphine 2 à 5 mg IV\n• Immobilisation rachidienne', complications: 'Risque neurologique', repos: 'Immobilisation stricte', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Immobilisation rachidienne', ata: '48 à 72 heures', restrictions: 'Immobilisation totale', surveillance: '• Paralysie\n• Paresthésies\n• Perte de sensibilité' },
  { label: 'Traumatisme pelvien', categorie: 'Traumatismes graves', motif: 'Traumatisme pelvien', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme pelvien avec risque hémorragique', localisation_precise: 'Bassin', douleur: '9', signes_cliniques: 'Douleur pelvienne majeure, instabilité possible, difficulté à la mobilisation.', observations: 'Risque hémorragique interne important.', fc: '130', ta: '95/60', spo2: '94', temperature: '36.7', etat_constantes: 'Constantes instables', type_examen: 'Radiographie bassin + scanner', resultats_examen: 'Traumatisme pelvien confirmé.', protocole: '• Morphine 2 à 5 mg IV\n• Acide tranexamique 1 g IV\n• Ceinture pelvienne\n• Chirurgie/embolisation', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Ceinture pelvienne + chirurgie/embolisation', ata: '72 heures minimum', restrictions: 'Aucun appui', surveillance: '• Choc hémorragique\n• Douleur pelvienne\n• Hématurie' },
  { label: 'Élongation musculaire', categorie: 'Muscles & Tendons', motif: 'Élongation musculaire', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Élongation musculaire', localisation_precise: 'Muscle atteint', douleur: '4', signes_cliniques: "Douleur à l'effort et à l'étirement, sans perte fonctionnelle majeure.", observations: 'Atteinte musculaire légère.', fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Élongation musculaire probable.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Repos', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Repos + glace', ata: 'Non requis', restrictions: "Éviter l'effort physique", surveillance: '• Douleur croissante\n• Contracture' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', motif: 'Déchirure musculaire', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Déchirure musculaire partielle', localisation_precise: 'Muscle atteint', douleur: '7', signes_cliniques: 'Douleur vive, impotence partielle, hématome possible.', observations: 'Lésion musculaire partielle.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie', resultats_examen: 'Déchirure musculaire partielle confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Kétoprofène 100 mg x2/jour\n• Repos\n• Compression', complications: 'Aucune', repos: 'Repos strict puis progressif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Compression + repos', ata: '24 à 48 heures', restrictions: "Pas d'effort physique", surveillance: '• Hématome\n• Douleur à la contraction' },
  { label: 'Rupture de tendon', categorie: 'Muscles & Tendons', motif: 'Rupture de tendon', gravite: '🟠 Orange', conscience: 'Conscient', diagnostic: 'Rupture tendineuse', localisation_precise: 'Tendon atteint', douleur: '7', signes_cliniques: 'Perte fonctionnelle, douleur locale, déficit moteur ciblé.', observations: 'Atteinte tendineuse significative.', fc: '88', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie ou IRM', resultats_examen: 'Rupture tendineuse confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Immobilisation\n• Chirurgie si besoin', complications: 'Perte fonctionnelle prolongée', repos: 'Repos et immobilisation', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Immobilisation + chirurgie si besoin', ata: '48 heures', restrictions: 'Aucun appui', surveillance: '• Douleur persistante\n• Perte de mobilité' },
  { label: 'Contracture musculaire', categorie: 'Muscles & Tendons', motif: 'Contracture musculaire', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Contracture musculaire', localisation_precise: 'Muscle contracturé', douleur: '3', signes_cliniques: 'Raideur musculaire, douleur modérée à la mobilisation.', observations: 'Contracture simple.', fc: '75', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Contracture musculaire probable.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Repos', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Chaleur + repos', ata: 'Non requis', restrictions: "Éviter l'effort", surveillance: '• Douleur persistante' },
  { label: 'Cocard / hématome orbitaire', categorie: 'Tête & Yeux', motif: 'Cocard / hématome orbitaire', gravite: '🟢 Vert', conscience: 'Conscient', diagnostic: 'Hématome orbitaire', localisation_precise: 'Région orbitaire', douleur: '4', signes_cliniques: 'Ecchymose péri-orbitaire, douleur locale, gonflement.', observations: 'Vision à vérifier systématiquement.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen oculaire', resultats_examen: 'Hématome orbitaire simple.', protocole: '• Paracétamol 1 g x3/jour\n• Glace', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Vision floue\n• Douleur oculaire' },
  { label: "Corps étranger dans l'œil", categorie: 'Tête & Yeux', motif: "Corps étranger dans l'œil", gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Corps étranger cornéen', localisation_precise: 'Cornée ou conjonctive', douleur: '6', signes_cliniques: 'Douleur oculaire, larmoiement, rougeur, sensation de gêne.', observations: 'Extraction nécessaire si visible.', fc: '82', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Lampe à fente', resultats_examen: 'Corps étranger cornéen confirmé.', protocole: '• Érythromycine ophtalmique 0.5 % x4/jour\n• Retrait du corps étranger', complications: 'Irritation cornéenne', repos: 'Repos visuel', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: "Érythromycine ophtalmique 0.5% x4/jour", soins_locaux: 'Retrait du corps étranger', ata: 'Non requis', restrictions: "Éviter de frotter l'œil", surveillance: '• Rougeur\n• Larmoiement\n• Vision floue' },
  { label: 'Perforation oculaire', categorie: 'Tête & Yeux', motif: 'Perforation oculaire', gravite: '🔴 Rouge', conscience: 'Conscient douloureux', diagnostic: 'Plaie perforante du globe oculaire', localisation_precise: 'Globe oculaire', douleur: '9', signes_cliniques: 'Douleur intense, baisse de vision, traumatisme oculaire majeur.', observations: 'Urgence ophtalmologique chirurgicale.', fc: '100', ta: '130/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner orbitaire', resultats_examen: 'Plaie perforante confirmée.', protocole: '• Morphine 2 à 4 mg IV\n• Céfazoline 2 g IV\n• Coque de protection\n• Chirurgie urgente', complications: 'Risque de perte visuelle', repos: 'Hospitalisation urgente', antalgique: 'Morphine 2 à 4mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2g IV', soins_locaux: 'Coque de protection + chirurgie urgente', ata: '48 heures minimum', restrictions: 'Aucun effort oculaire', surveillance: '• Perte de vision\n• Douleur oculaire\n• Infection' },
  { label: 'Fracture du nez', categorie: 'Tête & Yeux', motif: 'Fracture du nez', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Fracture des os propres du nez', localisation_precise: 'Nez', douleur: '5', signes_cliniques: 'Douleur nasale, œdème, déformation possible, épistaxis.', observations: 'Réduction si déplacement important.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Fracture nasale probable ou confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Ibuprofène 400 mg x3/jour\n• Glace\n• Réduction si besoin', complications: 'Aucune complication immédiate', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace + réduction si besoin', ata: 'Non requis', restrictions: 'Éviter les chocs', surveillance: '• Épistaxis\n• Obstruction nasale\n• Déviation' },
  { label: 'Traumatisme dentaire', categorie: 'Tête & Yeux', motif: 'Traumatisme dentaire', gravite: '🟡 Jaune', conscience: 'Conscient', diagnostic: 'Traumatisme dento-alvéolaire', localisation_precise: 'Dents ou alvéole dentaire', douleur: '5', signes_cliniques: 'Douleur dentaire, mobilité, fracture ou déplacement de dent possible.', observations: 'Avis dentaire urgent recommandé.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen bucco-dentaire', resultats_examen: 'Atteinte dento-alvéolaire confirmée.', protocole: '• Paracétamol 1 g x3/jour\n• Amoxicilline 1 g x3/jour\n• Contention / soin dentaire urgent', complications: 'Atteinte dentaire persistante', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline 1g x3/jour', soins_locaux: 'Contention / soin dentaire urgent', ata: 'Non requis', restrictions: 'Alimentation molle', surveillance: '• Douleur persistante\n• Abcès\n• Mobilité dentaire' },
  { label: 'Intoxication', categorie: 'Autres', motif: 'Intoxication', gravite: '🔴 Rouge', conscience: 'Conscient ou altéré selon toxique', diagnostic: 'Intoxication aiguë', localisation_precise: 'Systémique', douleur: '4', signes_cliniques: 'Troubles généraux, nausées, malaise, signes variables selon toxique.', observations: 'Nécessite identification du produit si possible.', fc: '110', ta: '110/70', spo2: '94', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Bilan sanguin + ECG', resultats_examen: 'Troubles biologiques ou cardiaques possibles selon toxique.', protocole: '• Charbon activé 50 g\n• Perfusion IV\n• Antidote si connu', complications: 'Troubles cardiorespiratoires possibles', repos: 'Surveillance hospitalière', antalgique: 'Selon substance', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Charbon activé 50g + perfusion IV + antidote si connu', ata: '24 à 48 heures', restrictions: 'Aucune consommation', surveillance: '• Troubles de conscience\n• Vomissements\n• Arythmie' },
  { label: 'Réaction allergique', categorie: 'Autres', motif: 'Réaction allergique', gravite: '🔴 Rouge', conscience: 'Conscient', diagnostic: 'Réaction allergique aiguë', localisation_precise: 'Systémique', douleur: '3', signes_cliniques: 'Urticaire, prurit, œdème, gêne respiratoire possible.', observations: "Risque d'anaphylaxie.", fc: '115', ta: '100/65', spo2: '93', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique', resultats_examen: 'Réaction allergique confirmée.', protocole: '• Adrénaline 0.3 à 0.5 mg IM\n• Cétirizine 10 mg\n• Méthylprednisolone 40 à 80 mg IV', complications: 'Choc anaphylactique possible', repos: 'Surveillance', antalgique: 'Aucun', anti_inflammatoire: 'Méthylprednisolone 40 à 80mg IV', antibiotique: 'Aucun', soins_locaux: 'Adrénaline 0.3 à 0.5mg IM + Cétirizine 10mg', ata: '24 heures', restrictions: "Éviter l'allergène", surveillance: '• Urticaire\n• Dyspnée\n• Choc anaphylactique' },
  { label: "Crise d'asthme", categorie: 'Autres', motif: "Crise d'asthme", gravite: '🟠 Orange', conscience: 'Conscient dyspnéique', diagnostic: "Exacerbation aiguë d'asthme", localisation_precise: 'Voies respiratoires', douleur: '4', signes_cliniques: 'Dyspnée, sifflements respiratoires, oppression thoracique.', observations: 'Bronchospasme aigu.', fc: '120', ta: '130/80', spo2: '90', temperature: '36.7', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Auscultation + saturation', resultats_examen: 'Bronchospasme confirmé.', protocole: '• Salbutamol 2.5 à 5 mg nébulisé\n• Ipratropium 0.5 mg nébulisé\n• Prednisone 40 mg/jour', complications: 'Détresse respiratoire possible', repos: 'Surveillance respiratoire', antalgique: 'Aucun', anti_inflammatoire: 'Prednisone 40mg/jour', antibiotique: 'Aucun', soins_locaux: 'Salbutamol 2.5 à 5mg nébulisé + Ipratropium 0.5mg nébulisé', ata: '24 à 48 heures', restrictions: "Éviter les efforts", surveillance: '• Dyspnée\n• Sibilances\n• Cyanose' },
  { label: 'Hypothermie', categorie: 'Autres', motif: 'Hypothermie', gravite: '🔴 Rouge', conscience: 'Conscient ralenti ou altéré', diagnostic: 'Hypothermie', localisation_precise: 'Systémique', douleur: '2', signes_cliniques: 'Froid intense, frissons, ralentissement général, conscience altérée possible.', observations: 'Température centrale abaissée.', fc: '50', ta: '90/60', spo2: '92', temperature: '34.0', etat_constantes: 'Constantes altérées', type_examen: 'Température centrale + ECG', resultats_examen: 'Hypothermie confirmée.', protocole: '• Réchauffement passif/actif\n• NaCl 0.9 % tiédi IV', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Réchauffement passif/actif + NaCl 0.9% tiédi IV', ata: '24 à 48 heures', restrictions: 'Éviter le froid', surveillance: '• Troubles du rythme\n• Confusion\n• Frissons' },
  { label: 'Coup de chaleur', categorie: 'Autres', motif: 'Coup de chaleur', gravite: '🔴 Rouge', conscience: 'Conscient altéré possible', diagnostic: 'Hyperthermie par coup de chaleur', localisation_precise: 'Systémique', douleur: '5', signes_cliniques: 'Hyperthermie, malaise, tachycardie, altération neurologique possible.', observations: 'Urgence médicale thermique.', fc: '145', ta: '100/60', spo2: '94', temperature: '40.5', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Température centrale + bilan sanguin', resultats_examen: 'Hyperthermie importante confirmée.', protocole: '• Refroidissement rapide\n• NaCl 0.9 % IV', complications: 'Risque neurologique et rénal', repos: 'Hospitalisation', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Refroidissement rapide + NaCl 0.9% IV', ata: '24 à 48 heures', restrictions: 'Éviter la chaleur', surveillance: '• Température > 40°C\n• Confusion\n• Convulsions' },
  { label: 'Noyade', categorie: 'Autres', motif: 'Noyade', gravite: '🔴 Rouge', conscience: 'Conscient ou altéré selon gravité', diagnostic: 'Détresse respiratoire secondaire à immersion', localisation_precise: 'Respiratoire', douleur: '4', signes_cliniques: 'Dyspnée, toux, désaturation, détresse respiratoire possible.', observations: 'Surveillance respiratoire impérative.', fc: '130', ta: '105/70', spo2: '88', temperature: '35.8', etat_constantes: 'Constantes respiratoires instables', type_examen: 'Gaz du sang + radiographie thorax', resultats_examen: 'Atteinte respiratoire post-immersion confirmée.', protocole: '• Oxygène\n• Ventilation si besoin\n• Surveillance hospitalière', complications: 'Détresse respiratoire aiguë', repos: 'Hospitalisation', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Oxygène + ventilation si besoin', ata: '24 à 48 heures', restrictions: 'Aucune activité aquatique', surveillance: '• Dyspnée\n• Toux\n• Cyanose' },
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

Surveillance des symptômes :
{{surveillance}}

---

📅 Suivi médical

Date du contrôle : {{suivi_date}}

Examens complémentaires si nécessaire : {{examens_suivi}}

Observations : {{observations_suivi}}

---

✍️ Rapport rédigé par {{redacteur}}

📅 Date : {{date}}`;

const fields = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'heure', label: 'Heure de prise en charge', type: 'time' },
  { key: 'prenom', label: 'Prénom du patient', type: 'text', placeholder: 'Ex: Jackson', required: true },
  { key: 'nom', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Brooks', required: true },
  { key: 'motif', label: 'Motif', type: 'text', placeholder: 'Ex: Blessure par arme à feu', required: true },
  { key: 'localisation', label: 'Localisation générale', type: 'text', placeholder: 'Ex: Torse — flanc droit abdominal' },
  { key: 'gravite', label: '⚠️ Gravité', type: 'text', placeholder: 'Ex: 🔴 Rouge' },
  { key: 'conscience', label: 'État de conscience', type: 'text', placeholder: 'Ex: Conscient, orienté et coopérant' },
  { key: 'etat_general', label: "État général à l'arrivée", type: 'textarea', placeholder: 'Description générale du patient à l\'admission...' },
  { key: 'diagnostic', label: 'Blessure / symptôme principal', type: 'text', placeholder: 'Ex: Plaie par balle non traversante', required: true },
  { key: 'localisation_precise', label: 'Localisation précise', type: 'text', placeholder: 'Ex: Flanc droit abdominal' },
  { key: 'douleur', label: 'Douleur (/10)', type: 'text', placeholder: 'Ex: 7' },
  { key: 'signes_cliniques', label: 'Signes cliniques observés', type: 'textarea', placeholder: 'Ex: Douleur à la palpation, absence de détresse respiratoire...' },
  { key: 'observations', label: 'Observations complémentaires', type: 'textarea', placeholder: "Ex: Pas de signe d'atteinte viscérale..." },
  { key: 'fc', label: 'FC (bpm)', type: 'text', placeholder: 'Ex: 88' },
  { key: 'ta', label: 'TA (mmHg)', type: 'text', placeholder: 'Ex: 121/79' },
  { key: 'spo2', label: 'SpO₂ (%)', type: 'text', placeholder: 'Ex: 98' },
  { key: 'temperature', label: 'Température (°C)', type: 'text', placeholder: 'Ex: 36.9' },
  { key: 'etat_constantes', label: 'État des constantes', type: 'text', placeholder: "Ex: Constantes stables à l'admission" },
  { key: 'type_examen', label: "Type d'examen réalisé", type: 'textarea', placeholder: 'Ex: Exploration clinique, radiologie...' },
  { key: 'resultats_examen', label: 'Résultats', type: 'textarea', placeholder: "Ex: Aucune atteinte d'organe interne..." },
  { key: 'observations_examen', label: 'Observations médicales', type: 'textarea', placeholder: 'Ex: Tissu mou intact...' },
  { key: 'protocole', label: 'Protocole de soins (liste avec •)', type: 'textarea', placeholder: '• Désinfection\n• Suture\n• Pansement...' },
  { key: 'deroulement', label: 'Déroulement de la procédure', type: 'textarea', placeholder: "Ex: La procédure s'est déroulée sans complication..." },
  { key: 'etat_final', label: 'État final du patient', type: 'textarea', placeholder: 'Ex: Patient stabilisé après prise en charge...' },
  { key: 'constantes_finales', label: 'Constantes finales', type: 'text', placeholder: 'Ex: Constantes satisfaisantes' },
  { key: 'evolution_douleur', label: 'Évolution de la douleur', type: 'text', placeholder: 'Ex: Douleur contrôlée après antalgiques' },
  { key: 'complications', label: 'Complications éventuelles', type: 'text', placeholder: 'Ex: Aucune complication' },
  { key: 'antalgique', label: 'Antalgique', type: 'text', placeholder: 'Ex: Paracétamol 1g x3/jour' },
  { key: 'anti_inflammatoire', label: 'Anti-inflammatoire', type: 'text', placeholder: 'Ex: Ibuprofène 400mg x3/jour' },
  { key: 'antibiotique', label: 'Antibiotique', type: 'text', placeholder: 'Ex: Aucun' },
  { key: 'soins_locaux', label: 'Soins locaux', type: 'textarea', placeholder: 'Ex: Pansement quotidien...' },
  { key: 'repos', label: 'Repos', type: 'text', placeholder: 'Ex: Repos relatif recommandé' },
  { key: 'ata', label: "Durée d'ATA", type: 'text', placeholder: 'Ex: 24 à 48 heures' },
  { key: 'restrictions', label: 'Restrictions physiques', type: 'textarea', placeholder: 'Ex: Éviter les efforts physiques...' },
  { key: 'surveillance', label: 'Surveillance des symptômes', type: 'textarea', placeholder: '• Douleur importante\n• Fièvre\n• Saignement...' },
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
      motif: b.motif,
      gravite: b.gravite,
      conscience: b.conscience,
      diagnostic: b.diagnostic,
      localisation_precise: b.localisation_precise,
      douleur: b.douleur,
      signes_cliniques: b.signes_cliniques,
      observations: b.observations,
      fc: b.fc,
      ta: b.ta,
      spo2: b.spo2,
      temperature: b.temperature,
      etat_constantes: b.etat_constantes,
      type_examen: b.type_examen,
      resultats_examen: b.resultats_examen,
      protocole: b.protocole,
      complications: b.complications,
      repos: b.repos,
      antalgique: b.antalgique,
      anti_inflammatoire: b.anti_inflammatoire,
      antibiotique: b.antibiotique,
      soins_locaux: b.soins_locaux,
      ata: b.ata,
      restrictions: b.restrictions,
      surveillance: b.surveillance,
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

    const patientName = `${values['prenom'] || ''} ${values['nom'] || ''}`.trim() || 'Inconnu';
    const filename = `${templateId}_${patientName.replace(/\s/g, '_')}_${Date.now()}.txt`;

    const { error: archiveError } = await supabase.from('archives').insert({
      owner_id: user.id,
      universe: 'fivem',
      template_name: config.title,
      patient_name: patientName,
      storage_path: `${user.id}/${filename}`,
      filename,
      field_values: values,
      rendered_body: generatedReport,
    });

    if (archiveError) { setError('Erreur : ' + archiveError.message); setSaving(false); return; }
    router.push('/fivem/archives');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={() => step === 'preview' ? setStep('form') : router.back()}
          className="text-gray-400 hover:text-white transition"
        >
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
                {/* Blessures */}
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

          {/* Champs du formulaire */}
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
                    placeholder={field.placeholder || ''}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition resize-y text-sm"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={values[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
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
              {loading ? '⏳ Génération...' : '📄 Générer le rapport'}
            </button>
          </div>
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="bg-slate-800/30 border border-orange-900/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-300">📄 Rapport généré. Modifiez si besoin puis sauvegardez.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <textarea
              value={generatedReport}
              onChange={e => setGeneratedReport(e.target.value)}
              rows={50}
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