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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Set when the same login exists in several salons (backend code ORG_SLUG_REQUIRED).
  const [orgOptions, setOrgOptions] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(identifier, password, selectedSlug || undefined);

    if (result.success) {
      navigate('/');
    } else {
      if (Array.isArray(result.organizations) && result.organizations.length > 0) {
        // Ambiguous login across orgs — offer a salon picker and let the user retry.
        setOrgOptions(result.organizations);
        if (!selectedSlug) setSelectedSlug(result.organizations[0].slug || '');
      }
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/images/logo-header.png" alt="Gardina" className="w-72 h-auto mx-auto mb-4" />
          <div className="flex justify-center">
            <LanguageSwitcher compact />
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border shadow-sm">
          <div className="p-6 sm:p-7 pb-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t('auth.loginTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1.5">{t('auth.loginSubtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 pt-4 space-y-4">

          {(error || authError) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2.5">
              <Icon name="error" size={18} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-destructive">{error || authError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">{t('auth.loginField')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="person" size={18} className="text-muted-foreground" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onInvalid={(e) => e.target.setCustomValidity(t('auth.fieldRequired'))}
                onInput={(e) => e.target.setCustomValidity('')}
                className="block w-full h-10 pl-9 pr-3 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                placeholder={t('auth.loginFieldPlaceholder')}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {orgOptions && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{t('auth.selectOrganization')}</label>
              <p className="text-xs text-muted-foreground">{t('auth.selectOrganizationHint')}</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="store" size={18} className="text-muted-foreground" />
                </div>
                <select
                  value={selectedSlug}
                  onChange={(e) => setSelectedSlug(e.target.value)}
                  className="block w-full h-10 pl-9 pr-3 text-sm border border-input rounded-md bg-card focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                >
                  {orgOptions.map((o) => (
                    <option key={o.slug} value={o.slug}>{o.name || o.slug}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">{t('auth.password')}</label>
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="lock" size={18} className="text-muted-foreground" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInvalid={(e) => e.target.setCustomValidity(t('auth.fieldRequired'))}
                onInput={(e) => e.target.setCustomValidity('')}
                className="block w-full h-10 pl-9 pr-11 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
                placeholder={t('auth.passwordPlaceholder', 'Введите пароль')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-content font-medium text-sm rounded-md shadow-sm transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                {t('common.loading')}
              </>
            ) : (
              <>
                {t('auth.login')}
                <Icon name="arrow_forward" size={18} />
              </>
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground pt-1">
            <a
              href="https://wa.me/77079429827"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.contactUs')}
            </a>
          </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">{t('auth.copyright')}</p>
      </div>
    </div>
  );
};

export default Login;
