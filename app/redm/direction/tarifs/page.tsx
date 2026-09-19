'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';


const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

type TypeCategorie = 'vente' | 'achat';
interface TarifCategory { id: string; nom: string; type: TypeCategorie; prix: number; pctDispensaire: number; pctMedecin: number; ordre: number; }

const TYPE_ICON: Record<TypeCategorie, string> = { vente: '🩺', achat: '🛒' };

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 16, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };

function fmt$(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' $'; }

export default function DirectionTarifsPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'admin'].includes(r));
  const [tarifs,     setTarifs]     = useState<TarifCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState<string | null>(null);
  const [saved,      setSaved]      = useState<string | null>(null);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [creating,   setCreating]   = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetch('/api/admin/redm-tarifs')
      .then(r => { if (!r.ok) throw new Error('forbidden'); return r.json(); })
      .then(d => setTarifs(d.categories ?? []))
      .catch(() => setError('Accès refusé ou erreur serveur.'))
      .finally(() => setLoading(false));
  }, []);

  function update(id: string, patch: Partial<TarifCategory>) {
    setTarifs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  function setPct(id: string, field: 'pctDispensaire' | 'pctMedecin', value: number) {
    const v = Math.max(0, Math.min(100, value));
    const other = field === 'pctDispensaire' ? 'pctMedecin' : 'pctDispensaire';
    update(id, { [field]: v, [other]: 100 - v } as Partial<TarifCategory>);
  }

  async function save(t: TarifCategory) {
    setSaving(t.id); setSaved(null); setActionError('');
    try {
      const r = await fetch('/api/admin/redm-tarifs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setActionError(d.error ? `Erreur lors de l'enregistrement : ${d.error}` : 'Erreur lors de l\'enregistrement.');
        return;
      }
      setSaved(t.id);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setActionError('Erreur réseau lors de l\'enregistrement.');
    } finally { setSaving(null); }
  }

  async function createCategory() {
    setCreating(true); setActionError('');
    try {
      const r = await fetch('/api/admin/redm-tarifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: 'Nouvelle catégorie', type: 'vente', prix: 0, pctDispensaire: 50 }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.category) setTarifs(prev => [...prev, d.category]);
      else setActionError(d.error ? `Erreur lors de la création : ${d.error}` : 'Erreur lors de la création.');
    } catch {
      setActionError('Erreur réseau lors de la création.');
    } finally { setCreating(false); }
  }

  async function remove(id: string) {
    const previous = tarifs;
    setTarifs(prev => prev.filter(t => t.id !== id));
    setDelConfirm(null); setActionError('');
    try {
      const r = await fetch(`/api/admin/redm-tarifs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) {
        setTarifs(previous);
        const d = await r.json().catch(() => ({}));
        setActionError(d.error ? `Erreur lors de la suppression : ${d.error}` : 'Erreur lors de la suppression.');
      }
    } catch {
      setTarifs(previous);
      setActionError('Erreur réseau lors de la suppression.');
    }
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <button onClick={()=>router.push('/redm/direction')} style={{ fontFamily:MONO, fontSize:15, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'8px 18px', cursor:'pointer', letterSpacing:'0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily:MONO, fontSize:14, color:T.gold, letterSpacing:'0.18em' }}>DIRECTION · TARIFS & RÉPARTITION</span>
        </div>
        <h1 style={{ fontFamily:DISPLAY, fontSize:35, color:T.gold, margin:0 }}>🏷 Tarifs & Répartition</h1>
        <p style={{ fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.1em', marginTop:8 }}>
          CATÉGORIES, PRIX ET PARTAGE DES HONORAIRES — ACCÈS DIRECTION UNIQUEMENT
        </p>
      </div>

      {error ? (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:24, fontFamily:MONO, fontSize:13, color:'#E88060' }}>
          ⚠ {error}
          <div style={{ marginTop:8, color:T.muted, fontSize:12 }}>Seuls la direction et la co-direction peuvent consulter et modifier ces paramètres.</div>
        </div>
      ) : loading ? (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:48, textAlign:'center', fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.12em' }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {actionError && (
            <div style={{ background:'rgba(139,64,64,0.12)', border:'1px solid rgba(139,64,64,0.35)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, fontFamily:MONO, fontSize:13, color:'#E88060' }}>
              <span>⚠ {actionError}</span>
              <button onClick={()=>setActionError('')} style={{ fontFamily:MONO, fontSize:13, background:'transparent', border:'none', color:T.muted, cursor:'pointer' }}>✕</button>
            </div>
          )}
          {tarifs.map(t => {
            const isVente = t.type === 'vente';
            const partDispensaire = Math.round(t.prix * t.pctDispensaire) / 100;
            const partMedecin     = Math.round(t.prix * t.pctMedecin) / 100;
            return (
              <div key={t.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderLeft:`4px solid ${isVente ? T.gold : '#C8845A'}`, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
                  <span style={{ fontSize:24 }}>{TYPE_ICON[t.type]}</span>
                  {canEdit ? (
                    <>
                      <input style={{ ...inp, flex:'1 1 220px', fontFamily:DISPLAY, fontSize:20, padding:'8px 12px' }} value={t.nom} onChange={e=>update(t.id,{nom:e.target.value})} placeholder="Nom de la catégorie" />
                      <select style={{ ...inp, width:160, cursor:'pointer' }} value={t.type} onChange={e=>update(t.id,{type:e.target.value as TypeCategorie})}>
                        <option value="vente">💰 Vente</option>
                        <option value="achat">🛒 Achat</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <span style={{ flex:'1 1 220px', fontFamily:DISPLAY, fontSize:20, color:T.text }}>{t.nom}</span>
                      <span style={{ fontFamily:MONO, fontSize:13, color:T.muted, letterSpacing:'0.08em' }}>{isVente ? '💰 Vente' : '🛒 Achat'}</span>
                    </>
                  )}
                </div>

                {canEdit ? (
                  <div style={{ display:'grid', gridTemplateColumns: isVente ? 'repeat(3,1fr)' : '1fr', gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>PRIX ($)</label>
                      <input type="number" step="0.01" min="0" style={inp} value={t.prix} onChange={e=>update(t.id,{prix:Number(e.target.value)})} />
                    </div>
                    {isVente && (
                      <>
                        <div>
                          <label style={lbl}>% DISPENSAIRE</label>
                          <input type="number" step="1" min="0" max="100" style={inp} value={t.pctDispensaire} onChange={e=>setPct(t.id,'pctDispensaire',Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={lbl}>% MÉDECIN</label>
                          <input type="number" step="1" min="0" max="100" style={inp} value={t.pctMedecin} onChange={e=>setPct(t.id,'pctMedecin',Number(e.target.value))} />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns: isVente ? 'repeat(3,1fr)' : '1fr', gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>PRIX ($)</label>
                      <div style={{ fontFamily:MONO, fontSize:16, color:T.text }}>{fmt$(t.prix)}</div>
                    </div>
                    {isVente && (
                      <>
                        <div>
                          <label style={lbl}>% DISPENSAIRE</label>
                          <div style={{ fontFamily:MONO, fontSize:16, color:T.text }}>{t.pctDispensaire}%</div>
                        </div>
                        <div>
                          <label style={lbl}>% MÉDECIN</label>
                          <div style={{ fontFamily:MONO, fontSize:16, color:T.text }}>{t.pctMedecin}%</div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
                  <div style={{ fontFamily:MONO, fontSize:13, color:T.dim, letterSpacing:'0.05em' }}>
                    {isVente
                      ? <>Pour {fmt$(t.prix)} → <span style={{color:T.gold}}>Dispensaire {fmt$(partDispensaire)}</span> · <span style={{color:'#BAAAC6'}}>Médecin {fmt$(partMedecin)}</span></>
                      : <>Dépense du dispensaire — <span style={{color:'#C8845A'}}>{fmt$(t.prix)}</span> par achat</>}
                  </div>
                  {canEdit && (
                    <div style={{ display:'flex', gap:8 }}>
                      {delConfirm===t.id
                        ? <>
                            <button onClick={()=>remove(t.id)} style={{ fontFamily:MONO, fontSize:13, padding:'9px 16px', cursor:'pointer', background:'#8B404025', color:'#DF9A88', border:'1px solid #8B404060' }}>SUPPRIMER ?</button>
                            <button onClick={()=>setDelConfirm(null)} style={{ fontFamily:MONO, fontSize:13, padding:'9px 12px', cursor:'pointer', background:'transparent', color:T.dim, border:`1px solid ${T.border}` }}>✕</button>
                          </>
                        : <button onClick={()=>setDelConfirm(t.id)} style={{ fontFamily:MONO, fontSize:13, padding:'9px 16px', cursor:'pointer', background:'transparent', color:'#8B6060', border:'1px solid rgba(139,64,64,0.3)' }}>✕ SUPPRIMER</button>}
                      <button onClick={()=>save(t)} disabled={saving===t.id}
                        style={{ fontFamily:MONO, fontSize:13, letterSpacing:'0.12em', padding:'9px 22px', cursor:'pointer', background: saved===t.id ? 'rgba(74,96,72,0.25)' : 'rgba(120,96,48,0.30)', color: saved===t.id ? '#6A9A68' : T.gold, border:`1px solid ${saved===t.id ? 'rgba(74,96,72,0.5)' : 'rgba(120,96,48,0.55)'}` }}>
                        {saving===t.id ? '⟳ ENREGISTREMENT...' : saved===t.id ? '✔ ENREGISTRÉ' : '✔ ENREGISTRER'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {canEdit && (
            <button onClick={createCategory} disabled={creating}
              style={{ fontFamily:MONO, fontSize:14, letterSpacing:'0.12em', padding:'14px', cursor:creating?'default':'pointer', background:'transparent', color:T.gold, border:`1px dashed rgba(209,183,124,0.4)` }}>
              {creating ? '⟳ CRÉATION...' : '+ NOUVELLE CATÉGORIE'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
