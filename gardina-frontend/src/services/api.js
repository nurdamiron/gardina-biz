import axios from 'axios';

/**
 * Backend mounts routes under `/api` (e.g. POST /api/auth/register-salon).
 * If VITE_API_URL is set to the host only (https://api.example.com), requests
 * would hit /auth/... and return 404 "Not Found".
 */
function normalizeApiBaseUrl(raw) {
  const fallback = 'http://localhost:5000/api';
  if (raw == null || String(raw).trim() === '') return fallback;
  let u = String(raw).trim().replace(/\/+$/, '');
  if (!u.endsWith('/api')) u = `${u}/api`;
  return u;
}

// Base API configuration
const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

/** Human-readable API error for UI (KZ). */
export function getAxiosApiError(err, fallback = 'Қате орын алды') {
  const status = err.response?.status;
  const d = err.response?.data;
  if (typeof d === 'string' && d.trim()) return d.trim();
  if (d && typeof d === 'object') {
    if (d.error != null && String(d.error).trim()) return String(d.error).trim();
    if (d.message != null && String(d.message).trim()) return String(d.message).trim();
  }
  if (status === 404) {
    return 'Сервер жолы табылмады (404). API мекенжайы /api деп аяқталуы керек (мысалы: https://api.gardina.kz/api).';
  }
  if (!err.response) {
    return 'Желіге қосылу мүмкін емес. Интернет пен API мекенжайын тексеріңіз.';
  }
  return fallback;
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh state — prevents multiple concurrent refresh calls (race condition fix)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      isRefreshing = false;
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      axios
        .post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken })
        .then((response) => {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          resolve(api(originalRequest));
        })
        .catch((refreshError) => {
          processQueue(refreshError, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (phone, password, organizationSlug) =>
    api.post('/auth/login', {
      phone,
      password,
      ...(organizationSlug ? { organizationSlug } : {}),
    }),
  register: (userData) => api.post('/auth/register', userData),
  registerSalon: (payload) => api.post('/auth/register-salon', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// Billing / tariffs (authenticated)
export const billingAPI = {
  status: () => api.get('/billing/status'),
  selectPlan: (body) => api.post('/billing/select-plan', body),
  startProTrial: () => api.post('/billing/start-pro-trial'),
};

// Clients API
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (clientData) => api.post('/clients', clientData),
  update: (id, clientData) => api.put(`/clients/${id}`, clientData),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Orders API (new)
export const ordersAPI = {
  getFunnel: (filters = {}) => api.get('/orders/funnel', { params: filters }),
  getAll: (filters = {}) => api.get('/orders', { params: filters }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  updateStatus: (id, status, data = {}) => api.patch(`/orders/${id}/status`, { status, data }),
  recordPayment: (id, type, amount) => api.patch(`/orders/${id}/payment`, { type, amount }),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Legacy alias (for backward compatibility)
export const dealsAPI = ordersAPI;

// Measurements API
export const measurementsAPI = {
  // Measurements CRUD
  getAll: (filters = {}) => api.get('/measurements', { params: filters }),
  getById: (id) => api.get(`/measurements/${id}`),
  create: (measurementData) => api.post('/measurements', measurementData),
  update: (id, data) => api.put(`/measurements/${id}`, data),
  complete: (id, data) => api.patch(`/measurements/${id}/complete`, data),
  addPayment: (id, payment) => api.post(`/measurements/${id}/payments`, payment),

  // Windows CRUD
  addWindow: (id, windowData) => api.post(`/measurements/${id}/windows`, windowData),
  getWindow: (id, windowId) => api.get(`/measurements/${id}/windows/${windowId}`),
  updateWindow: (id, windowId, windowData) => api.put(`/measurements/${id}/windows/${windowId}`, windowData),
  removeWindow: (id, windowId) => api.delete(`/measurements/${id}/windows/${windowId}`),

  // Photos
  addPhoto: (id, photoData) => api.post(`/measurements/${id}/photos`, photoData),
};

// Proposals API
export const proposalsAPI = {
  create: (proposalData) => api.post('/proposals', proposalData),
  getById: (id) => api.get(`/proposals/${id}`),
};

// Users API
export const usersAPI = {
  getDesigners: () => api.get('/users/designers'),
};

// Upload API
export const uploadAPI = {
  uploadPhoto: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('photo', file);
    if (metadata.dealId) formData.append('dealId', metadata.dealId);
    if (metadata.measurementId) formData.append('measurementId', metadata.measurementId);
    if (metadata.clientId) formData.append('clientId', metadata.clientId);
    if (metadata.photoType) formData.append('photoType', metadata.photoType);
    if (metadata.folder) formData.append('folder', metadata.folder);

    return api.post('/upload/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Catalog API (fabrics, services, price calculation)
export const catalogAPI = {
  // Search products by code (autocomplete)
  searchFabrics: (code, type) => api.get('/catalog/products/search', { params: { code, type } }),

  // Search products by variant code (article code)
  searchByVariantCode: (code) => api.get('/catalog/products/search-by-code', { params: { code } }),

  // Get product by exact code
  getFabricByCode: (code) => api.get(`/catalog/products/code/${code}`),

  // Get product by ID
  getFabricById: (id) => api.get(`/catalog/products/${id}`),

  // Services
  getServices: (type) => api.get('/catalog/services', { params: { type } }),
  getServiceById: (id) => api.get(`/catalog/services/${id}`),
  createService: (data) => api.post('/catalog/services', data),
  updateService: (id, data) => api.put(`/catalog/services/${id}`, data),
  deleteService: (id) => api.delete(`/catalog/services/${id}`),
  deleteFabric: (id) => api.delete(`/catalog/products/${id}`),

  // Calculate price for a room
  calculatePrice: (data) => api.post('/catalog/calculate', data),

  // Create new product
  createFabric: (data) => api.post('/catalog/products', data),

  // Update product
  updateFabric: (id, data) => api.put(`/catalog/products/${id}`, data),

  // ============ PRODUCT VARIANTS ============
  // Get all variants for a product
  getProductVariants: (productId) => api.get(`/catalog/products/${productId}/variants`),

  // Create new variant for a product
  createProductVariant: (productId, data) => api.post(`/catalog/products/${productId}/variants`, data),

  // Update existing variant
  updateProductVariant: (variantId, data) => api.put(`/catalog/variants/${variantId}`, data),

  // Delete variant
  deleteProductVariant: (variantId) => api.delete(`/catalog/variants/${variantId}`),

  // Set default variant for a product
  setDefaultVariant: (productId, variantId) => api.put(`/catalog/products/${productId}/variants/${variantId}/default`),
};

// Analytics API
export const analyticsAPI = {
  // Dashboard overview stats
  getDashboardStats: (role, userId) => api.get('/analytics/dashboard-stats', { params: { role, userId } }),

  // Designer performance
  getDesignerPerformance: (designerId, period = 'month') => api.get('/analytics/designer-performance', {
    params: { designerId, period }
  }),
  getDesignersRanking: (period = 'month') => api.get('/analytics/designers-ranking', { params: { period } }),
  getDesignerEarnings: (designerId, period = 'month') => api.get('/analytics/designer-earnings', {
    params: { designerId, period }
  }),

  // Product analytics
  getProductSales: (period = 'month') => api.get('/analytics/product-sales', { params: { period } }),
  getTopProducts: (limit = 10, period = 'month') => api.get('/analytics/top-products', {
    params: { limit, period }
  }),
  getSalesByCategory: (period = 'month') => api.get('/analytics/sales-by-category', { params: { period } }),

  // Activity analytics
  getWeeklyActivity: (userId, role) => api.get('/analytics/weekly-activity', { params: { userId, role } }),
  getMonthlyTrends: (type = 'revenue', period = 6) => api.get('/analytics/monthly-trends', {
    params: { type, period }
  }),

  // Client analytics
  getClientFunnel: (period = 'month') => api.get('/analytics/client-funnel', { params: { period } }),
  getClientRetention: (period = 'month') => api.get('/analytics/client-retention', { params: { period } }),
  getClientsBySource: (period = 'month') => api.get('/analytics/clients-by-source', { params: { period } }),

  // Team analytics
  getTeamKPIs: (period = 'month') => api.get('/analytics/team-kpis', { params: { period } }),
  getTeamEfficiency: (period = 'month') => api.get('/analytics/team-efficiency', { params: { period } }),

  // Revenue analytics
  getRevenueBreakdown: (period = 'month') => api.get('/analytics/revenue-breakdown', { params: { period } }),
  getPaymentRisks: () => api.get('/analytics/payment-risks'),
};

// ==================== NOTIFICATIONS API ====================
export const notificationsAPI = {
  // Get notifications
  getAll: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count').then(r => r.data?.data?.count || 0),

  // Mark as read
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),

  // Push subscription
  getVapidKey: () => api.get('/notifications/push/vapid-key'),
  subscribePush: (subscription) => api.post('/notifications/push/subscribe', subscription),
  unsubscribePush: (endpoint) => api.delete('/notifications/push/unsubscribe', { data: { endpoint } }),
  getPushStatus: () => api.get('/notifications/push/status'),

  // Preferences
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),

  // Testing
  sendTestPush: () => api.post('/notifications/test-push'),
};

// Audit Log API
export const auditAPI = {
  getLogs: (entityType, entityId) => 
    api.get('/audit', { params: { entityType, entityId } }),
};
