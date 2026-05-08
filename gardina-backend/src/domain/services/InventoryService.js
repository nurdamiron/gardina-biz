import pool from '../../infrastructure/database/config.js';
import { getTenantId } from '../../infrastructure/tenant/tenantContext.js';

export class InventoryService {
  /**
   * Log inventory change
   */
  static async logChange(client, { productId, variantId, amount, reason, referenceId, referenceType, userId }) {
    const tid = getTenantId();

    let currentStock = 0;
    if (variantId) {
      const res = await client.query(
        `SELECT v.stock_quantity FROM product_variants v
         INNER JOIN products p ON p.id = v.product_id AND p.organization_id = $2
         WHERE v.id = $1`,
        [variantId, tid]
      );
      currentStock = parseFloat(res.rows[0]?.stock_quantity || 0);
    } else {
      const res = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1 AND organization_id = $2',
        [productId, tid]
      );
      currentStock = parseFloat(res.rows[0]?.stock_quantity || 0);
    }

    const newStock = currentStock + amount;

    if (variantId) {
      await client.query(
        `UPDATE product_variants v SET stock_quantity = $1, updated_at = NOW()
         FROM products p
         WHERE v.id = $2 AND v.product_id = p.id AND p.organization_id = $3`,
        [newStock, variantId, tid]
      );
    } else {
      await client.query(
        'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3',
        [newStock, productId, tid]
      );
    }

    await client.query(
      `
      INSERT INTO inventory_logs (
        organization_id, product_id, variant_id, change_amount, previous_stock, new_stock,
        reason, reference_id, reference_type, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
      [
        tid,
        productId,
        variantId,
        amount,
        currentStock,
        newStock,
        reason,
        referenceId,
        referenceType,
        userId,
      ]
    );

    return newStock;
  }

  static async deductStockForDeal(dealId, userId = null) {
    const client = await pool.connect();
    const tid = getTenantId();
    try {
      await client.query('BEGIN');

      const checkRes = await client.query(
        `SELECT 1 FROM inventory_logs
         WHERE reference_id = $1 AND reference_type = 'deal' AND reason = 'sale'
           AND organization_id = $2
         LIMIT 1`,
        [dealId, tid]
      );

      if (checkRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const itemsRes = await client.query(
        `SELECT dp.product_id, dp.variant_id, dp.quantity FROM deal_products dp
         INNER JOIN deals d ON d.id = dp.deal_id AND d.organization_id = $2
         WHERE dp.deal_id = $1`,
        [dealId, tid]
      );

      for (const item of itemsRes.rows) {
        const amt = -1 * parseFloat(item.quantity || 1);

        await this.logChange(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          amount: amt,
          reason: 'sale',
          referenceId: dealId,
          referenceType: 'deal',
          userId,
        });
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deducting stock:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async restoreStockForDeal(dealId, userId = null) {
    const client = await pool.connect();
    const tid = getTenantId();
    try {
      await client.query('BEGIN');

      const checkRes = await client.query(
        `SELECT product_id, variant_id, change_amount FROM inventory_logs
         WHERE reference_id = $1 AND reference_type = 'deal' AND reason = 'sale'
           AND organization_id = $2`,
        [dealId, tid]
      );

      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const restoredCheck = await client.query(
        `SELECT 1 FROM inventory_logs
         WHERE reference_id = $1 AND reference_type = 'deal' AND reason = 'cancellation_restore'
           AND organization_id = $2
         LIMIT 1`,
        [dealId, tid]
      );

      if (restoredCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return false;
      }

      for (const item of checkRes.rows) {
        const restoreAmount = Math.abs(parseFloat(item.change_amount));

        await this.logChange(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          amount: restoreAmount,
          reason: 'cancellation_restore',
          referenceId: dealId,
          referenceType: 'deal',
          userId,
        });
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error restoring stock:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
