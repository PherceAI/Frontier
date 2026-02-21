$ErrorActionPreference = 'Stop'

Write-Host "CLEAN START..."

docker compose down -v --remove-orphans
docker compose up -d postgres

Write-Host "Waiting for DB..."
Start-Sleep -Seconds 8

Set-Location "frontend"
if (!(Test-Path "node_modules")) { npm install }

$env:DATABASE_URL = "postgresql://frontier:frontier_dev@localhost:5432/frontier_db"

npx prisma db push --accept-data-loss

cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < ..\database\init.sql"
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < ..\database\seed.sql"

docker exec -i frontier-postgres psql -U frontier -d frontier_db -c "SELECT name, type FROM operational_areas;"

Write-Host "Starting Frontend (Full-Stack)..."
Start-Job -Name "Frontend" -ScriptBlock {
    Set-Location c:\Users\WinUserX\Pictures\Frontier\frontend
    npm run dev
}

Set-Location ".."
Write-Host "Starting Cloudflare Tunnel..."
Start-Job -Name "Tunnel" -ScriptBlock {
    cloudflared tunnel run
}

Write-Host "All services started as background jobs! Use 'Receive-Job -Name <JobName>' to view logs."
