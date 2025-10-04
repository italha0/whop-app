'use client';

import { useState } from 'react';
import { VideoGenerator } from '@/components/VideoGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface Message {
  text: string;
  sent: boolean;
}

export default function VideoGeneratorPage() {
  const [contactName, setContactName] = useState('Alex');
  const [messages, setMessages] = useState<Message[]>([
    { text: 'Hey!', sent: false },
    { text: 'Hi there!', sent: true }
  ]);

  const [newMessageText, setNewMessageText] = useState('');
  const [newMessageSent, setNewMessageSent] = useState(false);

  const addMessage = () => {
    if (!newMessageText.trim()) return;

    setMessages([...messages, {
      text: newMessageText,
      sent: newMessageSent
    }]);
    setNewMessageText('');
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const loadExample = () => {
    setContactName('Alex');
    setMessages([
      { text: 'oh no.', sent: false },
      { text: 'i thought you meant.', sent: false },
      { text: 'wow this is awkward', sent: false },
      { text: 'i thought you liked me too.', sent: false },
      { text: 'HAHAHA', sent: true },
      { text: "I'M JUST KIDDING", sent: true },
      { text: 'I LIKE YOU TOO', sent: true },
      { text: 'you do?! 😊', sent: false }
    ]);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">iMessage Video Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create realistic iMessage videos with typing animations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Conversation Builder */}
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Conversation Builder</h2>

              {/* Contact Name */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Contact Name</label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Alex"
                />
              </div>

              {/* Messages List */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Messages</label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2 rounded ${
                        msg.sent ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {msg.sent ? 'You (Blue)' : 'Them (Gray)'}
                        </div>
                        <div className="text-sm">{msg.text}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMessage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Message</label>
                <Textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type message..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewMessageSent(false);
                      addMessage();
                    }}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add from Them
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewMessageSent(true);
                      addMessage();
                    }}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add from You
                  </Button>
                </div>
              </div>

              <Button
                variant="link"
                size="sm"
                onClick={loadExample}
                className="mt-2 w-full"
              >
                Load Example Conversation
              </Button>
            </div>
          </div>

          {/* Right: Preview & Generate */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Preview</h2>
              <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
                <div className="bg-white rounded-t-lg p-3 text-center border-b">
                  <div className="text-sm font-medium">{contactName}</div>
                </div>
                <div className="space-y-2 p-3">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.sent
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-200 text-black rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Video */}
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Generate Video</h2>
              {messages.length > 0 ? (
                <VideoGenerator
                  conversation={{ contactName, messages }}
                  onComplete={(videoUrl) => {
                    console.log('Video ready:', videoUrl);
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Add messages to generate a video
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Character-by-character typing animation</li>
            <li>✅ iOS keyboard visible at bottom</li>
            <li>✅ Typing indicators for incoming messages</li>
            <li>✅ Realistic message bubble animations</li>
            <li>✅ Emoji support 😊</li>
          </ul>
          <p className="text-xs text-blue-700 mt-3">
            Generation takes ~20-30 seconds for 8 messages on XSMALL GPU
          </p>
        </div>
      </div>
    </div>
  );
}
