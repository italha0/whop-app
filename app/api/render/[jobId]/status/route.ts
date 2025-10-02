import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { databases } = await createServerClient();
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const doc = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_VIDEO_RENDERS_ID!,
      jobId
    );

    const response = {
      jobId: doc.$id,
      status: doc.status,
      url: doc.url || null,
      blob_name: doc.blob_name || null,
      error_message: doc.error_message || null,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    };

    return NextResponse.json(response);
  } catch (e: any) {
    if (e?.code === 404) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
