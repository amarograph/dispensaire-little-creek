'use client';

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { ZOOM_KEY, ZOOMS, type ZoomKey } from './ZoomPicker';

interface Props {
  children:   ReactNode;
  className?: string;
  style?:     CSSProperties;
  as?:        'div' | 'main' | 'nav';
}

export default function ZoomWrapper({ children, className, style, as: Tag = 'main' }: Props) {
  const [zoom, setZoom] = useState<number>(1.0);

  useEffect(() => {
    const stored = (localStorage.getItem(ZOOM_KEY) ?? 'M') as ZoomKey;
    setZoom(ZOOMS[stored] ?? 1.0);

    function handle(e: Event) {
      const key = (e as CustomEvent<ZoomKey>).detail;
      setZoom(ZOOMS[key] ?? 1.0);
    }
    window.addEventListener('ui:zoom', handle);
    return () => window.removeEventListener('ui:zoom', handle);
  }, []);

  return (
    <Tag className={className} style={{ ...style, zoom }}>
      {children}
    </Tag>
  );
}
