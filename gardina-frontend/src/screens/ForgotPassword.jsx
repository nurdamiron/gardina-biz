import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import api from '../services/api';
import Icon from '../components/common/Icon';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const ForgotPassword = () => {
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/password-reset/request', { login: identifier.trim() });
      // Success is the same regardless of whether the account exists —
      // the backend always returns 200 to prevent account enumeration.
      setSent(true);
    } catch (e) {
      // The endpoint is designed not to fail with 4xx for normal flows,
      // so any error here is genuinely server-side.
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
            {t('forgotPassword.title')}
          </h1>
          <p className="text-text-secondary font-medium text-sm mt-1.5">{t('forgotPassword.subtitle')}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />
          <div className="p-6 sm:p-7">
            {sent ? (
              <div className="text-center py-2">
                <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={28} className="text-green-600" />
                </div>
                <h2 className="font-bold text-lg text-text-main mb-2">{t('forgotPassword.sentTitle')}</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{t('forgotPassword.sentBody')}</p>
                <Link to="/login" className="inline-block mt-6 text-primary font-bold text-sm hover:underline">
                  ← {t('auth.loginCta')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm text-text-secondary mb-5 leading-relaxed">{t('forgotPassword.lead')}</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <Icon name="error" className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                )}

                <label className="block text-sm font-bold mb-2">{t('forgotPassword.fieldLabel')}</label>
                <div className="relative mb-5">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="mail" size={20} className="text-text-secondary" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder={t('forgotPassword.fieldPlaceholder')}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full bg-primary hover:brightness-110 active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('forgotPassword.submit')
                  )}
                </button>

                <p className="text-center text-sm text-text-secondary mt-5">
                  <Link to="/login" className="font-bold text-primary hover:underline">
                    ← {t('auth.loginCta')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
