'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";

const T = {
  bg:     '#102B3B',
  card:   '#183746',
  border: 'rgba(139,90,43,0.30)',
  gold:   '#D1B77C',
  text:   '#EADCB9',
  muted:  '#C8BEA5',
  dim:    '#C8BEA5',
};

interface Dossier {
  id: string;
  owner_id: string;
  patient_nom: string;
  patient_prenom: string;
  patient_age: string;
  patient_metier: string;
  date_consult: string;
  type_seance: string;
  plainte: string;
  statut: string;
  confidentiel: boolean;
  created_at: string;
}

const inp: React.CSSProperties = {
  fontFamily: MONO, fontSize: 15,
  background: 'rgba(0,0,0,0.30)', border: `1px solid rgba(139,90,43,0.30)`,
  color: '#EADCB9', padding: '9px 14px', outline: 'none',
  boxSizing: 'border-box', width: '100%',
};

export default function CabinetArchivesCloturees() {
  const { discordId, roles } = useRedmSession();
  const router = useRouter();
  const isAdmin = checkIsAdmin(roles);

  const [dossiers,    setDossiers]    = useState<Dossier[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState('');
  const [restConfirm, setRestConfirm] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  useEffect(() => {
    fetch('/api/cabinet/dossiers', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const archived = (d.dossiers ?? []).filter((x: Dossier) => x.statut === 'CLÔTURÉE');
        setDossiers(archived);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function restore(d: Dossier) {
    const res = await fetch('/api/cabinet/dossiers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, statut: 'EN COURS' }),
    });
    const data = await res.json();
    if (data.ok) {
      setDossiers(prev => prev.filter(x => x.id !== d.id));
      showToast('↩ Dossier restauré dans les dossiers actifs');
    } else showToast('✗ ' + (data.error ?? 'Erreur'));
    setRestConfirm(null);
  }

  const filtered = dossiers.filter(d => {
    const q = search.toLowerCase();
    return !q
      || (d.patient_nom + ' ' + d.patient_prenom).toLowerCase().includes(q)
      || (d.plainte ?? '').toLowerCase().includes(q)
      || (d.patient_metier ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'); @keyframes fade-in{from{opacity:0}to{opacity:1}}`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 22, right: 24, zIndex: 9999, padding: '12px 22px', background: 'rgba(209,183,124,0.12)', border: '1px solid rgba(209,183,124,0.45)', borderRadius: 8, color: T.gold, fontFamily: MONO, fontSize: 15, animation: 'fade-in 0.2s ease' }}>
          {toast}
        </div>
      )}

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <button onClick={() => router.push('/redm/cabinet/archives')}
            style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← ARCHIVES
          </button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.16em' }}>CABINET · ARCHIVES CLÔTURÉES</span>
        </div>
        <div>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0, lineHeight: 1.1 }}>📦 Archives Clôturées</h1>
          <div style={{ fontFamily: MONO, fontSize: 14, color: T.muted, marginTop: 8, letterSpacing: '0.08em' }}>
            Dossiers clôturés (statut CLÔTURÉE) · {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Bandeau info */}
      <div style={{ background: 'rgba(90,74,106,0.08)', border: '1px solid rgba(90,74,106,0.28)', padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: '#9A8AB0', letterSpacing: '0.08em' }}>
          Ces dossiers ont été clôturés avec le statut <strong>CLÔTURÉE</strong>. Ils peuvent être restaurés au statut <em>EN COURS</em> si le patient reprend les séances.
        </span>
        <button onClick={() => router.push('/redm/cabinet/patients')}
          style={{ fontFamily: MONO, fontSize: 12, padding: '6px 14px', cursor: 'pointer', background: 'transparent', color: T.gold, border: `1px solid rgba(209,183,124,0.35)`, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.08em' }}>
          Voir les dossiers actifs →
        </button>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, plainte, métier…" style={inp} />
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: MONO, color: T.dim, fontSize: 17 }}>Chargement des archives…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '50px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: T.dim, marginBottom: 10 }}>
            {dossiers.length === 0 ? 'Aucun dossier clôturé' : 'Aucun résultat'}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: T.dim }}>
            {dossiers.length === 0 ? 'Clôturez un dossier depuis la liste patients pour qu\'il apparaisse ici.' : 'Modifiez la recherche.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(d => {
            const nomComplet = [d.patient_prenom, d.patient_nom].filter(Boolean).join(' ');
            const initiale = ((d.patient_prenom || d.patient_nom || '?')[0]).toUpperCase();
            const canRestore = isAdmin || discordId === d.owner_id;
            return (
              <div key={d.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: '3px solid rgba(90,74,106,0.60)', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', opacity: 0.82 }}>

                {/* Avatar */}
                <div style={{ width: 44, height: 44, background: 'rgba(90,74,106,0.18)', border: '1px solid rgba(90,74,106,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 22, color: '#9A8AB0' }}>{initiale}</span>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 20, color: T.muted, textDecoration: 'line-through', textDecorationColor: 'rgba(139,90,43,0.3)' }}>{nomComplet || d.patient_nom}</span>
                    {d.patient_age && <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>{d.patient_age} ans</span>}
                    {d.patient_metier && <span style={{ fontFamily: MONO, fontSize: 13, color: T.dim }}>· {d.patient_metier}</span>}
                    {d.confidentiel && <span style={{ fontFamily: MONO, fontSize: 12, color: '#DF9A88', background: '#8B404018', padding: '1px 6px' }}>CONFIDENTIEL</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: '#9A8AB0', background: 'rgba(90,74,106,0.15)', padding: '1px 7px', border: '1px solid rgba(90,74,106,0.30)' }}>CLÔTURÉE</span>
                    {d.type_seance && <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, background: 'rgba(209,183,124,0.08)', padding: '1px 7px' }}>{d.type_seance}</span>}
                    {d.date_consult && <span style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{d.date_consult}</span>}
                  </div>
                  {d.plainte && <div style={{ fontFamily: BODY, fontSize: 15, color: T.dim, marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>« {d.plainte} »</div>}
                </div>

                {/* Restaurer */}
                {canRestore && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {restConfirm === d.id
                      ? <>
                          <button onClick={() => restore(d)} style={{ fontFamily: MONO, fontSize: 11, padding: '5px 8px', cursor: 'pointer', background: 'rgba(209,183,124,0.15)', color: T.gold, border: '1px solid rgba(209,183,124,0.45)', letterSpacing: '0.05em' }}>RESTAURER</button>
                          <button onClick={() => setRestConfirm(null)} style={{ fontFamily: MONO, fontSize: 12, padding: '5px 6px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>✕</button>
                        </>
                      : <button onClick={() => setRestConfirm(d.id)} title="Restaurer dans les dossiers actifs" style={{ fontFamily: MONO, fontSize: 12, padding: '5px 12px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, letterSpacing: '0.06em' }}>↩ Restaurer</button>
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
