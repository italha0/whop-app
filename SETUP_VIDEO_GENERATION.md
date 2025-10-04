# Video Generation System Setup Guide

## 🎯 Overview

Your video generation system works as follows:

```
User clicks "Generate Video" 
    ↓
VideoGenerator.tsx → /api/generate-video (POST)
    ↓
Creates job in Appwrite (status: "queued")
    ↓
Azure VM Worker polls Appwrite for jobs (worker.js)
    ↓
Worker renders video with Remotion
    ↓
Worker uploads to Azure Blob Storage
    ↓
Worker updates Appwrite job (status: "completed", videoUrl)
    ↓
Frontend polls /api/generate-video (GET) for status
    ↓
Downloads video to user's device
```

---

## 📋 Prerequisites

### 1. **Appwrite Setup**
- Project ID: `68d22e96000d39d1874e`
- Database ID: `68d22ef500286098806d`
- Collections:
  - `video_jobs` - Stores job queue
  - `video_renders` - Stores completed renders
- Bucket: `68dfce93000a8465185c` - For video storage (optional)

### 2. **Azure Storage Setup**
- Storage Account: `italha0`
- Container: `videos` (must be created)
- Connection string configured

### 3. **Azure VM Setup**
- VM IP/Endpoint: `http://74.225.128.201:3002`
- Worker script running: `worker/worker.js`
- Node.js installed with dependencies

---

## ⚙️ Step-by-Step Setup

### Step 1: Configure Appwrite Collections

#### A. Create `video_jobs` Collection

1. Go to Appwrite Console → Database → Create Collection
2. Collection ID: `video_jobs`
3. Add these attributes:

```json
{
  "userId": { "type": "string", "required": true, "size": 255 },
  "status": { "type": "string", "required": true, "size": 50, "default": "queued" },
  "conversation": { "type": "string", "required": true, "size": 10000 },
  "estimatedDuration": { "type": "integer", "required": false },
  "uploadToAppwrite": { "type": "boolean", "required": false, "default": true },
  "videoUrl": { "type": "string", "required": false, "size": 1000 },
  "fileId": { "type": "string", "required": false, "size": 255 },
  "fileSize": { "type": "integer", "required": false },
  "error": { "type": "string", "required": false, "size": 1000 },
  "createdAt": { "type": "datetime", "required": true },
  "completedAt": { "type": "datetime", "required": false }
}
```

4. Set Permissions:
   - **Create**: Users
   - **Read**: Users (own documents)
   - **Update**: API Key (for worker updates)

#### B. Create `video_renders` Collection

1. Collection ID: `video_renders`
2. Add these attributes:

```json
{
  "status": { "type": "string", "required": true, "size": 50 },
  "composition": { "type": "string", "required": true, "size": 255 },
  "user_id": { "type": "string", "required": true, "size": 255 },
  "input_json": { "type": "string", "required": true, "size": 10000 },
  "file_id": { "type": "string", "required": false, "size": 255 },
  "video_url": { "type": "string", "required": false, "size": 1000 },
  "duration_sec": { "type": "integer", "required": false },
  "file_size_bytes": { "type": "integer", "required": false }
}
```

### Step 2: Configure Azure Storage

1. **Create Container** (if not exists):
   ```bash
   az storage container create --name videos --account-name italha0
   ```
   Or use Azure Portal: Storage Account → Containers → + Container → Name: `videos`, Access level: `Private`

2. **Verify Connection String** in `.env.local`:
   ```bash
   AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=italha0;AccountKey=...
   ```

### Step 3: Set Up Azure VM Worker

#### A. Install Dependencies on VM

SSH into your Azure VM:
```bash
ssh user@74.225.128.201
```

Navigate to worker directory:
```bash
cd /path/to/whop-app/worker
```

Install dependencies:
```bash
npm install
# or
pnpm install
```

Install Chromium (required for Remotion):
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser

