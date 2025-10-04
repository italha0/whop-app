# 🚀 Production Deployment Guide

## Complete Architecture

```
User clicks "Generate Video"
    ↓
Next.js API (/api/generate-video)
    ↓
Camber Cloud (browser_renderer.py)
    ↓
Appwrite Storage (video upload)
    ↓
Webhook (/api/camber-webhook)
    ↓
Database updated → User gets download link
```

---

## 📦 Components Built

### 1. Backend
- ✅ `browser_renderer.py` - Playwright-based renderer with Appwrite upload
- ✅ `/api/generate-video` - Next.js API route (sync or async mode)
- ✅ `/api/camber-webhook` - Webhook handler for async job completion

### 2. Frontend
- ✅ `VideoGenerator.tsx` - React component with:
  - Generate button
  - Progress bar
  - Download button
  - Error handling

### 3. Infrastructure
- ✅ Appwrite Storage integration
- ✅ Appwrite Database (job tracking)
- ✅ Camber Cloud deployment ready

---

## 🛠️ Setup Steps

### Step 1: Appwrite Configuration

#### A. Create Storage Bucket
```bash
# In Appwrite Console:
1. Go to Storage
2. Create bucket: "videos"
3. Set permissions: 
   - Create: Users
   - Read: Any
   - Update: Users
   - Delete: Users
4. Set max file size: 100MB
5. Allowed extensions: mp4
6. Copy BUCKET_ID
```

#### B. Create Database Collection
```bash
# In Appwrite Console:
1. Go to Databases
2. Create database: "videos_db"
3. Create collection: "video_jobs"
4. Add attributes:
   - userId (string, required)
   - status (string, required) [queued, processing, completed, failed]
   - conversation (string, required)
   - estimatedDuration (integer)
   - videoUrl (string)
   - fileId (string)
   - error (string)
   - createdAt (datetime, required)
   - completedAt (datetime)
5. Set permissions:
   - Create: Users
   - Read: Users (creator only)
   - Update: API (server-side)
6. Copy COLLECTION_ID
```

### Step 2: Environment Variables

Add to `.env.local`:
```bash
# Appwrite

APPWRITE_VIDEO_BUCKET_ID=68dfce93000a8465185c
APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs

# Camber (OPTIONAL - only for async mode in production)
# For local/sync mode, you can skip these!
CAMBER_RENDER_ENDPOINT=https://your-camber-endpoint.com/render  # Get from Camber dashboard after deploying camber_function.py
CAMBER_API_KEY=your_camber_api_key  # Generate in Camber settings
CAMBER_WEBHOOK_SECRET=your_webhook_secret  # Generate your own: openssl rand -hex 32

# App
NEXT_PUBLIC_APP_URL=https://yourapp.com
RENDER_MODE=sync  # or 'async' for production
```

### Step 3: Choose Your Mode

#### 🚀 **Sync Mode (Recommended for Start)**

Perfect for:
- Local development
- Testing
- Low-moderate traffic
- Videos < 10 messages

**No Camber setup needed!** Just set `RENDER_MODE=sync` and you're done.

#### ⚡ **Async Mode (Production Scale)**

Use when you need:
- Scalability (100+ concurrent videos)
- Long videos (>10 messages)
- Serverless execution

**Requires Camber setup** (see Step 3b below)

---

### Step 3a: Install Dependencies

```bash
# In your Next.js project
npm install lucide-react

# In render-pipeline directory (for sync mode)
pip install playwright appwrite
playwright install chromium
```

### Step 3b: Camber Setup (OPTIONAL - Only for Async Mode)

If you want async mode, follow these steps:

1. **Generate Webhook Secret**
```bash
# Run this to generate a secure secret
openssl rand -hex 32
# Copy the output and save as CAMBER_WEBHOOK_SECRET
```

2. **Deploy to Camber** (in JupyterLab)
```bash
cd ~/whop-app/render-pipeline

# Camber will create an HTTP endpoint from camber_function.py
# Follow Camber's deployment docs to get your endpoint URL
# Save the URL as CAMBER_RENDER_ENDPOINT
```

3. **Get API Key**
- Go to Camber dashboard → Settings → API Keys
- Create new key with "Execute Functions" permission
- Save as CAMBER_API_KEY

**For most users, skip this and use sync mode!**

---

### Step 4: Test Locally (Sync Mode)

```bash
# Set sync mode
export RENDER_MODE=sync

# Start Next.js dev server
npm run dev

# Test the API
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "contactName": "Alex",
      "messages": [
        {"text": "Hey!", "sent": false},
        {"text": "Hi there!", "sent": true}
      ]
    }
  }'
```

