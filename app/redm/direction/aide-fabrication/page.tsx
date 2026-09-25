'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

interface Ingredient { nom: string; quantite: number; }
interface Recette {
  id: string; nom: string; variante?: string;
  quantiteProduite: number; ingredients: Ingredient[]; ordre: number;
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 13px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 5, display: 'block' };
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

/* Résout récursivement la demande d'un objet en fabrications intermédiaires + matières premières. */
function resolveDemand(
  nom: string, qtyNeeded: number,
  recipesByNom: Record<string, Recette[]>,
  chosenVariant: Record<string, string>,
  steps: Record<string, { nom: string; variante?: string; besoin: number; produit: number; fabrications: number }>,
  raw: Record<string, number>,
) {
  const options = recipesByNom[nom];
  if (!options || options.length === 0) {
    raw[nom] = (raw[nom] ?? 0) + qtyNeeded;
    return;
  }
  const recette = options.length === 1 ? options[0] : (options.find(o => o.id === chosenVariant[nom]) ?? options[0]);
  const batches = Math.ceil(qtyNeeded / recette.quantiteProduite);
  const produit = batches * recette.quantiteProduite;
  if (!steps[recette.id]) steps[recette.id] = { nom: recette.nom, variante: recette.variante, besoin: 0, produit: 0, fabrications: 0 };
  steps[recette.id].besoin += qtyNeeded;
  steps[recette.id].produit += produit;
  steps[recette.id].fabrications += batches;
  recette.ingredients.forEach(ing => resolveDemand(ing.nom, ing.quantite * batches, recipesByNom, chosenVariant, steps, raw));
}

