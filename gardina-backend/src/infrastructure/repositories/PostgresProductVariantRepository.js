import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresProductVariantRepository {
  async getProductVariants(productId) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT v.id, v.product_id, v.variant_code, v.variant_name, v.hex_color,
              v.stock_quantity, v.image_url, v.is_available, v.is_default,
              v.created_at, v.updated_at
       FROM product_variants v
       INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $2
       WHERE v.product_id = $1
       ORDER BY v.is_default DESC, v.variant_code ASC`,
      [productId, tid]
    );
    return result.rows;
  }

  async findVariantById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT v.id, v.product_id, v.variant_code, v.variant_name, v.hex_color,
              v.stock_quantity, v.image_url, v.is_available, v.is_default,
              v.created_at, v.updated_at
       FROM product_variants v
       INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $2
       WHERE v.id = $1`,
      [id, tid]
    );
    return result.rows[0] || null;
  }

  async findVariantByCode(productId, variantCode) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT v.id, v.product_id, v.variant_code, v.variant_name, v.hex_color,
              v.stock_quantity, v.image_url, v.is_available, v.is_default,
              v.created_at, v.updated_at
       FROM product_variants v
       INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $3
       WHERE v.product_id = $1 AND v.variant_code = $2`,
      [productId, variantCode, tid]
    );
    return result.rows[0] || null;
  }

  async createVariant(variantData) {
    const tid = getTenantId();
    const check = await pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND organization_id = $2',
      [variantData.productId, tid]
    );
    if (check.rows.length === 0) {
      throw new Error('Product not found');
    }

    const result = await pool.query(
      `INSERT INTO product_variants (
        product_id, variant_code, variant_name, hex_color,
        stock_quantity, image_url, is_available, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        variantData.productId,
        variantData.variantCode,
        variantData.variantName || null,
        variantData.hexColor || null,
        variantData.stockQuantity || 0,
        variantData.imageUrl || null,
        variantData.isAvailable !== false,
        variantData.isDefault || false,
      ]
    );
    return result.rows[0];
  }

  async updateVariant(id, variantData) {
    const tid = getTenantId();
    const result = await pool.query(
      `UPDATE product_variants AS v SET
        variant_code = COALESCE($2, variant_code),
        variant_name = COALESCE($3, variant_name),
        hex_color = COALESCE($4, hex_color),
        stock_quantity = COALESCE($5, stock_quantity),
        image_url = COALESCE($6, image_url),
        is_available = COALESCE($7, is_available),
        is_default = COALESCE($8, is_default),
        updated_at = CURRENT_TIMESTAMP
      FROM products p
      WHERE v.id = $1 AND v.product_id = p.id AND p.organization_id = $9
      RETURNING v.*`,
      [
        id,
        variantData.variantCode,
        variantData.variantName,
        variantData.hexColor,
        variantData.stockQuantity,
        variantData.imageUrl,
        variantData.isAvailable,
        variantData.isDefault,
        tid,
      ]
    );
    return result.rows[0];
  }

  async deleteVariant(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `DELETE FROM product_variants AS v
       USING products p
       WHERE v.id = $1 AND v.product_id = p.id AND p.organization_id = $2
       RETURNING v.id`,
      [id, tid]
    );
    return result.rowCount > 0;
  }

  async createVariants(productId, variants) {
    const tid = getTenantId();
    const check = await pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND organization_id = $2',
      [productId, tid]
    );
    if (check.rows.length === 0) throw new Error('Product not found');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (variants.length > 0) {
        await client.query(
          `UPDATE product_variants v SET is_default = false
           FROM products p
           WHERE v.product_id = $1 AND v.product_id = p.id AND p.organization_id = $2`,
          [productId, tid]
        );
      }

      const createdVariants = [];
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const result = await client.query(
          `INSERT INTO product_variants (
            product_id, variant_code, variant_name, hex_color,
            stock_quantity, image_url, is_available, is_default
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (product_id, variant_code)
          DO UPDATE SET
            variant_name = EXCLUDED.variant_name,
            hex_color = EXCLUDED.hex_color,
            stock_quantity = EXCLUDED.stock_quantity,
            image_url = EXCLUDED.image_url,
            is_available = EXCLUDED.is_available,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *`,
          [
            productId,
            variant.variantCode,
            variant.variantName || null,
            variant.hexColor || null,
            variant.stockQuantity || 0,
            variant.imageUrl || null,
            variant.isAvailable !== false,
            i === 0,
          ]
        );
        createdVariants.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdVariants;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async variantCodeExists(productId, variantCode, excludeId = null) {
    const tid = getTenantId();
    let query = `
      SELECT COUNT(*)::int AS count
      FROM product_variants v
      INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $2
      WHERE v.product_id = $1 AND v.variant_code = $3
    `;
    const params = [productId, tid, variantCode];
    if (excludeId) {
      query += ` AND v.id != $4`;
      params.push(excludeId);
    }
    const result = await pool.query(query, params);
    return result.rows[0].count > 0;
  }

  async setDefaultVariant(productId, variantId) {
    const tid = getTenantId();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE product_variants v SET is_default = false
         FROM products p
         WHERE v.product_id = $1 AND v.product_id = p.id AND p.organization_id = $2`,
        [productId, tid]
      );

      const result = await client.query(
        `UPDATE product_variants v SET is_default = true
         FROM products p
         WHERE v.id = $1 AND v.product_id = $2 AND v.product_id = p.id AND p.organization_id = $3
         RETURNING v.*`,
        [variantId, productId, tid]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTotalStock(productId) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT COALESCE(SUM(v.stock_quantity), 0) as total_stock
       FROM product_variants v
       INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $2
       WHERE v.product_id = $1 AND v.is_available = true`,
      [productId, tid]
    );
    return parseInt(result.rows[0].total_stock);
  }

  async searchProductsByVariantCode(variantCode) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT
        p.id, p.name, p.type, p.price_per_meter, p.cost_price, p.width_cm,
        p.brand, p.supplier, p.image_url, p.is_available, p.unit,
        v.id as variant_id, v.variant_code, v.variant_name, v.stock_quantity,
        v.hex_color, v.image_url as variant_image_url, v.is_default
       FROM products p
       INNER JOIN product_variants v ON p.id = v.product_id
       WHERE p.organization_id = $2 AND v.variant_code ILIKE $1 AND p.is_available = true
       ORDER BY p.name ASC`,
      [`%${variantCode}%`, tid]
    );
    return result.rows;
  }
}
