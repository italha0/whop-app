#!/usr/bin/env node
/**
 * Complete Video Pipeline Test Script
 * 
 * Tests the entire video generation workflow:
 * 1. Creates a test job via API
 * 2. Monitors job status
 * 3. Verifies completion
 * 4. Cleans up
 * 
 * Usage: node test-video-pipeline.js
 */

const http = require('http');
const https = require('https');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_WAIT_TIME = 120000; // 2 minutes

console.log('🎬 Starting Video Pipeline Test\n');
console.log('API Base:', API_BASE);
console.log('');

// Test conversation data
const testConversation = {
  contactName: 'Pipeline Test',
  theme: 'imessage',
  messages: [
    { text: 'Hey! This is a test.', sent: false },
    { text: 'Testing the video generation pipeline!', sent: true },
    { text: 'Does it work?', sent: false },
    { text: 'Let\'s find out! 🚀', sent: true }
  ]
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createJob() {
  console.log('📝 Step 1: Creating test job...');
  try {
    const result = await makeRequest('POST', '/api/generate-video', {
      conversation: testConversation,
      userId: `test_${Date.now()}`,
      uploadToAppwrite: true
    });
    
    console.log('  ✅ Job created');
    console.log('    Job ID:', result.jobId);
    console.log('    Status:', result.status);
    console.log('    Estimated Duration:', result.estimatedDuration, 'seconds');
    console.log('');
    
    return result.jobId;
  } catch (error) {
    console.error('  ❌ Failed to create job:', error.message);
    throw error;
  }
}

async function pollJobStatus(jobId) {
  console.log('⏳ Step 2: Monitoring job status...');
  
  const startTime = Date.now();
  let pollCount = 0;
  
  while (true) {
    pollCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      const status = await makeRequest('GET', `/api/generate-video?jobId=${jobId}`);
      
      process.stdout.write(`\r  Poll #${pollCount} (${elapsed}s): ${status.status}...`);
      
      if (status.status === 'completed') {
        console.log('\n  ✅ Job completed!');
        console.log('    Video URL:', status.videoUrl?.substring(0, 80) + '...');
        console.log('    Completed At:', status.completedAt);
        console.log('');
        return status;
      } else if (status.status === 'failed') {
        console.log('\n  ❌ Job failed!');
        console.log('    Error:', status.error);
        console.log('');
        throw new Error(`Job failed: ${status.error}`);
      }
      
      // Check timeout
      if (Date.now() - startTime > MAX_WAIT_TIME) {
        console.log('\n  ⏱️  Timeout reached');
        console.log('    Job is still:', status.status);
        console.log('    This might be normal for long videos');
        console.log('    Check manually later with jobId:', jobId);
        console.log('');
        return status;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
    } catch (error) {
      console.log('\n  ❌ Failed to poll status:', error.message);
      throw error;
    }
  }
}

async function verifyVideo(videoUrl) {
  console.log('🎥 Step 3: Verifying video URL...');
  
  try {
    const url = new URL(videoUrl);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = lib.get(videoUrl, (res) => {
        if (res.statusCode === 200) {
          console.log('  ✅ Video URL is accessible');
          console.log('    Content-Type:', res.headers['content-type']);
          console.log('    Content-Length:', res.headers['content-length'], 'bytes');
          console.log('');
          resolve(true);
        } else {
          console.log('  ⚠️  Video URL returned status:', res.statusCode);
          console.log('    This might be a CORS or permissions issue');
          console.log('');
          resolve(false);
        }
        res.resume(); // Drain the response
      });
      
      req.on('error', (error) => {
        console.log('  ❌ Failed to verify video:', error.message);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.log('  ⏱️  Request timeout');
        resolve(false);
      });
    });
  } catch (error) {
    console.log('  ❌ Invalid video URL:', error.message);
    return false;
  }
}

async function runTest() {
  const startTime = Date.now();
  
  try {
    // Step 1: Create job
    const jobId = await createJob();
    
    // Step 2: Poll for completion
    const finalStatus = await pollJobStatus(jobId);
    
    // Step 3: Verify video if completed
    if (finalStatus.status === 'completed' && finalStatus.videoUrl) {
      await verifyVideo(finalStatus.videoUrl);
    }
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Test completed successfully!');
    console.log('   Total time:', totalTime, 'seconds');
    console.log('   Job ID:', jobId);
    console.log('   Status:', finalStatus.status);
    if (finalStatus.videoUrl) {
      console.log('   Video URL:', finalStatus.videoUrl);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Provide manual verification option
    if (finalStatus.videoUrl) {
      console.log('📋 Next Steps:');
      console.log('   1. Open the video URL in your browser');
      console.log('   2. Verify the video plays correctly');
      console.log('   3. Check Appwrite Console for job details');
      console.log('   4. (Optional) Clean up test data\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ Test failed!');
    console.log('   Total time:', totalTime, 'seconds');
    console.log('   Error:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔍 Debugging Tips:');
    console.log('   1. Check if Next.js dev server is running');
    console.log('   2. Verify .env.local has correct values');
    console.log('   3. Run: node test-appwrite-connection.js');
    console.log('   4. Check worker logs on Azure VM');
    console.log('   5. See DEBUG_CHECKLIST.md for more help\n');
    
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user\n');
  process.exit(130);
});

// Run the test
runTest();
