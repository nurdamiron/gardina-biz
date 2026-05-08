import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

/**
 * Fabric Repository — queries unified `products` table per tenant
 */
export class PostgresFabricRepository {
  async searchByCode(search, type = null, limit = 10) {
    const tid = getTenantId();
    const p = [tid, `%${search}%`];
    let typeIdx = 3;
    if (type) {
      if (Array.isArray(type)) p.push(type);
      else if (type.includes(',')) p.push(type.split(','));
      else p.push(type);
    }
    p.push(search);
    p.push(`${search}%`);
    p.push(limit);

    const typeClause = type
      ? `AND type ${Array.isArray(type) || type.includes(',') ? '= ANY($3)' : '= $3'}`
      : '';

    const idxExact = type ? 4 : 3;
    const idxStarts = type ? 5 : 4;
    const idxLimit = type ? 6 : 5;

    const simpleQuery = `
       SELECT id, name, type, price_per_meter, cost_price, width_cm,
              brand, supplier, stock_quantity, image_url, is_available, unit
       FROM products
       WHERE organization_id = $1 AND name ILIKE $2 AND is_available = true
       ${typeClause}
       ORDER BY
         CASE WHEN lower(name) = lower($${idxExact}) THEN 0
              WHEN lower(name) LIKE lower($${idxStarts}) THEN 1
              ELSE 2
         END,
         name ASC
       LIMIT $${idxLimit}
    `;

    const result = await pool.query(simpleQuery, p);
    return result.rows;
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, type, price_per_meter, cost_price, width_cm,
              brand, supplier, stock_quantity, image_url, is_available, unit,
              code, category, created_at, updated_at
       FROM products
       WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findByCode(code) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, type, price_per_meter, cost_price, width_cm,
              brand, supplier, stock_quantity, image_url, is_available, unit,
              code, category, created_at, updated_at
       FROM products
       WHERE code = $1 AND organization_id = $2 AND is_available = true`,
      [code, tid]
    );
    return result.rows[0] || null;
  }

  async findAll(filters = {}) {
    const tid = getTenantId();
    let query = `
      SELECT id, name, type, price_per_meter, cost_price, width_cm,
             brand, supplier, stock_quantity, image_url, is_available, unit,
             created_at, updated_at
      FROM products
      WHERE organization_id = $1
    `;
    const params = [tid];
    let paramIndex = 2;

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.isAvailable !== undefined) {
      query += ` AND is_available = $${paramIndex}`;
      params.push(filters.isAvailable);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM products WHERE organization_id = $1',
      [tid]
    );

    return {
      fabrics: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async generateUniqueCode(prefix = 'PROD') {
    const tid = getTenantId();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    let code = `${prefix}-${timestamp}${random}`;

    const exists = await pool.query(
      'SELECT id FROM products WHERE code = $1 AND organization_id = $2',
      [code, tid]
    );
    if (exists.rows.length > 0) {
      code = `${prefix}-${timestamp}${random}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    }

    return code;
  }

  async create(fabricData) {
    const tid = getTenantId();
    let code = fabricData.code;
    if (!code || code.trim() === '') {
      const typePrefix = (fabricData.type || 'PROD').substring(0, 4).toUpperCase();
      code = await this.generateUniqueCode(typePrefix);
    }

    const result = await pool.query(
      `INSERT INTO products (
        organization_id, name, type, price_per_meter, cost_price, width_cm,
        brand, supplier, stock_quantity, image_url, is_available, unit, code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tid,
        fabricData.name,
        fabricData.type,
        fabricData.pricePerMeter,
        fabricData.costPrice,
        fabricData.widthCm || 280,
        fabricData.brand || null,
        fabricData.supplier || null,
        fabricData.stockQuantity || 0,
        fabricData.imageUrl || null,
        fabricData.isAvailable !== false,
        fabricData.unit || 'm',
        code,
      ]
    );

    return result.rows[0];
  }

  async update(id, fabricData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($2, name),
        type = COALESCE($3, type),
        price_per_meter = COALESCE($4, price_per_meter),
        cost_price = COALESCE($5, cost_price),
        width_cm = COALESCE($6, width_cm),
        brand = COALESCE($7, brand),
        supplier = COALESCE($8, supplier),
        stock_quantity = COALESCE($9, stock_quantity),
        image_url = COALESCE($10, image_url),
        is_available = COALESCE($11, is_available),
        unit = COALESCE($12, unit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $13
      RETURNING *`,
      [
        id,
        fabricData.name,
        fabricData.type,
        fabricData.pricePerMeter,
        fabricData.costPrice,
        fabricData.widthCm,
        fabricData.brand,
        fabricData.supplier,
        fabricData.stockQuantity,
        fabricData.imageUrl,
        fabricData.isAvailable,
        fabricData.unit,
        tid,
      ]
    );
    return result.rows[0];
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE products SET is_available = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, tid]
    );
    return result.rowCount > 0;
  }
}
