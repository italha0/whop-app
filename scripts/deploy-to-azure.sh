#!/bin/bash

# Deploy Whop Video Worker to Azure VM
# This script builds and deploys the Docker container to your Azure VM

set -e

echo "🚀 Starting deployment to Azure VM..."

# Configuration
AZURE_VM_IP="20.244.44.142"
AZURE_USER="azureuser"
SSH_KEY="C:/Users/aman7/Downloads/script-to-video_key.pem"
CONTAINER_NAME="whop-video-worker"
IMAGE_NAME="whop-video-worker:latest"

# Build Docker image locally
echo "📦 Building Docker image..."
docker build -f Dockerfile.worker -t $IMAGE_NAME .

# Save image to tar file
echo "💾 Saving Docker image..."
docker save $IMAGE_NAME > whop-video-worker.tar

# Copy files to Azure VM
echo "📤 Copying files to Azure VM..."
scp -i "$SSH_KEY" whop-video-worker.tar $AZURE_USER@$AZURE_VM_IP:/tmp/
scp -i "$SSH_KEY" worker/worker.env $AZURE_USER@$AZURE_VM_IP:/tmp/

# Deploy on Azure VM
echo "🔧 Deploying on Azure VM..."
ssh -i "$SSH_KEY" $AZURE_USER@$AZURE_VM_IP << 'EOF'
    # Stop existing container
    echo "🛑 Stopping existing container..."
    docker stop whop-video-worker 2>/dev/null || true
    docker rm whop-video-worker 2>/dev/null || true
    
    # Load new image
    echo "📥 Loading new Docker image..."
    docker load < /tmp/whop-video-worker.tar
    
    # Run new container
    echo "🚀 Starting new container..."
    docker run -d \
        --name whop-video-worker \
        --env-file /tmp/worker.env \
        --restart unless-stopped \
        -v /tmp:/tmp \
        whop-video-worker:latest
    
    # Check status
    echo "✅ Checking container status..."
    docker ps | grep whop-video-worker
    
    # Show logs
    echo "📋 Container logs:"
    docker logs whop-video-worker --tail 20
    
    # Cleanup
    rm -f /tmp/whop-video-worker.tar /tmp/worker.env
EOF

# Cleanup local files
rm -f whop-video-worker.tar

echo "🎉 Deployment completed successfully!"
echo "📊 Check worker status with: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker logs whop-video-worker'"
