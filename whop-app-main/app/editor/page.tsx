'use client';

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useWhopAuthContext } from '@/components/layout/WhopAuthProvider';
import { Paywall } from '@/components/payment/Paywall';
import { EditorView } from '@/components/editor/EditorView';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Zap, Star } from 'lucide-react';

export default function EditorPage() {
  const { user, isAuthenticated, loading: authLoading } = useWhopAuthContext();
  const { hasActiveSubscription, subscription, loading, error, refreshSubscription } = useSubscription();

  const handleUpgrade = () => {
    // Scroll to pricing section or open pricing modal
    window.location.href = '/#pricing';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {authLoading ? 'Authenticating...' : 'Checking subscription status...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Please log in through Whop to access the video editor.
            </CardDescription>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              {error}
            </CardDescription>
            <Button onClick={refreshSubscription} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Editor</h1>
            <p className="text-gray-600">
              Create professional videos from your scripts with our powerful editor
            </p>
          </div>
          
          <Paywall 
            feature="the video editor" 
            onUpgrade={handleUpgrade}
            currentPlan={subscription?.planId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with subscription info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Editor</h1>
              <p className="text-gray-600">
                Create professional videos from your scripts
              </p>
            </div>
            
            {subscription && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {subscription.planId === 'basic' && <Zap className="w-3 h-3" />}
                  {subscription.planId === 'pro' && <Crown className="w-3 h-3" />}
                  {subscription.planId === 'enterprise' && <Star className="w-3 h-3" />}
                  {subscription.planId?.charAt(0).toUpperCase() + subscription.planId?.slice(1)} Plan
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Editor Component with MainLayout */}
        <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)]">
          <MainLayout />
        </div>
      </div>
    </div>
  );
}

