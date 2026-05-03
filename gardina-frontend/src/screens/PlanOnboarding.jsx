import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { billingAPI } from '../services/api';
import Icon from '../components/common/Icon';

const PRICES = {
  monthly: {
    start: '15 000 ₸',
    pro: '35 000 ₸',
    network: '60 000 ₸ бастап',
  },
  yearly: {
    start: '150 000 ₸',
    pro: '350 000 ₸',
    network: '600 000 ₸ бастап',
  },
};

const PlanOnboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

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
  const periodLabel = cycle === 'yearly' ? '/ жыл' : '/ ай';
  const giftNote = cycle === 'yearly' ? '2 ай сыйлық (10× айлық)' : null;

  const parseApiError = (err) =>
    err.response?.data?.error || err.message || 'Сақтау сәтсіз аяқталды';

  const afterSuccess = async () => {
    await refreshUser();
    navigate('/', { replace: true });
  };

  const onSelectStart = async () => {
    setError(null);
    setSaving('start');
    try {
      await billingAPI.selectPlan({
        planCode: 'start',
        billingCycle: cycle,
        subscriptionStatus: 'active',
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
      await billingAPI.selectPlan({
        planCode: 'pro',
        billingCycle: cycle,
        subscriptionStatus: 'active',
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
        subscriptionStatus: 'active',
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
        subscriptionStatus: 'active',
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
          <h1 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight">Тарифті таңдаңыз</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
            Тіркелу аяқталды. Салоныңызға сәйкес тарифті таңдаңыз — таңдау жүйеде сақталады, кейін әкімші
            панелінен өзгертуге болады.
          </p>
          {user.organization?.name && (
            <p className="text-xs text-text-secondary mt-2 font-medium">
              <Icon name="store" size={16} className="inline-block align-text-bottom mr-1 opacity-70" />
              {user.organization.name}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <span className="text-sm font-bold text-text-secondary">Төлем циклі:</span>
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
              Айлық
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
              Жылдық
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
                <h2 className="text-lg font-bold text-text-main">Start</h2>
                {currentPlan === 'start' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Ағымдағы
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">Кіші салондарға: клиенттер, воронка, күнтізбе.</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{PRICES[cycle].start}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  1 салон, 3 пайдаланушыға дейін
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  Негізгі аналитика
                </li>
              </ul>
              <button
                type="button"
                disabled={!!saving}
                onClick={onSelectStart}
                className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {saving === 'start' ? 'Сақталуда…' : 'Start таңдау'}
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
                Ұсынылады
              </div>
              <div className="flex items-center justify-between mb-3 mt-2">
                <h2 className="text-lg font-bold text-text-main">Pro</h2>
                {currentPlan === 'pro' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Ағымдағы
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">Толық цикл: өтінімнен монтажға дейін, склад, тапсырмалар.</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{PRICES[cycle].pro}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-4 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  8 пайдаланушыға дейін, толық workflow
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  7 күн Pro trial (карта қажет емес)
                </li>
              </ul>
              <div className="space-y-2 mt-auto">
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={onProTrial}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {saving === 'pro-trial' ? 'Белгіленуде…' : '7 күн тегін Pro'}
                </button>
                <button
                  type="button"
                  disabled={!!saving}
                  onClick={onProPaid}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-text-main text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  {saving === 'pro-paid' ? 'Сақталуда…' : `Pro — төлем (${cycle === 'yearly' ? 'жылдық' : 'айлық'})`}
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
                <h2 className="text-lg font-bold text-text-main">Network</h2>
                {currentPlan === 'network' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Ағымдағы
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">Бірнеше салон, жиынтық аналитика.</p>
              <div className="mb-4">
                <span className="text-2xl font-black text-primary">{PRICES[cycle].network}</span>
                <span className="text-sm text-text-secondary font-medium">{periodLabel}</span>
              </div>
              <ul className="text-xs text-text-secondary space-y-2 mb-6 flex-1">
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  Pro мүмкіндіктері + бірнеше нүкте
                </li>
                <li className="flex gap-2">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  Баға салон санына байланысты
                </li>
              </ul>
              <button
                type="button"
                disabled={!!saving}
                onClick={onSelectNetwork}
                className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {saving === 'network' ? 'Сақталуда…' : 'Network таңдау'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-text-secondary mt-8 max-w-lg mx-auto leading-relaxed">
          Төлем шлюзі қосылғанша тариф жүйеде келісім ретінде сақталады. Trial кезінде карта қажет емес.
        </p>

        <div className="flex justify-center mt-6">
          <button
            type="button"
            disabled={!!saving}
            onClick={onSkipLater}
            className="text-sm text-text-secondary hover:text-primary font-medium underline-offset-2 hover:underline disabled:opacity-50"
          >
            {saving === 'skip' ? 'Күте тұрыңыз…' : 'Кейінірек — Start қалдыру'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanOnboarding;
