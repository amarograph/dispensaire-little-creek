'use client';

import { useState } from 'react';
import { MONO, T } from '../_lib/shared';

/* ══ Bloc repliable ══ */
export function FormSection({ icon, title, color, defaultOpen, alerte, children }: {
  icon: string; title: string; color: string; defaultOpen?: boolean; alerte?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ border: `1px solid ${alerte ? 'rgba(180,70,70,0.5)' : T.border}`, background: T.card }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 14, color: alerte ? '#DF9A88' : color, letterSpacing: '0.08em', flex: 1 }}>{title}</span>
        {alerte && <span style={{ fontFamily: MONO, fontSize: 13, color: '#DF9A88', background: 'rgba(139,64,64,0.18)', padding: '1px 7px', border: '1px solid rgba(139,64,64,0.4)' }}>⚠</span>}
        <span style={{ color: T.dim, fontFamily: MONO, fontSize: 13 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: `1px solid ${T.border}` }}>{children}</div>}
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
