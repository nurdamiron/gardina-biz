import request from 'supertest';
import app from '../../src/server.js';
import './setup.e2e.js'; // Import E2E setup

describe('Proposals API E2E Tests', () => {
  const uniquePhone = () => `+7700${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 12);
  let accessToken;
  let clientId;
  let designerId;
  let measurementId;
  let dealId;

  beforeAll(async () => {
    // Setup: Login as test designer (seeded by setup.e2e.js)
    const authResponse = await request(app).post('/api/auth/login').send({
      login: 'testdesigner@test.com',
      password: 'password',
    });

    if (!authResponse.body.success || !authResponse.body.data) {
      throw new Error(`Login failed: ${JSON.stringify(authResponse.body)}`);
    }

    accessToken = authResponse.body.data.accessToken;
    designerId = authResponse.body.data.user.id;

    // Create client
    const clientResponse = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Proposal Test Client',
        phone: uniquePhone(),
        address: 'Test Address',
      });

    if (!clientResponse.body.success || !clientResponse.body.data) {
      throw new Error(`Failed to create client: ${JSON.stringify(clientResponse.body)}`);
    }

    clientId = clientResponse.body.data.id;

    // Create measurement
    const measurementResponse = await request(app)
      .post('/api/measurements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        designerId,
        address: 'Алматы, пр.Абая 150',
      });

    if (!measurementResponse.body.success || !measurementResponse.body.data) {
      throw new Error(`Failed to create measurement: ${JSON.stringify(measurementResponse.body)}`);
    }

    measurementId = measurementResponse.body.data.id;

    // Add window to measurement
    const windowResponse = await request(app)
      .post(`/api/measurements/${measurementId}/windows`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roomName: 'Спальня',
        dimensions: {
          widthCenter: 2000,
          heightCenter: 1500,
        },
        mountingType: 'wall',
      });

    if (!windowResponse.body.success || !windowResponse.body.data) {
      throw new Error(`Failed to add window: ${JSON.stringify(windowResponse.body)}`);
    }

    // Create deal
    const dealResponse = await request(app)
      .post('/api/deals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientId,
        designerId,
      });

    if (!dealResponse.body.success || !dealResponse.body.data) {
      throw new Error(`Failed to create deal: ${JSON.stringify(dealResponse.body)}`);
    }

    dealId = dealResponse.body.data.id;
  });

  describe('POST /api/proposals', () => {
    test('should create proposal with all fields', async () => {
      const proposalData = {
        measurementId,
        clientId,
        designerId,
        dealId,
        variantName: 'Вариант 1: Блэкаут + Тюль',
        fabricCost: 45000,
        sewingCost: 18000,
        curtainCost: 25000,
        installationCost: 12000,
        totalCost: 100000,
        notes: 'Премиум ткани из Турции',
      };

      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(proposalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.variantName).toBe('Вариант 1: Блэкаут + Тюль');
      expect(response.body.data.totalCost).toBe(100000);
      expect(response.body.data.status).toBe('draft');
    });

    test('should create proposal with minimal fields', async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          totalCost: 80000,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .post('/api/proposals')
        .send({
          clientId,
          designerId,
          totalCost: 100000,
        })
        .expect(401);
    });

    test('should update deal when dealId provided', async () => {
      // Create new deal for this test
      const newDealResponse = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ clientId, designerId });
      const newDealId = newDealResponse.body.data.id;

      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          measurementId,
          clientId,
          designerId,
          dealId: newDealId,
          totalCost: 120000,
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify deal was updated
      const dealResponse = await request(app)
        .get(`/api/deals/${newDealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(dealResponse.body.data.proposalId).toBeDefined();
      expect(dealResponse.body.data.totalAmount?.amount).toBe(120000);
    });

    test('should complete measurement when measurementId provided', async () => {
      // Create new measurement
      const newMeasurementResponse = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'New Measurement Address',
        });
      const newMeasurementId = newMeasurementResponse.body.data.id;

      // Add window
      await request(app)
        .post(`/api/measurements/${newMeasurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomName: 'Test',
          dimensions: { widthCenter: 2000, heightCenter: 1500 },
        });

      // Create proposal - should complete measurement
      await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          measurementId: newMeasurementId,
          clientId,
          designerId,
          totalCost: 95000,
        })
        .expect(201);

      // Verify measurement is completed
      const measurementResponse = await request(app)
        .get(`/api/measurements/${newMeasurementId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(measurementResponse.body.data.status).toBe('completed');
    });
  });

  describe('GET /api/proposals/:id', () => {
    let proposalId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          variantName: 'Test Variant',
          totalCost: 85000,
        });
      proposalId = response.body.data.id;
    });

    test('should get proposal by ID', async () => {
      const response = await request(app)
        .get(`/api/proposals/${proposalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(proposalId);
      expect(response.body.data.variantName).toBe('Test Variant');
    });

    test('should return 404 for non-existent proposal', async () => {
      await request(app)
        .get('/api/proposals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .get(`/api/proposals/${proposalId}`)
        .expect(401);
    });
  });

  describe('Business Logic Integration', () => {
    test('complete flow: measurement → proposal → deal update', async () => {
      // 1. Create measurement
      const measurementResp = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Complete Flow Address',
        });
      const flowMeasurementId = measurementResp.body.data.id;

      // 2. Add window
      await request(app)
        .post(`/api/measurements/${flowMeasurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomName: 'Flow Room',
          dimensions: { widthCenter: 2200, heightCenter: 1600 },
        });

      // 3. Create deal
      const dealResp = await request(app)
        .post('/api/deals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ clientId, designerId });
      const flowDealId = dealResp.body.data.id;

      // 4. Create proposal - should update deal and complete measurement
      const proposalResp = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          measurementId: flowMeasurementId,
          clientId,
          designerId,
          dealId: flowDealId,
          totalCost: 110000,
          variantName: 'Premium вариант',
        })
        .expect(201);

      expect(proposalResp.body.success).toBe(true);

      // 5. Verify measurement completed
      const measurementCheck = await request(app)
        .get(`/api/measurements/${flowMeasurementId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(measurementCheck.body.data.status).toBe('completed');

      // 6. Verify deal updated
      const dealCheck = await request(app)
        .get(`/api/deals/${flowDealId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(dealCheck.body.data.proposalId).toBe(proposalResp.body.data.id);
      expect(dealCheck.body.data.totalAmount.amount).toBe(110000);
    });
  });
});
