# Stop all Node processes for legacymark
Write-Host "Stopping dev server..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*legacymark*"} | Stop-Process -Force
Start-Sleep -Seconds 2

# Clean .next cache
Write-Host "Cleaning .next cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Regenerate Prisma Client
Write-Host "Regenerating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client regenerated successfully!" -ForegroundColor Green
    
    # Restart dev server
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "✗ Failed to regenerate Prisma Client" -ForegroundColor Red
    exit 1
}
