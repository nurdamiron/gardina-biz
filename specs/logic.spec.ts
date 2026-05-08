/**
 * Business logic tests — API-level E2E.
 * Tests the full deal lifecycle, state machine transitions,
 * payment validation, and measurement workflow.
 *
 * Runs against localhost:3001 (backend must be running).
 */
import { test, expect, APIRequestContext } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:3001';

// ─── Auth helper ───────────────────────────────────────────────────────────────
async function getToken(request: APIRequestContext, login = 'akbota', password = 'akbota123') {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { login, password },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.data.accessToken as string;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── Shared state across tests in this file ────────────────────────────────────
let token = '';
let userId = '';   // logged-in user id (designer = akbota)
let clientId = '';
let dealId = '';
let measurementId = '';
let windowId = '';
let proposalId = '';

// Unique suffix per test run to avoid phone/email collisions
const RUN_ID = Date.now().toString().slice(-6);

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Authentication', () => {
  test('login returns accessToken and user info', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { login: 'akbota', password: 'akbota123' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.user.role).toBe('designer');
    expect(body.data.user.password_hash).toBeUndefined();
    token = body.data.accessToken;
    userId = body.data.user.id;
  });

  test('GET /api/auth/me returns current user', async ({ request }) => {
    if (!token) token = await getToken(request);
    const res = await request.get(`${API}/api/auth/me`, { headers: headers(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe('designer');
  });

  test('wrong password returns 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { login: 'akbota', password: 'wrongpass' },
    });
    expect(res.status()).toBe(401);
  });

  test('protected route requires token', async ({ request }) => {
    const res = await request.get(`${API}/api/clients`);
    expect(res.status()).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Client CRUD', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('GET /api/clients returns list', async ({ request }) => {
    const res = await request.get(`${API}/api/clients`, { headers: headers(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('POST /api/clients — creates client', async ({ request }) => {
    const res = await request.post(`${API}/api/clients`, {
      headers: headers(token),
      data: {
        name: 'Playwright Test Client',
        phone: `+7700${RUN_ID}`,
        source: 'instagram',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    clientId = body.data?.id || body.id;
    expect(clientId).toBeTruthy();
  });

  test('GET /api/clients/:id — returns client', async ({ request }) => {
    if (!clientId) test.skip();
    const res = await request.get(`${API}/api/clients/${clientId}`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Playwright Test Client');
    expect(body.data.phone).toBe(`+7700${RUN_ID}`);
  });

  test('PUT /api/clients/:id — updates client', async ({ request }) => {
    if (!clientId) test.skip();
    const res = await request.put(`${API}/api/clients/${clientId}`, {
      headers: headers(token),
      data: { name: 'Playwright Updated Client', phone: `+7700${RUN_ID}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe('Playwright Updated Client');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Deal / Order lifecycle', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
    const me = await request.get(`${API}/api/auth/me`, { headers: headers(token) });
    userId = (await me.json()).data.id;
    // Ensure we have a client
    if (!clientId) {
      const res = await request.post(`${API}/api/clients`, {
        headers: headers(token),
        data: { name: 'Playwright Test Client', phone: `+7701${RUN_ID}` },
      });
      const body = await res.json();
      clientId = body.data?.id || body.id;
    }
  });

  test('POST /api/orders — creates deal in SCHEDULED status', async ({ request }) => {
    const res = await request.post(`${API}/api/orders`, {
      headers: headers(token),
      data: {
        clientId,
        designerId: userId,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        address: 'ул. Тест 123, Алматы',
        notes: 'Playwright test deal',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    dealId = body.data?.id || body.id;
    expect(dealId).toBeTruthy();
    // Initial status must be 'scheduled'
    expect(body.data?.status || body.status).toBe('scheduled');
  });

  test('GET /api/orders/:id — returns deal with status', async ({ request }) => {
    if (!dealId) test.skip();
    const res = await request.get(`${API}/api/orders/${dealId}`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('scheduled');
    expect(body.data.clientId || body.data.client_id).toBeTruthy();
  });

  test('GET /api/orders/funnel — returns funnel stats', async ({ request }) => {
    const res = await request.get(`${API}/api/orders/funnel`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Funnel should be an object or array of stage counts
    expect(body.data).toBeTruthy();
  });

  test('invalid status transition is rejected', async ({ request }) => {
    if (!dealId) test.skip();
    // Try to jump straight from SCHEDULED to COMPLETED (invalid)
    const res = await request.patch(`${API}/api/orders/${dealId}/status`, {
      headers: headers(token),
      data: { status: 'completed' },
    });
    // Should be 400 or 422 — not allowed
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Measurement workflow', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
    const me = await request.get(`${API}/api/auth/me`, { headers: headers(token) });
    userId = (await me.json()).data.id;
    if (!clientId) {
      const res = await request.post(`${API}/api/clients`, {
        headers: headers(token),
        data: { name: 'Playwright Meas Client', phone: `+7702${RUN_ID}` },
      });
      clientId = (await res.json()).data?.id;
    }
    if (!dealId) {
      const res = await request.post(`${API}/api/orders`, {
        headers: headers(token),
        data: {
          clientId,
          designerId: userId,
          scheduledDate: new Date(Date.now() + 86400000).toISOString(),
          address: 'ул. Тест 123',
        },
      });
      dealId = (await res.json()).data?.id;
    }
  });

  test('POST /api/measurements — creates measurement', async ({ request }) => {
    const res = await request.post(`${API}/api/measurements`, {
      headers: headers(token),
      timeout: 20_000,
      data: {
        clientId,
        designerId: userId,
        address: 'ул. Тест 123, Алматы',
        notes: 'Playwright measurement test',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    measurementId = body.data?.id || body.id;
    expect(measurementId).toBeTruthy();
  });

  test('PATCH /api/measurements/:id/complete — fails without windows', async ({ request }) => {
    if (!measurementId) test.skip();
    // Business rule: cannot complete measurement without windows
    const res = await request.patch(`${API}/api/measurements/${measurementId}/complete`, {
      headers: headers(token),
    });
    // Should be 400 — "Cannot complete measurement without windows"
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    const message = JSON.stringify(body).toLowerCase();
    expect(message).toMatch(/window|окн|терез/i);
  });

  test('POST /api/measurements/:id/windows — adds window', async ({ request }) => {
    if (!measurementId) test.skip();
    const res = await request.post(`${API}/api/measurements/${measurementId}/windows`, {
      headers: headers(token),
      data: {
        roomName: 'Гостиная',
        solutionType: 'classic',
        dimensions: { width: 200, height: 280 },
        quantity: 1,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    // windowId comes from inside the saved measurement windows array
    const windows = body.data?.windows;
    windowId = Array.isArray(windows) ? windows[windows.length - 1]?.id : body.data?.id;
    expect(windowId).toBeTruthy();
  });

  test('GET /api/measurements/:id/windows/:windowId — returns window', async ({ request }) => {
    if (!measurementId || !windowId) test.skip();
    const res = await request.get(
      `${API}/api/measurements/${measurementId}/windows/${windowId}`,
      { headers: headers(token) },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Dimensions stored as widthCenter (200→200)
    expect(body.data.dimensions?.widthCenter ?? body.data.dimensions?.width).toBe(200);
  });

  test('PUT /api/measurements/:id/windows/:windowId — updates window', async ({ request }) => {
    if (!measurementId || !windowId) test.skip();
    const res = await request.put(
      `${API}/api/measurements/${measurementId}/windows/${windowId}`,
      {
        headers: headers(token),
        data: {
          roomName: 'Гостиная (обновлено)',
          dimensions: { width: 220, height: 280 },
        },
      },
    );
    expect(res.status()).toBe(200);
  });

  test('PATCH /api/measurements/:id/complete — succeeds with windows', async ({ request }) => {
    if (!measurementId) test.skip();
    const res = await request.patch(`${API}/api/measurements/${measurementId}/complete`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.status || body.status).toBe('completed');
  });

  test('cannot add window to completed measurement', async ({ request }) => {
    if (!measurementId) test.skip();
    const res = await request.post(`${API}/api/measurements/${measurementId}/windows`, {
      headers: headers(token),
      data: { name: 'Extra', width: 100, height: 100 },
    });
    // Should be rejected — measurement is completed
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Proposal flow', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('POST /api/proposals — creates proposal linked to measurement', async ({ request }) => {
    if (!measurementId || !clientId) test.skip();
    const res = await request.post(`${API}/api/proposals`, {
      headers: headers(token),
      data: {
        measurementId,
        clientId,
        designerId: userId,
        totalCost: 350000,
        notes: 'Playwright proposal',
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    proposalId = body.data?.id || body.id;
    expect(proposalId).toBeTruthy();
  });

  test('GET /api/proposals/:id — returns proposal', async ({ request }) => {
    if (!proposalId) test.skip();
    const res = await request.get(`${API}/api/proposals/${proposalId}`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.totalCost || body.data.total_cost).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Payment validation', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
    const me = await request.get(`${API}/api/auth/me`, { headers: headers(token) });
    userId = (await me.json()).data.id;
    if (!dealId) {
      if (!clientId) {
        const c = await request.post(`${API}/api/clients`, {
          headers: headers(token),
          data: { name: 'Payment Test Client', phone: `+7703${RUN_ID}` },
        });
        clientId = (await c.json()).data?.id;
      }
      const d = await request.post(`${API}/api/orders`, {
        headers: headers(token),
        data: { clientId, designerId: userId, address: 'Тест' },
      });
      dealId = (await d.json()).data?.id;
    }
  });

  test('payment with amount 0 is rejected', async ({ request }) => {
    const res = await request.post(`${API}/api/payments`, {
      headers: headers(token),
      data: { dealId, type: 'prepayment', amount: 0, method: 'cash' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('payment with negative amount is rejected', async ({ request }) => {
    const res = await request.post(`${API}/api/payments`, {
      headers: headers(token),
      data: { dealId, type: 'prepayment', amount: -1000, method: 'cash' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('payment with invalid type is rejected', async ({ request }) => {
    const res = await request.post(`${API}/api/payments`, {
      headers: headers(token),
      data: { dealId, type: 'bitcoin', amount: 1000, method: 'cash' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('valid prepayment is accepted', async ({ request }) => {
    if (!dealId) test.skip();
    const res = await request.post(`${API}/api/payments`, {
      headers: headers(token),
      data: { dealId, type: 'prepayment', amount: 50000, method: 'cash' },
    });
    expect([200, 201]).toContain(res.status());
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Catalog & Price calculation', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('GET /api/catalog/products — returns products list', async ({ request }) => {
    const res = await request.get(`${API}/api/catalog/products`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeTruthy();
  });

  test('GET /api/catalog/services — returns service rates', async ({ request }) => {
    const res = await request.get(`${API}/api/catalog/services`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });

  test('POST /api/catalog/calculate — calculates price', async ({ request }) => {
    const res = await request.post(`${API}/api/catalog/calculate`, {
      headers: headers(token),
      data: {
        windows: [
          {
            width: 200,
            height: 280,
            curtainType: 'classic',
            fabricCode: null,
            quantity: 1,
          },
        ],
      },
    });
    // Either returns price or 400 validation error — not 500
    expect(res.status()).toBeLessThan(500);
  });

  test('catalog search by code works', async ({ request }) => {
    const res = await request.get(`${API}/api/catalog/products/search?q=A`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Analytics & Dashboard', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('GET /api/analytics/dashboard-stats', async ({ request }) => {
    const res = await request.get(`${API}/api/analytics/dashboard-stats`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/analytics/payment-risks', async ({ request }) => {
    const res = await request.get(`${API}/api/analytics/payment-risks`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/analytics/monthly-trends', async ({ request }) => {
    const res = await request.get(`${API}/api/analytics/monthly-trends`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/analytics/revenue-breakdown', async ({ request }) => {
    const res = await request.get(`${API}/api/analytics/revenue-breakdown`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Notifications', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('GET /api/notifications — returns list', async ({ request }) => {
    const res = await request.get(`${API}/api/notifications`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });

  test('GET /api/notifications/unread-count — returns count', async ({ request }) => {
    const res = await request.get(`${API}/api/notifications/unread-count`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.data?.count ?? body.count).toBe('number');
  });

  test('GET /api/notifications/preferences', async ({ request }) => {
    const res = await request.get(`${API}/api/notifications/preferences`, {
      headers: headers(token),
    });
    expect(res.status()).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
test.describe('Cleanup — delete test data', () => {
  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  test('DELETE /api/clients/:id — removes test client', async ({ request }) => {
    if (!clientId) test.skip();
    const res = await request.delete(`${API}/api/clients/${clientId}`, {
      headers: headers(token),
    });
    expect([200, 204]).toContain(res.status());
  });
});
