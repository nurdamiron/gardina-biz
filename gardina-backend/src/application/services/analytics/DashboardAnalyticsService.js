import pool from '../../../infrastructure/database/config.js';
import { getStartDateForPeriod } from './analyticsHelpers.js';

/**
 * Analytics for main dashboards, weekly activity and monthly trends.
 * All queries are tenant-scoped through organizationId — required arg.
 */
export class DashboardAnalyticsService {
  static async getDashboardStats(role, userId, organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        newClientsResult,
        prevNewClientsResult,
        returningClientsResult,
        totalClientsResult,
        prevRetentionResult,
      ] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as count FROM clients
           WHERE organization_id = $1 AND created_at >= $2`,
          [organizationId, startOfMonth]
        ),
        pool.query(
          `SELECT COUNT(*) as count FROM clients
           WHERE organization_id = $1 AND created_at >= $2 AND created_at < $3`,
          [organizationId, startOfPrevMonth, startOfMonth]
        ),
        pool.query(
          `SELECT COUNT(DISTINCT client_id) as count FROM deals
           WHERE organization_id = $1 AND created_at >= $2
           GROUP BY client_id HAVING COUNT(*) > 1`,
          [organizationId, startOfMonth]
        ),
        pool.query(
          `SELECT COUNT(DISTINCT client_id) as count FROM deals
           WHERE organization_id = $1 AND created_at >= $2`,
          [organizationId, startOfMonth]
        ),
        pool.query(
          `SELECT
             COUNT(DISTINCT client_id) as total_clients,
             COUNT(DISTINCT CASE WHEN deals_count > 1 THEN client_id END) as returning_clients
           FROM (
             SELECT client_id, COUNT(*) as deals_count FROM deals
             WHERE organization_id = $1 AND created_at >= $2 AND created_at < $3
             GROUP BY client_id
           ) t`,
          [organizationId, startOfPrevMonth, startOfMonth]
        ),
      ]);

      const newClients = parseInt(newClientsResult.rows[0].count);
      const prevNewClients = parseInt(prevNewClientsResult.rows[0].count);
      const growth = prevNewClients > 0
        ? ((newClients - prevNewClients) / prevNewClients * 100).toFixed(0)
        : 0;

      const returningClients = parseInt(returningClientsResult.rows[0]?.count || 0);
      const totalClients = parseInt(totalClientsResult.rows[0]?.count || 0);
      const retentionRate = totalClients > 0
        ? (returningClients / totalClients * 100).toFixed(0)
        : 0;

      const prevTotalClients = parseInt(prevRetentionResult.rows[0]?.total_clients || 1);
      const prevReturningClients = parseInt(prevRetentionResult.rows[0]?.returning_clients || 0);
      const prevRetentionRate = prevTotalClients > 0
        ? (prevReturningClients / prevTotalClients * 100)
        : 0;
      const retentionGrowth = prevRetentionRate > 0
        ? ((retentionRate - prevRetentionRate) / prevRetentionRate * 100).toFixed(0)
        : 0;

      const stats = {
        newClients,
        newClientsGrowth: `${growth > 0 ? '+' : ''}${growth}%`,
        retentionRate: `${retentionRate}%`,
        retentionGrowth: `${retentionGrowth > 0 ? '+' : ''}${retentionGrowth}%`,
      };

      if (role === 'admin') {
        const [revenueResult, employeesResult] = await Promise.all([
          pool.query(
            `SELECT
               SUM(total_amount) as revenue,
               COUNT(*) as total_deals,
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_deals
             FROM deals
             WHERE organization_id = $1 AND created_at >= $2`,
            [organizationId, startOfMonth]
          ),
          pool.query(
            `SELECT COUNT(*) as count FROM users
             WHERE organization_id = $1 AND role IN ('designer','manager') AND is_active = true`,
            [organizationId]
          ),
        ]);

        stats.totalRevenue = parseFloat(revenueResult.rows[0].revenue || 0);
        stats.totalDeals = parseInt(revenueResult.rows[0].total_deals);
        stats.completedDeals = parseInt(revenueResult.rows[0].completed_deals);
        stats.activeEmployees = parseInt(employeesResult.rows[0].count);

      } else if (role === 'manager') {
        const [managerStatsResult, teamPerfResult] = await Promise.all([
          pool.query(
            `SELECT COUNT(*) as my_deals, SUM(total_amount) as my_revenue
             FROM deals
             WHERE organization_id = $1 AND designer_id = $2 AND created_at >= $3`,
            [organizationId, userId, startOfMonth]
          ),
          pool.query(
            `SELECT AVG(efficiency_score) as avg_efficiency FROM users
             WHERE organization_id = $1 AND role IN ('designer','manager')`,
            [organizationId]
          ),
        ]);

        stats.myDeals = parseInt(managerStatsResult.rows[0].my_deals);
        stats.myRevenue = parseFloat(managerStatsResult.rows[0].my_revenue || 0);
        stats.teamPerformance = Math.round(parseFloat(teamPerfResult.rows[0]?.avg_efficiency || 75));

      } else if (role === 'designer') {
        const [designerStatsResult, targetResult] = await Promise.all([
          pool.query(
            `SELECT
               SUM(d.total_amount) as personal_revenue,
               COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as completed,
               COUNT(CASE WHEN m.status = 'scheduled' THEN 1 END) as pending
             FROM measurements m
             LEFT JOIN deals d ON d.measurement_id = m.id AND d.organization_id = $1
             WHERE m.organization_id = $1
               AND m.designer_id = $2
               AND m.created_at >= $3`,
            [organizationId, userId, startOfMonth]
          ),
          pool.query(
            `SELECT monthly_target FROM users WHERE id = $1 AND organization_id = $2`,
            [userId, organizationId]
          ),
        ]);

        stats.personalRevenue = parseFloat(designerStatsResult.rows[0].personal_revenue || 0);
        stats.completedMeasurements = parseInt(designerStatsResult.rows[0].completed);
        stats.pendingMeasurements = parseInt(designerStatsResult.rows[0].pending);
        stats.monthlyTarget = parseInt(targetResult.rows[0]?.monthly_target || 20);
      }

      return stats;
    } catch (error) {
      console.error('[DashboardAnalyticsService.getDashboardStats]', error.message);
      throw error;
    }
  }

  static async getWeeklyActivity(userId, role, organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const days = [
        { shortName: 'Дүй', fullName: 'Дүйсенбі' },
        { shortName: 'Сей', fullName: 'Сейсенбі' },
        { shortName: 'Сәр', fullName: 'Сәрсенбі' },
        { shortName: 'Бей', fullName: 'Бейсенбі' },
        { shortName: 'Жұм', fullName: 'Жұма'     },
        { shortName: 'Сен', fullName: 'Сенбі'    },
        { shortName: 'Жек', fullName: 'Жексенбі' },
      ];

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const dayRanges = days.map((_, i) => {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        return { dayStart, dayEnd };
      });

      const results = await Promise.all(
        dayRanges.map(({ dayStart, dayEnd }) =>
          role === 'designer'
            ? pool.query(
                `SELECT COUNT(*) as count FROM measurements
                 WHERE organization_id = $1 AND designer_id = $2
                   AND created_at >= $3 AND created_at < $4`,
                [organizationId, userId, dayStart, dayEnd]
              )
            : pool.query(
                `SELECT COUNT(*) as count FROM deals
                 WHERE organization_id = $1
                   AND created_at >= $2 AND created_at < $3`,
                [organizationId, dayStart, dayEnd]
              )
        )
      );

      return {
        days: days.map((day, i) => ({
          ...day,
          activities: parseInt(results[i].rows[0].count),
        })),
      };
    } catch (error) {
      console.error('[DashboardAnalyticsService.getWeeklyActivity]', error.message);
      throw error;
    }
  }

  static async getMonthlyTrends(type = 'revenue', period = 6, organizationId) {
    if (!organizationId) throw new Error('organizationId is required');
    try {
      const months = ['Қаң','Ақп','Нау','Сәу','Мам','Мау','Шіл','Там','Қыр','Қаз','Қар','Жел'];

      const now = new Date();
      const ranges = [];
      for (let i = period - 1; i >= 0; i--) {
        // Build months from (year, month-i, 1) so day-31 dates don't roll over
        // into the next month (which produced duplicate/skipped labels).
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        ranges.push({ label: months[start.getMonth()], monthIndex: start.getMonth(), start, end });
      }

      const tableMap = {
        revenue: `SELECT SUM(total_amount) as value FROM deals
                  WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
        deals:   `SELECT COUNT(*) as value FROM deals
                  WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
        clients: `SELECT COUNT(*) as value FROM clients
                  WHERE organization_id = $1 AND created_at >= $2 AND created_at <= $3`,
      };

      const query = tableMap[type] || tableMap.revenue;
      const results = await Promise.all(
        ranges.map(({ start, end }) => pool.query(query, [organizationId, start, end]))
      );

      return ranges.map(({ label, monthIndex }, i) => ({
        label,
        monthIndex,
        value: type === 'revenue'
          ? parseFloat(results[i].rows[0].value || 0)
          : parseInt(results[i].rows[0].value || 0),
      }));
    } catch (error) {
      console.error('[DashboardAnalyticsService.getMonthlyTrends]', error.message);
      throw error;
    }
  }
}
