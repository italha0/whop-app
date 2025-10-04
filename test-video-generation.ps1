# Test Video Generation Script
# Run this to test the video generation functionality

Write-Host "🧪 Testing Video Generation..." -ForegroundColor Green

# Test data
$testData = @{
    conversation = @{
        contactName = "Test Contact"
        theme = "imessage"
        alwaysShowKeyboard = $false
        messages = @(
            @{ text = "Hello! How are you?"; sent = $false }
            @{ text = "I'm doing great! How about you?"; sent = $true }
            @{ text = "Pretty good, thanks! 😊"; sent = $false }
            @{ text = "That's awesome! 🎉"; sent = $true }
        )
    }
    userId = "test_user_$(Get-Date -Format 'yyyyMMddHHmmss')"
    uploadToAppwrite = $true
} | ConvertTo-Json -Depth 10

Write-Host "📡 Sending test request..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-video" -Method Post -Body $testData -ContentType "application/json"
    
    Write-Host "✅ Test successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Cyan
    
    if ($response.status -eq "completed") {
        Write-Host "🎬 Video generated successfully!" -ForegroundColor Green
        Write-Host "Video URL: $($response.videoUrl)" -ForegroundColor Cyan
    } elseif ($response.jobId) {
        Write-Host "⏳ Video generation started (async mode)" -ForegroundColor Yellow
        Write-Host "Job ID: $($response.jobId)" -ForegroundColor Cyan
        Write-Host "Estimated Duration: $($response.estimatedDuration) seconds" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "🏁 Test completed!" -ForegroundColor Green
