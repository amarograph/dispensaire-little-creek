'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const DISPLAY = "'Central Station', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const TYPES = ['Numéro de compte entreprise', 'Code coffre entreprise', 'Code coffre dispensaire', 'Autre'];
const TYPE_ICON: Record<string, string> = { 'Numéro de compte entreprise': '🏢', 'Code coffre entreprise': '🔐', 'Code coffre dispensaire': '🗝', 'Autre': '📌' };
const TYPE_COL:  Record<string, string> = { 'Numéro de compte entreprise': '#5A8AB5', 'Code coffre entreprise': '#E8B860', 'Code coffre dispensaire': '#A8B991', 'Autre': '#C8BEA5' };
const TYPE_NOM:  Record<string, string> = { 'Numéro de compte entreprise': 'Comptes des entreprises', 'Code coffre entreprise': 'Coffres des entreprises', 'Code coffre dispensaire': 'Coffres du dispensaire', 'Autre': 'Autres' };
const PLACEHOLDER_NOM: Record<string, string> = { 'Numéro de compte entreprise': 'ex : Saloon de Valentine', 'Code coffre entreprise': 'ex : Coffre du saloon', 'Code coffre dispensaire': 'ex : Coffre des remèdes', 'Autre': 'Intitulé' };

interface Entree {
  id: string; type: string; nom: string; valeur: string; precision: string;
  auteur: string; createdAt: string; modifieePar?: string;
}
interface Brouillon { id?: string; type: string; nom: string; valeur: string; precision: string; }

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

