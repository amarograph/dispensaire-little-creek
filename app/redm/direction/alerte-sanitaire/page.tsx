'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';
import {
  EPIDEMIES, RISQUES_SANITAIRES, DEFAULT_DISPENSAIRE_STATUS,
  sanitaireColor, sanitaireLabel,
  type DispensaireStatus,
} from '@/app/redm/_lib/sanitaireListes';


const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%', cursor: 'pointer' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };

export default function AlerteSanitairePage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'admin'].includes(r));
  const canAccess = canEdit || roles.includes('redm_medecin_chef');

  const [status,  setStatus]  = useState<DispensaireStatus>(DEFAULT_DISPENSAIRE_STATUS);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    fetch('/api/redm/dispensaire-status')
      .then(r => { if (!r.ok) throw new Error('forbidden'); return r.json(); })
      .then(d => setStatus({
        epidemie: d?.epidemie ?? DEFAULT_DISPENSAIRE_STATUS.epidemie,
        risque:   d?.risque   ?? DEFAULT_DISPENSAIRE_STATUS.risque,
      }))
      .catch(() => setError('Accès refusé ou erreur serveur.'))
      .finally(() => setLoading(false));
  }, []);

  async function save(next: DispensaireStatus) {
    setStatus(next);
    window.dispatchEvent(new CustomEvent('redm:dispensaire-status', { detail: next }));
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/redm/dispensaire-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ? `Erreur lors de l'enregistrement : ${d.error}` : "Erreur lors de l'enregistrement.");
      }
    } catch {
      setError("Erreur réseau lors de l'enregistrement.");
    } finally { setSaving(false); }
  }

  function setNom(key: 'epidemie' | 'risque', nom: string) {
    save({ ...status, [key]: { nom, critique: nom ? status[key].critique : false } });
  }
  function toggleCritique(key: 'epidemie' | 'risque') {
    save({ ...status, [key]: { ...status[key], critique: !status[key].critique } });
  }

  function Row({ keyName, icon, title, options }: { keyName: 'epidemie' | 'risque'; icon: string; title: string; options: string[] }) {
    const entry = status[keyName];
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${sanitaireColor(entry)}`, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.text }}>{title}</span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', color: sanitaireColor(entry) }}>
            ● {sanitaireLabel(entry)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <label style={lbl}>SÉLECTION</label>
            <select style={inp} value={entry.nom} onChange={e => setNom(keyName, e.target.value)} disabled={saving || !canEdit}>
              <option value="">— Aucune —</option>
              {options.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {canEdit && (
            <button onClick={() => toggleCritique(keyName)} disabled={saving || !entry.nom}
              style={{
                fontFamily: MONO, fontSize: 13, letterSpacing: '0.12em', padding: '10px 20px',
                cursor: (saving || !entry.nom) ? 'default' : 'pointer',
                opacity: !entry.nom ? 0.4 : 1,
                background: entry.critique ? 'rgba(200,48,48,0.18)' : 'rgba(209,183,124,0.10)',
                color: entry.critique ? '#E86060' : T.gold,
                border: `1px solid ${entry.critique ? 'rgba(200,48,48,0.5)' : 'rgba(209,183,124,0.35)'}`,
              }}>
              {entry.critique ? '⚠ CRITIQUE' : 'MARQUER CRITIQUE'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => router.push('/redm/direction')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>DIRECTION · ALERTE SANITAIRE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 35, color: T.gold, margin: 0 }}>🚨 Alerte Sanitaire</h1>
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          ÉPIDÉMIES & RISQUES SANITAIRES — ACCÈS DIRECTION UNIQUEMENT
        </p>
      </div>

      {!canAccess ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 24, fontFamily: MONO, fontSize: 13, color: '#E88060' }}>
          ⚠ Accès refusé.
          <div style={{ marginTop: 8, color: T.muted, fontSize: 12 }}>Seuls la direction et la co-direction peuvent consulter et modifier ces paramètres.</div>
        </div>
      ) : loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 48, textAlign: 'center', fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em' }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: 'rgba(139,64,64,0.12)', border: '1px solid rgba(139,64,64,0.35)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 13, color: '#E88060' }}>
              <span>⚠ {error}</span>
              <button onClick={() => setError('')} style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <Row keyName="epidemie" icon="🦠" title="Épidémie en cours"  options={EPIDEMIES} />
          <Row keyName="risque"   icon="☣"  title="Risque sanitaire"   options={RISQUES_SANITAIRES} />

          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, fontFamily: MONO, letterSpacing: '0.02em' }}>
            ℹ « Aucune » = statut sain (vert) sur l'accueil. Sélectionner une cause affiche son nom en jaune.
            « MARQUER CRITIQUE » fait passer le statut en rouge et affiche immédiatement à tous les joueurs
            l'alerte sanitaire (en haut à gauche), pour mettre en place des protocoles stricts.
          </div>
        </div>
      )}
    </div>
  );
}
