import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresServiceRateRepository {
  async findAll(filters = {}) {
    const tid = getTenantId();
    let query = `
      SELECT id, name, description, service_type, calc_method, base_rate,
             complexity_simple, complexity_medium, complexity_complex,
             is_active, created_at, updated_at
      FROM service_rates
      WHERE organization_id = $1
    `;
    const params = [tid];
    let paramIndex = 2;

    if (filters.serviceType) {
      query += ` AND service_type = $${paramIndex}`;
      params.push(filters.serviceType);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    query += ' ORDER BY service_type, name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, description, service_type, calc_method, base_rate,
              complexity_simple, complexity_medium, complexity_complex,
              is_active, created_at, updated_at
       FROM service_rates
       WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findByType(serviceType) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, description, service_type, calc_method, base_rate,
              complexity_simple, complexity_medium, complexity_complex,
              is_active
       FROM service_rates
       WHERE service_type = $1 AND is_active = true AND organization_id = $2`,
      [serviceType, tid]
    );
    return result.rows;
  }

  async create(rateData) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO service_rates (
        organization_id, name, description, service_type, calc_method, base_rate,
        complexity_simple, complexity_medium, complexity_complex, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tid,
        rateData.name,
        rateData.description || null,
        rateData.serviceType,
        rateData.calcMethod || 'per_meter',
        rateData.baseRate,
        rateData.complexitySimple || 1.0,
        rateData.complexityMedium || 1.3,
        rateData.complexityComplex || 2.0,
        rateData.isActive !== false,
      ]
    );
    return result.rows[0];
  }

  async update(id, rateData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE service_rates SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        service_type = COALESCE($4, service_type),
        calc_method = COALESCE($5, calc_method),
        base_rate = COALESCE($6, base_rate),
        complexity_simple = COALESCE($7, complexity_simple),
        complexity_medium = COALESCE($8, complexity_medium),
        complexity_complex = COALESCE($9, complexity_complex),
        is_active = COALESCE($10, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $11
      RETURNING *`,
      [
        id,
        rateData.name,
        rateData.description,
        rateData.serviceType,
        rateData.calcMethod,
        rateData.baseRate,
        rateData.complexitySimple,
        rateData.complexityMedium,
        rateData.complexityComplex,
        rateData.isActive,
        tid,
      ]
    );
    return result.rows[0];
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE service_rates SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, tid]
    );
    return result.rowCount > 0;
  }

  calculateCost(rate, quantity, complexity = 'simple') {
    const multipliers = {
      simple: parseFloat(rate.complexity_simple) || 1.0,
      medium: parseFloat(rate.complexity_medium) || 1.3,
      complex: parseFloat(rate.complexity_complex) || 2.0,
    };

    const multiplier = multipliers[complexity] || 1.0;
    const baseRate = parseFloat(rate.base_rate);

    return Math.round(baseRate * quantity * multiplier);
  }
}
