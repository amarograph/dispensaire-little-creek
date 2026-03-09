'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const templateConfigs: Record<string, {
  title: string;
  icon: string;
  fields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
  template: string;
}> = {
  traumatologie: {
    title: 'Traumatologie',
    icon: '🦴',
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
FC : {{fc}}
TA : {{ta}}
SpO₂ : {{spo2}}
Température : {{temperature}}
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
FC : {{fc}}
TA : {{ta}}
SpO₂ : {{spo2}}
Température : {{temperature}}
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
FC : {{fc}}
TA : {{ta}}
SpO₂ : {{spo2}}

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

  if (!config) {
    return <div className="text-red-400">Template introuvable.</div>;
  }

  function handleChange(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  async function generateReport() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: config.template,
          values,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setGeneratedReport(data.report);
      setStep('preview');
    } catch (err) {
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