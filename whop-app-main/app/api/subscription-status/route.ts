import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_KEY = process.env.APPWRITE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setKey(APPWRITE_KEY);

    const databases = new Databases(client);

    // Query user's subscription status
    const result = await databases.listDocuments(
      'main', // Replace with your database ID
      'subscriptions', // Replace with your subscriptions collection ID
      [
        `whopUserId=${userId}`,
        'status=active'
      ]
    );

    const hasActiveSubscription = result.documents.length > 0;
    const subscription = hasActiveSubscription ? result.documents[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription,
        subscription: subscription ? {
          id: subscription.$id,
          status: subscription.status,
          planId: subscription.planId,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          companyId: subscription.companyId
        } : null
      }
    });

  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

