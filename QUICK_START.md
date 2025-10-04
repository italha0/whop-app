# 🚀 Quick Start Guide: Video Generation Setup

## TL;DR - What's Wrong?

Your video generation system has **4 components** that need to work together:
1. **Frontend** (Next.js) - Creates jobs
2. **Appwrite** (Database) - Stores job queue
3. **Azure VM Worker** - Renders videos
4. **Azure Storage** - Hosts video files

If videos aren't generating, one of these is misconfigured.

---

## ✅ Quick Fix Checklist (Do This First!)

### 1. Test Appwrite Connection (2 minutes)

```bash
npm run test:appwrite
```

**Expected**: All checks pass ✅

**If it fails**: Your Appwrite is not configured. See `SETUP_VIDEO_GENERATION.md` Step 1.

### 2. Check Worker Environment (1 minute)

Your `worker/worker.env` was **missing critical variables**. I've fixed:
- ✅ Added `APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs`
- ✅ Added `AZURE_BLOB_CONTAINER=videos`

**You need to**:
1. Copy the updated `worker/worker.env` to your Azure VM
2. Restart the worker service

### 3. Verify Azure VM Worker is Running

SSH to your Azure VM (`74.225.128.201`) and run:

```bash
# Check if worker is running
sudo systemctl status video-worker

# If not running, start it
sudo systemctl start video-worker

# Watch logs
sudo journalctl -u video-worker -f
```

**Expected**: You see `"🛠️  Appwrite worker started. Polling for jobs..."`

**If it fails**: Worker service doesn't exist. See `SETUP_VIDEO_GENERATION.md` Step 3.

### 4. Test Complete Pipeline (3 minutes)

Start your Next.js dev server:
```bash
npm run dev
```

In another terminal, run:
```bash
npm run test:pipeline
```

This will:
- Create a test job
- Monitor its progress
- Verify the video URL

**Expected**: Job goes `queued` → `processing` → `completed`

---

## 🔥 Most Common Issues

### Issue 1: "Nothing happens when I click Generate Video"

**Quick Fix**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click Generate Video again
4. Look for errors

**Common causes**:
- ❌ Missing Appwrite credentials → Run `npm run test:appwrite`
- ❌ Invalid conversation data → Check your input format

### Issue 2: "Job stuck in 'queued' forever"

**Quick Fix**:
```bash
# SSH to Azure VM
ssh user@74.225.128.201

# Check worker
sudo systemctl status video-worker

# If not running
sudo systemctl start video-worker
```

**Common causes**:
- ❌ Worker not running → Start it
- ❌ Worker can't connect to Appwrite → Check `worker.env` credentials
- ❌ Missing `APPWRITE_VIDEO_JOBS_COLLECTION_ID` → I fixed this, update your VM

### Issue 3: "Job fails with 'Upload failed'"

**Quick Fix**:
```bash
# Verify Azure container exists
az storage container show --name videos --account-name italha0

# If not found, create it
az storage container create --name videos --account-name italha0
```

**Common causes**:
- ❌ Container `videos` doesn't exist → Create it
- ❌ Wrong connection string → Check `worker.env`
- ❌ Missing `AZURE_BLOB_CONTAINER` → I fixed this, update your VM

---

## 📝 Step-by-Step First-Time Setup

### Step 1: Configure Appwrite (10 minutes)

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Navigate to your project `68d22e96000d39d1874e`
3. Go to **Databases** → `68d22ef500286098806d`
4. Create collection `video_jobs`:
   - Click **+ Create Collection**
   - ID: `video_jobs`
   - Add attributes (see `SETUP_VIDEO_GENERATION.md` for schema)
5. Create collection `video_renders` (same process)

**Verify**: Run `npm run test:appwrite`

### Step 2: Set Up Azure Storage (5 minutes)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Storage Account `italha0`
3. Go to **Containers**
4. Click **+ Container**
5. Name: `videos`
6. Access level: `Private`

**Verify**: 
```bash
az storage container show --name videos --account-name italha0
```

### Step 3: Configure Worker on Azure VM (15 minutes)

