/**
 * E2E Tests for SALES_MANAGER role
 * Tests scenarios SM-01 through SM-04 from ROLE_TEST_SCENARIOS.md
 */

import request from 'supertest';
import app from '../../../src/server.js';
import pool from '../../../src/infrastructure/database/config.js';
import {
  testUsers,
  testLeads,
  testClients,
  createTestUsers,
  createTestLead,
} from '../../fixtures/roles.fixture.js';

describe('SALES_MANAGER Role E2E Tests', () => {
  let salesManagerToken;
  let salesManagerId;
  let measurerToken;
  let measurerId;
  let testLead;
  let testClient;

  beforeAll(async () => {
    // Create test users
    const users = await createTestUsers(pool);
    const salesManager = users.find((u) => u.key === 'salesManager1');
    const measurer = users.find((u) => u.key === 'measurer1');

    salesManagerId = salesManager.data.id;
    measurerId = measurer.data.id;

    // Login as sales manager
    const smLoginRes = await request(app).post('/api/auth/login').send({
      login: testUsers.salesManager1.email,
      password: testUsers.salesManager1.password,
    });

    if (!smLoginRes.body.success || !smLoginRes.body.data) {
      throw new Error(`Sales Manager login failed: ${JSON.stringify(smLoginRes.body)}`);
    }

    salesManagerToken = smLoginRes.body.data.token;

    // Login as measurer for later tests
    const mLoginRes = await request(app).post('/api/auth/login').send({
      login: testUsers.measurer1.email,
      password: testUsers.measurer1.password,
    });

    if (!mLoginRes.body.success || !mLoginRes.body.data) {
      throw new Error(`Measurer login failed: ${JSON.stringify(mLoginRes.body)}`);
    }

    measurerToken = mLoginRes.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%' OR name LIKE '%Test%')");
    await pool.query("DELETE FROM clients WHERE name LIKE 'Test%' OR name LIKE '%Test%'");
    await pool.query("DELETE FROM leads WHERE contact_name LIKE '%Test%' OR contact_name LIKE '%Lead%'");
    await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
    await pool.end();
  });

  /**
   * Scenario SM-01: Complete Lead Processing Flow
   */
  describe('SM-01: Complete Lead Processing Flow', () => {
    test('should process lead from new to converted', async () => {
      // Step 1: Create new lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          source: testLeads.hot.source,
          contact_name: testLeads.hot.contact_name,
          contact_phone: testLeads.hot.contact_phone,
          contact_email: testLeads.hot.contact_email,
          notes: testLeads.hot.notes,
          priority: testLeads.hot.priority,
          budget: testLeads.hot.budget,
        });

      expect(leadRes.status).toBe(201);
      expect(leadRes.body.success).toBe(true);
      testLead = leadRes.body.data;

      // Step 2: Assign to self
      const assignRes = await request(app)
        .put(`/api/leads/${testLead.id}/assign`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ assigned_to: salesManagerId });

      expect(assignRes.status).toBe(200);
      expect(assignRes.body.data.assigned_to).toBe(salesManagerId);

      // Step 3: Add notes
      const notesRes = await request(app)
        .put(`/api/leads/${testLead.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          notes: 'Called client, very interested, ready for measurement',
        });

      expect(notesRes.status).toBe(200);

      // Step 4: Mark as contacted
      const contactedRes = await request(app)
        .put(`/api/leads/${testLead.id}/status`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ status: 'contacted' });

      expect(contactedRes.status).toBe(200);
      expect(contactedRes.body.data.status).toBe('contacted');

      // Step 5: Create client from lead
      const clientRes = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          name: testLeads.hot.contact_name,
          phone: testLeads.hot.contact_phone,
          email: testLeads.hot.contact_email,
          address: 'Test Address 123',
          source: testLeads.hot.source,
          budget: testLeads.hot.budget,
          lead_id: testLead.id,
        });

      expect(clientRes.status).toBe(201);
      expect(clientRes.body.success).toBe(true);
      testClient = clientRes.body.data;

      // Step 6: Schedule measurement
      const measurementRes = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          client_id: testClient.id,
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduled_time: '14:00',
          address: testClient.address,
          notes: 'Client available after 2pm',
        });

      expect(measurementRes.status).toBe(201);
      expect(measurementRes.body.success).toBe(true);

      const measurement = measurementRes.body.data;

      // Step 7: Assign measurer
      const assignMeasurerRes = await request(app)
        .put(`/api/measurements/${measurement.id}/assign`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ assigned_to: measurerId });

      expect(assignMeasurerRes.status).toBe(200);
      expect(assignMeasurerRes.body.data.assigned_to).toBe(measurerId);

      // Step 8: Mark lead as converted
      const convertedRes = await request(app)
        .put(`/api/leads/${testLead.id}/status`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ status: 'converted' });

      expect(convertedRes.status).toBe(200);
      expect(convertedRes.body.data.status).toBe('converted');
    });

    test('should track sales_manager_id for commission', async () => {
      // Verify that the client and measurement have sales_manager tracked
      const clientRes = await request(app)
        .get(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(clientRes.status).toBe(200);
      expect(clientRes.body.data.created_by).toBe(salesManagerId);
    });
  });

  /**
   * Scenario SM-02: Lead Rejection Flow
   */
  describe('SM-02: Lead Rejection Flow', () => {
    test('should reject unqualified lead', async () => {
      // Create cold lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          source: testLeads.cold.source,
          contact_name: testLeads.cold.contact_name,
          contact_phone: testLeads.cold.contact_phone,
          notes: testLeads.cold.notes,
          priority: testLeads.cold.priority,
        });

      expect(leadRes.status).toBe(201);
      const coldLead = leadRes.body.data;

      // Add rejection note
      const notesRes = await request(app)
        .put(`/api/leads/${coldLead.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          notes: 'Budget too low, not interested in our products',
          rejection_reason: 'Budget mismatch',
        });

      expect(notesRes.status).toBe(200);

      // Mark as rejected
      const rejectRes = await request(app)
        .put(`/api/leads/${coldLead.id}/status`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ status: 'rejected' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('rejected');

      // Verify no client was created
      const clientsRes = await request(app)
        .get(`/api/clients?lead_id=${coldLead.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(clientsRes.body.data.length).toBe(0);
    });

    test('should allow re-opening rejected lead', async () => {
      // Create and reject a lead
      const leadRes = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          source: 'instagram_dm',
          contact_name: 'Reopen Test Lead',
          contact_phone: '+77771111111',
          status: 'rejected',
        });

      const lead = leadRes.body.data;

      // Re-open it
      const reopenRes = await request(app)
        .put(`/api/leads/${lead.id}/status`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ status: 'new' });

      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body.data.status).toBe('new');
    });
  });

  /**
   * Scenario SM-04: Permission Boundaries
   */
  describe('SM-04: Permission Boundaries', () => {
    let measurement;

    beforeAll(async () => {
      // Create a measurement for permission tests
      const measurementRes = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          client_id: testClient.id,
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduled_time: '15:00',
          address: testClient.address,
        });

      measurement = measurementRes.body.data;
    });

    test('should FORBID completing measurement', async () => {
      const res = await request(app)
        .put(`/api/measurements/${measurement.id}/complete`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          result: {
            window_width: 150,
            window_height: 200,
          },
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/permission|forbidden/i);
    });

    test('should FORBID uploading measurement photos', async () => {
      const res = await request(app)
        .post(`/api/measurements/${measurement.id}/photos`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          photos: ['photo1.jpg', 'photo2.jpg'],
        });

      expect(res.status).toBe(403);
    });

    test('should FORBID creating proposals', async () => {
      const res = await request(app)
        .post('/api/proposals')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          client_id: testClient.id,
          measurement_id: measurement.id,
          items: [
            {
              type: 'roman_blind',
              price: 50000,
            },
          ],
          total: 50000,
        });

      expect(res.status).toBe(403);
    });

    test('should FORBID accessing production data', async () => {
      const res = await request(app)
        .get('/api/production')
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(403);
    });

    test('should FORBID deleting clients', async () => {
      const res = await request(app)
        .delete(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(403);
    });

    test('should ALLOW viewing own leads', async () => {
      const res = await request(app)
        .get('/api/leads?assigned_to=me')
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should ALLOW viewing own clients', async () => {
      const res = await request(app)
        .get('/api/clients?created_by=me')
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should ALLOW viewing scheduled measurements (read-only)', async () => {
      const res = await request(app)
        .get(`/api/measurements/${measurement.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  /**
   * Edge Case: Try to create measurement without client
   */
  describe('Edge Cases', () => {
    test('should reject measurement without client_id', async () => {
      const res = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduled_time: '14:00',
          // Missing client_id
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/client/i);
    });

    test('should reject assigning non-MEASURER to measurement', async () => {
      const measurementRes = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({
          client_id: testClient.id,
          scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          scheduled_time: '16:00',
          address: testClient.address,
        });

      const measurement = measurementRes.body.data;

      // Try to assign another sales manager (not measurer)
      const res = await request(app)
        .put(`/api/measurements/${measurement.id}/assign`)
        .set('Authorization', `Bearer ${salesManagerToken}`)
        .send({ assigned_to: salesManagerId }); // Sales manager, not measurer

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/measurer|designer/i);
    });

    test('should NOT view other sales managers leads', async () => {
      // Create a lead assigned to another sales manager
      const otherLead = await createTestLead(pool, 'warm', salesManagerId + 999);

      const res = await request(app)
        .get(`/api/leads/${otherLead.id}`)
        .set('Authorization', `Bearer ${salesManagerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
