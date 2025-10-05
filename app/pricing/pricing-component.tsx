"use client"

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Video, Palette, Download } from "lucide-react";
import Link from "next/link";



const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ChatVideo",
    features: [
      "Create unlimited chat scripts",
      "720p video exports",
      "Basic themes",
      "Watermarked videos",
      "Up to 5 saved scripts",
    ],
    limitations: ["Watermarked videos", "Limited themes", "720p quality only"],
    cta: "Get Started",
    popular: false,
    href: "/auth/signup",
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "month",
    description: "For creators who want the best quality",
    features: [
      "Everything in Free",
      "1080p HD video exports",
      "No watermarks",
      "Premium themes & styles",
      "Unlimited saved scripts",
      "Priority support",
      "Custom avatars",
      "Advanced animations",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    href: "/auth/signup?plan=pro",
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-5 bg-primary/15 text-primary border-primary/30">
            <Sparkles className="w-3 h-3 mr-1" /> Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            <span className="block bg-gradient-to-r from-primary via-primary-hover to-primary/70 bg-clip-text text-transparent">Choose Your Plan</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto">Start free and upgrade when you're ready for more power.</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-16">
          <span className={`mr-3 text-sm ${!isYearly ? "text-foreground" : "text-foreground-muted"}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isYearly ? "bg-primary" : "bg-background-light"} border border-border`}
          >
            <span
              className={`flex h-5 w-5 transform rounded-full bg-white text-[10px] font-medium items-center justify-center transition-transform ${isYearly ? "translate-x-6" : "translate-x-1"}`}
            >{isYearly?"Y":"M"}</span>
          </button>
          <span className={`ml-3 text-sm ${isYearly ? "text-foreground" : "text-foreground-muted"}`}>
            Yearly
            <Badge variant="secondary" className="ml-2 bg-primary/15 text-primary border-primary/30">Save 20%</Badge>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative bg-background-light/80 backdrop-blur-sm border-border/70 ${plan.popular ? "shadow-[0_8px_32px_-10px_rgba(138,43,226,0.5)] border-primary" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary/20 text-primary border-primary/40">Most Popular</Badge>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base text-foreground-muted">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.name === "Pro" && isYearly ? "$7.99" : plan.price}</span>
                  {plan.period !== "forever" && (<span className="text-foreground-muted">/{isYearly ? "month" : plan.period}</span>)}
                  {plan.name === "Pro" && isYearly && (<div className="text-xs text-foreground-muted mt-1">Billed annually ($95.88/yr)</div>)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground-muted">{feature}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
  <div className="mt-24">
    <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Video className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Video Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
      <span className="text-foreground-muted">720p</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
      <span className="text-primary font-semibold">1080p HD</span>
                </div>
              </CardContent>
            </Card>

    <Card>
              <CardHeader className="text-center">
                <Palette className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Themes & Styles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
      <span className="text-foreground-muted">3 basic themes</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
      <span className="text-primary font-semibold">20+ premium themes</span>
                </div>
              </CardContent>
            </Card>

    <Card>
              <CardHeader className="text-center">
                <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
                <CardTitle>Exports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Free</span>
      <span className="text-foreground-muted">With watermark</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro</span>
      <span className="text-primary font-semibold">No watermark</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted">
                  Yes! You can cancel your Pro subscription at any time. You'll continue to have access to Pro features
                  until the end of your billing period.
                </p>
              </CardContent>
            </Card>

      <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my videos if I downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
        <p className="text-foreground-muted">
                  All videos you've already created will remain yours forever. However, new videos will include
                  watermarks and be limited to 720p quality.
                </p>
              </CardContent>
            </Card>

      <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
        <p className="text-foreground-muted">
                  We offer a 30-day money-back guarantee. If you're not satisfied with ChatVideo Pro, contact us for a
                  full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}