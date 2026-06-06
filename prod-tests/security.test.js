// Security tests — the automated subset of security-checklist.md.
// 100% read-only / non-destructive. Safe against production.
//
// What is automated here:
//   - Security headers (helmet): CSP, X-Content-Type-Options, X-Frame-Options,
//     HSTS over HTTPS, no X-Powered-By.
//   - Unauthenticated access is rejected (401) on protected routes.
//   - PII / stack-trace leak: error responses must not include a `stack` field.
//   - Horizontal IDOR probe (gated): a random/foreign UUID must 404, not leak.
//
// Manual items (escalation matrix, injection fuzzing, rate-limit hammering,
// npm audit) live in security-checklist.md.

import { describe, it, expect } from 'vitest';
import { config, rootUrl, http, authHeaders, hasTestAccount, loginTestAccount } from './config.js';

describe('security: HTTP security headers', () => {
  it('X-Content-Type-Options: nosniff', async () => {
    const { headers } = await http(`${rootUrl}/health`);
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('Content-Security-Policy present', async () => {
    const { headers } = await http(`${rootUrl}/health`);
    expect(headers.get('content-security-policy')).toBeTruthy();
  });

  it('Clickjacking protection (X-Frame-Options or CSP frame-ancestors)', async () => {
    const { headers } = await http(`${rootUrl}/health`);
    const xfo = headers.get('x-frame-options');
    const csp = headers.get('content-security-policy') || '';
    expect(Boolean(xfo) || csp.includes('frame-ancestors')).toBe(true);
  });

  it('No X-Powered-By fingerprint', async () => {
    const { headers } = await http(`${rootUrl}/health`);
    expect(headers.get('x-powered-by')).toBeNull();
  });

  it('HSTS over HTTPS', async () => {
    if (!rootUrl.startsWith('https://')) return;
    const { headers } = await http(`${rootUrl}/health`);
    expect(headers.get('strict-transport-security') || '').toContain('max-age=');
  });
});

describe('security: auth enforcement', () => {
  const protectedReads = ['/deals', '/clients', '/catalog/products', '/analytics/dashboard-stats', '/users'];
  for (const path of protectedReads) {
    it(`${path} requires auth -> 401`, async () => {
      const { status } = await http(path);
      expect(status).toBe(401);
    });
  }
});

describe('security: no stack-trace / verbose error leak', () => {
  it('error responses do not include a stack field', async () => {
    // Force a 404 from the global handler and a 401 from auth; neither should
    // ever ship a `stack` (only emitted when NODE_ENV=development).
    const notFound = await http('/this-route-does-not-exist-xyz');
    expect(notFound.body && typeof notFound.body === 'object'
      ? notFound.body.stack
      : undefined).toBeUndefined();

    const unauth = await http('/deals');
    expect(unauth.body && typeof unauth.body === 'object'
      ? unauth.body.stack
      : undefined).toBeUndefined();
  });
});

// IDOR probe is read-only: it requests a foreign/random UUID and asserts the API
// returns 404 (tenant-scoped not-found) rather than another tenant's data.
const idorDescribe = hasTestAccount() ? describe : describe.skip;
idorDescribe('security: horizontal IDOR probe (read-only)', () => {
  it('a random deal UUID returns 404, not another tenant data', async () => {
    const { accessToken } = await loginTestAccount();
    const randomUuid = '00000000-0000-4000-8000-000000000000';
    const { status, body } = await http(`/deals/${randomUuid}`, {
      headers: authHeaders(accessToken),
    });
    // 404 (correct), 400 (bad id) acceptable. 200 would mean cross-tenant leak.
    expect([400, 404]).toContain(status);
    if (status === 200) {
      throw new Error(`IDOR: random UUID returned data: ${JSON.stringify(body)}`);
    }
  });
});
