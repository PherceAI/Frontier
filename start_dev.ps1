$ErrorActionPreference = 'Stop'

Write-Host "CLEAN START..."

# Remove docker compose down completely so it doesn't interrupt/delete the active DB
docker compose up -d postgres

Write-Host "Waiting for DB..."
Start-Sleep -Seconds 8

Set-Location "frontend"
if (!(Test-Path "node_modules")) { npm install }

$env:DATABASE_URL = "postgresql://frontier:frontier_dev@localhost:5432/frontier_db"

npx prisma db push

cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < ..\database\init.sql"
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < ..\database\seed.sql"

docker exec -i frontier-postgres psql -U frontier -d frontier_db -c "SELECT name, type FROM operational_areas;"

Write-Host "Starting Frontend (Full-Stack)..."
Start-Process "cmd.exe" -ArgumentList "/k title Frontend Backend && npm run dev" -WorkingDirectory "c:\Users\WinUserX\Pictures\Frontier\frontend"

Set-Location ".."
Write-Host "Starting Cloudflare Tunnel..."
Start-Process "cmd.exe" -ArgumentList "/k title Cloudflare Tunnel && cloudflared tunnel run"

Write-Host "All services started! Two new terminal windows have been opened for the Frontend and Tunnel."
