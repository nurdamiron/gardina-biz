# ADR 0002 — Stateless JWT authentication

Status: Accepted

## Context

Gardina serves multiple client types over one HTTP API: the React web app, a Telegram
bot, and (soon) a native iOS app. Auth must work identically across all of them, scale
horizontally on EC2, and carry the tenant + role needed for multi-tenant authorization.

Options considered:
- Server-side sessions with a shared session store (Redis).
- **Stateless JWTs** (access + refresh) with bcrypt password hashing.

## Decision

Use **stateless JWT Bearer auth**: a 7-day **access token** and a 30-day **refresh
token**, passwords hashed with **bcrypt**.

- `Authorization: Bearer <accessToken>` on protected requests.
- `POST /auth/refresh-token` mints a new pair from a valid refresh token.
- The auth middleware verifies the token, loads the user, and binds the tenant context.
- Logout adds the access token to an **in-memory blacklist** for best-effort revocation.

## Consequences

**Positive**
- No session store needed; any backend instance can validate any request → easy horizontal
  scaling on EC2.
- Identical flow for web, bot, and iOS — only token storage differs per client.
- Tenant `organization_id` and `role` travel with the request, enabling per-request tenant
  scoping and `authorize(...roles)` gating.

**Negative**
- Revocation is hard with stateless tokens. The in-memory blacklist is per-process and
  cleared on restart — not a hard guarantee across multiple instances.
- A leaked access token is valid until it expires (up to 7 days).
- Refresh-token rotation/storage is a client responsibility (web `localStorage`, iOS
  Keychain).

**Mitigations**
- Keep access-token lifetime bounded; require clients to discard tokens on logout.
- If hard revocation / multi-instance logout becomes a requirement, move the blacklist to
  a shared store (Redis) or adopt short-lived access tokens + rotating refresh tokens.
- iOS must store tokens in the Keychain (see `AUTH.md`).
