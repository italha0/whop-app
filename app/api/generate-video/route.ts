import { NextRequest, NextResponse } from 'next/server';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * POST /api/generate-video
 * 
 * Generates an iMessage-style video from conversation JSON using Remotion
 * 
 * Body:
 * {
 *   "conversation": {
 *     "contactName": "Alex",
 *     "messages": [
 *       { "text": "Hey!", "sent": false },
 *       { "text": "Hi there!", "sent": true }
 *     ]
 *   },
 *   "userId": "user_123",
 *   "uploadToAppwrite": true
 * }
 * 
 * Returns:
 * {
 *   "jobId": "job_abc123",
 *   "status": "queued" | "processing" | "completed" | "failed",
 *   "videoUrl": "https://..." (when completed),
 *   "estimatedDuration": 25 (seconds)
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, userId, uploadToAppwrite = true } = body;

    // Validate input
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid conversation data' },
        { status: 400 }
      );
    }

    // Estimate video duration (for UX)
    const estimatedDuration = estimateDuration(conversation.messages);

    // Option 1: Synchronous render (for testing, <30s videos)
    if (process.env.RENDER_MODE === 'sync') {
      return await renderWithRemotion(conversation, uploadToAppwrite);
    }

    // Option 2: Async render with Camber (production)
    return await triggerCamberJob(conversation, userId, uploadToAppwrite, estimatedDuration);

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-video?jobId=xxx
 * 
 * Check status of video generation job
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Missing jobId parameter' },
      { status: 400 }
    );
  }

  try {
    // Check job status from database
    const { createSessionClient } = await import('@/lib/appwrite/server');
    const { databases } = createSessionClient(request);

    const job = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID!,
      jobId
    );

    return NextResponse.json({
      jobId: job.$id,
      status: job.status,
      videoUrl: job.videoUrl || null,
      createdAt: job.$createdAt,
      completedAt: job.completedAt || null,
      error: job.error || null
    });

  } catch (error) {
    console.error('Job status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}

// ===== Helper Functions =====

function estimateDuration(messages: any[]): number {
  let total = 2.0; // Initial delay

  for (const msg of messages) {
    const text = msg.text || '';
    const isFromYou = msg.sent === true || msg.sender === 'you';

    if (isFromYou) {
      // Typing time: ~60ms per character
      total += text.length * 0.06 + 0.7;
    } else {
      // Typing indicator time
      total += Math.min(text.length * 0.05, 2.0) + 0.9;
    }
  }

  return Math.ceil(total + 1.0);
}

async function renderWithRemotion(conversation: any, uploadToAppwrite: boolean) {
  // For local development / testing using Remotion
  // This runs the Remotion renderer directly (blocks until complete)
  
  const tempOutput = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);

  try {
    console.log('🎬 Starting Remotion render...');

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), 'remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MessageConversation',
      inputProps: {
        contactName: conversation.contactName || 'Contact',
        theme: conversation.theme || 'imessage',
        alwaysShowKeyboard: conversation.alwaysShowKeyboard || false,
        messages: conversation.messages.map((msg: any, index: number) => ({
          id: index + 1,
          text: msg.text || '',
          sent: msg.sent || false,
          time: msg.time || `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
        }))
      },
    });

    // Render the video
    await renderMedia({
      composition: compositions,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: tempOutput,
      inputProps: {
        contactName: conversation.contactName || 'Contact',
        theme: conversation.theme || 'imessage',
        alwaysShowKeyboard: conversation.alwaysShowKeyboard || false,
        messages: conversation.messages.map((msg: any, index: number) => ({
          id: index + 1,
          text: msg.text || '',
          sent: msg.sent || false,
          time: msg.time || `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
        }))
      },
    });

    console.log('✅ Remotion render complete');

    let videoUrl = null;
    let fileId = null;

    if (uploadToAppwrite) {
      // Upload to Appwrite
      const { createSessionClient } = await import('@/lib/appwrite/server');
      const { storage } = createSessionClient();

      const file = await fs.promises.readFile(tempOutput);
      const fileName = `video_${Date.now()}.mp4`;

      const result = await storage.createFile(
        process.env.APPWRITE_VIDEO_BUCKET_ID!,
        fileName,
        file
      );

      videoUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_VIDEO_BUCKET_ID}/files/${result.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      fileId = result.$id;
    }

    // Cleanup temp file
    await fs.promises.unlink(tempOutput).catch(() => {});

    return NextResponse.json({
      status: 'completed',
      videoUrl,
      fileId,
      message: 'Video rendered successfully with Remotion'
    });

  } catch (error: any) {
    console.error('Remotion render failed:', error);
    return NextResponse.json(
      { error: 'Render failed', details: error.message },
      { status: 500 }
    );
  }
}

async function triggerCamberJob(
  conversation: any,
  userId: string,
  uploadToAppwrite: boolean,
  estimatedDuration: number
) {
  // Create job record in Appwrite database
  const { createSessionClient } = await import('@/lib/appwrite/server');
  const { databases } = await createSessionClient();

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    // Store job in database
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID!,
      jobId,
      {
        userId,
        status: 'queued',
        conversation: JSON.stringify(conversation),
        estimatedDuration,
        uploadToAppwrite,
        createdAt: new Date().toISOString()
      }
    );

    // Trigger Camber job (async)
    // Option A: HTTP POST to Camber endpoint
    const camberUrl = process.env.CAMBER_RENDER_ENDPOINT!;
    const camberApiKey = process.env.CAMBER_API_KEY!;

    await fetch(camberUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${camberApiKey}`
      },
      body: JSON.stringify({
        jobId,
        conversation,
        uploadToAppwrite,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/camber-webhook`
      })
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
      estimatedDuration,
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('Failed to trigger Camber job:', error);
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}
