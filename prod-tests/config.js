// Shared config + helpers for the Gardina production test suite.
//
// SAFETY: This suite is READ-ONLY by default. It NEVER mutates real production
// data unless ALLOW_WRITES=true is explicitly set, and even then write tests
// must use an ISOLATED test account/tenant and clean up after themselves.
//
// Secrets are read from the environment (.env). NEVER hardcode real credentials
// in this file. See .env.example.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Tiny zero-dependency .env loader (avoids pulling in dotenv).
// Only sets keys that are not already present in process.env.
function loadDotEnv() {
  try {
    const raw = readFileSync(join(__dirname, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // No .env file — env vars may be provided some other way. Not fatal.
  }
}
loadDotEnv();

// NOTE: We read GARDINA_BASE_URL (preferred) and fall back to BASE_URL. Vite
// (which vitest builds on) reserves `BASE_URL` and injects it as "/", so a raw
// BASE_URL of "/" or empty is treated as unset.
function resolveBaseUrl() {
  const candidates = [process.env.GARDINA_BASE_URL, process.env.BASE_URL];
  for (const c of candidates) {
    if (c && /^https?:\/\//.test(c)) return c.replace(/\/$/, '');
  }
  return 'https://api.gardina.kz/api';
}

export const config = {
  // Default points at PRODUCTION. Override via GARDINA_BASE_URL (or BASE_URL)
  // for staging/dev.
  baseUrl: resolveBaseUrl(),

  // Test account credentials. MUST be an isolated test user/tenant — not a real
  // customer or admin. Read-only tests still authenticate, so a low-privilege
  // (e.g. designer) test account is preferable.
  testLogin: process.env.TEST_LOGIN || '',
  testPassword: process.env.TEST_PASSWORD || '',
  testOrgSlug: process.env.TEST_ORG_SLUG || '', // optional tenant disambiguation

  // Hard gate for any write/mutation tests. Default OFF.
  allowWrites: process.env.ALLOW_WRITES === 'true',

  // Latency budget (ms) for smoke checks. Generous to avoid flakiness on cold
  // serverless / cross-region; tighten on staging.
  latencyBudgetMs: parseInt(process.env.LATENCY_BUDGET_MS || '3000', 10),

  // Per-request fetch timeout (ms).
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '15000', 10),

  // Origin used for CORS checks (must be an allowed origin to get ACAO back).
  corsOrigin: process.env.CORS_ORIGIN || 'https://app.gardina.kz',
};

// The /health endpoint is mounted at the SERVER ROOT, not under /api.
// (Verified in gardina-backend/src/server.js — there are no /ready or /version
// endpoints in the current backend.)
export const rootUrl = config.baseUrl.replace(/\/api$/, '');

export function hasTestAccount() {
  return Boolean(config.testLogin && config.testPassword);
}

// fetch wrapper with timeout + latency measurement.
export async function http(pathOrUrl, opts = {}) {
  const url = /^https?:\/\//.test(pathOrUrl)
    ? pathOrUrl
    : `${config.baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    const latencyMs = performance.now() - start;
    let body = null;
    const ct = res.headers.get('content-type') || '';
    try {
      body = ct.includes('application/json') ? await res.json() : await res.text();
    } catch {
      body = null;
    }
    return { res, status: res.status, headers: res.headers, body, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Logs in with the configured test account and returns { accessToken, refreshToken, user }.
// Throws if no test account configured or login fails.
export async function loginTestAccount() {
  if (!hasTestAccount()) {
    throw new Error('No TEST_LOGIN / TEST_PASSWORD configured (see .env.example).');
  }
  const payload = {
    login: config.testLogin,
    password: config.testPassword,
  };
  if (config.testOrgSlug) payload.organizationSlug = config.testOrgSlug;

  const { status, body } = await http('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (status !== 200 || !body?.data?.tokens?.accessToken) {
    throw new Error(`Test login failed (status ${status}): ${JSON.stringify(body)}`);
  }
  return {
    accessToken: body.data.tokens.accessToken,
    refreshToken: body.data.tokens.refreshToken,
    user: body.data.user,
  };
}
