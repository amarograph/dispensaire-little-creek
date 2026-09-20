'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';


const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const SEUIL_ALERTE = 5;

interface StockItem {
  id: string;
  intitule: string;
  quantite: number;
}
interface StockCategorie {
  id: string;
  nom: string;
  icon: string;
  items: StockItem[];
}
interface Toast {
  id: string;
  titre: string;
  quantite: number;
}

const PLANTES_DEFAULT: StockItem[] = [
  { id: 'ginseng-americain', intitule: 'Ginseng Americain', quantite: 10 },
  { id: 'gingseng-alaska', intitule: 'Gingseng Alaska', quantite: 10 },
  { id: 'camomille', intitule: 'Camomille', quantite: 10 },
  { id: 'menthe', intitule: 'Menthe', quantite: 10 },
  { id: 'thym', intitule: 'Thym', quantite: 10 },
  { id: 'laurier-rose', intitule: 'Laurier Rose', quantite: 10 },
  { id: 'pavot', intitule: 'Pavot', quantite: 10 },
  { id: 'bardane', intitule: 'Bardane', quantite: 10 },
];

const MATERIAUX_DEFAULT: StockItem[] = [
  { id: 'tissu-solide', intitule: 'Tissu solide', quantite: 10 },
  { id: 'gourde-d-eau', intitule: "Gourde d'eau", quantite: 10 },
  { id: 'ethanol', intitule: 'Ethanol', quantite: 10 },
  { id: 'lotion-antiseptique', intitule: 'Lotion antiseptique', quantite: 10 },
  { id: 'composte', intitule: 'Composte', quantite: 10 },
  { id: 'dechet-organique', intitule: 'Déchet organique', quantite: 10 },
  { id: 'fil-de-peche', intitule: 'Fil de pêche', quantite: 10 },
  { id: 'salpetre', intitule: 'Salpêtre', quantite: 10 },
  { id: 'souffre', intitule: 'Souffre', quantite: 10 },
];

const MATERIELS_MEDICAUX_DEFAULT: StockItem[] = [
  { id: 'bandage-simple', intitule: 'Bandage simple', quantite: 10 },
  { id: 'bandage-ameliorer', intitule: 'Bandage améliorer', quantite: 10 },
  { id: 'trousse-de-soins', intitule: 'Trousse de soins', quantite: 10 },
  { id: 'ammoniaque', intitule: 'Ammoniaque', quantite: 10 },
  { id: 'infusion-de-ginseng', intitule: 'Infusion de Ginseng', quantite: 10 },
  { id: 'lait-de-pavot', intitule: 'Lait de Pavot', quantite: 10 },
  { id: 'canne', intitule: 'Canne', quantite: 10 },
  { id: 'cercueil', intitule: 'Cercueil', quantite: 10 },
];

const DEFAULT_CATEGORIES: StockCategorie[] = [
  { id: 'materiaux', nom: 'Matériaux', icon: '🧰', items: MATERIAUX_DEFAULT },
  { id: 'plantes', nom: 'Plantes', icon: '🌿', items: PLANTES_DEFAULT },
  { id: 'materiels-medicaux', nom: 'Matériels médicaux', icon: '💊', items: MATERIELS_MEDICAUX_DEFAULT },
];

