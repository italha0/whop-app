
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Paywall } from '@/components/payment/Paywall';
import { Play, Plus, Trash2, Volume2, Maximize2, Sparkles, Download } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  text: string;
  sent: boolean;
}

export default function EditorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '', sent: false },
    { id: '2', text: '', sent: false }
  ]);
  const [contactName, setContactName] = useState('Contact');
  const [videoCount, setVideoCount] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const updateMessage = (id: string, text: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, text } : msg
    ));
  };

  const toggleMessageSender = (id: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, sent: !msg.sent } : msg
    ));
  };

  const removeMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  const addMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: '',
      sent: false
    };
    setMessages([...messages, newMessage]);
  };

  const generateVideo = async () => {
    if (videoCount >= 5) {
      return;
    }

    setIsRendering(true);
    
    try {
      // Call API (stubbed with 501 by default). Replace with real pipeline.
      const res = await fetch('/api/render', { method: 'POST', body: JSON.stringify({ contactName, messages }), headers: { 'content-type': 'application/json' } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Render failed (${res.status})`);
      }
      const data = await res.json();
      if (data.url) {
        setDownloadUrl(data.url);
      }
      setVideoCount(v => v + 1);
    } catch (e: any) {
      console.warn('Render error', e?.message || e);
    } finally {
      setIsRendering(false);
    }
  };

  const remainingVideos = 5 - videoCount;

  if (videoCount >= 5) {
    return (
      <Paywall 
        remainingVideos={remainingVideos}
        onUpgrade={() => {
          console.log('Upgrade clicked');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="MockVideo.app" width={160} height={40} priority />
            </div>
            
            {/* Sign In Button */}
            <Button variant="outline" className="text-gray-600 border-gray-300">
              Sign In (optional)
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left Panel - Editor */}
          <div className="space-y-6">
            {/* Title Section - matches screenshot */}
            <div className="relative overflow-hidden rounded-[20px] border border-slate-200/70 bg-gradient-to-br from-white/95 to-slate-50/80 p-6 md:p-8 shadow-md">
              {/* subtle diagonal mist */}
              <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-pink-200/40 blur-3xl" />
              <div className="pointer-events-none absolute right-0 -bottom-24 h-56 w-56 rounded-full bg-purple-200/30 blur-3xl" />

              <h1 className="text-[34px] md:text-[42px] leading-tight font-extrabold uppercase tracking-tight text-slate-900">
                CREATE A FAKE
              </h1>
              <div className="leading-tight">
                <span className="text-[34px] md:text-[42px] font-extrabold bg-gradient-to-r from-rose-500 via-pink-400 to-transparent bg-clip-text text-transparent">
                  iMESSAGE VIDEO
                </span>
              </div>
              <p className="mt-2 text-[15px] md:text-base text-slate-500">
                Type in any story you'd like to be told in the video
              </p>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {contactName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contact"
                  className="pl-12 h-10 border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
              </div>
            </div>

            {/* Conversation Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Conversation
                </label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={addMessage}
                  className="border-gray-300 text-gray-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={message.id} className="relative">
                    <div className="border-l-2 border-blue-500 pl-3">
                      <Textarea
                        value={message.text}
                        onChange={(e) => updateMessage(message.id, e.target.value)}
                        placeholder="Type here..."
                        className="min-h-[72px] border-gray-300 rounded-lg resize-none bg-white text-sm"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex gap-2">
                          <Button
                            variant={!message.sent ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMessageSender(message.id)}
                            className={`${
                              !message.sent 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            Them
                          </Button>
                          <Button
                            variant={message.sent ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMessageSender(message.id)}
                            className={`${
                              message.sent 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            You
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMessage(message.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Video Button */}
            <Button
              onClick={generateVideo}
              disabled={messages.every(msg => !msg.text.trim()) || isRendering}
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg font-medium rounded-lg"
            >
              {isRendering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Video
                </>
              )}
            </Button>

              {downloadUrl && (
                <Button asChild className="w-full mt-3" variant="outline">
                  <a href={downloadUrl} download>
                    <Download className="w-4 h-4 mr-2" /> Download video
                  </a>
                </Button>
              )}
          </div>

          {/* Right Panel - Preview */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative w-80 h-[640px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-gray-800 overflow-hidden">
                {/* Status Bar */}
                <div className="flex justify-between items-center px-6 py-2 text-sm font-semibold">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-black rounded-full"></div>
                    <div className="w-1 h-1.5 bg-black rounded-full"></div>
                    <div className="w-1 h-2 bg-black rounded-full"></div>
                    <div className="w-1 h-2.5 bg-black rounded-full"></div>
                    <div className="w-3 h-2 border border-black rounded-sm ml-1"></div>
                    <div className="w-4 h-2 border border-black rounded-sm ml-1"></div>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                  <span className="text-blue-500 font-medium">Back</span>
                  <span className="font-semibold">{contactName}</span>
                  <div className="w-8"></div>
                </div>

                {/* Video Player Area */}
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Play className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Video Controls - pill with shadow like screenshot */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-neutral-900/85 p-2.5 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center justify-between text-white">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">0:00 / 0:10</span>
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Logo placed where the old low-res preview button was */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <Image
                  src="/logo.png"
                  alt="MockVideo.app logo"
                  width={180}
                  height={48}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
