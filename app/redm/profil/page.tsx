'use client';

import { useEffect, useRef, useState } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', Georgia, serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const COLOR   = '#8B4040';

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const GRADES       = ['Directeur', 'Co-Directeur', 'Médecin Chef', 'Médecin', 'Apprenti', 'Infirmier', 'Préparateur de Caisse', 'Thérapeute'];
const SPECIALITES  = [
  'Médecine générale', 'Chirurgie', 'Aliénisme', 'Plantes médicinales',
  'Obstétrique', 'Traumatologie', 'Dentisterie',
  'Ophtalmologie', 'Hygiène', 'Autre',
];

const GRADE_COL: Record<string, string> = {
  'Directeur': '#8B4040', 'Co-Directeur': '#8B4040', 'Médecin Chef': '#D1B77C',
  'Médecin': '#A8B991', 'Apprenti': '#888', 'Infirmier': '#5A8AB5',
  'Préparateur de Caisse': '#C8845A', 'Thérapeute': '#9B6AC8',
};
const STATUT_COL: Record<string, string> = {
  'En service': '#A8B991', 'En congé': '#D1B77C', 'En mission': '#5A8AB5', 'Suspendu': '#DF9A88',
};

interface Profile {
  nom_rp: string; prenom_rp: string; age_rp: string; origine: string;
  portrait_url: string; grade: string; dispensaire: string;
  specialites: string[]; statut: string;
}

const EMPTY: Profile = {
  nom_rp: '', prenom_rp: '', age_rp: '', origine: '', portrait_url: '',
  grade: 'Apprenti', dispensaire: 'Little Creek', specialites: [], statut: 'En service',
};


/* ══════════════════════════════════════════════════════════════════════
   CropModal — recadrage circulaire sans dépendance externe
   ══════════════════════════════════════════════════════════════════════ */
const CROP_D  = 280; // diamètre du cercle de prévisualisation (px)
const CROP_R  = CROP_D / 2;
const OUT_SZ  = 400; // taille du JPEG exporté (px)

function CropModal({ file, onConfirm, onCancel }: {
  file: File;
  onConfirm: (dataUrl: string) => void;
  onCancel:  () => void;
}) {
  const [imgUrl,  setImgUrl]  = useState('');
  const [imgNat,  setImgNat]  = useState({ w: 1, h: 1 });
  const [minZoom, setMinZoom] = useState(1);
  const [zoom,    setZoom]    = useState(1);
  const [offset,  setOffset]  = useState({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      setImgNat({ w, h });
      const z = CROP_D / Math.min(w, h);
      setMinZoom(z);
      setZoom(z);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const rw = imgNat.w * zoom;
  const rh = imgNat.h * zoom;
  const ix = (CROP_D - rw) / 2 + offset.x;
  const iy = (CROP_D - rh) / 2 + offset.y;

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = offset.x, oy = offset.y;
    function move(ev: MouseEvent) {
      setOffset({ x: ox + ev.clientX - sx, y: oy + ev.clientY - sy });
    }
    function up() {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    }
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  function confirm() {
    const img = new Image();
    img.src = imgUrl;
    const canvas = document.createElement('canvas');
    canvas.width  = OUT_SZ;
    canvas.height = OUT_SZ;
    const ctx = canvas.getContext('2d')!;
    // Coordonnées source dans l'image originale
    const sx = -ix / zoom;
    const sy = -iy / zoom;
    const sw = CROP_D / zoom;
    const sh = CROP_D / zoom;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_SZ, OUT_SZ);
    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(24,55,70,0.97)', border: '1px solid rgba(180,160,113,0.45)',
        borderRadius: 12, padding: '32px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        minWidth: CROP_D + 80,
      }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#EADCB9', marginBottom: 6 }}>
          Recadrer le portrait
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#C8BEA5', letterSpacing: '0.14em', marginBottom: 24 }}>
          GLISSER POUR REPOSITIONNER · MOLETTE OU CURSEUR POUR ZOOMER
        </div>

        {/* Zone de prévisualisation circulaire */}
        <div style={{ position: 'relative', width: CROP_D, height: CROP_D, flexShrink: 0 }}>
          {/* Image draggable */}
          <div
            onMouseDown={onMouseDown}
            style={{ position: 'absolute', inset: 0, cursor: 'grab', overflow: 'hidden', borderRadius: '50%' }}
          >
            {imgUrl && (
              <img
                src={imgUrl}
                draggable={false}
                style={{
                  position: 'absolute',
                  width: rw, height: rh,
                  left: ix, top: iy,
                  userSelect: 'none', pointerEvents: 'none',
                }}
                alt=""
              />
            )}
          </div>
          {/* Anneau décoratif */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
            border: '2px solid rgba(209,183,124,0.65)',
            boxShadow: '0 0 0 9999px rgba(74,62,32,0.14)',
          }} />
        </div>

        {/* Slider de zoom */}
        <div style={{ marginTop: 24, width: CROP_D, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#C8BEA5', letterSpacing: '0.12em', flexShrink: 0 }}>
            🔍 ZOOM
          </span>
          <input
            type="range"
            min={minZoom * 0.9}
            max={minZoom * 3.5}
            step={0.001}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: COLOR }}
          />
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
          <button onClick={onCancel} style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em',
            background: 'transparent', border: '1px solid rgba(180,160,113,0.40)',
            borderRadius: 5, padding: '11px 28px', color: '#C8BEA5', cursor: 'pointer',
          }}>
            ANNULER
          </button>
          <button onClick={confirm} style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em',
            background: 'rgba(180,160,113,0.20)', border: '1px solid rgba(180,160,113,0.60)',
            borderRadius: 5, padding: '11px 28px', color: '#EADCB9', cursor: 'pointer',
          }}>
            ✔ APPLIQUER
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Page principale
   ══════════════════════════════════════════════════════════════════════ */
