#!/usr/bin/env node

/**
 * Video Rendering Worker for Whop App
 * Processes video render jobs from Redis queue using Remotion
 * Supports emoji rendering and Azure Blob Storage upload
 */

const { Worker } = require('bullmq');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

// Configuration
const RENDER_QUEUE_NAME = 'video-render-jobs';
const WORK_DIR = process.env.WORK_DIR || os.tmpdir();
const REMOTION_ENTRY_POINT = path.join(__dirname, '..', 'remotion', 'index.ts');

// Environment validation
const requiredEnvVars = [
  'REDIS_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AZURE_STORAGE_CONNECTION_STRING',
  'AZURE_STORAGE_ACCOUNT_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Emoji rendering utilities for video
const renderEmojiForVideo = (text) => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  const escapedText = escapeHtml(text);
  
  // Use font-based emoji rendering for video compatibility
  return `<span style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Segoe UI Symbol',system-ui,sans-serif;font-size:inherit;line-height:inherit;">${escapedText}</span>`;
};

// Process emoji text in render data
const processEmojiText = (renderData) => {
  if (!renderData) return renderData;
  
  const processObject = (obj) => {
    if (typeof obj === 'string') {
      return renderEmojiForVideo(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(processObject);
    }
    
    if (obj && typeof obj === 'object') {
      const processed = {};
      for (const [key, value] of Object.entries(obj)) {
        // Process text fields that might contain emojis
        if (key.includes('text') || key.includes('message') || key.includes('content')) {
          processed[key] = typeof value === 'string' ? renderEmojiForVideo(value) : processObject(value);
        } else {
          processed[key] = processObject(value);
        }
      }
      return processed;
    }
    
    return obj;
  };
  
  return processObject(renderData);
};

// Upload video to Azure Blob Storage
async function uploadToAzure(filePath, fileName) {
  try {
    const containerName = 'videos';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob'
    });
    
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    console.log(`📤 Uploading ${fileName} to Azure Blob Storage...`);
    
    const uploadResponse = await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: {
        blobContentType: 'video/mp4'
      }
    });
    
    const videoUrl = blockBlobClient.url;
    console.log(`✅ Upload successful: ${videoUrl}`);
    
    return videoUrl;
  } catch (error) {
    console.error('❌ Azure upload failed:', error);
    throw error;
  }
}

// Update render status in database
async function updateRenderStatus(renderId, status, data = {}) {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...data
    };
    
    const { error } = await supabase
      .from('video_renders')
      .update(updateData)
      .eq('id', renderId);
    
    if (error) {
      console.error('❌ Database update failed:', error);
      throw error;
    }
    
    console.log(`📝 Updated render ${renderId} status to: ${status}`);
  } catch (error) {
    console.error('❌ Failed to update render status:', error);
    throw error;
  }
}

// Main render processing function
async function processRenderJob(job) {
  const { renderId, compositionId, inputProps, outputFileName } = job.data;
  
  console.log(`🎬 Starting render job: ${renderId}`);
  console.log(`📋 Composition: ${compositionId}`);
  
  let outputPath = null;
  
  try {
    // Update status to processing
    await updateRenderStatus(renderId, 'processing');
    
    // Process emoji text in input props
    const processedProps = processEmojiText(inputProps);
    console.log('✨ Processed emojis in render data');
    
    // Create temporary output path
    outputPath = path.join(WORK_DIR, `${renderId}-${outputFileName || 'video.mp4'}`);
    
    // Bundle Remotion project
    console.log('📦 Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: REMOTION_ENTRY_POINT,
      webpackOverride: (config) => {
        // Ensure emoji fonts are available
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...config.resolve.fallback,
          "fs": false,
          "path": false,
          "os": false
        };
        return config;
      }
    });
    
    // Get composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: processedProps
    });
    
    console.log(`🎯 Selected composition: ${composition.id} (${composition.width}x${composition.height}, ${composition.fps}fps, ${composition.durationInFrames} frames)`);
    
    // Render video with emoji support
    console.log('🎥 Rendering video...');
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: processedProps,
      imageFormat: 'jpeg',
      envVariables: {
        // Ensure emoji fonts are available in the rendering environment
        FONTCONFIG_PATH: '/etc/fonts',
        FC_CONFIG_FILE: '/etc/fonts/fonts.conf'
      },
      chromiumOptions: {
        // Enable font rendering for emojis
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
          '--enable-font-antialiasing',
          '--force-color-profile=srgb'
        ]
      },
      onProgress: ({ progress }) => {
        const percentage = Math.round(progress * 100);
        if (percentage % 10 === 0) {
          console.log(`📊 Render progress: ${percentage}%`);
        }
      }
    });
    
    console.log('✅ Video rendering completed');
    
    // Upload to Azure
    const fileName = `${renderId}-${Date.now()}.mp4`;
    const videoUrl = await uploadToAzure(outputPath, fileName);
    
    // Update database with success
    await updateRenderStatus(renderId, 'done', {
      url: videoUrl,
      blob_name: fileName
    });
    
    console.log(`🎉 Render job completed successfully: ${renderId}`);
    
  } catch (error) {
    console.error(`❌ Render job failed: ${renderId}`, error);
    
    // Update database with error
    await updateRenderStatus(renderId, 'error', {
      error_message: error.message || 'Unknown error occurred'
    });
    
    throw error;
  } finally {
    // Cleanup temporary file
    if (outputPath && fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log('🧹 Cleaned up temporary file');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temporary file:', cleanupError);
      }
    }
  }
}

// Create worker
const worker = new Worker(RENDER_QUEUE_NAME, processRenderJob, {
  connection: {
    url: process.env.REDIS_URL,
    connectTimeout: 5000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 30000,
  },
  concurrency: 2, // Process 2 jobs simultaneously
  removeOnComplete: 1000,
  removeOnFail: 1000,
});

// Worker event handlers
worker.on('ready', () => {
  console.log('🚀 Video render worker is ready and waiting for jobs...');
  console.log(`📍 Queue: ${RENDER_QUEUE_NAME}`);
  console.log(`🔧 Work directory: ${WORK_DIR}`);
  console.log(`🎨 Emoji rendering: Enabled`);
  console.log(`☁️ Azure Storage: ${process.env.AZURE_STORAGE_ACCOUNT_NAME}`);
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
});

console.log('🎬 Video Render Worker starting...');
console.log('✨ Emoji rendering support enabled');
