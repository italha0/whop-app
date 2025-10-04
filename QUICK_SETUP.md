# Quick Setup Guide

## 🚀 Deploy to Azure VM

### Step 1: Upload and Deploy
```powershell
# Run the deployment script
.\deploy-azure.ps1
```

### Step 2: Update Environment Variables
Add these to your `.env.local`:
```env
# Azure VM Configuration
AZURE_VM_ENDPOINT=http://172.18.0.5:3001/api/render
AZURE_API_KEY=your-azure-api-key
AZURE_WEBHOOK_SECRET=your-webhook-secret
AZURE_SSH_KEY_PATH=C:\Users\aman7\Downloads\scriptTovideo_key.pem

# Keep existing Appwrite config
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_VIDEO_BUCKET_ID=your-bucket-id
APPWRITE_VIDEO_JOBS_COLLECTION_ID=your-collection-id

# For local testing (sync mode)
RENDER_MODE=sync
```

### Step 3: Test the Application
```powershell
# Start your Next.js app
npm run dev

# In another terminal, test video generation
.\test-video-generation.ps1
```

## 🎬 How It Works

1. **Click "Generate Video"** → Frontend calls `/api/generate-video`
2. **Video Renders** → Either locally (sync mode) or on Azure VM (async mode)
3. **Preview & Download** → Video appears with play/pause/restart controls
4. **Download** → Click download to save the video

## 🔧 Troubleshooting

### Check Azure VM Status
```bash
ssh -i "C:\Users\aman7\Downloads\scriptTovideo_key.pem" azureuser@172.18.0.5
sudo systemctl status video-renderer
sudo journalctl -u video-renderer -f
```

### Test Azure VM Directly
```bash
curl http://172.18.0.5:3001/health
```

### Check Local App
- Visit `http://localhost:3000/video-generator`
- Open browser dev tools to see console logs
- Check network tab for API calls

## 📁 Files Created

- `azure-vm/` - Azure VM container files
- `upload-to-azure.ps1` - Upload script
- `deploy-azure.ps1` - Main deployment script
- `test-video-generation.ps1` - Test script
- `azure-vm-config.md` - Detailed setup guide

## 🎯 Features

✅ **Video Generation** - Click button to start rendering
✅ **Preview Controls** - Play, pause, restart video
✅ **Download** - Save video to your device
✅ **Multiple Themes** - iMessage, WhatsApp, Snapchat
✅ **Real-time Progress** - See generation progress
✅ **Error Handling** - Clear error messages
✅ **Azure VM Integration** - Scalable cloud rendering

## 🚨 Important Notes

1. **Sync Mode**: Set `RENDER_MODE=sync` for local testing
2. **Azure VM**: Remove `RENDER_MODE` for production with Azure VM
3. **SSH Key**: Make sure your SSH key has proper permissions
4. **Firewall**: Ensure port 3001 is open on your Azure VM
5. **Appwrite**: Configure your Appwrite credentials for video storage

## 🆘 Need Help?

1. Check the logs: `sudo journalctl -u video-renderer -f`
2. Test the health endpoint: `curl http://172.18.0.5:3001/health`
3. Check browser console for errors
4. Verify environment variables are set correctly
