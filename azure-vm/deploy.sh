#!/bin/bash

# Azure VM Deployment Script
# Run this script on your Azure VM to set up the video renderer

echo "🚀 Starting Azure VM deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional dependencies
echo "🔧 Installing additional dependencies..."
sudo apt-get install -y python3 python3-pip build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev ffmpeg

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /home/azureuser/video-renderer
cd /home/azureuser/video-renderer

# Copy files (you'll need to upload these via SCP)
echo "📋 Please upload the following files to /home/azureuser/video-renderer/:"
echo "   - package.json"
echo "   - server.js"
echo "   - Dockerfile"
echo "   - remotion/ directory"

# Set up environment variables
echo "⚙️ Setting up environment variables..."
cat > .env << EOF
# Appwrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_VIDEO_BUCKET_ID=your-bucket-id

# Azure Configuration
AZURE_WEBHOOK_SECRET=your-webhook-secret
PORT=3001
EOF

echo "✅ Environment file created. Please update with your actual values."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t video-renderer .

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/video-renderer.service > /dev/null << EOF
[Unit]
Description=Video Renderer Service
After=network.target

[Service]
Type=simple
User=azureuser
WorkingDirectory=/home/azureuser/video-renderer
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/azureuser/video-renderer/.env

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "🚀 Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable video-renderer
sudo systemctl start video-renderer

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 3001
sudo ufw --force enable

# Check service status
echo "📊 Checking service status..."
sudo systemctl status video-renderer

echo "✅ Deployment complete!"
echo "🌐 Your video renderer is running on: http://$(curl -s ifconfig.me):3001"
echo "🔍 Check logs with: sudo journalctl -u video-renderer -f"
echo "🔄 Restart service with: sudo systemctl restart video-renderer"
