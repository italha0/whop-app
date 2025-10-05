// Allow running outside Docker: load .env if present
try { require('dotenv').config(); } catch {}

const { Worker, QueueEvents } = require('bullmq');
const { readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const os = require('os');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const { uploadToAzureBlob, generateSASUrl } = require('../lib/dist/azure-blob.js');
const { RENDER_QUEUE_NAME } = require('../lib/dist/queue.js');
const fetch = require('node-fetch');

const sdk = require('node-appwrite');
const { Query } = require('node-appwrite');
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const APPWRITE_COLLECTION_VIDEO_RENDERS_ID = process.env.APPWRITE_COLLECTION_VIDEO_RENDERS_ID;
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_VIDEO_RENDERS_ID) {
  console.error('Missing Appwrite env vars');
  process.exit(1);
}
const client = new sdk.Client();

client.setEndpoint(APPWRITE_ENDPOINT);
client.setProject(APPWRITE_PROJECT_ID);
client.setKey(APPWRITE_API_KEY);
const databases = new sdk.Databases(client);
const QUEUE_ENABLED = process.env.RENDER_QUEUE_ENABLED === 'true';

// Quick Azure sanity hint on startup
if (!process.env.AZURE_STORAGE_CONNECTION_STRING || !process.env.AZURE_STORAGE_ACCOUNT_NAME || !process.env.AZURE_STORAGE_ACCOUNT_KEY) {
  console.warn('[WORKER] Azure envs missing (no upload possible): AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY');
}

// Debug: print which project and role we're using (do not log secrets)
try {
  const role = JSON.parse(Buffer.from(SERVICE_KEY.split('.')[1], 'base64').toString('utf8')).role;
} catch { /* ignore */ }

