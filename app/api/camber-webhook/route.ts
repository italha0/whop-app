import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/camber-webhook
 * 
 * Receives notifications from Camber when video render jobs complete
 * 
 * Body:
 * {
 *   "jobId": "job_abc123",
 *   "status": "completed" | "failed",
 *   "videoUrl": "https://...",
 *   "fileId": "file_xyz",
 *   "error": "..." (if failed)
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, status, videoUrl, fileId, error } = body;

    // Validate webhook signature (security)
    const signature = request.headers.get('x-camber-signature');
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    console.log(`📥 Webhook received for job ${jobId}: ${status}`);

    // Update job in database
    const { createAdminClient } = await import('@/lib/appwrite/server');
    const { databases } = await createAdminClient();

    await databases.updateDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID!,
      jobId,
      {
        status,
        videoUrl: videoUrl || null,
        fileId: fileId || null,
        error: error || null,
        completedAt: new Date().toISOString()
      }
    );

    console.log(`✅ Job ${jobId} updated: ${status}`);

    // Optional: Send push notification to user
    if (status === 'completed') {
      await notifyUser(jobId, videoUrl);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(signature: string | null, body: any): boolean {
  if (!signature) return false;

  // Verify HMAC signature
  const crypto = require('crypto');
  const secret = process.env.CAMBER_WEBHOOK_SECRET || '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return signature === expectedSignature;
}

async function notifyUser(jobId: string, videoUrl: string) {
  // Optional: Send notification to user via WebSocket, push notification, etc.
  // For now, just log
  console.log(`🔔 Notifying user about completed video: ${videoUrl}`);
}
