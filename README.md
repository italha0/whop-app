# Script-to-Video Whop App

A professional script-to-video platform integrated with Whop for subscription management and payments. This app allows users to create stunning videos from text scripts using Remotion, with backend processing handled by Appwrite and Azure VM.

## 🚀 Features

- **Script-to-Video Creation**: Transform text scripts into professional videos
- **Emoji Support**: Full emoji rendering in videos with proper font support
- **Whop Integration**: Seamless subscription management and payments
- **Multiple Themes**: Various video templates and themes
- **Real-time Preview**: Live preview of video content
- **Subscription Gating**: Access control based on subscription status
- **Professional Quality**: 4K video output support
- **Azure VM Processing**: Scalable video rendering on Azure infrastructure
- **Queue Management**: Redis-based job queue for reliable processing

## 🏗️ Architecture

- **Frontend**: Next.js with Remotion for video rendering
- **Backend**: Appwrite for database and authentication
- **Video Processing**: Azure VM with Docker containers for scalable rendering
- **Queue System**: Redis (Azure Cache) for job management
- **Storage**: Azure Blob Storage for video files
- **Database**: Supabase for render job tracking
- **Payments**: Whop for subscription management
- **Deployment**: Whop platform + Azure VM worker

## 📋 Prerequisites

- Node.js 20.x or higher
- Whop developer account
- Appwrite instance
- Azure VM for video rendering
- Azure Storage Account
- Redis instance (Azure Cache for Redis)
- Supabase project
- Docker (for local development and deployment)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory using `config.example.env` as a template:

```bash
cp config.example.env .env.local
```

Update the following variables with your actual values:

```env
# Whop Configuration
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_whop_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_whop_company_id
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret

# Appwrite Configuration
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_KEY=your_appwrite_api_key
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_appwrite_project_id

# Supabase Configuration (for video rendering)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string

# Redis Configuration
REDIS_URL=your_redis_connection_string
```

### 3. Database Setup

#### Supabase Setup
Run the SQL scripts in the `scripts/` directory to create the required tables:

```sql
-- Run these in your Supabase SQL editor
-- scripts/001_create_tables.sql
-- scripts/002_profile_trigger.sql
-- scripts/003_renders_table.sql
-- scripts/004_daily_render_quota.sql
-- scripts/005_video_renders_table.sql
-- scripts/006_add_blob_name.sql
```

#### Appwrite Setup (Optional)
Create the following collections in your Appwrite database if using Appwrite for additional features:

### 4. Azure VM Worker Setup

#### Build and Deploy Worker
```bash
# Build Docker image
npm run docker:build

# Deploy to Azure VM (update scripts/deploy-to-azure.sh with your VM details)
npm run deploy:azure
```

#### Manual Deployment
```bash
# Copy worker files to Azure VM
scp -i "path/to/your/key.pem" -r worker/ azureuser@your-vm-ip:/home/azureuser/whop-app/

# SSH to Azure VM and run
ssh -i "path/to/your/key.pem" azureuser@your-vm-ip
cd whop-app
docker build -f Dockerfile.worker -t whop-video-worker .
docker run -d --name whop-video-worker --env-file worker/worker.env --restart unless-stopped whop-video-worker
```

### 5. Testing

#### Test Worker Integration
```bash
# Test the complete worker setup
npm run worker:test

# Test emoji prefetching
npm run prefetch:emojis

# Check worker logs on Azure VM
ssh -i "path/to/your/key.pem" azureuser@your-vm-ip 'docker logs whop-video-worker'
```

## 🎨 Emoji Support

This app includes comprehensive emoji support for video rendering:

- **Font-based rendering**: Uses system emoji fonts for reliable rendering
- **Prefetching**: Common emojis are cached for offline use
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Video-optimized**: Emojis render correctly in video output

### Emoji Configuration

The worker automatically processes emoji text in:
- Message content
- User names
- Any text fields containing emojis

Emojis are rendered using the following font stack:
- Apple Color Emoji (macOS/iOS)
- Segoe UI Emoji (Windows)
- Noto Color Emoji (Linux)
- System fallbacks

## 🚀 Development

### Local Development
```bash
# Start the Next.js app
npm run dev

# Start worker locally (requires Redis and other services)
npm run worker:dev

# Preview Remotion compositions
npm run remotion:preview
```

### Production Deployment

1. **Deploy Web App**: Deploy to Whop platform
2. **Deploy Worker**: Use `npm run deploy:azure` to deploy worker to Azure VM
3. **Monitor**: Check logs and status using provided scripts

## 📊 Monitoring

### Worker Status
```bash
# Check if worker is running
ssh -i "key.pem" azureuser@vm-ip 'docker ps | grep whop-video-worker'

# View worker logs
ssh -i "key.pem" azureuser@vm-ip 'docker logs whop-video-worker --tail 50'

# Check system resources
ssh -i "key.pem" azureuser@vm-ip 'htop'
```

### Queue Status
Monitor your Redis queue through Azure Portal or Redis CLI.

