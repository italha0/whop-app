# Azure VM Deployment Script
# Run this script to deploy your video renderer to Azure VM

$VM_IP = "172.18.0.5"
$SSH_KEY = "C:\Users\aman7\Downloads\scriptTovideo_key.pem"
$USERNAME = "azureuser"

Write-Host "🚀 Deploying to Azure VM at $VM_IP..." -ForegroundColor Green

# Step 1: Upload files
Write-Host "📤 Step 1: Uploading files..." -ForegroundColor Yellow
& ".\upload-to-azure.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy on VM
Write-Host "🔧 Step 2: Deploying on VM..." -ForegroundColor Yellow
ssh -i $SSH_KEY $USERNAME@$VM_IP "cd /home/azureuser/video-renderer && chmod +x deploy.sh && ./deploy.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Test the service
Write-Host "🧪 Step 3: Testing the service..." -ForegroundColor Yellow
$testResponse = Invoke-RestMethod -Uri "http://$VM_IP`:3001/health" -Method Get
Write-Host "✅ Service is healthy: $($testResponse.status)" -ForegroundColor Green

# Step 4: Update environment variables
Write-Host "⚙️ Step 4: Update your .env.local file with:" -ForegroundColor Cyan
Write-Host "AZURE_VM_ENDPOINT=http://$VM_IP`:3001/api/render" -ForegroundColor White
Write-Host "AZURE_API_KEY=your-azure-api-key" -ForegroundColor White
Write-Host "AZURE_WEBHOOK_SECRET=your-webhook-secret" -ForegroundColor White

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your video renderer is running at: http://$VM_IP`:3001" -ForegroundColor Cyan
Write-Host "🔍 Check logs with: ssh -i `"$SSH_KEY`" $USERNAME@$VM_IP 'sudo journalctl -u video-renderer -f'" -ForegroundColor White
