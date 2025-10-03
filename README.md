# Chat Video Creator

Transform your conversations into stunning chat videos with synchronized audio. Perfect for social media, marketing, and storytelling.

## Features

- **Pixel-perfect themes**: iMessage, WhatsApp, and Snapchat
- **Synchronized audio**: Realistic keyboard clicks and send/receive chimes
- **Multiple themes**: Authentic colors, fonts, and animations
- **HD quality**: Professional video output
- **Easy to use**: No technical skills required

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Start with 5 free videos** - No credit card required
2. **Create your conversation** - Add messages and choose a theme
3. **Render your video** - Get a professional chat video in minutes
4. **Upgrade for unlimited** - $19.99/month for unlimited videos

## Subscription Model

- **Free**: 5 videos per user
- **Unlimited**: $19.99/month for unlimited videos
- **Cancel anytime**: No hidden fees

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Appwrite (Database, Storage, Functions)
- **Video Rendering**: Python + Playwright (see `render-pipeline/`)
- **Payments**: Whop integration

## Project Structure

```
├── app/                    # Next.js app router
│   ├── editor/            # Chat video editor
│   ├── api/               # API routes
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── payment/           # Subscription components
│   ├── ui/                # UI components
│   └── layout/            # Layout components
├── lib/                   # Utilities and configurations
├── render-pipeline/       # Python video renderer
└── public/                # Static assets
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

The app is designed to be deployed on Vercel with Appwrite as the backend.

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set up Appwrite**:
   - Create an Appwrite project
   - Set up database and storage
   - Configure environment variables

3. **Environment Variables**:
   ```env
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   WHOP_API_KEY=your_whop_key
   ```

## License

Private project - All rights reserved.

