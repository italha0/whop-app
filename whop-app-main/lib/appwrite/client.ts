import { Client, Account, Databases } from 'node-appwrite';

export function createClient() {
  const client = new Client();

  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const account = new Account(client);
  const databases = new Databases(client);

  return { client, account, databases };
}
