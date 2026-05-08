/**
 * @deprecated Import from the specific service instead:
 *   DashboardAnalyticsService  — dashboard stats, weekly activity, monthly trends
 *   DesignerAnalyticsService   — designer performance, ranking, earnings
 *   ClientAnalyticsService     — funnel, retention, sources, products
 *   TeamAnalyticsService       — KPIs, efficiency, revenue, payment risks
 *
 * This file re-exports everything for backward compatibility only.
 */

export { DashboardAnalyticsService } from './analytics/DashboardAnalyticsService.js';
export { DesignerAnalyticsService  } from './analytics/DesignerAnalyticsService.js';
export { ClientAnalyticsService    } from './analytics/ClientAnalyticsService.js';
export { TeamAnalyticsService      } from './analytics/TeamAnalyticsService.js';

// ── Compatibility facade ───────────────────────────────────────────────────────
import { DashboardAnalyticsService } from './analytics/DashboardAnalyticsService.js';
import { DesignerAnalyticsService  } from './analytics/DesignerAnalyticsService.js';
import { ClientAnalyticsService    } from './analytics/ClientAnalyticsService.js';
import { TeamAnalyticsService      } from './analytics/TeamAnalyticsService.js';

export class AnalyticsService {
  static getDashboardStats(...a)     { return DashboardAnalyticsService.getDashboardStats(...a); }
  static getWeeklyActivity(...a)     { return DashboardAnalyticsService.getWeeklyActivity(...a); }
  static getMonthlyTrends(...a)      { return DashboardAnalyticsService.getMonthlyTrends(...a); }

  static getDesignerPerformance(...a){ return DesignerAnalyticsService.getDesignerPerformance(...a); }
  static getDesignersRanking(...a)   { return DesignerAnalyticsService.getDesignersRanking(...a); }
  static getDesignerEarnings(...a)   { return DesignerAnalyticsService.getDesignerEarnings(...a); }

  static getClientFunnel(...a)       { return ClientAnalyticsService.getClientFunnel(...a); }
  static getClientRetention(...a)    { return ClientAnalyticsService.getClientRetention(...a); }
  static getClientsBySource(...a)    { return ClientAnalyticsService.getClientsBySource(...a); }
  static getSalesByCategory(...a)    { return ClientAnalyticsService.getSalesByCategory(...a); }
  static getProductSales(...a)       { return ClientAnalyticsService.getProductSales(...a); }
  static getTopProducts(...a)        { return ClientAnalyticsService.getTopProducts(...a); }

  static getTeamKPIs(...a)           { return TeamAnalyticsService.getTeamKPIs(...a); }
  static getTeamEfficiency(...a)     { return TeamAnalyticsService.getTeamEfficiency(...a); }
  static getRevenueBreakdown(...a)   { return TeamAnalyticsService.getRevenueBreakdown(...a); }
  static getPaymentRisks(...a)       { return TeamAnalyticsService.getPaymentRisks(...a); }
}
