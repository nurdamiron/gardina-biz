import pool from '../../../infrastructure/database/config.js';
import { getTenantId } from '../../../infrastructure/tenant/tenantContext.js';

class AuditLogController {
  async getLogsForEntity(req, res) {
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'entityType and entityId are required' });
    }

    try {
      const tid = getTenantId();
      const { rows } = await pool.query(
        `SELECT * FROM audit_logs
         WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3
         ORDER BY created_at DESC`,
        [entityType, entityId, tid]
      );
      res.json(rows);
    } catch (error) {
      // Table may not exist yet — return empty list instead of 500
      if (error.code === '42P01') {
        return res.json([]);
      }
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new AuditLogController();
