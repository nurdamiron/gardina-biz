import pool from '../../infrastructure/database/config.js';
import { getTenantId } from '../../infrastructure/tenant/tenantContext.js';

class AuditLogService {
  async log(logData) {
    const {
      userId,
      userName,
      actionType,
      entityType,
      entityId,
      entityName,
      changes = {},
    } = logData;

    const tid = getTenantId();

    const query = `
      INSERT INTO audit_logs
        (organization_id, user_id, user_name, action_type, entity_type, entity_id, entity_name, changes)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [
      tid,
      userId,
      userName,
      actionType,
      entityType,
      entityId,
      entityName,
      JSON.stringify(changes),
    ];

    try {
      await pool.query(query, values);
    } catch (error) {
      console.error('Failed to write to audit log:', error);
      // Не прерываем основной процесс, если лог не записался
    }
  }
}

export default new AuditLogService();