export default function ProfilMedecinPage() {
  const { roles: sessionRoles, username } = useRedmSession();
  const isDirection = checkIsAdmin(sessionRoles) || sessionRoles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [profile,  setProfile]  = useState<Profile>(EMPTY);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [cropFile,  setCropFile]  = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/redm/profil-medecin').then(r => r.json()).then(p => {
      if (p && !p.error) {
        setProfile({
          nom_rp:       p.nom_rp       ?? '',
          prenom_rp:    p.prenom_rp    ?? '',
          age_rp:       p.age_rp       ?? '',
          origine:      p.origine      ?? '',
          portrait_url: p.portrait_url ?? '',
          grade:        p.grade        ?? 'Apprenti',
          dispensaire:  p.dispensaire  ?? 'Little Creek',
          specialites:  (p.specialite ?? '').split(',').map((s: string) => s.trim()).filter(Boolean),
          statut:       p.statut       ?? 'En service',
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  function toggleSpecialite(s: string) {
    setProfile(p => ({
      ...p,
      specialites: p.specialites.includes(s)
        ? p.specialites.filter(x => x !== s)
        : [...p.specialites, s],
    }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setCropFile(f);
    e.target.value = '';
  }

  async function handleCropConfirm(dataUrl: string) {
    setCropFile(null);
    setUploading(true);
    try {
      const r = await fetch('/api/redm/upload-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const d = await r.json();
      if (d.url) setProfile(p => ({ ...p, portrait_url: d.url }));
      else setSavedMsg('Erreur upload : ' + (d.error ?? 'inconnue'));
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setSavedMsg('');
    try {
      const payload: Record<string, any> = {
        nom_rp: profile.nom_rp, prenom_rp: profile.prenom_rp,
        age_rp: profile.age_rp, origine: profile.origine, portrait_url: profile.portrait_url,
      };
      if (isDirection) {
        payload.grade       = profile.grade;
        payload.dispensaire = profile.dispensaire;
        payload.specialite  = profile.specialites.join(',');
        payload.statut      = profile.statut;
      }
      const r = await fetch('/api/redm/profil-medecin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload as any),
      });
      const d = await r.json();
      if (d.error) setSavedMsg('Erreur : ' + d.error);
      else { setSavedMsg('Profil enregistré.'); setTimeout(() => setSavedMsg(''), 3000); }
    } finally { setSaving(false); }
  }

  // ── styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'rgba(24,55,70,0.90)', border: '1px solid rgba(180,160,113,0.28)',
    borderRadius: 9, padding: '22px 26px',
  };
  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(180,160,113,0.30)',
    borderRadius: 5, padding: '9px 13px',
    color: '#EADCB9', fontFamily: BODY, fontSize: 14, outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontFamily: MONO, fontSize: 10, color: '#C8BEA5',
    letterSpacing: '0.14em', display: 'block', marginBottom: 5,
    textTransform: 'uppercase',
  };
  const secTitle: React.CSSProperties = {
    fontFamily: DISPLAY, fontSize: 13, color: COLOR,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(180,160,113,0.20)',
    paddingBottom: 12, marginBottom: 20,
  };

  if (loading) return (
    <div style={{ fontFamily: BODY, color: '#C8BEA5', padding: 80, textAlign: 'center', fontSize: 18 }}>
      Chargement du dossier…
    </div>
  );

  const fullName = `${profile.prenom_rp} ${profile.nom_rp}`.trim() || 'Médecin non identifié';
  const gc = GRADE_COL[profile.grade]  ?? COLOR;
  const sc = STATUT_COL[profile.statut] ?? '#888';

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Modal recadrage */}
      {cropFile && (
        <CropModal
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* ══════════════════════ HEADER ══════════════════════ */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Portrait cliquable */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            title="Changer la photo de profil"
            style={{
              width: 96, height: 96, borderRadius: '50%',
              cursor: uploading ? 'default' : 'pointer',
              border: `2px solid rgba(180,160,113,0.55)`,
              overflow: 'hidden', position: 'relative',
            }}
          >
            {profile.portrait_url ? (
              <img src={profile.portrait_url} alt="Portrait" style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'rgba(180,160,113,0.12)',
                border: '1px dashed rgba(180,160,113,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: DISPLAY, fontSize: 28, color: 'rgba(180,160,113,0.5)',
              }}>⚕</div>
            )}
            {/* Overlay au survol */}
            {!uploading && (
              <div className="portrait-hover-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.18s',
                fontFamily: MONO, fontSize: 10, color: '#EADCB9',
                letterSpacing: '0.1em', flexDirection: 'column', gap: 4,
              }}>
                <span style={{ fontSize: 18 }}>📷</span>
                <span>MODIFIER</span>
              </div>
            )}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.62)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 9, color: '#D1B77C', letterSpacing: '0.12em',
              }}>
                UPLOAD…
              </div>
            )}
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
            .portrait-hover-overlay:hover { opacity: 1 !important; }
            div:has(> .portrait-hover-overlay):hover .portrait-hover-overlay { opacity: 1 !important; }
          `}</style>
        </div>

        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, color: '#EADCB9', lineHeight: 1.1 }}>{fullName}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#C8BEA5', letterSpacing: '0.12em', marginTop: 2 }}>
            {username}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, padding: '3px 10px',
              border: `1px solid ${gc}80`, background: `${gc}1A`,
              color: gc, borderRadius: 4, letterSpacing: '0.1em',
            }}>◆ {profile.grade.toUpperCase()}</span>
            <span style={{
              fontFamily: MONO, fontSize: 10, padding: '3px 10px',
              border: `1px solid ${sc}80`, background: `${sc}1A`,
              color: sc, borderRadius: 4, letterSpacing: '0.1em',
            }}>● {profile.statut.toUpperCase()}</span>
            {profile.dispensaire && (
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#C8BEA5' }}>
                {profile.dispensaire}
              </span>
            )}
            {profile.specialites.length > 0 && (
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#7A6050' }}>
                · {profile.specialites.join(', ')}
              </span>
            )}
            {profile.age_rp && (
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#7A6050' }}>
                {profile.dispensaire || profile.specialites.length > 0 ? '—' : ''} {profile.age_rp}{profile.origine ? ` · ${profile.origine}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════ IDENTITÉ + FONCTION ══════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Identité */}
        <div style={card}>
          <div style={secTitle}>⚕ Identité du praticien</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Prénom RP</label>
                <input style={inp} value={profile.prenom_rp}
                  onChange={e => setProfile(p => ({ ...p, prenom_rp: e.target.value }))}
                  placeholder="Ex : François" />
              </div>
              <div>
                <label style={lbl}>Nom RP</label>
                <input style={inp} value={profile.nom_rp}
                  onChange={e => setProfile(p => ({ ...p, nom_rp: e.target.value }))}
                  placeholder="Ex : De Millet" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Âge</label>
                <input style={inp} value={profile.age_rp}
                  onChange={e => setProfile(p => ({ ...p, age_rp: e.target.value }))}
                  placeholder="Ex : 38 ans" />
              </div>
              <div>
                <label style={lbl}>Origine</label>
                <input style={inp} value={profile.origine}
                  onChange={e => setProfile(p => ({ ...p, origine: e.target.value }))}
                  placeholder="Ex : Louisiane" />
              </div>
            </div>

            {/* Photo de profil */}
            <div>
              <label style={lbl}>Photo de profil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {profile.portrait_url ? (
                  <img src={profile.portrait_url} alt="Portrait" style={{
                    width: 52, height: 52, borderRadius: '50%', objectFit: 'cover',
                    border: '1px solid rgba(180,160,113,0.40)', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(180,160,113,0.10)', border: '1px dashed rgba(180,160,113,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: DISPLAY, fontSize: 18, color: 'rgba(180,160,113,0.4)',
                  }}>⚕</div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em',
                    background: 'rgba(180,160,113,0.12)', border: '1px solid rgba(180,160,113,0.40)',
                    borderRadius: 4, padding: '9px 18px',
                    color: uploading ? '#5A4030' : '#EADCB9',
                    cursor: uploading ? 'default' : 'pointer',
                  }}
                >
                  {uploading ? 'UPLOAD EN COURS…' : '📷 CHOISIR UNE PHOTO'}
                </button>
                {profile.portrait_url && (
                  <button
                    onClick={() => setProfile(p => ({ ...p, portrait_url: '' }))}
                    style={{
                      fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                      background: 'transparent', border: '1px solid rgba(180,160,113,0.25)',
                      borderRadius: 4, padding: '9px 14px',
                      color: '#7A5040', cursor: 'pointer',
                    }}
                    title="Supprimer la photo"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ fontFamily: BODY, fontSize: 11, color: '#5A4030', marginTop: 7, fontStyle: 'italic' }}>
                JPG ou PNG · après sélection, un outil de recadrage s'ouvrira automatiquement.
              </div>
            </div>
          </div>
        </div>

        {/* Fonction */}
        <div style={card}>
          <div style={secTitle}>✦ Fonction médicale</div>
          {!isDirection && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#7A5040', letterSpacing: '0.14em', marginBottom: 16, padding: '6px 12px', background: 'rgba(180,160,113,0.08)', border: '1px solid rgba(180,160,113,0.18)', borderRadius: 4 }}>
              MODIFIABLE PAR LA DIRECTION UNIQUEMENT
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Grade</label>
              {isDirection ? (
                <select style={{ ...inp, cursor: 'pointer' }} value={profile.grade}
                  onChange={e => setProfile(p => ({ ...p, grade: e.target.value }))}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <div style={{ ...inp, cursor: 'default', color: GRADE_COL[profile.grade] ?? '#888' }}>
                  ◆ {profile.grade || '—'}
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>
                Spécialité(s)
                {profile.specialites.length > 0 && (
                  <span style={{ marginLeft: 8, color: COLOR, fontStyle: 'normal' }}>
                    — {profile.specialites.length} sélectionnée{profile.specialites.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>
              {isDirection ? (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 7,
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(180,160,113,0.25)',
                  borderRadius: 5,
                }}>
                  {SPECIALITES.map(s => {
                    const active = profile.specialites.includes(s);
                    return (
                      <button key={s} onClick={() => toggleSpecialite(s)} style={{
                        padding: '5px 11px', fontFamily: BODY, fontSize: 13,
                        border: `1px solid ${active ? 'rgba(180,160,113,0.70)' : 'rgba(180,160,113,0.22)'}`,
                        borderRadius: 4,
                        background: active ? 'rgba(180,160,113,0.22)' : 'rgba(0,0,0,0.20)',
                        color: active ? '#EADCB9' : '#7A6050',
                        cursor: 'pointer', transition: 'all 0.14s', outline: 'none',
                      }}>
                        {active && <span style={{ marginRight: 5, fontSize: 10, color: COLOR }}>✔</span>}{s}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...inp, cursor: 'default', minHeight: 42 }}>
                  {profile.specialites.length > 0
                    ? profile.specialites.join(', ')
                    : <span style={{ color: '#5A4030', fontStyle: 'italic' }}>Aucune spécialité</span>}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bouton enregistrer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button onClick={saveProfile} disabled={saving} style={{
          background: 'rgba(180,160,113,0.18)', border: '1px solid rgba(180,160,113,0.55)',
          borderRadius: 6, padding: '12px 60px',
          color: saving ? '#C8BEA5' : '#EADCB9',
          fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em',
          cursor: saving ? 'default' : 'pointer', transition: 'all 0.15s',
        }}>
          {saving ? 'ENREGISTREMENT…' : '✔ ENREGISTRER LE PROFIL'}
        </button>
        {savedMsg && (
          <div style={{ fontFamily: BODY, fontSize: 13, color: savedMsg.startsWith('Erreur') ? '#DF9A88' : '#A8B991' }}>
            {savedMsg}
          </div>
        )}
      </div>

    </div>
  );
}
