'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const SEUIL_ALERTE = 5;

interface StockItem { id: string; intitule: string; quantite: number; }
interface StockCategorie { id: string; nom: string; icon: string; items: StockItem[]; }
interface Toast { id: string; titre: string; quantite: number; }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function InventairePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<StockCategorie[]>([]);
  const [hydrated,   setHydrated]   = useState(false);
  const [error,      setError]     = useState('');
  const [toasts,     setToasts]    = useState<Toast[]>([]);

  useEffect(() => {
    fetch('/api/admin/redm-stockage')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const cats: StockCategorie[] = Array.isArray(d.categories) ? d.categories : [];
        setCategories(cats);
        const low = cats.flatMap(c => c.items.filter(it => it.quantite < SEUIL_ALERTE).map(it => ({ id: uid(), titre: `${c.icon} ${c.nom} — ${it.intitule || 'Article sans nom'}`, quantite: it.quantite })));
        setToasts(low);
      })
      .catch(() => setError("Accès refusé ou impossible de charger l'inventaire."))
      .finally(() => setHydrated(true));
  }, []);

  const totalArticles = categories.reduce((s, c) => s + c.items.length, 0);
  const totalBas       = categories.reduce((s, c) => s + c.items.filter(it => it.quantite < SEUIL_ALERTE).length, 0);

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Notifications stock faible */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: T.card, border: '1px solid rgba(168,32,32,0.5)', borderLeft: '4px solid #EADCB9', padding: '14px 18px', boxShadow: '0 6px 24px rgba(74,62,32,0.14)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#C87060', letterSpacing: '0.16em' }}>⚠ STOCK FAIBLE</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: MONO, fontSize: 14, padding: 0 }}>✕</button>
            </div>
            <div style={{ fontFamily: BODY, fontSize: 15, color: T.text }}>{t.titre}</div>
            <div style={{ fontFamily: MONO, fontSize: 12, color: '#C87060', marginTop: 4, letterSpacing: '0.06em' }}>RESTE {t.quantite} — PENSEZ À COMMANDER</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm/direction')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← RETOUR
        </button>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.16em' }}>DISPENSAIRE · DIRECTION · INVENTAIRE</span>
      </div>

      {/* Bandeau */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 36, color: T.gold, margin: '0 0 6px' }}>🔒 Inventaire</h1>
        <div style={{ fontFamily: BODY, fontSize: 16, color: T.muted }}>Consultation en lecture seule — modifications via le Gestionnaire de Stockage</div>
        <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          ⚠ UNE ALERTE EST ENVOYÉE DÈS QU'UN ARTICLE DESCEND SOUS {SEUIL_ALERTE} UNITÉS
        </div>
      </div>

      {!hydrated ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '30px', textAlign: 'center', border: `1px dashed ${T.border}` }}>Chargement…</div>
      ) : error ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: '#C87060', padding: '30px', textAlign: 'center', border: `1px solid rgba(180,70,70,0.4)` }}>{error}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { l: 'CATÉGORIES', v: String(categories.length), c: T.gold },
              { l: 'ARTICLES',   v: String(totalArticles),      c: T.gold },
              { l: 'STOCK BAS',  v: String(totalBas),           c: totalBas > 0 ? '#E08080' : '#A8B991' },
            ].map(s => (
              <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, color: s.c }}>{s.v}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, marginTop: 3, letterSpacing: '0.1em' }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(209,183,124,0.08)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{cat.icon}</div>
                  <h2 style={{ fontFamily: DISPLAY, fontSize: 19, color: T.gold, margin: 0, flex: 1 }}>{cat.nom}</h2>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em', flexShrink: 0 }}>{cat.items.length} ART.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.items.length === 0 && (
                    <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.08em', padding: '8px 0' }}>AUCUN ARTICLE</div>
                  )}
                  {cat.items.map(item => {
                    const low = item.quantite < SEUIL_ALERTE;
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: low ? 'rgba(168,32,32,0.10)' : 'rgba(0,0,0,0.15)', border: `1px solid ${low ? 'rgba(168,32,32,0.35)' : T.border}` }}>
                        <span style={{ flex: 1, fontFamily: BODY, fontSize: 15, color: low ? '#E08080' : T.text, padding: '4px 2px' }}>{item.intitule || 'Article sans nom'}</span>
                        <span style={{ width: 50, textAlign: 'center', fontFamily: MONO, fontSize: 15, color: low ? '#E08080' : T.text, padding: '4px 2px' }}>{item.quantite}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '30px', textAlign: 'center', border: `1px dashed ${T.border}`, gridColumn: '1 / -1' }}>
                Aucune catégorie enregistrée pour le moment.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
