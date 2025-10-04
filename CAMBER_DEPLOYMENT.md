# Camber Deployment Guide

This guide explains how to deploy the Remotion-based video renderer to Camber Cloud for automatic job processing.

## Prerequisites

1. **Camber Cloud Account**: Sign up at [camber.cloud](https://camber.cloud)
2. **Camber CLI**: Install the Camber CLI
3. **Appwrite Setup**: Your Appwrite project should be configured with the `video_jobs` table

## Step 1: Install Camber CLI

```bash
# Install Camber CLI
npm install -g @camber/cli

# Login to Camber
camber login
```

## Step 2: Configure Environment Variables

Set up the following secrets in Camber:

```bash
# Appwrite Configuration
camber secret set APPWRITE_ENDPOINT "https://cloud.appwrite.io/v1"
camber secret set APPWRITE_PROJECT_ID "your-project-id"
camber secret set APPWRITE_API_KEY "your-api-key"
camber secret set APPWRITE_VIDEO_BUCKET_ID "your-bucket-id"

# Webhook Security
camber secret set CAMBER_WEBHOOK_SECRET "your-webhook-secret"
```

## Step 3: Deploy the Function

```bash
# Navigate to the camber-remotion directory
cd camber-remotion

# Deploy the function
camber deploy

# Note the function URL (you'll need this for your app)
```

## Step 4: Update Your App Configuration

Add these environment variables to your `.env.local`:

```env
# Camber Configuration
CAMBER_RENDER_ENDPOINT=https://your-function-url.camber.cloud
CAMBER_API_KEY=your-camber-api-key
CAMBER_WEBHOOK_SECRET=your-webhook-secret

# Appwrite Configuration (if not already set)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_VIDEO_BUCKET_ID=your-bucket-id
APPWRITE_VIDEO_JOBS_COLLECTION_ID=your-collection-id
```

## Step 5: Test the Integration

1. **Test the API**:
   ```bash
   curl -X POST http://localhost:3000/api/generate-video \
     -H "Content-Type: application/json" \
     -d '{
       "conversation": {
         "contactName": "Test Contact",
         "messages": [
           {"text": "Hello!", "sent": false},
           {"text": "Hi there!", "sent": true}
         ]
       },
       "userId": "test_user",
       "uploadToAppwrite": true
     }'
   ```

2. **Check Job Status**:
   ```bash
   curl "http://localhost:3000/api/generate-video?jobId=your-job-id"
   ```

## How It Works

1. **User clicks "Generate Video"** → Frontend calls `/api/generate-video`
2. **Job Created** → Job record created in Appwrite `video_jobs` table
3. **Camber Triggered** → API calls your Camber function with job details
4. **Video Rendered** → Camber uses Remotion to render the video
5. **Video Uploaded** → Rendered video uploaded to Appwrite storage
6. **Webhook Sent** → Camber sends completion webhook to your app
7. **Job Updated** → App updates job status and provides download link
8. **User Downloads** → User can download the video directly

## Monitoring

- **Camber Dashboard**: Monitor function performance and logs
- **Appwrite Console**: Check job status and video storage
- **Application Logs**: Monitor webhook processing and errors

## Troubleshooting

### Common Issues

1. **Function Timeout**: Increase timeout in `camber.yaml`
2. **Memory Issues**: Increase memory allocation in `camber.yaml`
3. **Webhook Failures**: Check webhook URL and signature verification
4. **Upload Failures**: Verify Appwrite credentials and bucket permissions

### Debug Mode

Enable debug logging by setting:
```env
RENDER_MODE=sync
```

This will use local Remotion rendering instead of Camber (for testing).

## Scaling

The function is configured to:
- Scale to zero when idle (cost-effective)
- Handle up to 10 concurrent jobs
- Auto-scale based on demand

Adjust these settings in `camber.yaml` based on your needs.
