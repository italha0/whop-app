'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWhopAuth } from '@/hooks/useWhopAuth';

interface WhopUser {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface WhopAuthContextType {
  user: WhopUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const WhopAuthContext = createContext<WhopAuthContextType | undefined>(undefined);

interface WhopAuthProviderProps {
  children: ReactNode;
}

export function WhopAuthProvider({ children }: WhopAuthProviderProps) {
  const authState = useWhopAuth();

  return (
    <WhopAuthContext.Provider value={authState}>
      {children}
    </WhopAuthContext.Provider>
  );
}

export function useWhopAuthContext() {
  const context = useContext(WhopAuthContext);
  if (context === undefined) {
    throw new Error('useWhopAuthContext must be used within a WhopAuthProvider');
  }
  return context;
}
