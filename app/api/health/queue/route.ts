import { NextResponse } from 'next/server';
import { getRenderQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
    
    if (!queueEnabled) {
      return NextResponse.json({
        status: 'disabled',
        message: 'Queue is disabled',
        timestamp: new Date().toISOString()
      });
    }

    if (!process.env.REDIS_URL) {
      return NextResponse.json({
        status: 'error',
        message: 'Redis URL not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    try {
      const queue = getRenderQueue();
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();

      return NextResponse.json({
        status: 'healthy',
        queue: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (queueError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Queue connection failed',
        error: queueError?.message || 'Unknown queue error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: e?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
