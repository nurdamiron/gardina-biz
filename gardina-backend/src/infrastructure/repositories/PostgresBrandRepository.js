import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresBrandRepository {
  async findAll(filters = {}) {
    const tid = getTenantId();
    let query = `
      SELECT id, name, country, description, website, is_active, created_at, updated_at
      FROM brands
      WHERE organization_id = $1
    `;
    const params = [tid];
    let paramIndex = 2;

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex} OR country ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY name ASC';

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
    return result.rows;
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, country, description, website, is_active, created_at, updated_at
       FROM brands
       WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT id, name, country, description, website, is_active, created_at, updated_at
       FROM brands
       WHERE name = $1 AND organization_id = $2`,
      [name, tid]
    );
    return result.rows[0] || null;
  }

  async create(brandData) {
    const tid = getTenantId();
    const result = await pool.query(
      `INSERT INTO brands (
        organization_id, name, country, description, website, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        tid,
        brandData.name,
        brandData.country || null,
        brandData.description || null,
        brandData.website || null,
        brandData.isActive !== false,
      ]
    );
    return result.rows[0];
  }

  async update(id, brandData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE brands SET
        name = COALESCE($2, name),
        country = COALESCE($3, country),
        description = COALESCE($4, description),
        website = COALESCE($5, website),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $7
      RETURNING *`,
      [
        id,
        brandData.name,
        brandData.country,
        brandData.description,
        brandData.website,
        brandData.isActive,
        tid,
      ]
    );
    return result.rows[0];
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE brands SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, tid]
    );
    return result.rowCount > 0;
  }

  async getProductColors(productId) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT pc.id, pc.product_id, pc.color_name, pc.color_code, pc.hex_color,
              pc.stock_quantity, pc.image_url, pc.is_available, pc.created_at, pc.updated_at
       FROM product_colors pc
       INNER JOIN products p ON p.id = pc.product_id AND p.organization_id = $2
       WHERE pc.product_id = $1
       ORDER BY pc.color_name ASC`,
      [productId, tid]
    );
    return result.rows;
  }

  async findColorById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT pc.id, pc.product_id, pc.color_name, pc.color_code, pc.hex_color,
              pc.stock_quantity, pc.image_url, pc.is_available, pc.created_at, pc.updated_at
       FROM product_colors pc
       INNER JOIN products p ON p.id = pc.product_id AND p.organization_id = $2
       WHERE pc.id = $1`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async createProductColor(colorData) {
    const tid = getTenantId();
    const check = await pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND organization_id = $2',
      [colorData.productId, tid]
    );
    if (check.rows.length === 0) {
      throw new Error('Product not found');
    }
    const result = await pool.query(
      `INSERT INTO product_colors (
        product_id, color_name, color_code, hex_color,
        stock_quantity, image_url, is_available
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        colorData.productId,
        colorData.colorName,
        colorData.colorCode,
        colorData.hexColor || null,
        colorData.stockQuantity || 0,
        colorData.imageUrl || null,
        colorData.isAvailable !== false,
      ]
    );
    return result.rows[0];
  }

  async updateProductColor(id, colorData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE product_colors AS pc SET
        color_name = COALESCE($2, color_name),
        color_code = COALESCE($3, color_code),
        hex_color = COALESCE($4, hex_color),
        stock_quantity = COALESCE($5, stock_quantity),
        image_url = COALESCE($6, image_url),
        is_available = COALESCE($7, is_available),
        updated_at = CURRENT_TIMESTAMP
      FROM products p
      WHERE pc.id = $1 AND pc.product_id = p.id AND p.organization_id = $8
      RETURNING pc.*`,
      [
        id,
        colorData.colorName,
        colorData.colorCode,
        colorData.hexColor,
        colorData.stockQuantity,
        colorData.imageUrl,
        colorData.isAvailable,
        tid,
      ]
    );
    return result.rows[0];
  }

  async deleteProductColor(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `DELETE FROM product_colors AS pc
       USING products p
       WHERE pc.id = $1 AND pc.product_id = p.id AND p.organization_id = $2
       RETURNING pc.id`,
      [id, tid]
    );
    return result.rowCount > 0;
  }

  async createProductColors(productId, colors) {
    const tid = getTenantId();
    const check = await pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND organization_id = $2',
      [productId, tid]
    );
    if (check.rows.length === 0) {
      throw new Error('Product not found');
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const createdColors = [];
      for (const color of colors) {
        const result = await client.query(
          `INSERT INTO product_colors (
            product_id, color_name, color_code, hex_color,
            stock_quantity, image_url, is_available
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [
            productId,
            color.colorName,
            color.colorCode,
            color.hexColor || null,
            color.stockQuantity || 0,
            color.imageUrl || null,
            color.isAvailable !== false,
          ]
        );
        createdColors.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdColors;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async colorCodeExists(productId, colorCode, excludeId = null) {
    const tid = getTenantId();
    let query = `
      SELECT COUNT(*)::int AS count
      FROM product_colors pc
      INNER JOIN products p ON p.id = pc.product_id AND p.organization_id = $2
      WHERE pc.product_id = $1 AND pc.color_code = $3
    `;
    const params = [productId, tid, colorCode];
    if (excludeId) {
      query += ` AND pc.id != $4`;
      params.push(excludeId);
    }
    const result = await pool.query(query, params);
    return result.rows[0].count > 0;
  }
}
