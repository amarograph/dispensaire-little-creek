'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY  = "'Central Station', 'Georgia', serif";
const BODY     = "'Cormorant Garamond', 'Georgia', serif";
const MONO     = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', paper: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5', sepia: '#D4B896' };

const GRADES      = ['Apprenti', 'Infirmier', 'Thérapeute', 'Médecin', 'Médecin Chef', 'Co-Directeur', 'Directeur', 'Préparateur de caisse'];
const DISPENSAIRES = ['Little Creek', 'Valentine', 'Rhodes', 'Tous'];
const SPECIALITES = ['Médecine générale', 'Chirurgie', 'Aliénisme', 'Plantes médicinales', 'Obstétrique', 'Traumatologie', 'Dentisterie', 'Ophtalmologie', 'Hygiène', 'Autre'];
const STATUTS     = ['En service', 'En congé', 'En mission', 'Suspendu'];

const GRADE_COL: Record<string, string> = {
  'Apprenti': '#888', 'Infirmier': '#5A8AB5', 'Thérapeute': '#BAAAC6',
  'Médecin': '#A8B991', 'Médecin Chef': '#D1B77C',
  'Co-Directeur': '#E8B860', 'Directeur': '#8B4040',
  'Préparateur de caisse': '#C8845A',
};
const STATUT_COL: Record<string, string> = {
  'En service': '#A8B991', 'En congé': '#D1B77C', 'En mission': '#5A8AB5', 'Suspendu': '#DF9A88',
};

const ROLE_PRIORITY = ['redm_directeur', 'redm_co_directeur', 'redm_medecin_chef', 'redm_medecin', 'redm_therapeute', 'redm_infirmier', 'redm_apprenti', 'redm_preparateur_caisse'] as const;
const ROLE_LABEL: Record<string, string> = {
  redm_directeur: 'Directeur', redm_co_directeur: 'Co-Directeur', redm_medecin_chef: 'Médecin en Chef',
  redm_medecin: 'Médecin', redm_therapeute: 'Thérapeute', redm_infirmier: 'Infirmier', redm_apprenti: 'Apprenti',
  redm_preparateur_caisse: 'Préparateur de caisse',
};
const ROLE_COL: Record<string, string> = {
  redm_directeur: '#E8B860', redm_co_directeur: '#E8B860', redm_medecin_chef: '#D8AC50',
  redm_medecin: '#D1B77C', redm_therapeute: '#BAAAC6', redm_infirmier: '#C87040', redm_apprenti: '#A05830',
  redm_preparateur_caisse: '#C8845A',
};
function topRole(roles: string[]) { for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r; return 'redm_preparateur_caisse'; }

interface Medecin {
  discord_id: string; username: string; avatar: string | null; roles: string[];
  rp_prenom: string; rp_nom: string; created_at: string;
  numero_compte: string; date_naissance: string; parcours_universitaire: string;
  portrait_url: string; age_rp: string; origine: string;
  grade: string; dispensaire: string; specialite: string; statut: string;
}

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 14, background: 'rgba(0,0,0,0.30)', border: `1px solid rgba(139,90,43,0.35)`, color: T.text, padding: '9px 13px', outline: 'none', boxSizing: 'border-box', width: '100%', borderRadius: 4 };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.14em', marginBottom: 5, display: 'block', textTransform: 'uppercase' };

