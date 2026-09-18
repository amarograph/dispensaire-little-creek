'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { Universe } from '@/types';

interface UniverseContextType {
  universe: Universe;
  setUniverse: (u: Universe) => void;
}

const UniverseContext = createContext<UniverseContextType>({
  universe: 'redm',
  setUniverse: () => {},
});

export function UniverseProvider({ children }: { children: React.ReactNode }) {
  const [universe, setUniverseState] = useState<Universe>('redm');

  useEffect(() => {
    const saved = localStorage.getItem('ems_universe') as Universe;
    if (saved === 'redm') {
      setUniverseState(saved);
    }
  }, []);

  function setUniverse(u: Universe) {
    setUniverseState(u);
    localStorage.setItem('ems_universe', u);
  }

  return (
    <UniverseContext.Provider value={{ universe, setUniverse }}>
      {children}
    </UniverseContext.Provider>
  );
}

export const useUniverse = () => useContext(UniverseContext);