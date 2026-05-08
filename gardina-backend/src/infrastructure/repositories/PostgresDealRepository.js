import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';
import { Deal } from '../../domain/aggregates/Deal.js';
import { IDealRepository } from '../../domain/repositories/IDealRepository.js';

/**
 * PostgreSQL implementation of IDealRepository
 */
export class PostgresDealRepository extends IDealRepository {
  async save(deal) {
    const client = await pool.connect();
    const tid = getTenantId();

    try {
      await client.query('BEGIN');

      const existsResult = await client.query(
        'SELECT id FROM deals WHERE id = $1 AND organization_id = $2',
        [deal.id, tid]
      );

      let result;

      if (existsResult.rows.length > 0) {
        result = await client.query(
          `UPDATE deals SET
            client_id = $1,
            designer_id = $2,
            measurement_id = $3,
            proposal_id = $4,
            status = $5,
            total_amount = $6,
            prepayment = $7,
            prepayment_percent = $8,
            final_payment = $9,
            payment_status = $10,
            deadline = $11,
            designer_commission_percent = $12,
            designer_commission = $13,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $14 AND organization_id = $15
          RETURNING *`,
          [
            deal.clientId,
            deal.designerId,
            deal.measurementId,
            deal.proposalId,
            deal.status,
            deal.totalAmount?.amount || null,
            deal.prepayment.amount,
            deal.prepaymentPercent,
            deal.finalPayment.amount,
            deal.paymentStatus,
            deal.deadline,
            deal.designerCommissionPercent,
            deal.designerCommission?.amount || null,
            deal.id,
            tid,
          ]
        );
      } else {
        result = await client.query(
          `INSERT INTO deals (
            id, organization_id, client_id, designer_id, measurement_id, proposal_id,
            status, total_amount, prepayment, prepayment_percent,
            final_payment, payment_status, deadline,
            designer_commission_percent, designer_commission
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *`,
          [
            deal.id,
            tid,
            deal.clientId,
            deal.designerId,
            deal.measurementId,
            deal.proposalId,
            deal.status,
            deal.totalAmount?.amount || null,
            deal.prepayment.amount,
            deal.prepaymentPercent,
            deal.finalPayment.amount,
            deal.paymentStatus,
            deal.deadline,
            deal.designerCommissionPercent,
            deal.designerCommission?.amount || null,
          ]
        );
      }

      for (const event of deal.domainEvents) {
        await client.query(
          `INSERT INTO deal_events (organization_id, deal_id, event_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            tid,
            deal.id,
            event.eventType,
            `Status changed: ${event.oldStatus || 'new'} -> ${event.newStatus || deal.status}`,
            JSON.stringify(event.toJSON()),
          ]
        );
      }

      if (deal.measurementId) {
        await client.query(
          `DELETE FROM deal_products dp
           USING deals d
           WHERE dp.deal_id = $1 AND d.id = dp.deal_id AND d.organization_id = $2`,
          [deal.id, tid]
        );

        const insertRes = await client.query(
          `
          INSERT INTO deal_products (deal_id, organization_id, product_id, variant_id, quantity, unit_price, total_price)
          SELECT
            $1,
            $3,
            ri.fabric_id,
            ri.variant_id,
            ri.quantity,
            COALESCE(p.price_per_meter, 0),
            COALESCE(p.price_per_meter * ri.quantity, 0)
          FROM room_items ri
          JOIN rooms r ON r.id = ri.room_id
          JOIN products p ON p.id = ri.fabric_id
          WHERE r.measurement_id = $2 AND ri.fabric_id IS NOT NULL
            AND p.organization_id = $3
          RETURNING *
        `,
          [deal.id, deal.measurementId, tid]
        );
        console.log('Inserted deal_products count:', insertRes.rows.length);
      }

      await client.query('COMMIT');

      deal.clearDomainEvents();

      return this._mapToDomain(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM deals WHERE id = $1 AND organization_id = $2',
      [id, tid]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToDomain(result.rows[0]);
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const conditions = ['d.organization_id = $1'];
    const params = [tid];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`d.status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.clientId) {
      conditions.push(`d.client_id = $${paramIndex++}`);
      params.push(filters.clientId);
    }
    if (filters.designerId) {
      conditions.push(`d.designer_id = $${paramIndex++}`);
      params.push(filters.designerId);
    }
    if (filters.paymentStatus) {
      conditions.push(`d.payment_status = $${paramIndex++}`);
      params.push(filters.paymentStatus);
    }
    if (filters.managerId) {
      conditions.push(`c.created_by = $${paramIndex++}`);
      params.push(filters.managerId);
    }

    const whereClause = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM deals d
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT d.*, c.name as client_name, c.address as client_address, u.name as designer_name
      FROM deals d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN users u ON d.designer_id = u.id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(pagination.limit, pagination.offset);

    const result = await pool.query(query, params);

    return {
      deals: result.rows.map(row => ({
        ...this._mapToDomain(row).toJSON(),
        client: {
          name: row.client_name,
          address: row.client_address,
        },
        designer: {
          name: row.designer_name,
        },
      })),
      total,
      offset: pagination.offset,
      limit: pagination.limit,
    };
  }

  async findByClientId(clientId) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM deals WHERE client_id = $1 AND organization_id = $2 ORDER BY created_at DESC',
      [clientId, tid]
    );

    return result.rows.map(row => this._mapToDomain(row));
  }

