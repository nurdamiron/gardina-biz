# Gardina iOS — Account Deletion (App Store Requirement)

Apple **App Review Guideline 5.1.1(v)** requires that any app supporting account
creation must let users **initiate account deletion from within the app**. This
is a hard rejection cause. Gardina is login-gated, so this is mandatory.

---

## ✅ IMPLEMENTED

Both the backend endpoint and the in-app flow are now in place.

**Backend** — `DELETE /api/auth/me` (Bearer), added in:
- `gardina-backend/src/presentation/http/routes/auth.routes.js` — route, behind `authenticate`.
- `gardina-backend/src/presentation/http/controllers/AuthController.js` — `deleteAccount()`.
- `gardina-backend/src/infrastructure/repositories/PostgresUserRepository.js` — `countActiveAdmins()`, `anonymizeAndDeactivate()`.

**iOS** — Profile → "Удалить аккаунт" → password-confirm sheet:
- `gardina-ios/Sources/Features/Home/ProfileView.swift` — `DeleteAccountSheet`.
- `gardina-ios/Sources/Core/Auth/AuthService.swift` — `deleteAccount(password:)`.
- `gardina-ios/Sources/Core/Auth/SessionStore.swift` — `deleteAccount(password:)` (signs out on success).

Documented in the contract: `docs/openapi.yaml` → `DELETE /auth/me`.

---

## Behavior as implemented

1. **Authenticate** via the existing `authenticate` middleware.
2. **Re-confirm** identity: the current password is required in the body and
   verified with bcrypt before anything is deleted.
3. **Multi-tenant rule (last-admin guard):** if the caller is an `admin` and is
   the **only active admin** of the organization, the request is rejected with
   `409 { code: "LAST_ADMIN" }` and a message telling them to transfer admin
   rights or contact support — this prevents orphaning a whole tenant. Any other
   member (or a non-sole admin) proceeds.
4. **GDPR-style erasure (not a hard row delete):** personal data is stripped
   (`email → NULL`, `name → "Удалённый аккаунт"`, `phone → "deleted:<id>"`,
   `avatar_url → NULL`) and the account is deactivated (`is_active = false`) with
   an **unusable random password hash**, so it can never log in again. The row is
   kept so the org's business records (deals/measurements that FK to the user) stay
   intact — full hard-delete would violate those foreign keys.
5. **Token revoked**: the current access token is added to the logout blacklist.
6. Returns `200 { success: true }`; the app clears Keychain tokens and returns to login.

> Read-only mode (402 `SUBSCRIPTION_READ_ONLY`) does **not** block deletion: the
> endpoint lives under `/auth`, which is whitelisted from the read-only gate
> (`auth.middleware.js:102`). Verified.

---

## In-app flow (SwiftUI) — as built

1. Entry: **Profile → "Удалить аккаунт"** (destructive/red, always reachable).
2. Tap → `DeleteAccountSheet`: explains consequences + requires the current password.
3. Calls `DELETE /api/auth/me` with the password in the body.
4. On success: `SessionStore` clears tokens and flips to `.unauthenticated`;
   `RootView` swaps in the login screen.
5. Errors surfaced inline: wrong password (`401`), last-admin (`409 LAST_ADMIN`).

## App Review notes
Tell the reviewer exactly where deletion lives:
`Account deletion: Profile (Профиль) → Удалить аккаунт → confirm with password.`

## Checklist
- [x] Backend `DELETE /api/auth/me` implemented.
- [x] Sole-admin / tenant-owner case handled (`409 LAST_ADMIN`) and documented.
- [x] Token revoked on deletion (logout blacklist).
- [x] Personal data anonymized + account deactivated per PRIVACY-POLICY.md.
- [x] Deletion works even in subscription read-only mode (`/auth` whitelisted).
- [x] In-app Delete Account UI shipped and reachable.
- [x] Documented in OpenAPI contract.
- [ ] **Manual:** verify end-to-end on a simulator build with a seeded account.
- [ ] **Optional:** write an explicit `audit_logs` entry for the deletion (not yet wired).
- [ ] App Review notes mention the deletion path (add to METADATA.md review notes).
