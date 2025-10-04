# PowerShell script to upload files to Azure VM
# Run this from your local machine

$VM_IP = "172.18.0.5"
$SSH_KEY = "C:\Users\aman7\Downloads\scriptTovideo_key.pem"
$USERNAME = "azureuser"
$REMOTE_DIR = "/home/azureuser/video-renderer"

Write-Host "🚀 Uploading files to Azure VM..." -ForegroundColor Green

# Create remote directory
Write-Host "📁 Creating remote directory..." -ForegroundColor Yellow
ssh -i $SSH_KEY $USERNAME@$VM_IP "mkdir -p $REMOTE_DIR"

# Upload package.json
Write-Host "📦 Uploading package.json..." -ForegroundColor Yellow
scp -i $SSH_KEY "azure-vm\package.json" "${USERNAME}@${VM_IP}:${REMOTE_DIR}/"

# Upload server.js
Write-Host "📦 Uploading server.js..." -ForegroundColor Yellow
scp -i $SSH_KEY "azure-vm\server.js" "${USERNAME}@${VM_IP}:${REMOTE_DIR}/"

# Upload Dockerfile
Write-Host "📦 Uploading Dockerfile..." -ForegroundColor Yellow
scp -i $SSH_KEY "azure-vm\Dockerfile" "${USERNAME}@${VM_IP}:${REMOTE_DIR}/"

# Upload deploy script
Write-Host "📦 Uploading deploy.sh..." -ForegroundColor Yellow
scp -i $SSH_KEY "azure-vm\deploy.sh" "${USERNAME}@${VM_IP}:${REMOTE_DIR}/"

# Upload Remotion directory
Write-Host "📦 Uploading Remotion directory..." -ForegroundColor Yellow
scp -i $SSH_KEY -r "azure-vm\remotion" "${USERNAME}@${VM_IP}:${REMOTE_DIR}/"

Write-Host "✅ Upload complete!" -ForegroundColor Green
Write-Host "🔧 Now run the deployment script on the VM:" -ForegroundColor Cyan
Write-Host "ssh -i `"$SSH_KEY`" $USERNAME@$VM_IP" -ForegroundColor White
Write-Host "cd $REMOTE_DIR" -ForegroundColor White
Write-Host "chmod +x deploy.sh" -ForegroundColor White
Write-Host "./deploy.sh" -ForegroundColor White
