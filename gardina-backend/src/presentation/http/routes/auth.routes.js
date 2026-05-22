import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController.js';
import { PasswordResetController } from '../controllers/PasswordResetController.js';
import { UserController } from '../controllers/UserController.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const authController = new AuthController();
const passwordResetController = new PasswordResetController();
const userController = new UserController();

// Throttle password-reset requests to prevent email-bombing / abuse.
// Five requests per IP per 15 minutes is plenty for a real human.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Слишком много запросов. Попробуйте через 15 минут.' },
});

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

// POST /api/auth/password-reset/request — issue email with token
router.post('/password-reset/request', passwordResetLimiter, (req, res) =>
  passwordResetController.request(req, res)
);

// POST /api/auth/password-reset/confirm — exchange token for new password
router.post('/password-reset/confirm', passwordResetLimiter, (req, res) =>
  passwordResetController.confirm(req, res)
);

// GET /api/auth/check-slug?slug=foo — public availability check
router.get('/check-slug', async (req, res) => {
  try {
    const slug = String(req.query.slug || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (slug.length < 2) {
      return res.json({ success: true, available: false, reason: 'too_short' });
    }
    const { default: pool } = await import('../../../infrastructure/database/config.js');
    const r = await pool.query('SELECT 1 FROM organizations WHERE slug = $1', [slug]);
    return res.json({ success: true, available: r.rows.length === 0, slug });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to check slug' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));

// GET /api/auth/verify-email?token=xxx — verify email address (public, token in query)
router.get('/verify-email', (req, res) => authController.verifyEmail(req, res));

// POST /api/auth/resend-verification — resend verification email (protected)
router.post('/resend-verification', authenticate, (req, res) => authController.resendVerification(req, res));

// GET /api/auth/invite/:token — get invite details (public)
router.get('/invite/:token', (req, res) => userController.getInvite(req, res));

// POST /api/auth/invite/:token/accept — accept invite and create account (public)
router.post('/invite/:token/accept', (req, res) => userController.acceptInvite(req, res));

export default router;
