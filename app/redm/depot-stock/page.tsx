'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '9px 12px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em', marginBottom: 5, display: 'block' };

interface Item { id: string; intitule: string; }
interface Categorie { id: string; nom: string; icon: string; items: Item[]; }

const NOUVEL_ARTICLE = '__nouveau__';

export default function DepotStockPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [hydrated,   setHydrated]   = useState(false);

  const [categorieId,    setCategorieId]    = useState('');
  const [itemChoice,     setItemChoice]     = useState('');
  const [nouvelIntitule, setNouvelIntitule] = useState('');
  const [quantite,       setQuantite]       = useState('1');
  const [busy,           setBusy]           = useState(false);
  const [error,          setError]          = useState('');
  const [succes,         setSucces]         = useState<{ item: string; quantite: number; categorie: string } | null>(null);

  useEffect(() => {
    fetch('/api/redm/stockage-depot')
      .then(r => r.json())
      .then(d => {
        const cats: Categorie[] = Array.isArray(d.categories) ? d.categories : [];
        setCategories(cats);
        if (cats[0]) setCategorieId(cats[0].id);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const categorie = categories.find(c => c.id === categorieId);

  async function submit() {
    setError(''); setSucces(null);
    const qty = Math.floor(Number(quantite));
    if (!categorieId) { setError('Choisissez une catégorie.'); return; }
    if (!itemChoice) { setError('Choisissez ou nommez un article.'); return; }
    if (itemChoice === NOUVEL_ARTICLE && !nouvelIntitule.trim()) { setError("Précisez le nom de l'article."); return; }
    if (!Number.isFinite(qty) || qty <= 0) { setError('Quantité invalide.'); return; }

    setBusy(true);
    try {
      const res = await fetch('/api/redm/stockage-depot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          itemChoice === NOUVEL_ARTICLE
            ? { categorieId, nouvelIntitule: nouvelIntitule.trim(), quantite: qty }
            : { categorieId, itemId: itemChoice, quantite: qty },
        ),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? 'Erreur serveur.'); return; }
      setSucces({ item: d.item.intitule, quantite: qty, categorie: d.categorie });
      setItemChoice(''); setNouvelIntitule(''); setQuantite('1');
    } catch {
      setError('Erreur réseau.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: BODY, maxWidth: 620, margin: '0 auto' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,700;1,400&display=swap');`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← RETOUR
        </button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>DISPENSAIRE · DÉPÔT DE STOCK</span>
      </div>

      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 34, color: T.gold, margin: '0 0 6px' }}>📥 Déposer du Stock</h1>
        <div style={{ fontFamily: BODY, fontSize: 16, color: T.muted }}>
          Déclarez ce que vous avez ramené — ajouté immédiatement à l&apos;inventaire du dispensaire.
        </div>
      </div>

      {!hydrated ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '30px', textAlign: 'center', border: `1px dashed ${T.border}` }}>Chargement…</div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>CATÉGORIE</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={categorieId} onChange={e => { setCategorieId(e.target.value); setItemChoice(''); }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.nom}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>ARTICLE</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={itemChoice} onChange={e => setItemChoice(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {categorie?.items.map(i => <option key={i.id} value={i.id}>{i.intitule || 'Article sans nom'}</option>)}
              <option value={NOUVEL_ARTICLE}>+ Autre (nouvel article)</option>
            </select>
          </div>

          {itemChoice === NOUVEL_ARTICLE && (
            <div>
              <label style={lbl}>NOM DU NOUVEL ARTICLE</label>
              <input style={inp} value={nouvelIntitule} onChange={e => setNouvelIntitule(e.target.value)} placeholder="Ex : Racine de valériane" autoFocus />
            </div>
          )}

          <div>
            <label style={lbl}>QUANTITÉ DÉPOSÉE</label>
            <input type="number" min={1} style={inp} value={quantite} onChange={e => setQuantite(e.target.value)} />
          </div>

          {error && <div style={{ fontFamily: MONO, fontSize: 14, color: '#DF9A88' }}>✕ {error}</div>}
          {succes && (
            <div style={{ fontFamily: MONO, fontSize: 14, color: '#A8B991', letterSpacing: '0.04em' }}>
              ✔ {succes.quantite} × {succes.item} ajouté à « {succes.categorie} »
            </div>
          )}

          <button onClick={submit} disabled={busy}
            style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.1em', padding: '12px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, background: 'rgba(90,152,88,0.22)', color: '#A8B991', border: '1px solid rgba(90,152,88,0.5)' }}>
            {busy ? 'ENVOI…' : '✔ DÉCLARER LE DÉPÔT'}
          </button>
        </div>
      )}
    </div>
  );
}
