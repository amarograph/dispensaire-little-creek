'use client';

import { MONO, T } from '../_lib/shared';

/* ══ Bloc de section (toujours visible, rien de replié) ══ */
export function FormSection({ icon, title, color, alerte, children }: {
  icon: string; title: string; color: string; defaultOpen?: boolean; alerte?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ border: `1px solid ${alerte ? 'rgba(180,70,70,0.5)' : T.border}`, background: T.card }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${alerte ? 'rgba(180,70,70,0.4)' : T.border}` }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 14, color: alerte ? '#DF9A88' : color, letterSpacing: '0.08em', flex: 1 }}>{title}</span>
        {alerte && <span style={{ fontFamily: MONO, fontSize: 13, color: '#DF9A88', background: 'rgba(139,64,64,0.18)', padding: '1px 7px', border: '1px solid rgba(139,64,64,0.4)' }}>⚠</span>}
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

/* ══ Menu multi-sélection (boutons à bascule) ══ */
export function MultiToggle({ options, value, onChange, color }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; color: string;
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)}
            style={{ fontFamily: MONO, fontSize: 13, padding: '6px 10px', cursor: 'pointer', background: on ? color + '22' : 'transparent', color: on ? color : T.dim, border: `1px solid ${on ? color + '70' : T.border}` }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
