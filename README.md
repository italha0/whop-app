# Script-to-Video Whop App

A professional script-to-video platform integrated with Whop for subscription management and payments. This app allows users to create stunning videos from text scripts using Remotion, with backend processing handled by Appwrite and Azure VM.

## 🚀 Features

- **Script-to-Video Creation**: Transform text scripts into professional videos
- **Whop Integration**: Seamless subscription management and payments
- **Multiple Themes**: Various video templates and themes
- **Real-time Preview**: Live preview of video content
- **Subscription Gating**: Access control based on subscription status
- **Professional Quality**: 4K video output support

## 🏗️ Architecture

- **Frontend**: Next.js with Remotion for video rendering
- **Backend**: Appwrite for database and authentication
- **Video Processing**: Azure VM for video rendering
- **Payments**: Whop for subscription management
- **Deployment**: Whop platform

## 📋 Prerequisites

- Node.js 20.x or higher
- Whop developer account
- Appwrite instance
- Azure VM for video rendering

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd my-whop-app

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Whop Configuration
WHOP_API_KEY=z8GLH-3blveAVAFvrhn5Ut7heiaHhUEGMiI1K760dm0
NEXT_PUBLIC_WHOP_APP_ID=app_SnIaXUWJd7LguW
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_hF3wMP4gNGUTU
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_iiSRDu5bZyPLIJ
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret_here

# Appwrite Configuration
APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
APPWRITE_KEY=your_appwrite_api_key_here

# Azure VM Configuration
AZURE_RENDER_URL=https://your-azure-vm-url.com
AZURE_API_KEY=your_azure_api_key_here

# Database Configuration
DATABASE_ID=main
SUBSCRIPTIONS_COLLECTION_ID=subscriptions
```

### 3. Appwrite Database Setup

Create the following collections in your Appwrite database:

#### Subscriptions Collection
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