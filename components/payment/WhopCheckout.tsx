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
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    period: 'month',
    features: [
      '5 video renders per month',
      'HD quality output',
      'Basic templates',
      'Email support'
    ],
    whopProductId: 'prod_basic_monthly' // Replace with your actual Whop product ID
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    period: 'month',
    features: [
      '25 video renders per month',
      '4K quality output',
      'All templates',
      'Priority support',
      'Custom branding'
    ],
    popular: true,
    whopProductId: 'prod_pro_monthly' // Replace with your actual Whop product ID
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    period: 'month',
    features: [
      'Unlimited video renders',
      '4K quality output',
      'All templates',
      '24/7 support',
      'Custom branding',
      'API access',
      'White-label solution'
    ],
    whopProductId: 'prod_enterprise_monthly' // Replace with your actual Whop product ID
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
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground">
          Unlock the full potential of our script-to-video tool
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                Perfect for {plan.id === 'basic' ? 'individuals getting started' : 
                           plan.id === 'pro' ? 'content creators and small teams' : 
                           'large organizations and agencies'}
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
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

