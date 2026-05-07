import pool from '../../../infrastructure/database/config.js';
import { getStartDateForPeriod } from './analyticsHelpers.js';

/**
 * Analytics methods for team performance, revenue and payment risks.
 * All queries are tenant-scoped through organizationId — required arg.
 */
export class TeamAnalyticsService {
  static async getTeamKPIs(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const [designersResult, managersResult, revenueResult, avgDealResult] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed,
            COALESCE(SUM(DISTINCT u.monthly_target), 100) as total_target,
            AVG(u.efficiency_score) as avg_efficiency
          FROM users u
          LEFT JOIN measurements m ON m.designer_id = u.id
            AND m.organization_id = u.organization_id
            AND m.created_at >= $2
          WHERE u.organization_id = $1 AND u.role = 'designer'
        `, [organizationId, startDate]),

        pool.query(`
          SELECT
            COUNT(DISTINCT CASE WHEN d.status = 'completed' THEN d.id END) as closed,
            COALESCE(SUM(DISTINCT u.monthly_target), 50) as total_target,
            AVG(u.efficiency_score) as avg_efficiency
          FROM users u
          LEFT JOIN deals d ON d.designer_id = u.id
            AND d.organization_id = u.organization_id
            AND d.created_at >= $2
          WHERE u.organization_id = $1 AND u.role = 'manager'
        `, [organizationId, startDate]),

        pool.query(`
          SELECT SUM(d.total_amount) as revenue, AVG(u.efficiency_score) as overall_efficiency
          FROM deals d
          LEFT JOIN users u ON u.id = d.designer_id AND u.organization_id = d.organization_id
          WHERE d.organization_id = $1 AND d.created_at >= $2
        `, [organizationId, startDate]),

        pool.query(
          `SELECT AVG(total_amount) as avg_deal FROM deals
           WHERE organization_id = $1 AND status = 'completed'`,
          [organizationId]
        ),
      ]);

      const avgDeal = parseFloat(avgDealResult.rows[0]?.avg_deal || 500000);
      const expectedDeals =
        parseInt(designersResult.rows[0]?.total_target || 100) +
        parseInt(managersResult.rows[0]?.total_target || 50);

      return {
        designers: {
          completedMeasurements: parseInt(designersResult.rows[0]?.completed || 0),
          target: parseInt(designersResult.rows[0]?.total_target || 100),
          efficiency: Math.round(parseFloat(designersResult.rows[0]?.avg_efficiency || 75)),
        },
        managers: {
          closedDeals: parseInt(managersResult.rows[0]?.closed || 0),
          target: parseInt(managersResult.rows[0]?.total_target || 50),
          efficiency: Math.round(parseFloat(managersResult.rows[0]?.avg_efficiency || 75)),
        },
        overall: {
          revenue: parseFloat(revenueResult.rows[0]?.revenue || 0),
          target: Math.round(avgDeal * expectedDeals * 0.4),
          efficiency: Math.round(parseFloat(revenueResult.rows[0]?.overall_efficiency || 75)),
        },
      };
    } catch (error) {
      console.error('[TeamAnalyticsService.getTeamKPIs]', error.message);
      throw error;
    }
  }

  static async getTeamEfficiency(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const [measurementTimeResult, conversionResult, avgCheckResult, satisfactionResult] = await Promise.all([
        pool.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (m.updated_at - m.created_at))/3600) as avg_time
          FROM measurements m
          WHERE m.organization_id = $1
            AND m.status = 'completed'
            AND m.created_at >= $2
            AND m.updated_at IS NOT NULL
        `, [organizationId, startDate]),

        pool.query(`
          SELECT
            COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN m.id END)::numeric /
            NULLIF(COUNT(DISTINCT m.id), 0) * 100 as conversion_rate
          FROM measurements m
          LEFT JOIN deals d ON d.measurement_id = m.id AND d.organization_id = $1
          WHERE m.organization_id = $1 AND m.created_at >= $2
        `, [organizationId, startDate]),

        pool.query(`
          SELECT AVG(total_amount) as avg_check
          FROM deals
          WHERE organization_id = $1
            AND created_at >= $2
            AND status IN ('completed','installing','ready')
        `, [organizationId, startDate]),

        pool.query(`
          SELECT AVG(customer_rating) as avg_rating
          FROM deals
          WHERE organization_id = $1
            AND customer_rating IS NOT NULL
            AND created_at >= $2
        `, [organizationId, startDate]),
      ]);

      return {
        averageMeasurementTime: parseFloat(measurementTimeResult.rows[0]?.avg_time || 2.5).toFixed(1),
        conversionRate: Math.round(parseFloat(conversionResult.rows[0]?.conversion_rate || 0)),
        averageCheck: Math.round(parseFloat(avgCheckResult.rows[0]?.avg_check || 0)),
        customerSatisfaction: parseFloat(satisfactionResult.rows[0]?.avg_rating || 4.5).toFixed(1),
      };
    } catch (error) {
      console.error('[TeamAnalyticsService.getTeamEfficiency]', error.message);
      throw error;
    }
  }

  static async getRevenueBreakdown(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const result = await pool.query(`
        SELECT SUM(total_amount) as total FROM deals
        WHERE organization_id = $1 AND created_at >= $2
      `, [organizationId, startDate]);

      const total = parseFloat(result.rows[0].total || 0);

      return {
        fabric:       total * 0.50,
        sewing:       total * 0.25,
        installation: total * 0.15,
        accessories:  total * 0.10,
        total,
      };
    } catch (error) {
      console.error('[TeamAnalyticsService.getRevenueBreakdown]', error.message);
      throw error;
    }
  }

  static async getPaymentRisks(organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const result = await pool.query(`
        SELECT
          d.id as order_id,
          c.name as client_name,
          d.total_amount as amount,
          d.updated_at,
          d.payment_status
        FROM deals d
        JOIN clients c ON c.id = d.client_id AND c.organization_id = d.organization_id
        WHERE d.organization_id = $1
          AND d.payment_status IN ('pending','partial')
          AND d.status NOT IN ('cancelled','completed')
        ORDER BY d.updated_at ASC
        LIMIT 10
      `, [organizationId]);

      return result.rows.map(row => {
        const daysOverdue = Math.floor(
          (new Date() - new Date(row.updated_at)) / (1000 * 60 * 60 * 24)
        );
        let riskLevel = 'low';
        if (daysOverdue > 14) riskLevel = 'high';
        else if (daysOverdue > 7) riskLevel = 'medium';

        return {
          orderId: row.order_id,
          clientName: row.client_name,
          amount: parseFloat(row.amount),
          daysOverdue,
          riskLevel,
        };
      });
    } catch (error) {
      console.error('[TeamAnalyticsService.getPaymentRisks]', error.message);
      throw error;
    }
  }
}
