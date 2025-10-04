# Azure VM Integration Guide

This guide explains how to set up Azure VM integration for video rendering with your SSH key.

## Prerequisites

- Azure VM with Ubuntu/Linux
- SSH access configured
- Node.js 18+ installed on the VM
- Your SSH key: `C:\Users\aman7\Downloads\scriptTovideo_key.pem`

## Environment Variables

Add these to your `.env.local`:

```env
# Azure VM Configuration
AZURE_VM_ENDPOINT=https://your-azure-vm-ip/api/render
AZURE_API_KEY=your-azure-api-key
AZURE_WEBHOOK_SECRET=your-webhook-secret
AZURE_SSH_KEY_PATH=C:\Users\aman7\Downloads\scriptTovideo_key.pem
```

## Azure VM Setup

### 1. Install Dependencies on VM

```bash
# SSH into your VM
ssh -i "C:\Users\aman7\Downloads\scriptTovideo_key.pem" azureuser@your-vm-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Remotion dependencies
npm install @remotion/bundler @remotion/cli @remotion/renderer @remotion/streaming
npm install react react-dom
```

### 2. Create Video Renderer Service

Create `/home/azureuser/video-renderer/server.js`:

```javascript
const express = require('express');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(express.json());

app.post('/api/render', async (req, res) => {
  try {
    const { jobId, conversation, uploadToAppwrite, webhookUrl } = req.body;
    
    console.log(`🎬 Starting render for job ${jobId}`);
    
    // Create temp output file
    const tempOutput = path.join(os.tmpdir(), `video_${jobId}.mp4`);
    
    // Bundle Remotion project (you'll need to upload your remotion folder)
    const bundleLocation = await bundle({
      entryPoint: path.resolve('/home/azureuser/remotion/index.ts'),
      webpackOverride: (config) => config,
    });
    
    // Select composition
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MessageConversation',
      inputProps: conversation
    });
    
    // Render video
    await renderMedia({
      composition: compositions,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: tempOutput,
      inputProps: conversation
    });
    
    console.log(`✅ Render complete for job ${jobId}`);
    
    // Upload to Appwrite (if configured)
    let videoUrl = null;
    if (uploadToAppwrite) {
      // Implement Appwrite upload logic here
      videoUrl = await uploadToAppwrite(tempOutput, jobId);
    }
    
    // Send webhook notification
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          status: 'completed',
          videoUrl,
          fileId: jobId
        })
      });
    }
    
    // Cleanup
    fs.unlinkSync(tempOutput);
    
    res.json({ success: true, videoUrl });
    
  } catch (error) {
    console.error('Render error:', error);
    
    // Send failure webhook
    if (req.body.webhookUrl) {
      await fetch(req.body.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: req.body.jobId,
          status: 'failed',
          error: error.message
        })
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Azure VM renderer running on port ${PORT}`);
});
```

### 3. Create Package.json

Create `/home/azureuser/video-renderer/package.json`:

```json
{
  "name": "azure-vm-renderer",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@remotion/bundler": "^4.0.355",
    "@remotion/cli": "^4.0.355",
    "@remotion/renderer": "^4.0.355",
    "@remotion/streaming": "^4.0.355",
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 4. Upload Remotion Project

Upload your `remotion/` folder to `/home/azureuser/remotion/` on the VM.

### 5. Start the Service

```bash
cd /home/azureuser/video-renderer
npm install
npm start
```

### 6. Configure Firewall

Open port 3001 on your Azure VM:

```bash
sudo ufw allow 3001
```

## Testing

Test the integration:

```bash
curl -X POST http://your-vm-ip:3001/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test_123",
    "conversation": {
      "contactName": "Test",
      "theme": "imessage",
      "messages": [
        {"text": "Hello!", "sent": false},
        {"text": "Hi!", "sent": true}
      ]
    },
    "uploadToAppwrite": false,
    "webhookUrl": "http://your-app-url.com/api/azure-webhook"
  }'
```

## Security

- Use HTTPS in production
- Implement API key authentication
- Validate webhook signatures
- Use environment variables for secrets

## Monitoring

- Check VM logs: `journalctl -u your-service`
- Monitor CPU/memory usage
- Set up alerts for failures

## Scaling

- Use Azure VM Scale Sets for multiple instances
- Implement load balancing
- Consider Azure Container Instances for better scaling
