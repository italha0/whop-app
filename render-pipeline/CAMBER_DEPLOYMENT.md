# Camber Cloud Deployment Guide

This guide covers deploying the CPU-optimized chat video renderer on **Camber Cloud** with Appwrite integration.

## Overview

- **Execution Environment**: Camber Cloud (Python 3.11+, ffmpeg included)
- **Rendering Engine**: MoviePy + ffmpeg (CPU-only, no browser)
- **Storage**: Appwrite Cloud Storage
- **Performance**: <2 minutes render time for 60s videos on 1 vCPU
- **Free Tier**: 200 CPU hours/month on Camber

---

## Prerequisites

1. **Camber Account**: Sign up at [camber.ai](https://camber.ai)
2. **Appwrite Project**: 
   - Go to [cloud.appwrite.io](https://cloud.appwrite.io)
   - Create a project and note your Project ID
3. **Appwrite Storage Bucket**: Create a bucket for video storage

---

## Step 1: Prepare Your Appwrite Environment

### Create Storage Bucket

```bash
# Using Appwrite CLI or Console UI
appwrite storage createBucket \
  --bucketId "chat-videos" \
  --name "Chat Videos" \
  --permissions "read(\"any\")" \
  --fileSecurity false \
  --maximumFileSize 104857600 \
  --allowedFileExtensions "mp4"
```

Or via Appwrite Console:
1. Go to Storage → Create Bucket
2. Name: "Chat Videos"
3. Bucket ID: `chat-videos`
4. Max file size: 100MB
5. Allowed extensions: `.mp4`
6. Permissions: Enable public read access

### Get API Credentials

1. Go to Appwrite Console → Settings → API Keys
2. Create a new API key with:
   - Scopes: `files.write`, `files.read`
3. Copy the API key (you'll need it for Camber)

---

## Step 2: Deploy to Camber

### Option A: Deploy via Camber CLI

1. **Install Camber CLI**:
```bash
pip install camber-cli
camber login
```

2. **Create `camber.yaml`** (see file in repository):
```yaml
name: chat-renderer
runtime: python3.11
memory: 2048  # 2GB RAM
timeout: 300  # 5 minutes max per job
env:
  - APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
  - APPWRITE_PROJECT_ID=YOUR_PROJECT_ID
  - APPWRITE_BUCKET_ID=chat-videos
secrets:
  - APPWRITE_API_KEY  # Add via Camber dashboard

build:
  - apt-get update && apt-get install -y ffmpeg fonts-dejavu-core
  - pip install -r requirements.txt

entrypoint: python camber_job.py
```

3. **Deploy**:
```bash
camber deploy --config camber.yaml
```

### Option B: Deploy via Camber Dashboard

1. **Login to Camber Dashboard**
2. **Create New Job**:
   - Name: `chat-renderer`
   - Runtime: Python 3.11
   - Memory: 2GB
   - Timeout: 300s

3. **Upload Files**:
   - `renderer.py`
   - `camber_job.py`
   - `requirements.txt`
   - `assets/` folder (optional for audio files)

4. **Set Environment Variables**:
   ```
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=<your-project-id>
   APPWRITE_BUCKET_ID=chat-videos
   ```

5. **Add Secret**:
   - Key: `APPWRITE_API_KEY`
   - Value: `<your-api-key>`

6. **Build Commands**:
   ```bash
   apt-get update && apt-get install -y ffmpeg fonts-dejavu-core
   pip install -r requirements.txt
   ```

7. **Entrypoint**: `python camber_job.py`

---

## Step 3: Test Your Deployment

### Via Camber API

```python
import requests

# Get your Camber job URL from the dashboard
camber_url = "https://api.camber.ai/v1/jobs/YOUR_JOB_ID/run"
camber_api_key = "YOUR_CAMBER_API_KEY"

conversation_data = {
    "messages": [
        {"sender": "them", "text": "Hey! How are you?"},
        {"sender": "you", "text": "I'm great! Thanks for asking 😊"},
        {"sender": "them", "text": "That's awesome!"}
    ]
}

response = requests.post(
    camber_url,
    headers={
        "Authorization": f"Bearer {camber_api_key}",
        "Content-Type": "application/json"
    },
    json={"conversation": conversation_data}
)

result = response.json()
print(f"Job ID: {result['job_id']}")
print(f"Video URL: {result['video_url']}")
```

### Via Camber CLI

```bash
# Run a test job
camber run chat-renderer --input examples/conversation.json

# Check job status
camber jobs list

# Get job logs
camber logs <job-id>
```

---

## Step 4: Integrate with Next.js Frontend

Update your Next.js API route to trigger Camber jobs:

```typescript
// app/api/render/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { conversation } = await request.json();

  // Trigger Camber job
  const camberResponse = await fetch(
    process.env.CAMBER_JOB_URL!,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CAMBER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    }
  );

  const result = await camberResponse.json();

  return NextResponse.json({
    success: true,
    jobId: result.job_id,
    status: 'processing',
  });
}
```

Poll for job completion:

```typescript
// app/api/render/status/route.ts
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

  const response = await fetch(
    `${process.env.CAMBER_JOB_URL}/status/${jobId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CAMBER_API_KEY}`,
      },
    }
  );

  const result = await response.json();

  return NextResponse.json({
    status: result.status, // 'pending' | 'processing' | 'completed' | 'failed'
    videoUrl: result.video_url, // Available when status === 'completed'
    error: result.error,
  });
}
```

---

## Performance Optimization Tips

### 1. **Reduce Resolution for Faster Renders**
For draft previews, use lower resolution:
```python
render_chat_video(conversation, output, width=540, height=960)  # Half resolution
```

### 2. **Batch Multiple Jobs**
Process multiple videos in one Camber job to reduce overhead:
```python
for conversation in batch:
    render_chat_video(conversation, f"/tmp/video_{i}.mp4")
    upload_to_appwrite(f"/tmp/video_{i}.mp4", ...)
```

### 3. **Pre-warm Fonts**
The renderer automatically caches fonts on first use. For repeated jobs in the same container, fonts stay cached.

### 4. **Monitor CPU Usage**
Camber dashboard shows CPU usage. Typical 60s video:
- Render time: 90-120s on 1 vCPU
- CPU usage: ~1.5-2 CPU-minutes
- Monthly capacity: ~6,600 videos on free tier

---

## Troubleshooting

### Issue: "FFmpeg not found"

**Solution**: Ensure build commands install ffmpeg:
```bash
apt-get update && apt-get install -y ffmpeg
```

### Issue: "Font not found"

**Solution**: Install DejaVu fonts:
```bash
apt-get install -y fonts-dejavu-core
```

Or set custom font path:
```bash
export CHAT_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
```

### Issue: "Appwrite upload failed"

**Solution**: Check API key permissions and bucket settings:
1. Ensure API key has `files.write` scope
2. Verify bucket ID matches
3. Check bucket file size limit (increase to 100MB+)

### Issue: "Out of memory"

**Solution**: Increase Camber job memory:
- Edit `camber.yaml`: `memory: 4096` (4GB)
- Or adjust in dashboard settings

### Issue: "Timeout during render"

**Solution**: 
1. Increase timeout: `timeout: 600` (10 minutes)
2. Reduce video complexity (fewer messages)
3. Use lower resolution

---

## Cost Estimation

### Camber Free Tier (200 CPU hours/month)
- 60s video @ 2min render = 0.033 CPU hours
- **Monthly capacity**: ~6,000 videos

### Camber Paid Tier ($0.10/CPU hour)
- 60s video = $0.0033 per video
- 1,000 videos = $3.30

### Appwrite Free Tier
- Storage: 2GB free
- Bandwidth: 10GB/month free
- 100MB video = 20 videos stored, 100 downloads/month

---

## Security Best Practices

1. **Never commit API keys** to Git
2. **Use Camber secrets** for sensitive values
3. **Validate input JSON** before rendering
4. **Set Appwrite bucket permissions** appropriately
5. **Rate limit** frontend API calls

---

## Next Steps

1. ✅ Deploy renderer to Camber
2. 🔄 Set up Appwrite storage
3. 🔄 Integrate with Next.js frontend
4. 🔄 Add webhook for job completion notifications
5. 🔄 Implement video preview thumbnails

---

## Support

- **Camber Docs**: [docs.camber.ai](https://docs.camber.ai)
- **Appwrite Docs**: [appwrite.io/docs](https://appwrite.io/docs)
- **Issue Tracker**: GitHub Issues

---

## Example: Complete Flow

```
User submits chat → Next.js API → Camber job triggered → 
renderer.py executes → Video rendered → Upload to Appwrite → 
Return URL → Frontend displays video
```

**Total time**: 2-3 minutes end-to-end for 60s video