  async findByDesignerId(designerId) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM deals WHERE designer_id = $1 AND organization_id = $2 ORDER BY created_at DESC',
      [designerId, tid]
    );

    return result.rows.map(row => this._mapToDomain(row));
  }

  async findByStatus(status) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT * FROM deals WHERE status = $1 AND organization_id = $2 ORDER BY created_at DESC',
      [status, tid]
    );

    return result.rows.map(row => this._mapToDomain(row));
  }

  async delete(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'DELETE FROM deals WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, tid]
    );

    return result.rows.length > 0;
  }

  async exists(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT 1 FROM deals WHERE id = $1 AND organization_id = $2',
      [id, tid]
    );

    return result.rows.length > 0;
  }

  async findByIdWithRelations(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT
        d.*,
        c.name as client_name, c.phone as client_phone, c.created_by as client_created_by,
        u.name as designer_name,
        m.address as measurement_address,
        p.variant_name as proposal_variant
      FROM deals d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN users u ON d.designer_id = u.id
      LEFT JOIN measurements m ON d.measurement_id = m.id
      LEFT JOIN proposals p ON d.proposal_id = p.id
      WHERE d.id = $1 AND d.organization_id = $2`,
      [id, tid]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const deal = this._mapToDomain(row);

    return {
      ...deal.toJSON(),
      client: {
        name: row.client_name,
        phone: row.client_phone,
        createdBy: row.client_created_by,
      },
      designer: {
        name: row.designer_name,
      },
      measurement: row.measurement_address
        ? {
            address: row.measurement_address,
          }
        : null,
      proposal: row.proposal_variant
        ? {
            variant: row.proposal_variant,
          }
        : null,
    };
  }

  async getFunnelStats(filters = {}) {
    const tid = getTenantId();
    const needsJoin = !!filters.managerId;
    let query = needsJoin
      ? `SELECT d.status, COUNT(*) as count, SUM(d.total_amount) as total_amount
         FROM deals d JOIN clients c ON c.id = d.client_id
         WHERE d.organization_id = $1`
      : `SELECT status, COUNT(*) as count, SUM(total_amount) as total_amount
         FROM deals WHERE organization_id = $1`;

    const params = [tid];
    let paramIndex = 2;

    const col = name => (needsJoin ? `d.${name}` : name);

    if (filters.managerId) {
      query += ` AND c.created_by = $${paramIndex}`;
      params.push(filters.managerId);
      paramIndex++;
    }

    if (filters.designerId) {
      query += ` AND ${col('designer_id')} = $${paramIndex}`;
      params.push(filters.designerId);
      paramIndex++;
    }

    if (filters.clientId) {
      query += ` AND ${col('client_id')} = $${paramIndex}`;
      params.push(filters.clientId);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND ${needsJoin ? 'd.' : ''}created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND ${needsJoin ? 'd.' : ''}created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += needsJoin ? ' GROUP BY d.status' : ' GROUP BY status';

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      totalAmount: parseFloat(row.total_amount || 0),
    }));
  }

  _mapToDomain(row) {
    return new Deal({
      id: row.id,
      clientId: row.client_id,
      designerId: row.designer_id,
      measurementId: row.measurement_id,
      proposalId: row.proposal_id,
      status: row.status,
      totalAmount: row.total_amount ? parseFloat(row.total_amount) : null,
      prepayment: row.prepayment ? parseFloat(row.prepayment) : 0,
      prepaymentPercent: row.prepayment_percent ? parseFloat(row.prepayment_percent) : 50,
      finalPayment: row.final_payment ? parseFloat(row.final_payment) : 0,
      paymentStatus: row.payment_status,
      deadline: row.deadline,
      designerCommissionPercent: row.designer_commission_percent ? parseFloat(row.designer_commission_percent) : 7,
      designerCommission: row.designer_commission ? parseFloat(row.designer_commission) : null,
      installationDate: row.installation_date || null,
      cancellationReason: row.cancellation_reason || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