1. **SSH to VM**:
   ```bash
   ssh user@74.225.128.201
   ```

2. **Navigate to project**:
   ```bash
   cd /path/to/whop-app/worker
   ```

3. **Install dependencies** (if not done):
   ```bash
   npm install
   ```

4. **Update worker.env**:
   - Copy the updated `worker/worker.env` from your local machine
   - Or manually add:
     ```bash
     APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs
     AZURE_BLOB_CONTAINER=videos
     ```

5. **Create systemd service**:
   ```bash
   sudo nano /etc/systemd/system/video-worker.service
   ```
   
   Paste (adjust paths):
   ```ini
   [Unit]
   Description=Video Generation Worker
   After=network.target

   [Service]
   Type=simple
   User=youruser
   WorkingDirectory=/path/to/whop-app/worker
   ExecStart=/usr/bin/node /path/to/whop-app/worker/worker.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

6. **Enable and start**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable video-worker
   sudo systemctl start video-worker
   sudo systemctl status video-worker
   ```

**Verify**: You should see active (running) status

### Step 4: Test End-to-End (5 minutes)

1. Start Next.js locally:
   ```bash
   npm run dev
   ```

2. Run pipeline test:
   ```bash
   npm run test:pipeline
   ```

3. Wait for completion (30-60 seconds)

**Expected**: 
```
✅ Job created
⏳ Monitoring... completed!
✅ Video URL accessible
🎉 Test completed successfully!
```

---

## 🎯 What Each File Does

| File | Purpose | When to Edit |
|------|---------|--------------|
| `.env.local` | Frontend config | Changing Appwrite/Azure settings |
| `worker/worker.env` | VM worker config | Same as above, for worker |
| `test-appwrite-connection.js` | Tests Appwrite | Debugging connection issues |
| `test-video-pipeline.js` | Full pipeline test | Verifying end-to-end flow |
| `SETUP_VIDEO_GENERATION.md` | Detailed setup guide | First-time setup or reference |
| `DEBUG_CHECKLIST.md` | Debugging guide | When things go wrong |

---

## 🆘 Still Not Working?

### Run Diagnostics

```bash
# Test 1: Appwrite
npm run test:appwrite

# Test 2: Pipeline (requires dev server running)
npm run test:pipeline

# Test 3: Check worker (on Azure VM)
ssh user@74.225.128.201
sudo journalctl -u video-worker -f
```

### Get Detailed Status

1. Open Appwrite Console
2. Go to Databases → video_jobs
3. Find your job by timestamp
4. Check `status` and `error` fields

### Check Worker Logs

```bash
# On Azure VM
sudo journalctl -u video-worker -n 100 --no-pager

# Follow live
sudo journalctl -u video-worker -f
```

### Manual Test

Create a test job manually:

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "contactName": "Test",
      "messages": [
        {"text": "Hello", "sent": false},
        {"text": "Hi!", "sent": true}
      ]
    },
    "userId": "test_user"
  }'
```

Then check Appwrite Console for the job.

---

## 📚 Full Documentation

- **Complete Setup**: `SETUP_VIDEO_GENERATION.md`
- **Debugging Guide**: `DEBUG_CHECKLIST.md`
- **Architecture**: See overview diagram in `SETUP_VIDEO_GENERATION.md`

---

## ✨ Next Steps After Setup

1. Test with various conversation lengths
2. Monitor worker performance
3. Set up monitoring/alerts
4. Configure auto-scaling (optional)
5. Add video preview before generation
6. Implement download progress indicator

---

## 🎬 Video Generation Flow Reminder

```
User clicks button
    ↓
/api/generate-video creates job in Appwrite (status: queued)
    ↓
Worker polls Appwrite every 3 seconds
    ↓
Worker finds job, updates to (status: processing)
    ↓
Worker renders video with Remotion (~30-60 sec)
    ↓
Worker uploads to Azure Blob Storage
    ↓
Worker updates job (status: completed, videoUrl: "...")
    ↓
Frontend polls and detects completion
    ↓
Video download starts automatically
```

**Each step must work** for videos to generate successfully!
