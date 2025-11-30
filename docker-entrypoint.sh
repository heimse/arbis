#!/bin/sh
set -e

echo "Running database migrations..."

# Запускаем миграции Prisma (если DATABASE_URL установлен)
if [ -n "$DATABASE_URL" ] && [ -f "prisma/schema.prisma" ]; then
  echo "Applying Prisma migrations..."
  # Используем migrate deploy для production (не создает новые миграции)
  npx prisma migrate deploy || echo "Note: Migrations may have already been applied or database is not ready yet"
else
  echo "Skipping migrations: DATABASE_URL not set or schema not found"
fi

echo "Starting application..."

# Запускаем приложение
exec "$@"

