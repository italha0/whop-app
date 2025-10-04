# Video Generation Debugging Checklist

Run through this checklist to identify where your video generation is failing.

## ✅ Pre-Flight Checks

### 1. Environment Variables (Frontend)
- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` is set
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is set
- [ ] `NEXT_PUBLIC_APPWRITE_DATABASE_ID` is set
- [ ] `APPWRITE_API_KEY` is set
- [ ] `APPWRITE_VIDEO_JOBS_COLLECTION_ID` is set
- [ ] `APPWRITE_VIDEO_RENDERS_COLLECTION_ID` is set
- [ ] `RENDER_MODE=worker` is set

**Test**: Run `node test-appwrite-connection.js`

### 2. Environment Variables (Worker VM)
- [ ] `APPWRITE_ENDPOINT` is set in `worker/worker.env`
- [ ] `APPWRITE_PROJECT_ID` is set
- [ ] `APPWRITE_API_KEY` is set
- [ ] `APPWRITE_DATABASE_ID` is set
- [ ] `APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs`
- [ ] `AZURE_STORAGE_CONNECTION_STRING` is set
- [ ] `AZURE_BLOB_CONTAINER=videos`

**Test**: SSH to VM and run:
```bash
cd /path/to/worker
node -e "require('dotenv').config({path:'worker.env'}); console.log(process.env)"
```

### 3. Appwrite Database Setup
- [ ] Database `68d22ef500286098806d` exists
- [ ] Collection `video_jobs` exists with correct schema
- [ ] Collection `video_renders` exists with correct schema
- [ ] API Key has permissions to create/update/delete documents

**Test**: Check Appwrite Console → Database

### 4. Azure Storage Setup
- [ ] Storage account `italha0` exists
- [ ] Container `videos` exists
- [ ] Connection string is valid
- [ ] Container is set to "Private" access level

**Test**: Run on VM:
```bash
az storage container show --name videos --account-name italha0
```

---

## 🔍 Debugging Steps

### Step 1: Test Frontend API Route

**What to test**: Can the frontend create a job in Appwrite?

**How to test**:
1. Open browser console
2. Go to video generator page
3. Click "Generate Video"
4. Look for POST request to `/api/generate-video`

**Expected**: 
```json
{
  "jobId": "job_xxx",
  "status": "queued",
  "estimatedDuration": 30,
  "message": "Video generation queued (worker will process)"
}
```

**If it fails**:
- ❌ 400 error → Check conversation data format
- ❌ 401 error → Check Appwrite authentication
- ❌ 500 error → Check server logs: `npm run dev` output

### Step 2: Verify Job Created in Appwrite

**What to test**: Is the job visible in Appwrite database?

**How to test**:
1. Go to Appwrite Console
2. Navigate to Database → video_jobs
3. Look for the job by jobId

**Expected**: Document with:
- `status: "queued"`
- `conversation: "..."`
- `userId: "..."`
- `createdAt: "..."`

**If it fails**:
- ❌ No document → Check API route logs
- ❌ Permission denied → Check Appwrite collection permissions

### Step 3: Check Worker is Running

**What to test**: Is the worker polling for jobs?

**How to test** (on Azure VM):
```bash
sudo systemctl status video-worker
sudo journalctl -u video-worker -f
```

**Expected**: Logs showing:
```
🛠️  Appwrite worker started. Polling for jobs...
```

**If it fails**:
- ❌ Service not running → `sudo systemctl start video-worker`
- ❌ Service failing → Check logs for errors
- ❌ No service → Create systemd service (see SETUP_VIDEO_GENERATION.md)

### Step 4: Check Worker Can Connect to Appwrite

**What to test**: Can the worker read from Appwrite?

**How to test** (on Azure VM):
```bash
cd /path/to/worker
node -e "
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: 'worker.env' });
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const db = new Databases(client);
db.listDocuments(
  process.env.APPWRITE_DATABASE_ID,
  'video_jobs',
  [Query.equal('status', 'queued'), Query.limit(1)]
).then(r => console.log('✅ Connected:', r.total, 'jobs'))
  .catch(e => console.error('❌ Error:', e.message));
"
```

**Expected**: `✅ Connected: X jobs`

**If it fails**:
- ❌ Connection error → Check `worker.env` credentials
- ❌ Collection not found → Check collection ID

### Step 5: Check Worker Can Render Video

**What to test**: Can Remotion render a test video?

**How to test** (on Azure VM):
```bash
cd /path/to/whop-app
npm run remotion:render
```

**Expected**: Video file created at `out/video.mp4`

**If it fails**:
- ❌ Chromium error → Install: `sudo apt-get install chromium-browser`
- ❌ Module not found → Run: `npm install`
- ❌ Rendering error → Check Remotion configuration

### Step 6: Check Worker Can Upload to Azure

**What to test**: Can the worker upload files to Azure Blob?

**How to test** (on Azure VM):
```bash
cd /path/to/worker
node -e "
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config({ path: 'worker.env' });
const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_BLOB_CONTAINER || 'videos';
const blobService = BlobServiceClient.fromConnectionString(connStr);
const containerClient = blobService.getContainerClient(containerName);
containerClient.exists()
  .then(exists => console.log('✅ Container exists:', exists))
  .catch(e => console.error('❌ Error:', e.message));
