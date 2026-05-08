import request from 'supertest';
import app from '../../src/server.js';
import './setup.e2e.js'; // Import E2E setup

describe('Measurements API E2E Tests', () => {
  const uniquePhone = () => `+7700${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 12);
  let accessToken;
  let clientId;
  let designerId;

  beforeAll(async () => {
    // Login as test designer
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
        name: 'Measurement Test Client',
        phone: uniquePhone(),
        address: 'Алматы, Достык 123',
      });

    if (!clientResponse.body.success || !clientResponse.body.data) {
      throw new Error(`Failed to create client: ${JSON.stringify(clientResponse.body)}`);
    }

    clientId = clientResponse.body.data.id;
  });

  describe('POST /api/measurements', () => {
    test('should create new measurement', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Алматы, мкр Самал-2, д.50, кв.25',
          scheduledAt: tomorrow.toISOString(),
          roomType: 'living_room',
          budgetMin: 50000,
          budgetMax: 150000,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.clientId).toBe(clientId);
      expect(response.body.data.status).toBe('scheduled');
      expect(response.body.data.budgetMin).toBe(50000);
      expect(response.body.data.budgetMax).toBe(150000);
    });

    test('should create with minimal data', async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Test Address',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .post('/api/measurements')
        .send({
          clientId,
          designerId,
          address: 'Test',
        })
        .expect(401);
    });

    test('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          // Missing designerId and address
        });

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/measurements', () => {
    beforeAll(async () => {
      // Create some test measurements
      await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Address 1',
        });

      await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Address 2',
        });
    });

    test('should get all measurements for designer', async () => {
      const response = await request(app)
        .get('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);

      // All measurements should belong to this designer
      response.body.data.forEach(m => {
        expect(m.designerId).toBe(designerId);
      });
    });

    test('should filter by status', async () => {
      const response = await request(app)
        .get('/api/measurements?status=scheduled')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.data.forEach(m => {
        expect(m.status).toBe('scheduled');
      });
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/measurements?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('should fail without authentication', async () => {
      await request(app)
        .get('/api/measurements')
        .expect(401);
    });
  });

  describe('GET /api/measurements/:id', () => {
    let measurementId;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Get By ID Address',
        });
      measurementId = response.body.data.id;
    });

    test('should get measurement by ID', async () => {
      const response = await request(app)
        .get(`/api/measurements/${measurementId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(measurementId);
      expect(response.body.data.address).toBe('Get By ID Address');
    });

    test('should return 404 for non-existent measurement', async () => {
      await request(app)
        .get('/api/measurements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/measurements/:id/windows', () => {
    let measurementId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Window Test Address',
        });
      measurementId = response.body.data.id;
    });

    test('should add window to measurement', async () => {
      const windowData = {
        roomName: 'Гостиная',
        dimensions: {
          widthLeft: 1980,
          widthCenter: 2000,
          widthRight: 1990,
          heightLeft: 1480,
          heightCenter: 1500,
          heightRight: 1490,
        },
        mountingType: 'wall',
        topOffset: 100,
        sillHeight: 800,
        obstacles: [
          { type: 'radiator', position: 'under_window' },
        ],
        notes: 'Батарея под окном',
      };

      const response = await request(app)
        .post(`/api/measurements/${measurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(windowData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.windows.length).toBe(1);
      expect(response.body.data.windows[0].roomName).toBe('Гостиная');
    });

    test('should add multiple windows', async () => {
      // Add first window
      await request(app)
        .post(`/api/measurements/${measurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomName: 'Комната 1',
          dimensions: { widthCenter: 2000, heightCenter: 1500 },
        });

      // Add second window
      const response = await request(app)
        .post(`/api/measurements/${measurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomName: 'Комната 2',
          dimensions: { widthCenter: 1800, heightCenter: 1600 },
        })
        .expect(200);

      expect(response.body.data.windows.length).toBe(2);
    });
  });

  describe('POST /api/measurements/:id/photos', () => {
    let measurementId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Photo Test Address',
        });
      measurementId = response.body.data.id;
    });

    test('should add photo to measurement', async () => {
      const photoData = {
        type: 'room',
        url: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        description: 'Общий вид комнаты',
      };

      const response = await request(app)
        .post(`/api/measurements/${measurementId}/photos`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(photoData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.photos.length).toBe(1);
    });
  });

  describe('PATCH /api/measurements/:id/complete', () => {
    let measurementId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'Complete Test Address',
        });
      measurementId = response.body.data.id;

      // Add at least one window
      await request(app)
        .post(`/api/measurements/${measurementId}/windows`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          roomName: 'Test Room',
          dimensions: { widthCenter: 2000, heightCenter: 1500 },
        });
    });

    test('should complete measurement', async () => {
      const response = await request(app)
        .patch(`/api/measurements/${measurementId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientReaction: 'positive',
          notes: 'Клиенту понравилось',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.clientReaction).toBe('positive');
    });

    test('should fail if no windows added', async () => {
      // Create new measurement without windows
      const newResponse = await request(app)
        .post('/api/measurements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clientId,
          designerId,
          address: 'No Windows Address',
        });

      const response = await request(app)
        .patch(`/api/measurements/${newResponse.body.data.id}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
