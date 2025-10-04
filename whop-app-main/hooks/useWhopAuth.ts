'use client';

import { useState, useEffect } from 'react';

interface WhopUser {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface WhopAuthState {
  user: WhopUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useWhopAuth() {
  const [authState, setAuthState] = useState<WhopAuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false
  });

  useEffect(() => {
    // In a real Whop app, you would get user data from Whop's context
    // For now, we'll simulate it with environment variables
    const checkAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
        
        // Simulate getting user from Whop context
        // In production, this would come from Whop's authentication system
        const simulatedUser: WhopUser = {
          id: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID || 'user_hF3wMP4gNGUTU',
          username: 'whop_user',
          email: 'user@example.com',
          profile_picture_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        setAuthState({
          user: simulatedUser,
          loading: false,
          error: null,
          isAuthenticated: true
        });
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    // In a real Whop app, this would handle logout through Whop's system
    setAuthState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false
    });
  };

  return {
    ...authState,
    logout
  };
}
