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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="error" size={26} className="text-destructive" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight mb-2 text-foreground">{t('resetPassword.invalidLink')}</h1>
          <p className="text-muted-foreground text-sm mb-6">{t('resetPassword.invalidBody')}</p>
          <Link to="/forgot-password" className="inline-flex h-10 items-center px-5 rounded-md bg-primary text-primary-content font-medium text-sm hover:bg-primary/90 transition-colors">
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
            {done ? (
              <div className="text-center py-2">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={26} className="text-primary" />
                </div>
                <h2 className="font-semibold text-lg text-foreground mb-2">{t('resetPassword.successTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('resetPassword.successBody')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('resetPassword.title')}</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">{t('resetPassword.subtitle')}</p>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
                    <Icon name="error" size={18} className="text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">{t('resetPassword.newPassword')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="lock" size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full h-10 pl-9 pr-11 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                      placeholder={t('auth.passwordPlaceholderMin')}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">{t('auth.passwordConfirm')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="verified_user" size={18} className="text-muted-foreground" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="block w-full h-10 pl-9 pr-3 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                      placeholder={t('auth.passwordConfirmPlaceholder')}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-content font-medium text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
