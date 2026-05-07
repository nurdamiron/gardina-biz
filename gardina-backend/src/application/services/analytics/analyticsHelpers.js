/**
 * Shared helper utilities for analytics services
 */

import pool from '../../../infrastructure/database/config.js';

/**
 * Returns the start Date for a named period.
 * @param {'week'|'month'|'quarter'|'year'} period
 */
export function getStartDateForPeriod(period) {
  const now = new Date();

  switch (period) {
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

/**
 * Throws if the given userId does not belong to the given organization.
 * Used to validate query-string ?designerId=… / ?userId=… params before
 * passing them into analytics queries.
 */
export async function assertUserBelongsToOrganization(userId, organizationId) {
  if (!userId || !organizationId) {
    throw Object.assign(new Error('userId and organizationId are required'), { status: 400 });
  }
  const result = await pool.query(
    'SELECT 1 FROM users WHERE id = $1 AND organization_id = $2',
    [userId, organizationId]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('User not found in this organization'), { status: 403 });
  }
}
