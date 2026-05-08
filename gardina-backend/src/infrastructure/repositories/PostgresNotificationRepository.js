import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresNotificationRepository {
  async create({ userId, type, title, message, actionUrl, metadata = {} }) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO notifications (organization_id, user_id, type, title, message, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tid, userId, type, title, message, actionUrl, metadata]
    );
    return result.rows[0];
  }

  async findAll(userId, { limit = 50, offset = 0, isRead } = {}) {
    const tid = getTenantId();
    let query = `SELECT * FROM notifications WHERE user_id = $1 AND organization_id = $2`;
    const params = [userId, tid];
    let paramIndex = 3;

    if (isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(isRead);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND organization_id = $2 AND is_read = false',
      [userId, tid]
    );

    return {
      data: result.rows,
      unreadCount: parseInt(countResult.rows[0].count),
    };
  }

  async markAsRead(id, userId) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND organization_id = $3
       RETURNING *`,
      [id, userId, tid]
    );
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND organization_id = $2 AND is_read = false
       RETURNING id`,
      [userId, tid]
    );
    return result.rowCount;
  }
}
