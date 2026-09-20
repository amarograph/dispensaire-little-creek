'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';

const DISPLAY = "'Rajdhani', 'Arial', sans-serif";

interface Props {
  universe: 'redm';
  accentColor: string;
  accentRgb: string; // e.g. "90,152,88"
}

export default function RPProfileButton({ universe, accentColor, accentRgb }: Props) {
  const { username, avatarUrl } = useRedmSession();

  const [nomRp,       setNomRp]       = useState('');
  const [prenomRp,    setPrenomRp]    = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');

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

  const hasName     = nomRp || prenomRp;
  const displayName = hasName ? `${prenomRp} ${nomRp}`.trim() : 'Nom RP…';

  return (
    <Link
      href="/redm/profil"
      title="Profil RP — modifier"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'transparent',
        border: `1px solid rgba(${accentRgb},0.20)`,
        borderRadius: 7, padding: '9px 16px',
        cursor: 'pointer', transition: 'all 0.18s',
        textDecoration: 'none', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `rgba(${accentRgb},0.08)`; e.currentTarget.style.borderColor = `rgba(${accentRgb},0.45)`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `rgba(${accentRgb},0.20)`; }}
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
    </Link>
  );
}