# Or use the bundled version
sudo apt-get install -y chromium
```

#### B. Configure worker.env

Ensure `worker/worker.env` has all required variables:

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=68d22e96000d39d1874e
APPWRITE_API_KEY=standard_142047ba905e3c5c3c44cbd505859907922b108892548498e89e66afa30a3418fece9807f931e5c652407e97204a2b6b8dba98335556930544ae36fbf95c9e04ff4278f9d109624e2f58a8e1a696660acb9f81ba2235d3adbfef5a3f3de3f78f312a56229aadfc64d762e22d8f74a39e51ecbd3f1a5a4487f23c274104decf14
APPWRITE_DATABASE_ID=68d22ef500286098806d
APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs
APPWRITE_VIDEO_RENDERS_COLLECTION_ID=video_renders

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=italha0;AccountKey=1J1A0Lf/N2QwT1BmLkVBPqySq13LGkcz/wmirCcYw93xX2Gy8TXICeVUSEf5koGyTBJwXiecIENq+AStZD5/9A==;EndpointSuffix=core.windows.net
AZURE_BLOB_CONTAINER=videos

# Worker Configuration
WORKER_POLL_MS=3000
WORK_DIR=/tmp
NODE_ENV=production

# Remotion Configuration
REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

#### C. Start Worker as a Service

Create systemd service file:
```bash
sudo nano /etc/systemd/system/video-worker.service
```

Add content:
```ini
[Unit]
Description=Video Generation Worker
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/whop-app/worker
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /path/to/whop-app/worker/worker.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable video-worker
sudo systemctl start video-worker
sudo systemctl status video-worker
```

Check logs:
```bash
sudo journalctl -u video-worker -f
```

### Step 4: Configure Frontend

Ensure `.env.local` has:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68d22e96000d39d1874e
NEXT_PUBLIC_APPWRITE_DATABASE_ID=68d22ef500286098806d
APPWRITE_API_KEY=standard_142047ba905e3c5c3c44cbd505859907922b108892548498e89e66afa30a3418fece9807f931e5c652407e97204a2b6b8dba98335556930544ae36fbf95c9e04ff4278f9d109624e2f58a8e1a696660acb9f81ba2235d3adbfef5a3f3de3f78f312a56229aadfc64d762e22d8f74a39e51ecbd3f1a5a4487f23c274104decf14
APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs
APPWRITE_VIDEO_RENDERS_COLLECTION_ID=video_renders
RENDER_MODE=worker
```

---

## 🧪 Testing

### Test 1: Verify Appwrite Connection

```bash
node test-appwrite-connection.js
```

### Test 2: Test Video Generation Locally

```bash
npm run remotion:render
```

### Test 3: Test Full Pipeline

1. Start Next.js dev server:
   ```bash
   npm run dev
   ```

2. Go to video generator page

3. Fill in conversation and click "Generate Video"

4. Monitor:
   - Browser console for API calls
   - Appwrite Console → Database → video_jobs
   - Azure VM logs: `sudo journalctl -u video-worker -f`

---

## 🐛 Troubleshooting

### Issue 1: Job stuck in "queued" status

**Cause**: Worker is not running or can't connect to Appwrite

**Fix**:
1. Check worker status: `sudo systemctl status video-worker`
2. Check worker logs: `sudo journalctl -u video-worker -f`
3. Verify Appwrite credentials in worker.env
4. Test Appwrite connection from VM

### Issue 2: Worker can't render video

**Cause**: Missing Chromium or dependencies

**Fix**:
```bash
# Install Chromium
sudo apt-get install -y chromium-browser

# Install additional dependencies
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2
```

### Issue 3: Video renders but doesn't upload

**Cause**: Azure Storage credentials incorrect or container doesn't exist

**Fix**:
1. Verify connection string
2. Create container:
   ```bash
   az storage container create --name videos --account-name italha0 --connection-string "YOUR_CONNECTION_STRING"
   ```
3. Check permissions

### Issue 4: Frontend can't fetch video URL

**Cause**: SAS token expired or CORS issue

**Fix**:
1. Check SAS TTL: `AZURE_BLOB_SAS_TTL_MIN=1440` (24 hours)
2. Enable CORS on Azure Storage:
   - Portal → Storage Account → CORS
   - Add: Allowed origins: `*`, Methods: `GET`, Headers: `*`

### Issue 5: Job status not updating in frontend

**Cause**: Polling not working or API route error

**Fix**:
1. Check browser console for API errors
2. Verify `/api/generate-video?jobId=xxx` returns correct status
3. Check Appwrite permissions (worker needs update permission)

---

## 📊 Monitoring

### Check Job Status

```javascript
// In browser console
fetch('/api/generate-video?jobId=YOUR_JOB_ID')
  .then(r => r.json())
  .then(console.log)
```

### Check Appwrite Database

1. Go to Appwrite Console
2. Database → video_jobs
3. Look for your job by jobId
4. Check status, videoUrl, error fields

### Check Azure Storage

```bash
az storage blob list --container-name videos --account-name italha0
```

---

## 🚀 Production Deployment

### 1. Update Frontend ENV
Add to Vercel/deployment platform:
```
RENDER_MODE=worker
APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs
```

### 2. Secure Worker
- Use firewall to restrict access
- Rotate API keys regularly
- Use webhook signatures

### 3. Scale Worker
- Add multiple VM workers
- Use load balancer
- Monitor queue depth

---

## 📞 Support

If issues persist:
1. Check all environment variables
2. Review logs (worker, Next.js, Appwrite)
3. Test each component individually
4. Verify network connectivity between services
