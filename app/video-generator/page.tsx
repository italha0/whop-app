'use client';

import { useState } from 'react';
import { VideoGenerator } from '@/components/VideoGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  text: string;
  sent: boolean;
}

const exampleConversations = [
  {
    name: 'iMessage Style',
    theme: 'imessage',
    contactName: 'Alex',
    messages: [
      { text: 'Hey! How are you doing?', sent: false },
      { text: 'I\'m doing great! Just working on some cool projects 😊', sent: true },
      { text: 'That sounds awesome! What kind of projects?', sent: false },
      { text: 'Building a video generator app with Remotion!', sent: true },
      { text: 'Wow, that\'s really impressive! 🚀', sent: false }
    ]
  },
  {
    name: 'WhatsApp Style',
    theme: 'whatsapp',
    contactName: 'Maria',
    messages: [
      { text: 'Hola! ¿Cómo estás?', sent: false },
      { text: '¡Hola! Muy bien, gracias. ¿Y tú?', sent: true },
      { text: 'También muy bien! ¿Qué planes tienes para hoy?', sent: false },
      { text: 'Voy a trabajar en mi proyecto de video', sent: true },
      { text: '¡Excelente! Mucha suerte 🍀', sent: false }
    ]
  },
  {
    name: 'Snapchat Style',
    theme: 'snapchat',
    contactName: 'Jake',
    messages: [
      { text: 'Yo! What\'s up?', sent: false },
      { text: 'Not much, just chilling! You?', sent: true },
      { text: 'Same here! Want to hang out later?', sent: false },
      { text: 'Sure! What time?', sent: true },
      { text: 'How about 7pm?', sent: false },
      { text: 'Perfect! See you then 👋', sent: true }
    ]
  }
];

export default function VideoGeneratorPage() {
  const [selectedConversation, setSelectedConversation] = useState(exampleConversations[0]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleVideoComplete = (url: string) => {
    setVideoUrl(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Chat Video Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create realistic chat videos with typing animations, multiple themes, 
            and automatic processing using Remotion and Camber Cloud.
          </p>
        </div>

        {/* Example Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Choose a Conversation Style</CardTitle>
            <CardDescription>
              Select from our example conversations or create your own
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleConversations.map((conversation, index) => (
                <Button
                  key={index}
                  variant={selectedConversation === conversation ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{conversation.name}</span>
                    <Badge variant="secondary">{conversation.theme}</Badge>
                  </div>
                  <div className="text-sm text-left opacity-80">
                    {conversation.messages.length} messages
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Video</CardTitle>
            <CardDescription>
              Click the button below to generate your chat video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoGenerator
              conversation={selectedConversation}
              onComplete={handleVideoComplete}
            />
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600">🎨 Multiple Themes</h3>
                <p className="text-sm text-gray-600">
                  iMessage, WhatsApp, and Snapchat styles
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-600">⚡ Real-time Processing</h3>
                <p className="text-sm text-gray-600">
                  Automatic video generation with Camber Cloud
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-purple-600">📱 Responsive Design</h3>
                <p className="text-sm text-gray-600">
                  Works on desktop and mobile devices
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-600">🎬 Realistic Animations</h3>
                <p className="text-sm text-gray-600">
                  Typing indicators and smooth transitions
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">😀 Emoji Support</h3>
                <p className="text-sm text-gray-600">
                  Full emoji rendering with fallbacks
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-indigo-600">⬇️ Direct Download</h3>
                <p className="text-sm text-gray-600">
                  Download videos directly to your device
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Built With:</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Next.js 15</Badge>
                  <Badge>Remotion</Badge>
                  <Badge>TypeScript</Badge>
                  <Badge>Tailwind CSS</Badge>
                  <Badge>Appwrite</Badge>
                  <Badge>Camber Cloud</Badge>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Video Specs:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Resolution: 390x844 (iPhone dimensions)</li>
                  <li>• Frame Rate: 30 FPS</li>
                  <li>• Codec: H.264</li>
                  <li>• Format: MP4</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}