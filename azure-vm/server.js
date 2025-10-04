const express = require('express');
const cors = require('cors');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
// Azure Blob Storage SDK (optional - enabled if env is present)
let azureBlob;
try {
  azureBlob = require('@azure/storage-blob');
} catch (_) {
  // Dependency may not be installed locally; upload is conditional on env + dep
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Main render endpoint
app.post('/api/render', async (req, res) => {
  const { jobId, conversation, uploadToAppwrite, webhookUrl } = req.body;
  
  if (!jobId || !conversation) {
    return res.status(400).json({ error: 'Missing required fields: jobId, conversation' });
  }

  console.log(`🎬 Starting render for job ${jobId}`);
  console.log('Conversation:', JSON.stringify(conversation, null, 2));

  const tempOutput = path.join(os.tmpdir(), `video_${jobId}_${Date.now()}.mp4`);
  
  try {
    // Bundle Remotion project
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, 'remotion/index.ts'),
      webpackOverride: (config) => {
        // Add any webpack overrides if needed
        return config;
      },
    });

    console.log('✅ Bundle created at:', bundleLocation);

    // Select composition
    console.log('🎯 Selecting composition...');
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MessageConversation',
      inputProps: {
        contactName: conversation.contactName || 'Contact',
        theme: conversation.theme || 'imessage',
        alwaysShowKeyboard: conversation.alwaysShowKeyboard || false,
        messages: conversation.messages.map((msg, index) => ({
          id: index + 1,
          text: msg.text || '',
          sent: msg.sent || false,
          time: msg.time || `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
        }))
      },
    });

    console.log('✅ Composition selected:', compositions.id);

    // Render video
    console.log('🎥 Starting video render...');
    await renderMedia({
      composition: compositions,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: tempOutput,
      inputProps: {
        contactName: conversation.contactName || 'Contact',
        theme: conversation.theme || 'imessage',
        alwaysShowKeyboard: conversation.alwaysShowKeyboard || false,
        messages: conversation.messages.map((msg, index) => ({
          id: index + 1,
          text: msg.text || '',
          sent: msg.sent || false,
          time: msg.time || `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
        }))
      },
    });

    console.log(`✅ Video rendered successfully: ${tempOutput}`);

    // Check if file exists and get size
    const stats = fs.statSync(tempOutput);
    console.log(`📊 Video file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    let videoUrl = null;
    let fileId = null;

    // Prefer Azure Blob upload if configured
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.log('📤 Uploading to Azure Blob Storage...');
      try {
        const upload = await uploadToAzureBlob(tempOutput, `video_${jobId}_${Date.now()}.mp4`);
        videoUrl = upload.url; // SAS URL
        fileId = upload.blobName;
        console.log('✅ Azure Blob upload successful:', videoUrl);
      } catch (azureErr) {
        console.error('❌ Azure Blob upload failed:', azureErr?.message || azureErr);
      }
    }

    // Upload to Appwrite if configured
    if (!videoUrl && uploadToAppwrite && process.env.APPWRITE_ENDPOINT) {
      console.log('📤 Uploading to Appwrite...');
      try {
        const uploadResult = await uploadToAppwrite(tempOutput, jobId);
        videoUrl = uploadResult.videoUrl;
        fileId = uploadResult.fileId;
        console.log('✅ Upload successful:', videoUrl);
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        // Continue without upload
      }
    }

    // Send webhook notification
    if (webhookUrl) {
      console.log('📡 Sending webhook notification...');
      try {
        await axios.post(webhookUrl, {
          jobId,
          status: 'completed',
          videoUrl,
          fileId,
          fileSize: stats.size
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-azure-signature': generateWebhookSignature({ jobId, status: 'completed', videoUrl, fileId })
          },
          timeout: 10000
        });
        console.log('✅ Webhook sent successfully');
      } catch (webhookError) {
        console.error('❌ Webhook failed:', webhookError.message);
        // Don't fail the request if webhook fails
      }
    }

    // Clean up temp file
    try {
      fs.unlinkSync(tempOutput);
      console.log('🗑️ Temp file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temp file:', cleanupError.message);
    }

    res.json({ 
      success: true, 
      jobId,
      videoUrl,
      fileId,
      fileSize: stats.size,
      message: 'Video rendered successfully'
    });

  } catch (error) {
    console.error('❌ Render error:', error);
    
    // Send failure webhook
    if (webhookUrl) {
      try {
        await axios.post(webhookUrl, {
          jobId,
          status: 'failed',
          error: error.message
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-azure-signature': generateWebhookSignature({ jobId, status: 'failed', error: error.message })
          },
          timeout: 10000
        });
      } catch (webhookError) {
        console.error('❌ Failure webhook failed:', webhookError.message);
      }
    }

    // Clean up temp file on error
    try {
      if (fs.existsSync(tempOutput)) {
        fs.unlinkSync(tempOutput);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temp file after error:', cleanupError.message);
    }

    res.status(500).json({ 
      error: error.message,
      jobId,
      message: 'Video rendering failed'
    });
  }
});

// Upload to Appwrite function
async function uploadToAppwrite(filePath, jobId) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `video_${jobId}_${Date.now()}.mp4`;
  
  const response = await axios.post(
    `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_VIDEO_BUCKET_ID}/files`,
    fileBuffer,
    {
      headers: {
        'Content-Type': 'video/mp4',
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
        'X-Appwrite-Response-Format': 'json'
      }
    }
  );

  const fileId = response.data.$id;
  const videoUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${process.env.APPWRITE_VIDEO_BUCKET_ID}/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
  
  return { videoUrl, fileId };
}

// Upload to Azure Blob Storage (if configured)
async function uploadToAzureBlob(filePath, fileName) {
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING not set');
  }
  if (!azureBlob) {
    throw new Error('@azure/storage-blob is not installed');
  }

  const containerName = process.env.AZURE_BLOB_CONTAINER || 'videos';
  const {
    BlobServiceClient,
    StorageSharedKeyCredential,
    generateBlobSASQueryParameters,
    BlobSASPermissions
  } = azureBlob;

  // Initialize clients
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists({ access: 'private' }).catch(() => {});

  // Upload
  const blobName = fileName;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadFile(filePath, {
    blobHTTPHeaders: { blobContentType: 'video/mp4' }
  });

  // Build SAS URL (default 24h)
  const accountName = process.env.AZURE_STORAGE_ACCOUNT || (process.env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/)?.[1]);
  const accountKey = process.env.AZURE_STORAGE_KEY || (process.env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/)?.[1]);
  if (!accountName || !accountKey) {
    throw new Error('Failed to parse storage account name/key');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + (process.env.AZURE_BLOB_SAS_TTL_MIN ? Number(process.env.AZURE_BLOB_SAS_TTL_MIN) : 1440) * 60 * 1000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn
    },
    sharedKeyCredential
  ).toString();

  const url = `${blockBlobClient.url}?${sas}`;
  return { url, blobName };
}

// Generate webhook signature
function generateWebhookSignature(payload) {
  const secret = process.env.AZURE_WEBHOOK_SECRET;
  if (!secret) return null;
  
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Azure VM video renderer running on port ${PORT}`);
  console.log(`📁 Working directory: ${__dirname}`);
  console.log(`🎬 Remotion project: ${path.resolve(__dirname, 'remotion')}`);
});
