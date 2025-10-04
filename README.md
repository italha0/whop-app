# Whop App - Chat Video Generator

A Next.js application that generates iMessage-style chat videos using Remotion and Azure VM. Users can create conversation videos with realistic typing animations, multiple themes (iMessage, WhatsApp, Snapchat), and automatic processing.

## 🚀 Features

- **Multiple Chat Themes**: iMessage, WhatsApp, and Snapchat styles
- **Realistic Animations**: Typing indicators, message bubbles, keyboard animations
- **Automatic Processing**: Azure VM handles video rendering
- **Direct Downloads**: Users can download videos directly to their device
- **Real-time Status**: Live updates on video generation progress
- **Emoji Support**: Full emoji rendering with fallbacks
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

```
Frontend (Next.js) → API Routes → Azure VM → Appwrite Storage
     ↓                    ↓              ↓
VideoGenerator → generate-video → Remotion Renderer → video_jobs table
```

## 📁 Project Structure

```
whop-app/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── generate-video/       # Main video generation API
│   │   ├── azure-webhook/        # Azure VM completion webhook
│   │   ├── render/               # Direct rendering API
│   │   └── render/download/      # Video download proxy
│   ├── video-generator/          # Video generator page
│   └── ...
├── components/
│   ├── VideoGenerator.tsx        # Main video generation component
│   └── ui/                       # UI components
├── remotion/                     # Remotion video components
│   ├── index.ts                  # Remotion entry point
│   ├── Root.tsx                  # Root composition
│   ├── MessageConversation.tsx   # Main video component
│   ├── themes.ts                 # Chat themes
│   └── emoji.ts                  # Emoji utilities
├── azure-vm/                     # Azure VM deployment files
│   ├── remotion_renderer.py      # Azure VM function
│   ├── azure.yaml               # Azure configuration
│   └── package.json             # Dependencies
├── lib/                         # Utilities
└── ...
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Appwrite account
- Azure VM with SSH access (for production)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_VIDEO_BUCKET_ID=your-bucket-id
APPWRITE_VIDEO_JOBS_COLLECTION_ID=your-collection-id

# Azure VM Configuration (for production)
AZURE_VM_ENDPOINT=https://your-azure-vm-url.com/api/render
AZURE_API_KEY=your-azure-api-key
AZURE_WEBHOOK_SECRET=your-webhook-secret
AZURE_SSH_KEY_PATH=C:\Users\aman7\Downloads\scriptTovideo_key.pem

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
RENDER_MODE=sync  # Use 'sync' for local testing, remove for production
```

### 3. Appwrite Setup

Create the following collections in your Appwrite project:

#### `video_jobs` Collection

```json
{
  "$id": "video_jobs",
  "name": "Video Jobs",
  "attributes": [
    {
      "key": "userId",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "status",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "conversation",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "estimatedDuration",
      "type": "integer",
      "required": false
    },
    {
      "key": "videoUrl",
      "type": "string",
      "size": 255,
      "required": false
    },
    {
      "key": "fileId",
      "type": "string",
      "size": 255,
      "required": false
    },
    {
      "key": "error",
      "type": "string",
      "size": 255,
      "required": false
    },
    {
      "key": "uploadToAppwrite",
      "type": "boolean",
      "required": false
    }
  ]
}
```

#### Storage Bucket

Create a storage bucket for videos with the following permissions:
- **Create**: Any authenticated user
- **Read**: Any authenticated user
- **Update**: Any authenticated user
- **Delete**: Any authenticated user

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/video-generator` to test the video generator.

## 🎬 Usage

### Basic Usage

```tsx
import { VideoGenerator } from '@/components/VideoGenerator';

const conversation = {
  contactName: 'Alex',
  theme: 'imessage',
  messages: [
    { text: 'Hello!', sent: false },
    { text: 'Hi there!', sent: true },
    { text: 'How are you?', sent: false },
    { text: 'I\'m doing great! 😊', sent: true }
  ]
};

<VideoGenerator 
  conversation={conversation}
  onComplete={(videoUrl) => console.log('Video ready:', videoUrl)}
/>
```

### API Usage

#### Generate Video

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": {
      "contactName": "Alex",
      "theme": "imessage",
      "messages": [
        {"text": "Hello!", "sent": false},
        {"text": "Hi there!", "sent": true}
      ]
    },
    "userId": "user_123",
    "uploadToAppwrite": true
  }'
```

#### Check Job Status

```bash
curl "http://localhost:3000/api/generate-video?jobId=job_123"
```

## 🚀 Production Deployment

### 1. Deploy to Azure VM

Set up your Azure VM with the Remotion renderer and configure the webhook endpoint for automatic video processing.

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Update Environment Variables

Set the production environment variables in your deployment platform.

## 🎨 Customization

### Adding New Themes

1. Add theme definition in `remotion/themes.ts`:

```typescript
export const themes: Record<string, ChatTheme> = {
  // ... existing themes
  telegram: {
    name: 'Telegram',
    colors: {
      // ... theme colors
    },
    // ... other theme properties
  }
};
```

2. Use the theme in your conversation:

```tsx
const conversation = {
  contactName: 'Alex',
  theme: 'telegram', // Use your new theme
  messages: [...]
};
```

### Customizing Video Settings

Edit `remotion/Root.tsx` to modify:
- Video dimensions (width, height)
- Frame rate (fps)
- Duration (durationInFrames)
- Default props

## 🐛 Troubleshooting

### Common Issues

1. **Video Generation Fails**
   - Check Appwrite credentials
   - Verify bucket permissions
   - Check Azure VM logs

2. **Download Issues**
   - Ensure CORS is properly configured
   - Check download proxy endpoint

3. **Webhook Failures**
   - Verify webhook URL is accessible
   - Check signature verification

### Debug Mode

Set `RENDER_MODE=sync` in your environment variables to use local rendering instead of Azure VM (useful for debugging).

## 📊 Monitoring

- **Appwrite Console**: Monitor job status and storage usage
- **Azure VM**: Monitor VM performance and logs
- **Application Logs**: Check webhook processing and errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:
1. Check the troubleshooting section
2. Review the Azure VM setup guide
3. Open an issue on GitHub

---

**Happy Video Generating! 🎬✨**