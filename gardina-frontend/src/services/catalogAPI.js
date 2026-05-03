import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken'); // Fixed: use accessToken, not authToken
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============ PRODUCTS/FABRICS ============

export const searchFabrics = async (code = '', type = null) => {
  const params = { code };
  if (type) params.type = type;
  return axios.get(`${API_BASE_URL}/catalog/products/search`, {
    params,
    ...getAuthConfig()
  });
};

export const getFabricById = async (id) => {
  return axios.get(`${API_BASE_URL}/catalog/products/${id}`, getAuthConfig());
};

export const getFabricByCode = async (code) => {
  return axios.get(`${API_BASE_URL}/catalog/products/code/${code}`, getAuthConfig());
};

export const createFabric = async (fabricData) => {
  return axios.post(`${API_BASE_URL}/catalog/products`, fabricData, getAuthConfig());
};

export const updateFabric = async (id, fabricData) => {
  return axios.put(`${API_BASE_URL}/catalog/products/${id}`, fabricData, getAuthConfig());
};

// ============ SERVICES ============

export const getServiceRates = async (type = null) => {
  const params = type ? { type } : {};
  return axios.get(`${API_BASE_URL}/catalog/services`, {
    params,
    ...getAuthConfig()
  });
};

export const getServiceById = async (id) => {
  return axios.get(`${API_BASE_URL}/catalog/services/${id}`, getAuthConfig());
};

export const createService = async (serviceData) => {
  return axios.post(`${API_BASE_URL}/catalog/services`, serviceData, getAuthConfig());
};

export const updateService = async (id, serviceData) => {
  return axios.put(`${API_BASE_URL}/catalog/services/${id}`, serviceData, getAuthConfig());
};

export const deleteService = async (id) => {
  return axios.delete(`${API_BASE_URL}/catalog/services/${id}`, getAuthConfig());
};

// ============ BRANDS ============

export const getBrands = async (filters = {}) => {
  return axios.get(`${API_BASE_URL}/catalog/brands`, {
    params: filters,
    ...getAuthConfig()
  });
};

export const getBrandById = async (id) => {
  return axios.get(`${API_BASE_URL}/catalog/brands/${id}`, getAuthConfig());
};

export const createBrand = async (brandData) => {
  return axios.post(`${API_BASE_URL}/catalog/brands`, brandData, getAuthConfig());
};

export const updateBrand = async (id, brandData) => {
  return axios.put(`${API_BASE_URL}/catalog/brands/${id}`, brandData, getAuthConfig());
};

export const deleteBrand = async (id) => {
  return axios.delete(`${API_BASE_URL}/catalog/brands/${id}`, getAuthConfig());
};

// ============ PRODUCT COLORS ============

export const getProductColors = async (productId) => {
  return axios.get(`${API_BASE_URL}/catalog/products/${productId}/colors`, getAuthConfig());
};

export const createProductColor = async (productId, colorData) => {
  return axios.post(`${API_BASE_URL}/catalog/products/${productId}/colors`, colorData, getAuthConfig());
};

export const updateProductColor = async (colorId, colorData) => {
  return axios.put(`${API_BASE_URL}/catalog/colors/${colorId}`, colorData, getAuthConfig());
};

export const deleteProductColor = async (colorId) => {
  return axios.delete(`${API_BASE_URL}/catalog/colors/${colorId}`, getAuthConfig());
};

// ============ CALCULATIONS ============

export const calculatePrice = async (calculationData) => {
  return axios.post(`${API_BASE_URL}/catalog/calculate`, calculationData, getAuthConfig());
};

// Export all functions as catalogAPI object for backward compatibility
export const catalogAPI = {
  searchFabrics,
  getFabricById,
  getFabricByCode,
  createFabric,
  updateFabric,

  getServiceRates,
  getServiceById,
  createService,
  updateService,
  deleteService,

  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,

  getProductColors,
  createProductColor,
  updateProductColor,
  deleteProductColor,

  calculatePrice,
};

export default catalogAPI;