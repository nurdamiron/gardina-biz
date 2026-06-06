import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { measurementsAPI, ordersAPI, analyticsAPI, clientsAPI, usersAPI } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [measurements, setMeasurements] = useState([]);
  const [deals, setDeals] = useState([]);
  const [clients, setClients] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [analytics, setAnalytics] = useState({
    dashboardStats: null,
    designerPerformance: null,
    designersRanking: null,
    productSales: null,
    weeklyActivity: null,
    monthlyTrends: null,
    clientFunnel: null,
    teamKPIs: null,
  });
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // True when one or more analytics widgets failed to load (so the UI can tell
  // the user instead of silently showing zeros).
  const [analyticsError, setAnalyticsError] = useState(false);

  // Use refs for cache timestamps to avoid stale closures
  const lastFetchRef = useRef(null);
  const lastAnalyticsFetchRef = useRef(null);

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;

  const loadData = useCallback(async (_unused, force = false) => {
    if (!force && lastFetchRef.current && Date.now() - lastFetchRef.current < CACHE_DURATION) {
      return null; // data is fresh, no fetch needed
    }

    try {
      setLoading(true);

      // No filters needed — backend filters by role from the JWT token
      const [measurementsRes, dealsRes] = await Promise.all([
        measurementsAPI.getAll({}),
        ordersAPI.getAll({}),
      ]);

      const newMeasurements = measurementsRes.data.data || [];
      const newDeals = dealsRes.data.data || [];

      setMeasurements(newMeasurements);
      setDeals(newDeals);
      lastFetchRef.current = Date.now();
      setLoading(false);

      return { measurements: newMeasurements, deals: newDeals };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const refreshData = useCallback(() => {
    return loadData(null, true);
  }, [loadData]);

  // Load analytics data
  const loadAnalytics = useCallback(async (role, userId, options = {}) => {
    const { force = false } = options;

    if (!force && lastAnalyticsFetchRef.current && Date.now() - lastAnalyticsFetchRef.current < CACHE_DURATION) {
      return null; // data is fresh
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError(false);
      const newAnalytics = {};
      let anyAnalyticsFailed = false;

      // Load data based on role
      if (role === 'admin') {
        const [
          dashboardStats,
          designersRanking,
          productSales,
          monthlyTrends,
          clientFunnel,
          teamKPIs,
          clientsRes,
          designersRes
        ] = await Promise.allSettled([
          analyticsAPI.getDashboardStats('admin', userId),
          analyticsAPI.getDesignersRanking(),
          analyticsAPI.getSalesByCategory(),
          analyticsAPI.getMonthlyTrends('revenue', 6),
          analyticsAPI.getClientFunnel(),
          analyticsAPI.getTeamKPIs(),
          clientsAPI.getAll(),
          usersAPI.getDesigners()
        ]);

        if (dashboardStats.status === 'fulfilled') newAnalytics.dashboardStats = dashboardStats.value.data.data;
        if (designersRanking.status === 'fulfilled') newAnalytics.designersRanking = designersRanking.value.data.data;
        if (productSales.status === 'fulfilled') newAnalytics.productSales = productSales.value.data.data;
        if (monthlyTrends.status === 'fulfilled') newAnalytics.monthlyTrends = monthlyTrends.value.data.data;
        if (clientFunnel.status === 'fulfilled') newAnalytics.clientFunnel = clientFunnel.value.data.data;
        if (teamKPIs.status === 'fulfilled') newAnalytics.teamKPIs = teamKPIs.value.data.data;
        const loadedClients = clientsRes.status === 'fulfilled' ? (clientsRes.value.data.data || []) : [];
        const loadedDesigners = designersRes.status === 'fulfilled' ? (designersRes.value.data.data || []) : [];
        setClients(loadedClients);
        setDesigners(loadedDesigners);
        newAnalytics._clients = loadedClients; // expose for callers
        anyAnalyticsFailed = [dashboardStats, designersRanking, productSales, monthlyTrends, clientFunnel, teamKPIs]
          .some(r => r.status === 'rejected');

      } else if (role === 'manager') {
        const [
          dashboardStats,
          weeklyActivity,
          designersRanking,
          clientsRes
        ] = await Promise.allSettled([
          analyticsAPI.getDashboardStats('manager', userId),
          analyticsAPI.getWeeklyActivity(userId, 'manager'),
          analyticsAPI.getDesignersRanking(),
          clientsAPI.getAll()
        ]);

        if (dashboardStats.status === 'fulfilled') newAnalytics.dashboardStats = dashboardStats.value.data.data;
        if (weeklyActivity.status === 'fulfilled') newAnalytics.weeklyActivity = weeklyActivity.value.data.data;
        if (designersRanking.status === 'fulfilled') newAnalytics.designersRanking = designersRanking.value.data.data;
        const loadedManagerClients = clientsRes.status === 'fulfilled' ? (clientsRes.value.data.data || []) : [];
        setClients(loadedManagerClients);
        newAnalytics._clients = loadedManagerClients;
        anyAnalyticsFailed = [dashboardStats, weeklyActivity, designersRanking]
          .some(r => r.status === 'rejected');

      } else if (role === 'designer') {
        const [
          dashboardStats,
          designerPerformance,
          designerEarnings,
          designersRanking
        ] = await Promise.allSettled([
          analyticsAPI.getDashboardStats('designer', userId),
          analyticsAPI.getDesignerPerformance(userId),
          analyticsAPI.getDesignerEarnings(userId),
          analyticsAPI.getDesignersRanking()
        ]);

        if (dashboardStats.status === 'fulfilled') newAnalytics.dashboardStats = dashboardStats.value.data.data;
        if (designerPerformance.status === 'fulfilled') newAnalytics.designerPerformance = designerPerformance.value.data.data;
        if (designerEarnings.status === 'fulfilled') newAnalytics.designerEarnings = designerEarnings.value.data.data;
        if (designersRanking.status === 'fulfilled') newAnalytics.designersRanking = designersRanking.value.data.data;
        anyAnalyticsFailed = [dashboardStats, designerPerformance, designerEarnings, designersRanking]
          .some(r => r.status === 'rejected');
      }

      setAnalytics(prev => ({ ...prev, ...newAnalytics }));
      lastAnalyticsFetchRef.current = Date.now();
      setAnalyticsError(anyAnalyticsFailed);
      setAnalyticsLoading(false);

      return newAnalytics;
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsError(true);
      setAnalyticsLoading(false);
      // Don't throw - return partial data
      return analytics;
    }
  }, []);

  // Invalidate both data and analytics caches so the next loadData/loadAnalytics
  // call fetches fresh data from the server (important after mutations)
  const invalidateCache = useCallback(() => {
    lastFetchRef.current = null;
    lastAnalyticsFetchRef.current = null;
  }, []);

  const addMeasurement = useCallback((measurement) => {
    setMeasurements(prev => [measurement, ...prev]);
    invalidateCache();
  }, [invalidateCache]);

  const updateMeasurement = useCallback((id, updates) => {
    setMeasurements(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
    invalidateCache();
  }, [invalidateCache]);

  const addDeal = useCallback((deal) => {
    setDeals(prev => [deal, ...prev]);
    invalidateCache();
  }, [invalidateCache]);

  const value = {
    // Core data
    measurements,
    deals,
    clients,
    designers,

    // Analytics data
    analytics,

    // Loading states
    loading,
    analyticsLoading,
    analyticsError,

    // Methods
    loadData,
    refreshData,
    loadAnalytics,
    invalidateCache,
    addMeasurement,
    updateMeasurement,
    addDeal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
