# 🚀 Quick Start Guide (Without Camber)

## TL;DR - Sync Mode Setup

You **don't need Camber** to get started! Use **sync mode** which runs the renderer directly.

---

## 📋 Checklist

### 1. Environment Variables

Add to `.env.local`:

```bash
# Required
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=videos_db_id
APPWRITE_API_KEY=your_api_key
APPWRITE_VIDEO_BUCKET_ID=videos_bucket_id
APPWRITE_VIDEO_JOBS_COLLECTION_ID=video_jobs_collection_id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
RENDER_MODE=sync  # ← Important! Use sync mode

# Skip these for sync mode:
# CAMBER_RENDER_ENDPOINT=...
# CAMBER_API_KEY=...
# CAMBER_WEBHOOK_SECRET=...
```

### 2. Install Dependencies

```bash
# In Next.js project root
npm install lucide-react

# In render-pipeline directory
cd render-pipeline
pip install playwright appwrite
playwright install chromium
```

### 3. Setup Appwrite

#### Create Storage Bucket
1. Go to Appwrite Console → Storage
2. Create bucket: `videos`
3. Settings:
   - Max file size: 100MB
   - Allowed extensions: `mp4`
   - Permissions: Users can Create/Read
4. Copy the **Bucket ID** → Add to `.env.local` as `APPWRITE_VIDEO_BUCKET_ID`

#### Create Database Collection
1. Go to Databases → Create database: `videos_db`
2. Create collection: `video_jobs`
3. Add attributes:
   - `userId` (string, required)
   - `status` (string, required)
   - `conversation` (string, required)
   - `videoUrl` (string)
   - `fileId` (string)
   - `createdAt` (datetime, required)
   - `completedAt` (datetime)
4. Permissions:
   - Create: Users
   - Read: Users (creator only)
   - Update: API key (server-side only)
5. Copy **Collection ID** → Add to `.env.local` as `APPWRITE_VIDEO_JOBS_COLLECTION_ID`

### 4. Test the Renderer

```bash
cd render-pipeline

# Test render locally (make sure Chromium is installed)
python browser_renderer.py \
  --input examples/test_simple.json \
  --output /tmp/test.mp4

# Should complete in ~10 seconds
# Check: ls -lh /tmp/test.mp4
```

### 5. Test the API

```bash
# Start Next.js dev server
npm run dev

# In another terminal, test the API
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

**Expected response:**
```json
{
  "status": "completed",
  "videoUrl": "https://cloud.appwrite.io/v1/storage/buckets/.../view",
  "fileId": "abc123"
}
```

### 6. Use in Your App

```tsx
import { VideoGenerator } from '@/components/VideoGenerator';

function MyPage() {
  const conversation = {
    contactName: "Test",
    messages: [
      { text: "Hello!", sent: false },
      { text: "Hi!", sent: true }
    ]
  };

  return (
    <VideoGenerator
      conversation={conversation}
      onComplete={(url) => console.log('Video:', url)}
    />
  );
}
```

---

## ⚙️ How Sync Mode Works

```
1. User clicks "Generate Video"
   ↓
2. POST /api/generate-video
   ↓
3. Runs browser_renderer.py directly
   (blocks for 20-30 seconds)
   ↓
4. Uploads to Appwrite Storage
   ↓
5. Returns video URL immediately
```

**Pros:**
- ✅ Simple setup (no Camber needed)
- ✅ Works locally
- ✅ Immediate results
- ✅ Good for testing

**Cons:**
- ⚠️ Blocks API request (30s)
- ⚠️ May timeout on Vercel free tier
- ⚠️ Not scalable for high traffic

---

## 🎯 When to Upgrade to Async Mode

Consider async mode (with Camber) when:
- Videos take > 30 seconds
- You have > 100 videos/day
- You need concurrent processing
- You're hitting Vercel timeouts

Until then, **sync mode is perfect!**

---

## 🐛 Troubleshooting

### "Playwright not installed"
```bash
cd render-pipeline
pip install playwright
playwright install chromium
```

### "Module not found: @/components/ui/button"
Install shadcn components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add progress
```

### "Appwrite upload failed"
- Check API key permissions (needs Storage write)
- Verify bucket ID is correct
- Ensure `.mp4` is allowed in bucket settings

### "Video generation timeout"
Increase timeout in `next.config.ts`:
```js
export default {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
}
```

Or upgrade to Vercel Pro for longer timeouts.

---

## 📊 Expected Performance (Sync Mode)

- 2 messages: ~8 seconds
- 5 messages: ~18 seconds
- 8 messages: ~28 seconds
- 10 messages: ~38 seconds

**Render happens synchronously** - user waits while video generates.

---

## 🚀 Next Steps

1. ✅ Set up Appwrite (buckets + database)
2. ✅ Install dependencies
3. ✅ Test renderer locally
4. ✅ Test API endpoint
5. ✅ Integrate into your app
6. 🎉 Generate videos!

**No Camber needed!** Just set `RENDER_MODE=sync` and you're ready to go! 🎬
