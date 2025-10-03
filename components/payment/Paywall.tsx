'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown, Star, Check } from 'lucide-react';

interface PaywallProps {
  feature?: string;
  onUpgrade?: () => void;
  currentPlan?: string;
  remainingVideos?: number;
}

export function Paywall({ feature = 'this feature', onUpgrade, currentPlan, remainingVideos = 0 }: PaywallProps) {
  const plans = [
    {
      id: 'unlimited',
      name: 'Unlimited',
      price: 19.99,
      period: 'month',
      features: ['Unlimited video renders', 'HD & 4K quality output', 'All chat themes', 'Synchronized audio', 'No watermarks'],
      icon: Crown,
      popular: true
    }
  ];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default behavior - scroll to pricing
      const pricingElement = document.getElementById('pricing');
      if (pricingElement) {
        pricingElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Upgrade Required</CardTitle>
          <CardDescription className="text-lg">
            You've used all 5 free videos. Upgrade to create unlimited chat videos.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {remainingVideos} videos remaining
            </div>
            <p className="text-muted-foreground mb-4">
              Current plan: <Badge variant="outline">Free</Badge>
            </p>
          </div>

          <div className="grid gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    plan.popular ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {plan.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${plan.price}/{plan.period}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      Includes:
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {plan.features.slice(0, 2).join(', ')}
                      {plan.features.length > 2 && '...'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center space-y-4">
            <Button onClick={handleUpgrade} className="w-full" size="lg">
              Upgrade to Unlimited - $19.99/month
            </Button>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <span>No hidden fees</span>
              </div>
            </div>
          </div>

          {currentPlan && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Current plan: <span className="font-medium">{currentPlan}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

