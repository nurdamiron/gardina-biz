# Gardina iOS — App Store Release Checklist

App: **Gardina** — multi-tenant SaaS ERP for curtain/drapery salons
Bundle ID: `kz.gardina.app` · Platform: iOS 17+ · SwiftUI native
Distribution: B2B SaaS, login-gated, **no in-app purchases** (subscription billed on the web platform).

Work top-to-bottom. Each box must be checked before submitting for review.

---

## 0. Pre-flight gaps (DO THESE FIRST — they block submission)
- [x] **Account deletion endpoint** — ✅ DONE. `DELETE /api/auth/me` (password-confirmed, GDPR-style erasure, last-admin guard, read-only-safe) + in-app Profile → "Удалить аккаунт" flow are implemented. See `ACCOUNT-DELETION.md`. *Remaining: verify end-to-end on a simulator build.*
- [ ] **Privacy policy hosted at a public URL** — draft in `PRIVACY-POLICY.md` must be published (e.g. `https://gardina.kz/privacy` or `https://app.gardina.kz/privacy`) and linked both in-app and in the listing.
- [x] **Push notifications migrated to APNs** — ✅ DONE in code. `APNsService` (http2 + .p8 ES256) + `POST /api/notifications/push/apns` + iOS `PushManager` (Push Notifications capability, `aps-environment` entitlement) are implemented. *Remaining (ops): create the APNs Auth Key (.p8) in the Apple Developer portal and set `APNS_KEY_ID`/`APNS_TEAM_ID`/`APNS_KEY_P8` on the backend; set `aps-environment`→`production` + `APNS_PRODUCTION=true` for the App Store build.*
- [ ] **Demo / App Review account** provisioned on a seeded tenant (see §8).

---

## 1. Apple Developer account & identifiers
- [ ] Apple Developer Program membership active (Organization account recommended for B2B; D-U-N-S verified).
- [ ] App ID created in Apple Developer portal with explicit bundle ID `kz.gardina.app` (no wildcard).
- [ ] Capabilities enabled on the App ID matching the entitlements actually used:
  - [ ] Push Notifications (only if APNs ships in v1)
  - [ ] Associated Domains (only if Universal Links / deep links used)
- [ ] App record created in App Store Connect, SKU set, primary language = Russian (or English — pick one, stay consistent).
- [ ] Tax, banking & paid-apps agreements: not required (free app, no IAP) — confirm "Paid Apps" agreement is **not** needed and the app is set to Free.

## 2. Signing & certificates
Choose ONE approach and document it in the repo:
- [ ] **Option A — Xcode automatic signing**: "Automatically manage signing" on, correct team selected, Release config produces a Distribution provisioning profile.
- [ ] **Option B — fastlane match**: private certs repo configured, `match appstore` run, profiles installed on CI. Recommended if releasing from CI.
- [ ] Distribution certificate valid and not expiring within the review window.
- [ ] Provisioning profile includes the exact entitlements declared (push, etc.).

## 3. Build requirements
- [ ] Built with the latest released Xcode and latest iOS SDK (Apple rejects builds on outdated SDKs).
- [ ] Deployment target = iOS 17.0.
- [ ] **App icon**: full set present in asset catalog including 1024×1024 marketing icon (no alpha, no transparency, no rounded corners — square, opaque).
- [ ] **Launch screen**: storyboard or SwiftUI launch screen present (no static splash image-only fallback that Apple flags).
- [ ] **ATS**: `NSAppTransportSecurity` left to default (HTTPS-only). No `NSAllowsArbitraryLoads`. API is HTTPS (`https://api.gardina.alashed.kz`) so no exceptions needed. See `INFO-PLIST-KEYS.md`.
- [ ] **App thinning / Bitcode**: Bitcode is deprecated — leave off. Ensure asset catalog enables app thinning (default). Ship via App Store Connect for on-demand slicing.
- [ ] Build version & marketing version set (e.g. `1.0.0` / build `1`); increment build on every upload.
- [ ] No debug-only code, no `print`/log of tokens, Sentry DSN points at prod, no localhost API base in Release config.
- [ ] dSYMs uploaded (for Sentry symbolication).

