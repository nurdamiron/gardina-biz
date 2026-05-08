import express from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Все роуты аналитики требуют авторизации
router.use(authenticate);

// Dashboard stats — all authenticated roles (filters by role internally)
router.get('/dashboard-stats', AnalyticsController.getDashboardStats);

// Designer performance — designer sees own, manager/admin see any
router.get('/designer-performance', AnalyticsController.getDesignerPerformance);
router.get('/designer-earnings', AnalyticsController.getDesignerEarnings);

// Designers ranking — designer, manager, admin (motivation/comparison)
router.get('/designers-ranking', AnalyticsController.getDesignersRanking);

// Weekly activity — all authenticated roles (filters by user internally)
router.get('/weekly-activity', AnalyticsController.getWeeklyActivity);

// Product analytics — admin and manager only (business data)
router.get('/product-sales', authorize('admin', 'manager'), AnalyticsController.getProductSales);
router.get('/top-products', authorize('admin', 'manager'), AnalyticsController.getTopProducts);
router.get('/sales-by-category', authorize('admin', 'manager'), AnalyticsController.getSalesByCategory);

// Trend analytics — admin and manager only
router.get('/monthly-trends', authorize('admin', 'manager'), AnalyticsController.getMonthlyTrends);

// Client analytics — admin, manager, sales only
router.get('/client-funnel', authorize('admin', 'manager', 'sales'), AnalyticsController.getClientFunnel);
router.get('/client-retention', authorize('admin', 'manager'), AnalyticsController.getClientRetention);
router.get('/clients-by-source', authorize('admin', 'manager'), AnalyticsController.getClientsBySource);

// Team analytics — admin and manager only (contains individual salaries/commissions)
router.get('/team-kpis', authorize('admin', 'manager'), AnalyticsController.getTeamKPIs);
router.get('/team-efficiency', authorize('admin', 'manager'), AnalyticsController.getTeamEfficiency);

// Revenue analytics — admin only (most sensitive financial data)
router.get('/revenue-breakdown', authorize('admin'), AnalyticsController.getRevenueBreakdown);
router.get('/payment-risks', authorize('admin', 'manager'), AnalyticsController.getPaymentRisks);

export default router;