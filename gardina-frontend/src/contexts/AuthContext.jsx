import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, getAxiosApiError } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.me();
      setUser(response.data.data);
      setLoading(false);
    } catch (err) {
      // Only clear tokens on explicit auth failure (401/403), not network errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      setError(null);
      const organizationSlug = import.meta.env.VITE_ORGANIZATION_SLUG || '';
      const response = await authAPI.login(phone, password, organizationSlug || undefined);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = getAxiosApiError(err, 'Кіру сәтсіз аяқталды');
      if (data?.code === 'ORG_SLUG_REQUIRED' && Array.isArray(data.organizations)) {
        const slugs = data.organizations.map((o) => o.slug).filter(Boolean).join(', ');
        const baseMsg = data?.error || errorMessage;
        setError(slugs ? `${baseMsg} (${slugs})` : baseMsg);
        return { success: false, error: baseMsg, organizations: data.organizations };
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      const { user: newUser, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage = getAxiosApiError(err, 'Тіркелу сәтсіз аяқталды');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const registerSalon = async (payload) => {
    try {
      setError(null);
      const response = await authAPI.registerSalon(payload);
      const data = response.data.data;
      const { user: newUser, accessToken, refreshToken, organization: org } = data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser({
        ...newUser,
        organization: org ? { slug: org.slug, name: org.name } : null,
      });

      return {
        success: true,
        user: {
          ...newUser,
          organization: org ? { slug: org.slug, name: org.name } : null,
        },
      };
    } catch (err) {
      const errorMessage = getAxiosApiError(err, 'Тіркелу сәтсіз аяқталды');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.data);
      return { success: true, user: response.data.data };
    } catch {
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // Ignore server error — still clear local state
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    registerSalon,
    clearError,
    refreshUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
