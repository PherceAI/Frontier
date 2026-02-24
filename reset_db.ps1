$ErrorActionPreference = 'Stop'
Write-Host "Restarting Database..."
docker compose down
docker compose up -d postgres
Write-Host "Waiting for postgres to start..."
Start-Sleep -Seconds 8

Set-Location "backend-nest"
npx prisma db push
Set-Location ".."

Write-Host "Executing init.sql..."
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < database\init.sql"

Write-Host "Executing seed.sql..."
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < database\seed.sql"

Write-Host "Verifying areas..."
docker exec -i frontier-postgres psql -U frontier -d frontier_db -c "SELECT name, type FROM operational_areas;"

Write-Host "Done!"
