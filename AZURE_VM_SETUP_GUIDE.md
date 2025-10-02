# Azure VM Setup Guide for Remotion Video Rendering

This guide will help you create and configure a new Azure VM for your Whop app's Remotion video rendering process.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed on your local machine
- SSH key pair for secure access
- Docker knowledge for containerized deployment

## Step 1: Create Azure VM

### Option A: Using Azure Portal

1. **Login to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create Virtual Machine**
   - Click "Create a resource" > "Virtual Machine"
   - Fill in the basic details:
     - **Subscription**: Your Azure subscription
     - **Resource Group**: Create new or use existing
     - **VM Name**: `whop-video-renderer`
     - **Region**: Choose closest to your users (e.g., East US, West Europe)
     - **Image**: Ubuntu Server 22.04 LTS - Gen2
     - **Size**: Standard_D4s_v3 (4 vCPUs, 16 GB RAM) - Recommended for video rendering

3. **Configure Authentication**
   - **Authentication type**: SSH public key
   - **Username**: `azureuser`
   - **SSH public key source**: Generate new key pair or use existing
   - Download the private key if generating new

4. **Configure Networking**
   - Create new virtual network or use existing
   - **Public inbound ports**: Allow SSH (22), HTTP (80), HTTPS (443)
   - **Custom ports**: Add port 3000 if needed for API access

5. **Review and Create**
   - Review all settings
   - Click "Create"
   - Wait for deployment to complete

### Option B: Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name whop-video-rg --location eastus

# Create VM
az vm create \
  --resource-group whop-video-rg \
  --name whop-video-renderer \
  --image Ubuntu2204 \
  --size Standard_D4s_v3 \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --storage-sku Premium_LRS

# Open necessary ports
az vm open-port --port 22 --resource-group whop-video-rg --name whop-video-renderer
az vm open-port --port 80 --resource-group whop-video-rg --name whop-video-renderer
az vm open-port --port 443 --resource-group whop-video-rg --name whop-video-renderer
az vm open-port --port 3000 --resource-group whop-video-rg --name whop-video-renderer

# Get public IP
az vm show --resource-group whop-video-rg --name whop-video-renderer --show-details --query publicIps -o tsv
```

## Step 2: Initial VM Setup

### Connect to VM

```bash
# Replace with your VM's public IP and private key path
ssh -i ~/.ssh/your-private-key.pem azureuser@YOUR_VM_PUBLIC_IP
```

### Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Verify installations
node --version
npm --version
pnpm --version
```

## Step 3: Install Docker

```bash
# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Test Docker installation
sudo docker run hello-world

# Logout and login again to apply group changes
exit
```

## Step 4: Install Additional Dependencies for Video Rendering

```bash
# Reconnect to VM
ssh -i ~/.ssh/your-private-key.pem azureuser@YOUR_VM_PUBLIC_IP

# Install Chromium and fonts for emoji support
sudo apt install -y \
    chromium-browser \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-noto-core \
    fonts-noto-cjk \
    fontconfig \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libxkbcommon0 \
    libxss1 \
    libu2f-udev \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1

# Rebuild font cache for emoji support
sudo fc-cache -f -v

# Verify emoji fonts
fc-list | grep -i emoji
```

## Step 5: Configure Environment

### Create Environment File

```bash
# Create application directory
mkdir -p ~/whop-app
cd ~/whop-app

# Create environment file
cat > worker.env << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mhcoztbbpygibdkdmdej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Azure Storage Configuration
AZURE_STORAGE_ACCOUNT_KEY=your_azure_storage_key
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_CONNECTION_STRING=your_connection_string

# Redis Queue Configuration
REDIS_URL=your_redis_connection_string

# Worker Configuration
WORK_DIR=/tmp
NODE_ENV=production

# Remotion Configuration for Emoji Support
REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium-browser
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Font Configuration for Emoji Rendering
FONTCONFIG_PATH=/etc/fonts
FC_CONFIG_FILE=/etc/fonts/fonts.conf
EOF
```

**Important**: Replace the placeholder values with your actual credentials from your current `worker/worker.env` file.

## Step 6: Setup Firewall (Optional but Recommended)

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

## Step 7: Setup Monitoring and Logging

```bash
# Create log directory
sudo mkdir -p /var/log/whop-worker
sudo chown $USER:$USER /var/log/whop-worker

# Install log rotation
sudo tee /etc/logrotate.d/whop-worker << 'EOF'
/var/log/whop-worker/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 azureuser azureuser
}
EOF
```

## Step 8: Deploy Your Application

### Method 1: Manual Deployment

```bash
# Clone your repository
git clone https://github.com/your-username/whop-app.git
cd whop-app

# Install dependencies
pnpm install

# Build Docker image
docker build -f Dockerfile.worker -t whop-video-worker:latest .

# Run the container
docker run -d \
    --name whop-video-worker \
    --env-file ~/whop-app/worker.env \
    --restart unless-stopped \
    -v /tmp:/tmp \
    -v /var/log/whop-worker:/var/log/whop-worker \
    whop-video-worker:latest
```

### Method 2: Automated Deployment (Recommended)

Update your local `scripts/deploy-to-azure.sh` with the new VM details:

```bash
# Update these variables in your local deploy script
AZURE_VM_IP="YOUR_NEW_VM_PUBLIC_IP"
AZURE_USER="azureuser"
SSH_KEY="path/to/your/private-key.pem"
```