export default function AideFabricationPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  /* Calculateur */
  const [cibleNom,    setCibleNom]    = useState('');
  const [cibleId,     setCibleId]     = useState('');
  const [quantite,    setQuantite]    = useState(1);
  const [variantes,   setVariantes]   = useState<Record<string, string>>({});
  const [resultat,    setResultat]    = useState<{ steps: typeof stepsInit; raw: Record<string, number> } | null>(null);

  /* Gestion (Direction) */
  const [creating,    setCreating]    = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<{ nom: string; variante: string; quantiteProduite: string; ingredients: { nom: string; quantite: string }[] }>({ nom: '', variante: '', quantiteProduite: '1', ingredients: [{ nom: '', quantite: '1' }] });
  const [saving,      setSaving]      = useState(false);
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [showGestion,  setShowGestion] = useState(false);

  useEffect(() => {
    fetch('/api/admin/redm-recettes')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setRecettes(d.recettes ?? []))
      .catch(() => setError('Accès refusé ou erreur serveur.'))
      .finally(() => setLoading(false));
  }, []);

  const recipesByNom = useMemo(() => {
    const m: Record<string, Recette[]> = {};
    recettes.forEach(r => { (m[r.nom] ??= []).push(r); });
    return m;
  }, [recettes]);

  const nomsUniques = useMemo(() => Object.keys(recipesByNom).sort((a, b) => a.localeCompare(b)), [recipesByNom]);
  const ambigus = useMemo(() => Object.entries(recipesByNom).filter(([, opts]) => opts.length > 1), [recipesByNom]);

  useEffect(() => {
    if (!cibleNom && nomsUniques.length) setCibleNom(nomsUniques[0]);
  }, [nomsUniques, cibleNom]);

  useEffect(() => {
    const opts = recipesByNom[cibleNom] ?? [];
    setCibleId(opts.length === 1 ? opts[0].id : (variantes[cibleNom] ?? opts[0]?.id ?? ''));
  }, [cibleNom, recipesByNom, variantes]);

  function setVariante(nom: string, id: string) {
    setVariantes(v => ({ ...v, [nom]: id }));
  }

  function calculer() {
    if (!cibleNom || quantite <= 0) return;
    const steps: typeof stepsInit = {};
    const raw: Record<string, number> = {};
    resolveDemand(cibleNom, quantite, recipesByNom, { ...variantes, [cibleNom]: cibleId }, steps, raw);
    setResultat({ steps, raw });
  }

  /* ── Gestion des recettes (Direction) ── */
  function startNew() {
    setForm({ nom: '', variante: '', quantiteProduite: '1', ingredients: [{ nom: '', quantite: '1' }] });
    setEditingId(null); setCreating(true);
  }
  function startEdit(r: Recette) {
    setForm({ nom: r.nom, variante: r.variante ?? '', quantiteProduite: String(r.quantiteProduite), ingredients: r.ingredients.map(i => ({ nom: i.nom, quantite: String(i.quantite) })) });
    setEditingId(r.id); setCreating(false);
  }
  function cancelForm() { setEditingId(null); setCreating(false); }
  function addIngredientRow() { setForm(f => ({ ...f, ingredients: [...f.ingredients, { nom: '', quantite: '1' }] })); }
  function removeIngredientRow(idx: number) { setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) })); }
  function setIngredientField(idx: number, field: 'nom' | 'quantite', val: string) {
    setForm(f => ({ ...f, ingredients: f.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: val } : ing) }));
  }

  async function submitForm() {
    if (!form.nom.trim()) return;
    setSaving(true); setActionError('');
    const payload = {
      nom: form.nom.trim(),
      variante: form.variante.trim() || undefined,
      quantiteProduite: Number(form.quantiteProduite) || 1,
      ingredients: form.ingredients.filter(i => i.nom.trim()).map(i => ({ nom: i.nom.trim(), quantite: Number(i.quantite) || 1 })),
    };
    try {
      if (editingId) {
        const r = await fetch('/api/admin/redm-recettes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) });
        if (!r.ok) { const d = await r.json().catch(() => ({})); setActionError(d.error ?? 'Erreur lors de la modification.'); return; }
        setRecettes(prev => prev.map(x => x.id === editingId ? { ...x, ...payload } : x));
      } else {
        const r = await fetch('/api/admin/redm-recettes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.recette) { setActionError(d.error ?? 'Erreur lors de la création.'); return; }
        setRecettes(prev => [...prev, d.recette]);
      }
      cancelForm();
    } catch {
      setActionError('Erreur réseau.');
    } finally { setSaving(false); }
  }

  async function removeRecette(id: string) {
    const previous = recettes;
    setRecettes(prev => prev.filter(r => r.id !== id));
    setDelConfirm(null);
    try {
      const r = await fetch(`/api/admin/redm-recettes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) { setRecettes(previous); setActionError('Erreur lors de la suppression.'); }
    } catch { setRecettes(previous); setActionError('Erreur réseau.'); }
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={() => router.push('/redm/direction')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>DIRECTION · AIDE FABRICATION</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 35, color: T.gold, margin: 0 }}>⚗ Aide Fabrication</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          CALCULE LES MATIÈRES PREMIÈRES NÉCESSAIRES POUR UNE QUANTITÉ DONNÉE, EN DÉCOMPOSANT LES OBJETS INTERMÉDIAIRES
        </p>
      </div>

      {error ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 24, fontFamily: MONO, fontSize: 14, color: '#E88060' }}>⚠ {error}</div>
      ) : loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 48, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Calculateur ── */}
          <div style={{ background: T.card, border: `2px solid ${T.gold}70`, padding: '22px 24px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold, marginBottom: 16 }}>🧮 Calculateur</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end', marginBottom: 14 }}>
              <div>
                <label style={lbl}>OBJET À FABRIQUER</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={cibleNom} onChange={e => setCibleNom(e.target.value)}>
                  {nomsUniques.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>QUANTITÉ SOUHAITÉE</label>
                <input type="number" min={1} style={inp} value={quantite} onChange={e => setQuantite(Math.max(1, Number(e.target.value) || 1))} />
              </div>
              <button onClick={calculer} disabled={!cibleNom}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.1em', padding: '11px 24px', cursor: 'pointer', background: 'rgba(120,96,48,0.30)', color: T.gold, border: '2px solid rgba(120,96,48,0.6)', whiteSpace: 'nowrap' }}>
                ✔ CALCULER
              </button>
            </div>

            {ambigus.length > 0 && (
              <div style={{ marginBottom: 14, padding: '12px 14px', background: 'rgba(0,0,0,0.18)', border: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 10 }}>PRÉFÉRENCES DE RECETTE — PLUSIEURS FAÇONS DE FABRIQUER CES OBJETS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {ambigus.map(([nom, opts]) => (
                    <div key={nom}>
                      <label style={lbl}>{nom.toUpperCase()}</label>
                      <select style={{ ...inp, cursor: 'pointer' }} value={variantes[nom] ?? opts[0].id} onChange={e => setVariante(nom, e.target.value)}>
                        {opts.map(o => <option key={o.id} value={o.id}>{o.variante || o.id}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultat && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.12em', marginBottom: 10 }}>📋 ÉTAPES DE FABRICATION</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.values(resultat.steps).map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(0,0,0,0.18)', border: `1px solid ${T.border}`, padding: '9px 14px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: BODY, fontSize: 17, color: T.text }}>
                          {s.nom}{s.variante ? <span style={{ color: T.dim, fontFamily: MONO, fontSize: 13 }}> — {s.variante}</span> : ''}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted }}>
                          besoin <b style={{ color: T.text }}>{s.besoin}</b> · <span style={{ color: '#A8B991' }}>{s.fabrications} fabrication{s.fabrications > 1 ? 's' : ''}</span> (produit {s.produit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.12em', marginBottom: 10 }}>🌿 MATIÈRES PREMIÈRES AU TOTAL</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 6 }}>
                    {Object.entries(resultat.raw).sort((a, b) => b[1] - a[1]).map(([nom, q]) => (
                      <div key={nom} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(209,183,124,0.08)', border: `1px solid rgba(209,183,124,0.3)`, padding: '9px 14px' }}>
                        <span style={{ fontFamily: BODY, fontSize: 17, color: T.text }}>{nom}</span>
                        <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.gold }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Gestion des recettes ── */}
          {canEdit && (
            <div>
              <button onClick={() => setShowGestion(s => !s)}
                style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '10px 20px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}`, marginBottom: 14 }}>
                {showGestion ? '▲ MASQUER LA GESTION DES RECETTES' : '▼ GÉRER LES RECETTES (' + recettes.length + ')'}
              </button>

              {showGestion && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {actionError && (
                    <div style={{ background: 'rgba(139,64,64,0.12)', border: '1px solid rgba(139,64,64,0.35)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 14, color: '#E88060' }}>
                      <span>⚠ {actionError}</span>
                      <button onClick={() => setActionError('')} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button>
                    </div>
                  )}

                  {recettes.map(r => (
                    <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, padding: '14px 18px' }}>
                      {editingId === r.id ? (
                        <RecetteForm form={form} setForm={setForm} addIngredientRow={addIngredientRow} removeIngredientRow={removeIngredientRow} setIngredientField={setIngredientField} onSave={submitForm} onCancel={cancelForm} saving={saving} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.text }}>
                              {r.nom}{r.variante ? <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}> — {r.variante}</span> : ''}
                              <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, marginLeft: 8 }}>×{r.quantiteProduite}/fabrication</span>
                            </div>
                            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 4 }}>
                              {r.ingredients.map(i => `${i.quantite}× ${i.nom}`).join(' · ') || 'Aucun ingrédient'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => startEdit(r)} style={{ fontFamily: MONO, fontSize: 14, padding: '7px 14px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: T.gold, border: `1px solid rgba(209,183,124,0.3)` }}>✎ MODIFIER</button>
                            {delConfirm === r.id
                              ? <>
                                  <button onClick={() => removeRecette(r.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '7px 14px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                                  <button onClick={() => setDelConfirm(null)} style={{ fontFamily: MONO, fontSize: 14, padding: '7px 10px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                                </>
                              : <button onClick={() => setDelConfirm(r.id)} style={{ fontFamily: MONO, fontSize: 14, padding: '7px 14px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕ SUPPRIMER</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {creating ? (
                    <div style={{ background: T.card, border: `2px solid ${T.gold}`, padding: '14px 18px' }}>
                      <RecetteForm form={form} setForm={setForm} addIngredientRow={addIngredientRow} removeIngredientRow={removeIngredientRow} setIngredientField={setIngredientField} onSave={submitForm} onCancel={cancelForm} saving={saving} />
                    </div>
                  ) : (
                    <button onClick={startNew} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '14px', cursor: 'pointer', background: 'transparent', color: T.gold, border: `1px dashed rgba(209,183,124,0.4)` }}>
                      + NOUVELLE RECETTE
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const stepsInit: Record<string, { nom: string; variante?: string; besoin: number; produit: number; fabrications: number }> = {};

function RecetteForm({ form, setForm, addIngredientRow, removeIngredientRow, setIngredientField, onSave, onCancel, saving }: {
  form: { nom: string; variante: string; quantiteProduite: string; ingredients: { nom: string; quantite: string }[] };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  addIngredientRow: () => void;
  removeIngredientRow: (idx: number) => void;
  setIngredientField: (idx: number, field: 'nom' | 'quantite', val: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: 10 }}>
        <div><label style={lbl}>NOM DE L&apos;OBJET FABRIQUÉ</label><input style={inp} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Bandage simple" /></div>
        <div><label style={lbl}>VARIANTE (optionnel)</label><input style={inp} value={form.variante} onChange={e => setForm(f => ({ ...f, variante: e.target.value }))} placeholder="ex : Thym & Camomille" /></div>
        <div><label style={lbl}>QUANTITÉ PRODUITE</label><input type="number" min={1} style={inp} value={form.quantiteProduite} onChange={e => setForm(f => ({ ...f, quantiteProduite: e.target.value }))} /></div>
      </div>
      <div>
        <label style={lbl}>INGRÉDIENTS</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {form.ingredients.map((ing, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: 2 }} value={ing.nom} onChange={e => setIngredientField(idx, 'nom', e.target.value)} placeholder="Nom de l'ingrédient" />
              <input type="number" min={1} style={{ ...inp, width: 80, flexShrink: 0 }} value={ing.quantite} onChange={e => setIngredientField(idx, 'quantite', e.target.value)} />
              {form.ingredients.length > 1 && <button onClick={() => removeIngredientRow(idx)} style={{ fontFamily: MONO, fontSize: 15, padding: '6px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>}
            </div>
          ))}
          <button onClick={addIngredientRow} style={{ fontFamily: MONO, fontSize: 14, padding: '6px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px dashed ${T.border}` }}>+ AJOUTER UN INGRÉDIENT</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={saving} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '10px 22px', cursor: 'pointer', background: 'rgba(120,96,48,0.30)', color: T.gold, border: '1px solid rgba(120,96,48,0.55)' }}>
          {saving ? '⟳ ENREGISTREMENT...' : '✔ ENREGISTRER'}
        </button>
        <button onClick={onCancel} style={{ fontFamily: MONO, fontSize: 14, padding: '10px 18px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>ANNULER</button>
      </div>
    </div>
  );
}
