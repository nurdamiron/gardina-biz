import http2 from 'node:http2';
import jwt from 'jsonwebtoken';

/**
 * APNsService — sends native iOS push notifications via Apple Push Notification
 * service over HTTP/2 using token-based (.p8) auth. No third-party dependency:
 * the provider JWT is signed with the existing `jsonwebtoken` package (ES256)
 * and delivery uses Node's built-in http2.
 *
 * Required env (iOS push disabled if any is missing — falls back to log-only,
 * mirroring PushService/EmailService):
 *   APNS_KEY_ID      — Key ID of the APNs Auth Key (.p8)
 *   APNS_TEAM_ID     — Apple Developer Team ID
 *   APNS_KEY_P8      — contents of the .p8 file (literal \n are converted)
 *   APNS_BUNDLE_ID   — app bundle id (default kz.gardina.app)
 *   APNS_PRODUCTION  — 'true' for api.push.apple.com, else sandbox
 */
const APNS_HOST_PROD = 'https://api.push.apple.com';
const APNS_HOST_DEV = 'https://api.sandbox.push.apple.com';

export class APNsService {
  constructor() {
    this.keyId = process.env.APNS_KEY_ID;
    this.teamId = process.env.APNS_TEAM_ID;
    this.bundleId = process.env.APNS_BUNDLE_ID || 'kz.gardina.app';
    // Allow the .p8 to be provided as a single-line env with escaped newlines.
    this.privateKey = (process.env.APNS_KEY_P8 || '').replace(/\\n/g, '\n');
    this.production = String(process.env.APNS_PRODUCTION || 'false') === 'true';
    this.host = this.production ? APNS_HOST_PROD : APNS_HOST_DEV;

    this.isConfigured = Boolean(this.keyId && this.teamId && this.privateKey);

    // Provider token cache. Apple wants the token refreshed within 60 minutes
    // and no more often than every 20 — we regenerate every 45 minutes.
    this._token = null;
    this._tokenIssuedAt = 0;

    if (this.isConfigured) {
      console.log(`APNsService: configured (bundle=${this.bundleId}, ${this.production ? 'production' : 'sandbox'})`);
    } else {
      console.warn('APNsService: not configured (APNS_KEY_ID/APNS_TEAM_ID/APNS_KEY_P8) — iOS push disabled');
    }
  }

  /** Cached ES256 provider JWT, refreshed every ~45 minutes. */
  _providerToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this._token && now - this._tokenIssuedAt < 45 * 60) {
      return this._token;
    }
    this._token = jwt.sign(
      { iss: this.teamId, iat: now },
      this.privateKey,
      { algorithm: 'ES256', header: { alg: 'ES256', kid: this.keyId } }
    );
    this._tokenIssuedAt = now;
    return this._token;
  }

  /**
   * Send an alert push to a single APNs device token.
   * @returns {Promise<{success: boolean, status?: number, reason?: string}>}
   * Caller deactivates the subscription when reason is BadDeviceToken /
   * Unregistered / DeviceTokenNotForTopic or status 410.
   */
  async send(deviceToken, payload = {}) {
    if (!this.isConfigured) return { success: false, reason: 'not_configured' };
    if (!deviceToken) return { success: false, reason: 'missing_token' };

    const aps = {
      alert: { title: payload.title || 'Gardina', body: payload.body || '' },
      sound: 'default',
    };
    if (Number.isFinite(payload.badge)) aps.badge = payload.badge;
    const body = JSON.stringify({ aps, ...(payload.data ? { data: payload.data } : {}) });

    return new Promise((resolve) => {
      let settled = false;
      const done = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      let client;
      try {
        client = http2.connect(this.host);
      } catch (err) {
        return done({ success: false, reason: err.message });
      }

      const closeClient = () => { try { client.close(); } catch { /* noop */ } };
      client.on('error', (err) => { done({ success: false, reason: err.message }); closeClient(); });

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        authorization: `bearer ${this._providerToken()}`,
        'apns-topic': this.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      });

      let status = 0;
      let data = '';
      req.setEncoding('utf8');
      req.on('response', (headers) => { status = headers[':status']; });
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        closeClient();
        if (status === 200) return done({ success: true, status });
        let reason = data;
        try { reason = JSON.parse(data).reason || data; } catch { /* keep raw */ }
        done({ success: false, status, reason });
      });
      req.on('error', (err) => { closeClient(); done({ success: false, reason: err.message }); });
      req.setTimeout(10000, () => { closeClient(); done({ success: false, reason: 'timeout' }); });

      req.end(body);
    });
  }
}

export const apnsService = new APNsService();
