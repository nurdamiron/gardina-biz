import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import api from '../services/api';
import Icon from '../components/common/Icon';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const ResetPassword = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background-light">
        <div className="text-center max-w-sm">
          <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Icon name="error" size={28} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">{t('resetPassword.invalidLink')}</h1>
          <p className="text-text-secondary text-sm mb-6">{t('resetPassword.invalidBody')}</p>
          <Link to="/forgot-password" className="inline-flex px-5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110">
            {t('resetPassword.requestNew')}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t('auth.errorPasswordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.errorPasswordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2200);
    } catch (e) {
      setError(e.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light via-white to-primary/10 flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/images/logo-header.png" alt="Gardina" className="w-40 h-auto mx-auto mb-3 drop-shadow-sm" />
          <div className="flex justify-center mb-2">
            <LanguageSwitcher compact />
          </div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            {t('resetPassword.title')}
          </h1>
          <p className="text-text-secondary font-medium text-sm mt-1.5">{t('resetPassword.subtitle')}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />
          <div className="p-6 sm:p-7">
            {done ? (
              <div className="text-center py-2">
                <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={28} className="text-green-600" />
                </div>
                <h2 className="font-bold text-lg text-text-main mb-2">{t('resetPassword.successTitle')}</h2>
                <p className="text-sm text-text-secondary">{t('resetPassword.successBody')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <Icon name="error" className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <label className="block text-sm font-bold mb-2">{t('resetPassword.newPassword')}</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="lock" size={20} className="text-text-secondary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder={t('auth.passwordPlaceholderMin')}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} className="text-text-secondary hover:text-primary" />
                  </button>
                </div>

                <label className="block text-sm font-bold mb-2">{t('auth.passwordConfirm')}</label>
                <div className="relative mb-5">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="verified_user" size={20} className="text-text-secondary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder={t('auth.passwordConfirmPlaceholder')}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full bg-primary hover:brightness-110 active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('resetPassword.submit')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
