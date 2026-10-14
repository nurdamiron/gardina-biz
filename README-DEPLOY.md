# Gardina — deployment (VPS)

Gardina runs on the shared VPS `178.88.167.84` (Ubuntu, Docker Compose) next to
ortodok.kz and slash. One Caddy instance (`/opt/ortodok/infra`, network
`myshop_default`) owns ports 80/443 and issues Let's Encrypt certificates.

| Domain | What | Served by |
|--------|------|-----------|
| `gardina.kz`, `www.gardina.kz` | Static landing | Caddy, files in `/srv/gardina/landing` |
| `app.gardina.kz` | CRM (React) | Caddy → `gardina-frontend:80` |
| `api.gardina.kz` | REST API | Caddy → `gardina-backend:3001` |
| — | PostgreSQL 16 | `gardina-postgres` (volume `postgres-data`, private network) |

## Layout on the server

```
/opt/gardina                          # this repo
/opt/gardina/.env                     # POSTGRES_PASSWORD, CADDY_NETWORK
/opt/gardina/gardina-backend/.env.production   # app secrets, DATABASE_HOST=gardina-postgres
/srv/gardina/landing                  # landing, updated by hand (not by deploy.sh)
```

`DATABASE_HOST` must be `gardina-postgres`, not `postgres`: the backend is also on
`myshop_default`, where `postgres` resolves to the ortodok database.

## Deploy

```bash
ssh root@178.88.167.84
cd /opt/gardina
./deploy.sh            # backend + frontend
./deploy.sh backend    # one service
```

The script pulls `main`, builds new images while the old containers keep serving,
replaces one service at a time, waits for its health check and fails loudly
(with logs) if it doesn't come up. It never touches ports, certificates or other
projects.

## Ops

- Backups: `/usr/local/sbin/vps-backup` (cron 03:30) → `/var/backups/vps/<date>/gardina_shtory.dump`
- Restore: `docker exec -i gardina-postgres pg_restore -U postgres -d gardina_shtory --clean < gardina_shtory.dump`
- Monitoring: `/usr/local/sbin/vps-monitor` (cron, every 5 min) checks `gardina.kz`, `app.gardina.kz`
- Logs: `docker compose logs -f backend`
