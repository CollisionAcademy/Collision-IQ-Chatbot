Write-Host "🚀 Starting Collision-IQ API Deployment..." -ForegroundColor Cyan

# --- Check Python Path ---
$pythonPath = "C:\Users\Colli\AppData\Local\Programs\Python\Python312\python.exe"
if (-Not (Test-Path $pythonPath)) {
    Write-Host "❌ Python not found at $pythonPath" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Python found at: $pythonPath" -ForegroundColor Green
}

# --- Check for .env file ---
$envPath = "C:\Users\Colli\Desktop\Collision-IQ-Chatbot\api\.env"
if (-Not (Test-Path $envPath)) {
    Write-Host "❌ Missing .env file at $envPath" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Found .env file" -ForegroundColor Green
}

# --- Load .env values ---
$envVars = Get-Content $envPath | Where-Object { $_ -match "=" } | ForEach-Object {
    $parts = $_ -split "=", 2
    [PSCustomObject]@{ Key = $parts[0].Trim(); Value = $parts[1].Trim() }
}

# --- Set Cloud Run env vars ---
foreach ($var in $envVars) {
    $key = $var.Key
    $value = $var.Value
    if ($key -and $value) {
        Write-Host "🌍 Setting $key" -ForegroundColor Yellow
        gcloud run services update collision-iq-api `
          --region us-central1 `
          --set-env-vars "$key=$value" `
          --quiet
    }
}

# --- Deploy Service ---
Write-Host "🚢 Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy collision-iq-api `
  --source "./api" `
  --region us-central1 `
  --allow-unauthenticated `
  --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    $url = gcloud run services describe collision-iq-api --region us-central1 --format="value(status.url)"
    Write-Host "🌐 API URL: $url" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
