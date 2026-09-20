'use client';

import { useState, useEffect, useRef } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';

const MONO    = "'Share Tech Mono', 'Courier New', monospace";
const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

interface Props {
  universe: 'redm';
  accentColor: string;
  accentRgb: string; // e.g. "249,115,22"
}

export default function RPProfileButton({ universe, accentColor, accentRgb }: Props) {
  const { username, avatarUrl } = useRedmSession();

  const [nomRp,      setNomRp]      = useState('');
  const [prenomRp,   setPrenomRp]   = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [open,       setOpen]       = useState(false);
  const [editNom,    setEditNom]    = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/user/rp-profile?universe=${universe}`)
      .then(r => r.json())
      .then(d => {
        setNomRp(d.nom_rp ?? '');
        setPrenomRp(d.prenom_rp ?? '');
        setPortraitUrl(d.portrait_url ?? '');
      })
      .catch(() => {});
  }, [universe]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function openModal() {
    setEditNom(nomRp);
    setEditPrenom(prenomRp);
    setSaveError('');
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/user/rp-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, nom_rp: editNom, prenom_rp: editPrenom }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveError(d.error || `Erreur ${res.status}`);
        return;
      }
      setNomRp(editNom);
      setPrenomRp(editPrenom);
      setOpen(false);
    } catch {
      setSaveError('Erreur réseau — réessayez.');
    } finally {
      setSaving(false);
    }
  }

  const hasName    = nomRp || prenomRp;
  const displayName = hasName ? `${prenomRp} ${nomRp}`.trim() : 'Nom RP…';

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>

      {/* Bouton navbar */}
      <button
        onClick={openModal}
        title="Profil RP"
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: open ? `rgba(${accentRgb},0.08)` : 'transparent',
          border: `1px solid rgba(${accentRgb},${open ? '0.45' : '0.20'})`,
          borderRadius: 7, padding: '9px 16px',
          cursor: 'pointer', transition: 'all 0.18s',
        }}
      >
        {(portraitUrl || avatarUrl) && (
          <img
            src={portraitUrl || avatarUrl} alt=""
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid rgba(${accentRgb},0.45)`, flexShrink: 0 }}
          />
        )}
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontFamily: DISPLAY, fontWeight: 700, fontSize: 17,
            color: hasName ? '#203C49' : '#6B7A80', lineHeight: 1,
            whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: 13, color: accentColor, letterSpacing: '0.06em', lineHeight: 1.5 }}>
            {username}
          </div>
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          background: '#09121F',
          border: `1px solid rgba(${accentRgb},0.30)`,
          borderRadius: 12, padding: '18px',
          width: 340, zIndex: 1000,
          boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 24px rgba(${accentRgb},0.08)`,
        }}>

          {/* Header */}
          <div style={{ fontFamily: MONO, fontSize: 13, color: accentColor, letterSpacing: '0.16em', marginBottom: 16 }}>
            PROFIL RP — {universe.toUpperCase()}
          </div>

          {/* Discord identity */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 18, paddingBottom: 16,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            {avatarUrl && (
              <img src={avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
            )}
            <div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, color: '#E2E8F0' }}>{username}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: '#475569', letterSpacing: '0.08em' }}>COMPTE DISCORD</div>
            </div>
          </div>

          {/* Inputs */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: '#64748B', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>
              PRÉNOM RP
            </label>
            <input
              value={editPrenom}
              onChange={e => setEditPrenom(e.target.value)}
              placeholder="Ex: Jean"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid rgba(${accentRgb},0.20)`,
                borderRadius: 6, padding: '11px 14px',
                color: '#E2E8F0', fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 15, color: '#64748B', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>
              NOM RP
            </label>
            <input
              value={editNom}
              onChange={e => setEditNom(e.target.value)}
              placeholder="Ex: Dupont"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid rgba(${accentRgb},0.20)`,
                borderRadius: 6, padding: '11px 14px',
                color: '#E2E8F0', fontFamily: DISPLAY, fontWeight: 600, fontSize: 17, outline: 'none',
              }}
            />
          </div>

          {saveError && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#F87171', marginBottom: 10, lineHeight: 1.5 }}>
              ⚠ {saveError}
            </div>
          )}

          {/* Save */}
          <button
            onClick={save}
            disabled={saving}
            style={{
              width: '100%',
              background: `rgba(${accentRgb},0.15)`,
              border: `1px solid rgba(${accentRgb},0.45)`,
              borderRadius: 7, padding: '13px',
              color: accentColor, fontFamily: DISPLAY, fontWeight: 700, fontSize: 17,
              letterSpacing: '0.1em', cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {saving ? 'SAUVEGARDE…' : '✔ SAUVEGARDER'}
          </button>

          <a
            href="/redm/profil"
            style={{
              display: 'block', textAlign: 'center', marginTop: 12,
              fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em',
              color: `rgba(${accentRgb},0.75)`,
              textDecoration: 'none',
              padding: '8px',
              borderRadius: 6,
              border: `1px solid rgba(${accentRgb},0.18)`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = `rgba(${accentRgb},0.08)`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            → Voir le dossier complet
          </a>
        </div>
      )}
    </div>
  );
}
