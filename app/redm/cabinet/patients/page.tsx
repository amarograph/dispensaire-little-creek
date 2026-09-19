'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type Statut    = 'EN COURS' | 'TERMINÉE' | 'ABANDONNÉE' | 'CLÔTURÉE';
type TypeSeance = 'Première consultation' | 'Suivi' | 'Urgence' | 'Hypnose' | 'Thérapie du deuil' | 'Conseil spirituel';
type Equilibre  = '' | 'I' | 'II' | 'III';

interface Dossier {
  id: string; patientNom: string; patientPrenom: string; patientAge: string; patientMetier: string;
  dateConsult: string; type: TypeSeance; plainte: string;
  antecedentsPersonnels: string; antecedentsFamiliaux: string; evenementsRecents: string;
  equilibreNerveux: Equilibre; noteThérapeute: string;
  traitement: string; prochaine: string;
  statut: Statut; confidentiel: boolean; createdAt: string;
}


const STATUT_COL: Record<Statut, string> = { 'EN COURS': '#D1B77C', 'TERMINÉE': '#A8B991', 'ABANDONNÉE': '#8B4040', 'CLÔTURÉE': '#5A4A6A' };
const TYPES: TypeSeance[] = ['Première consultation', 'Suivi', 'Urgence', 'Hypnose', 'Thérapie du deuil', 'Conseil spirituel'];
const METIERS = [
  '', "Sherif East Wellster's", 'Sherif West Elizabeth', 'Maire', 'Marshall',
  'Fermier/ière', 'Médecin', 'Sans emploi', 'Salonnier/ière', 'Employé',
  'Patron/ne', 'Directeur/rice de Dispensaire', 'Tanneur',
  'Préparateur/rice de commande', 'Palefrenier/ière', 'Tisseur/euse',
  'Boucher/ère', 'Distilleur', 'Casino',
];
const EQUILIBRES = [
  { val: '' as Equilibre,    label: '— Non évalué', col: '#C8BEA5' },
  { val: 'I' as Equilibre,   label: 'Degré I — Léger',   col: '#A8B991' },
  { val: 'II' as Equilibre,  label: 'Degré II — Modéré', col: '#786030' },
  { val: 'III' as Equilibre, label: 'Degré III — Grave',  col: '#8B4040' },
];

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.25)', border: `1px solid rgba(139,90,43,0.30)`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const sec: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.16em', marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: `1px solid rgba(139,90,43,0.20)` };

/** Convertit une ligne Supabase (snake_case) en Dossier (camelCase) */
function mapFromDb(row: Record<string, unknown>): Dossier {
  return {
    id:                    String(row.id ?? ''),
    patientNom:            String(row.patient_nom            ?? ''),
    patientPrenom:         String(row.patient_prenom         ?? ''),
    patientAge:            String(row.patient_age            ?? ''),
    patientMetier:         String(row.patient_metier         ?? ''),
    dateConsult:           String(row.date_consult           ?? ''),
    type:                  (row.type_seance                  ?? 'Première consultation') as TypeSeance,
    plainte:               String(row.plainte                ?? ''),
    antecedentsPersonnels: String(row.antecedents_personnels ?? ''),
    antecedentsFamiliaux:  String(row.antecedents_familiaux  ?? ''),
    evenementsRecents:     String(row.evenements_recents     ?? ''),
    equilibreNerveux:      (row.equilibre_nerveux            ?? '') as Equilibre,
    noteThérapeute:        String(row.note_therapeute        ?? ''),
    traitement:            String(row.traitement             ?? ''),
    prochaine:             String(row.prochaine              ?? ''),
    statut:                (row.statut                       ?? 'EN COURS') as Statut,
    confidentiel:          Boolean(row.confidentiel),
    createdAt:             String(row.created_at             ?? ''),
  };
}

const EMPTY: Omit<Dossier, 'id' | 'createdAt'> = {
  patientNom: '', patientPrenom: '', patientAge: '', patientMetier: '', dateConsult: '',
  type: 'Première consultation', plainte: '',
  antecedentsPersonnels: '', antecedentsFamiliaux: '', evenementsRecents: '',
  equilibreNerveux: '', noteThérapeute: '',
  traitement: '', prochaine: '', statut: 'EN COURS', confidentiel: false,
};

