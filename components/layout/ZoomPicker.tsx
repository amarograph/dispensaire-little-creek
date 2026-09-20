'use client';

import { useEffect, useState } from 'react';

export const ZOOM_KEY = 'ui-zoom';
export const ZOOMS = { S: 1.0, M: 1.1, L: 1.3 } as const;
export type ZoomKey = keyof typeof ZOOMS;

interface Props {
  accentRgb: string;
  activeColor?: string;
  mutedColor?: string;
  font?: string;
}

export default function ZoomPicker({
  accentRgb,
  activeColor  = '#E8E8E8',
  mutedColor   = 'rgba(180,180,180,0.5)',
  font         = 'inherit',
}: Props) {
  const [active, setActive] = useState<ZoomKey>('M');

  useEffect(() => {
    const stored = (localStorage.getItem(ZOOM_KEY) ?? 'M') as ZoomKey;
    if (stored in ZOOMS) setActive(stored);
  }, []);

  function pick(key: ZoomKey) {
    setActive(key);
    localStorage.setItem(ZOOM_KEY, key);
    window.dispatchEvent(new CustomEvent('ui:zoom', { detail: key }));
  }

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
      {(Object.keys(ZOOMS) as ZoomKey[]).map(key => (
        <button
          key={key}
          onClick={() => pick(key)}
          title={key === 'S' ? 'Compact (100%)' : key === 'M' ? 'Confort (110%)' : 'Grand (130%)'}
          aria-label={key === 'S' ? 'Texte compact' : key === 'M' ? 'Texte confort' : 'Grand texte'}
          aria-pressed={active === key}
          style={{
            fontFamily:   font,
            fontSize:     14,
            fontWeight:   active === key ? 700 : 400,
            padding:      '8px 10px',
            minWidth:     40,
            minHeight:    40,
            border:       `1px solid rgba(${accentRgb}, ${active === key ? '0.7' : '0.25'})`,
            background:   active === key ? `rgba(${accentRgb}, 0.18)` : 'transparent',
            color:        active === key ? activeColor : mutedColor,
            cursor:       'pointer',
            borderRadius: 4,
            letterSpacing:'0.12em',
            transition:   'all 0.15s',
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
