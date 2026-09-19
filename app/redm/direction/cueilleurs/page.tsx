'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DISPLAY = "'Burnic','Georgia',serif";
const BODY    = "'Cormorant Garamond','Georgia',serif";
const MONO    = "'Libre Baskerville','Courier New',monospace";

const T = {
  bg: '#EDE0C2', card: '#F4EAD8', gold: '#80682D', text: '#183746',
  muted: '#6A6D50', border: 'rgba(142,122,74,0.35)', dim: '#646850',
  green: '#6A9860', red: '#C84040',
};

interface Cueilleur {
  id: string;
  nom_rp: string;
  notes: string;
  actif: boolean;
  created_at: string;
}

interface ArchiveRow {
  id: string;
  date: string;
  cueilleur_id: string;
  cueilleur_nom: string;
  entrees: { plante: string; quantite: number; valeur: number }[];
  total_plantes: number;
  total_valeur: number;
  montant_saisi: number | null;
}

function fmt$(n: number) { return `$${n.toFixed(2)}`; }

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function CueilleursPage() {
  const router = useRouter();

  const [cueilleurs,   setCueilleurs]   = useState<Cueilleur[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [noTable,      setNoTable]      = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [delConfirm,   setDelConfirm]   = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [form, setForm] = useState({ nom_rp: '', notes: '', actif: true });

  // Récapitulatif global
  const [showRecap,    setShowRecap]    = useState(false);
  const [archives,     setArchives]     = useState<ArchiveRow[]>([]);
  const [loadingArch,  setLoadingArch]  = useState(false);

  useEffect(() => {
    fetch('/api/admin/redm-cueilleurs')
      .then(r => r.json())
      .then(d => {
        if (d.missing_table) { setNoTable(true); return; }
        setCueilleurs(d.cueilleurs ?? []);
      })
      .finally(() => setLoading(false));

    // Chargement des archives dès le départ (pour le top 3)
    setLoadingArch(true);
    fetch('/api/admin/redm-cueillettes?all=1')
      .then(r => r.json())
      .then(d => setArchives(d.archives ?? []))
      .finally(() => setLoadingArch(false));
  }, []);

  function toggleRecap() {
    setShowRecap(p => !p);
  }

  async function creer() {
    if (!form.nom_rp.trim()) return;
    setSaving(true);
    const r = await fetch('/api/admin/redm-cueilleurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (d.cueilleur) {
      setCueilleurs(p => [...p, d.cueilleur].sort((a, b) => a.nom_rp.localeCompare(b.nom_rp)));
      setForm({ nom_rp: '', notes: '', actif: true });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function supprimer(id: string) {
    await fetch(`/api/admin/redm-cueilleurs?id=${id}`, { method: 'DELETE' });
    setCueilleurs(p => p.filter(c => c.id !== id));
    setDelConfirm(null);
  }

  // Groupement par date pour le récapitulatif
  const byDate: { date: string; rows: ArchiveRow[]; totPlantes: number; totValeur: number; totPaye: number }[] = [];
  const seen = new Set<string>();
  for (const a of archives) {
    if (!seen.has(a.date)) {
      seen.add(a.date);
      const rows = archives.filter(x => x.date === a.date);
      byDate.push({
        date: a.date,
        rows,
        totPlantes: rows.reduce((s, x) => s + x.total_plantes, 0),
        totValeur:  rows.reduce((s, x) => s + x.total_valeur, 0),
        totPaye:    rows.reduce((s, x) => s + (x.montant_saisi ?? 0), 0),
      });
    }
  }
  const grandTotPlantes = byDate.reduce((s, d) => s + d.totPlantes, 0);
  const grandTotValeur  = byDate.reduce((s, d) => s + d.totValeur, 0);
  const grandTotPaye    = archives.reduce((s, a) => s + (a.montant_saisi ?? 0), 0);

  // Totaux par espèce (toutes archives confondues), triés alphabétiquement
  const parEspece: { plante: string; quantite: number; valeur: number }[] = [];
  const especeMap: Record<string, { quantite: number; valeur: number }> = {};
  for (const a of archives) {
    for (const e of (a.entrees ?? [])) {
      if (!especeMap[e.plante]) especeMap[e.plante] = { quantite: 0, valeur: 0 };
      especeMap[e.plante].quantite += e.quantite;
      especeMap[e.plante].valeur   += e.valeur;
    }
  }
  for (const [plante, totals] of Object.entries(especeMap)) {
    parEspece.push({ plante, ...totals });
  }
  parEspece.sort((a, b) => a.plante.localeCompare(b.plante, 'fr'));

  // Top 3 cueilleurs par total de plantes récoltées
  const totauxMap: Record<string, { nom: string; plantes: number; valeur: number }> = {};
  for (const a of archives) {
    const key = a.cueilleur_id || a.cueilleur_nom;
    if (!totauxMap[key]) totauxMap[key] = { nom: a.cueilleur_nom, plantes: 0, valeur: 0 };
    totauxMap[key].plantes += a.total_plantes;
    totauxMap[key].valeur  += a.total_valeur;
  }
  const top3 = Object.values(totauxMap).sort((a, b) => b.plantes - a.plantes).slice(0, 3);
  const MEDALS = ['🥇', '🥈', '🥉'];
  const MEDAL_COLORS = [T.gold, '#A0B0C0', '#B07840'];

  return (
    <div style={{ fontFamily: BODY, maxWidth: 900, margin: '0 auto', padding: '32px 0 60px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => router.push('/redm/direction')} style={{
          fontFamily: MONO, fontSize: 12, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted,
          padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em',
        }}>← RETOUR</button>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, letterSpacing: '0.18em' }}>
          DIRECTION · CUEILLEURS
        </span>
      </div>

      <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.text, margin: '0 0 6px' }}>
        🌿 Cueilleurs
      </h1>
      <p style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.14em', marginBottom: 24 }}>
        PROFILS & CALENDRIER DE CUEILLETTE — DISPENSAIRE
      </p>

      {/* ── TOP 3 ── */}
      {!loadingArch && top3.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${top3.length}, 1fr)`, gap: 12, marginBottom: 28 }}>
          {top3.map((c, i) => (
            <div key={c.nom} style={{
              background: T.card, border: `1px solid ${MEDAL_COLORS[i]}44`,
              borderTop: `3px solid ${MEDAL_COLORS[i]}`,
              padding: '18px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{MEDALS[i]}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.text, marginBottom: 6 }}>{c.nom}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: MEDAL_COLORS[i], fontWeight: 'bold', letterSpacing: '0.04em' }}>
                {c.plantes.toLocaleString('fr-FR')}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginTop: 2 }}>
                PLANTES · {fmt$(c.valeur)}
              </div>
            </div>
          ))}
        </div>
      )}
      {loadingArch && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.1em', marginBottom: 28 }}>
          Chargement du classement…
        </div>
      )}

      {/* Alerte table manquante */}
      {noTable && (
        <div style={{ background: 'rgba(200,100,40,0.10)', border: '1px solid rgba(200,100,40,0.35)', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: '#D48040', letterSpacing: '0.1em', margin: '0 0 12px' }}>
            ⚠ TABLES MANQUANTES — Exécuter la migration SQL dans Supabase (voir commentaire en tête de /api/admin/redm-cueilleurs/route.ts)
          </p>
        </div>
      )}

      {/* Boutons barre d'actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <button onClick={toggleRecap} style={{
          fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em',
          background: showRecap ? 'rgba(106,152,96,0.18)' : 'transparent',
          border: `1px solid ${showRecap ? T.green : T.border}`,
          color: showRecap ? T.green : T.muted,
          padding: '9px 22px', cursor: 'pointer',
        }}>
          {showRecap ? '✕ FERMER RÉCAPITULATIF' : '📊 RÉCAPITULATIF GLOBAL'}
        </button>

        <button onClick={() => setShowForm(p => !p)} style={{
          fontFamily: MONO, fontSize: 12, letterSpacing: '0.1em',
          background: showForm ? 'rgba(128,104,45,0.15)' : 'transparent',
          border: `1px solid ${T.gold}`, color: T.gold,
          padding: '9px 22px', cursor: 'pointer',
        }}>
          {showForm ? '✕ ANNULER' : '+ NOUVEAU CUEILLEUR'}
        </button>
      </div>

      {/* ── RÉCAPITULATIF GLOBAL ── */}
      {showRecap && (
        <div style={{ background: '#090610', border: `1px solid ${T.green}44`, borderRadius: 8, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.green}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: T.green, letterSpacing: '0.14em' }}>
              📊 RÉCAPITULATIF — TOUTES CUEILLETTES ARCHIVÉES
            </span>
            {/* Totaux globaux */}
            <div style={{ display: 'flex', gap: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.1em', marginBottom: 3 }}>TOTAL PLANTES</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.green }}>🌿 {grandTotPlantes}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.1em', marginBottom: 3 }}>VALEUR TOTALE</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.gold }}>{fmt$(grandTotValeur)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.1em', marginBottom: 3 }}>TOTAL PAYÉ</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 22, color: T.text }}>{fmt$(grandTotPaye)}</div>
              </div>
            </div>
          </div>

          {loadingArch ? (
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.1em', padding: '20px 20px' }}>Chargement…</p>
          ) : byDate.length === 0 ? (
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.dim, letterSpacing: '0.1em', padding: '20px 20px' }}>
              Aucune archive. Les entrées sont archivées automatiquement chaque nuit.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* En-tête */}
              <div style={{
                display: 'grid', gridTemplateColumns: '110px 1fr 100px 110px 100px',
                padding: '10px 20px', background: 'rgba(106,152,96,0.07)',
                borderBottom: `1px solid rgba(106,152,96,0.2)`,
              }}>
                {['DATE', 'CUEILLEUR', 'PLANTES', 'VALEUR', 'PAYÉ'].map(h => (
                  <span key={h} style={{ fontFamily: MONO, fontSize: 10, color: T.green, letterSpacing: '0.14em' }}>{h}</span>
                ))}
              </div>

              {byDate.map((groupe, gi) => (
                <div key={groupe.date}>
                  {/* Lignes de chaque cueilleur pour ce jour */}
                  {groupe.rows.map((a, ri) => (
                    <div key={a.id} style={{
                      display: 'grid', gridTemplateColumns: '110px 1fr 100px 110px 100px',
                      padding: '9px 20px', alignItems: 'center',
                      borderBottom: `1px solid rgba(142,122,74,0.10)`,
                      background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: ri === 0 ? T.muted : 'transparent' }}>
                        {ri === 0 ? fmtDate(a.date) : ''}
                      </span>
                      <span style={{ fontFamily: BODY, fontSize: 14, color: T.text }}>
                        🌿 {a.cueilleur_nom}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.green }}>
                        {a.total_plantes}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold }}>
                        {fmt$(a.total_valeur)}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: a.montant_saisi != null ? T.text : T.dim }}>
                        {a.montant_saisi != null ? fmt$(a.montant_saisi) : '—'}
                      </span>
                    </div>
                  ))}

                  {/* Sous-total du jour (affiché seulement si plusieurs cueilleurs ce jour) */}
                  {groupe.rows.length > 1 && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: '110px 1fr 100px 110px 100px',
                      padding: '7px 20px', alignItems: 'center',
                      background: 'rgba(106,152,96,0.06)',
                      borderBottom: gi < byDate.length - 1 ? `1px solid ${T.green}30` : 'none',
                      borderTop: `1px solid rgba(106,152,96,0.15)`,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: T.green, letterSpacing: '0.1em' }}></span>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: T.green, letterSpacing: '0.1em' }}>TOTAL JOUR</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.green, fontWeight: 700 }}>{groupe.totPlantes}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, fontWeight: 700 }}>{fmt$(groupe.totValeur)}</span>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted }}>{groupe.totPaye > 0 ? fmt$(groupe.totPaye) : '—'}</span>
                    </div>
                  )}

                  {/* Séparateur entre jours */}
                  {groupe.rows.length === 1 && gi < byDate.length - 1 && (
                    <div style={{ borderBottom: `1px solid rgba(142,122,74,0.18)` }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── PAR ESPÈCE ── */}
          {!loadingArch && parEspece.length > 0 && (
            <>
              <div style={{ padding: '14px 20px 10px', borderTop: `1px solid ${T.green}30`, marginTop: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.green, letterSpacing: '0.14em' }}>
                  🌿 PAR ESPÈCE — TOTAL TOUTES DATES CONFONDUES
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', padding: '0 20px 6px' }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: T.green, letterSpacing: '0.12em' }}>PLANTE</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: T.green, letterSpacing: '0.12em' }}>QTÉ TOTALE</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: T.green, letterSpacing: '0.12em' }}>VALEUR</span>
              </div>
              {parEspece.map((e, i) => (
                <div key={e.plante} style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 110px',
                  padding: '8px 20px', alignItems: 'center',
                  background: i % 2 === 0 ? 'rgba(106,152,96,0.04)' : 'transparent',
                  borderTop: `1px solid rgba(106,152,96,0.08)`,
                }}>
                  <span style={{ fontFamily: BODY, fontSize: 14, color: T.text }}>🌿 {e.plante}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: T.green }}>× {e.quantite}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold }}>{fmt$(+e.valeur.toFixed(2))}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div style={{ background: '#0D070E', border: `1px solid ${T.gold}40`, borderRadius: 8, padding: '24px', marginBottom: 24 }}>
          <p style={{ fontFamily: MONO, fontSize: 11, color: T.gold, letterSpacing: '0.15em', margin: '0 0 18px' }}>
            NOUVEAU CUEILLEUR
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                NOM RP *
              </label>
              <input
                value={form.nom_rp}
                onChange={e => setForm(p => ({ ...p, nom_rp: e.target.value }))}
                placeholder="Ex: Wyatt Tanner"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: BODY, fontSize: 15, color: T.text,
                  background: '#F5EBD5', border: `1px solid rgba(128,104,45,0.3)`,
                  padding: '10px 14px', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                NOTES
              </label>
              <input
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Ex: spécialiste racines..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: BODY, fontSize: 15, color: T.text,
                  background: '#F5EBD5', border: `1px solid rgba(128,104,45,0.3)`,
                  padding: '10px 14px', outline: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.actif}
                onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))}
              />
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>ACTIF</span>
            </label>
          </div>
          <button
            onClick={creer}
            disabled={saving || !form.nom_rp.trim()}
            style={{
              fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em',
              background: 'rgba(128,104,45,0.18)', border: `1px solid ${T.gold}`,
              color: T.gold, padding: '10px 28px', cursor: saving ? 'default' : 'pointer',
              opacity: !form.nom_rp.trim() ? 0.4 : 1,
            }}
          >
            {saving ? 'CRÉATION…' : '✓ CRÉER'}
          </button>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.muted, letterSpacing: '0.1em' }}>Chargement…</p>
      ) : cueilleurs.length === 0 && !noTable ? (
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em' }}>
          Aucun cueilleur enregistré.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {cueilleurs.map(c => (
            <div key={c.id} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: '20px 22px',
              borderLeft: `4px solid ${c.actif ? T.green : T.dim}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 19, color: T.text, marginBottom: 4 }}>
                    🌿 {c.nom_rp}
                  </div>
                  <span style={{
                    fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em',
                    padding: '2px 7px', borderRadius: 3,
                    background: c.actif ? 'rgba(100,160,90,0.15)' : 'rgba(90,74,56,0.3)',
                    color: c.actif ? T.green : T.dim,
                    border: `1px solid ${c.actif ? T.green + '60' : T.dim + '60'}`,
                  }}>
                    {c.actif ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>
              </div>

              {c.notes && (
                <p style={{ fontFamily: BODY, fontSize: 13, color: T.muted, margin: '0 0 14px', lineHeight: 1.5 }}>
                  {c.notes}
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => router.push(`/redm/direction/cueilleurs/${c.id}`)}
                  style={{
                    fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
                    background: 'rgba(128,104,45,0.12)', border: `1px solid ${T.gold}50`,
                    color: T.gold, padding: '7px 16px', cursor: 'pointer', flex: 1,
                  }}
                >
                  📅 CALENDRIER
                </button>
                {delConfirm === c.id ? (
                  <>
                    <button
                      onClick={() => supprimer(c.id)}
                      style={{
                        fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
                        background: 'rgba(200,40,40,0.15)', border: `1px solid #C8404060`,
                        color: T.red, padding: '7px 14px', cursor: 'pointer',
                      }}
                    >
                      CONFIRMER
                    </button>
                    <button
                      onClick={() => setDelConfirm(null)}
                      style={{
                        fontFamily: MONO, fontSize: 11,
                        background: 'transparent', border: `1px solid ${T.border}`,
                        color: T.muted, padding: '7px 14px', cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDelConfirm(c.id)}
                    style={{
                      fontFamily: MONO, fontSize: 11,
                      background: 'transparent', border: `1px solid ${T.border}`,
                      color: T.dim, padding: '7px 14px', cursor: 'pointer',
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