function FichePanel({ medecin, onClose, onSave, saving }: {
  medecin: Medecin; onClose: () => void;
  onSave: (d: Partial<Medecin>) => void; saving: boolean;
}) {
  const [form, setForm] = useState({ ...medecin });

  function set(k: keyof Medecin, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function toggleSpec(s: string) {
    const list = (form.specialite ?? '').split(',').map(x => x.trim()).filter(Boolean);
    const next = list.includes(s) ? list.filter(x => x !== s) : [...list, s];
    setForm(p => ({ ...p, specialite: next.join(',') }));
  }

  const gc = GRADE_COL[form.grade]  ?? T.gold;
  const sc = STATUT_COL[form.statut] ?? '#888';
  const rc = ROLE_COL[topRole(medecin.roles)] ?? T.muted;
  const fullName = form.rp_prenom || form.rp_nom ? `${form.rp_prenom} ${form.rp_nom}`.trim() : '— Non renseigné —';
  const specList = (form.specialite ?? '').split(',').map(x => x.trim()).filter(Boolean);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, background: T.bg, borderLeft: `3px solid ${gc}`, zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slide-in 0.2s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '20px 26px 16px', borderBottom: `1px solid ${T.border}`, background: gc + '0A' }}>
          <div style={{ fontFamily: MONO, fontSize: 14, color: gc, letterSpacing: '0.18em', marginBottom: 6 }}>◈ FICHE MÉDECIN</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.text }}>{fullName}</div>
          <div style={{ fontFamily: MONO, fontSize: 14, color: T.muted, marginTop: 3 }}>@{medecin.username}</div>
        </div>

        <div style={{ padding: '20px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Portrait RP */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            {form.portrait_url ? (
              <img src={form.portrait_url} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${gc}60`, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: gc + '18', border: `2px dashed ${gc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: DISPLAY, fontSize: 28, color: gc + '60' }}>⚕</div>
            )}
            <div style={{ flex: 1 }}>
              <label style={lbl}>Portrait (URL)</label>
              <input style={inp} value={form.portrait_url} onChange={e => set('portrait_url', e.target.value)} placeholder="https://…" />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 9px', border: `1px solid ${rc}60`, background: rc + '18', color: rc, borderRadius: 3 }}>
                  {ROLE_LABEL[topRole(medecin.roles)] ?? '—'}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 9px', border: `1px solid ${gc}60`, background: gc + '18', color: gc, borderRadius: 3 }}>
                  ◆ {form.grade}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 9px', border: `1px solid ${sc}60`, background: sc + '18', color: sc, borderRadius: 3 }}>
                  ● {form.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Identité */}
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, letterSpacing: '0.18em', borderBottom: `1px solid rgba(209,183,124,0.18)`, paddingBottom: 8, marginBottom: 14 }}>IDENTITÉ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Prénom RP</label><input style={inp} value={form.rp_prenom} onChange={e => set('rp_prenom', e.target.value)} placeholder="François" /></div>
              <div><label style={lbl}>Nom RP</label><input style={inp} value={form.rp_nom} onChange={e => set('rp_nom', e.target.value)} placeholder="De Millet" /></div>
              <div><label style={lbl}>Âge</label><input style={inp} value={form.age_rp} onChange={e => set('age_rp', e.target.value)} placeholder="38 ans" /></div>
              <div><label style={lbl}>Origine</label><input style={inp} value={form.origine} onChange={e => set('origine', e.target.value)} placeholder="Louisiane" /></div>
            </div>
          </div>

          {/* Fonction médicale */}
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#DF9A88', letterSpacing: '0.18em', borderBottom: '1px solid rgba(200,48,48,0.22)', paddingBottom: 8, marginBottom: 14 }}>
              FONCTION MÉDICALE
              <span style={{ fontFamily: MONO, fontSize: 14, marginLeft: 12, color: '#DF9A88', opacity: 0.7, letterSpacing: '0.12em' }}>DIRECTION UNIQUEMENT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Grade</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.grade} onChange={e => set('grade', e.target.value)}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Dispensaire</label>
                  <select style={{ ...inp, cursor: 'pointer' }} value={form.dispensaire} onChange={e => set('dispensaire', e.target.value)}>
                    {DISPENSAIRES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Statut</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.statut} onChange={e => set('statut', e.target.value)}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Spécialité(s) — {specList.length > 0 ? `${specList.length} sélectionnée${specList.length > 1 ? 's' : ''}` : 'aucune'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', background: 'rgba(0,0,0,0.25)', border: `1px solid rgba(139,90,43,0.28)`, borderRadius: 4 }}>
                  {SPECIALITES.map(s => {
                    const active = specList.includes(s);
                    return (
                      <button key={s} onClick={() => toggleSpec(s)} style={{
                        padding: '4px 10px', fontFamily: BODY, fontSize: 14,
                        border: `1px solid ${active ? 'rgba(209,183,124,0.60)' : 'rgba(139,90,43,0.25)'}`,
                        borderRadius: 3,
                        background: active ? 'rgba(209,183,124,0.16)' : 'rgba(0,0,0,0.15)',
                        color: active ? T.gold : T.dim,
                        cursor: 'pointer', outline: 'none', transition: 'all 0.12s',
                      }}>
                        {active && <span style={{ marginRight: 5, fontSize: 14, color: T.gold }}>✔</span>}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fiche administrative */}
          <div>
            <div style={{ fontFamily: DISPLAY, fontSize: 14, color: T.gold, letterSpacing: '0.18em', borderBottom: `1px solid rgba(209,183,124,0.18)`, paddingBottom: 8, marginBottom: 14 }}>FICHE ADMINISTRATIVE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>N° de compte</label><input style={inp} value={form.numero_compte} onChange={e => set('numero_compte', e.target.value)} placeholder="00482" /></div>
                <div><label style={lbl}>Date de naissance</label><input style={inp} value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} placeholder="JJ/MM/AAAA" /></div>
              </div>
              <div>
                <label style={lbl}>Parcours universitaire</label>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: 90 }} value={form.parcours_universitaire} onChange={e => set('parcours_universitaire', e.target.value)} placeholder="Diplômes, formations, université d'origine…" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={() => onSave({
              rp_prenom: form.rp_prenom, rp_nom: form.rp_nom,
              age_rp: form.age_rp, origine: form.origine, portrait_url: form.portrait_url,
              grade: form.grade, dispensaire: form.dispensaire, specialite: form.specialite, statut: form.statut,
              numero_compte: form.numero_compte, date_naissance: form.date_naissance, parcours_universitaire: form.parcours_universitaire,
            })}
            disabled={saving}
            style={{ flex: 1, fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', padding: '11px 0', cursor: 'pointer', background: gc + '28', color: gc, border: `1px solid ${gc}60`, borderRadius: 4 }}>
            {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER'}
          </button>
          <button onClick={onClose}
            style={{ fontFamily: MONO, fontSize: 14, padding: '11px 18px', cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4 }}>
            ANNULER
          </button>
        </div>
      </div>
    </>
  );
}

export default function MedecinsPage() {
  const router = useRouter();
  const { roles: sessionRoles } = useRedmSession();
  const isAdmin = checkIsAdmin(sessionRoles);
  const canEdit = isAdmin || sessionRoles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState<Medecin | null>(null);
  const [saving,   setSaving]   = useState(false);

  const fetchMedecins = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/redm-medecins');
      if (!res.ok) { setError('Accès refusé ou erreur serveur.'); return; }
      const json = await res.json();
      setMedecins(json.medecins ?? []);
    } catch { setError('Impossible de charger la liste des médecins.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMedecins(); }, [fetchMedecins]);

  async function saveFiche(data: Partial<Medecin>) {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/redm-medecins', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_id: editing.discord_id, ...data }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(`Erreur lors de l'enregistrement : ${json?.error ?? res.statusText}`);
        return;
      }
      setMedecins(p => p.map(m => m.discord_id === editing.discord_id ? { ...m, ...data } : m));
      setEditing(null);
    } catch (e: any) {
      setError(`Erreur réseau : ${e?.message ?? 'inconnu'}`);
    } finally { setSaving(false); }
  }

  const GRADE_ORDER = ['Directeur', 'Co-Directeur', 'Médecin Chef', 'Médecin', 'Thérapeute', 'Infirmier', 'Apprenti', 'Préparateur de caisse'];

  const q = search.toLowerCase();
  const filtered = medecins
    .filter(m => `${m.rp_prenom} ${m.rp_nom} ${m.username}`.toLowerCase().includes(q))
    .sort((a, b) => {
      const ia = GRADE_ORDER.indexOf(a.grade);
      const ib = GRADE_ORDER.indexOf(b.grade);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @keyframes slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .med-card:hover { border-color: rgba(209,183,124,0.55) !important; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(74,62,32,0.14) !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={() => router.push('/redm/direction')}
            style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.18em' }}>DIRECTION · LISTE DES MÉDECINS</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.text, margin: 0 }}>Liste des Médecins</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginTop: 8 }}>
          PERSONNEL DU DISPENSAIRE — {medecins.length} MEMBRE{medecins.length !== 1 ? 'S' : ''}
        </p>
      </div>

      {/* Barre recherche */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un médecin…"
          style={{ ...inp, flex: 1, maxWidth: 320, fontSize: 14 }} />
        <button onClick={fetchMedecins} disabled={loading}
          style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.12em', padding: '9px 20px', cursor: 'pointer', background: T.gold + '20', color: T.gold, border: `1px solid ${T.gold}60`, borderRadius: 4 }}>
          {loading ? '⟳' : '↻ ACTUALISER'}
        </button>
      </div>

      {error ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 24, fontFamily: MONO, fontSize: 14, color: '#E88060', borderRadius: 6 }}>
          ⚠ {error}
        </div>
      ) : loading ? (
        <div style={{ padding: 60, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>Aucun médecin trouvé.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((m, i) => {
            const gc  = GRADE_COL[m.grade]   ?? T.gold;
            const sc  = STATUT_COL[m.statut] ?? '#888';
            const fullName = m.rp_prenom || m.rp_nom ? `${m.rp_prenom} ${m.rp_nom}`.trim() : `@${m.username}`;
            const specList = (m.specialite ?? '').split(',').map(x => x.trim()).filter(Boolean);

            // Séparateur de groupe par grade
            const prevGrade = i > 0 ? filtered[i - 1].grade : null;
            const showSep = i === 0 || m.grade !== prevGrade;

            return (
              <div key={m.discord_id}>
                {showSep && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i > 0 ? 18 : 0, marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: gc, letterSpacing: '0.18em', flexShrink: 0 }}>
                      ◆ {m.grade.toUpperCase()}
                    </span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${gc}50, transparent)` }} />
                  </div>
                )}
                <div className="med-card" onClick={() => canEdit && setEditing(m)} style={{
                  background: T.card,
                  border: `1px solid rgba(139,90,43,0.22)`,
                  borderLeft: `3px solid ${gc}`,
                  borderRadius: 6,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: canEdit ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}>
                  {/* Photo */}
                  {m.portrait_url ? (
                    <img src={m.portrait_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${gc}60`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: gc + '12', border: `2px dashed ${gc}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: DISPLAY, fontSize: 20, color: gc + '55' }}>⚕</div>
                  )}

                  {/* Nom RP + discord */}
                  <div style={{ minWidth: 180, flex: '0 0 180px' }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 18, color: T.text, lineHeight: 1.1 }}>
                      {(m.rp_prenom || m.rp_nom) ? `${m.rp_prenom} ${m.rp_nom}`.trim() : '— Non renseigné —'}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 14, color: T.muted, marginTop: 2 }}>@{m.username}</div>
                  </div>

                  {/* Grade + statut */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 9px', border: `1px solid ${gc}55`, background: gc + '14', color: gc, borderRadius: 3, letterSpacing: '0.08em' }}>
                      ◆ {m.grade}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 14, padding: '3px 9px', border: `1px solid ${sc}55`, background: sc + '14', color: sc, borderRadius: 3, letterSpacing: '0.08em' }}>
                      ● {m.statut}
                    </span>
                  </div>

                  {/* Dispensaire */}
                  <div style={{ minWidth: 100, flex: '0 0 100px', fontFamily: BODY, fontSize: 14, color: T.muted }}>
                    {m.dispensaire || '—'}
                  </div>

                  {/* Spécialités */}
                  <div style={{ flex: 1, fontFamily: BODY, fontSize: 14, color: T.dim, fontStyle: specList.length ? 'italic' : 'normal' }}>
                    {specList.length > 0 ? specList.join(', ') : <span style={{ color: T.dim + '80' }}>—</span>}
                  </div>

                  {canEdit && (
                    <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.1em', flexShrink: 0, opacity: 0.65 }}>
                      ✎ MODIFIER
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && editing && <FichePanel medecin={editing} onClose={() => setEditing(null)} onSave={saveFiche} saving={saving} />}
    </div>
  );
}
