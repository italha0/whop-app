import { NextRequest, NextResponse } from 'next/server';
import { Client, Account, Databases, Functions } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_KEY = process.env.APPWRITE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, userId } = body;

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setKey(APPWRITE_KEY);

    const account = new Account(client);
    const databases = new Databases(client);
    const functions = new Functions(client);

    let result;

    switch (action) {
      case 'createAccount':
        result = await account.create('unique()', data.email, data.password, data.name);
        break;
      
      case 'createEmailSession':
        result = await account.createEmailSession(data.email, data.password);
        break;
      
      case 'getAccount':
        result = await account.get();
        break;
      
      case 'createDocument':
        result = await databases.createDocument(
          data.databaseId,
          data.collectionId,
          'unique()',
          data.documentData
        );
        break;
      
      case 'listDocuments':
        result = await databases.listDocuments(
          data.databaseId,
          data.collectionId,
          data.queries || []
        );
        break;
      
      case 'getDocument':
        result = await databases.getDocument(
          data.databaseId,
          data.collectionId,
          data.documentId
        );
        break;
      
      case 'updateDocument':
        result = await databases.updateDocument(
          data.databaseId,
          data.collectionId,
          data.documentId,
          data.documentData
        );
        break;
      
      case 'deleteDocument':
        result = await databases.deleteDocument(
          data.databaseId,
          data.collectionId,
          data.documentId
        );
        break;
      
      case 'createExecution':
        result = await functions.createExecution(
          data.functionId,
          data.data || '',
          data.async || false
        );
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Appwrite proxy error:', error);
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
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setKey(APPWRITE_KEY);

    const account = new Account(client);
    const databases = new Databases(client);

    let result;

    switch (action) {
      case 'getAccount':
        result = await account.get();
        break;
      
      case 'listDocuments':
        const databaseId = searchParams.get('databaseId');
        const collectionId = searchParams.get('collectionId');
        if (!databaseId || !collectionId) {
          return NextResponse.json({ error: 'Missing databaseId or collectionId' }, { status: 400 });
        }
        result = await databases.listDocuments(databaseId, collectionId);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Appwrite proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

