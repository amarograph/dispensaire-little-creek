import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

/* Les 20 icônes du dispensaire (remplacent les emojis).
   Fichiers : /public/icones/<nom>.webp — servis redimensionnés par next/image. */
export const ICONES = {
  caducee:     'Caducée',
  flacons:     'Flacons et remèdes',
  mallette:    'Mallette du médecin',
  lit:         'Lit de soins',
  coeur:       'Anatomie et traités',
  instruments: 'Instruments',
  bandages:    'Bandages',
  mortier:     'Mortier et plantes',
  livre:       'Livre',
  courrier:    'Courrier et plume',
  calendrier:  'Calendrier',
  montre:      'Montre à gousset',
  argent:      "Sac d'argent",
  registre:    'Registre',
  equipe:      'Équipe',
  soins:       'Consultation',
  personnel:   'Personnel',
  alerte:      'Alerte',
  stats:       'Statistiques',
  notes:       'Notes',
} as const;

export type EmblemName = keyof typeof ICONES;
export const ICONE_NOMS = Object.keys(ICONES) as EmblemName[];

/* Emoji → icône. null = pas d'icône (le caractère est simplement retiré). */
const GROUPES: Record<EmblemName, string> = {
  caducee:     '⚕🩺🏥🏛🏢🛡',
  flacons:     '💊🧪🧴🫙🧬🔬',
  mallette:    '🧰🐎🐴🐾🏠',
  lit:         '🤰🤱👶🧒🍼',
  coeur:       '🫁🩸',
  instruments: '🔪🦴🩻',
  bandages:    '🩹🧼',
  mortier:     '🌿🌱🍃🌼🌺⚗',
  livre:       '⚖📜📖📚📰📑',
  courrier:    '✉📣📥✍🎖🎃🎉',
  calendrier:  '📅🗓',
  montre:      '⏳⏰🕐',
  argent:      '💰💵🛒🏦🏷🏆🏅🥇🥈🥉🎡🎯',
  registre:    '📋📄📁🗂🗄🗃📦🗒🧮',
  equipe:      '👥',
  soins:       '🛋🧠',
  personnel:   '👤',
  alerte:      '⚠🚨⛔🚫☠☣🦠😷',
  stats:       '📊',
  notes:       '📝📌',
};
const EMOJI_TO_NAME: Record<string, EmblemName> = {};
for (const [name, chars] of Object.entries(GROUPES)) for (const c of Array.from(chars)) EMOJI_TO_NAME[c] = name as EmblemName;

/* Nom d'icône à partir d'une valeur enregistrée : un nom d'icône, ou un ancien emoji. */
export function iconeDe(v?: string | null): EmblemName | null {
  if (!v) return null;
  const s = v.replace(/️/g, '').trim();
  if ((ICONES as Record<string, string>)[s]) return s as EmblemName;
  /* noms d'icône tronqués à 4 lettres par l'ancienne limite de l'API (« arge », « cale »…) */
  if (/^[a-z]{3,10}$/.test(s)) {
    const m = ICONE_NOMS.filter(n => n.startsWith(s));
    if (m.length === 1) return m[0];
  }
  const first = Array.from(s)[0];
  return (first && EMOJI_TO_NAME[first]) || null;
}

export default function Emblem({ name, size = 32, style, title, inline }: {
  name: EmblemName; size?: number; style?: CSSProperties; title?: string; inline?: boolean;
}) {
  return (
    <Image
      src={`/icones/${name}.webp`}
      alt={title ?? ''}
      title={title}
      aria-hidden={title ? undefined : true}
      width={size}
      height={size}
      sizes={`${size * 2}px`}
      quality={85}
      draggable={false}
      style={{
        width: size, height: size, objectFit: 'contain', flexShrink: 0, userSelect: 'none',
        ...(inline ? { display: 'inline-block', verticalAlign: 'middle', marginRight: 6, marginTop: -2 } : { display: 'block' }),
        ...style,
      }}
    />
  );
}

/* Affiche l'icône correspondant à une valeur enregistrée (nom d'icône ou ancien emoji). Sans correspondance : rien. */
export function Ico({ v, size = 22, style, inline, fallback = null }: {
  v?: string | null; size?: number; style?: CSSProperties; inline?: boolean; fallback?: ReactNode;
}) {
  const n = iconeDe(v);
  if (n) return <Emblem name={n} size={size} style={style} inline={inline} />;
  /* sans correspondance : on n'affiche que les glyphes typographiques (✔ ✕ ◉…), jamais un emoji */
  if (typeof fallback === 'string') {
    const cp = fallback.codePointAt(0) ?? 0;
    if (cp >= 0x1F000 || (cp >= 0x23E9 && cp <= 0x23FA) || cp === 0x2B50 || cp === 0x2705 || cp === 0x26D4) return null;
  }
  return <>{fallback}</>;
}