## 🔧 Troubleshooting

### Common Issues

1. **Emoji not rendering**: Ensure emoji fonts are installed on the worker system
2. **Worker not processing jobs**: Check Redis connection and worker logs
3. **Video upload fails**: Verify Azure Storage credentials
4. **Database errors**: Check Supabase connection and table structure

### Debug Commands
```bash
# Test individual components
npm run worker:test
node -e "console.log(require('./lib/queue').getRenderQueue())"
```

#### Subscriptions Collection (Appwrite - Optional)
```json
{
  "collectionId": "subscriptions",
  "name": "Subscriptions",
  "attributes": [
    {
      "key": "whopUserId",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "status",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "subscriptionId",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "planId",
      "type": "string",
      "size": 100,
      "required": true
    },
    {
      "key": "companyId",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "agentUserId",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "startDate",
      "type": "datetime",
      "required": true
    },
    {
      "key": "endDate",
      "type": "datetime",
      "required": true
    },
    {
      "key": "updatedAt",
      "type": "datetime",
      "required": true
    }
  ]
}
```

### 4. Whop Product Setup

1. Go to your [Whop Dashboard](https://whop.com/dashboard)
2. Create products for each subscription tier:
   - Basic Plan: $9.99/month
   - Pro Plan: $19.99/month
   - Enterprise Plan: $49.99/month
3. Configure webhook endpoints to point to your deployed app's `/api/whop-webhook` route
4. Set up the webhook secret in your environment variables

## 🚀 Development

### Local Development with Whop Proxy

```bash
# Start the development server with Whop proxy
npm run dev
```

This will start the app with the Whop proxy, allowing you to test the app within the Whop iframe environment.

### Regular Development

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your app.

## 📁 Project Structure

```
my-whop-app/
├── app/
│   ├── api/
│   │   ├── appwrite-proxy/     # Proxy for Appwrite API calls
│   │   ├── render-job/         # Video rendering API
│   │   ├── subscription-status/ # Subscription checking API
│   │   └── whop-webhook/       # Whop webhook handler
│   ├── editor/                 # Video editor page
│   └── page.tsx               # Landing page
├── components/
│   ├── editor/                # Video editor components
│   ├── payment/               # Payment and subscription components
│   └── ui/                    # UI components
├── hooks/
│   └── useSubscription.ts     # Subscription status hook
├── lib/
│   ├── appwrite/              # Appwrite client configuration
│   └── store.ts               # Global state management
└── remotion/                   # Remotion video components
```

## 🔧 API Endpoints

### `/api/appwrite-proxy`
Proxies requests to Appwrite, hiding API keys from the client.

**Methods**: `GET`, `POST`

### `/api/render-job`
Handles video rendering requests with subscription validation.

**Methods**: `GET`, `POST`

### `/api/subscription-status`
Checks user subscription status.

**Method**: `GET`

### `/api/whop-webhook`
Handles Whop webhook events for subscription management.

**Method**: `POST`

## 💳 Payment Integration

### Whop Checkout Flow

1. User clicks "Get Started" on pricing plans
2. Redirects to Whop checkout page
3. After successful payment, Whop sends webhook to `/api/whop-webhook`
4. Webhook handler updates subscription status in Appwrite
5. User gains access to video rendering features

### Subscription Validation

- All video rendering requests are validated against subscription status
- Users without active subscriptions see a paywall
- Subscription status is checked in real-time

## 🚀 Deployment

### Deploy to Whop

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Deploy to Whop**:
   - Go to your Whop Dashboard
   - Navigate to your app settings
   - Upload your built app or connect your repository
   - Configure environment variables in Whop's dashboard

3. **Set up webhooks**:
   - Configure webhook URL: `https://your-app-url.com/api/whop-webhook`
   - Set webhook secret in Whop dashboard
   - Test webhook delivery

### Environment Variables in Production

Set the following environment variables in your Whop app settings:

- `WHOP_API_KEY`
- `WHOP_WEBHOOK_SECRET`
- `APPWRITE_ENDPOINT`
- `APPWRITE_KEY`
- `AZURE_RENDER_URL`
- `AZURE_API_KEY`

## 🔒 Security Considerations

- All API keys are stored server-side only
- Webhook signatures are verified using HMAC
- User authentication is handled by Whop
- Subscription status is validated on every render request

## 🐛 Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Ensure webhook is enabled in Whop dashboard

2. **Subscription status not updating**:
   - Check Appwrite database connection
   - Verify webhook handler is processing events correctly
   - Check webhook signature verification

3. **Video rendering failing**:
   - Verify Azure VM is accessible
   - Check API key configuration
   - Ensure user has active subscription

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## 📚 Additional Resources

- [Whop Developer Documentation](https://dev.whop.com)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Remotion Documentation](https://www.remotion.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact:
- Email: support@yourcompany.com
- Discord: [Your Discord Server]
- Documentation: [Your Documentation Site]

---

**Note**: This is a template for integrating a script-to-video app with Whop. Make sure to customize the branding, pricing, and features according to your specific needs.