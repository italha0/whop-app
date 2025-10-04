#!/bin/bash

# Azure VM Setup Script for Whop Video Worker
# This script sets up a new Azure VM for Remotion video rendering

set -e

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

# Configuration
RESOURCE_GROUP="whop-video-rg"
VM_NAME="whop-video-renderer"
LOCATION="eastus"
VM_SIZE="Standard_D4s_v3"
USERNAME="azureuser"
SSH_KEY_NAME="whop-azure-key"

echo "🚀 Setting up Azure VM for Whop Video Rendering"
echo "================================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install it first:"
    echo "  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure (if not already logged in)
log_info "Checking Azure login status..."
if ! az account show &> /dev/null; then
    log_info "Please login to Azure..."
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
log_success "Using subscription: $SUBSCRIPTION"

# Create resource group
log_info "Creating resource group: $RESOURCE_GROUP"
if az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none; then
    log_success "Resource group created successfully"
else
    log_warning "Resource group might already exist"
fi

# Generate SSH key pair if it doesn't exist
SSH_KEY_PATH="$HOME/.ssh/$SSH_KEY_NAME"
if [ ! -f "$SSH_KEY_PATH" ]; then
    log_info "Generating SSH key pair..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "whop-azure-vm"
    log_success "SSH key pair generated: $SSH_KEY_PATH"
else
    log_info "Using existing SSH key: $SSH_KEY_PATH"
fi

# Create VM
log_info "Creating Azure VM: $VM_NAME"
log_info "This may take a few minutes..."

VM_CREATE_OUTPUT=$(az vm create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VM_NAME" \
    --image Ubuntu2204 \
    --size "$VM_SIZE" \
    --admin-username "$USERNAME" \
    --ssh-key-values "$SSH_KEY_PATH.pub" \
    --public-ip-sku Standard \
    --storage-sku Premium_LRS \
    --output json)

if [ $? -eq 0 ]; then
    log_success "VM created successfully"
    
    # Extract public IP
    PUBLIC_IP=$(echo "$VM_CREATE_OUTPUT" | jq -r '.publicIpAddress')
    log_success "VM Public IP: $PUBLIC_IP"
else
    log_error "Failed to create VM"
    exit 1
fi

# Open necessary ports
log_info "Configuring network security rules..."

# SSH (22)
az vm open-port --port 22 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1000 --output none
log_success "Opened SSH port (22)"

# HTTP (80)
az vm open-port --port 80 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1010 --output none
log_success "Opened HTTP port (80)"

# HTTPS (443)
az vm open-port --port 443 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1020 --output none
log_success "Opened HTTPS port (443)"

# Custom application port (3000)
az vm open-port --port 3000 --resource-group "$RESOURCE_GROUP" --name "$VM_NAME" --priority 1030 --output none
log_success "Opened application port (3000)"

# Wait for VM to be fully ready
log_info "Waiting for VM to be fully ready..."
sleep 30

# Test SSH connection
log_info "Testing SSH connection..."
SSH_TEST_ATTEMPTS=0
MAX_SSH_ATTEMPTS=10

while [ $SSH_TEST_ATTEMPTS -lt $MAX_SSH_ATTEMPTS ]; do
    if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$USERNAME@$PUBLIC_IP" echo "SSH connection successful" > /dev/null 2>&1; then
        log_success "SSH connection established"
        break
    else
        SSH_TEST_ATTEMPTS=$((SSH_TEST_ATTEMPTS + 1))
        log_info "SSH attempt $SSH_TEST_ATTEMPTS/$MAX_SSH_ATTEMPTS failed, retrying in 10 seconds..."
        sleep 10
    fi
done

if [ $SSH_TEST_ATTEMPTS -eq $MAX_SSH_ATTEMPTS ]; then
    log_error "Failed to establish SSH connection after $MAX_SSH_ATTEMPTS attempts"
    exit 1
fi

# Setup VM with required software
log_info "Setting up VM with required software..."

ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$USERNAME@$PUBLIC_IP" << 'EOF'
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
    
    # Update system packages
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    log_success "System packages updated"
    
    # Install essential packages
    log_info "Installing essential packages..."
    sudo apt install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        htop \
        vim \
        tmux
    log_success "Essential packages installed"
    
    # Install Node.js 20
    log_info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install pnpm
    sudo npm install -g pnpm
    
    # Verify Node.js installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    PNPM_VERSION=$(pnpm --version)
    log_success "Node.js installed: $NODE_VERSION"
    log_success "npm installed: $NPM_VERSION"
    log_success "pnpm installed: $PNPM_VERSION"
    
    # Install Docker
    log_info "Installing Docker..."
    
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
    
    log_success "Docker installed and configured"
    
    # Install video rendering dependencies
    log_info "Installing video rendering dependencies..."
    sudo apt install -y \
        chromium-browser \
        fonts-liberation \
        fonts-noto-color-emoji \
        fonts-noto-core \
        fonts-noto-cjk \
        fonts-noto-sans \
        fonts-noto-serif \
        fonts-dejavu-core \
        fonts-freefont-ttf \
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
    log_success "Video rendering dependencies installed"
    
    # Verify emoji fonts
    log_info "Verifying emoji font installation..."
    EMOJI_FONTS=$(fc-list | grep -i emoji | wc -l)
    if [ "$EMOJI_FONTS" -gt 0 ]; then
        log_success "Emoji fonts installed: $EMOJI_FONTS font(s) found"
        fc-list | grep -i emoji | head -3
    else
        log_warning "No emoji fonts found"
    fi
    
    # Configure UFW firewall
    log_info "Configuring firewall..."
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 3000/tcp
    echo "y" | sudo ufw enable
    log_success "Firewall configured"
    
    # Create application directories
    log_info "Creating application directories..."
    mkdir -p ~/whop-app
    sudo mkdir -p /var/log/whop-worker
    sudo chown $USER:$USER /var/log/whop-worker
    log_success "Application directories created"
    
    # Install log rotation
    log_info "Setting up log rotation..."
    sudo tee /etc/logrotate.d/whop-worker << 'LOGROTATE_EOF'
/var/log/whop-worker/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 azureuser azureuser
}
LOGROTATE_EOF
    log_success "Log rotation configured"
    
    # Install fail2ban for SSH protection
    log_info "Installing fail2ban for security..."
    sudo apt install -y fail2ban
    
    sudo tee /etc/fail2ban/jail.local << 'FAIL2BAN_EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
