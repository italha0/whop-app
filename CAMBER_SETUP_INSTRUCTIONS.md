# Camber Setup Instructions

## What You Need to Do in Camber

### 1. Create a New Function

1. **Login to Camber Cloud**: Go to [camber.cloud](https://camber.cloud) and login
2. **Create New Function**: Click "Create Function" or "New Function"
3. **Choose Runtime**: Select "Node.js" or "Python" (we're using Python with Node.js dependencies)

### 2. Upload Your Code

1. **Upload the `camber-remotion` folder**:
   - Zip the `camber-remotion` folder
   - Upload it as your function code
   - Or use Git integration if available

2. **Set the Entry Point**: 
   - Handler: `remotion_renderer.handler`
   - Main file: `remotion_renderer.py`

### 3. Configure Environment Variables

In the Camber dashboard, set these secrets:

```
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_VIDEO_BUCKET_ID=your-bucket-id
CAMBER_WEBHOOK_SECRET=your-webhook-secret
```

### 4. Configure Resources

Set these in the Camber dashboard:
- **CPU**: 2 vCPU
- **Memory**: 8GB RAM
- **Timeout**: 15 minutes
- **Concurrent Jobs**: 1 per instance

### 5. Deploy and Test

1. **Deploy the Function**: Click "Deploy" in Camber
2. **Get the Function URL**: Copy the function URL (e.g., `https://your-function.camber.cloud`)
3. **Update Your App**: Add the function URL to your `.env.local`:

```env
CAMBER_RENDER_ENDPOINT=https://your-function.camber.cloud
CAMBER_API_KEY=your-camber-api-key
```

### 6. Test the Integration

1. **Test the Function Directly**:
   ```bash
   curl -X POST https://your-function.camber.cloud \
     -H "Content-Type: application/json" \
     -d '{
       "jobId": "test_123",
       "conversation": {
         "contactName": "Test",
         "theme": "imessage",
         "messages": [
           {"id": 1, "text": "Hello!", "sent": false, "time": "0:00"},
           {"id": 2, "text": "Hi!", "sent": true, "time": "0:02"}
         ]
       },
       "uploadToAppwrite": false,
       "webhookUrl": null
     }'
   ```

2. **Test Through Your App**: Visit `http://localhost:3000/video-generator` and generate a video

### 7. Monitor and Debug

1. **Check Function Logs**: In Camber dashboard, monitor function execution
2. **Check Appwrite**: Verify jobs are being created and updated
3. **Check Webhooks**: Ensure webhooks are being received by your app

## Troubleshooting

### Common Issues

1. **Function Timeout**: Increase timeout in Camber settings
2. **Memory Issues**: Increase memory allocation
3. **Node.js Dependencies**: Ensure all Remotion packages are installed
4. **Appwrite Permissions**: Verify API key has proper permissions

### Debug Mode

For local testing, set `RENDER_MODE=sync` in your `.env.local` to bypass Camber and use local rendering.

## Expected Workflow

1. User clicks "Generate Video" → Your app calls `/api/generate-video`
2. Job created in Appwrite → Job status: "queued"
3. Your app calls Camber function → Camber starts rendering
4. Camber renders video with Remotion → Video uploaded to Appwrite
5. Camber sends webhook → Your app updates job status: "completed"
6. User can download video → Direct download from Appwrite storage

## Success Indicators

- ✅ Function deploys without errors
- ✅ Test request returns success
- ✅ Videos appear in Appwrite storage
- ✅ Webhooks are received by your app
- ✅ Job status updates correctly
- ✅ Users can download videos

That's it! Your Camber integration should now be working for automatic video processing.
