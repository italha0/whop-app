import { NextRequest, NextResponse } from 'next/server';
import { Client, Account, Databases } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_KEY = process.env.APPWRITE_KEY!;
const AZURE_RENDER_URL = process.env.AZURE_RENDER_URL!;
const AZURE_API_KEY = process.env.AZURE_API_KEY!;

// Check if user has active subscription
async function checkUserSubscription(userId: string): Promise<boolean> {
  try {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setKey(APPWRITE_KEY);

    const databases = new Databases(client);
    
    // Query user's subscription status from Appwrite
    const result = await databases.listDocuments(
      'main', // Replace with your database ID
      'subscriptions', // Replace with your subscriptions collection ID
      [
        `userId=${userId}`,
        'status=active'
      ]
    );

    return result.documents.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, renderData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user has active subscription
    const hasSubscription = await checkUserSubscription(userId);
    
    if (!hasSubscription) {
      return NextResponse.json(
        { error: 'Active subscription required to render videos' },
        { status: 403 }
      );
    }

    // Forward request to Azure VM
    const azureResponse = await fetch(`${AZURE_RENDER_URL}/api/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AZURE_API_KEY}`,
      },
      body: JSON.stringify(renderData),
    });

    if (!azureResponse.ok) {
      const errorData = await azureResponse.json();
      return NextResponse.json(
        { error: 'Azure render service error', details: errorData },
        { status: azureResponse.status }
      );
    }

    const result = await azureResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Render job submitted successfully'
    });

  } catch (error: any) {
    console.error('Render job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user has active subscription
    const hasSubscription = await checkUserSubscription(userId);
    
    if (!hasSubscription) {
      return NextResponse.json(
        { error: 'Active subscription required to check render status' },
        { status: 403 }
      );
    }

    // Forward request to Azure VM
    const url = jobId 
      ? `${AZURE_RENDER_URL}/api/render/${jobId}`
      : `${AZURE_RENDER_URL}/api/render?userId=${userId}`;

    const azureResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AZURE_API_KEY}`,
      },
    });

    if (!azureResponse.ok) {
      const errorData = await azureResponse.json();
      return NextResponse.json(
        { error: 'Azure render service error', details: errorData },
        { status: azureResponse.status }
      );
    }

    const result = await azureResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      data: result
    });

  } catch (error: any) {
    console.error('Render status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