async function fetchJob(jobId) {
  try {
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_VIDEO_RENDERS_ID,
      jobId
    );
    return doc;
  } catch (e) {
    return null;
  }
}
async function updateJob(jobId, patch) {
  try {
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_VIDEO_RENDERS_ID,
      jobId,
      { ...patch, updated_at: new Date().toISOString() }
    );
  } catch (e) {
    // handle error
  }
}
async function processRender(jobId){
  const record = await fetchJob(jobId);
  if (!record) throw new Error('Record not found');
  if (record.status !== 'pending' && record.status !== 'processing') return;
  
  // Only update to processing if it's pending (avoid race conditions)
  if (record.status === 'pending') {
    await updateJob(jobId, { status:'processing' });
  }
  const compositionId = record.composition_id || 'MessageConversation';
  const inputProps = record.input_props || {};
  // Use system Chromium instead of bundled Chrome Headless Shell
  if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      let foundPath = '';
      if (process.platform === 'win32') {
        try {
          const { stdout } = await execAsync('where chrome');
          foundPath = (stdout || '').split(/\r?\n/).find(Boolean) || '';
        } catch {}
        if (!foundPath) {
          try {
            const { stdout } = await execAsync('where msedge');
            foundPath = (stdout || '').split(/\r?\n/).find(Boolean) || '';
          } catch {}
        }
      } else {
        try {
          const { stdout } = await execAsync('which chromium');
          foundPath = (stdout || '').trim();
        } catch {}
        if (!foundPath) {
          try {
            const { stdout } = await execAsync('which google-chrome');
            foundPath = (stdout || '').trim();
          } catch {}
        }
      }
      if (foundPath) {
        process.env.REMOTION_BROWSER_EXECUTABLE = foundPath.trim();
        process.env.PUPPETEER_EXECUTABLE_PATH = foundPath.trim();
        console.log('[WORKER] Using system Chromium/Chrome at', foundPath.trim());
      } else {
        // Fallback to serverless chromium
        try {
          const chromium = require('@sparticuz/chromium');
          const execPath = await chromium.executablePath();
          process.env.REMOTION_BROWSER_EXECUTABLE = execPath;
          process.env.PUPPETEER_EXECUTABLE_PATH = execPath;
          console.log('[WORKER] Using serverless Chromium at', execPath);
        } catch (e2) {
          console.error('[WORKER] Could not resolve any Chromium executable', e2?.message || e2);
        }
      }
    } catch (e) {
      console.warn('[WORKER] Browser executable detection errored', e?.message || e);
    }
  }
  const marker = join(process.cwd(),'prebundled','serveUrl.txt');
  const preferPrebundled = process.env.REMOTION_USE_PREBUNDLED === 'true';
  let serveUrl = null;
  if (preferPrebundled && existsSync(marker)) {
    serveUrl = readFileSync(marker,'utf-8').trim();
    console.log('[WORKER] Using prebundled Remotion from', marker);
  } else {
    const { bundle } = require('@remotion/bundler');
    serveUrl = await bundle(join(process.cwd(),'remotion','index.ts'));
    console.log('[WORKER] Bundled fresh Remotion project');
  }
  const comps = await getCompositions(serveUrl, { inputProps });
  const comp = comps.find(c=> c.id === compositionId);
  if (!comp) throw new Error('Composition not found: '+compositionId);
  const msgCount = (inputProps.messages || []).length;
  const minSeconds = 10; // align with PreviewPanel
  const perMessageSeconds = 4;
  const desired = Math.round(Math.max(minSeconds, msgCount * perMessageSeconds) * comp.fps);
  const durationInFrames = desired;
  const workDir = process.env.WORK_DIR || os.tmpdir();
  const outDir = join(workDir,'renders');
  if (!existsSync(outDir)) mkdirSync(outDir,{ recursive:true });
  const outputPath = join(outDir, `${jobId}.mp4`);
  const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
  await renderMedia({ 
    composition:{ ...comp, durationInFrames }, 
    serveUrl, 
    codec:'h264', 
    outputLocation: outputPath, 
    inputProps, 
    scale: 2,
    crf: 15,
    concurrency:1,
    timeoutInMilliseconds: 120000,
    browserExecutable,
    chromiumOptions: {
      headless: true,
      disableWebSecurity: true,
      enableMultiProcessOnLinux: true,
      allowHTTP1ForStreaming: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    }
  });
  const blobName = await uploadToAzureBlob(outputPath, `${jobId}.mp4`, 'videos', 'chat-video.mp4');
  const sasUrl = generateSASUrl(blobName, 60);
  const baseUrl = typeof sasUrl === 'string' ? sasUrl.split('?')[0] : '';
  await updateJob(jobId,{ status:'done', url: baseUrl, blob_name: blobName });
}
let worker = null;
if (QUEUE_ENABLED) {
  if (!process.env.REDIS_URL) {
    console.warn('[WORKER] RENDER_QUEUE_ENABLED is true but REDIS_URL is missing. Queue processing disabled.');
  } else {
    worker = new Worker(RENDER_QUEUE_NAME, async (job)=>{ const { jobId } = job.data; try { await processRender(jobId); return { success:true }; } catch(e){ console.error('[WORKER] Job failed', jobId, e); await updateJob(jobId,{ status:'error', error_message: e.message }); throw e; } }, { connection:{ url: process.env.REDIS_URL, maxRetriesPerRequest: 1, connectTimeout: 2000 }});
    new QueueEvents(RENDER_QUEUE_NAME,{ connection:{ url: process.env.REDIS_URL, maxRetriesPerRequest: 1, connectTimeout: 2000 }});
    worker.on('completed',(job)=> console.log('Job completed', job.id));
    worker.on('failed',(job,err)=> console.log('Job failed', job?.id, err?.message));
    console.log('[WORKER] Queue worker started');
  }
}

// Polling fallback: pick up pending jobs even if Redis is unavailable or enqueue failed.
async function pollingSweep(){
  try{
    // Query Appwrite for pending/processing jobs
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_VIDEO_RENDERS_ID,
        [
          Query.equal('status', ['pending', 'processing']),
          Query.orderAsc('$createdAt'),
          Query.limit(5)
        ]
      );
      const rows = res.documents || [];
      console.log(`[WORKER] sweep: ${rows.length} pending`);
      for (const row of rows) {
        console.log('[WORKER] processing pending job', row.$id);
        try {
          await processRender(row.$id);
        } catch (e) {
          console.error('[WORKER] Fallback processing failed', row.$id, e?.message || e);
          try { await updateJob(row.$id, { status: 'error', error_message: (e && e.message) || String(e) }); } catch {}
        }
      }
      if (rows.length === 0) {
        // Extra debug: fetch a few recent rows to validate visibility and statuses
        const sampleRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_VIDEO_RENDERS_ID,
          [
            { attribute: 'order', operator: 'desc', values: ['created_at'] },
            { attribute: 'limit', operator: 'equal', values: [3] }
          ]
        );
        const sample = sampleRes.documents || [];
        console.log('[WORKER] recent rows (id,status):', sample.map(r => `${r.$id}:${r.status}`).join(', '));
      }
    } catch (e) {
      console.error('[WORKER] polling sweep error', e?.message || e);
    }
  } catch (e){ console.error('[WORKER] polling sweep error', e?.message||e); }
}
setInterval(pollingSweep, 15000);
pollingSweep();
console.log('[WORKER] Polling fallback active');
