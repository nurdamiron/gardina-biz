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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/images/logo-header.png" alt="Gardina" className="w-72 h-auto mx-auto mb-4" />
          <div className="flex justify-center">
            <LanguageSwitcher compact />
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border shadow-sm">
          <div className="p-6 sm:p-7">
            {sent ? (
              <div className="text-center py-2">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={26} className="text-primary" />
                </div>
                <h2 className="font-semibold text-lg text-foreground mb-2">{t('forgotPassword.sentTitle')}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('forgotPassword.sentBody')}</p>
                <Link to="/login" className="inline-block mt-6 text-primary font-medium text-sm hover:underline">
                  ← {t('auth.loginCta')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('forgotPassword.title')}</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t('forgotPassword.lead')}</p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
                    <Icon name="error" size={18} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">{t('forgotPassword.fieldLabel')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="mail" size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="block w-full h-10 pl-9 pr-3 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                      placeholder={t('forgotPassword.fieldPlaceholder')}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-content font-medium text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('forgotPassword.submit')
                  )}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary hover:underline">
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
