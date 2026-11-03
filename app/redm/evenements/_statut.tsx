'use client';

const MONO = "'Libre Baskerville', 'Courier New', monospace";

export type Statut = 'a_faire' | 'en_cours' | 'termine';

export const STATUTS: { id: Statut; label: string; icon: string; color: string }[] = [
  { id: 'a_faire',  label: 'À faire',  icon: '📝', color: '#9DB8D0' },
  { id: 'en_cours', label: 'En cours', icon: '🔥', color: '#E8A04C' },
  { id: 'termine',  label: 'Terminé',  icon: '✅', color: '#A8B991' },
];

export function statutMeta(s?: string) {
  return STATUTS.find(x => x.id === s) ?? STATUTS[1];
}

/* Vignette « à faire / en cours / terminé » ; la direction peut la changer d'un clic (menu déroulant) */
export function StatutPastille({ statut, editable, disabled, onChange }: { statut?: string; editable?: boolean; disabled?: boolean; onChange?: (s: Statut) => void }) {
  const m = statutMeta(statut);
  const style: React.CSSProperties = {
    fontFamily: MONO, fontSize: 13, letterSpacing: '0.08em', padding: '6px 12px', whiteSpace: 'nowrap',
    background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}80`,
  };
  if (!editable) return <span style={style}>{m.icon} {m.label.toUpperCase()}</span>;
  return (
    <select value={m.id} disabled={disabled} onClick={e => e.stopPropagation()} onChange={e => onChange?.(e.target.value as Statut)}
      title="Changer l'avancement du dossier" style={{ ...style, cursor: 'pointer', outline: 'none' }}>
      {STATUTS.map(s => <option key={s.id} value={s.id} style={{ background: '#102B3B', color: '#EADCB9' }}>{s.icon} {s.label.toUpperCase()}</option>)}
    </select>
  );
}
