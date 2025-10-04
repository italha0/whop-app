import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/render/download?url=...
 * 
 * Proxy endpoint to download videos from Appwrite (handles CORS)
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoUrl = searchParams.get('url');
    const fileId = searchParams.get('id');

    if (!videoUrl && !fileId) {
      return NextResponse.json(
        { error: 'Missing url or id parameter' },
        { status: 400 }
      );
    }

    let finalUrl = videoUrl;

    // If fileId is provided, construct the Appwrite URL
    if (fileId && !videoUrl) {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const bucketId = process.env.APPWRITE_VIDEO_BUCKET_ID;
      
      if (!endpoint || !projectId || !bucketId) {
        return NextResponse.json(
          { error: 'Appwrite configuration missing' },
          { status: 500 }
        );
      }

      finalUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
    }

    if (!finalUrl) {
      return NextResponse.json(
        { error: 'No valid URL provided' },
        { status: 400 }
      );
    }

    // Fetch the video from Appwrite
    const response = await fetch(finalUrl, {
      headers: {
        'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: response.status }
      );
    }

    // Get the video data
    const videoData = await response.arrayBuffer();
    
    // Return the video with proper headers
    return new NextResponse(videoData, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoData.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': 'attachment; filename="video.mp4"'
      }
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}