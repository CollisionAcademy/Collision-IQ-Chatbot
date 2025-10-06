# ==============================
# 🚀 Collision-IQ API Deployment Script
# ==============================

Write-Host "🔧 Checking Environment..." -ForegroundColor Cyan

# --- Variables ---
$projectRoot = "C:\Users\Colli\Desktop\Collision-IQ-Chatbot"
$apiPath = "$projectRoot\api"
$gcloudPath = "C:\Users\Colli\Desktop\google-cloud-sdk\bin\gcloud.cmd"
$pythonPath = "C:\Users\Colli\AppData\Local\Programs\Python\Python312\python.exe"

# --- Verify Paths ---
if (-Not (Test-Path $apiPath)) {
    Write-Host "❌ API folder not found at: $apiPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $gcloudPath)) {
    Write-Host "❌ gcloud not found at: $gcloudPath" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $pythonPath)) {
    Write-Host ⚠️ Python not found at expected location: $pythonPath" -ForegroundColor Yellow
} else {
    Write-Host "✅ Python found at: $pythonPath"
}

# --- Verify .env File ---
$envPath = "$apiPath\.env"
if (-Not (Test-Path $envPath)) {
    Write-Host "❌ .env file missing in $apiPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .env file found at $envPath"

# --- Check API Key ---
$envContent = Get-Content $envPath | Out-String
if ($envContent -match "GEMINI_API_KEY=(.+)") {
    $key = $Matches[1]
    $hiddenKey = $key.Substring(0,5) + "..." + $key.Substring($key.Length - 4)
    Write-Host "✅ GEMINI_API_KEY loaded: $hiddenKey"
} else {
    Write-Host "❌ GEMINI_API_KEY missing from .env" -ForegroundColor Red
    exit 1
}

# --- Verify gcloud Authentication ---
Write-Host "🔐 Checking gcloud login..."
& $gcloudPath auth list | Out-Host

# --- Confirm Config ---
Write-Host "`n📋 gcloud configuration:" -ForegroundColor Cyan
& $gcloudPath config list

# --- Deploy API to Cloud Run ---
Write-Host "`n🚀 Deploying Collision-IQ API to Cloud Run..." -ForegroundColor Green
& $gcloudPath run deploy collision-iq-api `
    --source $apiPath `
    --region us-central1 `
    --allow-unauthenticated `
    --quiet

# --- Fetch Deployment URL ---
Write-Host "`n🌐 Fetching Service URL..." -ForegroundColor Cyan
$serviceUrl = & $gcloudPath run services describe collision-iq-api `
    --region us-central1 `
    --format="value(status.url)"

if ($serviceUrl) {
    Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🔗 API Live at: $serviceUrl" -ForegroundColor Yellow
} else {
    Write-Host "⚠️ Could not fetch service URL — check Cloud Console manually." -ForegroundColor Yellow
}
