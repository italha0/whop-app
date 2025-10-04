import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'node-appwrite';
import crypto from 'crypto';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_KEY = process.env.APPWRITE_KEY!;
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET!;

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Update user subscription status in Appwrite
async function updateUserSubscription(
  whopUserId: string,
  status: 'active' | 'cancelled' | 'expired',
  subscriptionData: any
) {
  try {
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setKey(APPWRITE_KEY);

    const databases = new Databases(client);

    // Check if subscription record exists
    const existingSubscriptions = await databases.listDocuments(
      'main', // Replace with your database ID
      'subscriptions', // Replace with your subscriptions collection ID
      [`whopUserId=${whopUserId}`]
    );

    const subscriptionData = {
      whopUserId,
      status,
      subscriptionId: subscriptionData.id,
      planId: subscriptionData.plan_id,
      companyId: subscriptionData.company_id,
      agentUserId: subscriptionData.agent_user_id,
      startDate: subscriptionData.start_date,
      endDate: subscriptionData.end_date,
      updatedAt: new Date().toISOString(),
      ...subscriptionData
    };

    if (existingSubscriptions.documents.length > 0) {
      // Update existing subscription
      await databases.updateDocument(
        'main',
        'subscriptions',
        existingSubscriptions.documents[0].$id,
        subscriptionData
      );
    } else {
      // Create new subscription
      await databases.createDocument(
        'main',
        'subscriptions',
        'unique()',
        subscriptionData
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-whop-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, WHOP_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(body);
    const { event_type, data } = webhookData;

    console.log('Whop webhook received:', event_type, data);

    let result;

    switch (event_type) {
      case 'subscription.created':
      case 'subscription.activated':
        result = await updateUserSubscription(
          data.agent_user_id,
          'active',
          data
        );
        break;

      case 'subscription.cancelled':
        result = await updateUserSubscription(
          data.agent_user_id,
          'cancelled',
          data
        );
        break;

      case 'subscription.expired':
        result = await updateUserSubscription(
          data.agent_user_id,
          'expired',
          data
        );
        break;

      case 'subscription.refunded':
        result = await updateUserSubscription(
          data.agent_user_id,
          'cancelled',
          data
        );
        break;

      case 'subscription.renewed':
        result = await updateUserSubscription(
          data.agent_user_id,
          'active',
          data
        );
        break;

      default:
        console.log('Unhandled webhook event:', event_type);
        return NextResponse.json({ message: 'Event not handled' }, { status: 200 });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update subscription', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

