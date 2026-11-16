import Image from 'next/image';
import type { CSSProperties } from 'react';

/* Illustrations du dispensaire (remplacent les emojis).
   Fichiers dans /public/emblemes — servis redimensionnés par next/image. */
export const EMBLEMS = {
  dispensaire: 'Devanture du dispensaire',
  mortier:     'Mortier et lavande',
  caducee:     'Caducée',
  coiffe:      "Coiffe d'infirmière",
  livres:      'Pile de livres',
  coffret:     'Coffret médical',
  courrier:    'Courrier à sceau',
  grimoire:    'Registre, plume et encrier',
  agenda:      'Agenda et montre à gousset',
  lanterne:    'Lanterne',
} as const;

export type EmblemName = keyof typeof EMBLEMS;

export default function Emblem({ name, size = 32, style, title }: {
  name: EmblemName; size?: number; style?: CSSProperties; title?: string;
}) {
  return (
    <Image
      src={`/emblemes/${name}.webp`}
      alt={title ?? ''}
      title={title}
      aria-hidden={title ? undefined : true}
      width={size}
      height={size}
      sizes={`${size * 2}px`}
      quality={85}
      draggable={false}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'block', userSelect: 'none', ...style }}
    />
  );
}
