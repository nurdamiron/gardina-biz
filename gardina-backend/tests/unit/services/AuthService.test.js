import { AuthService } from '../../../src/infrastructure/services/AuthService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService;
  const testUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    phone: '+77001234567',
    role: 'designer',
    name: 'Test User',
  };

  beforeEach(() => {
    authService = new AuthService();
    // Set test secrets
    process.env.JWT_SECRET = 'test_secret_key';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  });

  describe('hashPassword()', () => {
    test('should hash password successfully', async () => {
      const password = 'Test123456!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    test('should generate different hashes for same password', async () => {
      const password = 'Test123456!';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    test('should handle empty password', async () => {
      const hash = await authService.hashPassword('');
      expect(hash).toBeDefined();
    });

    test('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await authService.hashPassword(longPassword);
      expect(hash).toBeDefined();
    });

    test('should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await authService.hashPassword(password);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword()', () => {
    test('should verify correct password', async () => {
      const password = 'Test123456!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'Test123456!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    test('should be case sensitive', async () => {
      const password = 'Test123456!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword('test123456!', hash);
      expect(isValid).toBe(false);
    });

    test('should handle empty password verification', async () => {
      const hash = await authService.hashPassword('');
      const isValid = await authService.verifyPassword('', hash);
      expect(isValid).toBe(true);
    });
  });

  describe('generateAccessToken()', () => {
    test('should generate valid JWT access token', () => {
      const token = authService.generateAccessToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    test('should include user data in token payload', () => {
      const token = authService.generateAccessToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.phone).toBe(testUser.phone);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should have expiration time', () => {
      const token = authService.generateAccessToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should generate different tokens for same user at different times', async () => {
      const token1 = authService.generateAccessToken(testUser);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token2 = authService.generateAccessToken(testUser);

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken()', () => {
    test('should generate valid refresh token', () => {
      const token = authService.generateRefreshToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should include minimal data in refresh token', () => {
      const token = authService.generateRefreshToken(testUser);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe(testUser.id);
      expect(decoded.type).toBe('refresh');
      // Should not include sensitive data
      expect(decoded.email).toBeUndefined();
      expect(decoded.phone).toBeUndefined();
    });

    test('should have longer expiration than access token', () => {
      const accessToken = authService.generateAccessToken(testUser);
      const refreshToken = authService.generateRefreshToken(testUser);

      const accessDecoded = jwt.decode(accessToken);
      const refreshDecoded = jwt.decode(refreshToken);

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyAccessToken()', () => {
    test('should verify valid access token', () => {
      const token = authService.generateAccessToken(testUser);
      const decoded = authService.verifyAccessToken(token);

      expect(decoded.id).toBe(testUser.id);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should throw error for invalid token', () => {
      expect(() => authService.verifyAccessToken('invalid.token.here')).toThrow(
        'Invalid or expired token'
      );
    });

    test('should throw error for expired token', () => {
      // Create token that expires immediately
      const expiredToken = jwt.sign(
        { id: testUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 100) {}

      expect(() => authService.verifyAccessToken(expiredToken)).toThrow();
    });

    test('should throw error for token with wrong secret', () => {
      const token = jwt.sign({ id: testUser.id }, 'wrong_secret');

      expect(() => authService.verifyAccessToken(token)).toThrow();
    });

    test('should throw error for malformed token', () => {
      expect(() => authService.verifyAccessToken('not.a.token')).toThrow();
    });

    test('should throw error for empty token', () => {
      expect(() => authService.verifyAccessToken('')).toThrow();
    });
  });

  describe('verifyRefreshToken()', () => {
    test('should verify valid refresh token', () => {
      const token = authService.generateRefreshToken(testUser);
      const decoded = authService.verifyRefreshToken(token);

      expect(decoded.id).toBe(testUser.id);
      expect(decoded.type).toBe('refresh');
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => authService.verifyRefreshToken('invalid.token')).toThrow(
        'Invalid or expired refresh token'
      );
    });

    test('should not accept access token as refresh token', () => {
      const accessToken = authService.generateAccessToken(testUser);

      // Should fail because wrong secret
      expect(() => authService.verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('generateTokenPair()', () => {
    test('should generate both tokens', () => {
      const tokens = authService.generateTokenPair(testUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeDefined();
    });

    test('should return valid tokens', () => {
      const tokens = authService.generateTokenPair(testUser);

      const accessDecoded = authService.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = authService.verifyRefreshToken(tokens.refreshToken);

      expect(accessDecoded.id).toBe(testUser.id);
      expect(refreshDecoded.id).toBe(testUser.id);
    });

    test('should work for different user roles', () => {
      const roles = ['designer', 'manager', 'production', 'installer', 'admin'];

      roles.forEach(role => {
        const user = { ...testUser, role };
        const tokens = authService.generateTokenPair(user);
        const decoded = authService.verifyAccessToken(tokens.accessToken);

        expect(decoded.role).toBe(role);
      });
    });
  });

  describe('Security', () => {
    test('bcrypt hashes should be different with different salts', async () => {
      const password = 'SamePassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // But both should verify
      const verify1 = await authService.verifyPassword(password, hash1);
      const verify2 = await authService.verifyPassword(password, hash2);
      expect(verify1).toBe(true);
      expect(verify2).toBe(true);
    });

    test('JWT tokens should not be reusable after secret change', () => {
      const token = authService.generateAccessToken(testUser);

      // Change secret
      process.env.JWT_SECRET = 'new_secret';
      const newAuthService = new AuthService();

      // Old token should fail
      expect(() => newAuthService.verifyAccessToken(token)).toThrow();
    });

    test('tokens with different algorithm should still verify if secret matches', () => {
      const token = jwt.sign(
        { id: testUser.id },
        process.env.JWT_SECRET,
        { algorithm: 'HS512' } // Different algorithm but same secret
      );

      // JWT library will accept different HS algorithms with same secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(testUser.id);
    });
  });
});
