# Deployment Guide

This guide covers deploying the chat renderer pipeline in various environments.

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Next.js examples)
- FFmpeg
- Git

### Setup

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd render-pipeline
pip install -r requirements.txt
bash playwright_install.sh
```

2. **Test the renderer:**
```bash
python renderer/render.py examples/conversation.json output.mp4
```

3. **Run tests:**
```bash
python tests/run_all_tests.py
```

## Docker Deployment

### Single Container

```bash
# Build image
docker build -t chat-renderer .

# Run with volume mount
docker run --rm -v $(pwd)/output:/out chat-renderer

# Run with custom conversation
docker run --rm -v $(pwd)/output:/out -v $(pwd)/examples:/examples:ro \
  chat-renderer python renderer/render.py /examples/conversation.json /out/output.mp4
```

### Docker Compose (with Appwrite)

```bash
# Set environment variables
export APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
export APPWRITE_PROJECT_ID="your_project_id"
export APPWRITE_API_KEY="your_api_key"
export APPWRITE_STORAGE_BUCKET_ID="videos"

# Start services
cd appwrite
docker-compose up -d

# Check logs
docker-compose logs -f chat-renderer
```

## Appwrite Cloud Deployment

### 1. Create Appwrite Project

1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Create new project
3. Note your Project ID

### 2. Setup Storage

```bash
# Create storage bucket
curl -X POST "https://cloud.appwrite.io/v1/storage/buckets" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bucketId": "videos",
    "name": "Video Storage",
    "permissions": ["read(\"any\")", "write(\"any\")"],
    "fileSecurity": false,
    "enabled": true,
    "maximumFileSize": 104857600,
    "allowedFileExtensions": ["mp4", "webm", "mov"]
  }'
```

### 3. Deploy Function

```bash
# Create function
curl -X POST "https://cloud.appwrite.io/v1/functions" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "functionId": "chat-renderer",
    "name": "Chat Video Renderer",
    "runtime": "python-3.11",
    "execute": ["any"],
    "events": [],
    "schedule": "",
    "timeout": 300
  }'

# Deploy function code
cd appwrite
tar -czf function.tar.gz function_wrapper.py ../renderer ../templates ../assets
curl -X POST "https://cloud.appwrite.io/v1/functions/chat-renderer/deployments" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -F "code=@function.tar.gz"
```

### 4. Test Function

```bash
# Execute function
curl -X POST "https://cloud.appwrite.io/v1/functions/chat-renderer/executions" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"conversation\": {\"messages\": [{\"id\": \"m1\", \"text\": \"Hello!\", \"sent\": true}]}, \"preset\": \"standard\"}"
  }'
```

## VPS Deployment (Oracle Always Free)

### 1. Setup VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-pip ffmpeg git

# Install Python packages
pip3.11 install -r requirements.txt
playwright install chromium
```

### 2. Setup as Service

Create `/etc/systemd/system/chat-renderer.service`:

```ini
[Unit]
Description=Chat Video Renderer
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/render-pipeline
ExecStart=/usr/bin/python3.11 appwrite/worker.py
Restart=always
RestartSec=10
Environment=APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
Environment=APPWRITE_PROJECT_ID=your_project_id
Environment=APPWRITE_API_KEY=your_api_key
Environment=REDIS_URL=redis://localhost:6379

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable chat-renderer
sudo systemctl start chat-renderer
sudo systemctl status chat-renderer
```

## Next.js Integration

### 1. Setup Next.js App

```bash
npx create-next-app@latest my-chat-app
cd my-chat-app
npm install appwrite
```

### 2. Copy API Routes

Copy the API routes from `nextjs/example_api_snippet.txt` to your Next.js app.

### 3. Environment Variables

Create `.env.local`:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_FUNCTION_ID=chat-renderer
APPWRITE_STORAGE_BUCKET_ID=videos
```

### 4. Deploy to Vercel

```bash
npm run build
vercel --prod
```

## Performance Optimization

### Hardware Acceleration

The renderer automatically detects and uses:
- **NVENC** (NVIDIA GPUs)
- **VAAPI** (Intel/AMD GPUs) 
- **VideoToolbox** (macOS)

### Scaling

1. **Horizontal scaling**: Run multiple worker containers
2. **Queue management**: Use Redis for job distribution
3. **Caching**: Cache rendered videos in Appwrite Storage
4. **CDN**: Use Appwrite's CDN for video delivery

### Monitoring

```bash
# Check worker status
docker-compose logs -f worker

# Monitor resource usage
docker stats

# Check Appwrite function logs
curl "https://cloud.appwrite.io/v1/functions/chat-renderer/executions" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -H "X-Appwrite-Key: YOUR_API_KEY"
```

## Troubleshooting

### Common Issues

1. **Playwright not found:**
```bash
playwright install chromium
```

2. **FFmpeg not found:**
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
choco install ffmpeg
```

3. **Audio generation fails:**
```bash
pip install numpy scipy
```

4. **Appwrite connection fails:**
- Check API key permissions
- Verify project ID
- Ensure storage bucket exists

### Debug Mode

```bash
# Enable verbose logging
export DEBUG=1
python renderer/render.py examples/conversation.json output.mp4 --verbose
```

### Performance Issues

1. **Slow rendering:**
   - Use `preview` preset for testing
   - Enable hardware acceleration
   - Reduce video resolution

2. **Memory issues:**
   - Increase Docker memory limits
   - Use smaller conversation batches
   - Clear temp files regularly

## Security Considerations

1. **API Keys**: Store in environment variables
2. **File Uploads**: Validate conversation data
3. **Rate Limiting**: Implement in Next.js API routes
4. **CORS**: Configure for your domain
5. **Input Validation**: Sanitize all user inputs

## Cost Optimization

1. **Oracle Always Free**: Use for development/testing
2. **Appwrite Free Tier**: 50GB storage, 1M requests/month
3. **Vercel Free Tier**: 100GB bandwidth/month
4. **Docker Hub**: Free public repositories

## Backup Strategy

1. **Code**: Git repository
2. **Videos**: Appwrite Storage (automatic backups)
3. **Configuration**: Environment variables in version control
4. **Database**: Redis persistence enabled

