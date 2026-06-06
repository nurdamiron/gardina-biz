# Gardina iOS — Required Info.plist Keys

Bundle ID: `kz.gardina.app` · iOS 17+

These keys must be present in the app target's Info.plist. Usage-description
strings are shown in Russian (primary) and English. Localize via
`InfoPlist.strings` per language (ru, kk, en). The visible language must match
the device locale — provide RU + KZ + EN.

---

## 1. Privacy usage descriptions (purpose strings)

Every sensitive-API access needs a clear, specific reason or the app is rejected.

### NSPhotoLibraryUsageDescription  (REQUIRED — staff attach photos to measurements)
- **RU:** `Gardina использует доступ к фотографиям, чтобы прикреплять снимки замеров и окон к заказам клиентов.`
- **EN:** `Gardina needs access to your photos so you can attach measurement and window photos to client orders.`

### NSCameraUsageDescription  (REQUIRED if the app captures photos in-app)
- **RU:** `Gardina использует камеру, чтобы фотографировать окна и замеры прямо на объекте и добавлять их к заказу.`
- **EN:** `Gardina uses the camera to photograph windows and measurements on site and add them to the order.`

### NSPhotoLibraryAddUsageDescription  (ONLY if the app saves images back to the library)
- **RU:** `Gardina сохраняет подготовленные изображения и документы в вашу галерею.`
- **EN:** `Gardina saves generated images and documents to your photo library.`

> If a given capability is not in the v1 build, **omit its key entirely** — do
> not ship an unused permission string (Apple flags unused entitlements/keys).
> Notably: include `NSCameraUsageDescription` only if camera capture exists, and
> `NSPhotoLibraryAddUsageDescription` only if the app writes to the library.

---

## 2. App Transport Security (ATS)

The backend API is HTTPS-only (`https://api.gardina.alashed.kz/api`), so **no
ATS exceptions are needed**. Do NOT add `NSAllowsArbitraryLoads`.

Leave ATS at its secure default (preferred — simplest, no key required), i.e. do
not add an `NSAppTransportSecurity` dictionary at all. If you must declare it
explicitly, the only acceptable form is:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

---

## 3. Encryption export compliance

Standard HTTPS/TLS only — claim the exemption to skip the per-upload questionnaire:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

---

## 4. Supported orientations

Phone: portrait only (forms/lists UX). iPad (if supported): all orientations.

```xml
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

---

## 5. Localization

```xml
<key>CFBundleDevelopmentRegion</key>
<string>ru</string>
<key>CFBundleLocalizations</key>
<array>
    <string>ru</string>
    <string>kk</string>
    <string>en</string>
</array>
```

---

## 6. Push notifications (only if APNs ships in v1)

No Info.plist usage string is required for push, but ensure:
- `UIBackgroundModes` includes `remote-notification` **only if** silent/background push is used.
- The Push Notifications capability is enabled (entitlement), and the backend
  is migrated from Web Push (VAPID) to APNs. If push is not in v1, omit all of this.

---

## Quick reference — keys to ship in v1 (assuming photo upload, no library-write)

| Key | Ship? |
|-----|-------|
| `NSPhotoLibraryUsageDescription` | Yes |
| `NSCameraUsageDescription` | Yes if camera capture exists |
| `NSPhotoLibraryAddUsageDescription` | Only if saving to library |
| `NSAppTransportSecurity` | Omit (secure default) |
| `ITSAppUsesNonExemptEncryption = NO` | Yes |
| `UISupportedInterfaceOrientations` | Yes |
| `NSUserTrackingUsageDescription` | **No** (no tracking) |
