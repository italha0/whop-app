import { NextRequest, NextResponse } from 'next/server';
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

    // Option 2: Async render with Azure VM (production)
    return await triggerAzureVMJob(conversation, userId, uploadToAppwrite, estimatedDuration);

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
    const { createAdminClient } = await import('@/lib/appwrite/server');
    const { databases } = createAdminClient();

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
    const { bundle } = await import('@remotion/bundler');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), 'remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const { selectComposition, renderMedia } = await import('@remotion/renderer');
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

    if (uploadToAppwrite && process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.APPWRITE_VIDEO_BUCKET_ID && process.env.APPWRITE_API_KEY) {
      // Upload to Appwrite via REST to avoid SDK type friction in sync mode
      const buffer = await fs.promises.readFile(tempOutput);
      const fileName = `video_${Date.now()}.mp4`;
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const bucket = process.env.APPWRITE_VIDEO_BUCKET_ID;
      const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const apiKey = process.env.APPWRITE_API_KEY;

      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const res = await fetch(`${endpoint}/storage/buckets/${bucket}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Appwrite-Project': project!,
          'X-Appwrite-Key': apiKey!,
          'X-Appwrite-Response-Format': 'json'
        },
        body: arrayBuffer as ArrayBuffer
      });
      if (!res.ok) {
        throw new Error(`Appwrite upload failed: ${res.status}`);
      }
      const json = await res.json();
      const id = json.$id;
      videoUrl = `${endpoint}/storage/buckets/${bucket}/files/${id}/view?project=${project}`;
      fileId = id;
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

async function triggerAzureVMJob(
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

    // Worker mode: If RENDER_MODE=worker or AZURE_VM_ENDPOINT is not set, return queued and let the VM worker poll Appwrite.
    const isWorkerMode = process.env.RENDER_MODE === 'worker' || !process.env.AZURE_VM_ENDPOINT;
    if (isWorkerMode) {
      return NextResponse.json({
        jobId,
        status: 'queued',
        estimatedDuration,
        message: 'Video generation queued (worker will process)'
      });
    }

    // Service mode: Trigger Azure VM (async) with Remotion
    const azureVMUrl = process.env.AZURE_VM_ENDPOINT as string;
    const azureApiKey = process.env.AZURE_API_KEY || '';

    const response = await fetch(azureVMUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(azureApiKey ? { 'Authorization': `Bearer ${azureApiKey}` } : {})
      },
      body: JSON.stringify({
        jobId,
        conversation: {
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
        uploadToAppwrite,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/azure-webhook`
      })
    });

    if (!response.ok) {
      throw new Error(`Azure VM request failed: ${response.status}`);
    }

    return NextResponse.json({
      jobId,
      status: 'queued',
      estimatedDuration,
      message: 'Video generation started with Azure VM'
    });

  } catch (error) {
    console.error('Failed to trigger Azure VM job:', error);
    
    // Update job status to failed
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID!,
        jobId,
        {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString()
        }
      );
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
    
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    );
  }
}
