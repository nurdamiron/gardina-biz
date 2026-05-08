import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { billingAPI } from '../services/api';
import Icon from '../components/common/Icon';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useI18n } from '../contexts/I18nContext';

const PRICE_AMOUNTS = {
  monthly: { start: '15 000', pro: '35 000', network: '60 000' },
  yearly:  { start: '150 000', pro: '350 000', network: '600 000' },
};

const PlanOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { t, lang } = useI18n();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  const formatPrice = (planCode, cycle) => {
    const amount = PRICE_AMOUNTS[cycle][planCode];
    const fromWord = lang === 'kz' ? 'бастап' : 'от';
    if (planCode === 'network') {
      return lang === 'kz' ? `${amount} ₸ ${fromWord}` : `${fromWord} ${amount} ₸`;
    }
    return `${amount} ₸`;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await billingAPI.status();
        if (!cancelled && data?.success && data?.data?.billing) {
          setCurrentPlan(data.data.billing.planCode || 'start');
        }
      } catch {
        if (!cancelled) setCurrentPlan(user?.billing?.planCode || null);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.billing?.planCode]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const cycle = billingCycle;
  const periodLabel =
    cycle === 'yearly'
      ? lang === 'kz' ? '/ жыл' : '/ год'
      : lang === 'kz' ? '/ ай' : '/ мес';
  const giftNote = cycle === 'yearly' ? t('onboarding.bonus') : null;

  const parseApiError = (err) =>
    err.response?.data?.error || err.message || t('onboarding.errorSaveFailed');

  const afterSuccess = async () => {
    await refreshUser();
    navigate('/', { replace: true });
  };

  const onSelectStart = async () => {
    setError(null);
    setSaving('start');
    try {
      // Server decides subscription_status — Start is free → 'active'
      await billingAPI.selectPlan({
        planCode: 'start',
        billingCycle: cycle,
      });
      await afterSuccess();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const onProTrial = async () => {
    setError(null);
    setSaving('pro-trial');
    try {
      await billingAPI.startProTrial();
      await afterSuccess();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const onProPaid = async () => {
    setError(null);
    setSaving('pro-paid');
    try {
      // Paid plans become 'pending_payment' on the server until PSP webhook arrives.
      await billingAPI.selectPlan({
        planCode: 'pro',
        billingCycle: cycle,
      });
      await afterSuccess();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const onSelectNetwork = async () => {
    setError(null);
    setSaving('network');
    try {
      await billingAPI.selectPlan({
        planCode: 'network',
        billingCycle: cycle,
      });
      await afterSuccess();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(null);
    }
  };

  const onSkipLater = async () => {
    setError(null);
    setSaving('skip');
    try {
      await billingAPI.selectPlan({
        planCode: 'start',
        billingCycle: 'monthly',
      });
      await afterSuccess();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light via-white to-primary/10 px-4 py-10 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <img src="/images/logo-header.png" alt="Gardina" className="w-32 h-auto mx-auto mb-4 drop-shadow-sm" />
          <div className="flex justify-center mb-2">
            <LanguageSwitcher compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">{t('onboarding.title')}</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
            {t('onboarding.subtitle')}
          </p>
          {user.organization?.name && (
            <p className="text-xs text-text-secondary mt-2 font-medium">
              <Icon name="store" size={16} className="inline-block align-text-bottom mr-1 opacity-70" />
              {user.organization.name}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <span className="text-sm font-bold text-text-secondary">{t('onboarding.cycleLabel')}</span>
          <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200/80">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                cycle === 'monthly'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-text-secondary'
              }`}
            >
              {t('onboarding.monthly')}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                cycle === 'yearly'
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-text-secondary'
              }`}
            >
              {t('onboarding.yearly')}
            </button>
          </div>
          {giftNote && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{giftNote}</span>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
            <Icon name="error" className="text-red-500 shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {loadingStatus ? (
          <div className="flex justify-center py-20">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {/* Start */}
            <div
              className={`rounded-2xl border bg-white p-6 flex flex-col shadow-lg transition-all ${
                currentPlan === 'start' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-text-main">{t('onboarding.start.name')}</h2>
                {currentPlan === 'start' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {t('onboarding.current')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">{t('onboarding.start.description')}</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{formatPrice('start', cycle)}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.start.feature1')}
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.start.feature2')}
                </li>
              </ul>
              <button
                type="button"
                disabled={!!saving}
                onClick={onSelectStart}
                className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {saving === 'start' ? t('onboarding.saving') : t('onboarding.start.cta')}
              </button>
            </div>

            {/* Pro */}
            <div
              className={`rounded-2xl border bg-white p-6 flex flex-col shadow-xl transition-all relative md:-mt-2 md:mb-2 ${
                currentPlan === 'pro'
                  ? 'border-primary ring-2 ring-primary/30 shadow-primary/10'
                  : 'border-primary/40 ring-1 ring-primary/15'
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wide">
                {t('onboarding.recommended')}
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h2 className="text-lg font-bold text-text-main">{t('onboarding.pro.name')}</h2>
                {currentPlan === 'pro' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {t('onboarding.current')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">{t('onboarding.pro.description')}</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{formatPrice('pro', cycle)}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-4 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.pro.feature1')}
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.pro.feature2')}
                </li>
              </ul>
              <div className="space-y-2 mt-auto">
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={onProTrial}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {saving === 'pro-trial' ? t('onboarding.starting') : t('onboarding.pro.ctaTrial')}
                </button>
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={onProPaid}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-text-main text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {saving === 'pro-paid'
                    ? t('onboarding.saving')
                    : t('onboarding.pro.ctaPaid', {
                        cycle: cycle === 'yearly' ? t('onboarding.pro.cycleYearly') : t('onboarding.pro.cycleMonthly'),
                      })}
                </button>
              </div>
            </div>

            {/* Network */}
            <div
              className={`rounded-2xl border bg-white p-6 flex flex-col shadow-lg transition-all ${
                currentPlan === 'network' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-text-main">{t('onboarding.network.name')}</h2>
                {currentPlan === 'network' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {t('onboarding.current')}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">{t('onboarding.network.description')}</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{formatPrice('network', cycle)}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.network.feature1')}
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {t('onboarding.network.feature2')}
                </li>
              </ul>
              <button
                type="button"
                disabled={!!saving}
                onClick={onSelectNetwork}
                className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {saving === 'network' ? t('onboarding.saving') : t('onboarding.network.cta')}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-secondary mt-8 max-w-lg mx-auto leading-relaxed">{t('onboarding.notice')}</p>

        <div className="flex justify-center mt-6">
          <button
            type="button"
            disabled={!!saving}
            onClick={onSkipLater}
            className="text-sm text-text-secondary hover:text-primary font-medium underline-offset-2 hover:underline disabled:opacity-50"
          >
            {saving === 'skip' ? t('onboarding.please_wait') : t('onboarding.skipLater')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanOnboarding;
