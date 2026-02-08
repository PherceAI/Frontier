@echo off
REM ===========================================
REM Frontier Laravel Backend - Setup Script
REM ===========================================
REM This script creates a Laravel project using Docker
REM No PHP or Composer installation required on your machine!

echo.
echo ========================================
echo   FRONTIER - Laravel Backend Setup
echo   (Todo corre en Docker)
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

echo [1/4] Creando proyecto Laravel con Docker...
docker run --rm -v "%cd%:/app" -w /app composer:latest composer create-project laravel/laravel . --prefer-dist --no-interaction

if errorlevel 1 (
    echo [ERROR] Fallo la creacion del proyecto Laravel
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando dependencias adicionales...
docker run --rm -v "%cd%:/app" -w /app composer:latest composer require laravel/sanctum tymon/jwt-auth

echo.
echo [3/4] Generando APP_KEY...
docker run --rm -v "%cd%:/app" -w /app php:8.3-cli-alpine php artisan key:generate --show > temp_key.txt
set /p APP_KEY=<temp_key.txt
del temp_key.txt

echo.
echo [4/4] Configurando .env...
echo APP_KEY=%APP_KEY% >> .env

echo.
echo ========================================
echo   SETUP COMPLETADO!
echo ========================================
echo.
echo Para iniciar Laravel:
echo   docker compose -f docker-compose.dev.yml up --build
echo.
echo Laravel estara disponible en:
echo   http://localhost:8000
echo.
echo pgAdmin estara en:
echo   http://localhost:5050
echo.
pause
