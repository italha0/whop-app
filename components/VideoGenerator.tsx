'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, Video, Play, Pause, RotateCcw } from 'lucide-react';

interface Message {
  text: string;
  sent: boolean;
}

interface VideoGeneratorProps {
  conversation: {
    contactName: string;
    theme?: string;
    alwaysShowKeyboard?: boolean;
    messages: Message[];
  };
  onComplete?: (videoUrl: string) => void;
}

export function VideoGenerator({ conversation, onComplete }: VideoGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const generateVideo = async () => {
    try {
      setStatus('generating');
      setProgress(0);
      setError(null);
      setVideoUrl(null);

      console.log('🎬 Starting video generation with conversation:', conversation);

      // Start video generation
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: {
            contactName: conversation.contactName || 'Contact',
            theme: conversation.theme || 'imessage',
            alwaysShowKeyboard: conversation.alwaysShowKeyboard || false,
            messages: conversation.messages.map((msg, index) => ({
              id: index + 1,
              text: msg.text || '',
              sent: msg.sent || false,
              time: `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
            }))
          },
          userId: 'user_' + Date.now(),
          uploadToAppwrite: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      console.log('📡 API Response:', data);
      
      // If synchronous mode
      if (data.status === 'completed') {
        setVideoUrl(data.videoUrl);
        setStatus('completed');
        setProgress(100);
        onComplete?.(data.videoUrl);
        return;
      }

      // If async mode, poll for status
      setJobId(data.jobId);
      const estimatedDuration = data.estimatedDuration || 30;
      pollJobStatus(data.jobId, estimatedDuration);

    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err.message || 'Failed to generate video');
      setStatus('error');
    }
  };

  const pollJobStatus = async (jobId: string, estimatedDuration: number) => {
    const pollInterval = 2000; // Poll every 2 seconds
    const maxPolls = Math.ceil((estimatedDuration * 1.5 * 1000) / pollInterval);
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/generate-video?jobId=${jobId}`);
        const data = await response.json();

        // Update progress (estimate based on elapsed time)
        pollCount++;
        const estimatedProgress = Math.min(95, (pollCount / maxPolls) * 100);
        setProgress(estimatedProgress);

        if (data.status === 'completed') {
          setVideoUrl(data.videoUrl);
          setStatus('completed');
          setProgress(100);
          onComplete?.(data.videoUrl);
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Video generation failed');
        } else if (pollCount < maxPolls) {
          // Keep polling
          setTimeout(poll, pollInterval);
        } else {
          throw new Error('Video generation timed out');
        }

      } catch (err: any) {
        console.error('Poll error:', err);
        setError(err.message || 'Failed to check video status');
        setStatus('error');
      }
    };

    poll();
  };

  // Video control functions
  const togglePlayPause = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
        setIsPlaying(false);
      } else {
        videoElement.play();
        setIsPlaying(true);
      }
    }
  };

  const restartVideo = () => {
    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play();
      setIsPlaying(true);
    }
  };

  const handleVideoLoad = (element: HTMLVideoElement) => {
    setVideoElement(element);
    element.addEventListener('play', () => setIsPlaying(true));
    element.addEventListener('pause', () => setIsPlaying(false));
    element.addEventListener('ended', () => setIsPlaying(false));
  };

  const downloadVideo = async () => {
    if (!videoUrl) return;

    try {
      // For Appwrite URLs, we need to handle CORS
      if (videoUrl.includes('appwrite')) {
        // Create a proxy endpoint to download the video
        const response = await fetch(`/api/render/download?url=${encodeURIComponent(videoUrl)}`);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${conversation.contactName || 'conversation'}_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Direct download for other URLs
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${conversation.contactName || 'conversation'}_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download video');
    }
  };

  return (
    <div className="space-y-4">
      {status === 'idle' && (
        <Button
          onClick={generateVideo}
          size="lg"
          className="w-full"
        >
          <Video className="mr-2 h-5 w-5" />
          Generate Video
        </Button>
      )}

      {status === 'generating' && (
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating video...</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            This may take 20-30 seconds
          </p>
        </div>
      )}

      {status === 'completed' && videoUrl && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">
              ✅ Video generated successfully!
            </p>
            <p className="text-xs text-green-700 mt-1">
              Job ID: {jobId}
            </p>
          </div>

          {/* Video Preview with Controls */}
          <div className="space-y-3">
            <div className="rounded-lg border overflow-hidden bg-black">
              <video
                ref={handleVideoLoad}
                src={videoUrl}
                className="w-full"
                style={{ maxHeight: '500px', minHeight: '300px' }}
                preload="metadata"
                playsInline
              >
                Your browser does not support video playback.
              </video>
            </div>

            {/* Video Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button
                onClick={togglePlayPause}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>

              <Button
                onClick={restartVideo}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restart</span>
              </Button>

              <Button
                onClick={downloadVideo}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>

          {/* Video Info */}
          <div className="text-xs text-gray-500 text-center">
            <p>Theme: {conversation.theme || 'imessage'} • Messages: {conversation.messages.length}</p>
            <p>Contact: {conversation.contactName || 'Contact'}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">
              ❌ {error || 'Failed to generate video'}
            </p>
          </div>

          <Button
            onClick={generateVideo}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
