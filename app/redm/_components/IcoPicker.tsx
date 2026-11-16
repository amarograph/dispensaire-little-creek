'use client';

import Emblem, { ICONES, ICONE_NOMS, iconeDe, type EmblemName } from './Emblem';

/* Sélecteur d'icône : choisit parmi les icônes du dispensaire (la valeur enregistrée est le nom de l'icône). */
export default function IcoPicker({ value, onChange, noms = ICONE_NOMS, size = 40 }: {
  value?: string | null; onChange: (nom: string) => void; noms?: EmblemName[]; size?: number;
}) {
  const actuel = iconeDe(value);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {noms.map(n => {
        const on = n === actuel;
        return (
          <button key={n} type="button" title={ICONES[n]} onClick={() => onChange(n)}
            style={{
              padding: 4, cursor: 'pointer', lineHeight: 0,
              background: on ? 'rgba(209,183,124,0.18)' : 'rgba(209,183,124,0.05)',
              border: `1px solid ${on ? '#D1B77C' : 'rgba(180,160,113,0.25)'}`,
              boxShadow: on ? '0 0 0 1px #D1B77C' : 'none',
              opacity: on || !actuel ? 1 : 0.7,
            }}>
            <Emblem name={n} size={size} />
          </button>
        );
      })}
    </div>
  );
}
