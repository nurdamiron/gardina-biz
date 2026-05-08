import request from 'supertest';
import app from '../../src/server.js';
import '../e2e/setup.e2e.js'; // Import E2E setup

describe('Auth E2E Tests', () => {
  // NOTE: Registration endpoint doesn't exist - users are created manually in DB
  // These tests use seeded test users from setup.e2e.js

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'testdesigner@test.com',
          password: 'password',
        })
        .expect('Content-Type', /json/);

      // Debug: log response
      if (response.status !== 200) {
        console.log('❌ Login failed!');
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('testdesigner@test.com');
      expect(response.body.data.user.role).toBe('designer');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Should not return password
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    test('should login with phone', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '+77000000002', // testdesigner phone (use 'phone' field, not 'login')
          password: 'password',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('designer');
    });

    test('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'testdesigner@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'nonexistent',
          password: 'password',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should work for different roles', async () => {
      const roles = [
        { login: 'testadmin@test.com', role: 'admin' },
        { login: 'testdesigner@test.com', role: 'designer' },
        { login: 'testmanager@test.com', role: 'manager' },
        { login: 'testproduction@test.com', role: 'production' },
        { login: 'testinstaller@test.com', role: 'installer' },
      ];

      for (const { login, role } of roles) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ login, password: 'password' })
          .expect(200);

        expect(response.body.data.user.role).toBe(role);
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'testdesigner@test.com',
          password: 'password',
        });

      if (!loginResponse.body.success || !loginResponse.body.data) {
        throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
      }

      refreshToken = loginResponse.body.data.refreshToken;
    });

    test('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(refreshToken);
    });

    test('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'testdesigner@test.com',
          password: 'password',
        });

      if (!loginResponse.body.success || !loginResponse.body.data) {
        throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
      }

      accessToken = loginResponse.body.data.accessToken;
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          login: 'testdesigner@test.com',
          password: 'password',
        });

      if (!loginResponse.body.success || !loginResponse.body.data) {
        throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
      }

      accessToken = loginResponse.body.data.accessToken;
    });

    test('should get current user info', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('testdesigner@test.com');
      expect(response.body.data.role).toBe('designer');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
