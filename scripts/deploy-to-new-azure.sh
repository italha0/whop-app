#!/bin/bash

# Deploy Whop Video Worker to New Azure VM
# Updated script for new Azure VM deployment with enhanced features

set -e

echo "🚀 Starting deployment to new Azure VM..."

# Configuration - UPDATE THESE VALUES FOR YOUR NEW VM
AZURE_VM_IP="YOUR_NEW_VM_PUBLIC_IP"  # Replace with your new VM's public IP
AZURE_USER="azureuser"
SSH_KEY="~/.ssh/your-azure-key.pem"  # Replace with your SSH key path
CONTAINER_NAME="whop-video-worker"
IMAGE_NAME="whop-video-worker:latest"
BACKUP_IMAGE_NAME="whop-video-worker:backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate configuration
if [ "$AZURE_VM_IP" = "YOUR_NEW_VM_PUBLIC_IP" ]; then
    log_error "Please update AZURE_VM_IP in the script with your actual VM IP address"
    exit 1
fi

if [ ! -f "${SSH_KEY/#\~/$HOME}" ]; then
    log_error "SSH key not found at: $SSH_KEY"
    log_info "Please update SSH_KEY path in the script"
    exit 1
fi

# Check if Docker is running locally
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running locally. Please start Docker and try again."
    exit 1
fi

# Test SSH connection
log_info "Testing SSH connection to Azure VM..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o BatchMode=yes "$AZURE_USER@$AZURE_VM_IP" echo "SSH connection successful" > /dev/null 2>&1; then
    log_error "Cannot connect to Azure VM. Please check:"
    echo "  - VM IP address: $AZURE_VM_IP"
    echo "  - SSH key path: $SSH_KEY"
    echo "  - VM is running and accessible"
    exit 1
fi
log_success "SSH connection verified"

# Build Docker image locally
log_info "Building Docker image locally..."
if docker build -f Dockerfile.worker.new -t "$IMAGE_NAME" .; then
    log_success "Docker image built successfully"
else
    log_error "Docker image build failed"
    exit 1
fi

# Save image to tar file
log_info "Saving Docker image to tar file..."
if docker save "$IMAGE_NAME" > whop-video-worker.tar; then
    log_success "Docker image saved to tar file"
else
    log_error "Failed to save Docker image"
    exit 1
fi

# Check if environment file exists
if [ ! -f "worker/worker.env" ]; then
    log_error "Environment file not found: worker/worker.env"
    log_info "Please create the environment file with your configuration"
    exit 1
fi

# Copy files to Azure VM
log_info "Copying files to Azure VM..."
if scp -i "$SSH_KEY" -o ConnectTimeout=30 whop-video-worker.tar "$AZURE_USER@$AZURE_VM_IP:/tmp/"; then
    log_success "Docker image uploaded to VM"
else
    log_error "Failed to upload Docker image"
    exit 1
fi

if scp -i "$SSH_KEY" -o ConnectTimeout=30 worker/worker.env "$AZURE_USER@$AZURE_VM_IP:/tmp/"; then
    log_success "Environment file uploaded to VM"
else
    log_error "Failed to upload environment file"
    exit 1
fi

