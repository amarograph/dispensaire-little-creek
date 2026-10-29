'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

interface Evenement {
  id: string; nom: string; icon: string; description: string; couleur: string; enigmes: string[];
  affiches: { id: string }[]; participants: { id: string; reponses: (boolean | null)[] }[];
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

export default function EvenementsPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const canEdit = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [hover, setHover]     = useState<string | null>(null);
  const [edit, setEdit]       = useState<{ id?: string; nom: string; icon: string; description: string } | null>(null);
  const [saving, setSaving]   = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/redm/evenements')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setEvenements(Array.isArray(d.evenements) ? d.evenements : []))
      .catch(() => setError('Impossible de charger les évènements.'))
      .finally(() => setLoading(false));
  }, []);

  async function appeler(payload: object): Promise<boolean> {
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/redm/evenements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? `Erreur ${r.status}`); return false; }
      if (Array.isArray(d.evenements)) setEvenements(d.evenements);
      return true;
    } catch { setError('Erreur réseau.'); return false; }
    finally { setSaving(false); }
  }

  async function enregistrer() {
    if (!edit || !edit.nom.trim()) return;
    const ok = await appeler(edit.id
      ? { action: 'update_event', id: edit.id, nom: edit.nom, icon: edit.icon, description: edit.description }
      : { action: 'create_event', nom: edit.nom, icon: edit.icon, description: edit.description });
    if (ok) setEdit(null);
  }

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <button onClick={() => router.push('/redm')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>DISPENSAIRE · ÉVÈNEMENTS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 40, color: T.gold, margin: 0 }}>🎃 Évènements</h1>
            <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginTop: 8 }}>
              UN DOSSIER PAR ÉVÈNEMENT · AFFICHES ET REGISTRE DES PARTICIPANTS
            </p>
          </div>
          {canEdit && (
            <button onClick={() => { setError(''); setEdit({ nom: '', icon: '🎉', description: '' }); }}
              style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '12px 26px', cursor: 'pointer', background: 'rgba(232,160,76,0.18)', color: '#E8A04C', border: '2px solid rgba(232,160,76,0.55)' }}>
              ✚ NOUVEAU DOSSIER
            </button>
          )}
        </div>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 48, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {evenements.map(e => {
            const h = hover === e.id; const col = e.couleur || '#E8A04C';
            const repondues = e.participants.filter(p => p.reponses.some(r => r !== null)).length;
            return (
              <div key={e.id} onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)} onClick={() => router.push(`/redm/evenements/${e.id}`)}
                style={{ background: h ? '#254B5C' : T.card, border: `2px solid ${h ? col + '90' : T.border}`, borderLeft: `4px solid ${h ? col : col + '70'}`, padding: '26px 24px', cursor: 'pointer', transition: 'all 0.18s', transform: h ? 'translateY(-2px)' : 'none', boxShadow: h ? '0 8px 30px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.35)' }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>{e.icon}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, color: T.text, marginBottom: 6 }}>{e.nom}</div>
                {e.description && <div style={{ fontFamily: BODY, fontSize: 16, color: T.dim, lineHeight: 1.5, marginBottom: 12 }}>{e.description}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: col, background: `${col}18`, padding: '3px 9px', border: `1px solid ${col}45` }}>🖼 {e.affiches.length} affiche{e.affiches.length > 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: col, background: `${col}18`, padding: '3px 9px', border: `1px solid ${col}45` }}>👥 {e.participants.length} participant{e.participants.length > 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: T.muted, background: 'rgba(255,255,255,0.05)', padding: '3px 9px', border: `1px solid ${T.border}` }}>🧩 {e.enigmes.length} énigmes · {repondues} en jeu</span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: h ? col : T.dim, letterSpacing: '0.1em' }}>→ OUVRIR LE DOSSIER</span>
                  {canEdit && (
                    <span onClick={ev => ev.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
                      {delConfirm === e.id ? (
                        <>
                          <button onClick={() => { setDelConfirm(null); appeler({ action: 'delete_event', id: e.id }); }} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 10px', cursor: 'pointer', background: '#8B404025', color: '#DF9A88', border: '1px solid #8B404060' }}>SUPPRIMER ?</button>
                          <button onClick={() => setDelConfirm(null)} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 8px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button title="Modifier" onClick={() => { setError(''); setEdit({ id: e.id, nom: e.nom, icon: e.icon, description: e.description }); }} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 10px', cursor: 'pointer', background: 'rgba(209,183,124,0.10)', color: T.gold, border: '1px solid rgba(209,183,124,0.3)' }}>✎</button>
                          <button title="Supprimer le dossier" onClick={() => setDelConfirm(e.id)} style={{ fontFamily: MONO, fontSize: 13, padding: '5px 10px', cursor: 'pointer', background: 'transparent', color: '#8B6060', border: '1px solid rgba(139,64,64,0.3)' }}>✕</button>
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {evenements.length === 0 && <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim, padding: 40, border: `1px dashed ${T.border}`, textAlign: 'center' }}>Aucun dossier pour l&apos;instant.</div>}
        </div>
      )}

      {edit && createPortal(
        <div onClick={() => !saving && setEdit(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={ev => ev.stopPropagation()} style={{ background: '#102B3B', border: '2px solid #E8A04C', width: '100%', maxWidth: 520, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 24, color: '#E8A04C' }}>{edit.id ? '✎ Modifier le dossier' : '✚ Nouveau dossier'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
              <div><label style={lbl}>NOM DE L&apos;ÉVÈNEMENT *</label><input style={inp} value={edit.nom} onChange={ev => setEdit(x => x ? { ...x, nom: ev.target.value } : x)} placeholder="ex : Noël 1890" autoFocus /></div>
              <div><label style={lbl}>ICÔNE</label><input style={{ ...inp, textAlign: 'center' }} value={edit.icon} onChange={ev => setEdit(x => x ? { ...x, icon: ev.target.value } : x)} /></div>
            </div>
            <div><label style={lbl}>DESCRIPTION</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={edit.description} onChange={ev => setEdit(x => x ? { ...x, description: ev.target.value } : x)} /></div>
            {error && <div style={{ padding: '8px 12px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEdit(null)} disabled={saving} style={{ fontFamily: MONO, fontSize: 14, padding: '11px 24px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}` }}>ANNULER</button>
              <button onClick={enregistrer} disabled={saving || !edit.nom.trim()} style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '11px 30px', cursor: 'pointer', background: 'rgba(232,160,76,0.2)', color: '#E8A04C', border: '2px solid rgba(232,160,76,0.55)', opacity: saving || !edit.nom.trim() ? 0.5 : 1 }}>
                {saving ? '⟳ …' : '✔ ENREGISTRER'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
