import pool from '../../../infrastructure/database/config.js';
import { getStartDateForPeriod } from './analyticsHelpers.js';

/**
 * Analytics methods specific to designer performance and earnings.
 * All queries are tenant-scoped through organizationId — required arg.
 */
export class DesignerAnalyticsService {
  static async getDesignerPerformance(designerId, period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const prevStartDate = new Date(startDate);
      if (period === 'month') {
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      } else {
        prevStartDate.setDate(prevStartDate.getDate() - 30);
      }

      const [result, prevResult, targetResult, rankResult] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed,
            COUNT(*) as total,
            AVG(CASE WHEN d.total_amount IS NOT NULL THEN d.total_amount ELSE 0 END) as average_check
          FROM measurements m
          LEFT JOIN deals d ON d.measurement_id = m.id AND d.organization_id = $3
          WHERE m.organization_id = $3
            AND m.designer_id = $1
            AND m.created_at >= $2
        `, [designerId, startDate, organizationId]),

        pool.query(`
          SELECT
            COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed,
            COUNT(*) as total,
            AVG(CASE WHEN d.total_amount IS NOT NULL THEN d.total_amount ELSE 0 END) as average_check
          FROM measurements m
          LEFT JOIN deals d ON d.measurement_id = m.id AND d.organization_id = $4
          WHERE m.organization_id = $4
            AND m.designer_id = $1
            AND m.created_at >= $2
            AND m.created_at < $3
        `, [designerId, prevStartDate, startDate, organizationId]),

        pool.query(
          `SELECT monthly_target FROM users WHERE id = $1 AND organization_id = $2`,
          [designerId, organizationId]
        ),

        pool.query(`
          WITH current_rank AS (
            SELECT COUNT(*) + 1 as rank
            FROM users u
            LEFT JOIN measurements m ON m.designer_id = u.id
              AND m.organization_id = u.organization_id
              AND m.created_at >= $1
            WHERE u.organization_id = $6
              AND u.role = 'designer'
              AND u.id != $2
            GROUP BY u.id
            HAVING COUNT(CASE WHEN m.status = 'completed' THEN 1 END) > $3
          ),
          prev_rank AS (
            SELECT COUNT(*) + 1 as rank
            FROM users u
            LEFT JOIN measurements m ON m.designer_id = u.id
              AND m.organization_id = u.organization_id
              AND m.created_at >= $4 AND m.created_at < $1
            WHERE u.organization_id = $6
              AND u.role = 'designer'
              AND u.id != $2
            GROUP BY u.id
            HAVING COUNT(CASE WHEN m.status = 'completed' THEN 1 END) > $5
          )
          SELECT
            COALESCE((SELECT rank FROM current_rank LIMIT 1), 1) as current,
            COALESCE((SELECT rank FROM prev_rank LIMIT 1), 1) as previous
        `, [startDate, designerId, 0, prevStartDate, 0, organizationId]),
      ]);

      const completed = parseInt(result.rows[0].completed);
      const total = parseInt(result.rows[0].total);
      const averageCheck = parseFloat(result.rows[0].average_check || 0);

      const prevCompleted = parseInt(prevResult.rows[0].completed);
      const prevTotal = parseInt(prevResult.rows[0].total);
      const prevAverageCheck = parseFloat(prevResult.rows[0].average_check || 0);

      const conversionRate = total > 0 ? (completed / total * 100).toFixed(0) : 0;
      const prevConversionRate = prevTotal > 0 ? (prevCompleted / prevTotal * 100) : 0;

      const averageCheckTrend = averageCheck >= prevAverageCheck ? 'up' : 'down';
      const averageCheckChange = prevAverageCheck > 0
        ? ((averageCheck - prevAverageCheck) / prevAverageCheck * 100).toFixed(0)
        : 0;

      const conversionTrend = conversionRate >= prevConversionRate ? 'up' : 'down';
      const conversionChange = prevConversionRate > 0
        ? ((conversionRate - prevConversionRate) / prevConversionRate * 100).toFixed(0)
        : 0;

      const monthlyTarget = parseInt(targetResult.rows[0]?.monthly_target || 20);
      const kpiProgress = monthlyTarget > 0
        ? Math.min(100, Math.round((completed / monthlyTarget) * 100))
        : 0;

      const currentRank = parseInt(rankResult.rows[0]?.current || 1);
      const previousRank = parseInt(rankResult.rows[0]?.previous || 1);

      return {
        currentMonthMeasurements: completed,
        monthlyTarget,
        averageCheck,
        averageCheckTrend,
        averageCheckTrendValue: `${averageCheckChange > 0 ? '+' : ''}${averageCheckChange}%`,
        conversionRate: `${conversionRate}%`,
        conversionTrend,
        conversionTrendValue: `${conversionChange > 0 ? '+' : ''}${conversionChange}%`,
        monthlyRankChange: previousRank - currentRank,
        kpiProgress,
        remainingToNextLevel: Math.max(0, monthlyTarget - completed),
      };
    } catch (error) {
      console.error('[DesignerAnalyticsService.getDesignerPerformance]', error.message);
      throw error;
    }
  }

  static async getDesignersRanking(period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const startDate = getStartDateForPeriod(period);

      const result = await pool.query(`
        SELECT
          u.id,
          u.name,
          COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed_measurements,
          COUNT(m.id) as total_measurements,
          COUNT(DISTINCT d.id) as deals_count,
          SUM(CASE WHEN d.total_amount IS NOT NULL THEN d.total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN d.total_amount IS NOT NULL THEN d.total_amount ELSE 0 END) as average_check
        FROM users u
        LEFT JOIN measurements m ON m.designer_id = u.id
          AND m.organization_id = u.organization_id
          AND m.created_at >= $1
        LEFT JOIN deals d ON d.measurement_id = m.id
          AND d.organization_id = u.organization_id
        WHERE u.organization_id = $2
          AND u.role = 'designer'
        GROUP BY u.id, u.name
        ORDER BY completed_measurements DESC, total_revenue DESC
      `, [startDate, organizationId]);

      return result.rows.map((row, index) => {
        const completed = parseInt(row.completed_measurements);
        const total = parseInt(row.total_measurements);
        return {
          id: row.id,
          name: row.name,
          completedMeasurements: completed,
          // Real count of linked deals — the ranking shows revenue from deals, so
          // the order count must come from deals too (not completed measurements,
          // which can be 0 while deals/revenue exist).
          completedDeals: parseInt(row.deals_count || 0),
          totalRevenue: parseFloat(row.total_revenue || 0),
          averageCheck: parseFloat(row.average_check || 0),
          conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          rating: index + 1,
        };
      });
    } catch (error) {
      console.error('[DesignerAnalyticsService.getDesignersRanking]', error.message);
      throw error;
    }
  }

  static async getDesignerEarnings(designerId, period = 'month', organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      // Kazakh short month names, kept as a label fallback. The client localizes
      // the axis from `monthIndex` instead of relying on these strings.
      const months = ['Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау', 'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'];
      const now = new Date();
      const queries = [];

      for (let i = 5; i >= 0; i--) {
        // Build month boundaries directly from year/month so day-31 dates never
        // overflow into the next month (the old setMonth() approach did).
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        queries.push({ monthIndex: start.getMonth(), label: months[start.getMonth()], start, end });
      }

      const results = await Promise.all(
        queries.map(({ start, end }) =>
          // Bucket by the DEAL date and sum deal revenue regardless of measurement
          // status, so the revenue series matches the aggregate totals (average
          // check / conversion) instead of going empty when measurements aren't
          // yet flagged 'completed'.
          pool.query(`
            SELECT SUM(d.total_amount) as revenue
            FROM deals d
            JOIN measurements m ON m.id = d.measurement_id AND m.organization_id = $4
            WHERE d.organization_id = $4
              AND m.designer_id = $1
              AND d.created_at >= $2
              AND d.created_at <= $3
          `, [designerId, start, end, organizationId])
        )
      );

      const monthly = queries.map(({ label, monthIndex }, i) => ({
        label,
        monthIndex,
        value: parseFloat(results[i].rows[0].revenue || 0),
      }));

      const total = monthly.reduce((sum, m) => sum + m.value, 0);

      return {
        monthly,
        total,
        average: monthly.length > 0 ? total / monthly.length : 0,
      };
    } catch (error) {
      console.error('[DesignerAnalyticsService.getDesignerEarnings]', error.message);
      throw error;
    }
  }
}