### Step 5: Deploy to Vercel/Production

```bash
# Push to GitHub
git add .
git commit -m "Add video generation feature"
git push

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

---

## 🎯 Usage in Your App

### Basic Usage
```tsx
import { VideoGenerator } from '@/components/VideoGenerator';

export default function ConversationPage() {
  const conversation = {
    contactName: "Alex",
    messages: [
      { text: "Hey!", sent: false },
      { text: "Hi there!", sent: true },
      { text: "How are you?", sent: false },
      { text: "I'm good, thanks!", sent: true }
    ]
  };

  return (
    <div>
      <h1>Generate Video</h1>
      <VideoGenerator 
        conversation={conversation}
        onComplete={(videoUrl) => {
          console.log('Video ready:', videoUrl);
        }}
      />
    </div>
  );
}
```

### With Custom Conversation Builder
```tsx
'use client';

import { useState } from 'react';
import { VideoGenerator } from '@/components/VideoGenerator';

export default function ConversationBuilder() {
  const [messages, setMessages] = useState([]);
  const [contactName, setContactName] = useState('');

  const addMessage = (text: string, sent: boolean) => {
    setMessages([...messages, { text, sent }]);
  };

  return (
    <div>
      <input
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Contact name..."
      />

      {/* Message builder UI */}
      <button onClick={() => addMessage('New message', false)}>
        Add Incoming
      </button>
      <button onClick={() => addMessage('New message', true)}>
        Add Outgoing
      </button>

      {/* Generate video */}
      {messages.length > 0 && (
        <VideoGenerator
          conversation={{ contactName, messages }}
        />
      )}
    </div>
  );
}
```

---

## 🔧 Sync vs Async Mode

### Sync Mode (Development / Small Videos)
- ✅ Simple setup
- ✅ Immediate results
- ❌ Blocks API request (30s timeout risk)
- ❌ Not scalable

**Use when:**
- Testing locally
- Videos < 5 messages
- Low traffic

### Async Mode (Production)
- ✅ Non-blocking (returns immediately)
- ✅ Handles long renders (60s+)
- ✅ Scalable to 100s of concurrent jobs
- ❌ More complex setup (needs webhook)

**Use when:**
- Production deployment
- Videos > 5 messages
- High traffic expected

---

## 📊 Performance

### Render Times (XSMALL GPU)
- 2 messages: ~5 seconds
- 5 messages: ~15 seconds
- 8 messages: ~25 seconds
- 10 messages: ~35 seconds

### Cost Estimates (Camber)
- XSMALL GPU: ~$0.10/hour
- Average video (8 messages, 25s): ~$0.0007
- 1000 videos/month: ~$0.70

---

## 🐛 Troubleshooting

### "Playwright not found"
```bash
cd render-pipeline
pip install playwright
playwright install chromium
```

### "Appwrite upload failed"
- Check API key has Storage permissions
- Verify bucket ID is correct
- Ensure bucket allows .mp4 files

### "Video generation timeout"
- Switch to async mode
- Increase Vercel function timeout (Pro plan)
- Use Camber for long-running jobs

### "Webhook not receiving"
- Verify webhook URL is publicly accessible
- Check CAMBER_WEBHOOK_SECRET matches
- Test with ngrok for local development

---

## 🚀 Next Steps

1. **Test end-to-end**: Generate a video from your UI
2. **Monitor performance**: Check Appwrite usage dashboard
3. **Add analytics**: Track video generation metrics
4. **Optimize**: Cache common conversations, pre-render templates
5. **Scale**: Move to async mode when traffic increases

---

## 📚 API Reference

### POST /api/generate-video

**Request:**
```json
{
  "conversation": {
    "contactName": "Alex",
    "messages": [
      { "text": "Hey!", "sent": false }
    ]
  },
  "userId": "user_123",
  "uploadToAppwrite": true
}
```

**Response (Sync):**
```json
{
  "status": "completed",
  "videoUrl": "https://cloud.appwrite.io/...",
  "fileId": "abc123"
}
```

**Response (Async):**
```json
{
  "jobId": "job_xyz",
  "status": "queued",
  "estimatedDuration": 25
}
```

### GET /api/generate-video?jobId=xxx

**Response:**
```json
{
  "jobId": "job_xyz",
  "status": "completed",
  "videoUrl": "https://...",
  "createdAt": "2025-10-03T12:00:00Z",
  "completedAt": "2025-10-03T12:00:25Z"
}
```

---

**Questions? Check the GitHub issues or contact support!** 🎉
