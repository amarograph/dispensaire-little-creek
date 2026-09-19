'use client';

import { createContext, useContext } from 'react';

export interface RedmSession {
  discordId: string;
  username: string;
  avatarUrl: string;
  roles: string[];
}

const RedmSessionContext = createContext<RedmSession>({
  discordId: '',
  username: '',
  avatarUrl: '',
  roles: [],
});

export function RedmSessionProvider({ value, children }: { value: RedmSession; children: React.ReactNode }) {
  return (
    <RedmSessionContext.Provider value={value}>
      {children}
    </RedmSessionContext.Provider>
  );
}

export const useRedmSession = () => useContext(RedmSessionContext);
