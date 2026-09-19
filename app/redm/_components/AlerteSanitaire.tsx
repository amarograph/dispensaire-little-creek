'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_DISPENSAIRE_STATUS, type DispensaireStatus } from '../_lib/sanitaireListes';
import { ZOOM_KEY, ZOOMS, type ZoomKey } from '@/components/layout/ZoomPicker';

const BODY = "'Josefin Slab', 'Georgia', serif";
const MONO = "'Special Elite', 'Courier New', monospace";

interface AlertMessages {
  epidemie: string;
  epidemieCritique: string;
  risque: string;
  risqueCritique: string;
}

const DEFAULT_MESSAGES: AlertMessages = {
  epidemie:         'Risque épidémie en cours, veuillez vous protéger et respecter les protocoles à la lettre pour votre sécurité.',
  epidemieCritique: 'ALERTE CRITIQUE — Épidémie majeure en cours. Isolement immédiat et respect strict des protocoles exigés pour votre sécurité.',
  risque:           'Risque sanitaire élevé, veuillez vous protéger et respecter les protocoles à la lettre pour votre sécurité.',
  risqueCritique:   'ALERTE CRITIQUE — Risque sanitaire majeur en cours. Isolement immédiat et respect strict des protocoles exigés pour votre sécurité.',
};

const TITLES: Record<'epidemie' | 'risque', string> = {
  epidemie: 'Épidémie en cours',
  risque:   'Risque sanitaire',
};

type Dismissed = { epidemie: boolean; risque: boolean };

export default function AlerteSanitaire() {
  const [status,    setStatus]    = useState<DispensaireStatus>(DEFAULT_DISPENSAIRE_STATUS);
  const [messages,  setMessages]  = useState<AlertMessages>(DEFAULT_MESSAGES);
  const [mounted,   setMounted]   = useState(false);
  const [dismissed, setDismissed] = useState<Dismissed>({ epidemie: false, risque: false });
  const [zoom,      setZoom]      = useState<number>(1.0);
  const prevSig = useRef<{ epidemie: string; risque: string }>({ epidemie: '', risque: '' });

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(ZOOM_KEY) ?? 'M') as ZoomKey;
    setZoom(ZOOMS[stored] ?? 1.0);
    function onZoom(e: Event) { setZoom(ZOOMS[(e as CustomEvent<ZoomKey>).detail] ?? 1.0); }
    window.addEventListener('ui:zoom', onZoom);
    return () => window.removeEventListener('ui:zoom', onZoom);
  }, []);

  useEffect(() => {
    function applyStatus(next: DispensaireStatus) {
      setStatus(next);
      setDismissed(prev => {
        const out = { ...prev };
        (['epidemie', 'risque'] as const).forEach(key => {
          const sig = `${next[key].nom}|${next[key].critique}`;
          if (sig !== prevSig.current[key]) out[key] = false;
          prevSig.current[key] = sig;
        });
        return out;
      });
    }

    function check() {
      fetch('/api/redm/dispensaire-status')
        .then(r => r.json())
        .then(d => { if (d?.epidemie && d?.risque) applyStatus({ epidemie: d.epidemie, risque: d.risque }); })
        .catch(() => {});

      fetch('/api/admin/redm-dashboard', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          const dm = d?.dispensaire;
          if (!dm) return;
          setMessages(m => ({
            epidemie:         dm.alertMessageEpidemie         || m.epidemie,
            epidemieCritique: dm.alertMessageEpidemieCritique || m.epidemieCritique,
            risque:           dm.alertMessageRisque           || m.risque,
            risqueCritique:   dm.alertMessageRisqueCritique   || m.risqueCritique,
          }));
        })
        .catch(() => {});
    }
    check();
    const interval = setInterval(check, 60_000);

    function onStatusChange(e: Event) {
      const detail = (e as CustomEvent).detail as DispensaireStatus | undefined;
      if (detail?.epidemie && detail?.risque) applyStatus(detail);
    }
    window.addEventListener('redm:dispensaire-status', onStatusChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('redm:dispensaire-status', onStatusChange);
    };
  }, []);

  if (!mounted) return null;

  const alerts = (['epidemie', 'risque'] as const)
    .filter(key => status[key].nom && !dismissed[key])
    .map(key => {
      const entry = status[key];
      const sevColor = entry.critique ? '#C83030' : '#C8A040';
      const message  = entry.critique ? messages[`${key}Critique`] : messages[key];
      return { key, critique: entry.critique, sevColor, message };
    });

  if (alerts.length === 0) return null;

  return createPortal(
    <div style={{ position: 'fixed', top: 18, left: 18, zIndex: 999999, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12, zoom }}>
      <style>{`
        @keyframes alerte-sanitaire-drop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {alerts.map(({ key, critique, sevColor, message }) => (
        <div key={key} style={{
          pointerEvents: 'all',
          maxWidth: 440,
          background: 'linear-gradient(135deg, #1F1006 0%, #1A0E06 60%, #150A04 100%)',
          border: `1px solid ${sevColor}8C`,
          borderLeft: `4px solid ${sevColor}`,
          borderRadius: 8,
          padding: '16px 20px',
          boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 30px ${sevColor}2E`,
          animation: 'alerte-sanitaire-drop 0.35s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 20, lineHeight: 1.4 }}>⚠</span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: sevColor, letterSpacing: '0.14em', marginBottom: 6, textTransform: 'uppercase' }}>
                  {TITLES[key]}{critique ? ' — CRITIQUE' : ''}
                </div>
                <div style={{ fontFamily: BODY, fontSize: 15, color: '#E8D9C0', lineHeight: 1.55 }}>
                  {message}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissed(p => ({ ...p, [key]: true }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${sevColor}80`, fontSize: 18, lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
            >✕</button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
