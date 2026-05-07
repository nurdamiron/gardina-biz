import pool from '../../../infrastructure/database/config.js';

/**
 * Determines whether an organization is currently locked into read-only mode.
 * Trial expired, payment past due, or subscription canceled — all read-only.
 */
export function computeReadOnly(subscriptionStatus, trialEndsAt) {
  if (subscriptionStatus === 'active') return false;
  if (subscriptionStatus === 'trial' && trialEndsAt) {
    return new Date(trialEndsAt).getTime() < Date.now();
  }
  return subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled';
}

/**
 * GET, HEAD and OPTIONS are always safe; everything else mutates state.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Block writes when the organization is in read-only mode.
 *
 * Returns 402 Payment Required with a stable code so the frontend can show
 * a "renew subscription" banner instead of a generic error toast.
 *
 * Whitelist: billing endpoints (so admin can pay) and auth endpoints
 * (login/refresh/logout) are intentionally allowed.
 */
export const enforceReadOnly = async (req, res, next) => {
  try {
    if (SAFE_METHODS.has(req.method)) return next();
    if (!req.user?.organizationId) return next();

    // Allow billing self-service so the admin can re-activate
    if (req.baseUrl?.startsWith('/api/billing')) return next();
    if (req.baseUrl?.startsWith('/api/auth')) return next();

    const result = await pool.query(
      `SELECT subscription_status, trial_ends_at
       FROM organizations
       WHERE id = $1`,
      [req.user.organizationId]
    );

    const row = result.rows[0];
    if (!row) return next();

    if (computeReadOnly(row.subscription_status, row.trial_ends_at)) {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_READ_ONLY',
        error: 'Жазылым белсенді емес — тарифті жаңартыңыз',
        subscriptionStatus: row.subscription_status,
      });
    }

    next();
  } catch (error) {
    console.error('[enforceReadOnly]', error.message);
    next();
  }
};

/**
 * Enforce per-plan max_users on user creation.
 * Use as POST /api/users/admin/create middleware.
 */
export const enforceUserLimit = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) return next();

    const limitRes = await pool.query(
      `SELECT COALESCE(o.max_users_override, p.max_users) AS user_limit
       FROM organizations o
       LEFT JOIN subscription_plans p ON p.code = o.current_plan_code
       WHERE o.id = $1`,
      [req.user.organizationId]
    );

    const userLimit = parseInt(limitRes.rows[0]?.user_limit, 10);

    // No limit configured — allow
    if (!Number.isFinite(userLimit) || userLimit <= 0) return next();

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS active_users
       FROM users
       WHERE organization_id = $1 AND is_active = true`,
      [req.user.organizationId]
    );
    const activeUsers = countRes.rows[0]?.active_users || 0;

    if (activeUsers >= userLimit) {
      return res.status(402).json({
        success: false,
        code: 'PLAN_USER_LIMIT_REACHED',
        error: `Тарифтегі пайдаланушы лимиті бітті (${activeUsers}/${userLimit}). Жоғары тарифке көтеріңіз.`,
        limit: userLimit,
        current: activeUsers,
      });
    }

    next();
  } catch (error) {
    console.error('[enforceUserLimit]', error.message);
    next();
  }
};
