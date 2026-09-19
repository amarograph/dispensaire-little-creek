'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY  = "'Rye', 'Georgia', serif";
const BODY     = "'Josefin Slab', 'Georgia', serif";
const MONO     = "'Special Elite', 'Courier New', monospace";
const T = {
  bg:     '#1A1208',
  card:   '#1F1610',
  paper:  '#1C1208',
  border: 'rgba(139,90,43,0.30)',
  gold:   '#C8A850',
  text:   '#E8D9C0',
  muted:  '#8B7355',
  dim:    '#5A4A35',
  sepia:  '#D4B896',
};

interface Entretien {
  id: string;
  archived: boolean;
  discord_id: string;
  lieu: string;
  date_entretien: string;
  nom_candidat: string;
  age: string;
  date_naissance: string;
  lieu_naissance: string;
  diplomes: string;
  universite: string;
  specialite: string;
  motivations: string;
  experience: string;
  travaux: string;
  q1_mission: string;
  q2_indigents: string;
  q3_progres: string;
  q4_gardes: boolean;
  q4_gardes_details: string;
  appreciation: string;
  decision: string;
  poste: string;
  date_decision: string;
  signature: string;
  created_at: string;
}

const EMPTY: Omit<Entretien, 'id' | 'created_at'> = {
  archived: false,
  discord_id: '', lieu: '', date_entretien: '',
  nom_candidat: '', age: '', date_naissance: '', lieu_naissance: '',
  diplomes: '', universite: '', specialite: '',
  motivations: '', experience: '', travaux: '',
  q1_mission: '', q2_indigents: '', q3_progres: '',
  q4_gardes: false, q4_gardes_details: '',
  appreciation: '',
  decision: '', poste: '', date_decision: '', signature: '',
};

const DEC: Record<string, { label: string; color: string; icon: string }> = {
  accepte:        { label: 'Accepté(e)',             color: '#4A8A5A', icon: '✓' },
  complementaire: { label: 'Liste complémentaire',   color: '#8B7040', icon: '◎' },
  refuse:         { label: 'Refusé(e)',               color: '#8A3A3A', icon: '✕' },
  '':             { label: 'En attente',              color: '#4A6070', icon: '⋯' },
};

const inp: React.CSSProperties = {
  fontFamily: MONO, fontSize: 15,
  background: 'rgba(0,0,0,0.22)', border: `1px solid ${T.border}`,
  color: T.text, padding: '11px 16px', outline: 'none',
  boxSizing: 'border-box', width: '100%',
};
const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 88, lineHeight: 1.65 };
const lbl: React.CSSProperties = {
  fontFamily: MONO, fontSize: 11, color: T.dim,
  letterSpacing: '0.13em', marginBottom: 6, display: 'block',
};
const secHead = (color = T.gold): React.CSSProperties => ({
  fontFamily: DISPLAY, fontSize: 22, color,
  borderBottom: `1px solid ${color}40`,
  paddingBottom: 12, marginBottom: 24, marginTop: 40,
  display: 'flex', alignItems: 'center', gap: 14,
});

