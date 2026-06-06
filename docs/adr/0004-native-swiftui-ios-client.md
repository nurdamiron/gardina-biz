# ADR 0004 — Native SwiftUI iOS client

Status: Accepted

## Context

Gardina needs a mobile app for salon staff (designers, installers, managers) who work
on-site — taking measurements, photographing windows, updating deal status, checking
schedules. The backend, database, business logic, OpenAPI contract, and JWT auth already
exist and stay **unchanged**; the mobile app is a new client only (see
`ARCHITECTURE.md` §6).

There is **one shared API contract** ([`openapi.yaml`](../openapi.yaml)) and, for now,
**no Android requirement**. The team values native iOS UX (camera, photo capture, offline
behavior, push) over cross-platform breadth.

Options considered:
- **React Native** — reuse some web React skills, one codebase for future Android.
- **Flutter** — single codebase, good UI consistency, Dart toolchain.
- **Native SwiftUI** — first-class iOS UX and platform APIs, no cross-platform runtime.

## Decision

Build the iOS app as a **native SwiftUI** client.

Rationale:
- **Single shared API contract** already isolates all business logic server-side, so the
  main cross-platform argument (code reuse of logic) is largely moot — every client just
  consumes the same `/api`. The win from a shared UI layer is small.
- **Native UX**: SwiftUI gives the best camera/photo, Keychain, navigation, and
  notification integration for an on-site, photo-heavy workflow.
- **No Android requirement now**: a cross-platform runtime's main payoff (one codebase for
  iOS + Android) does not apply, so it adds dependency/runtime overhead for no current
  benefit.

The iOS client:
- Generates/hand-writes its HTTP client from `openapi.yaml`.
- Uses the existing JWT flow; stores tokens in the **Keychain** (not `UserDefaults`) —
  see `AUTH.md`.
- Sends the `Bearer` token; all RBAC and tenant isolation remain server-side.
- Later migrates notifications from Web Push to **APNs** (additive backend work; see
  `DEPENDENCIES.md`).

## Consequences

**Positive**
- Best-in-class iOS UX and platform-API access; smallest runtime footprint.
- Zero backend changes to ship v1 (contract, auth, logic all reused).
- Clean separation: contract drives the client; server stays the single source of truth.

**Negative**
- No code sharing with the React web app or a future Android app.
- If Android becomes required later, it is a separate native (or cross-platform) build —
  this decision is explicitly scoped to "no Android now" and should be revisited then.
- Requires Swift/iOS expertise distinct from the web stack.

**Revisit when**: an Android app becomes a firm requirement, or team composition shifts
toward favoring a single cross-platform codebase.
