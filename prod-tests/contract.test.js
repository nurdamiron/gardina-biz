// Contract tests — assert main READ endpoints match the OpenAPI shapes in
// docs/openapi.yaml, plus negative auth cases (401/403).
//
// SAFETY:
//   - Read-only by default. Auth happy-path uses the configured ISOLATED test
//     account.
//   - Write tests (create/delete) are gated behind ALLOW_WRITES=true, use the
//     test tenant, and clean up after themselves. They are SKIPPED otherwise.
//   - If no test account is configured, account-dependent tests are SKIPPED
//     (not failed) so the unauthenticated negative cases still run.

import { describe, it, expect, beforeAll } from 'vitest';
import { config, http, authHeaders, hasTestAccount, loginTestAccount } from './config.js';

const ISO = /^\d{4}-\d{2}-\d{2}T/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEAL_STATUS = [
  'lead', 'measurement_scheduled', 'measurement_done', 'proposal_sent',
  'proposal_accepted', 'contract_signed', 'in_production', 'ready_for_installation',
  'installation_scheduled', 'installed', 'completed', 'cancelled',
];
const USER_ROLES = ['designer', 'manager', 'production', 'installer', 'admin', 'sales'];

const authed = hasTestAccount();
const describeAuthed = authed ? describe : describe.skip;

let token = null;
let me = null;

beforeAll(async () => {
  if (!authed) return;
  const session = await loginTestAccount();
  token = session.accessToken;
  me = session.user;
});

// ─────────────────────────── Negative auth (always run) ─────────────────────

describe('contract: auth negative cases', () => {
  it('GET /auth/me with no token -> 401', async () => {
    const { status } = await http('/auth/me');
    expect(status).toBe(401);
  });

  it('GET /auth/me with malformed token -> 401', async () => {
    const { status } = await http('/auth/me', {
      headers: { Authorization: 'Bearer not-a-real-jwt' },
    });
    expect(status).toBe(401);
  });

  it('GET /deals with no token -> 401', async () => {
    const { status } = await http('/deals');
    expect(status).toBe(401);
  });

  it('POST /auth/login with bad credentials -> 401 (or 429 if rate-limited)', async () => {
    const { status } = await http('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'definitely-not-a-user-000@example.invalid',
        password: 'wrong-password-xyz',
      }),
    });
    expect([400, 401, 429]).toContain(status);
  });
});

// ─────────────────────────── Auth happy path ────────────────────────────────

describeAuthed('contract: auth happy path', () => {
  it('login returned a token + user envelope', () => {
    expect(token).toBeTruthy();
    expect(me).toBeTruthy();
    expect(me.role && USER_ROLES.includes(me.role)).toBe(true);
  });

  it('GET /auth/me -> 200 with User shape', async () => {
    const { status, body } = await http('/auth/me', { headers: authHeaders(token) });
    expect(status).toBe(200);
    const user = body?.data ?? body;
    expect(user.id).toMatch(UUID);
    expect(user.organizationId).toMatch(UUID);
    expect(typeof user.name).toBe('string');
    expect(USER_ROLES).toContain(user.role);
  });
});

// ─────────────────────────── Read endpoints ─────────────────────────────────

describeAuthed('contract: GET /deals', () => {
  it('-> 200 with { success, data[], pagination }', async () => {
    const { status, body } = await http('/deals?limit=5', { headers: authHeaders(token) });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.pagination) {
      expect(typeof body.pagination.page).toBe('number');
      expect(typeof body.pagination.total).toBe('number');
    }
    if (body.data.length) {
      const d = body.data[0];
      expect(d.id).toMatch(UUID);
      expect(DEAL_STATUS).toContain(d.status);
      expect(d.createdAt === undefined || ISO.test(d.createdAt)).toBe(true);
    }
  });
});

describeAuthed('contract: GET /clients', () => {
  it('-> 200 with { success, data[] }', async () => {
    const { status, body } = await http('/clients?limit=5', { headers: authHeaders(token) });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length) {
      const c = body.data[0];
      expect(c.id).toMatch(UUID);
      expect(typeof c.name).toBe('string');
      expect(typeof c.phone).toBe('string');
    }
  });
});

describeAuthed('contract: GET /catalog/products', () => {
  it('-> 200 with { success, data[] }', async () => {
    const { status, body } = await http('/catalog/products?limit=5', {
      headers: authHeaders(token),
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length) {
      const p = body.data[0];
      expect(p.id).toMatch(UUID);
      expect(typeof p.name).toBe('string');
    }
  });
});

describeAuthed('contract: GET /analytics/dashboard-stats', () => {
  it('-> 200 with { success, data:object }', async () => {
    const { status, body } = await http('/analytics/dashboard-stats', {
      headers: authHeaders(token),
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data).toBe('object');
    expect(body.data).not.toBeNull();
  });
});

// ─────────────────────────── Vertical-escalation (RBAC) ──────────────────────
// revenue-breakdown is admin-only. A non-admin test account must get 403.
// Admin-only endpoints are not asserted for non-admins beyond "not 200" so the
// suite stays correct regardless of the test account's role.

describeAuthed('contract: RBAC / vertical escalation', () => {
  it('non-admin cannot read admin-only /analytics/revenue-breakdown', async () => {
    if (me?.role === 'admin') {
      const { status } = await http('/analytics/revenue-breakdown', {
        headers: authHeaders(token),
      });
      expect([200, 400]).toContain(status); // admin allowed
      return;
    }
    const { status } = await http('/analytics/revenue-breakdown', {
      headers: authHeaders(token),
    });
    expect(status).toBe(403);
  });
});

// ─────────────────────────── Write tests (gated, self-cleaning) ──────────────
// Only run on staging / throwaway tenant. Never against real prod data.

const describeWrites = (authed && config.allowWrites) ? describe : describe.skip;

describeWrites('contract: write round-trip (create + delete a test client)', () => {
  let createdId = null;

  it('POST /clients creates a client', async () => {
    const marker = `PRODTEST-${Date.now()}`;
    const { status, body } = await http('/clients', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        name: marker,
        phone: `+7700${String(Date.now()).slice(-7)}`,
        notes: 'Automated prod-test client — safe to delete.',
        tags: ['prod-test'],
      }),
    });
    // 402 means the tenant is in read-only billing mode — acceptable, just skip.
    if (status === 402) return;
    expect(status).toBe(201);
    const client = body?.data ?? body;
    expect(client.id).toMatch(UUID);
    createdId = client.id;
  });

  it('DELETE /clients/:id cleans up', async () => {
    if (!createdId) return; // nothing created (read-only mode or skip)
    const { status } = await http(`/clients/${createdId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    expect([200, 204]).toContain(status);
  });
});