"
```

**Expected**: `✅ Container exists: true`

**If it fails**:
- ❌ Container doesn't exist → Create it in Azure Portal
- ❌ Connection error → Check connection string

### Step 7: Monitor Job Processing

**What to test**: Watch a job go from queued → processing → completed

**How to test**:

1. **Terminal 1** (Worker logs):
```bash
sudo journalctl -u video-worker -f
```

2. **Terminal 2** (Create test job):
```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "contactName": "Test",
      "messages": [
        {"text": "Hello", "sent": false},
        {"text": "Hi there!", "sent": true}
      ]
    },
    "userId": "test_user"
  }'
```

3. **Terminal 3** (Poll status):
```bash
# Replace JOB_ID with the jobId from step 2
curl http://localhost:3000/api/generate-video?jobId=JOB_ID
```

**Expected Flow**:
1. Job created with `status: "queued"`
2. Worker logs: "Processed job xxx"
3. Job updated to `status: "completed"` with `videoUrl`

**If it fails at each stage**:
- ❌ Stuck in "queued" → Worker not running or can't see job
- ❌ Stuck in "processing" → Rendering or upload failed, check worker logs
- ❌ Status "failed" → Check `error` field in job document

### Step 8: Test Video Download

**What to test**: Can the user download the generated video?

**How to test**:
1. Get the `videoUrl` from completed job
2. Open URL in browser (should include SAS token)

**Expected**: Video plays in browser

**If it fails**:
- ❌ 403 Forbidden → SAS token expired or invalid
- ❌ 404 Not Found → File not uploaded or wrong URL
- ❌ CORS error → Enable CORS on Azure Storage

---

## 🛠️ Common Issues & Fixes

### Issue: "Jobs stuck in queued"

**Diagnosis**:
```bash
# Check if worker is running
sudo systemctl status video-worker

# Check worker logs
sudo journalctl -u video-worker -n 50
```

**Fix**:
1. Start worker: `sudo systemctl start video-worker`
2. Check worker.env has correct credentials
3. Verify worker can connect to Appwrite (Step 4)

---

### Issue: "Worker can't render video"

**Diagnosis**:
```bash
# Check Chromium installation
which chromium || which chromium-browser

# Test Remotion
cd /path/to/whop-app
npm run remotion:render
```

**Fix**:
```bash
# Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser

# Install dependencies
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2

# Update worker.env
REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

---

### Issue: "Video renders but doesn't upload"

**Diagnosis**:
```bash
# Test Azure connection
az storage container list --account-name italha0

# Check if container exists
az storage container show --name videos --account-name italha0
```

**Fix**:
```bash
# Create container
az storage container create --name videos --account-name italha0

# Verify connection string in worker.env
echo $AZURE_STORAGE_CONNECTION_STRING
```

---

### Issue: "Frontend can't fetch status"

**Diagnosis**:
- Open browser console
- Look for errors in Network tab
- Check GET request to `/api/generate-video?jobId=xxx`

**Fix**:
1. Verify jobId is correct
2. Check Appwrite permissions (read access for users)
3. Verify API route is working: `curl http://localhost:3000/api/generate-video?jobId=xxx`

---

## 📊 Health Check Script

Run this to check all components:

```bash
# Frontend
node test-appwrite-connection.js

# Worker (SSH to VM first)
sudo systemctl status video-worker
sudo journalctl -u video-worker -n 20

# Azure Storage
az storage container list --account-name italha0

# Appwrite
curl -X GET \
  "https://fra.cloud.appwrite.io/v1/databases/68d22ef500286098806d/collections/video_jobs/documents" \
  -H "X-Appwrite-Project: 68d22e96000d39d1874e" \
  -H "X-Appwrite-Key: YOUR_API_KEY"
```

---

## 🔄 Complete Test Flow

1. ✅ Test Appwrite connection
2. ✅ Create test job via API
3. ✅ Verify job appears in database
4. ✅ Check worker picks up job
5. ✅ Monitor worker renders video
6. ✅ Verify upload to Azure
7. ✅ Check job status updated
8. ✅ Test video URL works
9. ✅ Clean up test data

Run this script to automate: `npm run test:video-pipeline` (TODO: create this)
