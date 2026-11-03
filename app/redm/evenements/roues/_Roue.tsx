'use client';

/* Roue qui tourne : les cases sont dessinées en SVG, le groupe tourne grâce à une transition CSS.
   Le résultat est connu à l'avance (tirage serveur) ; `rotation` est l'angle cumulé (en degrés) qui amène la case gagnante sous la flèche. */

const DISPLAY = "'Central Station', 'Georgia', serif";

const PALETTE = ['#B5543A', '#D1B77C', '#3E7A6B', '#8A5A9B', '#C9822B', '#4F7FA6', '#9C3F5B', '#6E8B3D'];
const R = 200;

export function couleurCase(i: number, n: number): string {
  let c = i % PALETTE.length;
  /* La dernière case ne doit pas avoir la couleur de la première */
  if (n > 1 && i === n - 1 && c === 0) c = 2;
  return PALETTE[c];
}

/* Angle (degrés, sens horaire depuis le haut) du centre de la case i */
export function centreCase(i: number, n: number) { return (i + 0.5) * (360 / n); }

/* Rotation cumulée pour que la case `index` s'arrête sous la flèche (en haut), avec un petit décalage aléatoire dans la case */
export function rotationVers(courante: number, index: number, n: number, tours = 6): number {
  const s = 360 / n;
  const decalage = (Math.random() - 0.5) * s * 0.7;
  const cible = (((360 - centreCase(index, n) - decalage) % 360) + 360) % 360;
  const base = Math.floor(courante / 360) * 360;
  return base + 360 * tours + cible;
}

function pt(angle: number, r: number) {
  const a = (angle * Math.PI) / 180;
  return { x: +(r * Math.sin(a)).toFixed(3), y: +(-r * Math.cos(a)).toFixed(3) };
}

function tronque(t: string, max: number) { return t.length > max ? t.slice(0, Math.max(1, max - 1)) + '…' : t; }

export function Roue({ labels, rotation, duree, accent, enRotation }: { labels: string[]; rotation: number; duree: number; accent: string; enRotation: boolean }) {
  const n = labels.length;
  const s = n ? 360 / n : 360;
  const fs = n <= 8 ? 19 : n <= 16 ? 15 : n <= 30 ? 12 : 10;
  const maxChars = Math.floor((R * 0.74) / (fs * 0.56));

  return (
    <svg viewBox="-225 -235 450 460" style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.55))' }} role="img" aria-label="Roue des gains">
      {/* Corps de la roue (tourne) */}
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '0px 0px', transition: duree > 0 ? `transform ${duree}ms cubic-bezier(0.12, 0.6, 0.08, 1)` : 'none' }}>
        <circle r={R + 12} fill="#2a1a10" stroke={accent} strokeWidth={3} />
        {n === 0 && <circle r={R} fill="#183746" />}
        {n === 1 && <circle r={R} fill={couleurCase(0, 1)} />}
        {n > 1 && labels.map((_, i) => {
          const a = pt(i * s, R), b = pt((i + 1) * s, R);
          return <path key={i} d={`M0,0 L${a.x},${a.y} A${R},${R} 0 ${s > 180 ? 1 : 0} 1 ${b.x},${b.y} Z`} fill={couleurCase(i, n)} stroke="#102B3B" strokeWidth={1.5} />;
        })}
        {labels.map((l, i) => (
          <text key={i} transform={`rotate(${centreCase(i, n) - 90})`} x={R - 14} y={fs * 0.35} textAnchor="end"
            style={{ fontFamily: DISPLAY, fontSize: fs, fill: '#FFF8E6', fontWeight: 700, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.45)', strokeWidth: 2.5 }}>
            {tronque(l, maxChars)}
          </text>
        ))}
        {/* Petites ampoules sur le bord */}
        {Array.from({ length: 24 }, (_, i) => { const p = pt(i * 15, R + 6); return <circle key={i} cx={p.x} cy={p.y} r={3} fill={enRotation && i % 2 === 0 ? '#FFF1B8' : accent} />; })}
      </g>
      {/* Moyeu */}
      <circle r={26} fill="#102B3B" stroke={accent} strokeWidth={4} />
      <circle r={9} fill={accent} />
      {/* Flèche fixe en haut */}
      <polygon points="0,-168 -17,-222 17,-222" fill="#F4E3B5" stroke="#102B3B" strokeWidth={3} transform="translate(0,2)" />
    </svg>
  );
}
