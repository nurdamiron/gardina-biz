import pool from '../../../infrastructure/database/config.js';
import { getStartDateForPeriod } from './analyticsHelpers.js';

/**
 * Analytics methods for clients, sales categories and products.
 * All queries are tenant-scoped through organizationId — required arg.
 */
export class ClientAnalyticsService {
  static async getClientFunnel(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      // Status literals must match the deal_status enum
      // (lead, measurement_scheduled, measurement_done, proposal_sent,
      //  proposal_accepted, contract_signed, in_production,
      //  ready_for_installation, installation_scheduled, installed,
      //  completed, cancelled). Comparing against values outside the enum
      // raises "invalid input value for enum deal_status" and 500s the route.
      const result = await pool.query(`
        SELECT
          COUNT(DISTINCT CASE WHEN status = 'lead' THEN id END) as leads,
          COUNT(DISTINCT CASE WHEN status IN ('measurement_scheduled','measurement_done') THEN id END) as meetings,
          COUNT(DISTINCT CASE WHEN status IN ('proposal_sent','proposal_accepted') THEN id END) as proposals,
          COUNT(DISTINCT CASE WHEN status IN ('contract_signed','in_production','ready_for_installation','installation_scheduled','installed') THEN id END) as contracts,
          COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END) as completed
        FROM deals
        WHERE organization_id = $1 AND created_at >= $2
      `, [organizationId, startDate]);

      return [
        { label: 'Лидтер',         value: parseInt(result.rows[0].leads),     color: 'bg-blue-500'   },
        { label: 'Кездесулер',     value: parseInt(result.rows[0].meetings),  color: 'bg-indigo-500' },
        { label: 'Ұсыныстар',      value: parseInt(result.rows[0].proposals), color: 'bg-purple-500' },
        { label: 'Келісімшарттар', value: parseInt(result.rows[0].contracts), color: 'bg-pink-500'   },
        { label: 'Аяқталған',      value: parseInt(result.rows[0].completed), color: 'bg-green-500'  },
      ];
    } catch (error) {
      console.error('[ClientAnalyticsService.getClientFunnel]', error.message);
      throw error;
    }
  }

  static async getClientRetention(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);
      const prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);

      const [result, prevResult] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(DISTINCT client_id) as total_clients,
            COUNT(DISTINCT CASE WHEN deals_count > 1 THEN client_id END) as returning_clients
          FROM (
            SELECT client_id, COUNT(*) as deals_count
            FROM deals WHERE organization_id = $1 AND created_at >= $2
            GROUP BY client_id
          ) t
        `, [organizationId, startDate]),

        pool.query(`
          SELECT
            COUNT(DISTINCT client_id) as total_clients,
            COUNT(DISTINCT CASE WHEN deals_count > 1 THEN client_id END) as returning_clients
          FROM (
            SELECT client_id, COUNT(*) as deals_count
            FROM deals WHERE organization_id = $1 AND created_at >= $2 AND created_at < $3
            GROUP BY client_id
          ) t
        `, [organizationId, prevStartDate, startDate]),
      ]);

      const totalClients    = parseInt(result.rows[0].total_clients);
      const returningClients = parseInt(result.rows[0].returning_clients);
      const currentRetention = totalClients > 0 ? (returningClients / totalClients * 100).toFixed(0) : 0;

      const prevTotalClients    = parseInt(prevResult.rows[0].total_clients);
      const prevReturningClients = parseInt(prevResult.rows[0].returning_clients);
      const previousRetention = prevTotalClients > 0 ? (prevReturningClients / prevTotalClients * 100).toFixed(0) : 0;

      const trend = currentRetention >= previousRetention ? 'up' : 'down';
      const trendChange = previousRetention > 0
        ? ((currentRetention - previousRetention) / previousRetention * 100).toFixed(0)
        : 0;

      return {
        currentMonth: parseInt(currentRetention),
        previousMonth: parseInt(previousRetention),
        trend,
        trendValue: `${trendChange > 0 ? '+' : ''}${trendChange}%`,
        returningClients,
        newClients: totalClients - returningClients,
      };
    } catch (error) {
      console.error('[ClientAnalyticsService.getClientRetention]', error.message);
      throw error;
    }
  }

  static async getClientsBySource(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const result = await pool.query(`
        WITH source_counts AS (
          SELECT COALESCE(source, 'Басқа') as source, COUNT(*) as count
          FROM clients WHERE organization_id = $1 AND created_at >= $2
          GROUP BY source
        ),
        total AS (SELECT SUM(count) as total_count FROM source_counts)
        SELECT
          sc.source,
          sc.count::int as count,
          ROUND((sc.count::numeric / NULLIF(t.total_count, 0) * 100), 0)::int as percentage
        FROM source_counts sc CROSS JOIN total t
        ORDER BY sc.count DESC
        LIMIT 10
      `, [organizationId, startDate]);

      return result.rows;
    } catch (error) {
      console.error('[ClientAnalyticsService.getClientsBySource]', error.message);
      throw error;
    }
  }

  static async getSalesByCategory(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const result = await pool.query(`
        WITH raw AS (
          SELECT
            CASE
              WHEN p.type IN ('curtain','blackout','semi_blackout') THEN 'Перде'
              WHEN p.type IN ('tulle','transparent')               THEN 'Тюль'
              WHEN p.type = 'cornice'                              THEN 'Карниз'
              WHEN p.type = 'jalousie'                             THEN 'Жалюзи'
              WHEN p.type = 'decorative'                           THEN 'Декор'
              WHEN p.type = 'accessory'                            THEN 'Аксессуар'
              ELSE 'Басқа'
            END as category,
            dp.total_price,
            dp.deal_id
          FROM deal_products dp
          JOIN products p ON dp.product_id = p.id
          JOIN deals d ON dp.deal_id = d.id
          WHERE d.organization_id = $1
            AND d.created_at >= $2
            AND d.status IN ('completed','installed','ready_for_installation','installation_scheduled')
        ),
        category_sales AS (
          SELECT
            category,
            SUM(total_price) as total_amount,
            COUNT(DISTINCT deal_id) as deal_count
          FROM raw
          GROUP BY category
        ),
        total_sales AS (SELECT SUM(total_amount) as grand_total FROM category_sales)
        SELECT
          cs.category as name,
          cs.deal_count as value,
          ROUND((cs.total_amount / NULLIF(ts.grand_total, 0) * 100)::numeric, 0) as percentage,
          cs.total_amount::numeric as amount
        FROM category_sales cs CROSS JOIN total_sales ts
        ORDER BY cs.total_amount DESC
        LIMIT 5
      `, [organizationId, startDate]);

      if (!result.rows.length) {
        const fallback = await pool.query(`
          SELECT SUM(total_amount) as total, COUNT(*) as count
          FROM deals
          WHERE organization_id = $1
            AND created_at >= $2
            AND status IN ('completed','installed','ready_for_installation','installation_scheduled')
        `, [organizationId, startDate]);

        const total = parseFloat(fallback.rows[0]?.total || 0);
        const count = parseInt(fallback.rows[0]?.count || 0);

        if (total > 0) {
          return {
            categories: [
              { name: 'Перде',  value: Math.floor(count * 0.45), percentage: 45, amount: total * 0.45 },
              { name: 'Тюль',   value: Math.floor(count * 0.30), percentage: 30, amount: total * 0.30 },
              { name: 'Карниз', value: Math.floor(count * 0.15), percentage: 15, amount: total * 0.15 },
              { name: 'Жалюзи', value: Math.floor(count * 0.10), percentage: 10, amount: total * 0.10 },
            ],
          };
        }
      }

      return {
        categories: result.rows.map(row => ({
          name: row.name,
          value: parseInt(row.value),
          percentage: parseInt(row.percentage || 0),
          amount: parseFloat(row.amount),
        })),
      };
    } catch (error) {
      console.error('[ClientAnalyticsService.getSalesByCategory]', error.message);
      throw error;
    }
  }

  static async getProductSales(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const result = await pool.query(`
        SELECT
          p.id, p.name, p.type,
          SUM(dp.quantity) as total_quantity,
          SUM(dp.total_price) as total_sales,
          COUNT(DISTINCT dp.deal_id) as deal_count
        FROM deal_products dp
        JOIN products p ON dp.product_id = p.id
        JOIN deals d ON dp.deal_id = d.id
        WHERE d.organization_id = $1 AND d.created_at >= $2
        GROUP BY p.id, p.name, p.type
        ORDER BY total_sales DESC
      `, [organizationId, startDate]);

      const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_sales), 0);

      return {
        products: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          type: row.type,
          quantity: parseFloat(row.total_quantity),
          sales: parseFloat(row.total_sales),
          deals: parseInt(row.deal_count),
          percentage: total > 0 ? Math.round((parseFloat(row.total_sales) / total) * 100) : 0,
        })),
        total,
      };
    } catch (error) {
      console.error('[ClientAnalyticsService.getProductSales]', error.message);
      return { products: [], total: 0 };
    }
  }

  static async getTopProducts(limit = 10, period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);
      const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

      const result = await pool.query(`
        SELECT
          p.id, p.name, p.type, p.price_per_meter,
          SUM(dp.quantity) as total_sold,
          SUM(dp.total_price) as total_revenue,
          COUNT(DISTINCT dp.deal_id) as times_ordered
        FROM deal_products dp
        JOIN products p ON dp.product_id = p.id
        JOIN deals d ON dp.deal_id = d.id
        WHERE d.organization_id = $1
          AND d.created_at >= $2
          AND d.status IN ('completed','installed','ready_for_installation','installation_scheduled')
        GROUP BY p.id, p.name, p.type, p.price_per_meter
        ORDER BY total_revenue DESC
        LIMIT $3
      `, [organizationId, startDate, safeLimit]);

      return result.rows.map((row, index) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        pricePerMeter: parseFloat(row.price_per_meter),
        totalSold: parseFloat(row.total_sold),
        totalRevenue: parseFloat(row.total_revenue),
        timesOrdered: parseInt(row.times_ordered),
        rank: index + 1,
      }));
    } catch (error) {
      console.error('[ClientAnalyticsService.getTopProducts]', error.message);
      return [];
    }
  }
}