# Deploy on Azure VM
log_info "Deploying on Azure VM..."
ssh -i "$SSH_KEY" "$AZURE_USER@$AZURE_VM_IP" << 'EOF'
    set -e
    
    # Colors for remote output
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    log_info() {
        echo -e "${BLUE}ℹ️  $1${NC}"
    }
    
    log_success() {
        echo -e "${GREEN}✅ $1${NC}"
    }
    
    log_warning() {
        echo -e "${YELLOW}⚠️  $1${NC}"
    }
    
    log_error() {
        echo -e "${RED}❌ $1${NC}"
    }
    
    # Create backup of current container if it exists
    if docker ps -a | grep -q whop-video-worker; then
        log_info "Creating backup of current container..."
        if docker ps | grep -q whop-video-worker; then
            docker stop whop-video-worker || true
        fi
        docker commit whop-video-worker whop-video-worker:backup 2>/dev/null || true
        docker rm whop-video-worker 2>/dev/null || true
        log_success "Backup created"
    fi
    
    # Load new image
    log_info "Loading new Docker image..."
    if docker load < /tmp/whop-video-worker.tar; then
        log_success "Docker image loaded successfully"
    else
        log_error "Failed to load Docker image"
        exit 1
    fi
    
    # Create application directory and copy environment file
    mkdir -p ~/whop-app
    cp /tmp/worker.env ~/whop-app/
    
    # Create log directory
    sudo mkdir -p /var/log/whop-worker
    sudo chown $USER:$USER /var/log/whop-worker
    
    # Run new container with enhanced configuration
    log_info "Starting new container..."
    if docker run -d \
        --name whop-video-worker \
        --env-file ~/whop-app/worker.env \
        --restart unless-stopped \
        --memory="4g" \
        --memory-swap="6g" \
        --shm-size="1g" \
        --cpus="3" \
        -v /tmp:/tmp \
        -v /var/log/whop-worker:/var/log/whop-worker \
        -p 3000:3000 \
        whop-video-worker:latest; then
        log_success "Container started successfully"
    else
        log_error "Failed to start container"
        
        # Attempt to restore backup if available
        if docker images | grep -q whop-video-worker:backup; then
            log_warning "Attempting to restore backup..."
            docker run -d \
                --name whop-video-worker \
                --env-file ~/whop-app/worker.env \
                --restart unless-stopped \
                -v /tmp:/tmp \
                -v /var/log/whop-worker:/var/log/whop-worker \
                whop-video-worker:backup
        fi
        exit 1
    fi
    
    # Wait for container to start
    log_info "Waiting for container to start..."
    sleep 10
    
    # Check container status
    if docker ps | grep -q whop-video-worker; then
        log_success "Container is running"
        
        # Show container details
        log_info "Container details:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep whop-video-worker
        
        # Show recent logs
        log_info "Recent container logs:"
        docker logs whop-video-worker --tail 20
        
        # Test container health
        log_info "Testing container health..."
        if docker exec whop-video-worker node -e "console.log('Health check passed')"; then
            log_success "Container health check passed"
        else
            log_warning "Container health check failed, but container is running"
        fi
        
    else
        log_error "Container failed to start"
        log_info "Container logs:"
        docker logs whop-video-worker --tail 50
        exit 1
    fi
    
    # Clean up old images (keep last 2 versions)
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    
    # Show system resources
    log_info "System resources after deployment:"
    echo "Memory usage:"
    free -h
    echo "Disk usage:"
    df -h /
    echo "Docker container resource usage:"
    docker stats whop-video-worker --no-stream
    
    # Cleanup temporary files
    rm -f /tmp/whop-video-worker.tar /tmp/worker.env
    log_success "Cleanup completed"
EOF

# Check deployment status
if [ $? -eq 0 ]; then
    log_success "Deployment completed successfully!"
    
    # Cleanup local files
    rm -f whop-video-worker.tar
    
    echo ""
    log_info "Deployment Summary:"
    echo "  🖥️  VM IP: $AZURE_VM_IP"
    echo "  🐳 Container: $CONTAINER_NAME"
    echo "  🏷️  Image: $IMAGE_NAME"
    echo ""
    log_info "Useful commands:"
    echo "  📊 Check status: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker ps'"
    echo "  📋 View logs: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker logs whop-video-worker -f'"
    echo "  🔄 Restart: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker restart whop-video-worker'"
    echo "  📈 Monitor: ssh -i \"$SSH_KEY\" $AZURE_USER@$AZURE_VM_IP 'docker stats whop-video-worker'"
    echo ""
    
    # Test the deployment
    log_info "Testing worker accessibility..."
    if curl -f -s "http://$AZURE_VM_IP:3000/health" > /dev/null 2>&1; then
        log_success "Worker API is accessible"
    else
        log_warning "Worker API test failed (this is normal if no health endpoint is configured)"
    fi
    
else
    log_error "Deployment failed!"
    rm -f whop-video-worker.tar
    exit 1
fi

log_success "🎉 Deployment process completed!"

