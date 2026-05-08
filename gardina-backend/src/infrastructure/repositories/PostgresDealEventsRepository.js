import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresDealEventsRepository {
  async findByDealId(dealId) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT e.* FROM deal_events e
       INNER JOIN deals d ON d.id = e.deal_id AND d.organization_id = $2
       WHERE e.deal_id = $1 AND e.organization_id = $2
       ORDER BY e.created_at ASC`,
      [dealId, tid]
    );
    return result.rows;
  }

  async findByEventType(eventType) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT e.* FROM deal_events e
       WHERE e.event_type = $1 AND e.organization_id = $2
       ORDER BY e.created_at DESC`,
      [eventType, tid]
    );
    return result.rows;
  }

  async create(eventData) {
    const tid = getTenantId();
    const { dealId, eventType, description, metadata } = eventData;

    const result = await pool.query(
      `INSERT INTO deal_events (organization_id, deal_id, event_type, description, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [tid, dealId, eventType, description, JSON.stringify(metadata || {})]
    );

    return result.rows[0];
  }

  async findAll(pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM deal_events WHERE organization_id = $1',
      [tid]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM deal_events WHERE organization_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tid, pagination.limit, pagination.offset]
    );

    return {
      events: result.rows,
      total,
      offset: pagination.offset,
      limit: pagination.limit,
    };
  }
}
