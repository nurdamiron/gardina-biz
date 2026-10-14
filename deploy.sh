#!/usr/bin/env bash
# Deploy Gardina on the shared VPS (178.88.167.84).
#
# The shared Caddy (/opt/ortodok/infra) owns 80/443 and TLS; this script never
# touches ports, certificates or other projects. Images are built while the old
# containers keep serving, then swapped one service at a time.
#
# Usage (on the VPS, in /opt/gardina):
#   ./deploy.sh                 # backend + frontend
#   ./deploy.sh backend         # only backend
#
# The static landing (gardina.kz) is served from /srv/gardina/landing and is
# NOT deployed by this script.
set -euo pipefail
cd "$(dirname "$0")"

if [ $# -gt 0 ]; then SERVICES=("$@"); else SERVICES=(backend frontend); fi
HEALTH_TIMEOUT=120

[ -f gardina-backend/.env.production ] || { echo "missing gardina-backend/.env.production"; exit 1; }

echo "==> git pull"
git pull --ff-only

echo "==> build: ${SERVICES[*]}"
docker compose build "${SERVICES[@]}"

for svc in "${SERVICES[@]}"; do
  echo "==> up: $svc"
  docker compose up -d --no-deps "$svc"
  cid=$(docker compose ps -q "$svc")
  for ((i = 0; i < HEALTH_TIMEOUT; i += 3)); do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid")
    case "$status" in healthy | running) break ;; esac
    sleep 3
  done
  case "$status" in healthy | running) ;; *)
    echo "!! $svc is '$status' after ${HEALTH_TIMEOUT}s"; docker compose logs --tail 50 "$svc"; exit 1 ;;
  esac
  echo "    $svc: $status"
done

docker image prune -f > /dev/null

for url in https://app.gardina.kz https://api.gardina.kz/health; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url")" "$url"
done