const ICONS = ['📦', '🌿', '💊', '🧪', '🩹', '🗃', '🧰', '⚗', '🧴', '📋'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, color: T.text, padding: '8px 12px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 5, display: 'block' };
const btn: React.CSSProperties = { fontFamily: MONO, fontSize: 14, letterSpacing: '0.10em', padding: '8px 14px', cursor: 'pointer', border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.25)', color: T.muted };
const btnGold: React.CSSProperties = { ...btn, border: `1px solid ${T.gold}`, color: T.gold, background: 'rgba(209,183,124,0.08)' };
const btnRed: React.CSSProperties = { ...btn, border: '1px solid rgba(180,70,70,0.5)', color: '#C87060', background: 'rgba(180,70,70,0.08)' };
const stepBtn: React.CSSProperties = { fontFamily: MONO, fontSize: 14, width: 28, height: 28, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.25)', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 };

export default function StockagePage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const isAdmin = checkIsAdmin(roles);
  const canEdit = isAdmin || roles.some(r => ['redm_directeur', 'redm_co_directeur', 'admin'].includes(r));
  const [categories, setCategories] = useState<StockCategorie[]>(DEFAULT_CATEGORIES);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [creatingCat, setCreatingCat] = useState(false);
  const [newCatNom, setNewCatNom] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);

  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const [delCatConfirm, setDelCatConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/redm-stockage')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.categories) && d.categories.length) setCategories(d.categories); })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !canEdit) return;
    const t = setTimeout(() => {
      fetch('/api/admin/redm-stockage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [categories, hydrated, canEdit]);

  function pushToast(titre: string, quantite: number) {
    const id = uid();
    setToasts(prev => [...prev, { id, titre, quantite }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5 * 60 * 1000);
  }

  function createCategory() {
    const nom = newCatNom.trim();
    if (!nom) return;
    setCategories(prev => [...prev, { id: uid(), nom, icon: newCatIcon || ICONS[0], items: [] }]);
    setNewCatNom(''); setNewCatIcon(ICONS[0]); setCreatingCat(false);
  }

  function renameCategory(id: string) {
    const nom = renameVal.trim();
    if (!nom) { setRenamingCat(null); return; }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, nom } : c));
    setRenamingCat(null);
  }

  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDelCatConfirm(null);
  }

  function addItem(catId: string) {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, items: [...c.items, { id: uid(), intitule: '', quantite: 10 }] } : c));
  }

  function renameItem(catId: string, itemId: string, intitule: string) {
    setCategories(prev => prev.map(c => c.id !== catId ? c : { ...c, items: c.items.map(it => it.id === itemId ? { ...it, intitule } : it) }));
  }

  function setQuantite(catId: string, itemId: string, newQty: number) {
    const q = Math.max(0, Math.floor(newQty) || 0);
    const cat = categories.find(c => c.id === catId);
    const item = cat?.items.find(i => i.id === itemId);
    if (cat && item && item.quantite >= SEUIL_ALERTE && q < SEUIL_ALERTE) {
      pushToast(`${cat.icon} ${cat.nom} — ${item.intitule || 'Article sans nom'}`, q);
    }
    setCategories(prev => prev.map(c => c.id !== catId ? c : { ...c, items: c.items.map(it => it.id === itemId ? { ...it, quantite: q } : it) }));
  }

  function removeItem(catId: string, itemId: string) {
    setCategories(prev => prev.map(c => c.id !== catId ? c : { ...c, items: c.items.filter(it => it.id !== itemId) }));
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Notifications stock faible */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: T.card, border: '1px solid rgba(168,32,32,0.5)', borderLeft: '4px solid #EADCB9', padding: '14px 18px', boxShadow: '0 6px 24px rgba(74,62,32,0.14)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 14, color: '#C87060', letterSpacing: '0.16em' }}>⚠ STOCK FAIBLE</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: MONO, fontSize: 14, padding: 0 }}>✕</button>
            </div>
            <div style={{ fontFamily: BODY, fontSize: 15, color: T.text }}>{t.titre}</div>
            <div style={{ fontFamily: MONO, fontSize: 14, color: '#C87060', marginTop: 4, letterSpacing: '0.06em' }}>RESTE {t.quantite} — PENSEZ À COMMANDER</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm/direction')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← RETOUR
        </button>
        <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.16em' }}>DISPENSAIRE · DIRECTION · GESTIONNAIRE DE STOCKAGE</span>
      </div>

      {/* Bandeau */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: T.gold, margin: '0 0 6px' }}>📦 Gestionnaire de Stockage</h1>
        <div style={{ fontFamily: BODY, fontSize: 16, color: T.muted }}>Inventaire et réapprovisionnement du dispensaire</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          ⚠ UNE ALERTE EST ENVOYÉE DÈS QU'UN ARTICLE DESCEND SOUS {SEUIL_ALERTE} UNITÉS
        </div>
      </div>

      {/* Grille des catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(209,183,124,0.08)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{cat.icon}</div>
              {renamingCat === cat.id ? (
                <input
                  style={{ ...inp, flex: 1, fontSize: 17, fontFamily: DISPLAY }}
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') renameCategory(cat.id); if (e.key === 'Escape') setRenamingCat(null); }}
                />
              ) : (
                <h2 style={{ fontFamily: DISPLAY, fontSize: 19, color: T.gold, margin: 0, flex: 1 }}>{cat.nom}</h2>
              )}
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', flexShrink: 0 }}>{cat.items.length} ART.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cat.items.length === 0 && (
                <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.08em', padding: '8px 0' }}>AUCUN ARTICLE</div>
              )}
              {cat.items.map(item => {
                const low = item.quantite < SEUIL_ALERTE;
                if (!canEdit) {
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: low ? 'rgba(168,32,32,0.10)' : 'rgba(0,0,0,0.15)', border: `1px solid ${low ? 'rgba(168,32,32,0.35)' : T.border}` }}>
                      <span style={{ flex: 1, fontFamily: BODY, fontSize: 15, color: low ? '#E08080' : T.text, padding: '4px 2px' }}>{item.intitule || 'Article sans nom'}</span>
                      <span style={{ width: 50, textAlign: 'center', fontFamily: MONO, fontSize: 15, color: low ? '#E08080' : T.text, padding: '4px 2px' }}>{item.quantite}</span>
                    </div>
                  );
                }
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: low ? 'rgba(168,32,32,0.10)' : 'rgba(0,0,0,0.15)', border: `1px solid ${low ? 'rgba(168,32,32,0.35)' : T.border}` }}>
                    <input
                      value={item.intitule}
                      onChange={e => renameItem(cat.id, item.id, e.target.value)}
                      placeholder="Nom de l'article"
                      style={{ flex: 1, fontFamily: BODY, fontSize: 15, background: 'transparent', border: 'none', outline: 'none', color: low ? '#E08080' : T.text, padding: '4px 2px', minWidth: 0 }}
                    />
                    <button onClick={() => setQuantite(cat.id, item.id, item.quantite - 1)} style={stepBtn}>−</button>
                    <input
                      type="number"
                      value={item.quantite}
                      onChange={e => setQuantite(cat.id, item.id, Number(e.target.value))}
                      style={{ width: 50, textAlign: 'center', fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.25)', border: `1px solid ${T.border}`, outline: 'none', color: low ? '#E08080' : T.text, padding: '4px 2px' }}
                    />
                    <button onClick={() => setQuantite(cat.id, item.id, item.quantite + 1)} style={stepBtn}>+</button>
                    <button onClick={() => removeItem(cat.id, item.id)} style={{ ...stepBtn, color: '#C87060', border: '1px solid rgba(180,70,70,0.4)' }}>✕</button>
                  </div>
                );
              })}
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => addItem(cat.id)} style={btnGold}>+ ARTICLE</button>
                {renamingCat === cat.id ? (
                  <>
                    <button onClick={() => renameCategory(cat.id)} style={btn}>✔</button>
                    <button onClick={() => setRenamingCat(null)} style={btn}>✕</button>
                  </>
                ) : (
                  <button onClick={() => { setRenamingCat(cat.id); setRenameVal(cat.nom); }} style={btn}>✎ RENOMMER</button>
                )}
                {delCatConfirm === cat.id ? (
                  <>
                    <button onClick={() => removeCategory(cat.id)} style={btnRed}>SUPPRIMER ?</button>
                    <button onClick={() => setDelCatConfirm(null)} style={btn}>✕</button>
                  </>
                ) : (
                  <button onClick={() => setDelCatConfirm(cat.id)} style={btnRed}>✕ SUPPRIMER</button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Nouvelle catégorie */}
        {!canEdit ? null : creatingCat ? (
          <div style={{ background: T.card, border: `1px solid ${T.gold}`, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={lbl}>ICÔNE</label>
              <select style={{ ...inp, width: '100%' }} value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)}>
                {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>NOM DE LA CATÉGORIE</label>
              <input style={{ ...inp, width: '100%' }} value={newCatNom} onChange={e => setNewCatNom(e.target.value)} placeholder="Ex : Matériel chirurgical" autoFocus
                onKeyDown={e => { if (e.key === 'Enter') createCategory(); }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createCategory} style={btnGold}>✔ CRÉER</button>
              <button onClick={() => { setCreatingCat(false); setNewCatNom(''); }} style={btn}>ANNULER</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreatingCat(true)}
            style={{ background: 'transparent', border: `1px dashed ${T.border}`, color: T.muted, fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}
          >
            + NOUVELLE CATÉGORIE
          </button>
        )}
      </div>
    </div>
  );
}
