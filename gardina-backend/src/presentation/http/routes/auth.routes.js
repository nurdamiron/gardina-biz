import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();

// Strict per-IP limiter for password attempts.
// 5 failed logins per 15 minutes per IP. Successful logins do not count
// (skipSuccessfulRequests) so legit users are never rate-limited away.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Тым көп әрекет. 15 минуттан кейін қайта көріңіз.',
  },
});

// Tenant creation is even more sensitive — abuse leads to DB bloat and free
// trials of unbounded fake organizations. 3 per IP per hour.
const registerSalonLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Тіркеу әрекеттері тым жиі. 1 сағаттан кейін қайта көріңіз.',
  },
});

// Refresh-token spam shouldn't be unlimited either.
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Routes
 * Base path: /api/auth
 */

// POST /api/auth/register-salon — new tenant + admin (public signup for SaaS)
router.post('/register-salon', registerSalonLimiter, (req, res) => authController.registerSalon(req, res));

// POST /api/auth/register - Register new user
// Disabled by default in production; enable via ALLOW_PUBLIC_REGISTRATION=true
router.post('/register', registerSalonLimiter, (req, res) => {
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Тіркелу өшірілген. Аккаунт алу үшін администраторға хабарласыңыз.',
    });
  }
  return authController.register(req, res);
});

// POST /api/auth/login - Login
router.post('/login', loginLimiter, (req, res) => authController.login(req, res));

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, (req, res) => authController.me(req, res));

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token', refreshLimiter, (req, res) => authController.refreshToken(req, res));

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

export default router;
