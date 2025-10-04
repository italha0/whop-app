// Import JS module without TypeScript types (ambient declarations added)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = require('@azure/storage-blob');
import { extname } from 'path';
import { createReadStream } from 'fs';

let blobServiceClient: any = null;

function parseConnectionString(connStr: string): { accountName: string; accountKey: string } {
  const parts = Object.fromEntries(
    connStr.split(';')
      .map((kv) => kv.trim())
      .filter(Boolean)
      .map((kv) => {
        const idx = kv.indexOf('=');
        return idx === -1 ? [kv, ''] : [kv.slice(0, idx), kv.slice(idx + 1)];
      })
  ) as any;
  const accountName = parts.AccountName || parts.accountname;
  const accountKey = parts.AccountKey || parts.accountkey;
  if (!accountName || !accountKey) throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING: missing AccountName/AccountKey');
  return { accountName, accountKey };
}

function getBlobServiceClient() {
  if (blobServiceClient) return blobServiceClient;
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING env var required');
  blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  return blobServiceClient;
}

export async function uploadToAzureBlob(
  filePath: string,
  blobName: string,
  containerName = 'videos',
  downloadFilename?: string
): Promise<string> {
  const client = getBlobServiceClient();
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists();
  if (!blobName.includes('.')) {
    // naive ensure extension
    blobName += extname(filePath) || '.mp4';
  }
  const contentDisposition = downloadFilename ? `attachment; filename="${downloadFilename}"` : undefined;
  const blockBlob = container.getBlockBlobClient(blobName);
  const stream = createReadStream(filePath);
  await blockBlob.uploadStream(stream, 4 * 1024 * 1024, 5, {
    blobHTTPHeaders: { blobContentType: 'video/mp4', contentDisposition },
  });
  return blockBlob.name; // return just the blob name; caller can build SAS URL
}

export function generateSASUrl(blobName: string, expiryMinutes = 60, containerName = 'videos'): string {
  const SAS_VERSION = '2023-11-03';
  // Prefer deriving creds from the same connection string used for upload to avoid mismatches
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  let accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  let accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (connStr) {
    try {
      const parsed = parseConnectionString(connStr);
      accountName = parsed.accountName;
      accountKey = parsed.accountKey;
    } catch (e) {
      // Fall back to explicit envs if parsing fails
    }
  }
  if (!accountName || !accountKey) throw new Error('AZURE storage credentials required (set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY)');
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const sas = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(Date.now() - 5 * 60 * 1000),
    expiresOn,
    protocol: SASProtocol.Https,
    version: SAS_VERSION,
  }, sharedKeyCredential).toString();
  return `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sas}`;
}
