'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── BLESSURES ────────────────────────────────────────────────────────────────
const blessures = [
  { label: 'Fracture simple', categorie: 'Os & Articulations', motif: 'Fracture simple', gravite: 'MOYENNE', conscience: 'Conscient, orienté et coopérant', diagnostic: 'Fracture simple du membre', localisation_precise: 'Bras, jambe, poignet ou cheville', douleur: '7', signes_cliniques: 'Douleur importante, impotence fonctionnelle partielle, œdème local.', observations: 'Suspicion de fracture simple sans exposition osseuse.', fc: '95', ta: '125/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fracture simple visible à la radiographie.', protocole: '• Évaluation clinique complète du membre atteint\n• Vérification de la douleur, de la mobilité et de l\'impotence fonctionnelle\n• Contrôle vasculo-nerveux distal (pouls, sensibilité, coloration)\n• Réalisation d\'une radiographie pour confirmation diagnostique\n• Mise au repos immédiate du membre traumatisé\n• Immobilisation par attelle adaptée à la zone atteinte\n• Application de glace localement pour limiter l\'œdème\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si absence de contre-indication\n• Surveillance de l\'évolution de la douleur et du gonflement\n• Orientation ou suivi orthopédique si nécessaire', complications: 'Aucune', repos: 'Repos strict du membre', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle', ata: 'Non requis', restrictions: 'Pas d\'appui sur le membre', surveillance: '• Douleur croissante\n• Œdème important\n• Engourdissement' },
  { label: 'Fracture ouverte', categorie: 'Os & Articulations', motif: 'Fracture ouverte', gravite: 'ELEVEE', conscience: 'Conscient douloureux, coopérant', diagnostic: 'Fracture ouverte avec plaie et exposition osseuse', localisation_precise: 'Segment osseux atteint avec plaie ouverte', douleur: '9', signes_cliniques: 'Douleur intense, saignement, déformation du membre, exposition osseuse.', observations: 'Urgence traumatique avec risque infectieux et hémorragique.', fc: '110', ta: '110/70', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Fracture ouverte confirmée avec atteinte des tissus mous.', protocole: '• Évaluation rapide de la gravité et du saignement\n• Contrôle de l\'hémorragie par pansement stérile compressif\n• Contrôle vasculo-nerveux distal avant immobilisation\n• Réalisation d\'une radiographie du segment atteint\n• Mise en place d\'une immobilisation stricte du membre\n• Administration de Paracétamol 1 g et Morphine IV selon intensité de la douleur\n• Début d\'une antibiothérapie par Céfazoline 2 g IV\n• Vérification du statut antitétanique\n• Préparation à la prise en charge chirurgicale orthopédique\n• Surveillance rapprochée des constantes et de la douleur', complications: 'Risque infectieux et hémorragique', repos: 'Repos strict et hospitalisation', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun en première intention', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Pansement stérile compressif + immobilisation', ata: '48 à 96 heures', restrictions: 'Aucun appui, aucune mobilisation du membre atteint', surveillance: '• Saignement persistant\n• Fièvre\n• Engourdissement\n• Douleur croissante' },
  { label: 'Fissure osseuse', categorie: 'Os & Articulations', motif: 'Fissure osseuse', gravite: 'FAIBLE', conscience: 'Conscient, orienté', diagnostic: 'Fissure osseuse non déplacée', localisation_precise: 'Os atteint', douleur: '5', signes_cliniques: 'Douleur localisée, sensibilité à la palpation, gêne à la mobilisation.', observations: 'Atteinte osseuse sans déplacement visible.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fine ligne de fissure visible sans déplacement osseux.', protocole: '• Examen clinique ciblé de la zone douloureuse\n• Vérification de la mobilité et de la douleur provoquée\n• Contrôle neurovasculaire distal\n• Réalisation d\'une radiographie\n• Mise au repos de la zone traumatisée\n• Pose d\'une attelle ou immobilisation légère\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si toléré\n• Conseils d\'évitement des efforts et des appuis répétés\n• Réévaluation en cas de douleur persistante ou aggravation', complications: 'Aucune', repos: 'Repos fonctionnel', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle légère', ata: 'Non requis', restrictions: 'Limiter l\'appui et les efforts sur la zone', surveillance: '• Douleur persistante\n• Gonflement\n• Difficulté croissante à mobiliser' },
  { label: 'Luxation', categorie: 'Os & Articulations', motif: 'Luxation', gravite: 'MOYENNE', conscience: 'Conscient, orienté et douloureux', diagnostic: 'Luxation articulaire', localisation_precise: 'Épaule, doigt ou genou', douleur: '8', signes_cliniques: 'Déformation articulaire, impotence fonctionnelle, douleur intense.', observations: 'Vérifier l\'absence de fracture associée avant réduction.', fc: '100', ta: '130/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Luxation confirmée sans fracture associée visible.', protocole: '• Évaluation clinique de l\'articulation atteinte\n• Vérification de la déformation, de la douleur et de l\'impotence\n• Contrôle vasculo-nerveux distal avant toute manœuvre\n• Réalisation d\'une radiographie avant réduction\n• Administration de Paracétamol 1 g et Kétoprofène 100 mg\n• Réduction articulaire selon technique adaptée\n• Contrôle radiologique après réduction\n• Immobilisation par écharpe ou attelle selon l\'articulation\n• Recommandation de repos et suivi orthopédique', complications: 'Aucune post-réduction immédiate', repos: 'Repos articulaire strict', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Écharpe ou immobilisation', ata: 'Non requis', restrictions: 'Pas de mobilisation forcée de l\'articulation', surveillance: '• Douleur persistante\n• Déformation résiduelle\n• Engourdissement distal' },
  { label: 'Entorse', categorie: 'Os & Articulations', motif: 'Entorse', gravite: 'FAIBLE', conscience: 'Conscient, orienté', diagnostic: 'Entorse ligamentaire', localisation_precise: 'Cheville, genou ou poignet', douleur: '6', signes_cliniques: 'Œdème, douleur à la mobilisation, gêne fonctionnelle.', observations: 'Atteinte ligamentaire probable sans fracture visible.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique + radiologie si besoin', resultats_examen: 'Suspicion d\'entorse sans anomalie osseuse majeure.', protocole: '• Évaluation de la douleur et de l\'amplitude articulaire\n• Recherche d\'un gonflement ou d\'une instabilité\n• Réalisation d\'une radiographie si doute fracturaire\n• Mise en place du protocole repos, glace, compression, élévation\n• Immobilisation légère par attelle ou bandage\n• Administration d\'Ibuprofène 400 mg et application de Diclofénac gel 1 %\n• Recommandation de repos et limitation des appuis\n• Réévaluation si persistance de la douleur ou aggravation', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol si besoin', anti_inflammatoire: 'Ibuprofène 400mg x3/jour + Diclofénac gel 1 % x3/jour', antibiotique: 'Aucun', soins_locaux: 'Attelle + glace', ata: 'Non requis', restrictions: 'Limiter l\'appui et les mouvements brusques', surveillance: '• Œdème important\n• Douleur persistante\n• Difficulté à poser le membre' },
  { label: 'Contusion osseuse', categorie: 'Os & Articulations', motif: 'Contusion osseuse', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Contusion osseuse sans fracture visible', localisation_precise: 'Zone osseuse traumatisée', douleur: '4', signes_cliniques: 'Douleur localisée, sensibilité à la pression, hématome possible.', observations: 'Aucune fracture visible à l\'imagerie.', fc: '78', ta: '118/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Radiologie', resultats_examen: 'Aucune fracture visible.', protocole: '• Évaluation de la douleur et de la mobilité du segment atteint\n• Recherche d\'un hématome ou d\'un œdème associé\n• Réalisation d\'une radiographie pour exclure une fracture\n• Mise au repos du membre traumatisé\n• Application de glace à intervalles réguliers\n• Administration de Paracétamol 1 g pour soulager la douleur\n• Limitation des contraintes mécaniques pendant quelques jours\n• Réévaluation si la douleur devient persistante ou croissante', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les chocs et appuis répétés', surveillance: '• Douleur persistante\n• Gonflement\n• Difficulté à marcher ou mobiliser' },
  { label: 'Plaie ouverte / lacération', categorie: 'Plaies & Traumatismes', motif: 'Plaie ouverte / lacération', gravite: 'MOYENNE', conscience: 'Conscient, coopérant', diagnostic: 'Plaie profonde avec atteinte des tissus mous', localisation_precise: 'Zone cutanée atteinte', douleur: '6', signes_cliniques: 'Plaie ouverte, saignement modéré, douleur locale, bords irréguliers possibles.', observations: 'Pas d\'atteinte vasculaire ou nerveuse évidente.', fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie profonde sans atteinte organique visible.', protocole: '• Évaluation de la profondeur et de l\'étendue de la plaie\n• Contrôle du saignement par compression locale\n• Nettoyage abondant au sérum physiologique\n• Désinfection soigneuse de la zone lésée\n• Vérification de l\'absence de corps étranger ou d\'atteinte profonde\n• Suture si nécessaire selon les berges de la plaie\n• Mise en place d\'un pansement stérile\n• Administration de Paracétamol 1 g et Amoxicilline/acide clavulanique 1 g\n• Vérification du statut vaccinal antitétanique\n• Surveillance locale de la cicatrisation', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Désinfection + suture + pansement', ata: 'Non requis', restrictions: 'Éviter les mouvements de traction sur la zone suturée', surveillance: '• Rougeur\n• Écoulement\n• Fièvre\n• Douleur croissante' },
  { label: 'Plaie superficielle', categorie: 'Plaies & Traumatismes', motif: 'Plaie superficielle', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Plaie superficielle cutanée', localisation_precise: 'Peau superficielle', douleur: '3', signes_cliniques: 'Plaie peu profonde, douleur légère, saignement faible.', observations: 'Pas d\'atteinte profonde.', fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Plaie superficielle simple.', protocole: '• Examen local de la plaie\n• Nettoyage simple au sérum physiologique\n• Désinfection avec antiseptique local\n• Mise en place d\'un pansement simple\n• Administration de Paracétamol 1 g si douleur\n• Conseils d\'hygiène et de renouvellement du pansement\n• Réévaluation si apparition de rougeur ou d\'écoulement', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g si besoin', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Chlorhexidine locale + pansement', ata: 'Non requis', restrictions: 'Éviter de mouiller ou gratter la plaie', surveillance: '• Rougeur locale\n• Douleur\n• Écoulement' },
  { label: 'Hématome', categorie: 'Plaies & Traumatismes', motif: 'Hématome', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Hématome sous-cutané post-traumatique', localisation_precise: 'Zone du choc', douleur: '4', signes_cliniques: 'Ecchymose, douleur modérée, gonflement local.', observations: 'Pas de fracture associée visible.', fc: '80', ta: '120/80', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Hématome simple post-traumatique.', protocole: '• Évaluation de la taille et de la sensibilité de l\'hématome\n• Recherche d\'un traumatisme osseux sous-jacent\n• Application précoce de glace localement\n• Mise au repos du segment atteint\n• Utilisation de Paracétamol 1 g pour la douleur\n• Application de Diclofénac gel 1 % si absence de contre-indication\n• Surveillance de l\'extension de l\'ecchymose et du gonflement', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Diclofénac gel 1 % x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter les nouveaux traumatismes sur la zone', surveillance: '• Gonflement important\n• Douleur croissante\n• Limitation fonctionnelle' },
  { label: 'Écrasement de membre', categorie: 'Plaies & Traumatismes', motif: 'Écrasement de membre', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme par écrasement avec risque de syndrome de loge', localisation_precise: 'Membre écrasé', douleur: '9', signes_cliniques: 'Douleur intense, œdème important, déformation possible, souffrance tissulaire.', observations: 'Risque de syndrome de loge et de lésions profondes.', fc: '115', ta: '110/70', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + bilan sanguin', resultats_examen: 'Traumatisme sévère du membre avec atteinte tissulaire importante.', protocole: '• Évaluation rapide du membre écrasé et du contexte traumatique\n• Contrôle de la douleur et des saignements éventuels\n• Vérification du pouls distal, de la sensibilité et de la coloration\n• Réalisation d\'une radiographie et d\'un bilan sanguin\n• Mise en place d\'une immobilisation stricte\n• Administration de Morphine IV selon intensité douloureuse\n• Perfusion par NaCl 0.9 % IV\n• Surveillance rapprochée de la tension du membre et de la douleur disproportionnée\n• Avis chirurgical rapide en cas de suspicion de syndrome de loge\n• Hospitalisation pour surveillance évolutive', complications: 'Risque de syndrome de loge', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon contexte', soins_locaux: 'Immobilisation', ata: '72 heures', restrictions: 'Aucune mobilisation du membre atteint', surveillance: '• Douleur disproportionnée\n• Membre tendu\n• Paresthésies\n• Diminution des pouls' },
  { label: 'Amputation traumatique', categorie: 'Plaies & Traumatismes', motif: 'Amputation traumatique', gravite: 'CRITIQUE', conscience: 'Conscient ou altéré selon hémorragie', diagnostic: 'Amputation traumatique partielle ou complète', localisation_precise: 'Segment amputé', douleur: '10', signes_cliniques: 'Section partielle ou complète d\'un membre, hémorragie importante, douleur majeure.', observations: 'Urgence vitale hémorragique.', fc: '140', ta: '90/60', spo2: '93', temperature: '36.4', etat_constantes: 'Constantes instables', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Amputation traumatique confirmée avec perte tissulaire majeure.', protocole: '• Contrôle immédiat de l\'hémorragie par compression ou garrot si nécessaire\n• Protection du moignon par pansement compressif stérile\n• Évaluation des constantes et du niveau de conscience\n• Mise en place d\'un accès veineux et remplissage si besoin\n• Administration rapide de Morphine 5 mg IV\n• Administration d\'Acide tranexamique 1 g IV\n• Début de Céfazoline 2 g IV pour couverture infectieuse\n• Conservation du segment amputé si récupérable selon protocole adapté\n• Préparation pour prise en charge chirurgicale urgente\n• Surveillance rapprochée du choc hémorragique', complications: 'Choc hémorragique possible', repos: 'Hospitalisation en urgence', antalgique: 'Morphine 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Garrot ou pansement compressif stérile', ata: '96 heures', restrictions: 'Immobilisation complète et transfert urgent', surveillance: '• Saignement actif\n• Chute tensionnelle\n• Altération de conscience\n• Pâleur' },
  { label: 'Corps étranger dans une plaie', categorie: 'Plaies & Traumatismes', motif: 'Corps étranger dans une plaie', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Plaie avec corps étranger inclus', localisation_precise: 'Tissus mous atteints', douleur: '5', signes_cliniques: 'Douleur locale, inflammation, gêne mécanique, plaie pénétrante.', observations: 'Présence probable ou confirmée d\'un corps étranger.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Corps étranger visualisé dans la plaie.', protocole: '• Examen local de la plaie et évaluation de la profondeur\n• Réalisation d\'une radiographie pour localiser le corps étranger\n• Anesthésie locale par Lidocaïne 1 % si extraction indiquée\n• Nettoyage abondant et désinfection de la plaie\n• Extraction prudente du corps étranger si accessible\n• Mise en place d\'un pansement stérile\n• Administration de Paracétamol 1 g et Amoxicilline/acide clavulanique 1 g\n• Vérification du statut antitétanique\n• Surveillance locale post-extraction', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Éviter les frottements ou efforts sur la zone', surveillance: '• Rougeur\n• Écoulement\n• Douleur croissante\n• Fièvre' },
  { label: 'Blessure par balle traversante', categorie: 'Plaies par armes', motif: 'Blessure par balle traversante', gravite: 'CRITIQUE', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle traversante', localisation_precise: 'Zone d\'impact projectile', douleur: '9', signes_cliniques: 'Orifice d\'entrée et de sortie, saignement, douleur intense, risque lésionnel profond.', observations: 'Risque hémorragique interne et externe.', fc: '125', ta: '100/65', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes instables', type_examen: 'Scanner + radiologie + bilan sanguin', resultats_examen: 'Trajectoire du projectile confirmée.', protocole: '• Évaluation ABC initiale et contrôle du saignement\n• Repérage des orifices d\'entrée et de sortie\n• Mise sous surveillance continue des constantes\n• Réalisation d\'une imagerie adaptée avec scanner et radiologie\n• Mise en place d\'un accès veineux et d\'une perfusion\n• Administration de Morphine IV selon la douleur\n• Administration d\'Acide tranexamique 1 g IV\n• Début d\'une antibioprophylaxie par Céfazoline 2 g IV\n• Préparation à une exploration ou chirurgie selon la localisation et la stabilité\n• Surveillance de l\'état hémodynamique et respiratoire', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Pansement stérile + contrôle hémorragique', ata: '96 heures', restrictions: 'Repos strict et surveillance continue', surveillance: '• Saignement\n• Chute de TA\n• Dyspnée\n• Altération de conscience' },
  { label: 'Blessure par balle non traversante', categorie: 'Plaies par armes', motif: 'Blessure par balle non traversante', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Plaie par balle non traversante avec projectile retenu', localisation_precise: 'Zone d\'impact projectile', douleur: '9', signes_cliniques: 'Plaie pénétrante sans orifice de sortie, douleur importante, saignement variable.', observations: 'Projectile retenu dans les tissus.', fc: '110', ta: '115/75', spo2: '96', temperature: '37.0', etat_constantes: 'Constantes à surveiller', type_examen: 'Radiologie + scanner', resultats_examen: 'Projectile localisé dans les tissus.', protocole: '• Évaluation clinique initiale avec contrôle du saignement\n• Recherche de signes d\'atteinte profonde ou vasculo-nerveuse\n• Réalisation d\'une radiographie et d\'un scanner pour localiser le projectile\n• Pansement stérile sur l\'orifice d\'entrée\n• Administration de Paracétamol 1 g et Morphine IV si nécessaire\n• Mise en place d\'une antibiothérapie par Amoxicilline/acide clavulanique 1 g\n• Décision d\'extraction chirurgicale selon localisation et risque\n• Surveillance locale et générale de l\'évolution', complications: 'Risque infectieux et hémorragique', repos: 'Hospitalisation', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 4 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Pansement stérile', ata: '72 heures', restrictions: 'Éviter toute mobilisation de la zone atteinte', surveillance: '• Saignement\n• Fièvre\n• Douleur croissante\n• Déficit neurologique local' },
  { label: 'Blessure par arme blanche', categorie: 'Plaies par armes', motif: 'Blessure par arme blanche', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Plaie pénétrante par arme blanche', localisation_precise: 'Zone de pénétration', douleur: '8', signes_cliniques: 'Plaie profonde, saignement, douleur importante, risque d\'atteinte profonde.', observations: 'Profondeur variable selon l\'arme et la localisation.', fc: '110', ta: '115/75', spo2: '95', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + scanner si profondeur', resultats_examen: 'Plaie pénétrante confirmée.', protocole: '• Contrôle local du saignement\n• Évaluation de la profondeur et de la trajectoire de la plaie\n• Recherche de signes d\'atteinte vasculaire, nerveuse ou viscérale\n• Réalisation d\'un scanner si la profondeur est importante ou douteuse\n• Désinfection locale et pansement stérile\n• Administration de Paracétamol 1 g et Morphine IV si nécessaire\n• Début d\'une antibiothérapie par Amoxicilline/acide clavulanique 1 g\n• Suture si possible ou orientation chirurgicale si plaie profonde\n• Surveillance du saignement et de la douleur', complications: 'Risque hémorragique', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Désinfection + pansement + suture si possible', ata: '48 à 72 heures', restrictions: 'Repos strict selon localisation', surveillance: '• Saignement\n• Fièvre\n• Douleur croissante\n• Gêne fonctionnelle' },
  { label: 'Éclats métalliques / fragments', categorie: 'Plaies par armes', motif: 'Éclats métalliques / fragments', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Plaie avec fragments métalliques', localisation_precise: 'Zone atteinte par éclats', douleur: '7', signes_cliniques: 'Douleur locale, plaie pénétrante, présence possible de multiples fragments.', observations: 'Risque de plaies multiples et de fragments résiduels.', fc: '100', ta: '120/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Radiologie', resultats_examen: 'Fragments métalliques visibles à l\'imagerie.', protocole: '• Évaluation des plaies visibles et des zones douloureuses\n• Réalisation d\'une radiographie pour localiser les fragments\n• Nettoyage et désinfection soigneuse des plaies\n• Anesthésie locale par Lidocaïne 1 % si extraction possible\n• Extraction des fragments accessibles sans danger\n• Mise en place d\'un pansement stérile\n• Administration de Paracétamol 1 g et Amoxicilline/acide clavulanique 1 g\n• Réévaluation si suspicion de fragments profonds persistants', complications: 'Risque infectieux local', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Amoxicilline/acide clavulanique 1 g x3/jour', soins_locaux: 'Extraction + pansement', ata: 'Non requis', restrictions: 'Éviter les efforts sur la zone atteinte', surveillance: '• Rougeur\n• Fièvre\n• Douleur persistante\n• Suppuration' },
  { label: 'Brûlure du 1er degré', categorie: 'Brûlures', motif: 'Brûlure du 1er degré', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Brûlure superficielle du 1er degré', localisation_precise: 'Zone cutanée atteinte', douleur: '4', signes_cliniques: 'Rougeur cutanée, douleur modérée, chaleur locale.', observations: 'Atteinte superficielle simple sans phlyctène.', fc: '85', ta: '120/75', spo2: '99', temperature: '36.8', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Brûlure superficielle confirmée.', protocole: '• Évaluation de l\'étendue et de la profondeur de la brûlure\n• Refroidissement local précoce si récent\n• Nettoyage doux de la zone atteinte\n• Application d\'une crème apaisante ou hydratante adaptée\n• Administration de Paracétamol 1 g si douleur\n• Conseils d\'hydratation et de protection de la peau\n• Surveillance de l\'évolution locale', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Crème apaisante', ata: 'Non requis', restrictions: 'Éviter soleil, frottements et chaleur', surveillance: '• Rougeur persistante\n• Douleur croissante\n• Cloques' },
  { label: 'Brûlure du 2e degré superficiel', categorie: 'Brûlures', motif: 'Brûlure du 2e degré superficiel', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Brûlure du 2e degré superficiel', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Cloques, rougeur, douleur importante, suintement possible.', observations: 'Atteinte dermique superficielle.', fc: '100', ta: '125/80', spo2: '98', temperature: '37.2', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure du 2e degré superficiel confirmée.', protocole: '• Évaluation de la surface brûlée et de la profondeur\n• Refroidissement si prise en charge précoce\n• Nettoyage doux de la lésion et protection des phlyctènes intactes si possible\n• Mise en place d\'un pansement adapté pour brûlure\n• Administration de Paracétamol 1 g\n• Administration de Morphine IV si douleur importante\n• Application de Sulfadiazine argentique 1 % si indiquée\n• Réévaluation régulière de la douleur et de l\'aspect cutané', complications: 'Risque infectieux', repos: 'Repos', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 4 mg IV si besoin', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Pansement brûlure + Sulfadiazine argentique 1 %', ata: 'Non requis', restrictions: 'Éviter frottements et exposition secondaire à la chaleur', surveillance: '• Rougeur étendue\n• Douleur croissante\n• Écoulement\n• Fièvre' },
  { label: 'Brûlure du 2e degré profond', categorie: 'Brûlures', motif: 'Brûlure du 2e degré profond', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Brûlure du 2e degré profond', localisation_precise: 'Zone cutanée atteinte', douleur: '9', signes_cliniques: 'Atteinte cutanée profonde, douleur importante, peau lésée, zones pâles possibles.', observations: 'Risque cicatriciel élevé selon l\'étendue.', fc: '110', ta: '115/70', spo2: '97', temperature: '37.3', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique + bilan sanguin si étendue', resultats_examen: 'Brûlure profonde confirmée.', protocole: '• Évaluation précise de l\'étendue et de la profondeur de la brûlure\n• Nettoyage soigneux et protection stérile de la zone\n• Bilan sanguin si surface importante ou état général altéré\n• Mise en place d\'un pansement spécialisé pour brûlure\n• Administration de Paracétamol 1 g et Morphine IV selon douleur\n• Application de Sulfadiazine argentique 1 % si protocole local\n• Hydratation adaptée et surveillance de l\'état général\n• Orientation spécialisée si brûlure étendue ou fonctionnelle', complications: 'Risque infectieux et cicatriciel', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour + Morphine 3 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Pansement spécialisé + Sulfadiazine argentique 1 %', ata: '48 heures', restrictions: 'Éviter tout contact ou frottement de la zone', surveillance: '• Fièvre\n• Douleur croissante\n• Écoulement\n• Extension des lésions' },
  { label: 'Brûlure du 3e degré', categorie: 'Brûlures', motif: 'Brûlure du 3e degré', gravite: 'CRITIQUE', conscience: 'Conscient ou altéré selon étendue', diagnostic: 'Brûlure profonde du 3e degré avec nécrose', localisation_precise: 'Zone cutanée atteinte', douleur: '8', signes_cliniques: 'Lésion profonde, nécrose, peau cartonnée, atteinte étendue possible.', observations: 'Urgence spécialisée si surface importante.', fc: '130', ta: '100/65', spo2: '95', temperature: '37.1', etat_constantes: 'Constantes instables possibles', type_examen: 'Examen clinique + bilan sanguin', resultats_examen: 'Brûlure du 3e degré confirmée.', protocole: '• Évaluation immédiate de la gravité et de l\'étendue de la brûlure\n• Protection stérile des zones atteintes\n• Mise en place d\'une voie veineuse et apport de Ringer lactate IV si nécessaire\n• Administration de Morphine IV pour prise en charge antalgique\n• Surveillance rapprochée des constantes et de la douleur\n• Préparation à une prise en charge chirurgicale spécialisée\n• Hospitalisation et surveillance des signes de choc ou d\'infection', complications: 'Risque de choc et d\'infection', repos: 'Hospitalisation', antalgique: 'Morphine 3 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon indication', soins_locaux: 'Pansement stérile', ata: '96 heures', restrictions: 'Repos strict et surveillance intensive', surveillance: '• Chute tensionnelle\n• Fièvre\n• Altération de conscience\n• Aggravation cutanée' },
  { label: 'Brûlure chimique', categorie: 'Brûlures', motif: 'Brûlure chimique', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Brûlure chimique cutanée', localisation_precise: 'Zone exposée au produit chimique', douleur: '7', signes_cliniques: 'Lésion douloureuse après exposition chimique, rougeur ou atteinte plus profonde.', observations: 'Importance du rinçage immédiat et prolongé.', fc: '105', ta: '120/75', spo2: '97', temperature: '36.9', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Brûlure chimique confirmée.', protocole: '• Retrait immédiat du produit ou des vêtements contaminés\n• Rinçage abondant et prolongé de la zone atteinte\n• Évaluation de la profondeur de la lésion après rinçage\n• Nettoyage doux et protection de la zone brûlée\n• Administration de Paracétamol 1 g et Morphine IV si nécessaire\n• Mise en place d\'un pansement adapté\n• Surveillance de l\'extension secondaire de la brûlure', complications: 'Risque d\'aggravation locale', repos: 'Repos et surveillance', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV si besoin', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Rinçage abondant + pansement', ata: '24 heures', restrictions: 'Éviter nouvelle exposition à l\'agent causant', surveillance: '• Extension lésionnelle\n• Douleur croissante\n• Rougeur importante' },
  { label: 'Brûlure électrique', categorie: 'Brûlures', motif: 'Brûlure électrique', gravite: 'ELEVEE', conscience: 'Conscient à surveiller', diagnostic: 'Brûlure électrique avec risque de lésion profonde', localisation_precise: 'Point d\'entrée et de sortie', douleur: '7', signes_cliniques: 'Lésion cutanée parfois modeste avec atteinte profonde possible, douleur variable.', observations: 'Risque cardiaque et musculaire associé.', fc: '115', ta: '120/75', spo2: '96', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'ECG + bilan sanguin', resultats_examen: 'Brûlure électrique confirmée avec nécessité d\'évaluation profonde.', protocole: '• Évaluation initiale des points d\'entrée et de sortie du courant\n• Surveillance cardiaque par ECG\n• Réalisation d\'un bilan sanguin orienté\n• Évaluation de douleurs musculaires ou lésions profondes associées\n• Administration de Paracétamol 1 g et Morphine IV si nécessaire\n• Mise en place d\'une perfusion IV\n• Protection locale des lésions cutanées\n• Surveillance hospitalière selon intensité de l\'exposition', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Pansement local', ata: '48 heures', restrictions: 'Repos strict initial', surveillance: '• Palpitations\n• Douleurs musculaires\n• Altération des constantes\n• Troubles de conscience' },
  { label: 'Traumatisme crânien léger', categorie: 'Neurologie & Tête', motif: 'Traumatisme crânien léger', gravite: 'MOYENNE', conscience: 'Conscient, orienté', diagnostic: 'Traumatisme crânien léger', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: 'Céphalées, vertiges, douleur post-traumatique, nausées possibles.', observations: 'Pas de déficit neurologique majeur constaté.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Scanner cérébral si besoin + examen neurologique', resultats_examen: 'Aucune hémorragie intracrânienne retrouvée.', protocole: '• Évaluation neurologique initiale avec contrôle de l\'orientation\n• Recherche de perte de connaissance, vomissements ou amnésie\n• Surveillance de la douleur et de l\'état de vigilance\n• Réalisation d\'un scanner si nécessaire selon le contexte\n• Administration de Paracétamol 1 g\n• Repos neurologique avec limitation des stimulations\n• Réévaluation si apparition de symptômes d\'alerte', complications: 'Aucune', repos: 'Repos neurologique', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: 'Non requis', restrictions: 'Pas de conduite, pas d\'effort intense, pas de sport', surveillance: '• Vomissements\n• Somnolence\n• Céphalées croissantes\n• Troubles de conscience' },
  { label: 'Commotion cérébrale', categorie: 'Neurologie & Tête', motif: 'Commotion cérébrale', gravite: 'MOYENNE', conscience: 'Conscient, parfois confus initialement', diagnostic: 'Commotion cérébrale', localisation_precise: 'Crâne', douleur: '5', signes_cliniques: 'Céphalées, vertiges, nausées, trouble bref de l\'orientation.', observations: 'Surveillance neurologique indiquée.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen neurologique + scanner si signes d\'alerte', resultats_examen: 'Pas de lésion intracrânienne visible si imagerie réalisée.', protocole: '• Évaluation neurologique complète avec test d\'orientation\n• Recherche d\'amnésie, nausées, céphalées et vertiges\n• Surveillance rapprochée de la vigilance\n• Réalisation d\'un scanner si aggravation ou contexte à risque\n• Administration de Paracétamol 1 g\n• Repos cognitif et physique strict\n• Réévaluation médicale en cas de symptômes persistants', complications: 'Aucune complication immédiate', repos: 'Repos neurologique strict', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: '24 heures', restrictions: 'Pas de sport, pas d\'écran prolongé, pas de conduite', surveillance: '• Céphalées croissantes\n• Vomissements\n• Troubles de mémoire\n• Somnolence' },
  { label: 'Traumatisme crânien sévère', categorie: 'Neurologie & Tête', motif: 'Traumatisme crânien sévère', gravite: 'CRITIQUE', conscience: 'Altérée ou fluctuante', diagnostic: 'Traumatisme crânien sévère', localisation_precise: 'Crâne', douleur: '10', signes_cliniques: 'Altération neurologique, céphalées sévères, vomissements, baisse de vigilance.', observations: 'Risque vital neurologique majeur.', fc: '120', ta: '150/90', spo2: '93', temperature: '37.1', etat_constantes: 'Constantes neurologiquement instables', type_examen: 'Scanner cérébral + bilan sanguin', resultats_examen: 'Lésion intracrânienne possible nécessitant surveillance intensive.', protocole: '• Évaluation des fonctions vitales en priorité\n• Contrôle neurologique initial avec score de vigilance\n• Réalisation urgente d\'un scanner cérébral et d\'un bilan sanguin\n• Maintien de l\'oxygénation et surveillance hémodynamique\n• Intubation si altération majeure de la conscience ou protection insuffisante des voies aériennes\n• Administration de Mannitol ou NaCl hypertonique selon protocole si suspicion d\'hypertension intracrânienne\n• Admission en soins intensifs et surveillance continue', complications: 'Risque d\'hypertension intracrânienne', repos: 'Soins intensifs', antalgique: 'Selon réanimation', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Aucun spécifique', ata: '96 heures', restrictions: 'Surveillance continue, repos strict', surveillance: '• Baisse de conscience\n• Vomissements\n• Anomalies pupillaires\n• Désaturation' },
  { label: 'Hémorragie intracrânienne', categorie: 'Neurologie & Tête', motif: 'Hémorragie intracrânienne', gravite: 'CRITIQUE', conscience: 'Altérée possible', diagnostic: 'Hémorragie intracrânienne traumatique', localisation_precise: 'Encéphale', douleur: '9', signes_cliniques: 'Céphalées sévères, vomissements, déficit neurologique, baisse de vigilance.', observations: 'Urgence neurochirurgicale potentielle.', fc: '110', ta: '170/100', spo2: '94', temperature: '37.0', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Scanner cérébral', resultats_examen: 'Saignement intracrânien visualisé.', protocole: '• Évaluation neurologique urgente et surveillance des constantes\n• Réalisation immédiate d\'un scanner cérébral\n• Prévention de l\'aggravation de l\'hypertension intracrânienne\n• Administration de Mannitol ou NaCl hypertonique selon protocole\n• Maintien de l\'oxygénation et de la stabilité hémodynamique\n• Avis neurochirurgical urgent\n• Hospitalisation en unité de surveillance continue ou soins intensifs', complications: 'Hypertension intracrânienne', repos: 'Hospitalisation en urgence', antalgique: 'Selon protocole neurologique', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: '96 heures', restrictions: 'Repos absolu et surveillance continue', surveillance: '• Baisse de conscience\n• Anomalies pupillaires\n• Vomissements\n• Dégradation neurologique' },
  { label: 'Plaie du cuir chevelu', categorie: 'Neurologie & Tête', motif: 'Plaie du cuir chevelu', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Plaie du cuir chevelu', localisation_precise: 'Cuir chevelu', douleur: '5', signes_cliniques: 'Plaie saignante, douleur locale, hémorragie souvent abondante.', observations: 'Vérifier absence de traumatisme crânien associé.', fc: '95', ta: '125/80', spo2: '98', temperature: '36.8', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Plaie du cuir chevelu sans complication majeure apparente.', protocole: '• Examen local de la plaie et recherche d\'un traumatisme associé\n• Contrôle du saignement par compression\n• Nettoyage et désinfection de la zone\n• Anesthésie locale par Lidocaïne 1 %\n• Suture ou agrafage selon la taille de la plaie\n• Mise en place d\'un pansement protecteur\n• Administration de Paracétamol 1 g\n• Surveillance de l\'apparition de signes neurologiques secondaires', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Suture/agrafes + pansement', ata: 'Non requis', restrictions: 'Éviter choc ou traction sur la zone suturée', surveillance: '• Saignement\n• Céphalées\n• Rougeur\n• Somnolence' },
  { label: 'Polytraumatisme', categorie: 'Traumatismes majeurs', motif: 'Polytraumatisme', gravite: 'CRITIQUE', conscience: 'Altération possible', diagnostic: 'Polytraumatisme', localisation_precise: 'Multiples zones corporelles', douleur: '10', signes_cliniques: 'Douleurs multiples, lésions associées, instabilité hémodynamique possible.', observations: 'Risque vital majeur.', fc: '135', ta: '95/60', spo2: '92', temperature: '36.5', etat_constantes: 'Constantes instables', type_examen: 'Scanner corps entier + bilan sanguin', resultats_examen: 'Multiples lésions traumatiques identifiées.', protocole: '• Évaluation prioritaire des fonctions vitales selon l\'ordre de gravité\n• Contrôle des saignements extériorisés et immobilisation des lésions suspectées\n• Mise sous surveillance continue et accès veineux rapide\n• Réalisation d\'un bilan sanguin complet et d\'un scanner corps entier\n• Administration de Morphine IV pour la douleur\n• Administration d\'Acide tranexamique 1 g IV si suspicion hémorragique\n• Mise en route de perfusion et transfusion si nécessaire\n• Coordination avec chirurgie ou spécialités concernées\n• Admission en secteur critique', complications: 'Choc hémorragique', repos: 'Soins intensifs', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon lésions', soins_locaux: 'Pansements + immobilisations selon lésions', ata: '96 heures', restrictions: 'Repos absolu et surveillance continue', surveillance: '• Chute tensionnelle\n• Désaturation\n• Altération neurologique\n• Saignement' },
  { label: 'Traumatisme thoracique', categorie: 'Traumatismes majeurs', motif: 'Traumatisme thoracique', gravite: 'ELEVEE', conscience: 'Conscient douloureux ou dyspnéique', diagnostic: 'Traumatisme thoracique', localisation_precise: 'Thorax', douleur: '8', signes_cliniques: 'Douleur thoracique, gêne respiratoire, douleur à l\'inspiration, dyspnée possible.', observations: 'Risque de pneumothorax ou hémothorax.', fc: '120', ta: '110/70', spo2: '91', temperature: '36.8', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Radiographie thorax + scanner', resultats_examen: 'Traumatisme thoracique confirmé.', protocole: '• Évaluation respiratoire immédiate avec auscultation et saturation\n• Recherche de douleur thoracique, asymétrie ventilatoire et détresse respiratoire\n• Réalisation d\'une radiographie puis d\'un scanner si nécessaire\n• Administration d\'oxygène selon saturation\n• Administration de Paracétamol 1 g et Morphine IV selon la douleur\n• Mise en place d\'un drain thoracique si indication\n• Surveillance continue respiratoire et hémodynamique', complications: 'Détresse respiratoire', repos: 'Surveillance hospitalière', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon geste invasif ou contexte', soins_locaux: 'Oxygène + drain thoracique si besoin', ata: '72 heures', restrictions: 'Efforts interdits', surveillance: '• Dyspnée\n• Désaturation\n• Douleur croissante\n• Tachycardie' },
  { label: 'Traumatisme abdominal', categorie: 'Traumatismes majeurs', motif: 'Traumatisme abdominal', gravite: 'ELEVEE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme abdominal', localisation_precise: 'Abdomen', douleur: '8', signes_cliniques: 'Douleur abdominale, défense possible, sensibilité diffuse ou localisée.', observations: 'Risque d\'hémorragie ou de lésion viscérale.', fc: '125', ta: '100/65', spo2: '94', temperature: '36.9', etat_constantes: 'Constantes à surveiller', type_examen: 'FAST + scanner abdomino-pelvien', resultats_examen: 'Traumatisme abdominal confirmé, lésion interne possible.', protocole: '• Évaluation clinique abdominale avec recherche de défense ou contracture\n• Surveillance rapprochée des constantes et de la douleur\n• Réalisation d\'une échographie FAST puis d\'un scanner si stabilité suffisante\n• Mise en place d\'un accès veineux et perfusion si besoin\n• Administration de Morphine IV pour antalgie\n• Administration d\'Acide tranexamique 1 g IV en cas de suspicion hémorragique\n• Orientation chirurgicale si aggravation ou hémorragie confirmée', complications: 'Hémorragie interne', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon atteinte viscérale', soins_locaux: 'Aucun spécifique', ata: '72 heures', restrictions: 'Repos strict, alimentation selon avis médical', surveillance: '• Douleur croissante\n• Ballonnement\n• Chute de TA\n• Pâleur' },
  { label: 'Traumatisme rachidien', categorie: 'Traumatismes majeurs', motif: 'Traumatisme rachidien', gravite: 'ELEVEE', conscience: 'Conscient à surveiller', diagnostic: 'Suspicion de traumatisme rachidien', localisation_precise: 'Rachis cervical, dorsal ou lombaire', douleur: '7', signes_cliniques: 'Douleur rachidienne, limitation de mobilité, paresthésies possibles.', observations: 'Immobilisation stricte indispensable.', fc: '95', ta: '115/75', spo2: '95', temperature: '36.7', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner rachis', resultats_examen: 'Lésion rachidienne à confirmer ou exclure.', protocole: '• Immobilisation immédiate du rachis\n• Évaluation neurologique des membres et de la sensibilité\n• Recherche de douleur localisée ou de déficit moteur\n• Réalisation d\'un scanner rachidien\n• Administration de Paracétamol 1 g et Morphine IV selon douleur\n• Maintien strict de l\'axe tête-cou-tronc\n• Orientation spécialisée en cas de lésion confirmée ou de déficit neurologique', complications: 'Risque neurologique', repos: 'Immobilisation stricte', antalgique: 'Paracétamol 1g x3/jour + Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Immobilisation rachidienne', ata: '72 heures', restrictions: 'Aucune mobilisation sans aide', surveillance: '• Déficit moteur\n• Fourmillements\n• Douleur croissante\n• Difficultés respiratoires' },
  { label: 'Traumatisme pelvien', categorie: 'Traumatismes majeurs', motif: 'Traumatisme pelvien', gravite: 'CRITIQUE', conscience: 'Conscient douloureux', diagnostic: 'Traumatisme pelvien avec risque hémorragique', localisation_precise: 'Bassin', douleur: '9', signes_cliniques: 'Douleur pelvienne majeure, difficulté à la mobilisation, instabilité possible.', observations: 'Risque important d\'hémorragie interne.', fc: '130', ta: '95/60', spo2: '94', temperature: '36.7', etat_constantes: 'Constantes instables', type_examen: 'Radiographie bassin + scanner', resultats_examen: 'Traumatisme pelvien confirmé.', protocole: '• Évaluation rapide de la stabilité hémodynamique\n• Immobilisation et limitation des mouvements du bassin\n• Mise en place d\'une ceinture pelvienne si nécessaire\n• Réalisation d\'une radiographie puis d\'un scanner pelvien\n• Administration de Morphine IV pour douleur importante\n• Administration d\'Acide tranexamique 1 g IV en cas de risque hémorragique\n• Orientation vers chirurgie ou embolisation selon gravité\n• Surveillance rapprochée des constantes', complications: 'Risque hémorragique', repos: 'Hospitalisation', antalgique: 'Morphine 2 à 5 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Selon contexte', soins_locaux: 'Ceinture pelvienne', ata: '96 heures', restrictions: 'Aucun appui, mobilisation minimale', surveillance: '• Chute de TA\n• Tachycardie\n• Douleur croissante\n• Pâleur' },
  { label: 'Élongation musculaire', categorie: 'Muscles & Tendons', motif: 'Élongation musculaire', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Élongation musculaire', localisation_precise: 'Muscle atteint', douleur: '4', signes_cliniques: 'Douleur à l\'effort ou à l\'étirement, gêne modérée.', observations: 'Atteinte musculaire légère.', fc: '78', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Élongation musculaire probable.', protocole: '• Évaluation de la douleur à l\'étirement et à la contraction\n• Recherche d\'un déficit fonctionnel plus important\n• Mise au repos du groupe musculaire atteint\n• Application de glace localement\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si toléré\n• Conseils d\'arrêt temporaire de l\'effort et reprise progressive\n• Réévaluation si douleur persistante', complications: 'Aucune', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Pas d\'effort musculaire intense', surveillance: '• Douleur persistante\n• Hématome\n• Gêne fonctionnelle' },
  { label: 'Déchirure musculaire', categorie: 'Muscles & Tendons', motif: 'Déchirure musculaire', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Déchirure musculaire partielle', localisation_precise: 'Muscle atteint', douleur: '7', signes_cliniques: 'Douleur vive, impotence partielle, hématome possible.', observations: 'Lésion musculaire partielle confirmable à l\'imagerie.', fc: '90', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie', resultats_examen: 'Déchirure musculaire partielle confirmée.', protocole: '• Examen clinique du muscle lésé avec recherche de déficit fonctionnel\n• Réalisation d\'une échographie si besoin de confirmation\n• Mise au repos stricte du muscle atteint\n• Application de compression et de glace\n• Administration de Paracétamol 1 g et Kétoprofène 100 mg si absence de contre-indication\n• Limitation des mouvements douloureux\n• Réévaluation médicale avant reprise progressive', complications: 'Aucune', repos: 'Repos strict puis progressif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Kétoprofène 100mg x2/jour', antibiotique: 'Aucun', soins_locaux: 'Compression + glace', ata: 'Non requis', restrictions: 'Aucun effort musculaire sur la zone', surveillance: '• Hématome important\n• Douleur croissante\n• Impotence persistante' },
  { label: 'Rupture de tendon', categorie: 'Muscles & Tendons', motif: 'Rupture de tendon', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Rupture tendineuse', localisation_precise: 'Tendon atteint', douleur: '7', signes_cliniques: 'Perte de force ou de fonction, douleur locale, rupture possible palpable.', observations: 'Atteinte fonctionnelle importante.', fc: '88', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Échographie ou IRM', resultats_examen: 'Rupture tendineuse confirmée.', protocole: '• Évaluation fonctionnelle du segment concerné\n• Recherche d\'un déficit moteur caractéristique\n• Réalisation d\'une échographie ou IRM selon la zone\n• Immobilisation immédiate du segment atteint\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si possible\n• Orientation rapide en chirurgie orthopédique si réparation nécessaire\n• Repos strict avant prise en charge spécialisée', complications: 'Perte fonctionnelle prolongée', repos: 'Repos et immobilisation', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Immobilisation', ata: 'Non requis', restrictions: 'Aucun effort sur le tendon atteint', surveillance: '• Douleur persistante\n• Perte de mobilité\n• Aggravation du déficit' },
  { label: 'Contracture musculaire', categorie: 'Muscles & Tendons', motif: 'Contracture musculaire', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Contracture musculaire', localisation_precise: 'Muscle contracturé', douleur: '3', signes_cliniques: 'Raideur musculaire, douleur modérée à la mobilisation.', observations: 'Contracture simple sans déchirure.', fc: '75', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen clinique', resultats_examen: 'Contracture musculaire probable.', protocole: '• Examen clinique du muscle concerné\n• Recherche d\'une lésion plus importante si douleur atypique\n• Mise au repos et limitation de l\'activité douloureuse\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si besoin\n• Conseils d\'hydratation et reprise progressive des mouvements\n• Réévaluation si la douleur persiste au-delà de quelques jours', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Repos local', ata: 'Non requis', restrictions: 'Éviter efforts et étirements brusques', surveillance: '• Douleur persistante\n• Raideur importante\n• Gêne fonctionnelle' },
  { label: 'Cocard / hématome orbitaire', categorie: 'Ophtalmologie & Face', motif: 'Cocard / hématome orbitaire', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Hématome orbitaire', localisation_precise: 'Région orbitaire', douleur: '4', signes_cliniques: 'Ecchymose péri-orbitaire, gonflement, douleur locale.', observations: 'Vision et motricité oculaire à vérifier.', fc: '80', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Examen oculaire', resultats_examen: 'Hématome orbitaire simple.', protocole: '• Examen de la région orbitaire et de la douleur locale\n• Vérification de l\'acuité visuelle et de la mobilité oculaire\n• Recherche de signes d\'atteinte du globe ou de fracture orbitaire\n• Application de glace localement\n• Administration de Paracétamol 1 g\n• Réévaluation si apparition d\'une vision trouble ou d\'une douleur inhabituelle', complications: 'Aucune', repos: 'Repos simple', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter pression et choc sur l\'œil', surveillance: '• Vision trouble\n• Douleur croissante\n• Diplopie\n• Gonflement important' },
  { label: 'Corps étranger dans l\'œil', categorie: 'Ophtalmologie & Face', motif: 'Corps étranger dans l\'œil', gravite: 'MOYENNE', conscience: 'Conscient', diagnostic: 'Corps étranger cornéen', localisation_precise: 'Cornée ou conjonctive', douleur: '6', signes_cliniques: 'Douleur oculaire, larmoiement, rougeur, sensation de corps étranger.', observations: 'Extraction nécessaire si visible et accessible.', fc: '82', ta: '120/75', spo2: '99', temperature: '36.6', etat_constantes: 'Constantes normales', type_examen: 'Lampe à fente', resultats_examen: 'Corps étranger cornéen confirmé.', protocole: '• Évaluation de l\'acuité visuelle avant geste\n• Examen à la lampe à fente pour localiser le corps étranger\n• Retrait prudent si accessible sans traumatisme supplémentaire\n• Rinçage oculaire si nécessaire\n• Mise en route d\'un traitement par Érythromycine ophtalmique 0.5 %\n• Conseils de repos visuel et d\'éviter le frottement oculaire\n• Réévaluation si douleur ou gêne persistante', complications: 'Irritation cornéenne', repos: 'Repos visuel', antalgique: 'Paracétamol si besoin', anti_inflammatoire: 'Aucun', antibiotique: 'Érythromycine ophtalmique 0.5 % x4/jour', soins_locaux: 'Retrait du corps étranger', ata: 'Non requis', restrictions: 'Ne pas se frotter l\'œil', surveillance: '• Douleur persistante\n• Rougeur\n• Vision trouble\n• Larmoiement important' },
  { label: 'Perforation oculaire', categorie: 'Ophtalmologie & Face', motif: 'Perforation oculaire', gravite: 'CRITIQUE', conscience: 'Conscient douloureux', diagnostic: 'Plaie perforante du globe oculaire', localisation_precise: 'Globe oculaire', douleur: '9', signes_cliniques: 'Douleur intense, baisse visuelle, traumatisme majeur de l\'œil.', observations: 'Urgence ophtalmologique chirurgicale.', fc: '100', ta: '130/80', spo2: '97', temperature: '36.8', etat_constantes: 'Constantes stables à surveiller', type_examen: 'Scanner orbitaire', resultats_examen: 'Plaie perforante confirmée.', protocole: '• Évaluation sans pression sur le globe oculaire\n• Protection immédiate de l\'œil par coque rigide\n• Contrôle de la douleur par Morphine IV\n• Réalisation rapide d\'un scanner orbitaire\n• Début d\'une antibiothérapie par Céfazoline 2 g IV\n• Préparation à une prise en charge chirurgicale urgente\n• Surveillance de la douleur et de la vision résiduelle', complications: 'Risque de perte visuelle', repos: 'Hospitalisation urgente', antalgique: 'Morphine 2 à 4 mg IV', anti_inflammatoire: 'Aucun', antibiotique: 'Céfazoline 2 g IV', soins_locaux: 'Coque de protection', ata: '72 heures', restrictions: 'Aucune pression sur l\'œil', surveillance: '• Baisse de vision\n• Douleur croissante\n• Écoulement\n• Nausées' },
  { label: 'Fracture du nez', categorie: 'Ophtalmologie & Face', motif: 'Fracture du nez', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Fracture des os propres du nez', localisation_precise: 'Nez', douleur: '5', signes_cliniques: 'Douleur nasale, œdème, épistaxis, déformation possible.', observations: 'Réduction si déplacement important.', fc: '85', ta: '125/80', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen clinique', resultats_examen: 'Fracture nasale probable ou confirmée.', protocole: '• Examen clinique du nez et de l\'axe facial\n• Recherche de douleur, déformation ou hématome septal\n• Contrôle d\'un éventuel saignement nasal\n• Application de glace localement\n• Administration de Paracétamol 1 g et Ibuprofène 400 mg si possible\n• Orientation pour réduction si déplacement significatif\n• Surveillance de la respiration nasale et de la douleur', complications: 'Aucune complication immédiate', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Ibuprofène 400mg x3/jour', antibiotique: 'Aucun', soins_locaux: 'Glace', ata: 'Non requis', restrictions: 'Éviter chocs, se moucher fortement et efforts', surveillance: '• Saignement\n• Déformation\n• Douleur croissante\n• Difficulté respiratoire nasale' },
  { label: 'Traumatisme dentaire', categorie: 'Ophtalmologie & Face', motif: 'Traumatisme dentaire', gravite: 'FAIBLE', conscience: 'Conscient', diagnostic: 'Traumatisme dento-alvéolaire', localisation_precise: 'Dents ou alvéole', douleur: '5', signes_cliniques: 'Douleur dentaire, mobilité, fracture ou déplacement dentaire possible.', observations: 'Avis dentaire urgent recommandé.', fc: '85', ta: '120/75', spo2: '98', temperature: '36.7', etat_constantes: 'Constantes stables', type_examen: 'Examen bucco-dentaire', resultats_examen: 'Atteinte dento-alvéolaire confirmée.', protocole: '• Examen de la dentition et de la stabilité dentaire\n• Recherche de fracture, mobilité ou expulsion dentaire\n• Nettoyage doux de la cavité buccale si besoin\n• Administration de Paracétamol 1 g pour la douleur\n• Mise en route d\'Amoxicilline 1 g si plaie associée ou indication retenue\n• Orientation rapide vers un soin dentaire ou contention spécialisée\n• Conseils alimentaires adaptés provisoires', complications: 'Atteinte dentaire persistante', repos: 'Repos relatif', antalgique: 'Paracétamol 1g x3/jour', anti_inflammatoire: 'Aucun systématique', antibiotique: 'Amoxicilline 1 g x3/jour', soins_locaux: 'Soin dentaire urgent / contention', ata: 'Non requis', restrictions: 'Pas d\'aliments durs ni de mastication sur la zone', surveillance: '• Douleur croissante\n• Saignement gingival\n• Mobilité dentaire\n• Gonflement' },
  { label: 'Intoxication', categorie: 'Urgences médicales', motif: 'Intoxication', gravite: 'ELEVEE', conscience: 'Conscient ou altéré selon toxique', diagnostic: 'Intoxication aiguë', localisation_precise: 'Systémique', douleur: '4', signes_cliniques: 'Nausées, malaise, troubles variables selon le produit, altération possible des constantes.', observations: 'Identifier le toxique si possible.', fc: '110', ta: '110/70', spo2: '94', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Bilan sanguin + ECG', resultats_examen: 'Troubles biologiques ou cardiaques possibles selon toxique.', protocole: '• Évaluation des fonctions vitales et du niveau de conscience\n• Recherche du produit suspecté, de la dose et de l\'heure d\'exposition\n• Réalisation d\'un bilan sanguin et d\'un ECG\n• Mise en place d\'une perfusion IV si nécessaire\n• Administration de charbon activé 50 g si indication retenue\n• Mise en route d\'un antidote si le toxique est identifié et traité spécifiquement\n• Surveillance rapprochée respiratoire, cardiaque et neurologique', complications: 'Troubles cardiorespiratoires possibles', repos: 'Surveillance hospitalière', antalgique: 'Selon symptômes', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: '48 heures', restrictions: 'Surveillance continue, repos', surveillance: '• Troubles de conscience\n• Vomissements\n• Arythmie\n• Désaturation' },
  { label: 'Réaction allergique', categorie: 'Urgences médicales', motif: 'Réaction allergique', gravite: 'ELEVEE', conscience: 'Conscient', diagnostic: 'Réaction allergique aiguë', localisation_precise: 'Systémique', douleur: '3', signes_cliniques: 'Urticaire, prurit, œdème, gêne respiratoire possible.', observations: 'Risque de progression vers l\'anaphylaxie.', fc: '115', ta: '100/65', spo2: '93', temperature: '36.8', etat_constantes: 'Constantes à surveiller', type_examen: 'Examen clinique', resultats_examen: 'Réaction allergique confirmée.', protocole: '• Évaluation immédiate de la respiration et de la perfusion\n• Recherche du facteur déclenchant si connu\n• Administration d\'Adrénaline IM en cas de forme sévère ou anaphylactique\n• Administration de Cétirizine 10 mg\n• Administration de Méthylprednisolone IV selon sévérité\n• Mise sous surveillance clinique et saturation\n• Préparation à une prise en charge renforcée si aggravation respiratoire ou hémodynamique', complications: 'Choc anaphylactique possible', repos: 'Surveillance', antalgique: 'Aucun', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Aucun spécifique', ata: '24 heures', restrictions: 'Éviter allergène suspecté', surveillance: '• Dyspnée\n• Œdème\n• Hypotension\n• Aggravation cutanée' },
  { label: 'Crise d\'asthme', categorie: 'Urgences médicales', motif: 'Crise d\'asthme', gravite: 'ELEVEE', conscience: 'Conscient dyspnéique', diagnostic: 'Exacerbation aiguë d\'asthme', localisation_precise: 'Voies respiratoires', douleur: '4', signes_cliniques: 'Dyspnée, sifflements, oppression thoracique, gêne respiratoire.', observations: 'Bronchospasme aigu nécessitant traitement rapide.', fc: '120', ta: '130/80', spo2: '90', temperature: '36.7', etat_constantes: 'Constantes respiratoires altérées', type_examen: 'Auscultation + saturation', resultats_examen: 'Bronchospasme confirmé.', protocole: '• Évaluation immédiate de la respiration et de la saturation\n• Auscultation pulmonaire à la recherche de sibilants\n• Mise sous oxygène si saturation insuffisante\n• Administration de Salbutamol nébulisé\n• Administration de Ipratropium nébulisé selon gravité\n• Mise en route d\'une corticothérapie par Prednisone 40 mg/jour\n• Réévaluation respiratoire fréquente après traitement', complications: 'Détresse respiratoire possible', repos: 'Surveillance respiratoire', antalgique: 'Aucun', anti_inflammatoire: 'Corticothérapie orale', antibiotique: 'Aucun', soins_locaux: 'Nébulisations', ata: '24 heures', restrictions: 'Éviter effort et exposition irritante', surveillance: '• Désaturation\n• Dyspnée croissante\n• Silence auscultatoire\n• Tachycardie' },
  { label: 'Hypothermie', categorie: 'Urgences médicales', motif: 'Hypothermie', gravite: 'ELEVEE', conscience: 'Conscient ralenti ou altéré', diagnostic: 'Hypothermie', localisation_precise: 'Systémique', douleur: '2', signes_cliniques: 'Frissons, ralentissement général, froid intense, conscience altérée possible.', observations: 'Température centrale abaissée.', fc: '50', ta: '90/60', spo2: '92', temperature: '34.0', etat_constantes: 'Constantes altérées', type_examen: 'Température centrale + ECG', resultats_examen: 'Hypothermie confirmée.', protocole: '• Mesure de la température centrale et évaluation de la gravité\n• Réalisation d\'un ECG de surveillance\n• Retrait des vêtements humides et réchauffement passif ou actif selon le niveau d\'hypothermie\n• Mise en place de couvertures et environnement chaud\n• Perfusion de NaCl 0.9 % tiédi IV si besoin\n• Surveillance rapprochée des constantes et de la conscience', complications: 'Troubles du rythme possibles', repos: 'Surveillance hospitalière', antalgique: 'Aucun spécifique', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Réchauffement', ata: '48 heures', restrictions: 'Repos strict en milieu tempéré', surveillance: '• Bradycardie\n• Somnolence\n• Désaturation\n• Arythmie' },
  { label: 'Coup de chaleur', categorie: 'Urgences médicales', motif: 'Coup de chaleur', gravite: 'CRITIQUE', conscience: 'Conscient altéré possible', diagnostic: 'Hyperthermie par coup de chaleur', localisation_precise: 'Systémique', douleur: '5', signes_cliniques: 'Hyperthermie, malaise, tachycardie, fatigue majeure, troubles neurologiques possibles.', observations: 'Urgence thermique sévère.', fc: '145', ta: '100/60', spo2: '94', temperature: '40.5', etat_constantes: 'Constantes sévèrement altérées', type_examen: 'Température centrale + bilan sanguin', resultats_examen: 'Hyperthermie importante confirmée.', protocole: '• Évaluation de l\'état neurologique et des fonctions vitales\n• Mesure de la température centrale\n• Début immédiat d\'un refroidissement rapide externe\n• Mise en place d\'une perfusion de NaCl 0.9 % IV\n• Réalisation d\'un bilan sanguin pour évaluer les conséquences systémiques\n• Surveillance continue des constantes et de la température\n• Hospitalisation si signes neurologiques ou altération persistante', complications: 'Risque neurologique et rénal', repos: 'Hospitalisation', antalgique: 'Aucun spécifique', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun', soins_locaux: 'Refroidissement rapide', ata: '48 heures', restrictions: 'Repos strict, éviter chaleur et effort', surveillance: '• Température persistante\n• Troubles de conscience\n• Tachycardie\n• Hypotension' },
  { label: 'Noyade', categorie: 'Urgences médicales', motif: 'Noyade', gravite: 'CRITIQUE', conscience: 'Conscient ou altéré selon gravité', diagnostic: 'Détresse respiratoire secondaire à immersion', localisation_precise: 'Appareil respiratoire', douleur: '4', signes_cliniques: 'Dyspnée, toux, désaturation, détresse respiratoire possible après immersion.', observations: 'Surveillance respiratoire indispensable.', fc: '130', ta: '105/70', spo2: '88', temperature: '35.8', etat_constantes: 'Constantes respiratoires instables', type_examen: 'Gaz du sang + radiographie thorax', resultats_examen: 'Atteinte respiratoire post-immersion confirmée.', protocole: '• Évaluation immédiate de la respiration et de l\'oxygénation\n• Administration d\'oxygène à haut débit si nécessaire\n• Réalisation d\'un gaz du sang et d\'une radiographie thoracique\n• Assistance ventilatoire si insuffisance respiratoire\n• Réchauffement si hypothermie associée\n• Surveillance rapprochée des constantes et de la conscience\n• Hospitalisation pour surveillance respiratoire secondaire', complications: 'Détresse respiratoire aiguë', repos: 'Hospitalisation', antalgique: 'Aucun spécifique', anti_inflammatoire: 'Aucun', antibiotique: 'Aucun systématique', soins_locaux: 'Oxygène / ventilation si besoin', ata: '72 heures', restrictions: 'Repos strict et surveillance continue', surveillance: '• Désaturation\n• Dyspnée\n• Toux persistante\n• Altération de conscience' },
];

const categories = [...new Set(blessures.map(b => b.categorie))];

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
  if (g === 'CRITIQUE') return { dot: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/40',  bg: 'bg-purple-500/10',  label: '● CRITIQUE', active: 'border-purple-500 bg-purple-500/15 text-purple-400' };
  if (g === 'ELEVEE')   return { dot: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-500/10',     label: '● ÉLEVÉE',   active: 'border-red-500 bg-red-500/15 text-red-400' };
  if (g === 'MOYENNE')  return { dot: 'bg-yellow-400',  text: 'text-yellow-400',  border: 'border-yellow-400/40',  bg: 'bg-yellow-400/10',  label: '● MOYENNE',  active: 'border-yellow-400 bg-yellow-400/15 text-yellow-400' };
  return                       { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', label: '● FAIBLE',   active: 'border-emerald-400 bg-emerald-400/15 text-emerald-400' };
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

  const [vals, setVals] = useState<Record<string,string>>({ civilite:'Monsieur', gravite:'FAIBLE' });
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
    const gt = vals.gravite==='CRITIQUE'?'🟣 CRITIQUE':vals.gravite==='ELEVEE'?'🔴 ÉLEVÉE':vals.gravite==='MOYENNE'?'🟡 MOYENNE':'🟢 FAIBLE';
    // Fusionner les motifs multi-sélection + champ libre
    const motifParts = [vals.motifs_selection, vals.motif_libre].filter(Boolean);
    const motif = motifParts.join(' — ') || '—';
    // Triage formaté
    const triageMap: Record<string,string> = { VERT:'🟢 Blessures mineures', JAUNE:'🟡 Urgence différée', ROUGE:'🔴 Urgence vitale', NOIR:'⚫ Décès' };
    const triage = triageMap[vals.triage||''] || '—';
    // Douleur par zone
    const zones = (vals.douleur_zones||'').split(',').map((s:string)=>s.trim()).filter(Boolean);
    const douleur_zones_detail = zones.length > 0
      ? zones.map((z:string)=>{
          const key = `douleur_${z.replace(/[^a-zA-Z0-9]/g,'_')}`;
          const v = vals[key]||'—';
          return `${z}: ${v}/10`;
        }).join(' | ')
      : '—';
    try {
      const res = await fetch('/api/generate-report',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({template:TEMPLATE,values:{...vals,gravite:gt,motif,triage,douleur_zones_detail}})});
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

  const g = gs(vals.gravite||'FAIBLE');

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
                <span className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>FAIBLE</span>
                <span className="flex items-center gap-1.5 text-xs text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>MOYENNE</span>
                <span className="flex items-center gap-1.5 text-xs text-red-400"><span className="w-2 h-2 rounded-full bg-red-500"></span>ÉLEVÉE</span>
                <span className="flex items-center gap-1.5 text-xs text-purple-400"><span className="w-2 h-2 rounded-full bg-purple-500"></span>CRITIQUE</span>
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
          {/* TRIAGE */}
          <div className="col-span-2">
            <L t="Triage"/>
            <div className="flex flex-wrap gap-3 mt-1">
              {[
                { val: 'VERT',  label: 'Blessures mineures',  dot: 'bg-emerald-400', active: 'border-emerald-500 bg-emerald-500/15 text-emerald-400', icon: '🟢' },
                { val: 'JAUNE', label: 'Urgence différée',    dot: 'bg-yellow-400',  active: 'border-yellow-400 bg-yellow-400/15 text-yellow-400',   icon: '🟡' },
                { val: 'ROUGE', label: 'Urgence vitale',       dot: 'bg-red-500',     active: 'border-red-500 bg-red-500/15 text-red-400',             icon: '🔴' },
                { val: 'NOIR',  label: 'Décès',                dot: 'bg-gray-400',    active: 'border-gray-400 bg-gray-400/15 text-gray-300',          icon: '⚫' },
              ].map(t=>(
                <button key={t.val} onClick={()=>set('triage', vals.triage===t.val?'':t.val)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wide transition ${vals.triage===t.val ? t.active : 'border-white/10 text-gray-600 hover:border-white/20'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`}></span>{t.label}
                </button>
              ))}
            </div>
          </div>
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
            <L t="Douleur par zone (sélectionnez les zones atteintes)"/>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Tête','Visage','Cou','Épaule G.','Épaule D.','Thorax','Abdomen','Dos','Bras G.','Bras D.','Main G.','Main D.','Bassin','Jambe G.','Jambe D.','Pied G.','Pied D.'].map(z=>(
                <Chip key={z} label={z} active={(vals.douleur_zones||'').includes(z)} onClick={()=>toggleList('douleur_zones',z)} ac="border-purple-400 bg-purple-500/15 text-purple-300"/>
              ))}
            </div>
            {/* Champ de douleur dynamique par zone sélectionnée */}
            {(vals.douleur_zones||'').split(',').map(s=>s.trim()).filter(Boolean).length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Intensité de douleur par zone (0–10)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(vals.douleur_zones||'').split(',').map(s=>s.trim()).filter(Boolean).map(zone=>{
                    const key = `douleur_${zone.replace(/[^a-zA-Z0-9]/g,'_')}`;
                    const v = vals[key]||'';
                    const n = parseFloat(v);
                    const col = !v||isNaN(n)?'border-gray-700 bg-gray-900 text-gray-400':n>=8?'border-red-500/60 bg-red-500/10 text-red-400':n>=5?'border-yellow-400/60 bg-yellow-400/10 text-yellow-400':'border-emerald-500/60 bg-emerald-500/10 text-emerald-400';
                    return (
                      <div key={zone} className={`flex items-center border rounded-xl overflow-hidden ${col}`}>
                        <span className="px-3 text-xs font-semibold text-gray-400 whitespace-nowrap">{zone}</span>
                        <input type="number" min="0" max="10" value={v} onChange={e=>set(key,e.target.value)} placeholder="0–10" className="flex-1 bg-transparent px-2 py-2 text-current placeholder-gray-700 focus:outline-none text-sm font-mono text-right"/>
                        <span className="px-3 text-xs opacity-50">/10</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><L t="Douleur globale (/10)"/><FI k="douleur" v={vals} s={set} ph="Ex: 7"/></div>
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
              {(['FAIBLE','MOYENNE','ELEVEE','CRITIQUE'] as const).map(gv=>{
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
