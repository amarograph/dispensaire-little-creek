'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRedmSession } from '@/app/redm/_components/RedmSessionProvider';
import { isAdmin as checkIsAdmin } from '@/lib/permissions';

const DISPLAY = "'Central Station', 'Georgia', serif";
const BODY    = "'Cormorant Garamond', 'Georgia', serif";
const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const T = { bg: '#102B3B', card: '#183746', border: 'rgba(139,90,43,0.30)', gold: '#D1B77C', text: '#EADCB9', muted: '#C8BEA5', dim: '#C8BEA5' };

interface Config { actif: boolean; heure: string; jours: number[]; seulementNonFaits: boolean; mode: 'role' | 'individuel'; roleId: string; message: string; derniereDate?: string; derniereHeure?: string; }
const JOURS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Jeu'], [5, 'Ven'], [6, 'Sam'], [7, 'Dim']] as const;
const HEURES  = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const inp: React.CSSProperties = { fontFamily: MONO, fontSize: 15, background: 'rgba(0,0,0,0.28)', border: `1px solid ${T.border}`, color: T.text, padding: '10px 14px', outline: 'none', boxSizing: 'border-box', width: '100%' };
const lbl: React.CSSProperties = { fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.12em', marginBottom: 6, display: 'block' };

export default function RappelCaissePage() {
  const router = useRouter();
  const { roles } = useRedmSession();
  const canEdit = checkIsAdmin(roles) || roles.some((r: string) => ['redm_directeur', 'redm_co_directeur'].includes(r));

  const [cfg, setCfg]         = useState<Config | null>(null);
  const [defautMsg, setDefautMsg] = useState('');
  const [webhookOk, setWebhookOk] = useState(true);
  const [nbPrep, setNbPrep]   = useState(0);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/redm-rappel-caisse')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setCfg(d.config); setDefautMsg(d.defautMessage); setWebhookOk(!!d.webhookConfigure); setNbPrep(d.nbPreparateurs ?? 0); })
      .catch(() => setError('Accès refusé ou erreur serveur.'));
  }, []);

  async function appeler(payload: object): Promise<{ ok: boolean; error?: string; config?: Config }> {
    try {
      const r = await fetch('/api/admin/redm-rappel-caisse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      return r.ok ? { ok: true, ...d } : { ok: false, error: d.error ?? `Erreur ${r.status}` };
    } catch { return { ok: false, error: 'Erreur réseau.' }; }
  }

  async function enregistrer() {
    if (!cfg) return;
    setSaving(true); setError(''); setInfo('');
    const r = await appeler({ action: 'save', config: cfg });
    setSaving(false);
    if (r.ok) { if (r.config) setCfg(r.config); setInfo('✔ Réglage enregistré.'); setTimeout(() => setInfo(''), 3500); }
    else setError(r.error ?? 'Erreur');
  }

  async function tester() {
    if (!cfg) return;
    setTesting(true); setError(''); setInfo('');
    const r = await appeler({ action: 'test', message: cfg.message });
    setTesting(false);
    if (r.ok) { setInfo('✔ Message de test envoyé dans le salon (personne n’est tagué).'); setTimeout(() => setInfo(''), 5000); }
    else setError(r.error ?? 'Erreur');
  }

  const [hh, mm] = (cfg?.heure ?? '18:00').split(':');
  const setHeure = (h: string, m: string) => setCfg(c => c ? { ...c, heure: `${h}:${m}` } : c);
  const toggleJour = (j: number) => setCfg(c => c ? { ...c, jours: c.jours.includes(j) ? c.jours.filter(x => x !== j) : [...c.jours, j].sort() } : c);

  const carte: React.CSSProperties = { background: T.card, border: `1px solid ${T.border}`, padding: '20px 24px' };

  return (
    <div style={{ fontFamily: BODY, maxWidth: 1000 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/redm/direction')} style={{ fontFamily: MONO, fontSize: 15, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em' }}>← RETOUR</button>
          <span style={{ fontFamily: MONO, fontSize: 14, color: T.gold, letterSpacing: '0.16em' }}>DISPENSAIRE · DIRECTION · RAPPEL DE CAISSE</span>
        </div>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, color: T.gold, margin: 0 }}>💰 Rappel de caisse</h1>
        <p style={{ fontFamily: MONO, fontSize: 14, color: T.dim, letterSpacing: '0.1em', marginTop: 8 }}>
          MESSAGE DISCORD AUTOMATIQUE À UNE HEURE PRÉCISE · TAGUE LES PRÉPARATEURS DE CAISSE
        </p>
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(200,80,80,0.10)', border: '1px solid rgba(200,80,80,0.35)', color: '#DF9A88', fontFamily: MONO, fontSize: 14 }}>⚠ {error}</div>}
      {info && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(168,185,145,0.10)', border: '1px solid rgba(168,185,145,0.4)', color: '#A8B991', fontFamily: MONO, fontSize: 14 }}>{info}</div>}

      {!cfg ? (
        !error && <div style={{ ...carte, textAlign: 'center', fontFamily: MONO, fontSize: 14, color: T.dim }}>⟳ CHARGEMENT...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {!webhookOk && (
            <div style={{ padding: '12px 16px', background: 'rgba(232,184,96,0.08)', border: '1px solid rgba(232,184,96,0.4)', fontFamily: MONO, fontSize: 13, color: '#E8B860', lineHeight: 1.7 }}>
              ⚠ Le salon Discord n&apos;est pas encore branché : créez un webhook dans le salon voulu, puis ajoutez son adresse dans Vercel sous le nom
              <b> DISCORD_CAISSE_WEBHOOK_URL </b> et redéployez. Tant que ce n&apos;est pas fait, aucun message ne part.
            </div>
          )}

          {/* Activation + heure + jours */}
          <div style={carte}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: canEdit ? 'pointer' : 'default', marginBottom: 20 }}>
              <input type="checkbox" checked={cfg.actif} disabled={!canEdit} onChange={e => setCfg({ ...cfg, actif: e.target.checked })} style={{ width: 22, height: 22, cursor: 'pointer' }} />
              <span style={{ fontFamily: DISPLAY, fontSize: 22, color: cfg.actif ? '#A8B991' : T.muted }}>{cfg.actif ? 'Rappel activé' : 'Rappel désactivé'}</span>
            </label>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <label style={lbl}>HEURE D&apos;ENVOI (HEURE DE PARIS)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select style={{ ...inp, width: 100, cursor: 'pointer' }} value={hh} disabled={!canEdit} onChange={e => setHeure(e.target.value, mm)}>
                    {HEURES.map(h => <option key={h} value={h}>{h} h</option>)}
                  </select>
                  <span style={{ fontFamily: MONO, color: T.dim }}>:</span>
                  <select style={{ ...inp, width: 90, cursor: 'pointer' }} value={mm} disabled={!canEdit} onChange={e => setHeure(hh, e.target.value)}>
                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>JOURS</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {JOURS.map(([j, nom]) => {
                    const on = cfg.jours.includes(j);
                    return (
                      <button key={j} type="button" disabled={!canEdit} onClick={() => toggleJour(j)}
                        style={{ fontFamily: MONO, fontSize: 14, padding: '9px 14px', cursor: 'pointer', background: on ? 'rgba(209,183,124,0.2)' : 'transparent', color: on ? T.gold : T.dim, border: `1px solid ${on ? 'rgba(209,183,124,0.55)' : T.border}` }}>{nom}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
              <label style={lbl}>QUI EST TAGUÉ</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {([['role', '🏷 Le rôle Discord « Préparateur de caisse »'], ['individuel', '👤 Chaque préparateur individuellement']] as const).map(([id, label]) => {
                  const on = cfg.mode === id;
                  return (
                    <button key={id} type="button" disabled={!canEdit} onClick={() => setCfg({ ...cfg, mode: id })}
                      style={{ fontFamily: MONO, fontSize: 14, padding: '10px 16px', cursor: 'pointer', textAlign: 'left', background: on ? 'rgba(209,183,124,0.2)' : 'transparent', color: on ? T.gold : T.dim, border: `1px solid ${on ? 'rgba(209,183,124,0.55)' : T.border}` }}>{label}</button>
                  );
                })}
              </div>
              {cfg.mode === 'role' && (
                <div style={{ maxWidth: 420 }}>
                  <label style={lbl}>IDENTIFIANT DU RÔLE DISCORD</label>
                  <input style={inp} value={cfg.roleId} disabled={!canEdit} onChange={e => setCfg({ ...cfg, roleId: e.target.value.replace(/\D/g, '') })} placeholder="ex : 1561880592801464461" autoComplete="off" />
                  <div style={{ fontFamily: MONO, fontSize: 13, color: cfg.roleId.length >= 15 ? T.dim : '#E8B860', marginTop: 6, lineHeight: 1.6 }}>
                    {cfg.roleId.length >= 15 ? 'Tous les membres qui ont ce rôle sur Discord sont prévenus par une seule mention.' : '⚠ Identifiant manquant ou trop court : les préparateurs seront tagués individuellement.'}
                  </div>
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 20, cursor: canEdit ? 'pointer' : 'default' }}>
              <input type="checkbox" checked={cfg.seulementNonFaits} disabled={!canEdit} onChange={e => setCfg({ ...cfg, seulementNonFaits: e.target.checked })} style={{ width: 18, height: 18, marginTop: 3, cursor: 'pointer' }} />
              <span style={{ fontFamily: MONO, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
                N&apos;envoyer le rappel que si des préparateurs <b>n&apos;ont pas encore fait leur caisse aujourd&apos;hui</b>
                <span style={{ display: 'block', color: T.dim, fontSize: 13 }}>Si tout le monde l&apos;a déjà faite, aucun message n&apos;est envoyé. En mode « rôle », tout le rôle est prévenu dès qu&apos;au moins un préparateur reste à faire ; en mode « individuel », seuls ceux qui restent sont tagués. Décoché : le message part toujours.</span>
              </span>
            </label>
            <div style={{ marginTop: 14, fontFamily: MONO, fontSize: 13, color: T.dim }}>
              👥 {nbPrep} préparateur{nbPrep > 1 ? 's' : ''} de caisse concerné{nbPrep > 1 ? 's' : ''} (rôle « Préparateur de caisse »).
              {cfg.derniereDate && <span> · Dernier envoi : {cfg.derniereDate.split('-').reverse().join('/')}</span>}
            </div>
          </div>

          {/* Message */}
          <div style={carte}>
            <label style={lbl}>MESSAGE</label>
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 150, lineHeight: 1.7 }} value={cfg.message} disabled={!canEdit} onChange={e => setCfg({ ...cfg, message: e.target.value })} />
            <div style={{ fontFamily: MONO, fontSize: 13, color: T.dim, marginTop: 8, lineHeight: 1.6 }}>
              Écrivez <b style={{ color: T.gold }}>{'{mentions}'}</b> à l&apos;endroit où les préparateurs doivent être tagués. Si vous l&apos;oubliez, les tags sont ajoutés en tête du message.
              Les astérisques <b>**texte**</b> mettent en gras dans Discord.
            </div>
            {canEdit && (
              <button onClick={() => setCfg({ ...cfg, message: defautMsg })} style={{ marginTop: 10, fontFamily: MONO, fontSize: 13, padding: '6px 12px', cursor: 'pointer', background: 'transparent', color: T.dim, border: `1px solid ${T.border}` }}>↺ Remettre le message par défaut</button>
            )}
          </div>

          {canEdit && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={enregistrer} disabled={saving} style={{ fontFamily: MONO, fontSize: 15, letterSpacing: '0.12em', padding: '13px 34px', cursor: 'pointer', background: 'rgba(209,183,124,0.2)', color: T.gold, border: '2px solid rgba(209,183,124,0.55)', opacity: saving ? 0.6 : 1 }}>
                {saving ? '⟳ ENREGISTREMENT…' : '✔ ENREGISTRER'}
              </button>
              <button onClick={tester} disabled={testing || !webhookOk} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.1em', padding: '13px 24px', cursor: webhookOk ? 'pointer' : 'not-allowed', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, opacity: testing || !webhookOk ? 0.5 : 1 }}>
                {testing ? '⟳ ENVOI…' : '🧪 ENVOYER UN MESSAGE DE TEST'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
