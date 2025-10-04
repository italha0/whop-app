import { Client, Account, Databases } from 'node-appwrite';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const client = new Client();
  const cookieStore = cookies();

  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  // For server-side, we might need to set the session from cookies
  // Appwrite SDK handles this automatically if cookies are passed correctly
  // For direct API key usage, it would be client.setKey(process.env.APPWRITE_API_KEY!);

  const account = new Account(client);
  const databases = new Databases(client);

  return { client, account, databases };
}
