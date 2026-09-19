'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const DISPLAY = "'Rye','Georgia',serif";
const BODY    = "'Josefin Slab','Georgia',serif";
const MONO    = "'Special Elite','Courier New',monospace";

const T = {
  bg: '#080508', card: '#0E0810', gold: '#C8A850', text: '#E8D9C0',
  muted: '#8B7355', border: 'rgba(120,20,20,0.35)', dim: '#5A4A38',
  green: '#6A9860', red: '#C84040', greenFaint: 'rgba(100,160,90,0.12)',
};

const PRIX = 0.05;

const PLANTES = [
  'Absinthe', 'Sauge Rouge', 'Pavot somnifère', 'Sauge du colibris',
  'Achillée millefeuille', 'Aloe Verra', 'Alaska Ginseng', 'Rhubarbe',
  "Verge d'or", 'Échinacée', 'Cassis', 'Aubépine', 'Figue de barbarie',
  'Champignon Bolai Bai', 'Panax quinquefolius', 'Camomille',
  'Perce Neige Viollet', 'Amanite Tulouche', 'Menthe',
] as const;

interface Cueilleur { id: string; nom_rp: string; notes: string; actif: boolean; }
interface ArchiveJour {
  id: string; date: string; cueilleur_nom: string;
  entrees: { plante: string; quantite: number; valeur: number }[];
  total_plantes: number; total_valeur: number;
  montant_saisi: number | null; archived_at: string;
}

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function fmt$(n: number) { return `$${n.toFixed(2)}`; }

function dateToStr(j: number, m: number, a: number) {
  return `${a}-${String(m).padStart(2,'0')}-${String(j).padStart(2,'0')}`;
}