## 4. Privacy — required files & declarations
- [ ] **Privacy Manifest** (`PrivacyInfo.xcprivacy`) bundled in the app target. Provided at `gardina-ios/Sources/Resources/PrivacyInfo.xcprivacy`.
- [ ] **App Privacy "nutrition labels"** completed in App Store Connect matching the manifest: Contact Info (name, email, phone), User Content (photos, customer/business data), Identifiers (user ID) — all **App Functionality**, **linked to user**, **not used for tracking**. See `METADATA.md` §App Privacy.
- [ ] **App Tracking Transparency (ATT)**: app does NOT track across other apps/sites → `NSPrivacyTracking = false`, **no** `NSUserTrackingUsageDescription`, **no** ATT prompt. Only add ATT if a tracking SDK is later introduced.
- [ ] **Info.plist usage strings** present for every sensitive API: `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription` (if camera capture used), `NSPhotoLibraryAddUsageDescription` (only if saving to library). See `INFO-PLIST-KEYS.md`.
- [ ] **Required-reason API** declarations in the manifest (UserDefaults `CA92.1`, file timestamp `C617.1` if file metadata read). Verify against actual SDK usage before submitting.
- [ ] **Privacy policy URL** entered in App Store Connect and reachable.

## 5. Account & data deletion (login app requirement)
- [x] In-app "Delete account" action reachable from Profile/Settings (not buried, not web-only).
- [x] Backend `DELETE /api/auth/me` (or equivalent) implemented and wired. See `ACCOUNT-DELETION.md`.
- [x] Deletion removes/anonymizes personal data and revokes tokens; multi-tenant rules documented (admin-of-tenant vs. regular member — `409 LAST_ADMIN`).
- [ ] Account deletion mention added to App Review notes.

## 6. Encryption / export compliance
- [ ] App uses only standard HTTPS/TLS (no custom/proprietary crypto).
- [ ] Set `ITSAppUsesNonExemptEncryption = NO` in Info.plist (standard HTTPS exemption) to skip per-build compliance questionnaire.
- [ ] If you ever add non-exempt crypto, file the annual self-classification report with BIS.

## 7. Metadata & assets
- [ ] App name ≤ 30 chars, subtitle ≤ 30, promotional text ≤ 170, keywords ≤ 100. See `METADATA.md`.
- [ ] Description filled for each localization (RU primary; KZ; EN).
- [ ] Category = **Business** (secondary: Productivity).
- [ ] Age rating questionnaire completed (expected 4+).
- [ ] Support URL and Marketing URL set and live.
- [ ] Screenshots uploaded: 6.7" (1290×2796) **required**, 6.5" (1242×2688) recommended, iPad 12.9" (2048×2732) **only if iPad supported**.
- [ ] No placeholder text, no Lorem Ipsum, no broken links anywhere in build or listing.

## 8. App Review prep (login-gated app)
- [ ] **Demo account credentials** in App Review notes (login + password, and `organizationSlug` if required by `/auth/login`).
- [ ] Demo tenant seeded with realistic data (clients, measurements, deals, catalog) so reviewer sees a working app, not empty states.
- [ ] Reviewer notes explain: B2B SaaS, subscription billed externally (no IAP), what each tab does, how to reach account deletion, how to test photo upload.
- [ ] All deep links / external links in-app resolve (privacy policy, support).
- [ ] No "coming soon" / disabled features visible.

## 9. Submission & rollout
- [ ] Upload build via Xcode Organizer or `fastlane deliver` / `pilot`.
- [ ] (Optional) TestFlight internal/external pass before production submit.
- [ ] Build attached to the App Store version; "Manually release" or "Auto-release" chosen.
- [ ] **Phased release for automatic updates** enabled (7-day staged rollout for future updates; first release goes 100% on approval).
- [ ] Submit for review.

## 10. Post-approval
- [ ] Verify live listing, privacy policy link, and support URL.
- [ ] Monitor Sentry + crash reports + App Store reviews for the first 72h.
- [ ] Confirm phased rollout progressing as expected.
