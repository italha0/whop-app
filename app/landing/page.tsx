'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Zap, Crown, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Video className="w-4 h-4" />
            Chat Video Creator
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Chat Videos
            <span className="text-blue-600"> in Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your conversations into stunning chat videos with synchronized audio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Creating - 5 Free Videos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Pixel Perfect</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Recreate authentic chat interfaces with iMessage, WhatsApp, and Snapchat themes.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Crown className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Synchronized Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keyboard clicks and send/receive chimes perfectly synced.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Multiple Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from iMessage, WhatsApp, or Snapchat themes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Need More Videos?</h2>
          <p className="text-lg mb-8 opacity-90">Upgrade to unlimited videos for just $19.99/month.</p>
          <Button size="lg" className="text-lg px-8 py-3 bg-white text-blue-600 hover:bg-gray-100">
            Upgrade to Unlimited
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
