// ============================================================================
// k6 low-rate, READ-ONLY smoke load profile for Gardina.
//
//  ⚠️  RUN ON STAGING OR DURING A LOW-TRAFFIC MAINTENANCE WINDOW ONLY.  ⚠️
//
//  This script generates sustained traffic. Pointing it at PRODUCTION during
//  business hours can trip the API rate limiter (100 req / 15min / IP), skew
//  analytics, and degrade real users. It is intentionally LOW RATE and
//  READ-ONLY (GET /health + authed GET /deals). It NEVER writes data.
//
//  Run:
//    BASE_URL=https://staging-api.gardina.kz/api \
//    TEST_LOGIN=... TEST_PASSWORD=... TEST_ORG_SLUG=... \
//    k6 run load/k6-smoke.js
//
//  Health-only (no account needed):
//    BASE_URL=https://staging-api.gardina.kz/api k6 run load/k6-smoke.js
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// k6 has no Vite collision, so BASE_URL works here; GARDINA_BASE_URL also accepted.
const BASE_URL = (__ENV.GARDINA_BASE_URL || __ENV.BASE_URL || 'https://api.gardina.kz/api').replace(/\/$/, '');
const ROOT_URL = BASE_URL.replace(/\/api$/, '');
const TEST_LOGIN = __ENV.TEST_LOGIN || '';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || '';
const TEST_ORG_SLUG = __ENV.TEST_ORG_SLUG || '';

const errorRate = new Rate('errors');

export const options = {
  // Deliberately low: a handful of VUs, short duration. Stays well under the
  // global 100 req/15min limiter when run briefly.
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 3,
      duration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'], // p95 latency budget
    errors: ['rate<0.01'],             // < 1% functional errors
    http_req_failed: ['rate<0.01'],    // < 1% transport failures
  },
};

// Authenticate once per VU in setup so we don't hammer /auth/login.
export function setup() {
  if (!TEST_LOGIN || !TEST_PASSWORD) {
    console.warn('No TEST_LOGIN/TEST_PASSWORD — running /health-only profile.');
    return { token: null };
  }
  const payload = { login: TEST_LOGIN, password: TEST_PASSWORD };
  if (TEST_ORG_SLUG) payload.organizationSlug = TEST_ORG_SLUG;

  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
  });
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) {
    console.error(`Login failed (${res.status}); falling back to /health-only.`);
    return { token: null };
  }
  const token = res.json('data.tokens.accessToken');
  return { token };
}

export default function (data) {
  // 1) Liveness — always.
  const health = http.get(`${ROOT_URL}/health`);
  check(health, {
    'health 200': (r) => r.status === 200,
    'health healthy': (r) => r.json('status') === 'healthy',
  }) || errorRate.add(1);

  // 2) Authed read — only if we have a token.
  if (data.token) {
    const deals = http.get(`${BASE_URL}/deals?limit=5`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    check(deals, {
      'deals 200': (r) => r.status === 200,
      'deals data[]': (r) => Array.isArray(r.json('data')),
    }) || errorRate.add(1);
  }

  // Pace requests so a brief run stays under the rate limiter.
  sleep(1);
}