Then run from your local machine:

```bash
# Make script executable
chmod +x scripts/deploy-to-azure.sh

# Deploy to Azure VM
./scripts/deploy-to-azure.sh
```

## Step 9: Verify Deployment

### Check Container Status

```bash
# SSH into VM
ssh -i ~/.ssh/your-private-key.pem azureuser@YOUR_VM_PUBLIC_IP

# Check running containers
docker ps

# View worker logs
docker logs whop-video-worker --tail 50

# Monitor real-time logs
docker logs -f whop-video-worker
```

### Test Video Rendering

```bash
# Check if worker is processing jobs
docker exec whop-video-worker ps aux

# Check system resources
htop
df -h
free -h
```

## Step 10: Setup Auto-restart and Monitoring

### Create Systemd Service (Alternative to Docker restart)

```bash
sudo tee /etc/systemd/system/whop-worker.service << 'EOF'
[Unit]
Description=Whop Video Worker Container
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
ExecStart=/usr/bin/docker start whop-video-worker
ExecStop=/usr/bin/docker stop whop-video-worker
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl enable whop-worker.service
sudo systemctl start whop-worker.service
```

### Setup Basic Monitoring Script

```bash
cat > ~/monitor-worker.sh << 'EOF'
#!/bin/bash

# Check if container is running
if ! docker ps | grep -q whop-video-worker; then
    echo "$(date): Worker container not running, restarting..."
    docker start whop-video-worker
    
    # Send notification (optional - configure with your notification service)
    # curl -X POST "your-webhook-url" -d "Worker restarted on $(hostname)"
fi

# Check system resources
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')

echo "$(date): CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%"

# Log high resource usage
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
    echo "$(date): HIGH CPU USAGE: ${CPU_USAGE}%" >> /var/log/whop-worker/alerts.log
fi

if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "$(date): HIGH MEMORY USAGE: ${MEMORY_USAGE}%" >> /var/log/whop-worker/alerts.log
fi
EOF

chmod +x ~/monitor-worker.sh

# Add to crontab to run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitor-worker.sh >> /var/log/whop-worker/monitor.log 2>&1") | crontab -
```

## Step 11: Security Hardening (Recommended)

```bash
# Disable password authentication (SSH keys only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban for SSH protection
sudo apt install -y fail2ban

# Configure fail2ban
sudo tee /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Set up automatic security updates
sudo apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

## Step 12: Update Your Application Configuration

Update your main application's environment variables:

```env
# In your main app's .env file
AZURE_RENDER_URL=http://YOUR_NEW_VM_PUBLIC_IP:3000
AZURE_API_KEY=your_secure_api_key
```

## Troubleshooting

### Common Issues and Solutions

1. **Container fails to start**
   ```bash
   # Check logs
   docker logs whop-video-worker
   
   # Check environment file
   cat ~/whop-app/worker.env
   ```

2. **Emoji rendering issues**
   ```bash
   # Verify font installation
   fc-list | grep -i emoji
   
   # Test chromium
   chromium-browser --version
   ```

3. **High memory usage**
   ```bash
   # Monitor container resources
   docker stats whop-video-worker
   
   # Reduce concurrency in worker
   # Edit worker.cjs: concurrency: 1
   ```

4. **Network connectivity issues**
   ```bash
   # Test connections from container
   docker exec whop-video-worker curl -I https://supabase.com
   docker exec whop-video-worker ping 8.8.8.8
   ```

## Performance Optimization

### For High-Volume Rendering

1. **Scale up VM size**
   - Standard_D8s_v3 (8 vCPUs, 32 GB RAM)
   - Standard_D16s_v3 (16 vCPUs, 64 GB RAM)

2. **Use Premium SSD storage**
   - Better I/O performance for video files

3. **Optimize Docker container**
   ```bash
   # Increase shared memory
   docker run -d \
       --name whop-video-worker \
       --shm-size=2g \
       --env-file ~/whop-app/worker.env \
       --restart unless-stopped \
       whop-video-worker:latest
   ```

4. **Enable multiple workers**
   ```bash
   # Run multiple worker containers
   for i in {1..3}; do
       docker run -d \
           --name whop-video-worker-$i \
           --env-file ~/whop-app/worker.env \
           --restart unless-stopped \
           whop-video-worker:latest
   done
   ```

## Cost Optimization

1. **Use Azure Reserved Instances** for long-term deployments (up to 72% savings)
2. **Schedule VM shutdown** during off-peak hours if applicable
3. **Monitor usage** with Azure Cost Management
4. **Use spot instances** for non-critical workloads (up to 90% savings)

## Next Steps

1. **Set up CI/CD pipeline** for automated deployments
2. **Configure monitoring** with Azure Monitor or third-party tools
3. **Set up backup strategy** for important data
4. **Implement auto-scaling** based on queue length
5. **Set up disaster recovery** plan

## Support and Maintenance

- **Regular updates**: Update system packages monthly
- **Monitor logs**: Check worker logs daily
- **Performance monitoring**: Use Azure Monitor or similar tools
- **Backup**: Regular backups of configuration and data
- **Security updates**: Enable automatic security updates

---

Your Azure VM is now ready for Remotion video rendering! The worker will automatically process jobs from your Redis queue and upload completed videos to Azure Blob Storage.

