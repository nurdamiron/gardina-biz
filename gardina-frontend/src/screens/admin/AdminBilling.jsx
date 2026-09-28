import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI } from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const STATUS_LABELS = {
  ru: {
    trial:           { label: 'Пробный период',   color: 'bg-blue-50 text-blue-700 border-blue-100' },
    active:          { label: 'Активна',           color: 'bg-green-50 text-green-700 border-green-100' },
    pending_payment: { label: 'Ожидает оплаты',    color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    past_due:        { label: 'Просрочено',        color: 'bg-red-50 text-red-700 border-red-100' },
    canceled:        { label: 'Отменена',          color: 'bg-muted text-muted-foreground border-border' },
  },
  kz: {
    trial:           { label: 'Сынақ кезеңі',      color: 'bg-blue-50 text-blue-700 border-blue-100' },
    active:          { label: 'Белсенді',           color: 'bg-green-50 text-green-700 border-green-100' },
    pending_payment: { label: 'Төлем күтілуде',    color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    past_due:        { label: 'Мерзімі өтті',      color: 'bg-red-50 text-red-700 border-red-100' },
    canceled:        { label: 'Бас тартылған',     color: 'bg-muted text-muted-foreground border-border' },
  },
};

const PLAN_LABELS = {
  start:   { name: 'Start',   icon: 'rocket_launch',    color: 'text-text-main' },
  pro:     { name: 'Pro',     icon: 'workspace_premium', color: 'text-primary' },
  network: { name: 'Network', icon: 'hub',               color: 'text-accent' },
};

const PRICES = {
  monthly: { start: '15 000 ₸', pro: '35 000 ₸', network: '60 000 ₸' },
  yearly:  { start: '150 000 ₸', pro: '350 000 ₸', network: '600 000 ₸' },
};

const AdminBilling = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = {
    ru: {
      title: 'Подписка',
      plan: 'Тариф',
      status: 'Статус',
      trialEnds: 'Пробный период заканчивается',
      daysLeft: (n) => `${n} дн.`,
      users: 'Сотрудники',
      usersOf: (cur, max) => `${cur} из ${max}`,
      unlimited: 'Без лимита',
      changePlan: 'Сменить тариф',
      readOnly: 'Организация в режиме "только чтение" — создание данных заблокировано.',
      pendingNote: 'Оплата не завершена. Свяжитесь с командой Gardina для активации.',
      features: 'Функции',
      featuresList: {
        productionWorkflow: 'Производственный поток',
        inventory: 'Управление складом',
        networkAnalytics: 'Сетевая аналитика',
      },
      cycle: { monthly: 'ежемесячно', yearly: 'ежегодно' },
      price: 'Стоимость',
      contactSupport: 'Связаться с поддержкой',
      supportMsg: '+7 707 942 9827 (WhatsApp)',
    },
    kz: {
      title: 'Жазылым',
      plan: 'Тариф',
      status: 'Мәртебе',
      trialEnds: 'Сынақ кезеңі аяқталады',
      daysLeft: (n) => `${n} күн`,
      users: 'Қызметкерлер',
      usersOf: (cur, max) => `${cur} / ${max}`,
      unlimited: 'Шексіз',
      changePlan: 'Тарифті өзгерту',
      readOnly: 'Ұйым "тек оқу" режимінде — деректер жасау бұғатталған.',
      pendingNote: 'Төлем аяқталмаған. Белсендіру үшін Gardina командасымен байланысыңыз.',
      features: 'Мүмкіндіктер',
      featuresList: {
        productionWorkflow: 'Өндірістік ағын',
        inventory: 'Қойма басқару',
        networkAnalytics: 'Желілік аналитика',
      },
      cycle: { monthly: 'ай сайын', yearly: 'жыл сайын' },
      price: 'Құны',
      contactSupport: 'Қолдауға хабарласу',
      supportMsg: '+7 707 942 9827 (WhatsApp)',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  useEffect(() => {
    billingAPI.status()
      .then((r) => setBilling(r.data?.data?.billing))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!billing) return null;

  const plan = PLAN_LABELS[billing.planCode] || PLAN_LABELS.start;
  const statusInfo = (STATUS_LABELS[lang === 'kz' ? 'kz' : 'ru'])[billing.subscriptionStatus] || { label: billing.subscriptionStatus, color: 'bg-muted text-muted-foreground' };
  const userLimit = billing.limits?.users;
  const activeUsers = billing.usage?.activeUsers || 0;
  const userPct = userLimit ? Math.min(100, Math.round((activeUsers / userLimit) * 100)) : 0;
  const price = PRICES[billing.billingCycle || 'monthly'][billing.planCode] || '—';

  return (
    <div className="min-h-screen bg-background-light pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur border-b border-border-light px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-background-light">
          <Icon name="arrow_back" size={20} />
        </button>
        <h1 className="text-base font-bold">{t.title}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Read-only banner */}
        {billing.isReadOnly && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <Icon name="lock" size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{t.readOnly}</p>
          </div>
        )}

        {/* Pending payment banner */}
        {billing.subscriptionStatus === 'pending_payment' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3">
            <Icon name="info" size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">{t.pendingNote}</p>
          </div>
        )}

        {/* Plan card */}
        <div className="bg-card rounded-3xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{t.plan}</p>
              <div className="flex items-center gap-2">
                <Icon name={plan.icon} size={24} className={plan.color} />
                <span className="text-2xl font-black">{plan.name}</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {t.price}: <strong>{price}</strong> {t.cycle[billing.billingCycle || 'monthly']}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Trial countdown */}
          {billing.subscriptionStatus === 'trial' && billing.trialDaysLeft > 0 && (
            <div className="mt-4 bg-blue-50 rounded-2xl p-3 flex items-center gap-3">
              <Icon name="schedule" size={18} className="text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-800">{t.trialEnds}</p>
                <p className="text-xl font-black text-blue-700">{t.daysLeft(billing.trialDaysLeft)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Usage card */}
        <div className="bg-card rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">{t.users}</p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-main">
              {userLimit
                ? t.usersOf(activeUsers, userLimit)
                : `${activeUsers} (${t.unlimited})`}
            </span>
            {userLimit && (
              <span className={`text-xs font-bold ${userPct >= 100 ? 'text-red-600' : userPct >= 80 ? 'text-yellow-600' : 'text-primary'}`}>
                {userPct}%
              </span>
            )}
          </div>

          {userLimit && (
            <div className="h-2 bg-background-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${userPct >= 100 ? 'bg-red-500' : userPct >= 80 ? 'bg-yellow-400' : 'bg-primary'}`}
                style={{ width: `${userPct}%` }}
              />
            </div>
          )}

          {userLimit && userPct >= 80 && (
            <p className={`text-xs mt-2 ${userPct >= 100 ? 'text-red-600' : 'text-yellow-600'}`}>
              {userPct >= 100
                ? (lang === 'kz' ? 'Лимит бітті — жоғары тарифке көтеріңіз' : 'Лимит достигнут — перейдите на старший тариф')
                : (lang === 'kz' ? 'Лимитке жақындап қалдыңыз' : 'Почти достигнут лимит')}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="bg-card rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">{t.features}</p>
          <ul className="space-y-3">
            {Object.entries(billing.features || {}).map(([key, enabled]) => (
              <li key={key} className="flex items-center gap-3">
                <span className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 ${enabled ? 'bg-primary text-white' : 'bg-background-light'}`}>
                  {enabled
                    ? <Icon name="check" size={12} />
                    : <Icon name="close" size={12} className="text-text-secondary" />}
                </span>
                <span className={`text-sm ${enabled ? 'text-text-main font-medium' : 'text-text-secondary'}`}>
                  {t.featuresList[key] || key}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <button
          onClick={() => navigate('/onboarding/plan')}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
        >
          <Icon name="swap_horiz" size={18} />
          {t.changePlan}
        </button>

        {/* Support */}
        <div className="bg-card rounded-3xl shadow-sm p-5 flex items-center gap-4">
          <div className="size-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="support_agent" size={20} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-secondary mb-0.5">{t.contactSupport}</p>
            <p className="text-sm font-medium text-text-main">{t.supportMsg}</p>
          </div>
          <a
            href="https://wa.me/77079429827"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AdminBilling;