export default function PatientsPage() {
  const router = useRouter();
  const [dossiers,   setDossiers]   = useState<Dossier[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [panelOpen,  setPanelOpen]  = useState(false);
  const [editing,    setEditing]    = useState<Dossier | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY });
  const [search,      setSearch]      = useState('');
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null);
  const [archConfirm, setArchConfirm] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    fetch('/api/cabinet/dossiers')
      .then(r => r.json())
      .then(d => {
        // Convertit snake_case Supabase → camelCase attendu par l'UI
        const list = (d.dossiers ?? []).map(mapFromDb);
        setDossiers(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openNew() { router.push('/redm/cabinet/patients/nouveau'); }

  function openEdit(d: Dossier) {
    setEditing(d);
    setForm({
      patientNom: d.patientNom ?? '', patientPrenom: d.patientPrenom ?? '',
      patientAge: d.patientAge ?? '', patientMetier: d.patientMetier ?? '', dateConsult: d.dateConsult ?? '',
      type: d.type ?? 'Première consultation', plainte: d.plainte ?? '',
      antecedentsPersonnels: d.antecedentsPersonnels ?? '',
      antecedentsFamiliaux:  d.antecedentsFamiliaux  ?? '',
      evenementsRecents:     d.evenementsRecents     ?? '',
      equilibreNerveux:      d.equilibreNerveux      ?? '',
      noteThérapeute:        d.noteThérapeute        ?? '',
      traitement:  d.traitement  ?? '', prochaine: d.prochaine ?? '',
      statut: d.statut ?? 'EN COURS', confidentiel: d.confidentiel ?? false,
    });
    setPanelOpen(true);
  }

  async function submit() {
    if (!form.patientNom.trim() || saving) return;
    setSaving(true);
    if (editing) {
      await fetch('/api/cabinet/dossiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      setDossiers(p => p.map(d => d.id === editing.id ? { ...editing, ...form } : d));
    }
    setSaving(false);
    setPanelOpen(false);
  }

  async function deleteDossier(id: string) {
    await fetch('/api/cabinet/dossiers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setDossiers(p => p.filter(x => x.id !== id));
  }

  async function archiveDossier(d: Dossier) {
    const res = await fetch('/api/cabinet/dossiers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, statut: 'CLÔTURÉE' }),
    });
    const data = await res.json();
    if (data.ok) {
      setDossiers(p => p.filter(x => x.id !== d.id));
      showToast('📦 Dossier clôturé — visible dans Archives');
    } else showToast('✗ ' + (data.error ?? 'Erreur'));
    setArchConfirm(null);
  }

  const archiveesCount = dossiers.filter(d => d.statut === 'CLÔTURÉE').length;

  const filtered = dossiers.filter(d => {
    if (d.statut === 'CLÔTURÉE') return false;
    return (
      (d.patientNom + ' ' + (d.patientPrenom ?? '')).toLowerCase().includes(search.toLowerCase()) ||
      (d.plainte ?? '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'); @keyframes slide-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes fade-in{from{opacity:0}to{opacity:1}}`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 22, right: 24, zIndex: 9999, padding: '12px 22px', background: 'rgba(209,183,124,0.12)', border: '1px solid rgba(209,183,124,0.45)', borderRadius: 8, color: T.gold, fontFamily: MONO, fontSize: 15, animation: 'fade-in 0.2s ease' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={() => router.push('/redm/cabinet')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>CABINET · DOSSIERS PATIENTS</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 35, color: T.gold, margin: 0 }}>📋 Dossiers Patients</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'TOTAL',      v: dossiers.filter(d=>d.statut!=='CLÔTURÉE').length, c: T.gold    },
          { l: 'EN COURS',   v: dossiers.filter(d=>d.statut==='EN COURS').length,  c: '#D1B77C' },
          { l: 'TERMINÉES',  v: dossiers.filter(d=>d.statut==='TERMINÉE').length,  c: '#A8B991' },
          { l: 'CLÔTURÉES',  v: dossiers.filter(d=>d.statut==='CLÔTURÉE').length,  c: '#5A4A6A' },
        ].map(s =>
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 30, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 3, letterSpacing: '0.1em' }}>{s.l}</div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un patient…" style={{ ...inp, flex: 1 }} />
        <button onClick={() => router.push('/redm/cabinet/archives/cloturees')}
          style={{ fontFamily: MONO, fontSize: 13, padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, letterSpacing: '0.08em' }}>
          🗄 Archives{archiveesCount > 0 ? ` (${archiveesCount})` : ''}
        </button>
        <button onClick={openNew} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '9px 20px', cursor: 'pointer', background: 'rgba(74,96,72,0.25)', color: '#A8B991', border: '1px solid rgba(74,96,72,0.5)', whiteSpace: 'nowrap' }}>✚ NOUVEAU DOSSIER</button>
      </div>

      {/* Liste */}
      {loading ? <div style={{ textAlign:'center', padding: 40, fontFamily: MONO, fontSize: 15, color: T.dim }}>Chargement…</div>
      : filtered.length === 0
        ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '40px', textAlign: 'center', fontFamily: MONO, fontSize: 15, color: T.dim }}>{dossiers.length === 0 ? 'Aucun dossier patient' : 'Aucun résultat'}</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(d => {
              const col = STATUT_COL[d.statut];
              const initiales = ((d.patientPrenom || d.patientNom || '?')[0]).toUpperCase();
              const nomComplet = [d.patientPrenom, d.patientNom].filter(Boolean).join(' ');
              return (
                <div key={d.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${col}`, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => router.push('/redm/cabinet/patients/' + d.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#26190E')}
                  onMouseLeave={e => (e.currentTarget.style.background = T.card)}>
                  <div style={{ width: 44, height: 44, background: col+'28', border: `1px solid ${col}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 24, color: col }}>{initiales}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.text }}>{nomComplet || d.patientNom}</span>
                      {d.patientAge && <span style={{ fontFamily: MONO, fontSize: 13, color: T.muted }}>{d.patientAge} ans</span>}
                      {d.patientMetier && <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>· {d.patientMetier}</span>}
                      {d.confidentiel && <span style={{ fontFamily: MONO, fontSize: 12, color: '#DF9A88', background: '#8B404018', padding: '1px 6px' }}>CONFIDENTIEL</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: col, background: col+'18', padding: '1px 7px' }}>{d.statut}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, background: 'rgba(209,183,124,0.10)', padding: '1px 7px' }}>{d.type}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>{d.dateConsult}</span>
                    </div>
                    {d.plainte && <div style={{ fontFamily: BODY, fontSize: 16, color: T.muted, marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>« {d.plainte} »</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(d)} title="Modifier" style={{ fontFamily: MONO, fontSize: 14, padding: '5px 8px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: T.gold, border: `1px solid rgba(209,183,124,0.3)` }}>✎</button>
                    {archConfirm === d.id
                      ? <><button onClick={() => archiveDossier(d)} style={{ fontFamily: MONO, fontSize: 11, padding: '5px 7px', cursor: 'pointer', background: 'rgba(90,74,106,0.25)', color: '#9A8AB0', border: '1px solid rgba(90,74,106,0.55)' }}>CLÔTURER</button><button onClick={() => setArchConfirm(null)} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 6px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                      : <button onClick={() => setArchConfirm(d.id)} title="Clôturer le dossier" style={{ fontFamily: MONO, fontSize: 14, padding: '5px 8px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>📦</button>}
                    {delConfirm === d.id
                      ? <><button onClick={() => { deleteDossier(d.id); setDelConfirm(null); }} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 8px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>OK?</button><button onClick={() => setDelConfirm(null)} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 6px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button></>
                      : <button onClick={() => setDelConfirm(d.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '5px 8px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
                    <span style={{ fontFamily: MONO, fontSize: 17, color: T.dim, display: 'flex', alignItems: 'center' }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>}

      {/* ══ PANNEAU MODIFICATION ══ */}
      {panelOpen && editing && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 540, background: T.bg, borderLeft: `2px solid ${T.gold}`, zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'slide-in 0.25s ease' }}>

            {/* En-tête */}
            <div style={{ padding: '22px 26px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>✎ Modifier le dossier</div>
              <button onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: T.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Corps scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* IDENTITÉ */}
              <div style={sec}>👤 IDENTITÉ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>PRÉNOM</label><input style={inp} value={form.patientPrenom} onChange={e => setForm(f=>({...f,patientPrenom:e.target.value}))} placeholder="Prénom" /></div>
                <div><label style={lbl}>NOM *</label><input style={inp} value={form.patientNom} onChange={e => setForm(f=>({...f,patientNom:e.target.value}))} placeholder="Nom de famille" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
                <div><label style={lbl}>ÂGE</label><input style={inp} value={form.patientAge} onChange={e => setForm(f=>({...f,patientAge:e.target.value}))} placeholder="Ans" /></div>
                <div>
                  <label style={lbl}>MÉTIER</label>
                  <select style={{...inp, cursor:'pointer'}} value={form.patientMetier} onChange={e => setForm(f=>({...f,patientMetier:e.target.value}))}>
                    {METIERS.map(m => <option key={m} value={m}>{m || '— Sélectionner —'}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>DATE</label><input style={inp} value={form.dateConsult} onChange={e => setForm(f=>({...f,dateConsult:e.target.value}))} placeholder="JJ/MM/AAAA" /></div>
                <div><label style={lbl}>TYPE</label><select style={{...inp,cursor:'pointer'}} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value as TypeSeance}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div><label style={lbl}>PLAINTE / MOTIF</label><input style={inp} value={form.plainte} onChange={e => setForm(f=>({...f,plainte:e.target.value}))} placeholder="Ce que rapporte le patient…" /></div>

              {/* INFORMATIONS */}
              <div style={{ ...sec, marginTop: 8 }}>📜 INFORMATIONS</div>
              <div><label style={lbl}>ANTÉCÉDENTS PERSONNELS</label><textarea style={{...inp,resize:'vertical',minHeight:70,lineHeight:1.6}} value={form.antecedentsPersonnels} onChange={e => setForm(f=>({...f,antecedentsPersonnels:e.target.value}))} placeholder="Maladies, traumatismes, traitements passés…" /></div>
              <div><label style={lbl}>ANTÉCÉDENTS FAMILIAUX</label><textarea style={{...inp,resize:'vertical',minHeight:60,lineHeight:1.6}} value={form.antecedentsFamiliaux} onChange={e => setForm(f=>({...f,antecedentsFamiliaux:e.target.value}))} placeholder="Contexte familial, héréditaire…" /></div>
              <div><label style={lbl}>ÉVÉNEMENTS RÉCENTS</label><textarea style={{...inp,resize:'vertical',minHeight:60,lineHeight:1.6}} value={form.evenementsRecents} onChange={e => setForm(f=>({...f,evenementsRecents:e.target.value}))} placeholder="Deuil, séparation, choc…" /></div>

              {/* ÉQUILIBRE NERVEUX */}
              <div style={{ ...sec, marginTop: 8 }}>⚖ ÉTAT DE L&apos;ÉQUILIBRE NERVEUX</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {EQUILIBRES.map(eq => {
                  const on = form.equilibreNerveux === eq.val;
                  return (
                    <button key={eq.val} type="button" onClick={() => setForm(f=>({...f,equilibreNerveux:eq.val}))}
                      style={{ fontFamily: MONO, fontSize: 14, padding: '9px 12px', cursor: 'pointer', background: on ? eq.col+'28' : 'transparent', color: on ? eq.col : T.dim, border: `1px solid ${on ? eq.col+'70' : T.border}`, textAlign: 'left', letterSpacing: '0.06em' }}>
                      {eq.label}
                    </button>
                  );
                })}
              </div>

              {/* NOTE THÉRAPEUTE */}
              <div style={{ ...sec, marginTop: 8 }}>✍ NOTE DU THÉRAPEUTE</div>
              <div><textarea style={{...inp,resize:'vertical',minHeight:80,lineHeight:1.7}} value={form.noteThérapeute} onChange={e => setForm(f=>({...f,noteThérapeute:e.target.value}))} placeholder="Impressions cliniques, hypothèses…" /></div>

              {/* TRAITEMENT */}
              <div style={{ ...sec, marginTop: 8 }}>💊 TRAITEMENT &amp; STATUT</div>
              <div><label style={lbl}>TRAITEMENT / CONSEILS</label><textarea style={{...inp,resize:'vertical',minHeight:70,lineHeight:1.6}} value={form.traitement} onChange={e => setForm(f=>({...f,traitement:e.target.value}))} placeholder="Remèdes, recommandations…" /></div>
              <div><label style={lbl}>PROCHAINE SÉANCE</label><input style={inp} value={form.prochaine} onChange={e => setForm(f=>({...f,prochaine:e.target.value}))} placeholder="Date ou note de suivi" /></div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ flex: 1 }}><label style={lbl}>STATUT</label><select style={{...inp,cursor:'pointer'}} value={form.statut} onChange={e => setForm(f=>({...f,statut:e.target.value as Statut}))}><option>EN COURS</option><option>TERMINÉE</option><option>ABANDONNÉE</option><option>CLÔTURÉE</option></select></div>
                <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:MONO, fontSize: 13, color: form.confidentiel?'#DF9A88':T.dim, paddingTop:16 }}>
                  <input type="checkbox" checked={form.confidentiel} onChange={e => setForm(f=>({...f,confidentiel:e.target.checked}))} style={{width:15,height:15}} /> CONFIDENTIEL
                </label>
              </div>
            </div>

            {/* Pied fixe */}
            <div style={{ padding: '14px 26px 22px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={submit} disabled={!form.patientNom.trim() || saving}
                style={{ width: '100%', fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px', cursor: form.patientNom.trim()?'pointer':'not-allowed', background: form.patientNom.trim()?'rgba(74,96,72,0.35)':'rgba(255,255,255,0.04)', color: form.patientNom.trim()?'#A8B991':T.dim, border:`2px solid ${form.patientNom.trim()?'rgba(74,96,72,0.6)':'rgba(255,255,255,0.06)'}` }}>
                {saving ? '…' : '✔ ENREGISTRER LES MODIFICATIONS'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
