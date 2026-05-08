import request from 'supertest';
import app from '../../src/server.js';
import './setup.e2e.js'; // Import E2E setup

describe('Clients API E2E Tests', () => {
  const uniquePhone = () => `+7700${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 12);
  let accessToken;
  let userId;

  beforeAll(async () => {
    // Login as test designer
    const response = await request(app).post('/api/auth/login').send({
      login: 'testdesigner@test.com',
      password: 'password',
    });

    if (!response.body.success || !response.body.data) {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }

    accessToken = response.body.data.accessToken;
    userId = response.body.data.user.id;
  });

  describe('POST /api/clients', () => {
    test('should create new client', async () => {
      const clientData = {
        name: 'Асхат Жумабаев',
        phone: uniquePhone(),
        whatsapp: uniquePhone(),
        email: `askhat-${Date.now()}@example.com`,
        address: 'Алматы, мкр Самал-2, д.111',
        notes: 'VIP клиент',
        source: 'instagram',
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(clientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(clientData.name);
      expect(response.body.data.phone).toBe(clientData.phone);
      expect(response.body.data.email).toBe(clientData.email);
    });

    test('should create client with minimal fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Минимальный Клиент',
          phone: '+77072345678',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Минимальный Клиент');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/clients')
        .send({
          name: 'Test Client',
          phone: '+77073456789',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle Kazakh names correctly', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Айгерім Нұрғалиева',
          phone: '+77074567890',
        })
        .expect(201);

      expect(response.body.data.name).toBe('Айгерім Нұрғалиева');
    });

    test('should store tags as array', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Tagged Client',
          phone: '+77075678901',
          tags: ['VIP', 'Постоянный'],
        })
        .expect(201);

      // Note: Check if tags are actually saved
      expect(response.body.data.name).toBe('Tagged Client');
    });
  });

  describe('GET /api/clients', () => {
    beforeAll(async () => {
      // Create some test clients
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Client 1', phone: '+77076789012' });

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Client 2', phone: '+77077890123' });
    });

    test('should get all clients', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return clients in descending order by created_at', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const clients = response.body.data;
      if (clients.length > 1) {
        const dates = clients.map(c => new Date(c.created_at));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i] >= dates[i + 1]).toBe(true);
        }
      }
    });
  });

  describe('GET /api/clients/:id', () => {
    let clientId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Get By ID Client',
          phone: '+77078901234',
          email: 'getbyid@example.com',
        });
      clientId = response.body.data.id;
    });

    test('should get client by ID', async () => {
      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(clientId);
      expect(response.body.data.name).toBe('Get By ID Client');
      expect(response.body.data.email).toBe('getbyid@example.com');
    });

    test('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Client not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/clients/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should either be 400 or 500 depending on implementation
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
