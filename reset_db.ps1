$ErrorActionPreference = 'Stop'
Write-Host "Resetting Database..."
docker compose down -v --remove-orphans
docker compose up -d postgres
Write-Host "Waiting for postgres to start..."
Start-Sleep -Seconds 8

cd backend-nest
npx prisma db push --accept-data-loss
cd ..

Write-Host "Executing init.sql..."
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < database\init.sql"

Write-Host "Executing seed.sql..."
cmd.exe /c "docker exec -i frontier-postgres psql -U frontier -d frontier_db < database\seed.sql"

Write-Host "Verifying areas..."
docker exec -i frontier-postgres psql -U frontier -d frontier_db -c "SELECT name, type FROM operational_areas;"

Write-Host "Done!"
