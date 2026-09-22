'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MONO    = "'Libre Baskerville', 'Courier New', monospace";
const DISPLAY = "'Cormorant Garamond', 'Georgia', serif";

const LS_RDV_TS   = 'rdm_notif_rdv_ts';

interface RdvRaw {
  id: string; patientNom: string; date: string; heure: string;
  type: string; statut: string; notes: string; createdAt: string; medecin?: string;
}
interface RdvInfo {
  id: string; patientNom: string; date: string; heure: string; type: string; urgence?: boolean;
}

type ToastKind = 'reminder' | 'nouveau-rdv';

interface Toast {
  id: string;
  kind: ToastKind;
  rdv?: RdvInfo;
  rdvData?: Pick<RdvRaw, 'patientNom' | 'date' | 'heure' | 'type'>;
}

function getStyle(t: Toast) {
  if (t.kind === 'nouveau-rdv')
    return { bg: 'linear-gradient(135deg,#061A0E,#081F12)', bdr: 'rgba(50,180,90,.55)',  acc: '#32B45A', icon: '📋', label: 'NOUVEAU RENDEZ-VOUS ASSIGNÉ' };
  if (t.rdv?.urgence)
    return { bg: 'linear-gradient(135deg,#1A0606,#1F0A08)', bdr: 'rgba(200,60,60,.65)',  acc: '#C84040', icon: '🔴', label: 'RAPPEL URGENT — DANS 2H' };
  return   { bg: 'linear-gradient(135deg,#102B3B,#1F1208)', bdr: 'rgba(209,183,124,.55)', acc: '#D1B77C', icon: '🔔', label: 'RAPPEL — RENDEZ-VOUS DANS 4H' };
}

export default function Notifier() {
  const [toasts,  setToasts]  = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);
  const rpName = useRef('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/redm/profil-medecin')
      .then(r => r.json())
      .then(d => {
        rpName.current = [d.prenom_rp, d.nom_rp].filter(Boolean).join(' ').trim();
      })
      .catch(() => {});
  }, []);

  function push(t: Toast, ttl = 45_000) {
    setToasts(prev => prev.some(x => x.id === t.id) ? prev : [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), ttl);
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(x => x.id !== id));
  }

  useEffect(() => {
    function check() {
      fetch('/api/check-notifications')
        .then(r => r.json())
        .then((d: { sent?: string[]; sentRdvs?: RdvInfo[] }) => {
          (d.sentRdvs ?? []).forEach(rdv =>
            push({ id: `reminder-${rdv.id}`, kind: 'reminder', rdv }),
          );
        })
        .catch(() => {});
    }
    check();
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function check() {
      if (!rpName.current) return;
      fetch('/api/agenda-commun')
        .then(r => r.json())
        .then((rdvs: RdvRaw[]) => {
          const lastTs = localStorage.getItem(LS_RDV_TS);
          const now    = new Date().toISOString();
          if (!lastTs) { localStorage.setItem(LS_RDV_TS, now); return; }
          const nouveaux = rdvs.filter(r =>
            r.medecin === rpName.current && r.createdAt > lastTs,
          );
          nouveaux.forEach(r =>
            push({
              id: `nouveau-rdv-${r.id}`, kind: 'nouveau-rdv',
              rdvData: { patientNom: r.patientNom, date: r.date, heure: r.heure, type: r.type },
            }, 60_000),
          );
          localStorage.setItem(LS_RDV_TS, now);
        })
        .catch(() => {});
    }
    const init = setTimeout(check, 2_000);
    const iv   = setInterval(check, 15_000);
    return () => { clearTimeout(init); clearInterval(iv); };
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes notif-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>
      <div style={{
        position: 'fixed', top: 18, right: 18,
        zIndex: 999999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = getStyle(t);
          return (
            <div key={t.id} style={{
              pointerEvents: 'all',
              background: s.bg,
              border: `1px solid ${s.bdr}`,
              borderLeft: `4px solid ${s.acc}`,
              borderRadius: 8,
              padding: '14px 18px',
              width: 440,
              boxShadow: `0 8px 40px rgba(74,62,32,0.14), 0 0 24px ${s.bdr}`,
              animation: 'notif-in 0.3s ease',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ fontFamily: MONO, fontSize: 14, color: s.acc, letterSpacing: '0.16em' }}>
                    {s.label}
                  </span>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:`${s.acc}80`, fontSize: 14, lineHeight: 1, padding:'2px 4px' }}
                >✕</button>
              </div>

              <div style={{ fontFamily: DISPLAY, fontSize: 14, color: '#EADCB9', lineHeight: 1.55 }}>

                {t.kind === 'nouveau-rdv' && t.rdvData && (
                  <>
                    Vous avez un rendez-vous avec{' '}
                    <span style={{ color: s.acc, fontWeight: 700 }}>{t.rdvData.patientNom}</span>
                    {t.rdvData.heure && (
                      <> le{' '}
                        <span style={{ color: s.acc, fontWeight: 700 }}>{t.rdvData.date}</span>
                        {' '}à{' '}
                        <span style={{ color: s.acc, fontWeight: 700 }}>{t.rdvData.heure}</span>
                      </>
                    )}
                    {t.rdvData.type && (
                      <> — <span style={{ fontStyle: 'italic' }}>{t.rdvData.type}</span></>
                    )}.
                  </>
                )}

                {t.kind === 'reminder' && t.rdv && (
                  <>
                    Votre rendez-vous avec{' '}
                    <span style={{ color: s.acc, fontWeight: 700 }}>{t.rdv.patientNom}</span>{' '}
                    est prévu à{' '}
                    <span style={{ color: s.acc, fontWeight: 700 }}>{t.rdv.heure}</span>
                    {t.rdv.type && (
                      <> pour une séance de <span style={{ fontStyle: 'italic' }}>{t.rdv.type}</span></>
                    )}.
                    <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 14, color: `${s.acc}80`, letterSpacing: '0.1em' }}>
                      {t.rdv.urgence ? 'Dans moins de 2 heures' : 'Dans environ 4 heures'} · {t.rdv.date}
                    </div>
                  </>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </>,
    document.body,
  );
}
