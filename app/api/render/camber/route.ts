/**
 * Next.js API Route for triggering Camber rendering jobs
 * 
 * POST /api/render/camber
 * 
 * Request body:
 * {
 *   "conversation": {
 *     "messages": [
 *       { "sender": "you|them", "text": "message text" }
 *     ]
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "jobId": "camber-job-id",
 *   "status": "pending"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

interface Message {
  sender: 'you' | 'them';
  text: string;
  timestamp?: number;
}

interface ConversationInput {
  messages: Message[];
}

interface CamberJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json() as { conversation: ConversationInput };

    // Validate input
    if (!conversation || !Array.isArray(conversation.messages)) {
      return NextResponse.json(
        { error: 'Invalid conversation format' },
        { status: 400 }
      );
    }

    if (conversation.messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation must have at least one message' },
        { status: 400 }
      );
    }

    if (conversation.messages.length > 100) {
      return NextResponse.json(
        { error: 'Too many messages (max 100)' },
        { status: 400 }
      );
    }

    // Validate each message
    for (let i = 0; i < conversation.messages.length; i++) {
      const msg = conversation.messages[i];
      
      if (!msg.text || typeof msg.text !== 'string') {
        return NextResponse.json(
          { error: `Message ${i} missing or invalid text` },
          { status: 400 }
        );
      }

      if (msg.text.length > 500) {
        return NextResponse.json(
          { error: `Message ${i} text too long (max 500 chars)` },
          { status: 400 }
        );
      }

      if (!msg.sender || !['you', 'them'].includes(msg.sender)) {
        return NextResponse.json(
          { error: `Message ${i} has invalid sender` },
          { status: 400 }
        );
      }
    }

    // Get Camber configuration from environment
    const camberJobUrl = process.env.CAMBER_JOB_URL;
    const camberApiKey = process.env.CAMBER_API_KEY;

    if (!camberJobUrl || !camberApiKey) {
      console.error('Missing Camber configuration');
      return NextResponse.json(
        { error: 'Rendering service not configured' },
        { status: 500 }
      );
    }

    // Trigger Camber job
    console.log(`Triggering Camber job for ${conversation.messages.length} messages`);
    
    const camberResponse = await fetch(camberJobUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${camberApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversation),
    });

    if (!camberResponse.ok) {
      const errorText = await camberResponse.text();
      console.error('Camber job trigger failed:', errorText);
      
      return NextResponse.json(
        { error: 'Failed to start rendering job' },
        { status: 500 }
      );
    }

    const camberResult = await camberResponse.json() as CamberJobResponse;

    console.log(`Camber job created: ${camberResult.job_id}`);

    return NextResponse.json({
      success: true,
      jobId: camberResult.job_id,
      status: camberResult.status || 'pending',
    });

  } catch (error) {
    console.error('Error triggering Camber job:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if service is healthy
export async function GET() {
  const isConfigured = !!(process.env.CAMBER_JOB_URL && process.env.CAMBER_API_KEY);
  
  return NextResponse.json({
    service: 'camber-renderer',
    configured: isConfigured,
    status: isConfigured ? 'ready' : 'not_configured',
  });
}
