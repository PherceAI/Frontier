#!/bin/bash
set -e

echo "🚀 Laravel Startup Script"

# Create storage directories
mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chmod -R 777 storage bootstrap/cache 2>/dev/null || true

# Check if vendor exists
if [ ! -f vendor/autoload.php ]; then
  echo "📦 Installing dependencies..."
  composer install --no-dev --optimize-autoloader --no-interaction
  echo "✅ Dependencies installed"
fi

echo "🚀 Starting Laravel server on http://0.0.0.0:8000"
php artisan serve --host=0.0.0.0 --port=8000
