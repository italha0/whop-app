import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/azure-webhook
 * 
 * Receives notifications from Azure VM when video render jobs complete
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
  const { jobId, status, videoUrl, fileId, error, fileSize } = body;

    // Validate webhook signature (security)
    const signature = request.headers.get('x-azure-signature');
    if (signature && !verifyWebhookSignature(signature, body)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    console.log(`📥 Azure webhook received for job ${jobId}: ${status}`);

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
        completedAt: new Date().toISOString(),
        fileSize: fileSize ?? null
      }
    );

    console.log(`✅ Job ${jobId} updated: ${status}`);

    // Also persist into a Video Renders collection if configured
    try {
      if (status === 'completed' && videoUrl && fileId && process.env.APPWRITE_VIDEO_RENDERS_COLLECTION_ID) {
        // Fetch job for metadata
        let jobDoc: any = null;
        try {
          jobDoc = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID!,
            jobId
          );
        } catch (e) {
          console.warn('Could not read job document for metadata:', e);
        }

        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.APPWRITE_VIDEO_RENDERS_COLLECTION_ID!,
          jobId,
          {
            status,
            composition: 'MessageConversation',
            user_id: jobDoc?.userId ?? 'unknown',
            input_json: jobDoc?.conversation ?? '{}',
            file_id: fileId || null,
            video_url: videoUrl || null,
            duration_sec: jobDoc?.estimatedDuration ?? null,
            file_size_bytes: fileSize ?? null,
          }
        );
        console.log('📝 Saved render metadata to video_renders');
      }
    } catch (e) {
      console.warn('⚠️ Failed to save to video_renders:', e);
    }

    // Optional: Send push notification to user
    if (status === 'completed') {
      await notifyUser(jobId, videoUrl);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Azure webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(signature: string | null, body: any): boolean {
  if (!signature) return true; // Allow unsigned webhooks for development

  // Verify HMAC signature (format: t=timestamp,v1=signature)
  const crypto = require('crypto');
  const secret = process.env.AZURE_WEBHOOK_SECRET || '';
  
  if (!secret) return true; // Allow if no secret is configured
  
  try {
    const [timestamp, sig] = signature.split(',');
    const timestampValue = timestamp.split('=')[1];
    const signatureValue = sig.split('=')[1];
    
    const message = `${timestampValue}.${JSON.stringify(body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    return signatureValue === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function notifyUser(jobId: string, videoUrl: string) {
  // Optional: Send notification to user via WebSocket, push notification, etc.
  // For now, just log
  console.log(`🔔 Notifying user about completed video: ${videoUrl}`);
}
