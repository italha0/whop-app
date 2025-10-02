#!/bin/bash

# Deploy New Whop App Repository to Azure VM
# This script replaces the old script-to-video setup with the new whop-app

set -e

echo "🚀 Deploying new whop-app repository to Azure VM..."

# Configuration
AZURE_VM_IP="20.244.44.142"
AZURE_USER="azureuser"
SSH_KEY="C:/Users/aman7/Downloads/script-to-video_key.pem"

# Connect to Azure VM and execute deployment
ssh -i "$SSH_KEY" $AZURE_USER@$AZURE_VM_IP << 'EOF'
    echo "📍 Current location: $(pwd)"
    echo "📂 Available directories:"
    ls -la
    
    echo "🛑 Stopping any running workers..."
    pkill -f "worker.cjs" || echo "No worker processes found"
    
    echo "📥 Cloning new whop-app repository..."
    if [ -d "whop-app" ]; then
        echo "⚠️ whop-app directory exists, backing up..."
        mv whop-app whop-app-backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    git clone https://github.com/italha0/whop-app.git
    cd whop-app
    
    echo "✅ Repository cloned successfully"
    echo "📋 Repository contents:"
    ls -la
    
    echo "🔧 Setting up environment configuration..."
    # Copy existing environment files
    if [ -f "../worker.env" ]; then
        cp ../worker.env worker/worker.env
        echo "✅ Copied worker.env"
    fi
    
    if [ -f "../script-to-video/.env" ]; then
        cp ../script-to-video/.env worker/script-to-video.env
        echo "✅ Copied script-to-video .env"
    fi
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🐳 Building Docker image..."
    docker build -f Dockerfile.worker -t whop-video-worker:latest .
    
    echo "🛑 Stopping old containers..."
    docker stop whop-video-worker 2>/dev/null || echo "No container to stop"
    docker rm whop-video-worker 2>/dev/null || echo "No container to remove"
    
    echo "🚀 Starting new worker container..."
    docker run -d \
        --name whop-video-worker \
        --env-file worker/worker.env \
        --restart unless-stopped \
        -v /tmp:/tmp \
        whop-video-worker:latest
    
    echo "✅ Checking container status..."
    docker ps | grep whop-video-worker
    
    echo "📋 Container logs:"
    docker logs whop-video-worker --tail 20
    
    echo "🎉 Deployment completed successfully!"
    echo "📊 System status:"
    echo "- Repository: whop-app (latest)"
    echo "- Worker: Running in Docker container"
    echo "- Emoji support: Enabled"
    echo "- Environment: Configured"
    
EOF

echo "✅ Deployment script completed!"
echo "🔍 To check status: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker logs whop-video-worker'"


