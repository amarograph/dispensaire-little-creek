'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type StatutPaiement = 'PAYÉ' | 'EN ATTENTE' | 'ANNULÉ';
type TypeCategorie  = 'vente' | 'achat';
type Payeur         = 'Civil' | 'Shérif' | 'Mairie West Elizabeth';

interface TarifCategory { id: string; nom: string; type: TypeCategorie; prix: number; pctDispensaire: number; pctMedecin: number; ordre: number; }
function categoriesToMap(categories: TarifCategory[]): Record<string, TarifCategory> {
  const m: Record<string, TarifCategory> = {};
  categories.forEach(c => { m[c.id] = c; });
  return m;
}
const STATUT_COL:  Record<StatutPaiement, string> = { 'PAYÉ': '#A8B991', 'EN ATTENTE': '#D1B77C', 'ANNULÉ': '#8B4040' };
const STATUT_ICON: Record<StatutPaiement, string> = { 'PAYÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕' };

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

const LS_ARC = 'redm_cabinet_compta_archives_v1';
function loadArc(): SemaineArchivee[] { try { return JSON.parse(localStorage.getItem(LS_ARC) ?? '[]'); } catch { return []; } }
function fmt$(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $'; }

const PAYEUR_COL: Partial<Record<Payeur, string>> = {
  'Civil':              '#C8BEA5',
  'Shérif':             '#6B7ABB',
  'Mairie West Elizabeth':     '#786030',
};

export default function ArchivesCaisseComptabilitePage() {
  const router = useRouter();
  const [archives,  setArchives]  = useState<SemaineArchivee[]>([]);
  const [hydrated,  setHydrated]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [openId,    setOpenId]    = useState<string | null>(null);
  const [openView,  setOpenView]  = useState<'tous' | Payeur>('tous');
  const [tarifs,    setTarifs]    = useState<Record<string, TarifCategory>>({});

  useEffect(() => { setArchives(loadArc()); setHydrated(true); }, []);

  useEffect(() => {
    fetch('/api/redm/tarifs')
      .then(r => r.json())
      .then(d => { if (d.categories) setTarifs(categoriesToMap(d.categories)); })
      .catch(() => {});
  }, []);

  /* Filtrage */
  const filtered = archives.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.weekLabel.toLowerCase().includes(q) ||
      a.factures.some(f =>
        f.patientNom.toLowerCase().includes(q) ||
        f.payeur.toLowerCase().includes(q) ||
        (f.medecin ?? '').toLowerCase().includes(q)
      )
    );
  });

  /* Stats globales */
  const totalPercu   = archives.reduce((s,a) => s + a.totalPercu, 0);
  const totalAttente = archives.reduce((s,a) => s + a.totalAttente, 0);
  const totalActes   = archives.reduce((s,a) => s + a.factures.length, 0);

  /* Stats par payeur */
  const statsByPayeur: Record<string, { percu: number; attente: number; actes: number }> = {};
  archives.forEach(a => a.factures.forEach(f => {
    if (!statsByPayeur[f.payeur]) statsByPayeur[f.payeur] = { percu: 0, attente: 0, actes: 0 };
    statsByPayeur[f.payeur].actes++;
    if (f.statut === 'PAYÉ')       statsByPayeur[f.payeur].percu   += f.montant;
    if (f.statut === 'EN ATTENTE') statsByPayeur[f.payeur].attente += f.montant;
  }));

  const openArc = hydrated && openId ? archives.find(a => a.id === openId) : null;

  /* Si une semaine est ouverte en vue détail */
  if (openArc) {
    const factures = openView === 'tous'
      ? openArc.factures
      : openArc.factures.filter(f => f.payeur === openView);

    const payeurs = Array.from(new Set(openArc.factures.map(f => f.payeur)));
    const wTotal  = openArc.factures.reduce((s,f) => s + f.montant, 0);
    const wPercu  = openArc.totalPercu;
    const wAtt    = openArc.totalAttente;

    /* Stats par payeur pour cette semaine */
    const wByPayeur: Record<string, { percu: number; attente: number; actes: number; montantTotal: number }> = {};
    openArc.factures.forEach(f => {
      if (!wByPayeur[f.payeur]) wByPayeur[f.payeur] = { percu:0, attente:0, actes:0, montantTotal:0 };
      wByPayeur[f.payeur].actes++;
      wByPayeur[f.payeur].montantTotal += f.montant;
      if (f.statut==='PAYÉ')       wByPayeur[f.payeur].percu   += f.montant;
      if (f.statut==='EN ATTENTE') wByPayeur[f.payeur].attente += f.montant;
    });

    return (
      <div style={{ fontFamily: BODY }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

        {/* En-tête */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <button onClick={()=>setOpenId(null)} style={{ fontFamily:MONO, fontSize:15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR AUX ARCHIVES</button>
            <button onClick={()=>router.push('/redm/comptabilite')} style={{ fontFamily:MONO, fontSize:14, background:'transparent', border:'none', color:T.dim, padding:'8px 12px', cursor:'pointer', letterSpacing:'0.08em' }}>COMPTABILITÉ</button>
          </div>
          <div style={{ fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.14em', marginBottom:6 }}>ARCHIVES · DÉTAIL SEMAINE</div>
          <h1 style={{ fontFamily:DISPLAY, fontSize:30, color:T.gold, margin:0 }}>📅 {openArc.weekLabel}</h1>
        </div>

        {/* Stats semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {[
            { l:'TOTAL ACTES',  v: String(openArc.factures.length), c: T.gold       },
            { l:'TOTAL BRUT',   v: fmt$(wTotal),                    c: T.gold       },
            { l:'TOTAL PERÇU',  v: fmt$(wPercu),                    c: '#A8B991'    },
            { l:'EN ATTENTE',   v: fmt$(wAtt),                      c: '#D1B77C'    },
          ].map(s => (
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:DISPLAY, fontSize:24, color:s.c }}>{s.v}</div>
              <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Récap par institution */}
        {Object.keys(wByPayeur).length > 1 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {Object.entries(wByPayeur).sort((a,b) => b[1].montantTotal - a[1].montantTotal).map(([p, s]) => {
              const col = PAYEUR_COL[p as Payeur] ?? T.muted;
              return (
                <div key={p} style={{ background:`${col}15`, border:`1px solid ${col}50`, padding:'10px 16px', display:'flex', flexDirection:'column', gap:3 }}>
                  <div style={{ fontFamily:MONO, fontSize:13, color:col, letterSpacing:'0.1em' }}>{p}</div>
                  <div style={{ fontFamily:DISPLAY, fontSize:20, color:col }}>{fmt$(s.montantTotal)}</div>
                  <div style={{ fontFamily:MONO, fontSize:11, color:T.dim }}>
                    {s.actes} acte(s)
                    {s.percu > 0 && <span style={{color:'#A8B991', marginLeft:6}}>· {fmt$(s.percu)} perçu</span>}
                    {s.attente > 0 && <span style={{color:'#D1B77C', marginLeft:6}}>· {fmt$(s.attente)} en attente</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filtre par payeur */}
        {payeurs.length > 1 && (
          <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
            {(['tous', ...payeurs] as const).map(p => {
              const on  = openView === p;
              const col = p === 'tous' ? T.gold : (PAYEUR_COL[p as Payeur] ?? T.muted);
              const cnt = p === 'tous' ? openArc.factures.length : openArc.factures.filter(f=>f.payeur===p).length;
              return (
                <button key={p} onClick={() => setOpenView(p as typeof openView)}
                  style={{ fontFamily:MONO, fontSize:13, letterSpacing:'0.1em', padding:'9px 18px', cursor:'pointer', background: on ? `${col}18` : 'transparent', color: on ? col : T.dim, border:'none', borderBottom:`3px solid ${on ? col : 'transparent'}`, whiteSpace:'nowrap', flexShrink:0 }}>
                  {p === 'tous' ? 'TOUS' : p.toUpperCase()}
                  <span style={{ marginLeft:6, fontFamily:MONO, fontSize:11, color:col, background:`${col}22`, padding:'1px 5px' }}>{cnt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Liste des factures */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {factures.length === 0 ? (
            <div style={{ fontFamily:MONO, fontSize:14, color:T.dim, padding:'30px', textAlign:'center', border:`1px dashed ${T.border}` }}>Aucune facture pour ce filtre</div>
          ) : factures.map(f => {
            const col  = STATUT_COL[f.statut];
            const pres = normPrestations(f.prestations);
            const pcol = PAYEUR_COL[f.payeur] ?? T.muted;
            return (
              <div key={f.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`4px solid ${col}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px' }}>
                  {/* Date */}
                  <div style={{ textAlign:'center', minWidth:52, flexShrink:0 }}>
                    <div style={{ fontFamily:DISPLAY, fontSize:19, color:T.gold }}>{f.dateSeance.slice(0,5)}</div>
                    <div style={{ fontFamily:MONO, fontSize:12, color:T.dim }}>{f.dateSeance.slice(6)}</div>
                  </div>

                  {/* Patient + prestations */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:DISPLAY, fontSize:20, color:T.text, marginBottom:6 }}>{f.patientNom}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {pres.map((p,i) => {
                        const cat = tarifs[p.id];
                        const isAchat = cat?.type === 'achat';
                        return (
                          <span key={i} style={{ fontFamily:MONO, fontSize:13, color: isAchat ? '#C8845A' : T.gold, background: isAchat ? 'rgba(200,132,90,0.10)' : 'rgba(209,183,124,0.10)', padding:'2px 8px', border: `1px solid ${isAchat ? 'rgba(200,132,90,0.25)' : 'rgba(209,183,124,0.20)'}` }}>
                            {isAchat ? '🛒 ' : ''}{cat?.nom ?? p.id}{p.qty > 1 ? ` ×${p.qty}` : ''} <span style={{color:T.muted}}>{fmt$((cat?.prix ?? 0) * p.qty)}</span>
                          </span>
                        );
                      })}
                      <span style={{ fontFamily:MONO, fontSize:12, color:pcol, background:`${pcol}18`, padding:'2px 7px', border:`1px solid ${pcol}40` }}>{f.payeur}</span>
                      {f.medecin && <span style={{ fontFamily:MONO, fontSize:12, color:'#BAAAC6', background:'rgba(155,106,200,0.10)', padding:'2px 8px', border:'1px solid rgba(155,106,200,0.20)' }}>👤 {f.medecin}</span>}
                      {f.notes && <span style={{ fontFamily:BODY, fontSize:14, color:T.muted, fontStyle:'italic' }}>{f.notes}</span>}
                    </div>
                  </div>

                  {/* Montant */}
                  <div style={{ fontFamily:DISPLAY, fontSize:26, color:col, flexShrink:0, minWidth:80, textAlign:'right' }}>
                    {fmt$(f.montant)}
                  </div>

                  {/* Statut */}
                  <div style={{ fontFamily:MONO, fontSize:13, color:col, background:`${col}15`, padding:'6px 12px', border:`1px solid ${col}50`, flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
                    {STATUT_ICON[f.statut]} {f.statut}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total filtré */}
        <div style={{ marginTop:16, padding:'14px 20px', background:`rgba(209,183,124,0.06)`, border:`1px solid rgba(209,183,124,0.25)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.1em' }}>
            {openView === 'tous' ? 'TOTAL SEMAINE' : `TOTAL ${openView.toUpperCase()}`} · {factures.length} acte(s)
          </span>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <span style={{ fontFamily:MONO, fontSize:13, color:'#A8B991' }}>
              {fmt$(factures.filter(f=>f.statut==='PAYÉ').reduce((s,f)=>s+f.montant,0))} perçu
            </span>
            {factures.some(f=>f.statut==='EN ATTENTE') && (
              <span style={{ fontFamily:MONO, fontSize:13, color:'#D1B77C' }}>
                {fmt$(factures.filter(f=>f.statut==='EN ATTENTE').reduce((s,f)=>s+f.montant,0))} en attente
              </span>
            )}
            <span style={{ fontFamily:DISPLAY, fontSize:28, color:T.gold }}>
              {fmt$(factures.reduce((s,f)=>s+f.montant,0))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Vue liste des archives ── */
  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button onClick={()=>router.push('/redm/comptabilite')} style={{ fontFamily:MONO, fontSize:15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily:MONO, fontSize:13, color:T.gold, letterSpacing:'0.16em' }}>COMPTABILITÉ · ARCHIVES</span>
        </div>
        <h1 style={{ fontFamily:DISPLAY, fontSize:35, color:T.gold, margin:0 }}>📦 Archives des comptes</h1>
      </div>

      {/* Stats globales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { l:'SEMAINES ARCHIVÉES', v: String(archives.length),   c: T.gold    },
          { l:'TOTAL ACTES',        v: String(totalActes),         c: T.muted   },
          { l:'TOTAL PERÇU',        v: fmt$(totalPercu),           c: '#A8B991' },
          { l:'EN ATTENTE',         v: fmt$(totalAttente),         c: '#D1B77C' },
        ].map(s => (
          <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontFamily:DISPLAY, fontSize:24, color:s.c }}>{s.v}</div>
            <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Stats par payeur */}
      {Object.keys(statsByPayeur).length > 0 && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {Object.entries(statsByPayeur).sort((a,b) => (b[1].percu+b[1].attente) - (a[1].percu+a[1].attente)).map(([p, s]) => {
            const col = PAYEUR_COL[p as Payeur] ?? T.muted;
            return (
              <div key={p} style={{ background:`${col}12`, border:`1px solid ${col}45`, padding:'10px 16px' }}>
                <div style={{ fontFamily:MONO, fontSize:12, color:col, letterSpacing:'0.12em', marginBottom:4 }}>{p.toUpperCase()}</div>
                <div style={{ fontFamily:DISPLAY, fontSize:22, color:col }}>{fmt$(s.percu + s.attente)}</div>
                <div style={{ fontFamily:MONO, fontSize:11, color:T.dim, marginTop:2 }}>
                  {s.actes} acte(s)
                  {s.percu > 0 && <span style={{color:'#A8B991', marginLeft:5}}>· {fmt$(s.percu)} perçu</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ marginBottom:20 }}>
        <input
          style={{ fontFamily:MONO, fontSize:15, background:'rgba(0,0,0,0.25)', border:`1px solid ${T.border}`, color:T.text, padding:'11px 18px', outline:'none', width:'100%', boxSizing:'border-box' }}
          placeholder="🔍  Rechercher une semaine, un patient, un payeur, un médecin…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste des semaines archivées */}
      {filtered.length === 0 ? (
        <div style={{ fontFamily:MONO, fontSize:14, color:T.dim, padding:'60px', textAlign:'center', border:`1px dashed ${T.border}` }}>
          {archives.length === 0
            ? 'Aucune semaine archivée — les semaines passées s\'archiveront automatiquement à chaque ouverture'
            : 'Aucun résultat pour cette recherche'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(arc => {
            const allDone    = arc.factures.every(f => f.statut === 'PAYÉ' || f.statut === 'ANNULÉ');
            const payeurSet  = Array.from(new Set(arc.factures.map(f => f.payeur)));
            return (
              <div key={arc.id} style={{ background:T.card, border:`1px solid rgba(74,96,72,0.40)`, borderLeft:`5px solid ${allDone ? '#A8B991' : '#D1B77C'}`, overflow:'hidden', cursor:'pointer', transition:'background 0.15s' }}
                onClick={() => { setOpenId(arc.id); setOpenView('tous'); }}
                onMouseEnter={e=>(e.currentTarget.style.background='#254B5C')}
                onMouseLeave={e=>(e.currentTarget.style.background=T.card)}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px' }}>
                  {/* Gauche : label + statut + payeurs */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:DISPLAY, fontSize:19, color: allDone ? '#6A9A68' : T.gold }}>
                        {allDone ? '✔' : '📅'} {arc.weekLabel}
                      </span>
                      {allDone && <span style={{ fontFamily:MONO, fontSize:11, color:'#A8B991', background:'rgba(74,96,72,0.20)', padding:'2px 8px', border:'1px solid rgba(74,96,72,0.40)' }}>SOLDÉ</span>}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontFamily:MONO, fontSize:13, color:T.dim }}>{arc.factures.length} acte(s)</span>
                      {payeurSet.map(p => {
                        const col = PAYEUR_COL[p as Payeur] ?? T.muted;
                        const cnt = arc.factures.filter(f=>f.payeur===p).length;
                        return <span key={p} style={{ fontFamily:MONO, fontSize:12, color:col, background:`${col}18`, padding:'1px 7px', border:`1px solid ${col}35` }}>{p} ×{cnt}</span>;
                      })}
                    </div>
                  </div>

                  {/* Droite : montants */}
                  <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                    <div style={{ fontFamily:DISPLAY, fontSize:26, color: allDone ? '#6A9A68' : T.gold }}>
                      {fmt$(arc.totalPercu + arc.totalAttente)}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, display:'flex', gap:10 }}>
                      {arc.totalPercu > 0 && <span style={{color:'#A8B991'}}>✔ {fmt$(arc.totalPercu)}</span>}
                      {arc.totalAttente > 0 && <span style={{color:'#D1B77C'}}>⏳ {fmt$(arc.totalAttente)}</span>}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:12, color:'rgba(209,183,124,0.5)', marginTop:2 }}>
                      VOIR LE DÉTAIL →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop:24, fontFamily:MONO, fontSize:12, color:T.dim, textAlign:'center', padding:'12px', borderTop:`1px solid ${T.border}` }}>
        ↻ Les semaines passées s'archivent automatiquement à chaque ouverture de la page Caisse et Comptabilité
      </div>
    </div>
  );
}
