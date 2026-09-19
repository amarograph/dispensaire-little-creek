'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye', 'Georgia', serif";
const BODY    = "'Josefin Slab', 'Georgia', serif";
const MONO    = "'Special Elite', 'Courier New', monospace";
const T = { bg: '#1A1208', card: '#1F1610', border: 'rgba(139,90,43,0.30)', gold: '#C8A850', text: '#E8D9C0', muted: '#8B7355', dim: '#5A4A35' };

type StatutPaiement = 'PAYÉ' | 'EN ATTENTE' | 'ANNULÉ';
type TypeCategorie  = 'vente' | 'achat';
type Payeur         = 'Civil' | 'Shérif' | 'Écurie Little Creek' | 'Écurie Valentine' | 'Mairie West Elizabeth';

interface TarifCategory { id: string; nom: string; type: TypeCategorie; prix: number; pctDispensaire: number; pctMedecin: number; ordre: number; }
const DEFAULT_CATEGORIES: TarifCategory[] = [
  { id: 'Consultation', nom: 'Consultation', type: 'vente', prix: 1,   pctDispensaire: 50, pctMedecin: 50, ordre: 0 },
  { id: 'Traitement',   nom: 'Traitement',   type: 'vente', prix: 0.4, pctDispensaire: 50, pctMedecin: 50, ordre: 1 },
];
function categoriesToMap(categories: TarifCategory[]): Record<string, TarifCategory> {
  const m: Record<string, TarifCategory> = {};
  categories.forEach(c => { m[c.id] = c; });
  return m;
}
const PAYEURS: Payeur[] = ['Civil', 'Shérif', 'Écurie Little Creek', 'Écurie Valentine', 'Mairie West Elizabeth'];

interface PrestationItem { id: string; qty: number; }
function normPrestations(raw: unknown): PrestationItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [{ id: 'Consultation', qty: 1 }];
  return raw.map(p => typeof p === 'string'
    ? { id: p, qty: 1 }
    : { id: (p as PrestationItem).id, qty: Math.max(1, Math.min(99, Number((p as PrestationItem).qty) || 1)) });
}

interface Facture {
  id: string; medecin: string; patientNom: string; dateSeance: string;
  prestations: (string | PrestationItem)[]; montant: number;
  payeur: Payeur; statut: StatutPaiement; notes: string; createdAt: string;
}
interface SemaineArchivee {
  id: string; weekLabel: string; weekStart: string;
  factures: Facture[]; archivedAt: string;
  totalPercu: number; totalAttente: number;
}

const LS     = 'redm_cabinet_compta_v1';
const LS_ARC = 'redm_cabinet_compta_archives_v1';
function load(): Facture[]             { try { return JSON.parse(localStorage.getItem(LS)     ?? '[]'); } catch { return []; } }
function loadArc(): SemaineArchivee[]  { try { return JSON.parse(localStorage.getItem(LS_ARC) ?? '[]'); } catch { return []; } }
function save(d: Facture[])            { try { localStorage.setItem(LS,     JSON.stringify(d)); } catch {} }
function saveArc(d: SemaineArchivee[]) { try { localStorage.setItem(LS_ARC, JSON.stringify(d)); } catch {} }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function fmt$(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $'; }
function calcMontant(p: PrestationItem[], tarifs: Record<string, TarifCategory>) { return Math.round(p.reduce((s, x) => s + (tarifs[x.id]?.prix ?? 0) * x.qty, 0) * 100) / 100; }

function getMondayOf(date: Date): Date {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0); return d;
}
function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR'); const p = s.split('/');
  p[2] = String(Number(p[2]) - 136); return p.join('/');
}
function parseDate(s: string): Date | null {
  const p = s.split('/'); if (p.length !== 3) return null;
  const [d,m,y] = p.map(Number); if (!d||!m||!y) return null;
  const realY = y < 1900 ? y + 136 : y;
  return new Date(realY, m-1, d);
}
function weekLabel(mon: Date): string {
  const sun = new Date(mon); sun.setDate(mon.getDate()+6);
  const f = (dt: Date, full=false) => {
    const s = dt.toLocaleDateString('fr-FR', full ? {day:'2-digit',month:'2-digit',year:'numeric'} : {day:'2-digit',month:'2-digit'});
    return full ? s.replace(String(dt.getFullYear()), String(dt.getFullYear() - 136)) : s;
  };
  return `Semaine du ${f(mon)} au ${f(sun,true)}`;
}
function mondayISO(m: Date) { return m.toISOString(); }
function sortKeys(keys: string[]) { return keys.sort((a,b) => new Date(b).getTime()-new Date(a).getTime()); }

