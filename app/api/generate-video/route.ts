import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Databases } from 'node-appwrite';
import { createServerClient } from '@/lib/appwrite/server'; // Import the Appwrite server client
import { getRenderQueue } from '@/lib/queue';

// Force dynamic to avoid caching & ensure Node runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Character { id: string; name: string; color: string; avatar?: string }
interface Message { id: string; characterId: string; text: string; timestamp: number }
interface RequestBody { characters: Character[]; messages: Message[]; isPro?: boolean; theme?: string; contactName?: string }

export async function POST(request: NextRequest) {
  try {
    const { account, databases } = await createServerClient();

    // Try to get user, but allow unauthenticated
    let currentUser: any = null;
    try {
      currentUser = await account.get();
    } catch (authError) {
      currentUser = null; // Not logged in, proceed as guest
    }

    const body: RequestBody = await request.json();
    const { characters, messages, theme = 'imessage', contactName } = body;

    // Validate theme parameter
    const validThemes = ['imessage', 'whatsapp', 'snapchat'];
    const selectedTheme = validThemes.includes(theme) ? theme : 'imessage';
    if (theme !== selectedTheme) {
      console.warn(`Invalid theme "${theme}" provided, falling back to imessage`);
    }
    if (!characters || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid request: characters and messages are required' }, { status: 400 });
    }
    // Transform to Remotion props (same mapping as before)
    const hasYouId = characters.some((c) => c.id === 'you');
    const remotionMessages = messages.map((msg, index) => {
      const isOutgoing = hasYouId ? msg.characterId === 'you' : (characters[1] ? msg.characterId === characters[1].id : false);
      return { id: index + 1, text: msg.text, sent: isOutgoing, time: `0:${String(index * 2).padStart(2, '0')}` };
    });
    const contactCharacter = characters.find((c) => c.id === 'them') || characters[0];
    const inputProps = {
      messages: remotionMessages,
      contactName: contactName || contactCharacter?.name || 'Contact',
      theme: selectedTheme,
      alwaysShowKeyboard: true,
    };

    const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
    if (queueEnabled && !process.env.REDIS_URL) {
      return NextResponse.json({ error: 'Server not configured (REDIS_URL missing)' }, { status: 500 });
    }

    const jobId = randomUUID();

    // user_id is optional if not logged in
  await databases.createDocument(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_COLLECTION_VIDEO_RENDERS_ID!,
    jobId,
    {
      user_id: currentUser ? currentUser.$id : null,
      status: 'pending',
      composition_id: 'MessageConversation',
      input_props: JSON.stringify(inputProps),
    }
  );

    if (queueEnabled) {
      // Try enqueue; fail fast to avoid 504s
      try {
        const queue = getRenderQueue();
        const enqueue = queue.add('render', { jobId });
        await Promise.race([
          enqueue,
          new Promise((_, r) => setTimeout(() => r(new Error('enqueue-timeout')), 2000)),
        ]);
      } catch (e: any) {
        // Log only; we still return 202 and rely on worker polling fallback
        console.error('[API] Enqueue failed, will rely on polling worker', e?.message || e);
      }
    }

    return NextResponse.json(
      { jobId, statusUrl: `/api/render/${jobId}/status` },
      { status: 202 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
