'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';


const DISPLAY = "'Burnic', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#EDE0C2', card: '#F7EEDB', border: 'rgba(139,90,43,0.30)', gold: '#80682D', text: '#183746', muted: '#6A6D50', dim: '#646850' };

type StatutPaiement = 'PAYÉ' | 'EN ATTENTE' | 'ANNULÉ';
type TypeCategorie  = 'vente' | 'achat';
type Payeur         = 'Civil' | 'Shérif' | 'Mairie West Elizabeth';

const STATUT_COL:  Record<StatutPaiement, string> = { 'PAYÉ': '#49654D', 'EN ATTENTE': '#80682D', 'ANNULÉ': '#8B4040' };
const STATUT_ICON: Record<StatutPaiement, string> = { 'PAYÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕' };

interface TarifCategory { id: string; nom: string; type: TypeCategorie; prix: number; pctDispensaire: number; pctMedecin: number; ordre: number; }
function categoriesToMap(categories: TarifCategory[]): Record<string, TarifCategory> {
  const m: Record<string, TarifCategory> = {};
  categories.forEach(c => { m[c.id] = c; });
  return m;
}

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
function saveArc(d: SemaineArchivee[]) { try { localStorage.setItem(LS_ARC, JSON.stringify(d)); } catch {} }
function fmt$(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $'; }

interface Salaire { medecin: string; actes: number; ca: number; salaire: number; }
function salairesByMedecin(factures: Facture[], tarifs: Record<string, TarifCategory>): Salaire[] {
  const map: Record<string, Salaire> = {};
  factures.forEach(f => {
    if (f.statut === 'ANNULÉ') return;
    const key = (f.medecin ?? '').trim() || '— Non assigné —';
    if (!map[key]) map[key] = { medecin: key, actes: 0, ca: 0, salaire: 0 };
    const s = map[key];
    s.actes++;
    normPrestations(f.prestations).forEach(p => {
      const t = tarifs[p.id];
      if (!t || t.type !== 'vente') return;
      s.ca      += t.prix * p.qty;
      s.salaire += t.prix * p.qty * t.pctMedecin / 100;
    });
  });
  return Object.values(map).sort((a,b) => b.ca - a.ca);
}

/* ── Ligne de registre (lecture seule) ── */
function RegistreLine({ f, tarifs }: { f: Facture; tarifs: Record<string, TarifCategory> }) {
  const col  = STATUT_COL[f.statut];
  const pres = normPrestations(f.prestations);
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`3px solid ${col}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px' }}>
        <div style={{ textAlign:'center', minWidth:46, flexShrink:0 }}>
          <div style={{ fontFamily:DISPLAY, fontSize: 16, color:T.gold }}>{f.dateSeance.slice(0,5)}</div>
          <div style={{ fontFamily:MONO, fontSize: 11, color:T.dim }}>{f.dateSeance.slice(6)}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontFamily:DISPLAY, fontSize: 17, color:T.text }}>{f.patientNom}</span>
            <span style={{ fontFamily:MONO, fontSize: 12, color:'#79638C', background:'rgba(155,106,200,0.10)', padding:'1px 7px' }}>👤 {f.medecin || '— Non assigné —'}</span>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {pres.map((p,i) => {
              const cat = tarifs[p.id];
              const isAchat = cat?.type === 'achat';
              return (
                <span key={i} style={{ fontFamily:MONO, fontSize: 12, color: isAchat ? '#C8845A' : T.gold, background: isAchat ? 'rgba(200,132,90,0.10)' : 'rgba(128,104,45,0.10)', padding:'1px 7px' }}>
                  {isAchat ? '🛒 ' : ''}{cat?.nom ?? p.id}{p.qty > 1 ? ` ×${p.qty}` : ''}
                </span>
              );
            })}
            <span style={{ fontFamily:MONO, fontSize: 12, color:T.muted, background:'rgba(255,255,255,0.04)', padding:'1px 7px' }}>{f.payeur}</span>
          </div>
        </div>
        <div style={{ fontFamily:DISPLAY, fontSize: 19, color:col, flexShrink:0, minWidth:65, textAlign:'right' }}>{fmt$(f.montant)}</div>
        <div style={{ fontFamily:MONO, fontSize: 12, padding:'4px 8px', background:col+'18', color:col, border:`1px solid ${col}50`, flexShrink:0 }}>
          {STATUT_ICON[f.statut]} {f.statut}
        </div>
      </div>
    </div>
  );
}

export default function DirectionComptabiliteArchivesPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'admin'].includes(r));
  const [archives, setArchives] = useState<SemaineArchivee[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search,   setSearch]   = useState('');
  const [openId,   setOpenId]   = useState<string | null>(null);
  const [tarifs,   setTarifs]   = useState<Record<string, TarifCategory>>({});
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => { setArchives(loadArc()); setHydrated(true); }, []);

  function removeArchive(id: string) {
    setArchives(prev => {
      const next = prev.filter(a => a.id !== id);
      saveArc(next);
      return next;
    });
    setDelConfirm(null);
    if (openId === id) setOpenId(null);
  }

  /* ── Catégories & répartition définies par la Direction ── */
  useEffect(() => {
    fetch('/api/admin/redm-tarifs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.categories) setTarifs(categoriesToMap(d.categories)); })
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
        (f.medecin ?? '').toLowerCase().includes(q)
      )
    );
  });

  /* Stats globales */
  const totalPercu   = archives.reduce((s,a) => s + a.totalPercu, 0);
  const totalAttente = archives.reduce((s,a) => s + a.totalAttente, 0);
  const totalActes   = archives.reduce((s,a) => s + a.factures.length, 0);

  const openArc = hydrated && openId ? archives.find(a => a.id === openId) : null;

  /* ── Vue détail d'une semaine ── */
  if (openArc) {
    const wTotal    = openArc.factures.reduce((s,f) => s + f.montant, 0);
    const salaires  = salairesByMedecin(openArc.factures, tarifs);

    return (
      <div style={{ fontFamily: BODY }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

        {/* En-tête */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <button onClick={()=>setOpenId(null)} style={{ fontFamily:MONO, fontSize:15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR AUX ARCHIVES</button>
            <button onClick={()=>router.push('/redm/direction/comptabilite')} style={{ fontFamily:MONO, fontSize:14, background:'transparent', border:'none', color:T.dim, padding:'8px 12px', cursor:'pointer', letterSpacing:'0.08em' }}>COMPTABILITÉ</button>
            {canEdit && (
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                {delConfirm === openArc.id
                  ? <>
                      <button onClick={()=>removeArchive(openArc.id)} style={{ fontFamily:MONO, fontSize:13, padding:'8px 16px', cursor:'pointer', background:'#8B404025', color:'#963F36', border:'1px solid #8B404060' }}>SUPPRIMER CETTE SEMAINE ?</button>
                      <button onClick={()=>setDelConfirm(null)} style={{ fontFamily:MONO, fontSize:13, padding:'8px 12px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>✕</button>
                    </>
                  : <button onClick={()=>setDelConfirm(openArc.id)} style={{ fontFamily:MONO, fontSize:13, padding:'8px 16px', cursor:'pointer', background:'transparent', color:'#8B6060', border:'1px solid rgba(139,64,64,0.3)' }}>✕ SUPPRIMER</button>}
              </div>
            )}
          </div>
          <div style={{ fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.14em', marginBottom:6 }}>ARCHIVES · DÉTAIL SEMAINE</div>
          <h1 style={{ fontFamily:DISPLAY, fontSize:30, color:T.gold, margin:0 }}>📅 {openArc.weekLabel}</h1>
        </div>

        {/* Stats semaine */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
          {[
            { l:'TOTAL ACTES',  v: String(openArc.factures.length), c: T.gold       },
            { l:'TOTAL BRUT',   v: fmt$(wTotal),                    c: T.gold       },
            { l:'TOTAL PERÇU',  v: fmt$(openArc.totalPercu),        c: '#49654D'    },
            { l:'EN ATTENTE',   v: fmt$(openArc.totalAttente),      c: '#80682D'    },
          ].map(s => (
            <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
              <div style={{ fontFamily:DISPLAY, fontSize:24, color:s.c }}>{s.v}</div>
              <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Salaires de la semaine */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:DISPLAY, fontSize: 22, color:T.text, marginBottom:10 }}>💰 Salaires de la semaine</div>
          {salaires.length === 0 ? (
            <div style={{ fontFamily:MONO, fontSize: 14, color:T.dim, padding:'20px', textAlign:'center', border:`1px dashed ${T.border}` }}>Aucun acte enregistré cette semaine</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {salaires.map(s => (
                <div key={s.medecin} style={{ background:T.card, border:`1px solid rgba(155,106,200,0.35)`, borderLeft:`4px solid #79638C`, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:DISPLAY, fontSize: 19, color:T.text }}>{s.medecin}</div>
                    <div style={{ fontFamily:MONO, fontSize: 12, color:T.dim, marginTop:3 }}>{s.actes} acte{s.actes>1?'s':''}</div>
                  </div>
                  <div style={{ display:'flex', gap:24, alignItems:'center' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:DISPLAY, fontSize: 22, color:T.gold }}>{fmt$(s.ca)}</div>
                      <div style={{ fontFamily:MONO, fontSize: 11, color:T.dim, letterSpacing:'0.1em' }}>CHIFFRE D&apos;AFFAIRES</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:DISPLAY, fontSize: 28, color:'#79638C' }}>{fmt$(s.salaire)}</div>
                      <div style={{ fontFamily:MONO, fontSize: 11, color:T.dim, letterSpacing:'0.1em' }}>SALAIRE (APRÈS %)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registre complet */}
        <div>
          <div style={{ fontFamily:DISPLAY, fontSize: 22, color:T.text, marginBottom:10 }}>📋 Registre de la semaine</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {openArc.factures.map(f => <RegistreLine key={f.id} f={f} tarifs={tarifs} />)}
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
          <button onClick={()=>router.push('/redm/direction/comptabilite')} style={{ fontFamily:MONO, fontSize:15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily:MONO, fontSize:13, color:T.gold, letterSpacing:'0.16em' }}>DIRECTION · COMPTABILITÉ · ARCHIVES</span>
        </div>
        <h1 style={{ fontFamily:DISPLAY, fontSize:35, color:T.gold, margin:0 }}>📦 Registres archivés</h1>
        <p style={{ fontFamily:MONO, fontSize: 13, color:T.dim, letterSpacing:'0.1em', marginTop:8 }}>
          HISTORIQUE DES SEMAINES CLOSES & SALAIRES VERSÉS
        </p>
      </div>

      {/* Stats globales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {[
          { l:'SEMAINES ARCHIVÉES', v: String(archives.length),   c: T.gold    },
          { l:'TOTAL ACTES',        v: String(totalActes),         c: T.muted   },
          { l:'TOTAL PERÇU',        v: fmt$(totalPercu),           c: '#49654D' },
          { l:'EN ATTENTE',         v: fmt$(totalAttente),         c: '#80682D' },
        ].map(s => (
          <div key={s.l} style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontFamily:DISPLAY, fontSize:24, color:s.c }}>{s.v}</div>
            <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom:20 }}>
        <input
          style={{ fontFamily:MONO, fontSize:15, background:'rgba(0,0,0,0.25)', border:`1px solid ${T.border}`, color:T.text, padding:'11px 18px', outline:'none', width:'100%', boxSizing:'border-box' }}
          placeholder="🔍  Rechercher une semaine, un patient, un médecin…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste des semaines archivées */}
      {filtered.length === 0 ? (
        <div style={{ fontFamily:MONO, fontSize:14, color:T.dim, padding:'60px', textAlign:'center', border:`1px dashed ${T.border}` }}>
          {archives.length === 0
            ? 'Aucune semaine archivée — les semaines passées s\'archivent automatiquement à chaque clôture'
            : 'Aucun résultat pour cette recherche'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(arc => {
            const allDone   = arc.factures.every(f => f.statut === 'PAYÉ' || f.statut === 'ANNULÉ');
            const salaires  = salairesByMedecin(arc.factures, tarifs);
            return (
              <div key={arc.id} style={{ background:T.card, border:`1px solid rgba(74,96,72,0.40)`, borderLeft:`5px solid ${allDone ? '#49654D' : '#80682D'}`, overflow:'hidden', cursor:'pointer', transition:'background 0.15s' }}
                onClick={() => setOpenId(arc.id)}
                onMouseEnter={e=>(e.currentTarget.style.background='#26190E')}
                onMouseLeave={e=>(e.currentTarget.style.background=T.card)}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px' }}>
                  {/* Gauche : label + statut + médecins */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontFamily:DISPLAY, fontSize:19, color: allDone ? '#6A9A68' : T.gold }}>
                        {allDone ? '✔' : '📅'} {arc.weekLabel}
                      </span>
                      {allDone && <span style={{ fontFamily:MONO, fontSize:11, color:'#49654D', background:'rgba(74,96,72,0.20)', padding:'2px 8px', border:'1px solid rgba(74,96,72,0.40)' }}>SOLDÉ</span>}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontFamily:MONO, fontSize:13, color:T.dim }}>{arc.factures.length} acte(s)</span>
                      {salaires.map(s => (
                        <span key={s.medecin} style={{ fontFamily:MONO, fontSize:12, color:'#79638C', background:'rgba(155,106,200,0.12)', padding:'1px 7px', border:'1px solid rgba(155,106,200,0.35)' }}>👤 {s.medecin} · {fmt$(s.salaire)}</span>
                      ))}
                    </div>
                  </div>

                  {/* Droite : montants */}
                  <div style={{ textAlign:'right', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                    {canEdit && (
                      <div onClick={e => e.stopPropagation()}>
                        {delConfirm === arc.id
                          ? <span style={{ display:'flex', gap:6 }}>
                              <button onClick={()=>removeArchive(arc.id)} style={{ fontFamily:MONO, fontSize:11, padding:'4px 9px', cursor:'pointer', background:'#8B404025', color:'#963F36', border:'1px solid #8B404060' }}>SUPPRIMER ?</button>
                              <button onClick={()=>setDelConfirm(null)} style={{ fontFamily:MONO, fontSize:11, padding:'4px 7px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>✕</button>
                            </span>
                          : <button onClick={()=>setDelConfirm(arc.id)} style={{ fontFamily:MONO, fontSize:11, padding:'4px 9px', cursor:'pointer', background:'transparent', color:'#8B6060', border:'1px solid rgba(139,64,64,0.3)' }}>✕ SUPPRIMER</button>}
                      </div>
                    )}
                    <div style={{ fontFamily:DISPLAY, fontSize:26, color: allDone ? '#6A9A68' : T.gold }}>
                      {fmt$(arc.totalPercu + arc.totalAttente)}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, display:'flex', gap:10 }}>
                      {arc.totalPercu > 0 && <span style={{color:'#49654D'}}>✔ {fmt$(arc.totalPercu)}</span>}
                      {arc.totalAttente > 0 && <span style={{color:'#80682D'}}>⏳ {fmt$(arc.totalAttente)}</span>}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:12, color:'rgba(128,104,45,0.5)', marginTop:2 }}>
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
        ↻ Les semaines passées s&apos;archivent automatiquement dès leur clôture
      </div>
    </div>
  );
}
