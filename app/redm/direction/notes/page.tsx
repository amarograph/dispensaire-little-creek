'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';
import { RichEditor, RichContent, templateToRich, isRichEmpty } from '@/app/redm/_components/RichDoc';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

const CATEGORIES = ['Général', 'Réunion', 'Décision', 'Personnel', 'Rappel / À faire', 'Incident', 'Autre'];
const CAT_COL: Record<string, string> = {
  'Général': '#D1B77C', 'Réunion': '#5A8AB5', 'Décision': '#A8B991', 'Personnel': '#BAAAC6',
  'Rappel / À faire': '#E8B860', 'Incident': '#DF9A88', 'Autre': '#C8BEA5',
};
const CAT_ICON: Record<string, string> = {
  'Général': '📝', 'Réunion': '🗓', 'Décision': '⚖', 'Personnel': '👤', 'Rappel / À faire': '⏰', 'Incident': '⚠', 'Autre': '📌',
};

interface Note {
  id: string; titre: string; categorie: string; contenu: string; date: string;
  epinglee: boolean; auteur: string; auteurId: string; createdAt: string;
  modifieePar?: string; modifieeAt?: string;
}
interface Brouillon { id?: string; titre: string; categorie: string; contenu: string; date: string; epinglee: boolean; }

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

function rpDate(d = new Date()) {
  const s = d.toLocaleDateString('fr-FR').split('/'); s[2] = String(Number(s[2]) - 136); return s.join('/');
}
function rpDisplay(date: string): string {
  const p = (date ?? '').split('/'); if (p.length !== 3) return date;
  const y = Number(p[2]); if (isNaN(y)) return date;
  p[2] = String(y >= 1900 ? y - 136 : y); return p.join('/');
}
function tsDate(date: string): number {
  const p = (date ?? '').split('/').map(Number);
  return p.length === 3 && !p.some(isNaN) ? new Date(p[2] < 1900 ? p[2] + 136 : p[2], p[1] - 1, p[0]).getTime() : 0;
}
function textePlein(contenu: string): string {
  return (contenu ?? '').replace('<!--rich-->', '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

export default function RegistreNotesPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const canEdit = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [notes, setNotes]       = useState<Note[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [filtre, setFiltre]     = useState('');
  const [ordre, setOrdre]       = useState<'recent' | 'ancien'>('recent');
  const [ouvertes, setOuvertes] = useState<Set<string>>(new Set());
  const [edit, setEdit]         = useState<Brouillon | null>(null);
  const [saving, setSaving]     = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/redm-notes')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setNotes(Array.isArray(d.notes) ? d.notes : []))
      .catch(() => setError('Accès refusé ou erreur serveur.'))
      .finally(() => setLoading(false));
  }, []);

  async function appeler(payload: object): Promise<boolean> {
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/admin/redm-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? `Erreur ${r.status}`); return false; }
      if (Array.isArray(d.notes)) setNotes(d.notes);
      return true;
    } catch { setError('Erreur réseau.'); return false; }
    finally { setSaving(false); }
  }

  async function enregistrer() {
    if (!edit || !edit.titre.trim()) return;
    const ok = await appeler({ action: 'upsert', note: { ...edit, contenu: isRichEmpty(edit.contenu) ? '' : edit.contenu } });
    if (ok) setEdit(null);
  }

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const l = notes.filter(n =>
      (!filtre || n.categorie === filtre) &&
      (!q || n.titre.toLowerCase().includes(q) || textePlein(n.contenu).includes(q) || n.auteur.toLowerCase().includes(q)));
    const cmp = (a: Note, b: Note) => (tsDate(b.date) || Date.parse(b.createdAt)) - (tsDate(a.date) || Date.parse(a.createdAt));
    l.sort((a, b) => (Number(b.epinglee) - Number(a.epinglee)) || (ordre === 'recent' ? cmp(a, b) : -cmp(a, b)));
    return l;
  }, [notes, search, filtre, ordre]);

  const compteurs = useMemo(() => {
    const m: Record<string, number> = {};
    notes.forEach(n => { m[n.categorie] = (m[n.categorie] ?? 0) + 1; });
    return m;
  }, [notes]);

  function basculer(id: string) {
    setOuvertes(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  }

  const petit: React.CSSProperties = { fontFamily: MONO, fontSize: 14, padding: '6px 11px', cursor: 'pointer' };

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/redm/direction')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>DISPENSAIRE · DIRECTION · REGISTRE DES NOTES</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0 }}>📝 Registre des notes</h1>
            <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
              NOTES, DÉCISIONS ET COMPTES-RENDUS DE LA DIRECTION · VISIBLES PAR LA DIRECTION UNIQUEMENT
            </p>
          </div>
          {canEdit && (
            <button onClick={() => { setError(''); setEdit({ titre: '', categorie: 'Général', contenu: templateToRich(''), date: rpDate(), epinglee: false }); }}
              style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px 26px', cursor: 'pointer', background: 'rgba(209,183,124,0.18)', color: T.gold, border: '2px solid rgba(209,183,124,0.55)' }}>
              ✚ NOUVELLE NOTE
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span><button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'NOTES', v: notes.length, c: T.gold },
          { l: 'ÉPINGLÉES', v: notes.filter(n => n.epinglee).length, c: '#E8B860' },
          { l: 'À FAIRE', v: compteurs['Rappel / À faire'] ?? 0, c: CAT_COL['Rappel / À faire'] },
          { l: 'INCIDENTS', v: compteurs['Incident'] ?? 0, c: CAT_COL['Incident'] },
        ].map(s => (
          <div key={s.l} style={{ background: T.card, border: `1px solid ${T.border}`, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 3, letterSpacing: '0.1em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input style={{ ...inp, flex: 1, minWidth: 260 }} placeholder="🔍 Rechercher dans les titres, le contenu, l'auteur…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inp, width: 190, cursor: 'pointer' }} value={ordre} onChange={e => setOrdre(e.target.value as 'recent' | 'ancien')}>
          <option value="recent">Plus récentes d&apos;abord</option>
          <option value="ancien">Plus anciennes d&apos;abord</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {['', ...CATEGORIES].map(c => {
          const on = filtre === c;
          const col = c ? CAT_COL[c] : T.gold;
          const cnt = c ? (compteurs[c] ?? 0) : notes.length;
          return (
            <button key={c || 'tous'} onClick={() => setFiltre(c)}
              style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.08em', padding: '9px 16px', cursor: 'pointer', background: on ? `${col}18` : 'transparent', color: on ? col : T.dim, border: 'none', borderBottom: `3px solid ${on ? col : 'transparent'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {c ? `${CAT_ICON[c]} ${c}` : 'TOUTES'}
              <span style={{ marginLeft: 6, color: col, background: `${col}22`, padding: '1px 6px' }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 48, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT...</div>
      ) : visibles.length === 0 ? (
        <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: '60px 20px', textAlign: 'center', border: `1px dashed ${T.border}` }}>
          {notes.length === 0 ? 'Aucune note pour le moment — créez la première avec « Nouvelle note ».' : 'Aucune note ne correspond à cette recherche.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibles.map(n => {
            const col = CAT_COL[n.categorie] ?? T.muted;
            const ouverte = ouvertes.has(n.id);
            return (
              <div key={n.id} style={{ background: T.card, border: `1px solid ${n.epinglee ? '#E8B86060' : T.border}`, borderLeft: `4px solid ${col}`, overflow: 'hidden' }}>
                <div onClick={() => basculer(n.id)} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      {n.epinglee && <span title="Épinglée" style={{ fontSize: 16 }}>📌</span>}
                      <span style={{ fontFamily: DISPLAY, fontSize: 21, color: T.text }}>{n.titre}</span>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: col, background: `${col}18`, padding: '2px 8px', border: `1px solid ${col}40` }}>{CAT_ICON[n.categorie]} {n.categorie}</span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>
                      {rpDisplay(n.date)} · par {n.auteur}{n.modifieePar ? ` · modifiée par ${n.modifieePar}` : ''}
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {canEdit && (delConfirm === n.id ? (
                      <>
                        <button onClick={() => { setDelConfirm(null); appeler({ action: 'delete', id: n.id }); }} style={{ ...petit, background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                        <button onClick={() => setDelConfirm(null)} style={{ ...petit, background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button title={n.epinglee ? 'Désépingler' : 'Épingler en haut'} onClick={() => appeler({ action: 'pin', id: n.id, epinglee: !n.epinglee })}
                          style={{ ...petit, background: n.epinglee ? 'rgba(232,184,96,0.18)' : 'transparent', color: n.epinglee ? '#E8B860' : T.dim, border: `1px solid ${n.epinglee ? '#E8B86070' : T.border}` }}>📌</button>
                        <button title="Modifier" onClick={() => { setError(''); setEdit({ id: n.id, titre: n.titre, categorie: n.categorie, contenu: n.contenu, date: n.date, epinglee: n.epinglee }); }}
                          style={{ ...petit, background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                        <button title="Supprimer" onClick={() => setDelConfirm(n.id)} style={{ ...petit, background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                      </>
                    ))}
                    <span style={{ fontFamily: MONO, fontSize: 16, color: T.dim, marginLeft: 4 }}>{ouverte ? '▲' : '▼'}</span>
                  </div>
                </div>
                {ouverte && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: '18px 24px 22px', fontFamily: BODY, fontSize: 18, color: T.text, lineHeight: 1.8 }}>
                    {isRichEmpty(n.contenu ?? '') ? <span style={{ color: T.dim, fontStyle: 'italic' }}>Aucun contenu.</span> : <RichContent value={n.contenu} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Création / modification */}
      {edit && createPortal(
        <div onClick={() => !saving && setEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 20px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#102B3B', border: `2px solid ${T.gold}`, width: '100%', maxWidth: 1000, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: BODY }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, color: T.gold }}>{edit.id ? '✎ Modifier la note' : '✚ Nouvelle note'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px 170px', gap: 12 }}>
              <div><label style={lbl}>TITRE *</label><input style={inp} value={edit.titre} onChange={e => setEdit(x => x ? { ...x, titre: e.target.value } : x)} placeholder="Objet de la note" autoFocus /></div>
              <div><label style={lbl}>CATÉGORIE</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={edit.categorie} onChange={e => setEdit(x => x ? { ...x, categorie: e.target.value } : x)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                </select>
              </div>
              <div><label style={lbl}>DATE (RP)</label><input style={inp} value={edit.date} onChange={e => setEdit(x => x ? { ...x, date: e.target.value } : x)} placeholder="JJ/MM/AAAA" /></div>
            </div>
            <div>
              <label style={lbl}>CONTENU</label>
              <RichEditor value={edit.contenu} onChange={v => setEdit(x => x ? { ...x, contenu: v } : x)} minHeight={320} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 14, color: T.muted, cursor: 'pointer' }}>
              <input type="checkbox" checked={edit.epinglee} onChange={e => setEdit(x => x ? { ...x, epinglee: e.target.checked } : x)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              📌 Épingler cette note en haut du registre
            </label>
            {error && <div style={{ padding: '8px 12px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEdit(null)} disabled={saving} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button onClick={enregistrer} disabled={saving || !edit.titre.trim()}
                style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: 'rgba(209,183,124,0.2)', color: T.gold, border: '2px solid rgba(209,183,124,0.55)', opacity: saving || !edit.titre.trim() ? 0.5 : 1 }}>
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
