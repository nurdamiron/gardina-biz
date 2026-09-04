# Migration runbook — move Gardina to `gardina.kz` on the new server

Target: run the whole Gardina stack (landing + CRM app + API + Telegram bot +
PostgreSQL) on the shared server **`178.88.167.84`**, served at **`gardina.kz`**,
**isolated** from the `ortodok.kz` / cPanel workload already on that box.

The code/domain switch (`gardina.alashed.kz` → `gardina.kz`) is already done in
the repo. This document is the operational plan for the server move. It is a
checklist with decision points — read it through once before starting.

---

## 0. Target topology

| Hostname | Serves | Container |
|---|---|---|
| `gardina.kz`, `www.gardina.kz` | Landing page (static) | `gardina-nginx` → `/var/www/landing` |
| `app.gardina.kz` | CRM PWA (React) | `gardina-nginx` → `frontend:80` |
| `api.gardina.kz` | REST API | `gardina-nginx` → `backend:3001` |
| — | Database | `gardina-postgres` (volume `postgres-data`) |
| — | Telegram bot | `gardina-telegram-bot` |

The Gardina stack runs entirely inside Docker Compose on its own bridge network
(`gardina-network`). Nothing it does touches cPanel accounts, Exim, or the
`ortodok.kz` docroot.

---

## 1. Prerequisites — gather before touching the server

- [ ] SSH root access to `178.88.167.84` (given).
- [ ] Registrar login for **`gardina.kz`** (a `.kz` domain — PS.KZ / Hoster.kz /
      KazNIC). You need to edit A records.
