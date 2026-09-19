'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Rye','Georgia',serif";
const BODY    = "'Josefin Slab','Georgia',serif";
const MONO    = "'Special Elite','Courier New',monospace";

const T = {
  bg: '#080508', card: '#0E080A', gold: '#C8A850', text: '#E8D9C0',
  muted: '#8B7355', border: 'rgba(120,20,20,0.35)', dim: '#5A4A38',
};

const GRADES = [
  { id: 'Directeur',    icon: '👑', color: '#C8A850' },
  { id: 'Co-Directeur', icon: '⭐', color: '#C8A850' },
  { id: 'Médecin Chef', icon: '🩺', color: '#A890C0' },
  { id: 'Médecin',      icon: '🩺', color: '#9080B8' },
  { id: 'Apprenti',     icon: '📚', color: '#887060' },
  { id: 'Infirmier',    icon: '💉', color: '#6888A0' },
];

function fmt$(n: number) {
  return n === 0 ? '—' : `$${n.toLocaleString('fr-FR')}`;
}

export default function SalairesPage() {
  const router = useRouter();
  const [salaires, setSalaires] = useState<Record<string, number>>({});
  const [form,     setForm]     = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [canEdit,  setCanEdit]  = useState(false);

  useEffect(() => {
    fetch('/api/admin/redm-salaires-grades')
      .then(r => {
        if (r.status === 403) { setCanEdit(false); return r.json(); }
        setCanEdit(true);
        return r.json();
      })
      .then(d => {
        if (d.salaires) {
          setSalaires(d.salaires);
          const init: Record<string, string> = {};
          for (const g of GRADES) init[g.id] = String(d.salaires[g.id] ?? 0);
          setForm(init);
        }
      })
      .catch(() => setError('Impossible de charger les salaires.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError(''); setSaved(false);
    const body: Record<string, number> = {};
    for (const g of GRADES) {
      const v = parseInt(form[g.id] ?? '0', 10);
      body[g.id] = isNaN(v) || v < 0 ? 0 : v;
    }
    try {
      const res = await fetch('/api/admin/redm-salaires-grades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.error ?? 'Erreur serveur');
        return;
      }
      const d = await res.json();
      setSalaires(d.salaires);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = {
    background: 'rgba(200,168,80,0.06)', border: `1px solid ${T.border}`,
    color: T.text, fontFamily: MONO, fontSize: 16,
    padding: '10px 14px', borderRadius: 6, width: '100%', boxSizing: 'border-box',
    outline: 'none', letterSpacing: '0.05em',
  };

  return (
    <div style={{ fontFamily: BODY, maxWidth: 680, margin: '0 auto', padding: '32px 0 60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@400;600;700&family=Special+Elite&display=swap');
        .sal-inp:focus { border-color: rgba(200,168,80,0.6) !important; background: rgba(200,168,80,0.10) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => router.push('/redm/direction')} style={{
          fontFamily: MONO, fontSize: 12, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted,
          padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em',
        }}>← RETOUR</button>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, letterSpacing: '0.18em' }}>
          DIRECTION · GRILLE SALARIALE
        </span>
      </div>

      <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.text, margin: '0 0 6px' }}>
        💰 Grille Salariale
      </h1>
      <p style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.14em', marginBottom: 36 }}>
        SALAIRE HEBDOMADAIRE PAR GRADE — DISPENSAIRE
      </p>

      {loading && (
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.muted, letterSpacing: '0.1em' }}>
          Chargement…
        </p>
      )}

      {!loading && (
        <>
          {/* Grille des grades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GRADES.map(g => (
              <div key={g.id} style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: '18px 22px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 16,
              }}>
                {/* Infos grade */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{g.icon}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: 20, color: g.color }}>
                      {g.id}
                    </span>
                  </div>
                  {canEdit ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        className="sal-inp"
                        type="number"
                        min={0}
                        step={50}
                        value={form[g.id] ?? '0'}
                        onChange={e => setForm(f => ({ ...f, [g.id]: e.target.value }))}
                        style={{ ...inp, width: 180 }}
                        placeholder="0"
                      />
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.1em' }}>
                        $ / SEMAINE
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted, letterSpacing: '0.1em' }}>
                      Lecture seule
                    </span>
                  )}
                </div>

                {/* Montant actuel */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.14em', marginBottom: 4 }}>
                    SALAIRE ACTUEL
                  </div>
                  <div style={{
                    fontFamily: DISPLAY, fontSize: 26,
                    color: salaires[g.id] ? T.gold : T.dim,
                  }}>
                    {fmt$(salaires[g.id] ?? 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton enregistrer */}
          {canEdit && (
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em',
                  background: saving ? 'rgba(200,168,80,0.12)' : 'rgba(200,168,80,0.18)',
                  border: `1px solid ${T.gold}`,
                  color: T.gold, padding: '12px 32px', cursor: saving ? 'not-allowed' : 'pointer',
                  borderRadius: 6, transition: 'all 0.2s',
                }}
              >
                {saving ? 'ENREGISTREMENT…' : '✔ ENREGISTRER LA GRILLE'}
              </button>

              {saved && (
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#50B450', letterSpacing: '0.1em' }}>
                  ✓ Grille enregistrée
                </span>
              )}
              {error && (
                <span style={{ fontFamily: MONO, fontSize: 12, color: '#C84040', letterSpacing: '0.1em' }}>
                  ✕ {error}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
