// Portless worker: polls Appwrite for queued jobs, renders with Remotion, uploads to Azure Blob, updates Appwrite
const path = require('path');
const fs = require('fs');
const os = require('os');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { Client, Databases } = require('node-appwrite');

let azureBlob;
try { azureBlob = require('@azure/storage-blob'); } catch (_) {}

require('dotenv').config({ path: path.resolve(__dirname, 'worker.env') });

const CONFIG = {
	appwriteEndpoint: process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
	appwriteProject: process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
	appwriteKey: process.env.APPWRITE_API_KEY,
	databaseId: process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
	jobsCollection: process.env.APPWRITE_VIDEO_JOBS_COLLECTION_ID || process.env.APPWRITE_COLLECTION_VIDEO_JOBS_ID || 'video_jobs',
	rendersCollection: process.env.APPWRITE_VIDEO_RENDERS_COLLECTION_ID || process.env.APPWRITE_COLLECTION_VIDEO_RENDERS_ID || 'video_renders',
	azureConn: process.env.AZURE_STORAGE_CONNECTION_STRING,
	azureContainer: process.env.AZURE_BLOB_CONTAINER || 'videos',
	sasTtlMin: Number(process.env.AZURE_BLOB_SAS_TTL_MIN || '1440'),
};

if (!CONFIG.appwriteEndpoint || !CONFIG.appwriteProject || !CONFIG.appwriteKey || !CONFIG.databaseId || !CONFIG.jobsCollection) {
	console.error('❌ Worker missing required Appwrite config');
	console.error(CONFIG);
	process.exit(1);
}

const client = new Client()
	.setEndpoint(CONFIG.appwriteEndpoint)
	.setProject(CONFIG.appwriteProject)
	.setKey(CONFIG.appwriteKey);
const databases = new Databases(client);

async function pollOnce() {
	try {
		const { Query } = require('node-appwrite');
		const list = await databases.listDocuments(
			CONFIG.databaseId,
			CONFIG.jobsCollection,
			[Query.equal('status', 'queued'), Query.limit(1)]
		);
		if (!list.total) return false;

		const job = list.documents[0];
		const jobId = job.$id;

		await databases.updateDocument(CONFIG.databaseId, CONFIG.jobsCollection, jobId, { status: 'processing' });

		const conversation = safeParse(job.conversation) || {};
		const tempOutput = path.join(os.tmpdir(), `video_${jobId}_${Date.now()}.mp4`);

		// Bundle Remotion project from repo root /remotion
		const bundleLocation = await bundle({
			entryPoint: path.resolve(__dirname, '..', 'remotion', 'index.ts'),
			webpackOverride: (config) => config,
		});

		const inputProps = normalizeConversation(conversation);
		const composition = await selectComposition({ serveUrl: bundleLocation, id: 'MessageConversation', inputProps });

		await renderMedia({
			composition,
			serveUrl: bundleLocation,
			codec: 'h264',
			outputLocation: tempOutput,
			inputProps,
		});

		const stats = fs.statSync(tempOutput);

		let videoUrl = null, fileId = null;
		if (CONFIG.azureConn && azureBlob) {
			const out = await uploadToAzureBlob(tempOutput, `video_${jobId}_${Date.now()}.mp4`);
			videoUrl = out.url; fileId = out.blobName;
		}

		await databases.updateDocument(CONFIG.databaseId, CONFIG.jobsCollection, jobId, {
			status: 'completed',
			videoUrl, fileId, fileSize: stats.size, completedAt: new Date().toISOString()
		});

		if (CONFIG.rendersCollection && videoUrl && fileId) {
			try {
				await databases.createDocument(CONFIG.databaseId, CONFIG.rendersCollection, jobId, {
					status: 'completed',
					composition: 'MessageConversation',
					user_id: job.userId || 'unknown',
					input_json: job.conversation || '{}',
					file_id: fileId,
					video_url: videoUrl,
					duration_sec: job.estimatedDuration || null,
					file_size_bytes: stats.size,
				});
			} catch (e) {
				console.warn('⚠️ Failed to create video_renders doc:', e?.message || e);
			}
		}

		try { fs.unlinkSync(tempOutput); } catch (_) {}
		console.log(`✅ Processed job ${jobId}`);
		return true;
	} catch (err) {
		console.error('❌ Worker error:', err?.message || err);
		return false;
	}
}

function normalizeConversation(conv) {
	const messages = Array.isArray(conv.messages) ? conv.messages : [];
	return {
		contactName: conv.contactName || 'Contact',
		theme: conv.theme || 'imessage',
		alwaysShowKeyboard: !!conv.alwaysShowKeyboard,
		messages: messages.map((m, i) => ({
			id: i + 1,
			text: m?.text || '',
			sent: !!(m?.sent || m?.sender === 'you'),
			time: m?.time || `${Math.floor(i * 2)}:${(i * 2 * 60) % 60}`.padStart(4, '0')
		}))
	};
}

function safeParse(s) { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return null; } }

async function uploadToAzureBlob(filePath, fileName) {
	const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = azureBlob;
	const blobServiceClient = BlobServiceClient.fromConnectionString(CONFIG.azureConn);
	const containerClient = blobServiceClient.getContainerClient(CONFIG.azureContainer);
	await containerClient.createIfNotExists({ access: 'private' }).catch(() => {});
	const blockBlobClient = containerClient.getBlockBlobClient(fileName);
	await blockBlobClient.uploadFile(filePath, { blobHTTPHeaders: { blobContentType: 'video/mp4' } });
	const accountName = CONFIG.azureConn.match(/AccountName=([^;]+)/)?.[1];
	const accountKey = CONFIG.azureConn.match(/AccountKey=([^;]+)/)?.[1];
	const cred = new StorageSharedKeyCredential(accountName, accountKey);
	const expiresOn = new Date(Date.now() + CONFIG.sasTtlMin * 60 * 1000);
	const sas = generateBlobSASQueryParameters({
		containerName: CONFIG.azureContainer,
		blobName: fileName,
		permissions: BlobSASPermissions.parse('r'),
		expiresOn,
	}, cred).toString();
	return { url: `${blockBlobClient.url}?${sas}`, blobName: fileName };
}

async function main() {
	console.log('🛠️  Appwrite worker started. Polling for jobs...');
	const interval = Number(process.env.WORKER_POLL_MS || '3000');
	// eslint-disable-next-line no-constant-condition
	while (true) {
		await pollOnce();
		await new Promise((r) => setTimeout(r, interval));
	}
}

main().catch((e) => {
	console.error('Worker fatal error:', e);
	process.exit(1);
});

