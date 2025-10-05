'use client';

import React, { ReactNode } from 'react';

export function WhopAuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useWhopAuthContext() {
  throw new Error('Whop auth context was removed. Use useWhopAuth() directly.');
}
