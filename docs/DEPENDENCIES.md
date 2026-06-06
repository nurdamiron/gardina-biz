# Gardina — External Dependencies & Integrations

All third-party integrations are isolated behind adapters in
`gardina-backend/src/infrastructure/services/`. The frontend and clients never call these
services directly — they go through the API.

## Integrations

| Integration | Provider / lib | Used for | Required env vars | iOS relevance |
|-------------|----------------|----------|-------------------|---------------|
| **Email** | Nodemailer (SMTP) | Email verification, password reset, invitations, notifications | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (and `SMTP_SECURE` if used) | Indirect — iOS triggers the same flows (register, reset). No client config. |
| **SMS + WhatsApp** | Twilio | Transactional SMS / WhatsApp messages to clients | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_FROM` | Indirect — server-side only. |
| **Web Push** | VAPID (web-push) | Browser push (React app) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `GET /api/notifications/push/vapid-key` is the public web key endpoint. |
| **APNs** | token-based .p8 (http2 + jsonwebtoken) | Native iOS push | `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8`, `APNS_BUNDLE_ID`, `APNS_PRODUCTION` | ✅ Implemented. iOS registers via `POST /api/notifications/push/apns`. Same `push_subscriptions` table, routed by `platform`. See note below. |
| **Object storage** | AWS S3 | Photo uploads (`/api/upload/photo`, `/photos`) — max 10 files, 10 MB each, magic-byte validated, jpeg/png/webp/gif | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | Direct — iOS uploads measurement/product photos via the same multipart endpoints. Respect the size/type limits. |
| **Error monitoring** | Sentry | Backend error & performance tracking | `SENTRY_DSN` (+ `SENTRY_ENVIRONMENT`) | Optional — iOS can add its own Sentry/Crashlytics SDK with a separate DSN; unrelated to backend. |

> Env var names above reflect the integrations' standard conventions; confirm exact keys
> against `gardina-backend/.env.example` / the service adapters before provisioning.

## Core runtime deps

- **PostgreSQL** via `pg` — `DATABASE_URL` (or discrete `PGHOST`/`PGUSER`/`PGPASSWORD`/
  `PGDATABASE`/`PGPORT`).
- **JWT** — `JWT_SECRET` (and refresh secret if separate), token lifetimes (access 7d /
  refresh 30d).
- **App** — `PORT` (5000 dev), `NODE_ENV`, `CORS_ORIGIN`/allowed origins.

## i18n

The product ships **Russian (`ru`)** and **Kazakh (`kz`)**. iOS should localize for both
and send/expect a locale where the API supports it.

---

## Push: Web Push + APNs (iOS) — ✅ implemented

Push is delivered by a single service (`PushService`) over one table
(`push_subscriptions`), routed by a `platform` column:
- **`web`** — VAPID Web Push (`endpoint` + `p256dh` + `auth`) for the React app. Unchanged.
- **`ios`** — native **APNs** via `device_token`, delivered by `APNsService`
  (`infrastructure/services/APNsService.js`): token-based (.p8) auth, ES256 provider
  JWT signed with `jsonwebtoken`, delivery over Node's built-in `http2`. No new dependency.

Flow:
1. iOS requests notification permission, registers with APNs, gets a device token.
2. iOS `POST /api/notifications/push/apns { deviceToken }` → stored with `platform='ios'`.
3. `PushService.sendToSubscription` routes iOS rows to `APNsService.send`; dead tokens
   (`BadDeviceToken` / `Unregistered` / 410) are auto-deactivated.
4. `notification_type` (`urgent` / `warning` / `info`) maps to APNs payload (priority 10, alert).

Required env (iOS push is log-only until set): `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY_P8`,
`APNS_BUNDLE_ID` (default `kz.gardina.app`), `APNS_PRODUCTION`. See `.env.example`.

Additive — Web Push for the React app is untouched. See
[`adr/0004-native-swiftui-ios-client.md`](./adr/0004-native-swiftui-ios-client.md).
