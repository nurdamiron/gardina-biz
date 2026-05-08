import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(phone, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light via-white to-primary/10 flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/images/logo-header.png" alt="Gardina" className="w-40 h-auto mx-auto mb-3 drop-shadow-sm" />
          <div className="flex justify-center mb-2">
            <LanguageSwitcher compact />
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Gardina</h1>
          <p className="text-text-secondary font-medium text-sm mt-1.5">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />
          <form onSubmit={handleSubmit} className="p-6 sm:p-7">
          <h2 className="text-xl font-bold mb-5">{t('auth.loginTitle')}</h2>

          {(error || authError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <Icon name="error" className="text-red-500" />
              <p className="text-sm font-medium text-red-700">{error || authError}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">{t('auth.loginField')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="person" size={20} className="text-text-secondary" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder={t('auth.loginFieldPlaceholder')}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2">{t('auth.password')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="lock" size={20} className="text-text-secondary" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} className="text-text-secondary hover:text-primary" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:brightness-110 active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('common.loading')}
              </>
            ) : (
              <>
                {t('auth.login')}
                <Icon name="arrow_forward" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-text-secondary mt-5">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </p>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary/90 mt-6">{t('auth.copyright')}</p>
      </div>
    </div>
  );
};

export default Login;