function Badge({ decision }: { decision: string }) {
  const d = DEC[decision] ?? DEC[''];
  return (
    <span style={{
      fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em',
      padding: '4px 11px', background: d.color + '25',
      color: d.color, border: `1px solid ${d.color}55`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {d.icon} {d.label.toUpperCase()}
    </span>
  );
}

export default function EntretienAdmissionPage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const canWrite = checkIsAdmin(roles) || roles.some(r => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [all,        setAll]        = useState<Entretien[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<'actifs' | 'archives'>('actifs');
  const [view,       setView]       = useState<'list' | 'form'>('list');
  const [editId,     setEditId]     = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY });
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const [hoverId,    setHoverId]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/redm-entretiens');
      if (r.ok) { const d = await r.json(); setAll(d.entretiens ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actifs   = all.filter(e => !e.archived);
  const archives = all.filter(e => e.archived);
  const list     = tab === 'actifs' ? actifs : archives;

  /* Stats sur actifs uniquement */
  const stats = {
    total:         actifs.length,
    accepte:       actifs.filter(e => e.decision === 'accepte').length,
    complementaire:actifs.filter(e => e.decision === 'complementaire').length,
    refuse:        actifs.filter(e => e.decision === 'refuse').length,
    attente:       actifs.filter(e => e.decision === '').length,
  };

  function openNew() {
    setForm({ ...EMPTY });
    setEditId(null);
    setView('form');
    setSaveMsg('');
  }
  function openEdit(e: Entretien) {
    const { id, created_at, ...rest } = e;
    setForm({ ...EMPTY, ...rest });
    setEditId(id);
    setView('form');
    setSaveMsg('');
  }
  function set(k: keyof typeof EMPTY, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function archive(e: Entretien, archived: boolean) {
    const res = await fetch('/api/admin/redm-entretiens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: e.id, archived }),
    });
    if (res.ok) {
      await load();
      setView('list');
      setTab(archived ? 'archives' : 'actifs');
    }
  }

  async function save() {
    if (!canWrite) return;
    setSaving(true); setSaveMsg('');
    try {
      const method = editId ? 'PATCH' : 'POST';
      const body   = editId ? { id: editId, ...form } : form;
      const r = await fetch('/api/admin/redm-entretiens', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json(); setSaveMsg(`Erreur : ${d.error ?? 'inconnue'}`); return; }
      const { entretien } = await r.json();

      if (form.decision === 'accepte' && form.discord_id.trim()) {
        const parcours = [
          form.diplomes   ? `Diplômes : ${form.diplomes}`                : '',
          form.universite ? `Université / Faculté : ${form.universite}`  : '',
          form.specialite ? `Spécialité : ${form.specialite}`            : '',
          form.travaux    ? `Travaux / Thèse : ${form.travaux}`          : '',
        ].filter(Boolean).join('\n');
        await fetch('/api/admin/redm-medecins', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discord_id:             form.discord_id.trim(),
            date_naissance:         form.date_naissance || form.age,
            parcours_universitaire: parcours,
          }),
        });
      }

      setSaveMsg(form.decision === 'accepte' && form.discord_id.trim()
        ? '✓ Entretien sauvegardé — fiche médecin mise à jour'
        : '✓ Entretien sauvegardé');
      setEditId(entretien.id);
      await load();
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    const r = await fetch(`/api/admin/redm-entretiens?id=${id}`, { method: 'DELETE' });
    if (r.ok) { setDelConfirm(null); await load(); if (editId === id) setView('list'); }
  }

  /* ══════════════════════════════════════════════════════════════
     VUE LISTE
  ══════════════════════════════════════════════════════════════ */
  if (view === 'list') return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => router.push('/redm/direction')}
            style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid rgba(200,168,80,0.35)`, color: '#A08850', padding: '9px 20px', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← RETOUR
          </button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.2em' }}>DIRECTION · RECRUTEMENT</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 46, color: T.text, margin: '0 0 10px 0' }}>📋 Entretiens d'Admission</h1>
        <p style={{ fontFamily: MONO, fontSize: 13, color: T.dim, letterSpacing: '0.12em', margin: 0 }}>
          FORMULAIRES D'ADMISSION — RECRUTEMENT DU PERSONNEL MÉDICAL DU DISPENSAIRE
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'TOTAL',         val: stats.total,          color: T.gold },
          { label: 'EN ATTENTE',    val: stats.attente,        color: DEC[''].color },
          { label: 'ACCEPTÉ(E)S',   val: stats.accepte,        color: DEC.accepte.color },
          { label: 'LISTE COMPL.',  val: stats.complementaire, color: DEC.complementaire.color },
          { label: 'REFUSÉ(E)S',    val: stats.refuse,         color: DEC.refuse.color },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${s.color}30`, borderTop: `3px solid ${s.color}`, padding: '18px 22px' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 36, color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.13em', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Onglets + bouton ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, borderBottom: `1px solid ${T.border}` }}>
        {(['actifs', 'archives'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              fontFamily: MONO, fontSize: 13, letterSpacing: '0.12em',
              padding: '12px 28px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              color:       tab === t ? T.gold : T.muted,
              borderBottom: tab === t ? `2px solid ${T.gold}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
            {t === 'actifs'
              ? `EN COURS (${actifs.length})`
              : `ARCHIVES (${archives.length})`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {canWrite && tab === 'actifs' && (
          <button onClick={openNew}
            style={{ fontFamily: MONO, fontSize: 13, background: T.gold, color: '#1A0E0A', border: 'none', padding: '12px 28px', cursor: 'pointer', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 1 }}>
            + NOUVEL ENTRETIEN
          </button>
        )}
      </div>

      {/* ── Liste des cartes ── */}
      {loading ? (
        <p style={{ fontFamily: MONO, color: T.muted, letterSpacing: '0.1em', padding: '40px 0' }}>Chargement…</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: T.dim, fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em' }}>
          {tab === 'actifs' ? 'Aucun entretien en cours' : 'Aucun entretien archivé'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {list.map(e => {
            const dec = DEC[e.decision] ?? DEC[''];
            const hov = hoverId === e.id;
            return (
              <div key={e.id}
                onMouseEnter={() => setHoverId(e.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  background: hov ? '#241610' : T.card,
                  border: `1px solid ${hov ? dec.color + '60' : T.border}`,
                  borderLeft: `5px solid ${dec.color}`,
                  padding: '28px 30px',
                  transition: 'all 0.18s',
                  boxShadow: hov ? `0 6px 24px rgba(0,0,0,0.55)` : '0 2px 8px rgba(0,0,0,0.35)',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>

                {/* Nom + badge décision */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 24, color: T.text, lineHeight: 1.25, flex: 1 }}>
                    {e.nom_candidat || <span style={{ color: T.dim, fontStyle: 'italic' }}>— Candidat sans nom —</span>}
                  </div>
                  <Badge decision={e.decision} />
                </div>

                {/* Infos secondaires */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 3 }}>DATE DE L'ENTRETIEN</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted }}>{e.date_entretien || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 3 }}>ÂGE</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted }}>{e.age ? `${e.age} ans` : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 3 }}>SPÉCIALITÉ</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted }}>{e.specialite || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 3 }}>LIEU</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted }}>{e.lieu || '—'}</div>
                  </div>
                  {e.decision === 'accepte' && e.poste && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: DEC.accepte.color + '99', letterSpacing: '0.12em', marginBottom: 3 }}>POSTE ATTRIBUÉ</div>
                      <div style={{ fontFamily: MONO, fontSize: 13, color: DEC.accepte.color }}>{e.poste}</div>
                    </div>
                  )}
                  {e.discord_id && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 3 }}>DISCORD ID</div>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: T.dim }}>{e.discord_id}</div>
                    </div>
                  )}
                </div>

                {/* Aperçu appréciation */}
                {e.appreciation && (
                  <div style={{ background: 'rgba(0,0,0,0.18)', border: `1px solid ${T.border}`, padding: '10px 14px' }}>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.12em', marginBottom: 4 }}>APPRÉCIATION</div>
                    <div style={{ fontFamily: BODY, fontSize: 14, color: T.muted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {e.appreciation}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => openEdit(e)}
                    style={{ fontFamily: MONO, fontSize: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '9px 18px', cursor: 'pointer', letterSpacing: '0.1em', flex: 1, transition: 'all 0.15s' }}>
                    ✎ OUVRIR
                  </button>
                  {canWrite && (
                    <>
                      {tab === 'actifs' ? (
                        <button onClick={() => archive(e, true)}
                          style={{ fontFamily: MONO, fontSize: 12, background: 'transparent', border: `1px solid rgba(100,80,50,0.5)`, color: '#8B6A3A', padding: '9px 16px', cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.15s' }}
                          title="Archiver">
                          📁 ARCHIVER
                        </button>
                      ) : (
                        <button onClick={() => archive(e, false)}
                          style={{ fontFamily: MONO, fontSize: 12, background: 'transparent', border: `1px solid rgba(60,100,80,0.5)`, color: '#5A8A6A', padding: '9px 16px', cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.15s' }}
                          title="Restaurer">
                          ↩ RESTAURER
                        </button>
                      )}
                      <button onClick={ev => { ev.stopPropagation(); setDelConfirm(e.id); }}
                        style={{ fontFamily: MONO, fontSize: 12, background: 'transparent', border: `1px solid rgba(180,60,60,0.4)`, color: '#A05050', padding: '9px 14px', cursor: 'pointer', letterSpacing: '0.08em', transition: 'all 0.15s' }}
                        title="Supprimer définitivement">
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal confirmation suppression */}
      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1A0E0A', border: `1px solid rgba(180,60,60,0.5)`, padding: '40px 48px', maxWidth: 440, width: '90%' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#C05050', marginBottom: 12 }}>Supprimer définitivement ?</div>
            <p style={{ fontFamily: BODY, fontSize: 16, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>
              Cet entretien sera supprimé de façon permanente. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => del(delConfirm)} style={{ fontFamily: MONO, fontSize: 13, background: '#8A2020', color: '#fff', border: 'none', padding: '12px 24px', cursor: 'pointer', flex: 1, letterSpacing: '0.1em' }}>SUPPRIMER</button>
              <button onClick={() => setDelConfirm(null)} style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, padding: '12px 24px', cursor: 'pointer', flex: 1 }}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     VUE FORMULAIRE
  ══════════════════════════════════════════════════════════════ */
  const readOnly = !canWrite;
  const F = (k: keyof typeof EMPTY) => ({
    value: form[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
    readOnly,
  });

  return (
    <div style={{ fontFamily: BODY }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rye&family=Josefin+Slab:wght@300;400;600;700&family=Special+Elite&display=swap');`}</style>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button onClick={() => setView('list')}
          style={{ fontFamily: MONO, fontSize: 14, background: 'transparent', border: `1px solid rgba(200,168,80,0.35)`, color: '#A08850', padding: '10px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← LISTE
        </button>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.gold, letterSpacing: '0.2em' }}>
          {editId ? "MODIFIER L'ENTRETIEN" : 'NOUVEL ENTRETIEN'}
        </span>
        {editId && form.archived && (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#8B6A3A', background: 'rgba(139,90,43,0.15)', border: '1px solid rgba(139,90,43,0.3)', padding: '4px 12px', letterSpacing: '0.1em' }}>
            ARCHIVÉ
          </span>
        )}
      </div>

      {/* Document */}
      <div style={{ background: T.paper, border: `1px solid rgba(200,168,80,0.20)`, padding: '56px 64px', maxWidth: 1100 }}>

        {/* En-tête officiel */}
        <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 36, borderBottom: `2px solid ${T.gold}35` }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: T.dim, letterSpacing: '0.25em', marginBottom: 14 }}>
            DISPENSAIRE DE LEMOYNE · TERRITOIRE DE NEW HANOVER
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 42, color: T.gold, margin: '0 0 10px 0', letterSpacing: '0.03em' }}>
            Entretien d'Admission
          </h2>
          <div style={{ fontFamily: MONO, fontSize: 13, color: T.muted, letterSpacing: '0.15em' }}>
            FORMULAIRE OFFICIEL — USAGE INTERNE — DISPENSAIRE DE LEMOYNE, 1892
          </div>
        </div>

        {/* Lieu / Date / Discord */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 28, marginBottom: 4 }}>
          <div>
            <label style={lbl}>LIEU</label>
            <input style={inp} {...F('lieu')} placeholder="Dispensaire de Valentine…" />
          </div>
          <div>
            <label style={lbl}>DATE DE L'ENTRETIEN</label>
            <input style={inp} {...F('date_entretien')} placeholder="JJ/MM/AAAA" />
          </div>
          <div>
            <label style={lbl}>DISCORD ID DU CANDIDAT <span style={{ color: T.dim, fontStyle: 'italic' }}>(facultatif — requis pour créer la fiche médecin)</span></label>
            <input style={inp} {...F('discord_id')} placeholder="Ex : 123456789012345678" />
          </div>
        </div>

        {/* ── SECTION I ── */}
        <h3 style={secHead()}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold + 'AA', letterSpacing: '0.2em' }}>I.</span>
          Présentation du Candidat
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24, marginBottom: 22 }}>
          <div>
            <label style={lbl}>NOM DU CANDIDAT</label>
            <input style={inp} {...F('nom_candidat')} placeholder="Nom et prénom…" />
          </div>
          <div>
            <label style={lbl}>ÂGE</label>
            <input style={inp} {...F('age')} placeholder="… ans" />
          </div>
          <div>
            <label style={lbl}>DATE DE NAISSANCE <span style={{ color: T.dim }}>(fiche médecin)</span></label>
            <input style={inp} {...F('date_naissance')} placeholder="JJ/MM/AAAA" />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={lbl}>LIEU DE NAISSANCE</label>
          <input style={inp} {...F('lieu_naissance')} placeholder="Ville, État, Territoire…" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 22 }}>
          <div>
            <label style={lbl}>DIPLÔMES OBTENUS</label>
            <input style={inp} {...F('diplomes')} placeholder="Baccalauréat, Doctorat…" />
          </div>
          <div>
            <label style={lbl}>UNIVERSITÉ / FACULTÉ</label>
            <input style={inp} {...F('universite')} placeholder="Nom de l'établissement…" />
          </div>
          <div>
            <label style={lbl}>SPÉCIALITÉ MÉDICALE</label>
            <input style={inp} {...F('specialite')} placeholder="Chirurgie, Médecine générale…" />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={lbl}>MOTIVATIONS POUR REJOINDRE L'ÉTABLISSEMENT</label>
          <textarea style={ta} {...F('motivations')} placeholder="…" />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={lbl}>EXPÉRIENCE MÉDICALE ANTÉRIEURE (hôpitaux, cliniques, armée, expéditions…)</label>
          <textarea style={ta} {...F('experience')} placeholder="…" />
        </div>

        <div>
          <label style={lbl}>TRAVAUX OU THÈSE SOUTENUE</label>
          <textarea style={{ ...ta, minHeight: 64 }} {...F('travaux')} placeholder="…" />
        </div>

        {/* ── SECTION II ── */}
        <h3 style={secHead()}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold + 'AA', letterSpacing: '0.2em' }}>II.</span>
          Questions posées par le Directeur
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <label style={{ ...lbl, color: T.sepia, fontSize: 13 }}>Quelle est, selon vous, la mission première du médecin auprès du malade ?</label>
            <textarea style={ta} {...F('q1_mission')} placeholder="…" />
          </div>
          <div>
            <label style={{ ...lbl, color: T.sepia, fontSize: 13 }}>Quelle conduite tenez-vous envers les patients indigents ou atteints de maladies contagieuses ?</label>
            <textarea style={ta} {...F('q2_indigents')} placeholder="…" />
          </div>
          <div>
            <label style={{ ...lbl, color: T.sepia, fontSize: 13 }}>Quelle est votre opinion sur les progrès récents de la médecine (vaccination, antisepsie, etc.) ?</label>
            <textarea style={ta} {...F('q3_progres')} placeholder="…" />
          </div>
          <div style={{ background: 'rgba(0,0,0,0.18)', border: `1px solid ${T.border}`, padding: '22px 26px' }}>
            <label style={{ ...lbl, color: T.sepia, fontSize: 13, marginBottom: 16 }}>
              Êtes-vous disposé(e) à résider à proximité de l'établissement et à assurer les gardes de nuit ?
            </label>
            <div style={{ display: 'flex', gap: 36, marginBottom: 18 }}>
              {([true, false] as const).map(val => (
                <label key={String(val)} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 15, color: form.q4_gardes === val ? T.gold : T.muted, cursor: readOnly ? 'default' : 'pointer', transition: 'color 0.15s' }}>
                  <input type="radio" checked={form.q4_gardes === val} onChange={() => !readOnly && set('q4_gardes', val)} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                  {val ? 'Oui' : 'Non'}
                </label>
              ))}
            </div>
            <div>
              <label style={lbl}>DÉTAILS / PRÉCISIONS</label>
              <input style={inp} {...F('q4_gardes_details')} placeholder="Précisions éventuelles…" />
            </div>
          </div>
        </div>

        {/* ── SECTION III ── */}
        <h3 style={secHead('#9B6AC8')}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#9B6AC8AA', letterSpacing: '0.2em' }}>III.</span>
          Observations du Directeur
        </h3>

        <div>
          <label style={lbl}>APPRÉCIATION GÉNÉRALE</label>
          <textarea style={{ ...ta, minHeight: 110 }} {...F('appreciation')} placeholder="…" />
        </div>

        {/* ── SECTION IV ── */}
        <h3 style={secHead('#C87040')}>
          <span style={{ fontFamily: MONO, fontSize: 14, color: '#C87040AA', letterSpacing: '0.2em' }}>IV.</span>
          Décision
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 30 }}>
          {(['accepte', 'complementaire', 'refuse'] as const).map(d => {
            const info = DEC[d];
            const sel  = form.decision === d;
            return (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: 18,
                fontFamily: MONO, fontSize: 15,
                color: sel ? info.color : T.muted,
                cursor: readOnly ? 'default' : 'pointer',
                background: sel ? info.color + '12' : 'transparent',
                border: sel ? `1px solid ${info.color}40` : '1px solid transparent',
                padding: '14px 18px',
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="decision" checked={sel} onChange={() => !readOnly && set('decision', d)}
                  style={{ accentColor: info.color, width: 18, height: 18, flexShrink: 0 }} />
                {d === 'accepte' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <span>Accepté(e) au poste de</span>
                    <input
                      style={{ ...inp, flex: 1, maxWidth: 320, fontSize: 15 }}
                      value={form.poste}
                      onChange={e => set('poste', e.target.value)}
                      readOnly={readOnly}
                      placeholder="Médecin, Infirmier, Thérapeute…"
                    />
                  </div>
                )}
                {d === 'complementaire' && 'Placé(e) sur liste complémentaire'}
                {d === 'refuse'         && 'Refusé(e)'}
              </label>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 40 }}>
          <div>
            <label style={lbl}>DATE DE LA DÉCISION</label>
            <input style={inp} {...F('date_decision')} placeholder="JJ/MM/AAAA" />
          </div>
          <div>
            <label style={lbl}>SIGNATURE DU DIRECTEUR / CHEF DE SERVICE</label>
            <input style={inp} {...F('signature')} placeholder="Nom et titre…" />
          </div>
        </div>

        {/* Cachet */}
        <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, letterSpacing: '0.18em', marginBottom: 10 }}>CACHET DE L'ÉTABLISSEMENT</div>
            <div style={{ width: 110, height: 110, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 36, color: T.dim, opacity: 0.35 }}>⚕</span>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim + '80', letterSpacing: '0.1em', textAlign: 'center', maxWidth: 300, lineHeight: 1.8 }}>
            DISPENSAIRE DE LEMOYNE<br />
            LEMOYNE, TERRITOIRE DE NEW HANOVER<br />
            FONDÉ EN L'AN DE GRÂCE 1892
          </div>
        </div>

        {/* ── Boutons ── */}
        {canWrite && (
          <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <button onClick={save} disabled={saving}
              style={{ fontFamily: MONO, fontSize: 14, background: T.gold, color: '#1A0E0A', border: 'none', padding: '14px 40px', cursor: saving ? 'wait' : 'pointer', letterSpacing: '0.13em', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'ENREGISTREMENT…' : editId ? '✔ METTRE À JOUR' : '✔ ENREGISTRER'}
            </button>
            {editId && (
              <button onClick={() => archive({ id: editId, archived: form.archived } as Entretien, !form.archived)}
                style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', border: `1px solid ${form.archived ? 'rgba(60,100,80,0.5)' : 'rgba(100,80,50,0.5)'}`, color: form.archived ? '#5A8A6A' : '#8B6A3A', padding: '13px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                {form.archived ? '↩ RESTAURER' : '📁 ARCHIVER'}
              </button>
            )}
            {editId && (
              <button onClick={() => setDelConfirm(editId)}
                style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', border: `1px solid rgba(180,60,60,0.4)`, color: '#A05050', padding: '13px 22px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                SUPPRIMER
              </button>
            )}
            {saveMsg && (
              <span style={{ fontFamily: MONO, fontSize: 13, color: saveMsg.startsWith('✓') ? '#5AAA6A' : '#C05050', letterSpacing: '0.08em' }}>
                {saveMsg}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmation suppression */}
      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1A0E0A', border: `1px solid rgba(180,60,60,0.5)`, padding: '40px 48px', maxWidth: 440, width: '90%' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: '#C05050', marginBottom: 12 }}>Supprimer définitivement ?</div>
            <p style={{ fontFamily: BODY, fontSize: 16, color: T.muted, marginBottom: 28, lineHeight: 1.6 }}>Cet entretien sera supprimé de façon permanente. Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => del(delConfirm)} style={{ fontFamily: MONO, fontSize: 13, background: '#8A2020', color: '#fff', border: 'none', padding: '12px 24px', cursor: 'pointer', flex: 1, letterSpacing: '0.1em' }}>SUPPRIMER</button>
              <button onClick={() => setDelConfirm(null)} style={{ fontFamily: MONO, fontSize: 13, background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, padding: '12px 24px', cursor: 'pointer', flex: 1 }}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
