'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';


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

function getMondayOf(date: Date): Date {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0); return d;
}
function addDaysReal(d: Date, n: number): Date { const c = new Date(d); c.setDate(c.getDate()+n); return c; }
function fmtISODate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function fmtDayShort(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
const JOURS_CAISSE = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
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

interface Tresorerie { ventes: number; achats: number; solde: number; }
function tresorerie(factures: Facture[], tarifs: Record<string, TarifCategory>): Tresorerie {
  let ventes = 0, achats = 0, solde = 0;
  factures.forEach(f => {
    if (f.statut === 'ANNULÉ') return;
    normPrestations(f.prestations).forEach(p => {
      const t = tarifs[p.id]; if (!t) return;
      if (t.type === 'achat') { achats += t.prix * p.qty; solde -= t.prix * p.qty; }
      else { ventes += t.prix * p.qty; solde += t.prix * p.qty * t.pctDispensaire / 100; }
    });
  });
  return { ventes, achats, solde };
}

const STATUT_COL:  Record<StatutPaiement, string> = { 'PAYÉ': '#A8B991', 'EN ATTENTE': '#D1B77C', 'ANNULÉ': '#8B4040' };
const STATUT_ICON: Record<StatutPaiement, string> = { 'PAYÉ': '✔', 'EN ATTENTE': '⏳', 'ANNULÉ': '✕' };

export default function DirectionComptabilitePage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'admin'].includes(r));
  const canEditCaisses = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'redm_medecin_chef'].includes(r));
  const [items,    setItems]    = useState<Facture[]>([]);
  const [archives, setArchives] = useState<SemaineArchivee[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [tarifs,   setTarifs]   = useState<Record<string, TarifCategory>>({});
  const [resetConfirm, setResetConfirm] = useState(false);
  const autoArchiveDone = useRef(false);

  interface CaisseStaff { discord_id: string; nom: string; rate: number; dates: string[]; count: number; salaire: number; }
  const [caissesStaff,   setCaissesStaff]   = useState<CaisseStaff[]>([]);
  const [caissesLoading, setCaissesLoading] = useState(true);
  const [caisseMonday,   setCaisseMonday]   = useState<Date>(() => getMondayOf(new Date()));

  const todayMonday = getMondayOf(new Date());
  const currentKey  = mondayISO(todayMonday);
  const caisseDays  = Array.from({ length: 7 }, (_, i) => addDaysReal(caisseMonday, i));
  const caisseFrom  = fmtISODate(caisseDays[0]);
  const caisseTo    = fmtISODate(caisseDays[6]);
  const todayISODate = fmtISODate(new Date());
  const caisseIsThisWeek = fmtISODate(caisseMonday) === fmtISODate(getMondayOf(new Date()));
  const caissesTotalSemaine = caissesStaff.reduce((s, x) => s + x.count, 0);

  /* ── Registre des caisses (self-service du personnel + édition Direction) ── */
  const loadCaisses = useCallback(() => {
    setCaissesLoading(true);
    return fetch(`/api/admin/redm-caisses?from=${caisseFrom}&to=${caisseTo}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.staff) setCaissesStaff(d.staff); })
      .catch(() => {})
      .finally(() => setCaissesLoading(false));
  }, [caisseFrom, caisseTo]);

  useEffect(() => { loadCaisses(); }, [loadCaisses]);

  async function toggleCaisse(discordId: string, date: string) {
    if (!canEditCaisses) return;
    setCaissesStaff(prev => prev.map(s => {
      if (s.discord_id !== discordId) return s;
      const has   = s.dates.includes(date);
      const dates = has ? s.dates.filter(d => d !== date) : [...s.dates, date].sort();
      return { ...s, dates, count: dates.length, salaire: Math.round(dates.length * s.rate * 100) / 100 };
    }));
    try {
      const res = await fetch('/api/admin/redm-caisses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_id: discordId, date }),
      });
      if (!res.ok) throw new Error();
    } catch {
      loadCaisses();
    }
  }

  /* ── Hydratation : on lit les mêmes registres que « Caisse et Comptabilité » ── */
  useEffect(() => {
    setItems(load()); setArchives(loadArc()); setHydrated(true);
  }, []);

  /* ── Catégories & répartition définies par la Direction ── */
  useEffect(() => {
    fetch('/api/admin/redm-tarifs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.categories) setTarifs(categoriesToMap(d.categories)); })
      .catch(() => {});
  }, []);

  /* ── Auto-archivage des semaines passées (au cas où la Caisse n'a pas encore été ouverte) ── */
  useEffect(() => {
    if (!hydrated || autoArchiveDone.current) return;
    autoArchiveDone.current = true;

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

  function resetTout() {
    setItems([]);
    setArchives([]);
    setResetConfirm(false);
  }

  const allByWeek = groupByWeek(items);
  const semaineActuelle = allByWeek[currentKey]?.factures ?? [];

  const totalPercu   = semaineActuelle.filter(f=>f.statut==='PAYÉ').reduce((s,f)=>s+f.montant,0);
  const totalAttente = semaineActuelle.filter(f=>f.statut==='EN ATTENTE').reduce((s,f)=>s+f.montant,0);
  const salaires     = salairesByMedecin(semaineActuelle, tarifs);

  const tresorerieSemaine = tresorerie(semaineActuelle, tarifs);
  const soldeDispensaire  = tresorerie([...items, ...archives.flatMap(a => a.factures)], tarifs).solde;

  /* ── Ligne de registre (lecture seule) ── */
  function RegistreLine({ f }: { f: Facture }) {
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
              <span style={{ fontFamily:MONO, fontSize: 12, color:'#BAAAC6', background:'rgba(155,106,200,0.10)', padding:'1px 7px' }}>👤 {f.medecin || '— Non assigné —'}</span>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {pres.map((p,i) => {
                const cat = tarifs[p.id];
                const isAchat = cat?.type === 'achat';
                return (
                  <span key={i} style={{ fontFamily:MONO, fontSize: 12, color: isAchat ? '#C8845A' : T.gold, background: isAchat ? 'rgba(200,132,90,0.10)' : 'rgba(209,183,124,0.10)', padding:'1px 7px' }}>
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

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <button onClick={()=>router.push('/redm/direction')} style={{ fontFamily:MONO, fontSize: 15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily:MONO, fontSize: 14, color:T.gold, letterSpacing:'0.16em' }}>DIRECTION · COMPTABILITÉ</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            <button
              onClick={()=>router.push('/redm/direction/tarifs')}
              style={{ fontFamily:MONO, fontSize:14, letterSpacing:'0.12em', padding:'9px 20px', cursor:'pointer', background:'rgba(209,183,124,0.12)', color:T.gold, border:`1px solid rgba(209,183,124,0.40)`, display:'flex', alignItems:'center', gap:8 }}>
              🏷 TARIFS
            </button>
            <button
              onClick={()=>router.push('/redm/direction/comptabilite/archives')}
              style={{ fontFamily:MONO, fontSize:14, letterSpacing:'0.12em', padding:'9px 20px', cursor:'pointer', background:'rgba(74,96,72,0.18)', color:'#6A9A68', border:`1px solid rgba(74,96,72,0.50)`, display:'flex', alignItems:'center', gap:8 }}>
              📦 ARCHIVES
              {archives.length > 0 && <span style={{ fontFamily:MONO, fontSize:12, color:'#6A9A68', background:'rgba(74,96,72,0.30)', padding:'1px 7px', borderRadius:2 }}>{archives.length}</span>}
            </button>
          </div>
        </div>
        <h1 style={{ fontFamily:DISPLAY, fontSize: 35, color:T.gold, margin:0 }}>📊 Comptabilité</h1>
        <p style={{ fontFamily:MONO, fontSize: 13, color:T.dim, letterSpacing:'0.1em', marginTop:8 }}>
          REGISTRE HEBDOMADAIRE & SALAIRES DES MÉDECINS — D&apos;APRÈS « COMPTABILITÉ »
        </p>
      </div>

      {hydrated && (
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

          {/* Trésorerie du dispensaire */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:8, borderBottom:`2px solid rgba(209,183,124,0.40)` }}>
              <span style={{ fontFamily:MONO, fontSize: 15, color:T.gold, letterSpacing:'0.14em' }}>🏦 TRÉSORERIE DU DISPENSAIRE</span>
            </div>

            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`5px solid ${soldeDispensaire>=0 ? '#A8B991' : '#8B4040'}`, padding:'22px 24px', textAlign:'center', marginBottom:10 }}>
              <div style={{ fontFamily:DISPLAY, fontSize:42, color: soldeDispensaire>=0 ? '#6A9A68' : '#DF9A88' }}>{fmt$(soldeDispensaire)}</div>
              <div style={{ fontFamily:MONO, fontSize:13, color:T.dim, marginTop:4, letterSpacing:'0.14em' }}>SOLDE DU COMPTE DU DISPENSAIRE</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:DISPLAY, fontSize:24, color:T.gold }}>{fmt$(tresorerieSemaine.ventes)}</div>
                <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>VENTES (SEMAINE)</div>
              </div>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:DISPLAY, fontSize:24, color:'#C8845A' }}>{fmt$(tresorerieSemaine.achats)}</div>
                <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>ACHATS (SEMAINE)</div>
              </div>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:DISPLAY, fontSize:24, color:'#A8B991' }}>{caissesTotalSemaine}</div>
                <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, marginTop:3, letterSpacing:'0.1em' }}>CAISSES (SEMAINE)</div>
              </div>
            </div>
          </div>

          {/* Registre des caisses (self-service du personnel) */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:8, borderBottom:`2px solid rgba(209,183,124,0.40)`, flexWrap:'wrap', gap:10 }}>
              <span style={{ fontFamily:MONO, fontSize: 15, color:T.gold, letterSpacing:'0.14em' }}>💵 REGISTRE DES CAISSES — {fmtDayShort(caisseDays[0])} AU {fmtDayShort(caisseDays[6])}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => setCaisseMonday(m => addDaysReal(m, -7))} style={{ fontFamily:MONO, fontSize:12, padding:'7px 12px', cursor:'pointer', background:T.card, border:`1px solid ${T.border}`, color:T.gold }}>◀</button>
                {!caisseIsThisWeek && (
                  <button onClick={() => setCaisseMonday(getMondayOf(new Date()))} style={{ fontFamily:MONO, fontSize:11, letterSpacing:'0.08em', padding:'7px 12px', cursor:'pointer', background:'rgba(209,183,124,0.08)', border:`1px solid rgba(209,183,124,0.35)`, color:T.gold }}>AUJOURD'HUI</button>
                )}
                <button onClick={() => setCaisseMonday(m => addDaysReal(m, 7))} disabled={caisseIsThisWeek} style={{ fontFamily:MONO, fontSize:12, padding:'7px 12px', cursor: caisseIsThisWeek ? 'default' : 'pointer', background:T.card, border:`1px solid ${T.border}`, color: caisseIsThisWeek ? T.dim : T.gold, opacity: caisseIsThisWeek ? 0.4 : 1 }}>▶</button>
                <button onClick={() => router.push('/redm/registre-caisses')} style={{ fontFamily:MONO, fontSize:12, letterSpacing:'0.1em', padding:'7px 16px', cursor:'pointer', background:'rgba(209,183,124,0.10)', color:T.gold, border:`1px solid rgba(209,183,124,0.35)` }}>
                  MA CAISSE →
                </button>
              </div>
            </div>

            {canEditCaisses && (
              <p style={{ fontFamily:MONO, fontSize:11, color:T.dim, letterSpacing:'0.06em', marginTop:-8, marginBottom:12 }}>
                Cliquez sur une case du tableau pour cocher/décocher une caisse.
              </p>
            )}

            {caissesLoading ? (
              <div style={{ fontFamily:MONO, fontSize: 13, color:T.dim, padding:'20px', textAlign:'center', border:`1px dashed ${T.border}` }}>Chargement…</div>
            ) : caissesStaff.length === 0 ? (
              <div style={{ fontFamily:MONO, fontSize: 13, color:T.dim, padding:'20px', textAlign:'center', border:`1px dashed ${T.border}` }}>Aucun membre concerné par le registre des caisses.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${T.border}` }}>
                  <thead>
                    <tr>
                      <th style={{ background:'rgba(209,183,124,0.10)', borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'10px 16px', fontFamily:MONO, fontSize:11, color:T.gold, letterSpacing:'0.14em', textAlign:'left' }}>MEMBRE</th>
                      {JOURS_CAISSE.map((j, i) => (
                        <th key={i} style={{ background:'rgba(209,183,124,0.06)', borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'10px 8px', fontFamily:MONO, fontSize:11, color:T.gold, textAlign:'center', minWidth:34 }}>{j}</th>
                      ))}
                      <th style={{ background:'rgba(209,183,124,0.10)', borderBottom:`1px solid ${T.border}`, borderRight:`1px solid ${T.border}`, padding:'10px 14px', fontFamily:MONO, fontSize:11, color:T.gold, letterSpacing:'0.1em', textAlign:'center' }}>NB</th>
                      <th style={{ background:'rgba(209,183,124,0.10)', borderBottom:`1px solid ${T.border}`, padding:'10px 14px', fontFamily:MONO, fontSize:11, color:T.gold, letterSpacing:'0.1em', textAlign:'right' }}>SALAIRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caissesStaff.map((s, idx) => (
                      <tr key={s.discord_id} style={{ borderBottom: idx < caissesStaff.length-1 ? `1px solid rgba(139,90,43,0.12)` : 'none' }}>
                        <td style={{ padding:'10px 16px', borderRight:`1px solid ${T.border}`, background:T.card }}>
                          <div style={{ fontFamily:DISPLAY, fontSize:15, color:T.text }}>{s.nom}</div>
                          <div style={{ fontFamily:MONO, fontSize:10, color:T.dim, marginTop:2 }}>{fmt$(s.rate)} / caisse</div>
                        </td>
                        {caisseDays.map((d, i) => {
                          const iso = fmtISODate(d);
                          const done = s.dates.includes(iso);
                          const missed = !done && iso < todayISODate;
                          const future = iso > todayISODate;
                          return (
                            <td key={i}
                              onClick={() => toggleCaisse(s.discord_id, iso)}
                              onMouseEnter={e => { if (canEditCaisses) e.currentTarget.style.background = 'rgba(128,104,45,0.10)'; }}
                              onMouseLeave={e => { if (canEditCaisses) e.currentTarget.style.background = 'transparent'; }}
                              style={{
                                padding:'10px 8px', textAlign:'center',
                                borderRight: i<6 ? `1px solid rgba(139,90,43,0.10)` : 'none',
                                cursor: canEditCaisses ? 'pointer' : 'default',
                                background: 'transparent',
                                transition:'background 0.12s',
                              }}
                              title={canEditCaisses ? `Cliquer pour basculer — ${fmtDayShort(d)}` : done ? `Caisse faite le ${fmtDayShort(d)}` : missed ? `Non faite le ${fmtDayShort(d)}` : ''}>
                              {done ? <span style={{ color:'#A8B991', fontSize:16 }}>✔</span>
                                : missed ? <span style={{ color:T.gold, fontSize:16 }}>✕</span>
                                : future ? <span style={{ color:T.dim, fontSize:12 }}>—</span>
                                : <span style={{ color:T.dim, fontSize:12 }}>·</span>}
                            </td>
                          );
                        })}
                        <td style={{ padding:'10px 14px', textAlign:'center', borderRight:`1px solid ${T.border}`, fontFamily:DISPLAY, fontSize:16, color:T.text }}>{s.count}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:DISPLAY, fontSize:18, color:'#A8B991' }}>{fmt$(s.salaire)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Semaine en cours */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:8, borderBottom:`2px solid rgba(209,183,124,0.40)` }}>
              <span style={{ fontFamily:MONO, fontSize: 15, color:T.gold, letterSpacing:'0.14em' }}>📅 {weekLabel(todayMonday)} — SEMAINE EN COURS</span>
            </div>

            {/* Stats semaine */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
              {[
                { l:'NB ACTES',   v: String(semaineActuelle.length), c: T.gold    },
                { l:'TOTAL PERÇU',v: fmt$(totalPercu),                c: '#A8B991' },
                { l:'EN ATTENTE', v: fmt$(totalAttente),              c: '#D1B77C' },
                { l:'MÉDECINS',   v: String(salaires.length),         c: '#BAAAC6' },
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
                    <div key={s.medecin} style={{ background:T.card, border:`1px solid rgba(155,106,200,0.35)`, borderLeft:`4px solid #BAAAC6`, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
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
                          <div style={{ fontFamily:DISPLAY, fontSize: 28, color:'#BAAAC6' }}>{fmt$(s.salaire)}</div>
                          <div style={{ fontFamily:MONO, fontSize: 11, color:T.dim, letterSpacing:'0.1em' }}>SALAIRE (APRÈS %)</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registre de la semaine */}
            <div>
              <div style={{ fontFamily:DISPLAY, fontSize: 22, color:T.text, marginBottom:10 }}>📋 Registre de la semaine</div>
              {semaineActuelle.length === 0 ? (
                <div style={{ fontFamily:MONO, fontSize: 14, color:T.dim, padding:'20px', textAlign:'center', border:`1px dashed ${T.border}` }}>Aucune facture cette semaine</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                  {semaineActuelle.map(f => <RegistreLine key={f.id} f={f} />)}
                </div>
              )}
            </div>
          </div>

          {/* Lien archives */}
          {archives.length > 0 && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <button
                onClick={() => router.push('/redm/direction/comptabilite/archives')}
                style={{ fontFamily:MONO, fontSize: 14, letterSpacing:'0.12em', padding:'11px 28px', cursor:'pointer', background:'rgba(74,96,72,0.15)', color:'#6A9A68', border:`1px solid rgba(74,96,72,0.40)` }}>
                📦 VOIR LES SEMAINES ARCHIVÉES ({archives.length})
              </button>
            </div>
          )}

          <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, textAlign:'center', padding:'12px', borderTop:`1px solid ${T.border}` }}>
            ↻ Ce registre reflète automatiquement la « Caisse et Comptabilité » · les semaines passées sont archivées dès leur clôture
          </div>

          {/* Zone de réinitialisation */}
          {canEdit && (
            <div style={{ padding:'14px 18px', background:'rgba(139,64,64,0.06)', border:`1px solid rgba(139,64,64,0.30)`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div style={{ fontFamily:MONO, fontSize:12, color:T.dim, letterSpacing:'0.06em' }}>
                ⚠ Efface définitivement le registre en cours et toutes les semaines archivées (Caisse et Comptabilité + Trésorerie).
              </div>
              {resetConfirm
                ? <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={resetTout} style={{ fontFamily:MONO, fontSize:13, padding:'9px 16px', cursor:'pointer', background:'#8B404025', color:'#DF9A88', border:'1px solid #8B404060' }}>CONFIRMER LA SUPPRESSION ?</button>
                    <button onClick={()=>setResetConfirm(false)} style={{ fontFamily:MONO, fontSize:13, padding:'9px 12px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>ANNULER</button>
                  </div>
                : <button onClick={()=>setResetConfirm(true)} style={{ fontFamily:MONO, fontSize:13, letterSpacing:'0.1em', padding:'9px 16px', cursor:'pointer', background:'transparent', color:'#8B6060', border:'1px solid rgba(139,64,64,0.3)', flexShrink:0 }}>🗑 RÉINITIALISER TOUS LES COMPTES</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
