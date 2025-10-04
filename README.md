# Whop App - Chat Video Generator

A Next.js application that generates iMessage-style chat videos using Remotion and Camber Cloud. Users can create conversation videos with realistic typing animations, multiple themes (iMessage, WhatsApp, Snapchat), and automatic processing.

## 🚀 Features

- **Multiple Chat Themes**: iMessage, WhatsApp, and Snapchat styles
- **Realistic Animations**: Typing indicators, message bubbles, keyboard animations
- **Automatic Processing**: Camber Cloud handles video rendering
- **Direct Downloads**: Users can download videos directly to their device
- **Real-time Status**: Live updates on video generation progress
- **Emoji Support**: Full emoji rendering with fallbacks
- **Responsive Design**: Works on desktop and mobile

## 🏗️ Architecture

```
Frontend (Next.js) → API Routes → Camber Cloud → Appwrite Storage
     ↓                    ↓              ↓
VideoGenerator → generate-video → Remotion Renderer → video_jobs table
```

## 📁 Project Structure

```
whop-app/
├── app/                          # Next.js app directory
│   ├── api/
│   │   ├── generate-video/       # Main video generation API
│   │   ├── camber-webhook/       # Camber completion webhook
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
├── camber-remotion/              # Camber deployment files
│   ├── remotion_renderer.py      # Camber function
│   ├── camber.yaml              # Camber configuration
│   └── package.json             # Dependencies
├── lib/                         # Utilities
└── ...
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Appwrite account
- Camber Cloud account (for production)

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

# Camber Configuration (for production)
CAMBER_RENDER_ENDPOINT=https://your-function-url.camber.cloud
CAMBER_API_KEY=your-camber-api-key
CAMBER_WEBHOOK_SECRET=your-webhook-secret

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

### 1. Deploy to Camber Cloud

Follow the [Camber Deployment Guide](./CAMBER_DEPLOYMENT.md) to set up automatic video processing.

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
   - Check Camber function logs

2. **Download Issues**
   - Ensure CORS is properly configured
   - Check download proxy endpoint

3. **Webhook Failures**
   - Verify webhook URL is accessible
   - Check signature verification

### Debug Mode

Set `RENDER_MODE=sync` in your environment variables to use local rendering instead of Camber (useful for debugging).

## 📊 Monitoring

- **Appwrite Console**: Monitor job status and storage usage
- **Camber Dashboard**: Monitor function performance and logs
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
2. Review the Camber deployment guide
3. Open an issue on GitHub

---

**Happy Video Generating! 🎬✨**