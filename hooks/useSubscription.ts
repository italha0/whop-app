'use client';

import { useState, useEffect } from 'react';
import { useWhopAuthContext } from '@/components/layout/WhopAuthProvider';

interface Subscription {
  id: string;
  status: string;
  planId: string;
  startDate: string;
  endDate: string;
  companyId: string;
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user, isAuthenticated } = useWhopAuthContext();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscription: null,
    loading: true,
    error: null
  });

  const checkSubscription = async (userId: string) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/api/subscription-status?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setStatus({
          hasActiveSubscription: data.data.hasActiveSubscription,
          subscription: data.data.subscription,
          loading: false,
          error: null
        });
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to check subscription status'
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const refreshSubscription = () => {
    if (user?.id) {
      checkSubscription(user.id);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkSubscription(user.id);
    } else {
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated, user?.id]);

  return {
    ...status,
    refreshSubscription
  };
}

