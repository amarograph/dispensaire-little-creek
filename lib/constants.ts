export const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL!;

export const UNIVERSES = {
  fivem: {
    id: 'fivem',
    label: 'FiveM',
    subtitle: 'Hôpital Moderne',
    color: 'blue',
    icon: '🏥',
  },
  redm: {
    id: 'redm',
    label: 'RedM',
    subtitle: 'Dispensaire 1890',
    color: 'amber',
    icon: '⚕️',
  },
} as const;
