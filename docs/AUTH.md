# Gardina — Authentication & Authorization

Gardina uses **stateless JWT Bearer auth** with bcrypt-hashed passwords. Rationale:
[`adr/0002-jwt-stateless-auth.md`](./adr/0002-jwt-stateless-auth.md). Full request shapes
are in [`openapi.yaml`](./openapi.yaml).

---

## 1. Tokens

| Token | Lifetime | Sent as | Purpose |
|-------|----------|---------|---------|
| **Access token** | 7 days | `Authorization: Bearer <token>` | Authorize every protected request. |
| **Refresh token** | 30 days | request body to `/auth/refresh-token` | Mint a fresh token pair without re-login. |

Login response shape:

```json
{ "data": { "user": { ... }, "tokens": { "accessToken": "...", "refreshToken": "..." } } }
```

### Issuance

- `POST /auth/register-salon` — public, rate-limited **3/hour**. Creates tenant
  (`organizations`) + first `admin` user, returns the user and token pair.
- `POST /auth/login` — body `{ login, password, organizationSlug? }`. Verifies bcrypt
  password, issues the access + refresh pair.
- `POST /auth/refresh-token` — body `{ refreshToken }`. Validates the refresh token and
  returns a **new** token pair.

### Validation (every protected request)

`auth.middleware.js`:
1. Extract the `Bearer` access token; reject `401` if missing/malformed.
2. Verify signature + expiry.
3. Check the **in-memory logout blacklist** (see below) — reject if blacklisted.
4. Load the user from the DB (also resolves their `organization_id` and `role`).
5. Bind tenant context via `AsyncLocalStorage` (`tenantStorage` →
   `{ organizationId }`) so repositories scope every query.

`GET /auth/me` (Bearer) returns the current user.

---

## 2. Refresh flow

```
access token expires (401)
   │
   ▼
client calls POST /auth/refresh-token { refreshToken }
   │
   ├─ valid    → new { accessToken, refreshToken } → retry original request
   └─ invalid/expired → force re-login (POST /auth/login)
```

Clients should refresh **proactively** (before 7d) or **reactively** on the first `401`,
retrying the failed request once with the new access token.

---

## 3. Logout & blacklist

`POST /auth/logout` (Bearer) adds the presented access token to an **in-memory
blacklist**; subsequent requests with that token are rejected by the auth middleware.

> Caveat: the blacklist is **in-process** — it is cleared on backend restart and is not
> shared across multiple instances. It is a convenience invalidation, not a hard
> guarantee. Clients must still discard tokens locally on logout.

---

## 4. Roles & `authorize()`

Role enum `user_role`: `designer`, `manager`, `production`, `installer`, `admin`, `sales`.

Routes guard access with `authorize(...roles)` middleware after auth; a user whose role
is not in the allow-list gets **`403 Forbidden`**. Examples:

- `GET /api/users` → `admin | manager`
- `POST /api/users/admin/create` → `admin`
- `GET /api/analytics/revenue-breakdown` → `admin`
- `GET /api/analytics/client-funnel` → `admin | manager | sales`
- `POST /api/installations` → `admin | manager`

The user's role is included in `GET /auth/me` so clients can render role-appropriate UI,
but **enforcement is always server-side**.

---

## 5. Subscription read-only gate (402)

`billing.middleware.js` enforces billing state on **write** methods
(`POST/PUT/PATCH/DELETE`). If the organization's `subscription_status` is an expired /
non-paying state (`past_due`, `canceled`, or an expired trial), writes are rejected:

```
HTTP 402 Payment Required
{ "code": "SUBSCRIPTION_READ_ONLY", "message": "..." }
```

- **Reads (GET) always work**, even in read-only mode.
- `/auth/*` and `/billing/*` are **whitelisted** so the user can still log in, view
  status (`GET /billing/status`), pick a plan (`POST /billing/select-plan`) or start the
  pro trial (`POST /billing/start-pro-trial`) to lift the lock.

Clients must handle `402 SUBSCRIPTION_READ_ONLY` distinctly from `401`/`403`: show a
"subscription expired — renew to continue" prompt, not a logout.

---

## 6. How iOS must store tokens

**Store both tokens in the iOS Keychain. Never in `UserDefaults`.**

| Aspect | Requirement |
|--------|-------------|
| Storage | Keychain (`kSecClassGenericPassword`). `UserDefaults` is unencrypted plist — unacceptable for credentials. |
| Accessibility | `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` — usable for background refresh, not synced to other devices/iCloud, not exported in backups. |
| On login | Save `accessToken` + `refreshToken` to Keychain. |
| On every request | Read access token from Keychain, send `Authorization: Bearer …`. |
| On 401 | Call `/auth/refresh-token` with the stored refresh token, overwrite both tokens in Keychain, retry once. |
| On logout | Call `POST /auth/logout`, then **delete** both Keychain items. |
| On 402 (`SUBSCRIPTION_READ_ONLY`) | Keep tokens; route the user to billing. |

The auth contract is identical to web — only the storage medium changes (web uses
`localStorage`; iOS uses Keychain). See
[`adr/0004-native-swiftui-ios-client.md`](./adr/0004-native-swiftui-ios-client.md).