function groupByWeek(factures: Facture[]) {
  const byWeek: Record<string, { label: string; monday: Date; factures: Facture[] }> = {};
  factures.forEach(f => {
    const d = parseDate(f.dateSeance); if (!d) return;
    const mon = getMondayOf(d); const key = mondayISO(mon);
    if (!byWeek[key]) byWeek[key] = { label: weekLabel(mon), monday: mon, factures: [] };
    byWeek[key].factures.push(f);
  });
  return byWeek;
}

const STATUT_COL: Record<StatutPaiement, string>  = { 'PAYÉ': '#4A6048', 'EN ATTENTE': '#C8A850', 'ANNULÉ': '#8B4040' };
const STATUT_ICON: Record<StatutPaiement, string> = { 'PAYÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕' };
const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.25)', border: `1px solid rgba(139,90,43,0.30)`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const EMPTY_FORM = { medecin: '', patientNom: '', dateSeance: '', prestations: [{ id: 'Consultation', qty: 1 }] as PrestationItem[], payeur: 'Civil' as Payeur, statut: 'EN ATTENTE' as StatutPaiement, notes: '' };

export default function CaisseComptabilitePage() {
  const router = useRouter();
  const [items,          setItems]          = useState<Facture[]>([]);
  const [archives,       setArchives]       = useState<SemaineArchivee[]>([]);
  const [hydrated,       setHydrated]       = useState(false);
  const [form,           setForm]           = useState({ ...EMPTY_FORM });
  const [defaultMedecin, setDefaultMedecin] = useState('');
  const [medecins,       setMedecins]       = useState<string[]>([]);
  const [editing,        setEditing]        = useState<Facture | null>(null);
  const [delConfirm,     setDelConfirm]     = useState<string | null>(null);
  const [tarifs,         setTarifs]         = useState<Record<string, TarifCategory>>(() => categoriesToMap(DEFAULT_CATEGORIES));
  const autoArchiveDone  = useRef(false);

  const todayMonday = getMondayOf(new Date());
  const currentKey  = mondayISO(todayMonday);
  const montantAuto = calcMontant(form.prestations, tarifs);
  const categoriesSorted = Object.values(tarifs).sort((a,b) => a.ordre - b.ordre);
  const categoriesVente  = categoriesSorted.filter(c => c.type === 'vente');
  const categoriesAchat  = categoriesSorted.filter(c => c.type === 'achat');

  /* ── Hydratation ── */
  useEffect(() => {
    setForm(f => ({ ...f, dateSeance: rpDate() }));
    setItems(load()); setArchives(loadArc()); setHydrated(true);
  }, []);

  /* ── Auto-remplissage du médecin connecté ── */
  useEffect(() => {
    fetch('/api/user/rp-profile?universe=redm')
      .then(r => r.json())
      .then(d => {
        const full = [d.prenom_rp, d.nom_rp].filter(Boolean).join(' ');
        if (full) { setDefaultMedecin(full); setForm(f => ({ ...f, medecin: full })); }
      }).catch(() => {});
  }, []);

  /* ── Chargement des catégories définies par la Direction ── */
  useEffect(() => {
    fetch('/api/redm/tarifs')
      .then(r => r.json())
      .then(d => { if (d.categories) setTarifs(categoriesToMap(d.categories)); })
      .catch(() => {});
  }, []);

  /* ── Chargement de la liste des médecins/soignants ── */
  useEffect(() => {
    fetch('/api/redm/medecins')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.medecins)) setMedecins(d.medecins); })
      .catch(() => {});
  }, []);

  /* ── Auto-archivage des semaines passées au chargement ── */
  useEffect(() => {
    if (!hydrated || autoArchiveDone.current) return;
    autoArchiveDone.current = true;

    // items et archives sont ceux chargés depuis localStorage dans le même render
    const byWeek = groupByWeek(items);
    const past   = sortKeys(Object.keys(byWeek)).filter(k => k !== mondayISO(getMondayOf(new Date())));
    if (past.length === 0) return;

    const newArc: SemaineArchivee[] = [];
    const toRemove: string[] = [];
    past.forEach(key => {
      const g = byWeek[key];
      newArc.push({
        id: uid(), weekLabel: g.label, weekStart: key, factures: g.factures,
        archivedAt: new Date().toISOString(),
        totalPercu:   g.factures.filter(f=>f.statut==='PAYÉ').reduce((s,f)=>s+f.montant, 0),
        totalAttente: g.factures.filter(f=>f.statut==='EN ATTENTE').reduce((s,f)=>s+f.montant, 0),
      });
      g.factures.forEach(f => toRemove.push(f.id));
    });

    const existingKeys = new Set(archives.map(a => a.weekStart));
    const toAdd = newArc.filter(a => !existingKeys.has(a.weekStart));
    if (toAdd.length === 0) return;

    setArchives(prev => [...toAdd, ...prev]);
    setItems(prev => prev.filter(f => !toRemove.includes(f.id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => { if (hydrated) save(items); },      [items, hydrated]);
  useEffect(() => { if (hydrated) saveArc(archives); }, [archives, hydrated]);

  function setPrestation(idx: number, val: string) {
    setForm(f => { const p=[...f.prestations]; p[idx]={...p[idx], id:val}; return {...f,prestations:p}; });
  }
  function setPrestationQty(idx: number, qty: number) {
    const clamped = Math.max(1, Math.min(99, Math.round(qty) || 1));
    setForm(f => { const p=[...f.prestations]; p[idx]={...p[idx], qty:clamped}; return {...f,prestations:p}; });
  }
  function addPrestation() {
    if (form.prestations.length >= 10) return;
    const first = categoriesSorted[0]?.id ?? 'Consultation';
    setForm(f => ({ ...f, prestations: [...f.prestations, { id: first, qty: 1 }] }));
  }
  function removePrestation(idx: number) {
    setForm(f => ({ ...f, prestations: f.prestations.filter((_,i) => i!==idx) }));
  }

  function startEdit(f: Facture) {
    setEditing(f);
    setForm({ medecin:f.medecin??defaultMedecin, patientNom:f.patientNom, dateSeance:f.dateSeance, prestations:normPrestations(f.prestations), payeur:f.payeur??'Civil', statut:f.statut, notes:f.notes });
  }
  function resetForm() { setForm({ ...EMPTY_FORM, medecin:defaultMedecin, dateSeance:rpDate() }); }
  function cancelEdit() { setEditing(null); resetForm(); }

  function submit() {
    const fac: Omit<Facture,'id'|'createdAt'> = { medecin:form.medecin, patientNom:form.patientNom, dateSeance:form.dateSeance, prestations:form.prestations, montant:montantAuto, payeur:form.payeur, statut:form.statut, notes:form.notes };
    if (editing) { setItems(p=>p.map(h=>h.id===editing.id?{...editing,...fac}:h)); setEditing(null); }
    else         { setItems(p=>[{id:uid(),createdAt:new Date().toISOString(),...fac},...p]); }
    resetForm();
  }

  function cycleStatut(id: string) {
    const order: StatutPaiement[] = ['EN ATTENTE','PAYÉ','ANNULÉ'];
    setItems(p=>p.map(h=>h.id!==id?h:{...h,statut:order[(order.indexOf(h.statut)+1)%order.length]}));
  }

  /* ── Groupements semaine courante ── */
  const allByWeek  = groupByWeek(items);

  /* ── Ligne de facture ── */
  function FactureLine({ f, isCurrent }: { f: Facture; isCurrent: boolean }) {
    const col  = STATUT_COL[f.statut];
    const pres = normPrestations(f.prestations);
    return (
      <div style={{ background: isCurrent ? '#221810' : T.card, border: `1px solid ${isCurrent ? 'rgba(200,168,80,0.22)' : T.border}`, borderLeft: `3px solid ${col}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px' }}>
          <div style={{ textAlign:'center', minWidth:46, flexShrink:0 }}>
            <div style={{ fontFamily:DISPLAY, fontSize: 17, color:T.gold }}>{f.dateSeance.slice(0,5)}</div>
            <div style={{ fontFamily:MONO, fontSize: 12, color:T.dim }}>{f.dateSeance.slice(6)}</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:DISPLAY, fontSize: 18, color:T.text, marginBottom:4 }}>{f.patientNom}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {pres.map((p,i) => {
                const cat = tarifs[p.id];
                const isAchat = cat?.type === 'achat';
                return (
                  <span key={i} style={{ fontFamily:MONO, fontSize: 13, color: isAchat ? '#C8845A' : T.gold, background: isAchat ? 'rgba(200,132,90,0.10)' : 'rgba(200,168,80,0.10)', padding:'1px 7px' }}>
                    {isAchat ? '🛒 ' : ''}{cat?.nom ?? p.id}{p.qty > 1 ? ` ×${p.qty}` : ''} <span style={{color:T.muted}}>{fmt$((cat?.prix ?? 0) * p.qty)}</span>
                  </span>
                );
              })}
              {f.medecin && <span style={{ fontFamily:MONO, fontSize: 13, color:'#9B6AC8', background:'rgba(155,106,200,0.10)', padding:'1px 7px' }}>👤 {f.medecin}</span>}
              {f.notes && <span style={{ fontFamily:BODY, fontSize: 14, color:T.muted, fontStyle:'italic' }}>{f.notes}</span>}
            </div>
          </div>
          <div style={{ fontFamily:DISPLAY, fontSize: 20, color:col, flexShrink:0, minWidth:70, textAlign:'right' }}>{fmt$(f.montant)}</div>
          <div style={{ display:'flex', gap:5, flexShrink:0 }}>
            <button onClick={()=>cycleStatut(f.id)} style={{ fontFamily:MONO, fontSize: 12, padding:'4px 8px', cursor:'pointer', background:col+'18', color:col, border:`1px solid ${col}50`, display:'flex', alignItems:'center', gap:3 }}>
              {STATUT_ICON[f.statut]} {f.statut}
            </button>
            <button onClick={()=>startEdit(f)} style={{ fontFamily:MONO, fontSize: 14, padding:'4px 7px', cursor:'pointer', background:'rgba(200,168,80,0.10)', color:T.gold, border:`1px solid rgba(200,168,80,0.3)` }}>✎</button>
            {delConfirm===f.id
              ? <><button onClick={()=>{setItems(p=>p.filter(x=>x.id!==f.id));setDelConfirm(null);}} style={{ fontFamily:MONO, fontSize: 13, padding:'4px 7px', cursor:'pointer', background:'#8B404025', color:'#C06060', border:'1px solid #8B404060' }}>OK?</button>
                  <button onClick={()=>setDelConfirm(null)} style={{ fontFamily:MONO, fontSize: 13, padding:'4px 5px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>✕</button></>
              : <button onClick={()=>setDelConfirm(f.id)} style={{ fontFamily:MONO, fontSize: 14, padding:'4px 7px', cursor:'pointer', background:'transparent', color:'#8B6060', border:'1px solid rgba(139,64,64,0.3)' }}>✕</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <button onClick={()=>router.push('/redm')} style={{ fontFamily:MONO, fontSize: 15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily:MONO, fontSize: 14, color:T.gold, letterSpacing:'0.16em' }}>DISPENSAIRE · CAISSE ET COMPTABILITÉ</span>
        </div>
        <h1 style={{ fontFamily:DISPLAY, fontSize: 35, color:T.gold, margin:0 }}>💰 Caisse et Comptabilité</h1>
        <p style={{ fontFamily:MONO, fontSize: 13, color:T.dim, letterSpacing:'0.1em', marginTop:8 }}>
          REGISTRE DES HONORAIRES, FACTURES ET RECETTES DU DISPENSAIRE
        </p>
      </div>

      {/* Grille : formulaire gauche + contenu droite */}
      {(
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, alignItems:'start' }}>

          {/* ── Formulaire sticky ── */}
          <div style={{ background:T.card, border:`2px solid ${editing ? T.gold : T.border}`, padding:'18px 18px 16px', position:'sticky', top:20 }}>
            <div style={{ fontFamily:DISPLAY, fontSize: 18, color:T.gold, marginBottom:14 }}>
              {editing ? '✎ Modifier' : '✚ Nouvelle note de frais'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div><label style={lbl}>MÉDECIN / SOIGNANT</label>
                <select style={{...inp,cursor:'pointer'}} value={form.medecin} onChange={e=>setForm(f=>({...f,medecin:e.target.value}))}>
                  <option value="">— Sélectionner —</option>
                  {medecins.map(m => <option key={m} value={m}>{m}</option>)}
                  {form.medecin && !medecins.includes(form.medecin) && <option value={form.medecin}>{form.medecin}</option>}
                </select>
              </div>
              <div><label style={lbl}>NOM DU PATIENT</label><input style={inp} value={form.patientNom} onChange={e=>setForm(f=>({...f,patientNom:e.target.value}))} placeholder="Nom complet" /></div>
              <div><label style={lbl}>DATE</label><div style={{...inp, display:'flex', alignItems:'center', justifyContent:'space-between', color:T.muted, cursor:'default'}}><span>{form.dateSeance}</span><span style={{ fontFamily:MONO, fontSize:11, color:T.dim, letterSpacing:'0.1em' }}>AUTO</span></div></div>

              <div>
                <label style={lbl}>ÉLÉMENT(S)</label>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {form.prestations.map((p,idx) => (
                    <div key={idx} style={{ display:'flex', gap:5 }}>
                      <select style={{...inp,flex:1,cursor:'pointer'}} value={p.id} onChange={e=>setPrestation(idx,e.target.value)}>
                        <optgroup label="Prestations">
                          {categoriesVente.map(c=><option key={c.id} value={c.id}>{c.nom} — {fmt$(c.prix)}</option>)}
                        </optgroup>
                        {categoriesAchat.length > 0 && (
                          <optgroup label="Achats">
                            {categoriesAchat.map(c=><option key={c.id} value={c.id}>{c.nom} — {fmt$(c.prix)}</option>)}
                          </optgroup>
                        )}
                      </select>
                      <input type="number" min={1} max={99} value={p.qty} onChange={e=>setPrestationQty(idx,Number(e.target.value))}
                        style={{...inp, width:56, flexShrink:0, textAlign:'center', padding:'9px 6px'}} title="Quantité" />
                      {form.prestations.length > 1 && <button onClick={()=>removePrestation(idx)} style={{ fontFamily:MONO, fontSize: 15, padding:'6px 9px', cursor:'pointer', background:'transparent', color:'#8B6060', border:`1px solid rgba(139,64,64,0.3)` }}>✕</button>}
                    </div>
                  ))}
                  {form.prestations.length < 10 && <button onClick={addPrestation} style={{ fontFamily:MONO, fontSize: 13, padding:'5px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px dashed ${T.border}` }}>+ AJOUTER UN ÉLÉMENT</button>}
                </div>
              </div>

              <div style={{ background:'rgba(0,0,0,0.22)', border:`1px solid ${T.border}`, padding:'9px 13px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:MONO, fontSize: 13, color:T.dim, letterSpacing:'0.1em' }}>MONTANT TOTAL</span>
                <span style={{ fontFamily:DISPLAY, fontSize: 24, color:T.gold }}>{fmt$(montantAuto)}</span>
              </div>

              <div>
                <label style={lbl}>PRIS EN CHARGE PAR</label>
                <select style={{...inp,cursor:'pointer'}} value={form.payeur} onChange={e=>setForm(f=>({...f,payeur:e.target.value as Payeur}))}>
                  {PAYEURS.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div><label style={lbl}>STATUT</label>
                <select style={{...inp,cursor:'pointer'}} value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value as StatutPaiement}))}>
                  <option>EN ATTENTE</option><option>PAYÉ</option><option>ANNULÉ</option>
                </select>
              </div>
              <div><label style={lbl}>NOTES</label><textarea style={{...inp,resize:'vertical',minHeight:48,lineHeight:1.6}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Remarques…" /></div>

              <button onClick={submit}
                style={{ fontFamily:MONO, fontSize: 15, letterSpacing:'0.12em', padding:'11px', cursor:'pointer', background:'rgba(120,96,48,0.35)', color:T.gold, border:'2px solid rgba(120,96,48,0.6)' }}>
                {editing ? '✔ ENREGISTRER' : '✔ CRÉER LA NOTE DE FRAIS'}
              </button>
              {editing && <button onClick={cancelEdit} style={{ fontFamily:MONO, fontSize: 13, padding:'7px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>ANNULER</button>}
            </div>
          </div>

          {/* ── Registre des factures ── */}
          <div>
            {hydrated && (
              <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
                {/* Semaine courante */}
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, paddingBottom:8, borderBottom:`2px solid rgba(200,168,80,0.40)` }}>
                    <div>
                      <span style={{ fontFamily:MONO, fontSize: 15, color:T.gold, letterSpacing:'0.14em' }}>📅 {weekLabel(todayMonday)}</span>
                      <span style={{ fontFamily:MONO, fontSize: 13, color:T.dim, marginLeft:10 }}>SEMAINE EN COURS</span>
                    </div>
                    {allByWeek[currentKey] && <span style={{ fontFamily:MONO, fontSize: 13, color:'#4A6048' }}>{allByWeek[currentKey].factures.length} acte(s) · {fmt$(allByWeek[currentKey].factures.filter(f=>f.statut==='PAYÉ').reduce((s,f)=>s+f.montant,0))} perçu</span>}
                  </div>
                  {allByWeek[currentKey]
                    ? <div style={{display:'flex',flexDirection:'column',gap:7}}>{allByWeek[currentKey].factures.map(f=><FactureLine key={f.id} f={f} isCurrent={true}/>)}</div>
                    : <div style={{ fontFamily:MONO, fontSize: 14, color:T.dim, padding:'20px', textAlign:'center', border:`1px dashed ${T.border}` }}>Aucune note de frais cette semaine</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