- [ ] Access to the **current** production to take a database dump:
      old server SSH *or* direct `psql` connection string (host/port/user/pass/db).
      This is in the current `gardina-backend/.env.production` (`DB_HOST`,
      `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- [ ] The current secret values to rebuild `.env.production` and `gardina-bot/.env`
      on the new box (JWT secrets, AWS S3 keys, Cloudinary, SMTP, VAPID, Sentry
      DSN, `BOT_TOKEN`, `ADMIN_IDS`, `PRIVATE_CHANNEL_ID`, Kaspi payment fields).
- [ ] Decide the **edge strategy** — section 3.

### Check the server's real state first

```bash
ssh root@178.88.167.84
cat /etc/os-release                 # AlmaLinux / CloudLinux expected (dnf, not apt)
ip -4 addr | grep inet              # how many public IPs? (decides section 3)
ss -tlnp | grep -E ':80 |:443 '     # who owns 80/443 (httpd / lshttpd / nginx)
command -v docker || echo "no docker yet"
whmapi1 version 2>/dev/null | head  # confirms cPanel/WHM present
free -m ; df -h /                   # capacity for another Node+Postgres stack
```

---

## 2. DNS

Lower TTLs **24 h before** the planned cutover so the switch is fast and
reversible, then at cutover point the records at the new box:

| Record | Type | Value | TTL |
|---|---|---|---|
| `gardina.kz` | A | `178.88.167.84` | 300 |
| `www.gardina.kz` | A | `178.88.167.84` | 300 |
| `app.gardina.kz` | A | `178.88.167.84` | 300 |
| `api.gardina.kz` | A | `178.88.167.84` | 300 |

Do **not** move nameservers to the hosting box's custom NS (the `ns*` in the
welcome email) unless you also want to run the whole DNS zone in WHM. Plain A
records at the current registrar are simpler and keep `gardina.kz` DNS
independent of `ortodok.kz`.

If Vercel keeps serving the CRM app (section 9), point `app.gardina.kz` at Vercel
per their dashboard instead of the A record above — pick one, not both.

---

## 3. Edge strategy — how Gardina's ports coexist with cPanel

cPanel's web server (Apache `httpd` or LiteSpeed `lshttpd`) already owns
`:80`/`:443` on the shared IP. Pick **one**:

### Option A — second IP for Gardina *(cleanest; use if `ip -4 addr` shows a spare IP)*

Bind the Gardina nginx directly to the spare IP. cPanel stays on the primary IP.
In `./.env` next to `docker-compose.yml`:

```dotenv
NGINX_HTTP_BIND=<SPARE_IP>:80
NGINX_HTTPS_BIND=<SPARE_IP>:443
```

TLS: the built-in `certbot` + `nginx-reloader` sidecars work as-is — run
`./deploy.sh` (see note in section 5 about the OS) or issue certs manually.
`nginx/conf.d/gardina.conf` needs no changes.

### Option B — cPanel/Apache stays the edge, proxies to Gardina on loopback

Gardina nginx listens only on loopback high ports; the existing Apache terminates
TLS for the four hostnames and reverse-proxies to it.

1. In `./.env`:
   ```dotenv
   NGINX_HTTP_BIND=127.0.0.1:8080
   NGINX_HTTPS_BIND=127.0.0.1:8443
   ```
2. Drop the `certbot` and `nginx-reloader` services (not needed — Apache/AutoSSL owns certs):
   run with an override, `docker compose -f docker-compose.yml -f docker-compose.edge-b.yml up -d`,
   where `docker-compose.edge-b.yml` sets `certbot` and `nginx-reloader` to
   `profiles: ["disabled"]`, **or** just `docker compose stop certbot nginx-reloader`
   after start.
3. Issue certs for the hostnames via WHM: add `gardina.kz` + `www` + `app` + `api`
   as a parked/addon domain or a dedicated account, let **AutoSSL** run
   (`/scripts/autossl_check --all`), or `certbot --apache -d gardina.kz -d www.gardina.kz -d app.gardina.kz -d api.gardina.kz`.
4. Add an Apache proxy vhost that survives cPanel rebuilds — use the
   **Include Editor** (`WHM » Apache Configuration » Include Editor »
   Post VirtualHost Include`, "All Versions"), or drop a file under
   `/etc/apache2/conf.d/userdata/...` and `/scripts/ensure_vhost_includes`:

   ```apache
   <VirtualHost 178.88.167.84:443>
       ServerName  gardina.kz
       ServerAlias www.gardina.kz app.gardina.kz api.gardina.kz
       SSLEngine on
       SSLCertificateFile    /var/cpanel/ssl/apache_tls/gardina.kz/certificates
       SSLCertificateKeyFile /var/cpanel/ssl/apache_tls/gardina.kz/keys/...
       ProxyPreserveHost On
       RequestHeader set X-Forwarded-Proto "https"
       ProxyPass        / http://127.0.0.1:8443/  # nginx container speaks TLS? no — see note
       ProxyPassReverse / http://127.0.0.1:8443/
   </VirtualHost>
   ```

   > Note: with Option B the Gardina nginx does **not** need its own TLS. Simplest
   > is to serve plain HTTP on `127.0.0.1:8080` from the container and have Apache
   > do `ProxyPass / http://127.0.0.1:8080/`. In that case also trim
   > `nginx/conf.d/gardina.conf` to the `listen 80` server blocks only (or add a
   > `gardina.internal.conf` with plain-HTTP vhosts and don't mount the HTTPS one).

**Recommendation:** Option A if a spare IP exists. Otherwise Option B with
Apache→`127.0.0.1:8080` (plain HTTP inside), and a stripped HTTP-only nginx conf.

---

## 4. Server prep — Docker on the cPanel box

`deploy.sh` in this repo assumes Ubuntu (`apt-get`). The new box is
AlmaLinux/CloudLinux. Install Docker manually:

```bash
dnf -y install dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
docker version && docker compose version
```

CloudLinux notes:
- Run everything as `root` **outside** CageFS. Do not put the project inside a
  cPanel user's home (`/home/<user>/...`) — use e.g. `/opt/gardina`.
- If the kernel blocks overlay2 / user namespaces, set
  `"storage-driver": "overlay2"` in `/etc/docker/daemon.json` and check
  `sysctl user.max_user_namespaces`.
- LVE limits do not apply to root processes, so containers are unconstrained —
  keep an eye on `free -m` / `df -h` so Gardina doesn't starve `ortodok`.

Firewall: allow the ports you actually bind (Option A: `<SPARE_IP>:80,443`;
Option B: nothing new — loopback only). CSF is common on cPanel:
`csf -a` rules or edit `TCP_IN`.

---

## 5. Get the code + secrets onto the server

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/nurdamiron/gardina-biz.git gardina
cd gardina
git checkout feature/migrate-to-gardina-kz   # until it's merged to main
```

Create the three env files (they are **not** in git):

### `./.env` (compose interpolation)

```dotenv
POSTGRES_DB=gardina_shtory
POSTGRES_USER=gardina
POSTGRES_PASSWORD=<generate: openssl rand -base64 24>
# Option A only:
# NGINX_HTTP_BIND=<SPARE_IP>:80
# NGINX_HTTPS_BIND=<SPARE_IP>:443
# Option B only:
# NGINX_HTTP_BIND=127.0.0.1:8080
# NGINX_HTTPS_BIND=127.0.0.1:8443
```

### `./gardina-backend/.env.production`

Start from `gardina-backend/.env.example`. Key values for this deployment:

```dotenv
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gardina_shtory
DB_USER=gardina
DB_PASSWORD=<same as POSTGRES_PASSWORD above>
JWT_SECRET=<carry over from current prod>
JWT_REFRESH_SECRET=<carry over>
FRONTEND_URL=https://app.gardina.kz
PUBLIC_API_URL=https://api.gardina.kz
# uploads — see section 6. Until the local driver lands, keep S3:
AWS_REGION=<carry over>
AWS_ACCESS_KEY_ID=<carry over>
AWS_SECRET_ACCESS_KEY=<carry over>
AWS_S3_BUCKET=<carry over>
# email / push / sentry / cloudinary / twilio — carry over as used
```

### `./gardina-bot/.env`

From `gardina-bot/.env.example`. Point it at the same DB:

```dotenv
BOT_TOKEN=<carry over>
ADMIN_IDS=<carry over>
PRIVATE_CHANNEL_ID=<carry over>
DATABASE_URL=postgresql+asyncpg://gardina:<POSTGRES_PASSWORD>@postgres:5432/gardina_shtory
# payment / contact fields as used
```

`chmod 600 .env gardina-backend/.env.production gardina-bot/.env`.

---

## 6. Database migration (dump → restore)

The new `postgres` service in `docker-compose.yml` holds the data on a named
volume (`postgres-data`).

1. **Bring up only Postgres** so it initialises the DB/user:
   ```bash
   docker compose up -d postgres
   docker compose exec postgres pg_isready -U gardina -d gardina_shtory
   ```

2. **Dump the current production DB** (custom format, no owner/ACL):
   ```bash
   # from a host that can reach the current DB:
   pg_dump "postgresql://$OLD_USER:$OLD_PASS@$OLD_HOST:$OLD_PORT/$OLD_DB" \
     --no-owner --no-privileges -Fc -f gardina-$(date +%F).dump
   ```
   Do this during a low-traffic window; for a clean cutover take a **final** dump
   right before flipping DNS (put the old app in maintenance / read-only first).

3. **Copy the dump to the new server** and restore into the container:
   ```bash
   scp gardina-*.dump root@178.88.167.84:/opt/gardina/
   docker compose cp gardina-*.dump postgres:/tmp/g.dump
   docker compose exec postgres \
     pg_restore -U gardina -d gardina_shtory --no-owner --clean --if-exists /tmp/g.dump
   docker compose exec postgres rm /tmp/g.dump
   ```

4. **Sanity check**:
   ```bash
   docker compose exec postgres psql -U gardina -d gardina_shtory -c "\dt" | head
   docker compose exec postgres psql -U gardina -d gardina_shtory -c \
     "select count(*) from users; select count(*) from deals;"
   ```
   The backend also has `gardina-backend/src/infrastructure/database/init-database.js`
   for a fresh schema — not needed when restoring a full dump, but run it if the
   dump was schema-less.

---

## 7. Uploads: S3 → local disk on this server  ⚠️ needs a code change

The user wants uploaded media stored **on this server**, not AWS S3. Today
`gardina-backend/src/infrastructure/services/S3UploadService.js` is the only
driver and its constructor throws without AWS creds; `UploadController` serves
files back through `GET /api/upload/file/*` via `s3Service.getObject`.

**This is not done yet.** Two options:

- **Interim (no code change):** keep `UPLOAD_DRIVER` unset and supply the existing
  AWS S3 creds in `.env.production`. Everything keeps working, media just still
  lives in S3. Do the cutover this way, migrate storage later.
- **Local driver (follow-up task):**
  1. Add `LocalUploadService` with the same surface as `S3UploadService`
     (`uploadFile`, `uploadMultiple`, `deleteFile`, `getObject`, `getContentType`),
     writing under `/app/uploads/<same key path>` (already mounted:
     volume `gardina-uploads`).
  2. In `UploadController`, pick the service from `process.env.UPLOAD_DRIVER`
     (`local` | `s3`, default `s3`). Keep the `/api/upload/file/*` route — it
     streams from disk for the local driver.
  3. `.env.production`: `UPLOAD_DRIVER=local`, keep `PUBLIC_API_URL=https://api.gardina.kz`
     so returned URLs stay `https://api.gardina.kz/api/upload/file/<key>`.
  4. **Backfill existing media** from S3 to the volume, preserving keys:
     ```bash
     aws s3 sync s3://<AWS_S3_BUCKET>/<AWS_S3_PREFIX> \
       ./_s3backfill/ --region <AWS_REGION>
     docker compose cp ./_s3backfill/. backend:/app/uploads/
     ```
     (or a small Node script using the same SDK the backend already bundles.)
  5. nginx already allows `client_max_body_size 20M` for `api.gardina.kz`.
  6. Keep AWS creds around read-only until every `photo_url` in the DB has been
     verified to resolve from local disk.

Track this as a separate PR; don't block the cutover on it.

---

## 8. Bring up the stack

```bash
cd /opt/gardina
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend        # watch for DB connect + "listening on 3001"
docker compose logs telegram-bot
```

Local smoke (before DNS):

```bash
# Option A: curl the spare IP with a Host header; Option B: curl 127.0.0.1:8080
curl -H 'Host: api.gardina.kz' http://127.0.0.1:8080/health          # -> OK
curl -H 'Host: app.gardina.kz' http://127.0.0.1:8080/ | head
curl -H 'Host: gardina.kz'     http://127.0.0.1:8080/ | head
```

---

## 9. TLS

- **Option A:** run `./deploy.sh` (edit the `apt-get` block out first, Docker is
  already installed) — its STEP 5 gets a Let's Encrypt cert for all four
  hostnames via the webroot challenge, then `docker compose up -d`. The
  `certbot` + `nginx-reloader` sidecars auto-renew.
- **Option B:** WHM AutoSSL or `certbot --apache` for the four hostnames; Gardina
  nginx serves plain HTTP on loopback.

Verify: `curl -I https://api.gardina.kz/health`,
`https://app.gardina.kz`, `https://gardina.kz`, and
`https://www.gardina.kz` (301 → apex or served).

---

## 10. Cutover & verification

1. Announce a short maintenance window.
2. Put the **old** app read-only / maintenance.
3. Take the **final** `pg_dump`, restore into the new `postgres` (section 6).
4. Flip the four A records to `178.88.167.84` (section 2).
5. Watch propagation: `dig +short api.gardina.kz @1.1.1.1`.
6. Run `prod-tests` against the new host:
   ```bash
   cd prod-tests && cp .env.example .env
   # GARDINA_BASE_URL=https://api.gardina.kz/api , TEST_LOGIN/PASSWORD set
   npm i && npm test
   ```
7. Manual checks: log in to `app.gardina.kz`, open a client with photos
   (upload proxy), create a measurement, confirm the Telegram bot responds,
   confirm a password-reset email sends.
8. Keep the **old** stack running untouched for at least 48–72 h.

---

## 11. Post-migration

- [ ] **Rotate the credentials that were pasted in chat**: server `root` password
      (`passwd`), WHM root password (WHM » Change Password). Also rotate any DB
      password if it was reused.
- [ ] **Vercel**: decide — keep Vercel serving `app.gardina.kz` (set
      `VITE_API_URL=https://api.gardina.kz/api` in the Vercel project, point the
      `app` DNS at Vercel) **or** retire it and serve the `frontend` container
      (disable `.github/workflows/deploy-frontend.yml`). Don't run both on the
      same hostname.
- [ ] **CI**: the existing `.github/workflows/deploy-backend*.yml` target the old
      AWS EC2 host over SSM. Add a `deploy-gardina-server.yml` that SSHes to
      `178.88.167.84` and runs `cd /opt/gardina && git pull && docker compose up -d --build`,
      with repo secrets `GARDINA_SSH_HOST`, `GARDINA_SSH_USER`, `GARDINA_SSH_KEY`.
      Disable the AWS workflows once this one is proven.
- [ ] Decommission the old `gardina.alashed.kz` stack and its DNS once traffic is
      confirmed stable. If old links must keep working, add a 301-redirect vhost
      `gardina.alashed.kz → https://gardina.kz` (needs a cert for that name on
      whichever server still answers it).
- [ ] Set up backups for the `postgres-data` volume:
      `docker compose exec postgres pg_dump -U gardina -Fc gardina_shtory` on a
      cron to off-box storage; snapshot `gardina-uploads` too if the local
      upload driver is in use.

---

## 12. Rollback

Because DNS TTL is 300 s and the old stack stays up:

1. Point the four A records back to the old server's IP.
2. If the old DB took writes after the final dump, they're the source of truth —
   don't re-restore backward.
3. `docker compose down` on the new box (data stays in the `postgres-data` /
   `gardina-uploads` volumes for the next attempt).

---

## 13. Isolation from `ortodok.kz` — summary

| Concern | How it's isolated |
|---|---|
| Web ports | Option A: separate IP. Option B: Gardina on loopback, Apache proxies by hostname. |
| Process/user | Gardina runs as Docker containers under `root` in `/opt/gardina`, not a cPanel user home. |
| Database | Dedicated `gardina-postgres` container + `postgres-data` volume. Never touches cPanel MySQL/Postgres. |
| Mail | Backend sends via its own SMTP creds (`EMAIL_*`), not local Exim. |
| TLS | Own Let's Encrypt certs (Option A) or its own AutoSSL domain (Option B). |
| Deploys | Independent `git pull && docker compose up -d` in `/opt/gardina`. |
| Resource use | Watch `free -m` / `df -h`; add `mem_limit` / `cpus` to the compose services if `ortodok` needs protecting. |
