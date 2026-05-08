import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

/**
 * PostgreSQL Proposal Repository
 */
export class PostgresProposalRepository {
  async create(proposalData) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO proposals (
        organization_id, measurement_id, client_id, designer_id, variant_name,
        fabric_cost, sewing_cost, installation_cost, total_cost,
        status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tid,
        proposalData.measurementId,
        proposalData.clientId,
        proposalData.designerId,
        proposalData.variantName,
        proposalData.fabricCost,
        proposalData.sewingCost,
        proposalData.installationCost,
        proposalData.totalCost,
        proposalData.status || 'draft',
        proposalData.notes || null,
      ]
    );

    return result.rows[0];
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT p.*, c.created_by AS client_created_by
       FROM proposals p
       LEFT JOIN clients c ON c.id = p.client_id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findByMeasurementId(measurementId) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM proposals WHERE measurement_id = $1 AND organization_id = $2',
      [measurementId, tid]
    );
    return result.rows;
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const conditions = ['p.organization_id = $1'];
    const filterParams = [tid];
    let paramIndex = 2;

    if (filters.clientId) {
      conditions.push(`p.client_id = $${paramIndex}`);
      filterParams.push(filters.clientId);
      paramIndex++;
    }

    if (filters.designerId) {
      conditions.push(`p.designer_id = $${paramIndex}`);
      filterParams.push(filters.designerId);
      paramIndex++;
    }

    if (filters.managerId) {
      conditions.push(`c.created_by = $${paramIndex}`);
      filterParams.push(filters.managerId);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`p.status = $${paramIndex}`);
      filterParams.push(filters.status);
      paramIndex++;
    }

    const where = conditions.join(' AND ');

    const dataQuery = `
      SELECT p.*, c.created_by AS client_created_by
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS count
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE ${where}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(dataQuery, [...filterParams, pagination.limit, pagination.offset]),
      pool.query(countQuery, filterParams),
    ]);

    return {
      proposals: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async update(id, proposalData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE proposals SET
        variant_name = COALESCE($1, variant_name),
        fabric_cost = COALESCE($2, fabric_cost),
        sewing_cost = COALESCE($3, sewing_cost),
        installation_cost = COALESCE($4, installation_cost),
        total_cost = COALESCE($5, total_cost),
        notes = COALESCE($6, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND organization_id = $8
      RETURNING *`,
      [
        proposalData.variantName,
        proposalData.fabricCost,
        proposalData.sewingCost,
        proposalData.installationCost,
        proposalData.totalCost,
        proposalData.notes,
        id,
        tid,
      ]
    );
    return result.rows[0] || null;
  }

  async updateStatus(id, status) {
    const tid = getTenantId();
    const result = await pool.query(
      'UPDATE proposals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3 RETURNING *',
      [status, id, tid]
    );
    return result.rows[0];
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'DELETE FROM proposals WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, tid]
    );
    return result.rows.length > 0;
  }
}
