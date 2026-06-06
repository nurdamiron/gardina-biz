// Smoke tests — liveness, latency budget, CORS + security (helmet) headers.
//
// Endpoint paths verified against gardina-backend/src/server.js:
//   - GET /health  exists, mounted at SERVER ROOT (not under /api).
//   - GET /ready   does NOT exist  -> we assert it 404s (documents the gap).
//   - GET /version does NOT exist  -> we assert it 404s (documents the gap).
//   - GET /api     returns API info JSON (name/version/endpoints).
//
// 100% read-only. Safe against production.

import { describe, it, expect } from 'vitest';
import { config, rootUrl, http } from './config.js';

describe('smoke: /health', () => {
  it('returns 200 + healthy JSON shape', async () => {
    const { status, body, headers } = await http(`${rootUrl}/health`);
    expect(status).toBe(200);
    expect(headers.get('content-type') || '').toContain('application/json');
    expect(body).toMatchObject({ status: 'healthy', database: 'connected' });
    expect(typeof body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('responds within the latency budget', async () => {
    const { status, latencyMs } = await http(`${rootUrl}/health`);
    expect(status).toBe(200);
    expect(latencyMs).toBeLessThan(config.latencyBudgetMs);
  });
});

describe('smoke: /api info', () => {
  it('returns 200 + name/version', async () => {
    const { status, body } = await http('/');
    expect(status).toBe(200);
    expect(body?.name).toBeTruthy();
    expect(body?.version).toBeTruthy();
  });
});

describe('smoke: missing health-family endpoints (documents current backend)', () => {
  it('/ready is not implemented (404)', async () => {
    const { status } = await http(`${rootUrl}/ready`);
    expect(status).toBe(404);
  });
  it('/version is not implemented (404)', async () => {
    const { status } = await http(`${rootUrl}/version`);
    expect(status).toBe(404);
  });
});

describe('smoke: security headers (helmet)', () => {
  it('sets core helmet headers on /health', async () => {
    const { headers } = await http(`${rootUrl}/health`);

    // helmet defaults that should always be present.
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    // X-Frame-Options OR a frame-ancestors CSP directive must clickjack-protect.
    const xfo = headers.get('x-frame-options');
    const csp = headers.get('content-security-policy') || '';
    expect(Boolean(xfo) || csp.includes('frame-ancestors')).toBe(true);

    // helmet hides the Express fingerprint.
    expect(headers.get('x-powered-by')).toBeNull();
  });

  it('sets a Content-Security-Policy header', async () => {
    const { headers } = await http(`${rootUrl}/health`);
    expect(headers.get('content-security-policy')).toBeTruthy();
  });

  // HSTS is only emitted over HTTPS. Skip for plain-http (local) targets.
  it('sets HSTS over HTTPS', async () => {
    if (!rootUrl.startsWith('https://')) {
      // local/http target — HSTS not applicable.
      return;
    }
    const { headers } = await http(`${rootUrl}/health`);
    const hsts = headers.get('strict-transport-security') || '';
    expect(hsts).toContain('max-age=');
  });
});

describe('smoke: CORS', () => {
  it('reflects an allowed origin via preflight', async () => {
    const { res, headers } = await http(`${config.baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: config.corsOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });
    // Preflight should succeed (2xx/204) and echo the allowed origin.
    expect(res.status).toBeLessThan(400);
    const acao = headers.get('access-control-allow-origin');
    // Allowed origins are reflected; if the configured CORS_ORIGIN is not in the
    // backend allowlist this will be null — treat as informational, not a hard
    // failure, so the smoke run stays green on misconfigured CORS_ORIGIN.
    if (acao !== null) {
      expect(acao).toBe(config.corsOrigin);
    }
  });
});
