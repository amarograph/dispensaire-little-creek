'use client';

import { useEffect, useRef, useState } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', Georgia, serif";
const MONO    = "'Special Elite', 'Courier New', monospace";
const COLOR   = '#8B4040';

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function rpDateNamed(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear() - 136}`;
}
function rpDateFromIso(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear() - 136}`;
}
function parseRpDate(s: string) {
  const parts = s.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day   = parseInt(parts[0]);
  const month = MOIS_FR.indexOf(parts[1]) + 1;
  const year  = parseInt(parts[2]);
  if (!day || month < 1 || !year) return null;
  return { day, month, year };
}
function rpDatesInRange(startStr: string, endStr: string): string[] {
  const s = parseRpDate(startStr);
  const e = parseRpDate(endStr);
  if (!s || !e) return [];
  const cur = new Date(s.year + 136, s.month - 1, s.day);
  const end = new Date(e.year + 136, e.month - 1, e.day);
  const dates: string[] = [];
  while (cur <= end && dates.length < 90) {
    const d = String(cur.getDate()).padStart(2, '0');
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const y = cur.getFullYear() - 136;
    dates.push(`${d}/${m}/${y}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const GRADES       = ['Apprenti', 'Infirmier', 'Médecin', 'Médecin Chef', 'Directeur'];
const DISPENSAIRES = ['Little Creek', 'Valentine', 'Rhodes', 'Tous'];
const SPECIALITES  = [
  'Médecine générale', 'Chirurgie', 'Aliénisme', 'Plantes médicinales',
  'Obstétrique', 'Traumatologie', 'Dentisterie',
  'Ophtalmologie', 'Hygiène', 'Autre',
];
const STATUTS = ['En service', 'En congé', 'En mission', 'Suspendu'];
const MOTIFS  = ['Maladie', 'Voyage', 'Affaires familiales', 'Repos imposé', 'Mission extérieure', 'Autre'];

const GRADE_COL: Record<string, string> = {
  'Apprenti': '#888', 'Infirmier': '#5A8AB5', 'Médecin': '#5A9A58',
  'Médecin Chef': '#C8A040', 'Directeur': '#8B4040',
};
const STATUT_COL: Record<string, string> = {
  'En service': '#5A9A58', 'En congé': '#C8A040', 'En mission': '#5A8AB5', 'Suspendu': '#C83030',
};

interface Profile {
  nom_rp: string; prenom_rp: string; age_rp: string; origine: string;
  portrait_url: string; grade: string; dispensaire: string;
  specialites: string[]; statut: string;
}
interface Presence { jours_semaine: number; derniere_prise: string | null; moyenne: string; }
interface Absence {
  id: string; date_debut: string; date_fin: string; motif: string;
  note: string; statut: string; created_at: string;
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
        background: 'rgba(14,8,10,0.97)', border: '1px solid rgba(120,20,20,0.45)',
        borderRadius: 12, padding: '32px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        minWidth: CROP_D + 80,
      }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#C8B8A0', marginBottom: 6 }}>
          Recadrer le portrait
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: '#7A5A40', letterSpacing: '0.14em', marginBottom: 24 }}>
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
            border: '2px solid rgba(200,168,80,0.65)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }} />
        </div>

        {/* Slider de zoom */}
        <div style={{ marginTop: 24, width: CROP_D, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#7A5A40', letterSpacing: '0.12em', flexShrink: 0 }}>
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
            background: 'transparent', border: '1px solid rgba(120,20,20,0.40)',
            borderRadius: 5, padding: '11px 28px', color: '#7A5A40', cursor: 'pointer',
          }}>
            ANNULER
          </button>
          <button onClick={confirm} style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em',
            background: 'rgba(120,20,20,0.20)', border: '1px solid rgba(120,20,20,0.60)',
            borderRadius: 5, padding: '11px 28px', color: '#C8B8A0', cursor: 'pointer',
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
  const [presence, setPresence] = useState<Presence>({ jours_semaine: 0, derniere_prise: null, moyenne: '0' });
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [absForm, setAbsForm] = useState({
    date_debut: rpDateNamed(0), date_fin: rpDateNamed(3), motif: 'Maladie', note: '',
  });
  const [absBusy,    setAbsBusy]    = useState(false);
  const [absMsg,     setAbsMsg]     = useState('');
  const [editAbsId,  setEditAbsId]  = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState({ date_debut: '', date_fin: '', motif: '', note: '' });
  const [absBusy2,   setAbsBusy2]   = useState<string | null>(null);
  const [cropFile,  setCropFile]  = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/redm/profil-medecin').then(r => r.json()),
      fetch('/api/redm/absences').then(r => r.json()),
    ]).then(([p, a]) => {
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
        if (p.presence) setPresence(p.presence);
      }
      if (a?.absences) setAbsences(a.absences);
    }).finally(() => setLoading(false));
  }, []);

  // Sync agenda : si une absence "Vue et lu" n'a pas d'entrée dans l'agenda commun, l'ajouter
  useEffect(() => {
    const approved = absences.filter(a => a.statut === 'Vue et lu');
    if (approved.length === 0) return;
    const nomRp = `${profile.prenom_rp} ${profile.nom_rp}`.trim();
    if (!nomRp) return;

    fetch('/api/agenda-commun').then(r => r.json()).then(async (raw: any) => {
      const current: any[] = Array.isArray(raw) ? raw : [];
      const missing = approved.filter(a =>
        !current.some((e: any) => String(e.id ?? '').startsWith(`abs_${a.id}_`))
      );
      if (missing.length === 0) return;

      let agenda = current;
      for (const abs of missing) {
        const dates = rpDatesInRange(abs.date_debut, abs.date_fin);
        if (dates.length === 0) continue;
        const rangeNote = dates.length > 1
          ? `Du ${abs.date_debut} au ${abs.date_fin}`
          : abs.date_debut;
        const entries = dates.map(date => ({
          id:         `abs_${abs.id}_${date}`,
          patientNom: nomRp,
          date,
          heure:      '—',
          type:       'Absence',
          statut:     'CONFIRMÉ',
          notes:      [rangeNote, abs.motif].filter(Boolean).join(' — '),
          createdAt:  new Date().toISOString(),
        }));
        const prefix = `abs_${abs.id}_`;
        agenda = [...agenda.filter((e: any) => !String(e.id ?? '').startsWith(prefix)), ...entries];
      }

      await fetch('/api/agenda-commun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenda),
      });
    }).catch(() => {});
  }, [absences, profile.prenom_rp, profile.nom_rp]);

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

  async function cancelAbsence(id: string) {
    setAbsBusy2(id);
    try {
      const r = await fetch('/api/redm/absences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut: 'Annulée' }),
      });
      const d = await r.json();
      if (d.error) { setAbsMsg('Erreur : ' + d.error); return; }
      setAbsences(prev => prev.map(a => a.id === id ? d.absence : a));
      setAbsMsg('Absence annulée.');
      setTimeout(() => setAbsMsg(''), 3000);
    } finally { setAbsBusy2(null); }
  }

  async function saveAbsenceEdit(id: string) {
    setAbsBusy2(id);
    try {
      const r = await fetch('/api/redm/absences', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      const d = await r.json();
      if (d.error) { setAbsMsg('Erreur : ' + d.error); return; }
      setAbsences(prev => prev.map(a => a.id === id ? d.absence : a));
      setEditAbsId(null);
      setAbsMsg('Absence modifiée — en attente de validation.');
      setTimeout(() => setAbsMsg(''), 4000);
    } finally { setAbsBusy2(null); }
  }

  async function submitAbsence() {
    if (!absForm.date_debut || !absForm.date_fin) { setAbsMsg('Veuillez renseigner les dates.'); return; }
    setAbsBusy(true); setAbsMsg('');
    try {
      const r = await fetch('/api/redm/absences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...absForm, nom_rp: `${profile.prenom_rp} ${profile.nom_rp}`.trim() }),
      });
      const d = await r.json();
      if (d.error) setAbsMsg('Erreur : ' + d.error);
      else {
        setAbsMsg('Demande envoyée à la Direction.');
        setAbsences(prev => [d.absence, ...prev]);
        setAbsForm({ date_debut: rpDateNamed(0), date_fin: rpDateNamed(3), motif: 'Maladie', note: '' });
        setTimeout(() => setAbsMsg(''), 4000);
      }
    } finally { setAbsBusy(false); }
  }

  // ── styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'rgba(14,8,10,0.90)', border: '1px solid rgba(120,20,20,0.28)',
    borderRadius: 9, padding: '22px 26px',
  };
  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(120,20,20,0.30)',
    borderRadius: 5, padding: '9px 13px',
    color: '#C8B8A0', fontFamily: BODY, fontSize: 14, outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontFamily: MONO, fontSize: 10, color: '#7A5A40',
    letterSpacing: '0.14em', display: 'block', marginBottom: 5,
    textTransform: 'uppercase',
  };
  const secTitle: React.CSSProperties = {
    fontFamily: DISPLAY, fontSize: 13, color: COLOR,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    borderBottom: '1px solid rgba(120,20,20,0.20)',
    paddingBottom: 12, marginBottom: 20,
  };

  if (loading) return (
    <div style={{ fontFamily: BODY, color: '#9A8870', padding: 80, textAlign: 'center', fontSize: 18 }}>
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
              border: `2px solid rgba(120,20,20,0.55)`,
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
                background: 'rgba(120,20,20,0.12)',
                border: '1px dashed rgba(120,20,20,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: DISPLAY, fontSize: 28, color: 'rgba(120,20,20,0.5)',
              }}>⚕</div>
            )}
            {/* Overlay au survol */}
            {!uploading && (
              <div className="portrait-hover-overlay" style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.52)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.18s',
                fontFamily: MONO, fontSize: 10, color: '#E8D9C0',
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
                fontFamily: MONO, fontSize: 9, color: '#C8A850', letterSpacing: '0.12em',
              }}>
                UPLOAD…
              </div>
            )}
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');
            .portrait-hover-overlay:hover { opacity: 1 !important; }
            div:has(> .portrait-hover-overlay):hover .portrait-hover-overlay { opacity: 1 !important; }
          `}</style>
        </div>

        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, color: '#C8B8A0', lineHeight: 1.1 }}>{fullName}</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#7A5A40', letterSpacing: '0.12em', marginTop: 2 }}>
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
              <span style={{ fontFamily: BODY, fontSize: 13, color: '#9A8870' }}>
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
                    border: '1px solid rgba(120,20,20,0.40)', flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(120,20,20,0.10)', border: '1px dashed rgba(120,20,20,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: DISPLAY, fontSize: 18, color: 'rgba(120,20,20,0.4)',
                  }}>⚕</div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em',
                    background: 'rgba(120,20,20,0.12)', border: '1px solid rgba(120,20,20,0.40)',
                    borderRadius: 4, padding: '9px 18px',
                    color: uploading ? '#5A4030' : '#C8B8A0',
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
                      background: 'transparent', border: '1px solid rgba(120,20,20,0.25)',
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
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#7A5040', letterSpacing: '0.14em', marginBottom: 16, padding: '6px 12px', background: 'rgba(120,20,20,0.08)', border: '1px solid rgba(120,20,20,0.18)', borderRadius: 4 }}>
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
              <label style={lbl}>Dispensaire</label>
              {isDirection ? (
                <select style={{ ...inp, cursor: 'pointer' }} value={profile.dispensaire}
                  onChange={e => setProfile(p => ({ ...p, dispensaire: e.target.value }))}>
                  {DISPENSAIRES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <div style={{ ...inp, cursor: 'default' }}>{profile.dispensaire || '—'}</div>
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
                  background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(120,20,20,0.25)',
                  borderRadius: 5,
                }}>
                  {SPECIALITES.map(s => {
                    const active = profile.specialites.includes(s);
                    return (
                      <button key={s} onClick={() => toggleSpecialite(s)} style={{
                        padding: '5px 11px', fontFamily: BODY, fontSize: 13,
                        border: `1px solid ${active ? 'rgba(120,20,20,0.70)' : 'rgba(120,20,20,0.22)'}`,
                        borderRadius: 4,
                        background: active ? 'rgba(120,20,20,0.22)' : 'rgba(0,0,0,0.20)',
                        color: active ? '#C8B8A0' : '#7A6050',
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
            <div>
              <label style={lbl}>Statut</label>
              {isDirection ? (
                <select style={{ ...inp, cursor: 'pointer' }} value={profile.statut}
                  onChange={e => setProfile(p => ({ ...p, statut: e.target.value }))}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <div style={{ ...inp, cursor: 'default', color: STATUT_COL[profile.statut] ?? '#888' }}>
                  ● {profile.statut || '—'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bouton enregistrer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button onClick={saveProfile} disabled={saving} style={{
          background: 'rgba(120,20,20,0.18)', border: '1px solid rgba(120,20,20,0.55)',
          borderRadius: 6, padding: '12px 60px',
          color: saving ? '#7A5A40' : '#C8B8A0',
          fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em',
          cursor: saving ? 'default' : 'pointer', transition: 'all 0.15s',
        }}>
          {saving ? 'ENREGISTREMENT…' : '✔ ENREGISTRER LE PROFIL'}
        </button>
        {savedMsg && (
          <div style={{ fontFamily: BODY, fontSize: 13, color: savedMsg.startsWith('Erreur') ? '#C83030' : '#5A9A58' }}>
            {savedMsg}
          </div>
        )}
      </div>

      {/* ══════════════════════ PRÉSENCE ══════════════════════ */}
      <div style={card}>
        <div style={secTitle}>⏱ Présence</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { value: String(presence.jours_semaine), label: 'JOURS DE SERVICE (7 JOURS)', big: true },
            { value: rpDateFromIso(presence.derniere_prise), label: 'DERNIÈRE PRISE DE SERVICE', big: false },
            { value: presence.moyenne, label: 'JOURS / SEMAINE (MOY. 4 SEM.)', big: true },
          ].map((item, i) => (
            <div key={i} style={{
              textAlign: 'center',
              borderLeft:  i > 0 ? '1px solid rgba(120,20,20,0.18)' : undefined,
              paddingLeft: i > 0 ? 20 : undefined,
            }}>
              <div style={{
                fontFamily: item.big ? DISPLAY : BODY,
                fontSize: item.big ? 38 : 18,
                color: '#C8B8A0', lineHeight: 1.2,
              }}>{item.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#7A5A40', letterSpacing: '0.12em', marginTop: 7 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: BODY, fontSize: 11, color: '#5A4A38', marginTop: 16, fontStyle: 'italic' }}>
          * Calculé automatiquement à partir des certificats médicaux rédigés.
        </div>
      </div>

      {/* ══════════════════════ ABSENCES ══════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Formulaire */}
        <div style={card}>
          <div style={secTitle}>📋 Déclarer une absence</div>
          <div style={{
            fontFamily: BODY, fontSize: 13, color: '#9A8870', fontStyle: 'italic',
            marginBottom: 18, paddingBottom: 14,
            borderBottom: '1px solid rgba(120,20,20,0.15)',
          }}>
            Demande de congé / indisponibilité
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Du</label>
                <input style={inp} value={absForm.date_debut}
                  onChange={e => setAbsForm(p => ({ ...p, date_debut: e.target.value }))}
                  placeholder={rpDateNamed(0)} />
              </div>
              <div>
                <label style={lbl}>Au</label>
                <input style={inp} value={absForm.date_fin}
                  onChange={e => setAbsForm(p => ({ ...p, date_fin: e.target.value }))}
                  placeholder={rpDateNamed(3)} />
              </div>
            </div>
            <div>
              <label style={lbl}>Motif</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={absForm.motif}
                onChange={e => setAbsForm(p => ({ ...p, motif: e.target.value }))}>
                {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Note facultative</label>
              <textarea
                style={{ ...inp, minHeight: 80, resize: 'vertical' } as React.CSSProperties}
                value={absForm.note}
                onChange={e => setAbsForm(p => ({ ...p, note: e.target.value }))}
                placeholder='Je serai retenu hors de Little Creek quelques jours…'
              />
            </div>
            <button onClick={submitAbsence} disabled={absBusy} style={{
              background: 'rgba(120,20,20,0.15)', border: '1px solid rgba(120,20,20,0.50)',
              borderRadius: 5, padding: '12px',
              color: absBusy ? '#7A5A40' : '#C8B8A0',
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em',
              cursor: absBusy ? 'default' : 'pointer', transition: 'all 0.15s',
            }}>
              {absBusy ? 'ENVOI…' : '✉ ENVOYER À LA DIRECTION'}
            </button>
          </div>
        </div>

        {/* Historique */}
        <div style={card}>
          <div style={secTitle}>🗄 Historique des congés</div>
          {absMsg && (
            <div style={{ fontFamily: BODY, fontSize: 13, marginBottom: 12, textAlign: 'center',
              color: absMsg.startsWith('Erreur') ? '#C83030' : '#5A9A58' }}>
              {absMsg}
            </div>
          )}
          {absences.length === 0 ? (
            <div style={{ fontFamily: BODY, fontSize: 13, color: '#5A4A38', fontStyle: 'italic' }}>
              Aucun congé enregistré.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {absences.map(a => {
                const ACOL: Record<string, string> = {
                  'Absence': '#C8A040', 'Vue et lu': '#5A9A58', 'Annulée': '#C83030',
                };
                const asc = ACOL[a.statut] ?? '#C8A040';
                const isEditing = editAbsId === a.id;
                const isBusy2 = absBusy2 === a.id;
                return (
                  <div key={a.id} style={{
                    background: 'rgba(0,0,0,0.30)', border: `1px solid ${asc}30`,
                    borderLeft: `3px solid ${asc}`,
                    borderRadius: 5, padding: '12px 14px',
                  }}>
                    {isEditing ? (
                      /* ── Formulaire de modification ── */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: '#C8A040', letterSpacing: '0.12em', marginBottom: 2 }}>
                          MODIFIER L'ABSENCE
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div>
                            <label style={{ ...lbl }}>Du</label>
                            <input style={inp} value={editForm.date_debut}
                              onChange={e => setEditForm(f => ({ ...f, date_debut: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ ...lbl }}>Au</label>
                            <input style={inp} value={editForm.date_fin}
                              onChange={e => setEditForm(f => ({ ...f, date_fin: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <label style={{ ...lbl }}>Motif</label>
                          <select style={{ ...inp, cursor: 'pointer' }} value={editForm.motif}
                            onChange={e => setEditForm(f => ({ ...f, motif: e.target.value }))}>
                            {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ ...lbl }}>Note</label>
                          <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' } as React.CSSProperties}
                            value={editForm.note}
                            onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => saveAbsenceEdit(a.id)} disabled={isBusy2} style={{
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                            padding: '7px 14px', cursor: isBusy2 ? 'default' : 'pointer',
                            background: 'rgba(200,160,64,0.15)', border: '1px solid rgba(200,160,64,0.50)',
                            color: '#C8A040', borderRadius: 4, opacity: isBusy2 ? 0.5 : 1,
                          }}>
                            {isBusy2 ? '…' : '✔ ENREGISTRER'}
                          </button>
                          <button onClick={() => setEditAbsId(null)} style={{
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
                            padding: '7px 14px', cursor: 'pointer',
                            background: 'transparent', border: '1px solid rgba(120,20,20,0.30)',
                            color: '#7A6050', borderRadius: 4,
                          }}>ANNULER</button>
                        </div>
                      </div>
                    ) : (
                      /* ── Affichage normal ── */
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                          <div style={{ fontFamily: BODY, fontSize: 14, color: '#C8B8A0', fontWeight: 600 }}>
                            {a.motif}
                          </div>
                          <span style={{
                            fontFamily: MONO, fontSize: 9, padding: '2px 8px',
                            border: `1px solid ${asc}80`, background: `${asc}1A`,
                            color: asc, borderRadius: 3, letterSpacing: '0.08em', flexShrink: 0,
                          }}>{a.statut.toUpperCase()}</span>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: '#7A5A40' }}>
                          {a.date_debut} → {a.date_fin}
                        </div>
                        {a.note && (
                          <div style={{ fontFamily: BODY, fontSize: 12, color: '#9A8870', fontStyle: 'italic', marginTop: 5 }}>
                            « {a.note} »
                          </div>
                        )}
                        {a.statut !== 'Annulée' && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <button onClick={() => {
                              setEditAbsId(a.id);
                              setEditForm({ date_debut: a.date_debut, date_fin: a.date_fin, motif: a.motif, note: a.note });
                            }} disabled={isBusy2} style={{
                              fontFamily: MONO, fontSize: 9, letterSpacing: '0.10em',
                              padding: '5px 11px', cursor: isBusy2 ? 'default' : 'pointer',
                              background: 'rgba(200,160,64,0.10)', border: '1px solid rgba(200,160,64,0.35)',
                              color: '#C8A040', borderRadius: 3,
                            }}>✎ MODIFIER</button>
                            <button onClick={() => cancelAbsence(a.id)} disabled={isBusy2} style={{
                              fontFamily: MONO, fontSize: 9, letterSpacing: '0.10em',
                              padding: '5px 11px', cursor: isBusy2 ? 'default' : 'pointer',
                              background: 'rgba(200,48,48,0.08)', border: '1px solid rgba(200,48,48,0.35)',
                              color: '#C83030', borderRadius: 3, opacity: isBusy2 ? 0.5 : 1,
                            }}>
                              {isBusy2 ? '…' : '✕ ANNULER'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