export function CodesSection() {
  const [entrees, setEntrees] = useState<Entree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [tout, setTout]       = useState(false);              // tout afficher / tout masquer
  const [visibles, setVisibles] = useState<Set<string>>(new Set());
  const [copie, setCopie]     = useState<string | null>(null);
  const [edit, setEdit]       = useState<Brouillon | null>(null);
  const [saving, setSaving]   = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/redm-codes')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setEntrees(Array.isArray(d.entrees) ? d.entrees : []))
      .catch(() => setError('Accès refusé : cette section est réservée au directeur et au co-directeur.'))
      .finally(() => setLoading(false));
  }, []);

  async function appeler(payload: object): Promise<boolean> {
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/admin/redm-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? `Erreur ${r.status}`); return false; }
      if (Array.isArray(d.entrees)) setEntrees(d.entrees);
      return true;
    } catch { setError('Erreur réseau.'); return false; }
    finally { setSaving(false); }
  }

  async function enregistrer() {
    if (!edit || !edit.nom.trim()) return;
    if (await appeler({ action: 'upsert', entree: edit })) setEdit(null);
  }

  async function copier(e: Entree) {
    try { await navigator.clipboard.writeText(e.valeur); setCopie(e.id); setTimeout(() => setCopie(c => c === e.id ? null : c), 1500); } catch {}
  }

  const q = search.trim().toLowerCase();
  const filtrees = useMemo(() => entrees.filter(e => !q || e.nom.toLowerCase().includes(q) || e.precision.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)), [entrees, q]);
  const estVisible = (id: string) => tout || visibles.has(id);
  const basculer = (id: string) => setVisibles(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const petit: React.CSSProperties = { fontFamily: MONO, fontSize: 14, padding: '6px 11px', cursor: 'pointer' };

  return (
    <div>
      <div style={{ background: 'rgba(232,184,96,0.08)', border: '1px solid rgba(232,184,96,0.35)', padding: '10px 16px', marginBottom: 18, fontFamily: MONO, fontSize: 13, color: '#E8B860', letterSpacing: '0.04em', lineHeight: 1.6 }}>
        🔒 Section confidentielle : visible uniquement par le directeur, le co-directeur et les admins. Les codes sont masqués par défaut
        et ne sont jamais écrits dans le Journal d&apos;activité.
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span><button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input style={{ ...inp, flex: 1, minWidth: 240 }} placeholder="🔍 Rechercher une entreprise, un coffre…" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        <button onClick={() => setTout(t => !t)} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', padding: '10px 18px', cursor: 'pointer', background: tout ? 'rgba(232,184,96,0.18)' : 'transparent', color: tout ? '#E8B860' : T.muted, border: `1px solid ${tout ? '#E8B86070' : T.border}` }}>
          {tout ? '🙈 TOUT MASQUER' : '👁 TOUT AFFICHER'}
        </button>
        <button onClick={() => { setError(''); setEdit({ type: 'Numéro de compte entreprise', nom: '', valeur: '', precision: '' }); }}
          style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '10px 24px', cursor: 'pointer', background: 'rgba(209,183,124,0.18)', color: T.gold, border: '2px solid rgba(209,183,124,0.55)' }}>
          ✚ AJOUTER
        </button>
      </div>

      {loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 48, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {TYPES.map(type => {
            const liste = filtrees.filter(e => e.type === type);
            const col = TYPE_COL[type];
            if (type === 'Autre' && liste.length === 0) return null;
            return (
              <div key={type}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${col}60` }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>{TYPE_ICON[type]} {TYPE_NOM[type]} <span style={{ fontFamily: MONO, fontSize: 14, color: col, marginLeft: 8 }}>{liste.length}</span></div>
                  <button onClick={() => { setError(''); setEdit({ type, nom: '', valeur: '', precision: '' }); }}
                    style={{ ...petit, background: `${col}18`, color: col, border: `1px solid ${col}50` }}>✚ AJOUTER ICI</button>
                </div>
                {liste.length === 0 ? (
                  <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '18px', textAlign: 'center', border: `1px dashed ${T.border}` }}>Rien d&apos;enregistré pour l&apos;instant</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {liste.map(e => (
                      <div key={e.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${col}`, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 220px', minWidth: 180 }}>
                          <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text }}>{e.nom}</div>
                          {e.precision && <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 3, lineHeight: 1.5 }}>{e.precision}</div>}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: '0.12em', color: estVisible(e.id) ? T.gold : T.dim, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, padding: '8px 16px', minWidth: 150, textAlign: 'center', userSelect: estVisible(e.id) ? 'text' : 'none' }}>
                          {e.valeur ? (estVisible(e.id) ? e.valeur : '••••••') : <span style={{ fontSize: 13, letterSpacing: '0.05em', color: T.dim }}>non renseigné</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button title={estVisible(e.id) ? 'Masquer' : 'Afficher'} onClick={() => basculer(e.id)} style={{ ...petit, background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>{estVisible(e.id) ? '🙈' : '👁'}</button>
                          <button title="Copier" disabled={!e.valeur} onClick={() => copier(e)} style={{ ...petit, background: 'transparent', color: copie === e.id ? '#A8B991' : T.muted, border: `1px solid ${T.border}` }}>{copie === e.id ? '✔' : '📋'}</button>
                          <button title="Modifier" onClick={() => { setError(''); setEdit({ id: e.id, type: e.type, nom: e.nom, valeur: e.valeur, precision: e.precision }); }} style={{ ...petit, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                          {delConfirm === e.id ? (
                            <>
                              <button onClick={() => { setDelConfirm(null); appeler({ action: 'delete', id: e.id }); }} style={{ ...petit, background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                              <button onClick={() => setDelConfirm(null)} style={{ ...petit, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                            </>
                          ) : (
                            <button title="Supprimer" onClick={() => setDelConfirm(e.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {edit && createPortal(
        <div onClick={() => !saving && setEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={ev => ev.stopPropagation()} style={{ background: '#102B3B', border: `2px solid ${T.gold}`, width: '100%', maxWidth: 560, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.gold }}>{edit.id ? '✎ Modifier' : '✚ Ajouter'}</div>
            <div>
              <label style={lbl}>TYPE</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={edit.type} onChange={ev => setEdit(x => x ? { ...x, type: ev.target.value } : x)}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{edit.type.includes('compte') ? 'ENTREPRISE *' : edit.type.includes('coffre') ? 'COFFRE / LIEU *' : 'INTITULÉ *'}</label>
              <input style={inp} value={edit.nom} onChange={ev => setEdit(x => x ? { ...x, nom: ev.target.value } : x)} placeholder={PLACEHOLDER_NOM[edit.type]} autoComplete="off" autoFocus />
            </div>
            <div>
              <label style={lbl}>{edit.type.includes('compte') ? 'NUMÉRO DE COMPTE' : 'CODE'}</label>
              <input style={{ ...inp, fontSize: 18, letterSpacing: '0.1em' }} value={edit.valeur} onChange={ev => setEdit(x => x ? { ...x, valeur: ev.target.value } : x)} placeholder="ex : 4821" autoComplete="off" />
            </div>
            <div>
              <label style={lbl}>PRÉCISION (OPTIONNEL)</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={edit.precision} onChange={ev => setEdit(x => x ? { ...x, precision: ev.target.value } : x)} placeholder="Propriétaire, emplacement, remarque…" />
            </div>
            {error && <div style={{ padding: '8px 12px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEdit(null)} disabled={saving} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button onClick={enregistrer} disabled={saving || !edit.nom.trim()}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: 'rgba(209,183,124,0.2)', color: T.gold, border: '2px solid rgba(209,183,124,0.55)', opacity: saving || !edit.nom.trim() ? 0.5 : 1 }}>
                {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
