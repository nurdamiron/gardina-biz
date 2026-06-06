# Gardina — Production Security Checklist

Legend: **[AUTO]** = covered by `security.test.js` / `smoke.test.js` in this
suite. **[MANUAL]** = run by a human (out of scope for automated read-only
probing, or destructive/intrusive enough that it needs explicit sign-off and a
staging target).

> Golden rule: nothing in the AUTO column mutates real data. MANUAL items that
> involve writes, fuzzing, or rate-limit hammering must target **staging** or a
> **throwaway tenant** — never production customer data.

---

## 1. Authentication & Authorization

### Vertical privilege escalation (role bypass)
- **[AUTO]** Non-admin test account is rejected (403) on an admin-only endpoint
  (`/analytics/revenue-breakdown`) — `contract.test.js`.
- **[MANUAL]** Full role matrix: for each role (designer, manager, production,
  installer, admin, sales), confirm `authorize(...)`-guarded routes return 403
  for roles not in the allow-list. High-value targets:
  - `POST /users/admin/create`, `DELETE /users/admin/:id` (admin only)
  - `POST /catalog/products`, `DELETE /catalog/products/:id` (admin only)
  - `GET /audit` (admin|manager), `GET /analytics/revenue-breakdown` (admin)
  - `POST /notifications/admin/broadcast` (admin)
- **[MANUAL]** Verify a forged/edited JWT `role` claim is rejected (signature
  must be validated; role must come from a trusted source, not be mutable).

### Horizontal privilege escalation (IDOR / cross-tenant)
- **[AUTO]** Random/foreign deal UUID returns 404, not another tenant's data —
  `security.test.js` (read-only probe).
- **[MANUAL]** With two isolated test tenants A and B, confirm tenant A's token
  cannot read/update/delete tenant B's `clients`, `deals`, `measurements`,
  `proposals`, `payments`, `installations`, `users`, `notifications`. The JWT
  carries `organizationId`; verify every query is tenant-scoped server-side.
- **[MANUAL]** Confirm `GET /deals/:id` for a valid-but-foreign id returns 404
  (not 403, to avoid existence oracle) — and never 200.

### Session / token hygiene
- **[AUTO]** No token -> 401; malformed token -> 401 (`contract.test.js`).
- **[MANUAL]** Logout blacklists the access token (in-memory). Note: blacklist
  is per-instance and lost on restart — flag as a known limitation for
  multi-instance deploys.
- **[MANUAL]** Refresh-token rotation: old refresh token invalidated after use.
- **[MANUAL]** Password reset tokens are single-use, time-boxed, and not logged.

---

## 2. Injection Surface

- **[MANUAL]** Backend uses raw SQL via `pg`. Confirm **all** queries use
  parameterized placeholders (`$1, $2`) — grep the repo for string-interpolated
  SQL (`` `...${ ` `` inside `query(`). Any dynamic identifier (column/sort)
  must be allow-listed, not interpolated.
- **[MANUAL]** Test injection payloads in `search` / filter query params
  (`/deals?search=`, `/clients?search=`, `/catalog/products/search`) on
  **staging**: `' OR 1=1 --`, `%`, `\`, unicode — expect safe handling, not
  500s or data leakage.
- **[MANUAL]** File upload (`/upload/photo`, `/upload/photos`): magic-byte
  validation, 10MB cap, mime allow-list (jpeg/png/webp/gif) — confirm a renamed
  `.php`/`.svg`/polyglot is rejected. (Do NOT run against prod S3.)
- **[MANUAL]** Stored XSS: free-text fields (client notes, deal notes, proposal
  text) rendered safely in the React frontend (React escapes by default; check
  any `dangerouslySetInnerHTML`).

---

## 3. Security Headers (helmet)

- **[AUTO]** `Content-Security-Policy` present — `security.test.js`.
- **[AUTO]** `X-Content-Type-Options: nosniff` — `security.test.js`.
- **[AUTO]** Clickjacking: `X-Frame-Options` or CSP `frame-ancestors` —
  `security.test.js`.
- **[AUTO]** `Strict-Transport-Security` (HSTS) present over HTTPS —
  `security.test.js`.
- **[AUTO]** No `X-Powered-By` fingerprint — `security.test.js`.
- **[MANUAL]** Review the CSP value itself for `unsafe-inline` / `unsafe-eval`
  and overly broad sources; helmet's default CSP may need tightening for the
  app's real asset/CDN origins.

---

## 4. Rate Limiting

- **[MANUAL]** Login `POST /auth/login` — 5 / 15min / IP. Verify the 6th bad
  attempt returns 429. (Hammering counts against the real IP — run from a
  throwaway IP / staging.)
- **[MANUAL]** Password reset `POST /auth/password-reset/request` — 5 / 15min.
  Confirm always-success response (no account enumeration) AND rate cap.
- **[MANUAL]** OTP / resend-verification `POST /auth/resend-verification` —
  confirm a per-IP / per-account cap.
- **[MANUAL]** Registration `POST /auth/register-salon` — 3 / hour / IP.
- **[MANUAL]** Global `/api` limiter — 100 / 15min / IP. Confirm `trust proxy`
  is correct so the limiter keys off the real client IP, not the load balancer.
- **[AUTO-ish]** `contract.test.js` tolerates 429 on the bad-login case (does
  not assert the limit, just that it doesn't crash).

---

## 5. PII / Sensitive Data Leakage

- **[AUTO]** Error responses contain no `stack` field (verbose errors gated
  behind `NODE_ENV=development`) — `security.test.js`.
- **[MANUAL]** No password hashes / tokens / internal ids returned in user or
  auth payloads. Confirm `password_hash` never serialized.
- **[MANUAL]** Login error messages are generic (don't reveal "user exists" vs
  "wrong password").
- **[MANUAL]** Logs (Sentry, console) scrub PII (phone/email/password). Confirm
  request bodies for `/auth/*` aren't logged in production.
- **[MANUAL]** TLS enforced end-to-end; no API responses over plain HTTP.

---

## 6. Dependency / Supply Chain

- **[MANUAL]** `npm audit` in both apps:
  ```bash
  (cd gardina-backend && npm audit --omit=dev)
  (cd gardina-frontend && npm audit --omit=dev)
  ```
  Triage high/critical; record accepted risks. Re-run on every dependency bump.
- **[MANUAL]** Lockfiles committed (`package-lock.json`) and CI does `npm ci`.
- **[MANUAL]** Check for known-vulnerable transitive deps in `jsonwebtoken`,
  `multer`, `express`, `pg`, `helmet`.

---

## 7. Infra / Config (manual review)

- **[MANUAL]** Secrets only via env (no secrets in repo). Note: MEMORY flags
  untracked secrets under `specs/.auth` — confirm `.gitignore` coverage.
- **[MANUAL]** CORS allow-list is explicit (it is — see `server.js`); no
  wildcard `*` with credentials.
- **[MANUAL]** S3 bucket: no public-list, scoped IAM, signed URLs where needed.
- **[MANUAL]** DB: least-privilege app role; no superuser from the app.
- **[MANUAL]** Read-only billing mode (402 `SUBSCRIPTION_READ_ONLY`) actually
  blocks every write route except whitelisted `/auth` and `/billing`.
