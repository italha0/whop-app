/**
 * React hook for rendering chat videos via Camber
 * 
 * Usage:
 * 
 * const { render, status, videoUrl, error, isLoading } = useCamberRender();
 * 
 * await render({
 *   messages: [
 *     { sender: 'them', text: 'Hello!' },
 *     { sender: 'you', text: 'Hi there!' }
 *   ]
 * });
 */

import { useState, useCallback } from 'react';

interface Message {
  sender: 'you' | 'them';
  text: string;
  timestamp?: number;
}

interface Conversation {
  messages: Message[];
}

interface RenderResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  downloadUrl?: string;
  error?: string;
}

interface UseCamberRenderReturn {
  render: (conversation: Conversation) => Promise<RenderResult>;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl: string | null;
  downloadUrl: string | null;
  error: string | null;
  isLoading: boolean;
  progress: number;
  jobId: string | null;
}

export function useCamberRender(): UseCamberRenderReturn {
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const pollJobStatus = useCallback(async (jobId: string): Promise<RenderResult> => {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/render/camber/status?jobId=${jobId}`);
          
          if (!response.ok) {
            clearInterval(pollInterval);
            reject(new Error('Failed to fetch job status'));
            return;
          }

          const result = await response.json();

          // Update progress (estimate based on status)
          if (result.status === 'processing') {
            setProgress(prev => Math.min(prev + 5, 90));
          }

          setStatus(result.status);

          if (result.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setVideoUrl(result.videoUrl);
            setDownloadUrl(result.downloadUrl);
            resolve({
              jobId: result.jobId,
              status: result.status,
              videoUrl: result.videoUrl,
              downloadUrl: result.downloadUrl,
            });
          } else if (result.status === 'failed') {
            clearInterval(pollInterval);
            setError(result.error || 'Rendering failed');
            reject(new Error(result.error || 'Rendering failed'));
          }
        } catch (err) {
          clearInterval(pollInterval);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          reject(err);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setError('Rendering timeout');
        reject(new Error('Rendering timeout'));
      }, 300000);
    });
  }, []);

  const render = useCallback(async (conversation: Conversation): Promise<RenderResult> => {
    try {
      // Reset state
      setStatus('pending');
      setError(null);
      setVideoUrl(null);
      setDownloadUrl(null);
      setProgress(0);

      // Trigger render job
      const response = await fetch('/api/render/camber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start rendering');
      }

      const result = await response.json();
      
      setJobId(result.jobId);
      setProgress(10);

      // Poll for completion
      return await pollJobStatus(result.jobId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus('failed');
      setError(errorMessage);
      throw err;
    }
  }, [pollJobStatus]);

  return {
    render,
    status,
    videoUrl,
    downloadUrl,
    error,
    isLoading: status === 'pending' || status === 'processing',
    progress,
    jobId,
  };
}
