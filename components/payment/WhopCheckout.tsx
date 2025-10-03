'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Star } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  whopProductId: string;
}

const plans: PricingPlan[] = [
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 19.99,
    period: 'month',
    features: [
      'Unlimited video renders',
      'HD & 4K quality output',
      'All chat themes (iMessage, WhatsApp, Snapchat)',
      'Synchronized audio (keyboard clicks & chimes)',
      'Priority support',
      'No watermarks',
      'Custom branding'
    ],
    popular: true,
    whopProductId: 'prod_unlimited_monthly' // Replace with your actual Whop product ID
  }
];

interface WhopCheckoutProps {
  onPurchase?: (planId: string) => void;
}

export function WhopCheckout({ onPurchase }: WhopCheckoutProps) {
  const handlePurchase = (plan: PricingPlan) => {
    // Construct Whop checkout URL
    const checkoutUrl = `https://whop.com/checkout/${plan.whopProductId}`;
    
    // Open checkout in new window
    window.open(checkoutUrl, '_blank', 'width=800,height=600');
    
    // Call callback if provided
    if (onPurchase) {
      onPurchase(plan.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Upgrade to Unlimited</h2>
        <p className="text-lg text-muted-foreground">
          You've used your 5 free videos. Upgrade to create unlimited chat videos.
        </p>
      </div>

      <div className="flex justify-center max-w-md mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.id === 'basic' && <Zap className="w-5 h-5" />}
                {plan.id === 'pro' && <Crown className="w-5 h-5" />}
                {plan.id === 'enterprise' && <Star className="w-5 h-5" />}
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="mb-4">
                Perfect for content creators, marketers, and businesses who need unlimited video generation
              </CardDescription>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handlePurchase(plan)}
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}

