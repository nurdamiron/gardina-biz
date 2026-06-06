# Gardina — Production Test Suite (SAFE)

A **read-only / non-destructive** test suite for the Gardina API. It verifies
liveness, security posture, and that the main read endpoints honor the OpenAPI
contract (`../docs/openapi.yaml`) — without mutating real production data.

## Safety rules (read first)

1. **Read-only by default.** Nothing here creates, updates, or deletes real
   data unless you explicitly set `ALLOW_WRITES=true`.
2. **Write tests are gated and self-cleaning.** They require `ALLOW_WRITES=true`,
   use the configured **isolated test tenant**, and delete what they create.
   Run them on **staging or a throwaway tenant**, never against real customers.
3. **Use an isolated test account.** Never put a real customer/admin login in
   `.env`. Prefer a low-privilege (e.g. `designer`) test user.
4. **No secrets in git.** Credentials come from `.env` (gitignored). See
   `.env.example`.
5. **Load tests are staging-only.** `load/k6-smoke.js` generates sustained
   traffic — run it on staging or a low-traffic window so you don't trip the
   rate limiter or affect real users.

## Setup

```bash
cd prod-tests
npm install            # installs vitest
cp .env.example .env   # then fill in BASE_URL + test account creds
```

`.env` keys (all read by `config.js`):

| Key                | Purpose                                                 |
|--------------------|---------------------------------------------------------|
| `GARDINA_BASE_URL` | API base incl. `/api`. Defaults to **production**. (Use this — plain `BASE_URL` is Vite-reserved and ignored unless a full URL.) |
| `TEST_LOGIN`    | Isolated test account login (phone or email).             |
| `TEST_PASSWORD` | Test account password.                                     |
| `TEST_ORG_SLUG` | Optional tenant slug to disambiguate login.               |
| `ALLOW_WRITES`  | `true` enables gated write tests. Leave off in prod.       |

## Running

```bash
npm run smoke      # /health latency + CORS + helmet security headers
npm run contract   # auth happy-path + read endpoints vs OpenAPI + 401/403 cases
npm run security   # automated subset of security-checklist.md
npm test           # all of the above
```

Behavior without a test account: the unauthenticated negative cases (401s,
header checks, IDOR-style 404 probe) still run; account-dependent tests are
**skipped** (not failed).

## What's covered

- **`smoke.test.js`** — `GET /health` (200 + `{status:healthy, database:connected}`),
  latency budget, helmet headers (CSP, nosniff, frame protection, HSTS, no
  `X-Powered-By`), CORS preflight. Also asserts `/ready` and `/version` 404
  (they are not implemented in the current backend — verified in
  `gardina-backend/src/server.js`).
- **`contract.test.js`** — login → token; `GET /auth/me`, `/deals`, `/clients`,
  `/catalog/products`, `/analytics/dashboard-stats` shape-checked against the
  OpenAPI schemas. Negative auth: no token → 401, bad token → 401, bad creds →
  401/429. RBAC: non-admin → 403 on an admin-only analytics route. Gated
  self-cleaning write round-trip (create+delete a test client).
- **`security.test.js`** — automated security checks (headers, auth enforcement
  on protected reads, no stack-trace leak, read-only IDOR probe).
- **`security-checklist.md`** — full checklist marking **[AUTO]** vs **[MANUAL]**
  (escalation matrix, injection, rate-limit hammering, PII leaks, `npm audit`).
- **`load/k6-smoke.js`** — low-rate read-only k6 profile with p95 + error-rate
  thresholds. **Staging / low-traffic only.**

## Load test (k6, staging only)

```bash
GARDINA_BASE_URL=https://staging-api.gardina.alashed.kz/api \
TEST_LOGIN=... TEST_PASSWORD=... TEST_ORG_SLUG=... \
k6 run load/k6-smoke.js
```

## Dependency audit

Not run from here (no app deps live in this folder). Run in each app:

```bash
(cd ../gardina-backend  && npm audit --omit=dev)
(cd ../gardina-frontend && npm audit --omit=dev)
```
