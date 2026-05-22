#!/usr/bin/env bash
set -euo pipefail

echo "==> Gardina AWS stack deploy"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker first."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose is not installed."
  exit 1
fi

mkdir -p certbot/conf certbot/www

# Ensure required env files exist on EC2.
if [ ! -f gardina-backend/.env.production ]; then
  echo "Missing gardina-backend/.env.production"
  exit 1
fi

if [ ! -f gardina-bot/.env ] && [ -f gardina-bot/.env.example ]; then
  echo "gardina-bot/.env is missing. Creating from .env.example (please replace values)."
  cp gardina-bot/.env.example gardina-bot/.env
fi

echo "==> Pull/build images"
$COMPOSE build --pull

echo "==> Restart services"
$COMPOSE up -d --remove-orphans

echo "==> Running DB migrations"
$COMPOSE exec -T backend node scripts/run-saas-features-migration.js || \
  echo "Migration skipped (container may still be starting — run manually if needed)"

echo "==> Running status"
$COMPOSE ps

echo "==> Done"
