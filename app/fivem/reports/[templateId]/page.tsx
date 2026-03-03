'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const templateConfigs: Record<string, {
  title: string;
  icon: string;
  fields: { key: string; label: string; type: string; placeholder: string; required?: boolean }[];
  systemPrompt: string;
}> = {
  intervention: {
    title: 'Traumatologie',
    icon: '🦴',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Mlle Sullivan Eleanor', required: true },
      { key: 'date', label: 'Date de prise en charge', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure de l\'incident', type: 'time', placeholder: '' },
      { key: 'motif', label: 'Motif / type d\'accident', type: 'text', placeholder: 'Ex: AVP moto à haute vitesse', required: true },
      { key: 'antecedents', label: 'Antécédents du patient', type: 'textarea', placeholder: 'Ex: antécédents chirurgicaux au genou droit' },
      { key: 'examen', label: 'Examen clinique (symptômes observés)', type: 'textarea', placeholder: 'Ex: douleur genou droit, gêne à la marche...', required: true },
      { key: 'examens_complementaires', label: 'Examens complémentaires', type: 'textarea', placeholder: 'Ex: radio genou - microlésions rotule, IRM...' },
      { key: 'traitement', label: 'Traitement administré', type: 'textarea', placeholder: 'Ex: attelle Zimmer, antalgiques...' },
      { key: 'prescription', label: 'Prescription de sortie', type: 'textarea', placeholder: 'Ex: Ibuprofène 400mg, Paracétamol 1g...' },
      { key: 'suivi', label: 'Suivi prévu', type: 'text', placeholder: 'Ex: revoir le 26/02/2026' },
      { key: 'medecin', label: 'Médecin responsable', type: 'text', placeholder: 'Ex: Dr Tellez Eziel', required: true },
      { key: 'etudiant', label: 'Étudiant (optionnel)', type: 'text', placeholder: 'Ex: Skoll Ethan' },
    ],
    systemPrompt: `Tu es un médecin urgentiste qui rédige des rapports médicaux professionnels pour un serveur de roleplay FiveM (GTA RP médical). 
Génère un rapport médical complet, structuré et professionnel en français avec les sections suivantes :
- RAPPORT MÉDICAL (titre)
- Identification (patient, date, heure, motif)
- Contexte et antécédents
- Examen clinique initial (en points)
- Examens complémentaires (si fournis)
- Diagnostic retenu
- Prise en charge réalisée
- Prescription de sortie (avec posologie détaillée)
- Suivi / réévaluation
- Validation (médecin, étudiant, date)
Le rapport doit être réaliste, détaillé et professionnel. Utilise des termes médicaux appropriés.`
  },
  chirurgie: {
    title: 'Chirurgie',
    icon: '🔪',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Dupont Jean', required: true },
      { key: 'date', label: 'Date de l\'intervention', type: 'date', placeholder: '', required: true },
      { key: 'type_intervention', label: 'Type d\'intervention', type: 'text', placeholder: 'Ex: appendicectomie, suture...', required: true },
      { key: 'indication', label: 'Indication opératoire', type: 'textarea', placeholder: 'Pourquoi cette opération ?' },
      { key: 'deroulement', label: 'Déroulement de l\'opération', type: 'textarea', placeholder: 'Comment s\'est passée l\'opération ?', required: true },
      { key: 'complications', label: 'Complications éventuelles', type: 'textarea', placeholder: 'Ex: aucune / saignement contrôlé...' },
      { key: 'postop', label: 'Consignes post-opératoires', type: 'textarea', placeholder: 'Ex: repos, pansement à changer...' },
      { key: 'medecin', label: 'Chirurgien', type: 'text', placeholder: 'Ex: Dr Martin', required: true },
    ],
    systemPrompt: `Tu es un chirurgien qui rédige des comptes-rendus opératoires professionnels pour un serveur de roleplay FiveM.
Génère un compte-rendu opératoire complet et structuré en français avec :
- COMPTE-RENDU OPÉRATOIRE (titre)
- Identification du patient
- Indication opératoire
- Déroulement de l'intervention (détaillé)
- Complications peropératoires
- Consignes post-opératoires
- Validation
Utilise un langage chirurgical professionnel et réaliste.`
  },
  consultation: {
    title: 'Consultation générale',
    icon: '🩺',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Mme Lefebvre Marie', required: true },
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'motif', label: 'Motif de consultation', type: 'text', placeholder: 'Ex: douleurs abdominales, fièvre...', required: true },
      { key: 'symptomes', label: 'Symptômes décrits', type: 'textarea', placeholder: 'Ce que le patient ressent', required: true },
      { key: 'examen', label: 'Examen clinique', type: 'textarea', placeholder: 'Résultats de votre examen' },
      { key: 'diagnostic', label: 'Diagnostic', type: 'text', placeholder: 'Ex: gastro-entérite aiguë', required: true },
      { key: 'traitement', label: 'Traitement prescrit', type: 'textarea', placeholder: 'Médicaments, posologie...' },
      { key: 'medecin', label: 'Médecin', type: 'text', placeholder: 'Ex: Dr Bernard', required: true },
    ],
    systemPrompt: `Tu es un médecin généraliste qui rédige des comptes-rendus de consultation professionnels pour un serveur de roleplay FiveM.
Génère un compte-rendu de consultation complet en français avec :
- COMPTE-RENDU DE CONSULTATION (titre)
- Identification
- Motif de consultation
- Anamnèse
- Examen clinique
- Diagnostic
- Traitement et prescriptions
- Conseils au patient
- Validation
Sois professionnel et utilise le vocabulaire médical approprié.`
  },
  urgence: {
    title: 'Urgence vitale',
    icon: '🚨',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Garcia Pablo', required: true },
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'heure', label: 'Heure d\'arrivée', type: 'time', placeholder: '', required: true },
      { key: 'motif', label: 'Nature de l\'urgence', type: 'text', placeholder: 'Ex: arrêt cardiaque, polytraumatisme...', required: true },
      { key: 'constantes', label: 'Constantes vitales à l\'arrivée', type: 'textarea', placeholder: 'Ex: TA 80/50, FC 120, SpO2 88%...', required: true },
      { key: 'gestes', label: 'Gestes d\'urgence réalisés', type: 'textarea', placeholder: 'Ex: intubation, massage cardiaque...', required: true },
      { key: 'medicaments', label: 'Médicaments administrés', type: 'textarea', placeholder: 'Ex: adrénaline 1mg IV...' },
      { key: 'evolution', label: 'Évolution', type: 'textarea', placeholder: 'Ex: stabilisation, transfert...', required: true },
      { key: 'medecin', label: 'Médecin urgentiste', type: 'text', placeholder: 'Ex: Dr Rousseau', required: true },
    ],
    systemPrompt: `Tu es un médecin urgentiste qui rédige des rapports d'urgence vitale pour un serveur de roleplay FiveM.
Génère un rapport d'urgence complet et structuré en français avec :
- RAPPORT D'URGENCE VITALE (titre)
- Identification et contexte
- Bilan initial (constantes, état clinique)
- Gestes d'urgence réalisés (chronologie)
- Médicaments administrés
- Évolution et orientation
- Validation
Le ton doit être urgent, précis et factuel. Utilise la terminologie des urgences.`
  },
  intoxication: {
    title: 'Intoxication',
    icon: '☠️',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: M. Torres Diego', required: true },
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'substance', label: 'Substance(s) en cause', type: 'text', placeholder: 'Ex: alcool, cocaïne, médicaments...', required: true },
      { key: 'dose', label: 'Dose / quantité estimée', type: 'text', placeholder: 'Ex: ~500ml alcool fort' },
      { key: 'symptomes', label: 'Symptômes observés', type: 'textarea', placeholder: 'Ex: confusion, vomissements, tachycardie...', required: true },
      { key: 'constantes', label: 'Constantes vitales', type: 'textarea', placeholder: 'Ex: FC 110, TA 95/60...' },
      { key: 'traitement', label: 'Traitement administré', type: 'textarea', placeholder: 'Ex: perfusion, charbon activé...', required: true },
      { key: 'antidote', label: 'Antidote utilisé', type: 'text', placeholder: 'Ex: Narcan (naloxone) si overdose opioïdes' },
      { key: 'evolution', label: 'Évolution', type: 'textarea', placeholder: 'Ex: amélioration progressive...' },
      { key: 'medecin', label: 'Médecin', type: 'text', placeholder: 'Ex: Dr Chen', required: true },
    ],
    systemPrompt: `Tu es un médecin toxicologue qui rédige des rapports d'intoxication pour un serveur de roleplay FiveM.
Génère un rapport d'intoxication complet en français avec :
- RAPPORT D'INTOXICATION (titre)
- Identification
- Substance(s) et circonstances
- Tableau clinique
- Prise en charge et traitement
- Évolution
- Recommandations de suivi
- Validation
Utilise la terminologie toxicologique appropriée.`
  },
  psychiatrie: {
    title: 'Psychiatrie',
    icon: '🧠',
    fields: [
      { key: 'patient_name', label: 'Nom du patient', type: 'text', placeholder: 'Ex: Mme Blanc Sophie', required: true },
      { key: 'date', label: 'Date', type: 'date', placeholder: '', required: true },
      { key: 'motif', label: 'Motif de consultation', type: 'text', placeholder: 'Ex: crise anxieuse, comportement agité...', required: true },
      { key: 'comportement', label: 'Comportement et état mental observé', type: 'textarea', placeholder: 'Ex: agitation, discours incohérent, pleurs...', required: true },
      { key: 'antecedents', label: 'Antécédents psychiatriques', type: 'textarea', placeholder: 'Ex: dépression connue, hospitalisations...' },
      { key: 'diagnostic', label: 'Diagnostic psychiatrique', type: 'text', placeholder: 'Ex: épisode dépressif majeur, trouble anxieux...', required: true },
      { key: 'traitement', label: 'Traitement prescrit', type: 'textarea', placeholder: 'Ex: anxiolytiques, antidépresseurs...' },
      { key: 'suivi', label: 'Suivi recommandé', type: 'textarea', placeholder: 'Ex: consultation psychiatre dans 1 semaine...' },
      { key: 'medecin', label: 'Médecin psychiatre', type: 'text', placeholder: 'Ex: Dr Moreau', required: true },
    ],
    systemPrompt: `Tu es un médecin psychiatre qui rédige des bilans psychiatriques pour un serveur de roleplay FiveM.
Génère un bilan psychiatrique complet en français avec :
- BILAN PSYCHIATRIQUE (titre)
- Identification
- Motif de consultation
- Anamnèse et antécédents
- Examen psychiatrique (état mental, comportement)
- Diagnostic
- Plan de traitement
- Recommandations et suivi
- Validation
Utilise un langage psychiatrique professionnel et empathique.`
  },
  legiste: {
    title: 'Médecin légiste',
    icon: '🔍',
    fields: [
      { key: 'patient_name', label: 'Nom de la victime', type: 'text', placeholder: 'Ex: M. Noir Inconnu', required: true },
      { key: 'date', label: 'Date d\'examen', type: 'date', placeholder: '', required: true },
      { key: 'lieu', label: 'Lieu de découverte', type: 'text', placeholder: 'Ex: rue principale, entrepôt abandonné...' },
      { key: 'circonstances', label: 'Circonstances', type: 'textarea', placeholder: 'Ex: retrouvé sans vie, blessure par balle...' },
      { key: 'examen_externe', label: 'Examen externe du corps', type: 'textarea', placeholder: 'Ex: blessures visibles, état du corps...', required: true },
      { key: 'lesions', label: 'Lésions constatées', type: 'textarea', placeholder: 'Ex: plaie pénétrante thoracique gauche...', required: true },
      { key: 'cause_deces', label: 'Cause probable du décès', type: 'text', placeholder: 'Ex: hémorragie interne massive', required: true },
      { key: 'conclusions', label: 'Conclusions médico-légales', type: 'textarea', placeholder: 'Ex: mort violente, homicide probable...', required: true },
      { key: 'medecin', label: 'Médecin légiste', type: 'text', placeholder: 'Ex: Dr Legrand', required: true },
    ],
    systemPrompt: `Tu es un médecin légiste qui rédige des rapports médico-légaux pour un serveur de roleplay FiveM.
Génère un rapport légiste complet en français avec :
- RAPPORT MÉDICO-LÉGAL (titre)
- Identification de la victime
- Circonstances de découverte
- Examen externe
- Lésions traumatiques constatées
- Cause et mécanisme du décès
- Conclusions médico-légales
- Validation
Utilise une terminologie légale et médicale précise et factuelle.`
  },
  deces: {
    title: 'Certificat de décès',
    icon: '📋',
    fields: [
      { key: 'patient_name', label: 'Nom et prénom du défunt', type: 'text', placeholder: 'Ex: M. Durant Pierre', required: true },
      { key: 'date_naissance', label: 'Date de naissance', type: 'date', placeholder: '' },
      { key: 'date_deces', label: 'Date du décès', type: 'date', placeholder: '', required: true },
      { key: 'heure_deces', label: 'Heure du décès', type: 'time', placeholder: '' },
      { key: 'lieu_deces', label: 'Lieu du décès', type: 'text', placeholder: 'Ex: Hôpital de Los Santos, chambre 4', required: true },
      { key: 'cause_immediate', label: 'Cause immédiate du décès', type: 'text', placeholder: 'Ex: arrêt cardiaque', required: true },
      { key: 'cause_initiale', label: 'Cause initiale / maladie sous-jacente', type: 'text', placeholder: 'Ex: polytraumatisme suite à AVP' },
      { key: 'medecin', label: 'Médecin certificateur', type: 'text', placeholder: 'Ex: Dr Petit', required: true },
    ],
    systemPrompt: `Tu es un médecin qui rédige des certificats de décès officiels pour un serveur de roleplay FiveM.
Génère un certificat de décès complet et formel en français avec :
- CERTIFICAT DE DÉCÈS (titre)
- Identité du défunt
- Constatation du décès (date, heure, lieu)
- Cause immédiate du décès
- Cause initiale / pathologie sous-jacente
- Déclaration officielle
- Validation et cachet médical
Le ton doit être formel, officiel et sobre.`
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

    const userContent = Object.entries(values)
      .filter(([_, v]) => v)
      .map(([k, v]) => {
        const field = config.fields.find(f => f.key === k);
        return `${field?.label || k}: ${v}`;
      })
      .join('\n');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: config.systemPrompt,
          messages: [{ role: 'user', content: `Voici les informations du rapport :\n\n${userContent}\n\nGénère le rapport médical complet.` }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      setGeneratedReport(text);
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

    const patientName = values['patient_name'] || 'Inconnu';
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
            <p className="text-sm text-orange-300">💡 Remplissez les informations clés — l'IA se chargera de rédiger le rapport complet et professionnel.</p>
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
              {loading ? '⏳ Génération en cours...' : '✨ Générer le rapport'}
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