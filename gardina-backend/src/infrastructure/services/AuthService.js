import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication Service
 * Handles password hashing, JWT generation and verification
 */
export class AuthService {
  constructor() {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
    }
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: this.jwtExpiresIn,
    };
  }
}