FAIL2BAN_EOF
    
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    log_success "fail2ban installed and configured"
    
    # Set up automatic security updates
    log_info "Configuring automatic security updates..."
    sudo apt install -y unattended-upgrades
    echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
    log_success "Automatic security updates configured"
    
    # Create monitoring script
    log_info "Creating monitoring script..."
    cat > ~/monitor-worker.sh << 'MONITOR_EOF'
#!/bin/bash

# Check if container is running
if ! docker ps | grep -q whop-video-worker; then
    echo "$(date): Worker container not running, attempting restart..."
    docker start whop-video-worker 2>/dev/null || echo "$(date): Failed to start container"
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
MONITOR_EOF
    
    chmod +x ~/monitor-worker.sh
    
    # Add monitoring to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitor-worker.sh >> /var/log/whop-worker/monitor.log 2>&1") | crontab -
    log_success "Monitoring script created and scheduled"
    
    # Final system check
    log_info "Performing final system check..."
    echo "System Information:"
    echo "  OS: $(lsb_release -d | cut -f2)"
    echo "  Kernel: $(uname -r)"
    echo "  Memory: $(free -h | grep Mem | awk '{print $2}')"
    echo "  Disk: $(df -h / | tail -1 | awk '{print $2}')"
    echo "  Docker: $(docker --version)"
    echo "  Node.js: $(node --version)"
    echo "  Chromium: $(chromium-browser --version 2>/dev/null | head -1)"
    
    log_success "VM setup completed successfully!"
EOF

if [ $? -eq 0 ]; then
    log_success "VM setup completed successfully!"
else
    log_error "VM setup failed"
    exit 1
fi

# Create environment template
log_info "Creating environment template..."
cat > "azure-vm-config.env" << ENV_EOF
# Azure VM Configuration
AZURE_VM_IP=$PUBLIC_IP
AZURE_USER=$USERNAME
SSH_KEY_PATH=$SSH_KEY_PATH

# Update your deployment script with these values:
# AZURE_VM_IP="$PUBLIC_IP"
# SSH_KEY="$SSH_KEY_PATH"
ENV_EOF

# Update deployment script
if [ -f "scripts/deploy-to-new-azure.sh" ]; then
    log_info "Updating deployment script..."
    sed -i.bak "s/YOUR_NEW_VM_PUBLIC_IP/$PUBLIC_IP/g" scripts/deploy-to-new-azure.sh
    sed -i.bak "s|~/.ssh/your-azure-key.pem|$SSH_KEY_PATH|g" scripts/deploy-to-new-azure.sh
    log_success "Deployment script updated"
fi

# Summary
echo ""
echo "🎉 Azure VM Setup Complete!"
echo "=========================="
echo ""
log_success "VM Details:"
echo "  🖥️  Name: $VM_NAME"
echo "  🌍 Location: $LOCATION"
echo "  📍 Public IP: $PUBLIC_IP"
echo "  👤 Username: $USERNAME"
echo "  🔑 SSH Key: $SSH_KEY_PATH"
echo ""
log_success "Next Steps:"
echo "  1. Update your worker/worker.env file with your credentials"
echo "  2. Test SSH connection: ssh -i \"$SSH_KEY_PATH\" $USERNAME@$PUBLIC_IP"
echo "  3. Deploy your application: ./scripts/deploy-to-new-azure.sh"
echo ""
log_success "Configuration saved to: azure-vm-config.env"
echo ""
log_warning "Important Security Notes:"
echo "  - Keep your SSH private key secure"
echo "  - Update your environment variables with real credentials"
echo "  - Consider using Azure Key Vault for sensitive data"
echo ""
log_info "For troubleshooting, check the Azure VM Setup Guide: AZURE_VM_SETUP_GUIDE.md"

