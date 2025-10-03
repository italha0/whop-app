/**
 * Next.js API Route for checking Camber job status
 * 
 * GET /api/render/camber/status?jobId=xxx
 * 
 * Response:
 * {
 *   "status": "pending" | "processing" | "completed" | "failed",
 *   "videoUrl": "https://...",  // when completed
 *   "error": "...",             // when failed
 *   "progress": 0-100           // optional
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

interface CamberJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  download_url?: string;
  file_id?: string;
  error?: string;
  progress?: number;
  duration?: number;
  file_size?: number;
  created_at?: string;
  completed_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Get Camber configuration
    const camberJobUrl = process.env.CAMBER_JOB_URL;
    const camberApiKey = process.env.CAMBER_API_KEY;

    if (!camberJobUrl || !camberApiKey) {
      return NextResponse.json(
        { error: 'Rendering service not configured' },
        { status: 500 }
      );
    }

    // Check job status
    const statusUrl = `${camberJobUrl}/status/${jobId}`;
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${camberApiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      const errorText = await response.text();
      console.error('Failed to fetch job status:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to fetch job status' },
        { status: 500 }
      );
    }

    const jobStatus = await response.json() as CamberJobStatus;

    // Return formatted response
    return NextResponse.json({
      jobId: jobStatus.job_id,
      status: jobStatus.status,
      videoUrl: jobStatus.video_url,
      downloadUrl: jobStatus.download_url,
      fileId: jobStatus.file_id,
      error: jobStatus.error,
      progress: jobStatus.progress,
      metadata: {
        duration: jobStatus.duration,
        fileSize: jobStatus.file_size,
        createdAt: jobStatus.created_at,
        completedAt: jobStatus.completed_at,
      },
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
