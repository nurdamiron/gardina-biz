import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';

export class PostgresPaymentRepository {
  async addPayment({
    measurementId = null,
    orderId = null,
    dealId = null,
    type,
    amount,
    note,
    paymentMethod = 'cash',
    paidAt,
    createdBy,
  }) {
    const tid = getTenantId();

    if (!measurementId && !orderId && !dealId) {
      throw new Error('At least one of measurementId, orderId, or dealId must be provided');
    }

    const validTypes = ['prepayment', 'final', 'partial', 'refund'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid payment type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validMethods = ['cash', 'card', 'transfer', 'online'];
    if (paymentMethod && !validMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const result = await pool.query(
      `INSERT INTO payments (organization_id, measurement_id, order_id, deal_id, type, amount, note, payment_method, paid_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        tid,
        measurementId,
        orderId,
        dealId,
        type,
        amount,
        note || null,
        paymentMethod,
        paidAt || new Date(),
        createdBy || null,
      ]
    );
    return result.rows[0];
  }

  async findByMeasurement(measurementId) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT * FROM payments WHERE measurement_id = $1 AND organization_id = $2 ORDER BY paid_at DESC`,
      [measurementId, tid]
    );
    return res.rows;
  }

  async findByOrder(orderId) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT * FROM payments WHERE order_id = $1 AND organization_id = $2 ORDER BY paid_at DESC`,
      [orderId, tid]
    );
    return res.rows;
  }

  async findByDeal(dealId) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT * FROM payments WHERE deal_id = $1 AND organization_id = $2 ORDER BY paid_at DESC`,
      [dealId, tid]
    );
    return res.rows;
  }

  async findById(id) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT * FROM payments WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );
    return res.rows[0] || null;
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const conditions = ['organization_id = $1'];
    const filterParams = [tid];
    let paramIndex = 2;

    if (filters.startDate) {
      conditions.push(`paid_at >= $${paramIndex}`);
      filterParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      conditions.push(`paid_at <= $${paramIndex}`);
      filterParams.push(filters.endDate);
      paramIndex++;
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      filterParams.push(filters.type);
      paramIndex++;
    }

    if (filters.measurementId) {
      conditions.push(`measurement_id = $${paramIndex}`);
      filterParams.push(filters.measurementId);
      paramIndex++;
    }

    if (filters.dealId) {
      conditions.push(`deal_id = $${paramIndex}`);
      filterParams.push(filters.dealId);
      paramIndex++;
    }

    if (filters.orderId) {
      conditions.push(`order_id = $${paramIndex}`);
      filterParams.push(filters.orderId);
      paramIndex++;
    }

    if (filters.createdBy) {
      conditions.push(`created_by = $${paramIndex}`);
      filterParams.push(filters.createdBy);
      paramIndex++;
    }

    const where = conditions.join(' AND ');

    const [result, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM payments WHERE ${where} ORDER BY paid_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...filterParams, pagination.limit, pagination.offset]
      ),
      pool.query(`SELECT COUNT(*) AS count FROM payments WHERE ${where}`, filterParams),
    ]);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async getTotalByMeasurement(measurementId) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE measurement_id = $1 AND organization_id = $2`,
      [measurementId, tid]
    );
    return parseFloat(res.rows[0].total);
  }

  async getTotalByDeal(dealId) {
    const tid = getTenantId();
    const res = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE deal_id = $1 AND organization_id = $2`,
      [dealId, tid]
    );
    return parseFloat(res.rows[0].total);
  }

  async delete(id) {
    const tid = getTenantId();
    const res = await pool.query(
      `DELETE FROM payments WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, tid]
    );
    return res.rows.length > 0;
  }
}