export default function CueilleurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [cueilleur,    setCueilleur]    = useState<Cueilleur | null>(null);
  const [tab,          setTab]          = useState<'saisie' | 'archives'>('saisie');

  // Saisie — date en 1890
  const _now = new Date();
  const [dateJour,  setDateJour]  = useState(_now.getDate());
  const [dateMois,  setDateMois]  = useState(_now.getMonth() + 1);
  const [dateAnnee, setDateAnnee] = useState(1890);
  const date = dateToStr(dateJour, dateMois, dateAnnee);
  const [plantMap,     setPlantMap]     = useState<Record<string, number>>({});
  const [montant,      setMontant]      = useState('');
  const [loadingDay,   setLoadingDay]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savedOk,      setSavedOk]      = useState(false);

  // Archives
  const [archives,     setArchives]     = useState<ArchiveJour[]>([]);
  const [loadingArch,  setLoadingArch]  = useState(false);
  const [expandedArch, setExpandedArch] = useState<string | null>(null);

  // Édition profil
  const [editProfil,   setEditProfil]   = useState(false);
  const [profilForm,   setProfilForm]   = useState({ nom_rp: '', notes: '', actif: true });
  const [savingProfil, setSavingProfil] = useState(false);

  // Chargement profil
  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/redm-cueilleurs?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.cueilleur) {
          setCueilleur(d.cueilleur);
          setProfilForm({ nom_rp: d.cueilleur.nom_rp, notes: d.cueilleur.notes, actif: d.cueilleur.actif });
        }
      });
  }, [id]);

  // Chargement entrées quand la date change
  const chargerDate = useCallback(() => {
    if (!id || !date) return;
    setLoadingDay(true);
    setSavedOk(false);
    fetch(`/api/admin/redm-cueillettes?cueilleur_id=${id}&date=${date}`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {};
        for (const p of PLANTES) map[p] = 0;
        for (const e of (d.entrees ?? [])) map[e.plante] = e.quantite;
        setPlantMap(map);
        setMontant(d.montant_saisi != null ? String(d.montant_saisi) : '');
      })
      .finally(() => setLoadingDay(false));
  }, [id, date]);

  useEffect(() => { chargerDate(); }, [chargerDate]);

  // Chargement archives
  const chargerArchives = useCallback(() => {
    if (!id) return;
    setLoadingArch(true);
    fetch(`/api/admin/redm-cueillettes?cueilleur_id=${id}&archives=1`)
      .then(r => r.json())
      .then(d => setArchives(d.archives ?? []))
      .finally(() => setLoadingArch(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'archives') chargerArchives();
  }, [tab, chargerArchives]);

  function totalJour()  { return Object.values(plantMap).reduce((s, q) => s + q, 0); }
  function valeurJour() { return +(totalJour() * PRIX).toFixed(2); }

  async function sauvegarder() {
    if (!cueilleur) return;
    setSaving(true);
    const entrees = PLANTES
      .filter(p => (plantMap[p] ?? 0) > 0)
      .map(p => ({ plante: p, quantite: plantMap[p] }));

    await fetch('/api/admin/redm-cueillettes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cueilleur_id:  id,
        date,
        cueilleur_nom: cueilleur.nom_rp,
        entrees,
        montant_saisi: montant !== '' ? montant : undefined,
      }),
    });
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  }

  async function sauvegarderProfil() {
    setSavingProfil(true);
    const r = await fetch('/api/admin/redm-cueilleurs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...profilForm }),
    });
    const d = await r.json();
    if (d.cueilleur) { setCueilleur(d.cueilleur); setEditProfil(false); }
    setSavingProfil(false);
  }

  async function archiverMaintenant() {
    await fetch('/api/cron/archive-cueillettes');
    chargerArchives();
  }

  if (!cueilleur) {
    return <div style={{ fontFamily: MONO, padding: 40, color: T.muted, letterSpacing: '0.1em' }}>Chargement…</div>;
  }

  return (
    <div style={{ fontFamily: BODY, maxWidth: 900, margin: '0 auto', padding: '32px 0 60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@400;600;700&family=Special+Elite&display=swap');
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        .plant-row:hover { background: rgba(200,168,80,0.05) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => router.push('/redm/direction/cueilleurs')} style={{
          fontFamily: MONO, fontSize: 12, background: 'transparent',
          border: `1px solid ${T.border}`, color: T.muted,
          padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em',
        }}>← CUEILLEURS</button>
        <span style={{ fontFamily: MONO, fontSize: 12, color: T.gold, letterSpacing: '0.18em' }}>
          DIRECTION · CUEILLEURS · {cueilleur.nom_rp.toUpperCase()}
        </span>
      </div>

      {/* Profil */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px 24px', marginBottom: 28 }}>
        {editProfil ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>NOM RP</label>
                <input value={profilForm.nom_rp} onChange={e => setProfilForm(p => ({ ...p, nom_rp: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: BODY, fontSize: 15, color: T.text, background: '#0A050C', border: `1px solid rgba(200,168,80,0.3)`, padding: '9px 12px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>NOTES</label>
                <input value={profilForm.notes} onChange={e => setProfilForm(p => ({ ...p, notes: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: BODY, fontSize: 15, color: T.text, background: '#0A050C', border: `1px solid rgba(200,168,80,0.3)`, padding: '9px 12px', outline: 'none' }} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14 }}>
              <input type="checkbox" checked={profilForm.actif} onChange={e => setProfilForm(p => ({ ...p, actif: e.target.checked }))} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>ACTIF</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={sauvegarderProfil} disabled={savingProfil} style={{ fontFamily: MONO, fontSize: 11, background: 'rgba(200,168,80,0.15)', border: `1px solid ${T.gold}`, color: T.gold, padding: '8px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                {savingProfil ? 'SAUVEGARDE…' : '✓ ENREGISTRER'}
              </button>
              <button onClick={() => setEditProfil(false)} style={{ fontFamily: MONO, fontSize: 11, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 16px', cursor: 'pointer' }}>
                ANNULER
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 28, color: T.text, margin: '0 0 6px' }}>🌿 {cueilleur.nom_rp}</h2>
              {cueilleur.notes && <p style={{ fontFamily: BODY, fontSize: 14, color: T.muted, margin: '0 0 8px' }}>{cueilleur.notes}</p>}
              <span style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 3,
                background: cueilleur.actif ? 'rgba(100,160,90,0.15)' : 'rgba(90,74,56,0.3)',
                color: cueilleur.actif ? T.green : T.dim,
                border: `1px solid ${cueilleur.actif ? T.green + '60' : T.dim + '60'}`,
              }}>
                {cueilleur.actif ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>
            <button onClick={() => setEditProfil(true)} style={{ fontFamily: MONO, fontSize: 11, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.08em' }}>
              ✎ MODIFIER
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: `1px solid ${T.border}` }}>
        {(['saisie', 'archives'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em',
            background: 'transparent', border: 'none',
            color: tab === t ? T.gold : T.muted,
            padding: '10px 24px', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t ? T.gold : 'transparent'}`,
            marginBottom: -1,
          }}>
            {t === 'saisie' ? '📋 SAISIE' : '📦 ARCHIVES'}
          </button>
        ))}
      </div>

      {/* ── TAB SAISIE ── */}
      {tab === 'saisie' && (
        <div style={{ background: '#0D070F', border: `1px solid ${T.border}`, borderRadius: 8, padding: '28px' }}>

          {/* Sélecteur de date (1890) */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {/* Jour */}
            <div>
              <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>JOUR</label>
              <select
                value={dateJour}
                onChange={e => setDateJour(Number(e.target.value))}
                style={{ fontFamily: MONO, fontSize: 15, color: T.text, background: '#0A050C', border: `1px solid rgba(200,168,80,0.4)`, padding: '10px 12px', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Mois */}
            <div>
              <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>MOIS</label>
              <select
                value={dateMois}
                onChange={e => setDateMois(Number(e.target.value))}
                style={{ fontFamily: MONO, fontSize: 15, color: T.text, background: '#0A050C', border: `1px solid rgba(200,168,80,0.4)`, padding: '10px 12px', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
              >
                {MOIS_FR.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Année */}
            <div>
              <label style={{ fontFamily: MONO, fontSize: 10, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>ANNÉE</label>
              <input
                type="number"
                value={dateAnnee}
                onChange={e => setDateAnnee(Number(e.target.value))}
                style={{ width: 90, fontFamily: MONO, fontSize: 15, color: T.gold, background: '#0A050C', border: `1px solid rgba(200,168,80,0.4)`, padding: '10px 12px', outline: 'none', colorScheme: 'dark' }}
              />
            </div>

            {/* Bouton aujourd'hui (jour+mois courants, 1890) */}
            <button
              onClick={() => { const t = new Date(); setDateJour(t.getDate()); setDateMois(t.getMonth() + 1); setDateAnnee(1890); }}
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', background: 'transparent', border: `1px solid ${T.border}`, color: T.dim, padding: '10px 14px', cursor: 'pointer' }}
            >
              AUJOURD'HUI
            </button>

            {/* Affichage lisible — weekday calculé sur l'année réelle (2026) pour avoir le bon jour de semaine */}
            <span style={{ fontFamily: DISPLAY, fontSize: 18, color: T.text, paddingBottom: 4 }}>
              {(() => {
                const realYear = new Date().getFullYear();
                const dow = new Date(realYear, dateMois - 1, dateJour).toLocaleDateString('fr-FR', { weekday: 'long' });
                return `${dow} ${dateJour} ${MOIS_FR[dateMois - 1].toLowerCase()} ${dateAnnee}`;
              })()}
            </span>
          </div>

          {loadingDay ? (
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.1em' }}>Chargement…</p>
          ) : (
            <>
              {/* Grille plantes — 2 colonnes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 32px', marginBottom: 28 }}>
                {PLANTES.map(plante => {
                  const qty = plantMap[plante] ?? 0;
                  const val = +(qty * PRIX).toFixed(2);
                  return (
                    <div key={plante} className="plant-row" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 8px', borderRadius: 4,
                      borderBottom: `1px solid rgba(120,20,20,0.14)`,
                      transition: 'background 0.1s',
                    }}>
                      <span style={{ fontFamily: BODY, fontSize: 14, color: qty > 0 ? T.text : T.dim, flex: 1 }}>
                        🌿 {plante}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={qty || ''}
                        placeholder="0"
                        onChange={e => setPlantMap(p => ({ ...p, [plante]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        style={{
                          width: 70, fontFamily: MONO, fontSize: 15, color: T.gold,
                          background: qty > 0 ? 'rgba(200,168,80,0.10)' : 'rgba(200,168,80,0.04)',
                          border: `1px solid ${qty > 0 ? 'rgba(200,168,80,0.35)' : 'rgba(200,168,80,0.15)'}`,
                          padding: '6px 8px', textAlign: 'right', outline: 'none',
                          transition: 'all 0.12s',
                        }}
                      />
                      <span style={{ fontFamily: MONO, fontSize: 11, color: qty > 0 ? T.green : T.dim, width: 58, textAlign: 'right' }}>
                        {qty > 0 ? fmt$(val) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Barre totaux + montant payé + bouton */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 4 }}>
                    TOTAL PLANTES
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 26, color: T.green }}>🌿 {totalJour()}</span>
                </div>

                <div>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 4 }}>
                    VALEUR CALCULÉE
                  </span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 26, color: T.gold }}>{fmt$(valeurJour())}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: T.dim, marginLeft: 7 }}>
                    ({totalJour()} × $0.05)
                  </span>
                </div>

                <div>
                  <label style={{ fontFamily: MONO, fontSize: 9, color: T.muted, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>
                    MONTANT PAYÉ ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    placeholder={valeurJour() > 0 ? String(valeurJour()) : '0.00'}
                    style={{
                      width: 130, fontFamily: MONO, fontSize: 17, color: T.text,
                      background: 'rgba(200,168,80,0.06)', border: `1px solid rgba(200,168,80,0.35)`,
                      padding: '9px 14px', outline: 'none',
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                <button
                  onClick={sauvegarder}
                  disabled={saving}
                  style={{
                    fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em',
                    background: savedOk ? 'rgba(100,160,90,0.25)' : 'rgba(100,160,90,0.18)',
                    border: `1px solid ${T.green}`,
                    color: T.green, padding: '12px 32px', cursor: saving ? 'default' : 'pointer',
                    marginLeft: 'auto', transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'SAUVEGARDE…' : savedOk ? '✓ ENREGISTRÉ' : '💾 ENREGISTRER'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB ARCHIVES ── */}
      {tab === 'archives' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={archiverMaintenant} style={{
              fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em',
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.muted, padding: '7px 16px', cursor: 'pointer',
            }}>
              ⟳ ARCHIVER HIER
            </button>
          </div>

          {loadingArch ? (
            <p style={{ fontFamily: MONO, fontSize: 12, color: T.muted, letterSpacing: '0.1em' }}>Chargement…</p>
          ) : archives.length === 0 ? (
            <p style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.1em' }}>
              Aucune archive. Les données sont archivées automatiquement chaque nuit à minuit (UTC).
            </p>
          ) : (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px 120px 110px', background: 'rgba(200,168,80,0.06)', borderBottom: `1px solid ${T.border}`, padding: '10px 16px' }}>
                {['DATE', 'PLANTES', 'TOTAL QTÉ', 'VALEUR', 'PAYÉ'].map(h => (
                  <span key={h} style={{ fontFamily: MONO, fontSize: 10, color: T.gold, letterSpacing: '0.14em' }}>{h}</span>
                ))}
              </div>

              {archives.map((a, i) => (
                <div key={a.id}>
                  <div
                    onClick={() => setExpandedArch(expandedArch === a.id ? null : a.id)}
                    style={{
                      display: 'grid', gridTemplateColumns: '140px 1fr 110px 120px 110px',
                      padding: '12px 16px', alignItems: 'center', cursor: 'pointer',
                      borderBottom: i < archives.length - 1 && expandedArch !== a.id ? `1px solid rgba(120,20,20,0.18)` : 'none',
                      background: expandedArch === a.id ? 'rgba(200,168,80,0.04)' : 'transparent',
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted }}>
                      {new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span style={{ fontFamily: BODY, fontSize: 13, color: T.text }}>
                      {a.entrees.slice(0, 3).map(e => e.plante).join(', ')}
                      {a.entrees.length > 3 && ` +${a.entrees.length - 3}`}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: T.green }}>🌿 {a.total_plantes}</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold }}>{fmt$(a.total_valeur)}</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: a.montant_saisi != null ? T.text : T.dim }}>
                      {a.montant_saisi != null ? fmt$(a.montant_saisi) : '—'}
                    </span>
                  </div>

                  {expandedArch === a.id && (
                    <div style={{ padding: '0 16px 16px', borderBottom: `1px solid rgba(120,20,20,0.18)`, background: 'rgba(200,168,80,0.02)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {a.entrees.map(e => (
                          <span key={e.plante} style={{
                            fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em',
                            padding: '4px 10px', background: T.greenFaint,
                            border: `1px solid ${T.green}40`, color: T.green, borderRadius: 3,
                          }}>
                            🌿 {e.plante} × {e.quantite} = {fmt$(e.valeur)}
                          </span>
                        ))}
                      </div>
                      {a.archived_at && (
                        <p style={{ fontFamily: MONO, fontSize: 10, color: T.dim, marginTop: 10 }}>
                          Archivé le {new Date(a.archived_at).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
