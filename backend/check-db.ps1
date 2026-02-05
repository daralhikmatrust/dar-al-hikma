# PostgreSQL Database Checker Script
Write-Host "🔍 Checking PostgreSQL setup..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Read DATABASE_URL from .env
    $envContent = Get-Content .env | Where-Object { $_ -match "DATABASE_URL" }
    if ($envContent) {
        Write-Host "✅ DATABASE_URL found in .env" -ForegroundColor Green
        $dbUrl = ($envContent -split "=")[1]
        Write-Host "   Database URL: $dbUrl" -ForegroundColor Gray
    } else {
        Write-Host "❌ DATABASE_URL not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Please create a .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking PostgreSQL services..." -ForegroundColor Cyan

# Check for PostgreSQL services
$pgServices = Get-Service | Where-Object { $_.Name -like "*postgresql*" -or $_.DisplayName -like "*PostgreSQL*" }

if ($pgServices) {
    Write-Host "✅ Found PostgreSQL service(s):" -ForegroundColor Green
    foreach ($service in $pgServices) {
        $status = if ($service.Status -eq "Running") { "✅ Running" } else { "❌ Stopped" }
        Write-Host "   $($service.DisplayName): $status" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
        
        if ($service.Status -ne "Running") {
            Write-Host "   💡 To start: net start $($service.Name)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  No PostgreSQL service found" -ForegroundColor Yellow
    Write-Host "   PostgreSQL may not be installed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 To install PostgreSQL:" -ForegroundColor Cyan
    Write-Host "   1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "   2. Or use a cloud service like Supabase (free): https://supabase.com" -ForegroundColor White
}

Write-Host ""
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan

# Try to connect (if psql is available)
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✅ psql command found" -ForegroundColor Green
    Write-Host "   You can test connection with: psql -U postgres" -ForegroundColor Gray
} else {
    Write-Host "⚠️  psql command not found in PATH" -ForegroundColor Yellow
    Write-Host "   PostgreSQL may not be installed or not in PATH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📖 For more help, see: backend/SETUP.md" -ForegroundColor Cyan

