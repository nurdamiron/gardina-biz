import { AuthService } from '../../../infrastructure/services/AuthService.js';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import { tenantStorage } from '../../../infrastructure/tenant/tenantContext.js';
import { computeReadOnly } from './billing.middleware.js';

const authService = new AuthService();
const userRepository = new PostgresUserRepository();

/**
 * In-memory token blacklist for logout invalidation.
 * Key: `${userId}:${iat}` — unique per token issuance.
 * Value: expiry timestamp (ms) — used for cleanup.
 * Clears expired entries every hour to prevent memory leaks.
 */
const tokenBlacklist = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of tokenBlacklist) {
    if (expiry < now) tokenBlacklist.delete(key);
  }
}, 60 * 60 * 1000);

/**
 * Add a decoded token to the blacklist.
 * Call this on logout so the token becomes immediately invalid.
 */
export const blacklistToken = (decoded) => {
  const userId = decoded.id || decoded.userId;
  const key = `${userId}:${decoded.iat}`;
  const expiry = (decoded.exp || 0) * 1000;
  tokenBlacklist.set(key, expiry);
};

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token берілмеген',
        message: 'Authorization header қажет',
      });
    }

    const token = authHeader.substring(7);

    const decoded = authService.verifyAccessToken(token);

    const userId = decoded.id || decoded.userId;
    const tokenKey = `${userId}:${decoded.iat}`;
    if (tokenBlacklist.has(tokenKey)) {
      return res.status(401).json({
        success: false,
        error: 'Token жарамсыз (шыққан)',
      });
    }

    const user = await userRepository.findByIdUnscoped(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пайдаланушы табылмады',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Аккаунт өшірілген',
      });
    }

    if (!user.organization_id) {
      return res.status(403).json({
        success: false,
        error: 'Организация байланысты емес',
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      organizationId: user.organization_id,
    };
    req.tokenDecoded = decoded;

    // Block writes when subscription is read-only (trial expired / past_due / canceled).
    // Whitelist: billing (so admin can pay) and auth (login/refresh/logout) endpoints.
    // Safe methods (GET/HEAD/OPTIONS) always pass — read-only does not mean read-blocked.
    const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
    const path = req.originalUrl || req.url || '';
    const isBillingOrAuth = path.startsWith('/api/billing') || path.startsWith('/api/auth');
    if (!SAFE_METHODS.has(req.method) && !isBillingOrAuth) {
      if (computeReadOnly(user.subscription_status, user.trial_ends_at)) {
        return res.status(402).json({
          success: false,
          code: 'SUBSCRIPTION_READ_ONLY',
          error: 'Жазылым белсенді емес — тарифті жаңартыңыз',
          subscriptionStatus: user.subscription_status,
        });
      }
    }

    tenantStorage.run({ organizationId: user.organization_id }, () => {
      next();
    });
  } catch (error) {
    console.error(`[AuthMiddleware] Authentication failed for ${req.method} ${req.url}: ${error.message}`);

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        error: 'Token жарамсыз немесе мерзімі өтіп кеткен',
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Аутентификация сәтсіз аяқталды',
      message: error.message,
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Аутентификация қажет',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Рұқсат жеткіліксіз',
        message: `Қажетті рөл: ${allowedRoles.join(' немесе ')}`,
      });
    }

    next();
  };
};

/**
 * Optional authentication
 * Attaches user if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyAccessToken(token);
      const user = await userRepository.findByIdUnscoped(decoded.id);

      if (user && user.is_active && user.organization_id) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          organizationId: user.organization_id,
        };
        return tenantStorage.run({ organizationId: user.organization_id }, () => next());
      }
    }

    next();
  } catch (error) {
    next();
  }
};
