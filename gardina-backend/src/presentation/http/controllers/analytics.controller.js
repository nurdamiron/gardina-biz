import { DashboardAnalyticsService } from '../../../application/services/analytics/DashboardAnalyticsService.js';
import { DesignerAnalyticsService  } from '../../../application/services/analytics/DesignerAnalyticsService.js';
import { ClientAnalyticsService    } from '../../../application/services/analytics/ClientAnalyticsService.js';
import { TeamAnalyticsService      } from '../../../application/services/analytics/TeamAnalyticsService.js';
import { assertUserBelongsToOrganization } from '../../../application/services/analytics/analyticsHelpers.js';

const respondError = (res, error) => {
  const status = error.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  // 4xx carry intentional messages; 5xx must not leak DB/internal details to the
  // client in production (the real cause is already logged by the caller).
  const message = status < 500
    ? (error.message || 'Request error')
    : (isProd ? 'Не удалось загрузить данные. Попробуйте позже.' : (error.message || 'Internal error'));
  res.status(status).json({ success: false, error: message });
};

export class AnalyticsController {
  static async getDashboardStats(req, res) {
    try {
      const orgId = req.user.organizationId;
      const userRole = req.query.role || req.user.role;
      const targetUserId = req.query.userId || req.user.id;

      // If admin/manager passes ?userId=… it must belong to the same tenant
      if (req.query.userId && req.query.userId !== req.user.id) {
        await assertUserBelongsToOrganization(req.query.userId, orgId);
      }

      const data = await DashboardAnalyticsService.getDashboardStats(userRole, targetUserId, orgId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getDashboardStats]', error.message);
      respondError(res, error);
    }
  }

  static async getDesignerPerformance(req, res) {
    try {
      const orgId = req.user.organizationId;
      const { period = 'month' } = req.query;
      const targetDesignerId = req.query.designerId || req.user.id;

      if (req.query.designerId && req.query.designerId !== req.user.id) {
        await assertUserBelongsToOrganization(req.query.designerId, orgId);
      }

      const data = await DesignerAnalyticsService.getDesignerPerformance(targetDesignerId, period, orgId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getDesignerPerformance]', error.message);
      respondError(res, error);
    }
  }

  static async getDesignersRanking(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await DesignerAnalyticsService.getDesignersRanking(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getDesignersRanking]', error.message);
      respondError(res, error);
    }
  }

  static async getDesignerEarnings(req, res) {
    try {
      const orgId = req.user.organizationId;
      const { period = 'month' } = req.query;
      const targetDesignerId = req.query.designerId || req.user.id;

      if (req.query.designerId && req.query.designerId !== req.user.id) {
        await assertUserBelongsToOrganization(req.query.designerId, orgId);
      }

      const data = await DesignerAnalyticsService.getDesignerEarnings(targetDesignerId, period, orgId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getDesignerEarnings]', error.message);
      respondError(res, error);
    }
  }

  static async getWeeklyActivity(req, res) {
    try {
      const orgId = req.user.organizationId;
      const targetUserId = req.query.userId || req.user.id;
      const userRole = req.query.role || req.user.role;

      if (req.query.userId && req.query.userId !== req.user.id) {
        await assertUserBelongsToOrganization(req.query.userId, orgId);
      }

      const data = await DashboardAnalyticsService.getWeeklyActivity(targetUserId, userRole, orgId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getWeeklyActivity]', error.message);
      respondError(res, error);
    }
  }

  static async getMonthlyTrends(req, res) {
    try {
      const { type = 'revenue', period = 6 } = req.query;
      const data = await DashboardAnalyticsService.getMonthlyTrends(type, period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getMonthlyTrends]', error.message);
      respondError(res, error);
    }
  }

  static async getClientFunnel(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getClientFunnel(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getClientFunnel]', error.message);
      respondError(res, error);
    }
  }

  static async getClientRetention(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getClientRetention(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getClientRetention]', error.message);
      respondError(res, error);
    }
  }

  static async getClientsBySource(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getClientsBySource(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getClientsBySource]', error.message);
      respondError(res, error);
    }
  }

  static async getSalesByCategory(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getSalesByCategory(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getSalesByCategory]', error.message);
      respondError(res, error);
    }
  }

  static async getProductSales(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getProductSales(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getProductSales]', error.message);
      respondError(res, error);
    }
  }

  static async getTopProducts(req, res) {
    try {
      const { limit = 10, period = 'month' } = req.query;
      const data = await ClientAnalyticsService.getTopProducts(limit, period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getTopProducts]', error.message);
      respondError(res, error);
    }
  }

  static async getTeamKPIs(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await TeamAnalyticsService.getTeamKPIs(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getTeamKPIs]', error.message);
      respondError(res, error);
    }
  }

  static async getTeamEfficiency(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await TeamAnalyticsService.getTeamEfficiency(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getTeamEfficiency]', error.message);
      respondError(res, error);
    }
  }

  static async getRevenueBreakdown(req, res) {
    try {
      const { period = 'month' } = req.query;
      const data = await TeamAnalyticsService.getRevenueBreakdown(period, req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getRevenueBreakdown]', error.message);
      respondError(res, error);
    }
  }

  static async getPaymentRisks(req, res) {
    try {
      const data = await TeamAnalyticsService.getPaymentRisks(req.user.organizationId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('[AnalyticsController.getPaymentRisks]', error.message);
      respondError(res, error);
    }
  }
}
