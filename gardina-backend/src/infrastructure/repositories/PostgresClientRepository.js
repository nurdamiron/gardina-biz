import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

/**
 * PostgreSQL Client Repository
 */
export class PostgresClientRepository {
  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id = $1 AND c.organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const conditions = ['c.organization_id = $1'];
    const params = [tid];
    let paramIndex = 2;

    if (filters.role !== 'admin' && filters.userId) {
      conditions.push(`c.created_by = $${paramIndex}`);
      params.push(filters.userId);
      paramIndex++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await pool.query(`SELECT COUNT(*) FROM clients c ${where}`, [...params]);

    const limitIdx = paramIndex;
    const offsetIdx = paramIndex + 1;
    const dataParams = [...params, pagination.limit, pagination.offset];

    const result = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.created_by
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    return {
      clients: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async create(clientData) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO clients (organization_id, name, phone, whatsapp, email, address, notes, source, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tid,
        clientData.name,
        clientData.phone,
        clientData.whatsapp || null,
        clientData.email || null,
        clientData.address || null,
        clientData.notes || null,
        clientData.source || null,
        clientData.createdBy || null,
      ]
    );

    return result.rows[0];
  }

  async update(id, clientData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        whatsapp = COALESCE($3, whatsapp),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        notes = COALESCE($6, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND organization_id = $8
       RETURNING *`,
      [
        clientData.name,
        clientData.phone,
        clientData.whatsapp,
        clientData.email,
        clientData.address,
        clientData.notes,
        id,
        tid,
      ]
    );

    return result.rows[0] || null;
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, tid]
    );
    return result.rows.length > 0;
  }

  async exists(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT 1 FROM clients WHERE id = $1 AND organization_id = $2',
      [id, tid]
    );
    return result.rows.length > 0;
  }

  async findByPhone(phone) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM clients WHERE phone = $1 AND organization_id = $2',
      [phone, tid]
    );
    return result.rows[0] || null;
  }

  async searchByPhone(phone) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM clients WHERE phone LIKE $1 AND organization_id = $2',
      [`%${phone}%`, tid]
    );
    return result.rows;
  }
}
