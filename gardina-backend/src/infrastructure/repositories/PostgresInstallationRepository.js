import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresInstallationRepository {
  async create(data) {
    const tid = getTenantId();
    const {
      dealId, orderId, installerId, status, scheduledAt,
      address, clientPhone, clientContactName, notes,
    } = data;

    const result = await pool.query(
      `INSERT INTO installations (
         organization_id, deal_id, order_id, installer_id, status, scheduled_at,
         address, client_phone, client_contact_name, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        tid, dealId, orderId, installerId, status || 'scheduled', scheduledAt,
        address, clientPhone, clientContactName, notes,
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const tid = getTenantId();
    const {
      installerId, status, scheduledAt, address, notes, completionNotes, clientRating,
    } = data;

    const result = await pool.query(
      `UPDATE installations SET
         installer_id = COALESCE($2, installer_id),
         status = COALESCE($3, status),
         scheduled_at = COALESCE($4, scheduled_at),
         address = COALESCE($5, address),
         notes = COALESCE($6, notes),
         completion_notes = COALESCE($7, completion_notes),
         client_rating = COALESCE($8, client_rating),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $9
       RETURNING *`,
      [
        id, installerId, status, scheduledAt, address, notes, completionNotes, clientRating, tid,
      ]
    );
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const tid = getTenantId();
    let tsUpdate = '';
    if (status === 'in_progress') tsUpdate = ', started_at = CURRENT_TIMESTAMP';
    if (status === 'completed') tsUpdate = ', completed_at = CURRENT_TIMESTAMP';

    const result = await pool.query(
      `UPDATE installations
       SET status = $2, updated_at = CURRENT_TIMESTAMP ${tsUpdate}
       WHERE id = $1 AND organization_id = $3
       RETURNING *`,
      [id, status, tid]
    );
    return result.rows[0];
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT * FROM installations WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );
    return result.rows[0];
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    let query = `SELECT i.*, u.name as installer_name
                 FROM installations i
                 LEFT JOIN users u ON i.installer_id = u.id
                 WHERE i.organization_id = $1`;
    const params = [tid];
    let idx = 2;

    if (filters.installerId) {
      query += ` AND i.installer_id = $${idx++}`;
      params.push(filters.installerId);
    }
    if (filters.status) {
      query += ` AND i.status = $${idx++}`;
      params.push(filters.status);
    }
    if (filters.dealId) {
      query += ` AND i.deal_id = $${idx++}`;
      params.push(filters.dealId);
    }
    if (filters.date) {
      query += ` AND i.scheduled_at::date = $${idx++}`;
      params.push(filters.date);
    }

    query += ` ORDER BY i.scheduled_at ASC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(pagination.limit, pagination.offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT count(*) FROM installations WHERE organization_id = $1',
      [tid]
    );

    return { data: result.rows, total: parseInt(countResult.rows[0].count) };
  }

  async delete(id) {
    const tid = getTenantId();
    const res = await pool.query(
      'DELETE FROM installations WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, tid]
    );
    return res.rows.length > 0;
  }
}
