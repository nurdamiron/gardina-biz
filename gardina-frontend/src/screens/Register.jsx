import React, { useState, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const MODES = {
  salon: 'salon',
  join: 'join',
};

function slugFromName(name) {
  const ascii = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return ascii.slice(0, 48);
}

const Register = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { register, registerSalon, error: authError, clearError, isAuthenticated, loading: authLoading } =
    useAuth();

  const [mode, setMode] = useState(MODES.salon);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const onOrgNameChange = useCallback(
    (value) => {
      setOrganizationName(value);
      if (mode === MODES.salon && !slugTouched) {
        const s = slugFromName(value);
        if (s) setOrganizationSlug(s);
      }
    },
    [mode, slugTouched]
  );

  const switchMode = (next) => {
    setMode(next);
    setLocalError(null);
    clearError();
    setOrganizationSlug('');
    setSlugTouched(false);
    if (next === MODES.join) {
      setOrganizationName('');
    }
  };

  const validate = () => {
    if (mode === MODES.salon) {
      if (!organizationName.trim()) return t('auth.errorOrgNameRequired');
      if (!organizationSlug.trim() || organizationSlug.trim().length < 2) {
        return t('auth.errorSlugTooShort');
      }
    } else {
      if (!organizationSlug.trim()) return t('auth.errorSlugRequired');
    }
    if (!name.trim()) return t('auth.errorNameRequired');
    if (!phone.trim()) return t('auth.errorPhoneRequired');
    if (!password || password.length < 6) return t('auth.errorPasswordTooShort');
    if (password !== confirmPassword) return t('auth.errorPasswordsMismatch');
    if (!acceptedTerms) return t('auth.errorConsentRequired');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const v = validate();
    if (v) {
      setLocalError(v);
      return;
    }

    setLoading(true);
    const slug = organizationSlug.trim().toLowerCase();
    let result;

    if (mode === MODES.salon) {
      result = await registerSalon({
        organizationName: organizationName.trim(),
        organizationSlug: slug,
        name: name.trim(),
        phone: phone.trim(),
        password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
    } else {
      result = await register({
        organizationSlug: slug,
        name: name.trim(),
        phone: phone.trim(),
        password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
    }

    setLoading(false);
    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/onboarding/plan', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const displayError = localError || authError;

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
          <h1 className="text-2xl font-bold text-text-main tracking-tight">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1.5 font-medium">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="rounded-3xl bg-white shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-light to-accent" />

          <div className="p-6 sm:p-7">
            <div className="flex p-1 rounded-xl bg-gray-100/90 border border-gray-200/80 mb-6">
              <button
                type="button"
                onClick={() => switchMode(MODES.salon)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === MODES.salon
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <Icon name="storefront" size={18} />
                {t('auth.modeNewSalon')}
              </button>
              <button
                type="button"
                onClick={() => switchMode(MODES.join)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === MODES.join
                    ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <Icon name="group_add" size={18} />
                {t('auth.modeJoin')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div className="p-4 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-3">
                  <Icon name="error" className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 leading-snug">{displayError}</p>
                </div>
              )}

              {mode === MODES.salon && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                      {t('auth.organizationName')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="store" size={20} className="text-text-secondary/80" />
                      </div>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => onOrgNameChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                        placeholder={t('auth.organizationNamePlaceholder')}
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                      {t('auth.organizationSlug')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="link" size={20} className="text-text-secondary/80" />
                      </div>
                      <input
                        type="text"
                        value={organizationSlug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setOrganizationSlug(
                            e.target.value
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9-]/g, '')
                          );
                        }}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow font-mono text-sm"
                        placeholder={t('auth.organizationSlugPlaceholder')}
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{t('auth.organizationSlugHint')}</p>
                  </div>
                </>
              )}

              {mode === MODES.join && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                    {t('auth.organizationSlugJoin')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="business" size={20} className="text-text-secondary/80" />
                    </div>
                    <input
                      type="text"
                      value={organizationSlug}
                      onChange={(e) =>
                        setOrganizationSlug(
                          e.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow font-mono text-sm"
                      placeholder={t('auth.organizationSlugJoinPlaceholder')}
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1.5">{t('auth.organizationSlugJoinHint')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  {t('auth.fullName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="badge" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder={t('auth.fullNamePlaceholder')}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  {t('auth.phone')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="call" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder={t('auth.phonePlaceholder')}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  {t('auth.email')} <span className="font-normal normal-case text-text-secondary/70">{t('auth.emailOptional')}</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="mail" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="lock" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder={t('auth.passwordPlaceholderMin')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    <Icon
                      name={showPassword ? 'visibility_off' : 'visibility'}
                      size={20}
                      className="text-text-secondary hover:text-primary"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wide mb-1.5">
                  {t('auth.passwordConfirm')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="verified_user" size={20} className="text-text-secondary/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                    placeholder={t('auth.passwordConfirmPlaceholder')}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-xs text-text-secondary leading-relaxed">
                  {t('auth.consentText')}{' '}
                  <a href="/terms.html" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">{t('auth.consentTerms')}</a>
                  {' '}{t('auth.consentAnd')}{' '}
                  <a href="/privacy.html" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">{t('auth.consentPrivacy')}</a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="w-full mt-2 bg-primary hover:brightness-110 active:scale-[0.99] text-white font-bold text-base py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    {mode === MODES.salon ? t('auth.registerSalonCta') : t('auth.registerJoinCta')}
                    <Icon name="arrow_forward" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-secondary/90 mt-6">{t('auth.copyright')}</p>
      </div>
    </div>
  );
};

export default Register;
