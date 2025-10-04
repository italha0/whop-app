#!/bin/bash
# Azure VM Worker Health Check Script
# Run this on your Azure VM to verify worker setup
# Usage: bash worker-health-check.sh

echo "🏥 Azure VM Worker Health Check"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Node.js installed
echo "📦 Check 1: Node.js Installation"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "   Install: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi
echo ""

# Check 2: Worker directory exists
echo "📁 Check 2: Worker Directory"
WORKER_DIR="/path/to/whop-app/worker"  # Update this path
if [ -d "$WORKER_DIR" ]; then
    echo -e "${GREEN}✅ Worker directory exists${NC}"
    cd "$WORKER_DIR"
else
    echo -e "${YELLOW}⚠️  Update WORKER_DIR variable in this script${NC}"
    echo "   Current: $WORKER_DIR"
fi
echo ""

# Check 3: Dependencies installed
echo "📚 Check 3: Node Modules"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules found${NC}"
else
    echo -e "${RED}❌ node_modules not found${NC}"
    echo "   Run: npm install"
fi
echo ""

# Check 4: worker.env exists
echo "⚙️  Check 4: Environment Configuration"
if [ -f "worker.env" ]; then
    echo -e "${GREEN}✅ worker.env found${NC}"
    
    # Check critical env vars
    source worker.env 2>/dev/null
    
    echo "   Checking variables..."
    [ ! -z "$APPWRITE_ENDPOINT" ] && echo "   ✅ APPWRITE_ENDPOINT" || echo -e "   ${RED}❌ APPWRITE_ENDPOINT missing${NC}"
    [ ! -z "$APPWRITE_PROJECT_ID" ] && echo "   ✅ APPWRITE_PROJECT_ID" || echo -e "   ${RED}❌ APPWRITE_PROJECT_ID missing${NC}"
    [ ! -z "$APPWRITE_API_KEY" ] && echo "   ✅ APPWRITE_API_KEY" || echo -e "   ${RED}❌ APPWRITE_API_KEY missing${NC}"
    [ ! -z "$APPWRITE_DATABASE_ID" ] && echo "   ✅ APPWRITE_DATABASE_ID" || echo -e "   ${RED}❌ APPWRITE_DATABASE_ID missing${NC}"
    [ ! -z "$APPWRITE_VIDEO_JOBS_COLLECTION_ID" ] && echo "   ✅ APPWRITE_VIDEO_JOBS_COLLECTION_ID" || echo -e "   ${YELLOW}⚠️  APPWRITE_VIDEO_JOBS_COLLECTION_ID missing${NC}"
    [ ! -z "$AZURE_STORAGE_CONNECTION_STRING" ] && echo "   ✅ AZURE_STORAGE_CONNECTION_STRING" || echo -e "   ${RED}❌ AZURE_STORAGE_CONNECTION_STRING missing${NC}"
    [ ! -z "$AZURE_BLOB_CONTAINER" ] && echo "   ✅ AZURE_BLOB_CONTAINER" || echo -e "   ${YELLOW}⚠️  AZURE_BLOB_CONTAINER missing (default: videos)${NC}"
else
    echo -e "${RED}❌ worker.env not found${NC}"
    echo "   Create from template or copy from local machine"
fi
echo ""

# Check 5: Chromium installation
echo "🌐 Check 5: Chromium Browser"
if command -v chromium &> /dev/null; then
    echo -e "${GREEN}✅ chromium found at $(which chromium)${NC}"
elif command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}✅ chromium-browser found at $(which chromium-browser)${NC}"
else
    echo -e "${RED}❌ Chromium not found${NC}"
    echo "   Install: sudo apt-get install -y chromium-browser"
fi
echo ""

# Check 6: Remotion dependencies
echo "🎬 Check 6: Remotion Dependencies"
MISSING_DEPS=0
for pkg in libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2; do
    if dpkg -l | grep -q "^ii  $pkg"; then
        echo "   ✅ $pkg"
    else
        echo -e "   ${RED}❌ $pkg missing${NC}"
        MISSING_DEPS=1
    fi
done

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo "   Install missing: sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2"
fi
echo ""

# Check 7: Systemd service
echo "🔧 Check 7: Systemd Service"
if [ -f "/etc/systemd/system/video-worker.service" ]; then
    echo -e "${GREEN}✅ Service file exists${NC}"
    
    # Check if service is enabled
    if systemctl is-enabled video-worker &> /dev/null; then
        echo "   ✅ Service enabled"
    else
        echo -e "   ${YELLOW}⚠️  Service not enabled${NC}"
        echo "      Run: sudo systemctl enable video-worker"
    fi
    
    # Check if service is running
    if systemctl is-active video-worker &> /dev/null; then
        echo -e "   ${GREEN}✅ Service running${NC}"
    else
        echo -e "   ${RED}❌ Service not running${NC}"
        echo "      Run: sudo systemctl start video-worker"
    fi
else
    echo -e "${RED}❌ Service file not found${NC}"
    echo "   Create: sudo nano /etc/systemd/system/video-worker.service"
    echo "   See SETUP_VIDEO_GENERATION.md for template"
fi
echo ""

# Check 8: Recent logs
echo "📋 Check 8: Recent Worker Logs"
if systemctl is-active video-worker &> /dev/null; then
    echo "Last 5 log entries:"
    journalctl -u video-worker -n 5 --no-pager | tail -n 5
else
    echo -e "${YELLOW}⚠️  Service not running, no logs available${NC}"
fi
echo ""

# Check 9: Disk space
echo "💾 Check 9: Disk Space"
DISK_USAGE=$(df -h /tmp | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✅ Sufficient disk space (${DISK_USAGE}% used)${NC}"
else
    echo -e "${YELLOW}⚠️  Low disk space (${DISK_USAGE}% used)${NC}"
    echo "   Clean up: rm -rf /tmp/video_*"
fi
echo ""

# Summary
echo "================================"
echo "📊 Health Check Summary"
echo "================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Fix any ❌ red items above"
echo "2. Address ⚠️  yellow warnings if needed"
echo "3. Start/restart worker:"
echo "   sudo systemctl restart video-worker"
echo "4. Monitor logs:"
echo "   sudo journalctl -u video-worker -f"
echo "5. Test from frontend:"
echo "   npm run test:pipeline"
echo ""
echo "For detailed setup instructions, see SETUP_VIDEO_GENERATION.md"
echo ""
