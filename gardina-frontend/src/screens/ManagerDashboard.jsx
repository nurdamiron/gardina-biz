import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import RiskOrdersSection from '../components/manager/RiskOrdersSection';
import PaymentRiskIndicator from '../components/payment/PaymentRiskIndicator';
import { SkeletonCard, SkeletonStats } from '../components/common/Skeleton';
import { formatTime24, formatDate, weekdayShort } from '../utils/dateUtils';
// Import analytics components
import FunnelChart from '../components/analytics/FunnelChart';
import ChartBar from '../components/analytics/ChartBar';
import StatsCard from '../components/analytics/StatsCard';
import Icon from '../components/common/Icon';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const {
    measurements,
    deals,
    clients,
    analytics,
    loading,
    analyticsLoading,
    loadData,
    loadAnalytics
  } = useApp();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLocalLoading(true);
      await loadData();
      await loadAnalytics('manager', user.id);
      setLocalLoading(false);
    } catch (error) {
      setLocalLoading(false);
    }
  };

  // Statistics
  const stats = {
    newLeads: 0, // TODO: implement leads
    scheduledMeasurements: measurements.filter(m => m.status === 'scheduled').length,
    proposalsSent: deals.filter(d => d.status === 'proposal_sent').length,
    closedDeals: deals.filter(d => d.status === 'completed').length,
    totalRevenue: deals.reduce((sum, d) => sum + (d.totalAmount?.amount || 0), 0),
  };

  // Urgent tasks
  const urgentTasks = [
    ...deals.filter(d => d.paymentStatus === 'pending' && d.prepayment?.amount > 0).map(d => ({
      type: 'payment',
      severity: 'high',
      title: t('dashboard.manager.paymentPending', { name: d.client?.name || t('dashboard.fallbacks.client') }),
      description: `${d.totalAmount?.amount || 0}₸`,
      action: () => navigate(`/deals/${d.id}`),
    })),
    ...measurements.filter(m => m.status === 'scheduled' && !m.confirmed).map(m => ({
      type: 'confirmation',
      severity: 'medium',
      title: t('dashboard.manager.confirmRequired', { name: m.clientName || t('dashboard.fallbacks.client') }),
      description: `${formatDate(m.scheduledAt, lang)}, ${formatTime24(m.scheduledAt)}`,
      action: () => navigate(`/manager/measurements/${m.id}`),
    })),
  ];

  return (
    <div className="bg-background-light min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{t('dashboard.manager.panelTitle')}</h1>
          <p className="text-gray-500 text-[11px] font-medium uppercase tracking-wide">{t('dashboard.manager.hello', { name: user?.name || '' })}</p>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Stats */}
        {loading ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Scheduled Measurements */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="calendar_today" />
                </div>
                <span className="text-3xl font-black text-gray-900">{stats.scheduledMeasurements}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{t('dashboard.manager.measurements')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.manager.measurementsScheduled')}</p>
            </div>

            {/* Proposals Sent */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-primary/5 text-primary flex items-center justify-center">
                  <Icon name="description" />
                </div>
                <span className="text-3xl font-black text-gray-900">{stats.proposalsSent}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{t('dashboard.funnel.proposals')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.manager.proposalsSent')}</p>
            </div>

            {/* Closed Deals */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <Icon name="check_circle" />
                </div>
                <span className="text-3xl font-black text-gray-900">{stats.closedDeals}</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{t('dashboard.statuses.completed')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.manager.closedSuccess')}</p>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Icon name="payments" />
                </div>
                <span className="text-2xl font-black text-gray-900">{Math.round(stats.totalRevenue / 1000)}k</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{t('dashboard.stats.revenue')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.manager.revenueDeals')}</p>
            </div>
          </div>
        )}

        {/* Sales Funnel Mini */}
        <FunnelChart
          title={t('dashboard.sections.salesFunnelMini')}
          data={[
            { label: t('dashboard.funnel.leads'), value: deals.filter(d => d.status === 'new' || d.status === 'proposal_sent').length, color: 'bg-primary' },
            { label: t('dashboard.funnel.proposals'), value: deals.filter(d => d.status === 'proposal_accepted').length, color: 'bg-primary-light' },
            { label: t('dashboard.funnel.contracts'), value: deals.filter(d => d.status === 'contract_signed').length, color: 'bg-primary-light' },
            { label: t('dashboard.funnel.inProduction'), value: deals.filter(d => d.status === 'in_production').length, color: 'bg-orange-500' },
            { label: t('dashboard.funnel.completed'), value: deals.filter(d => d.status === 'completed').length, color: 'bg-green-500' },
          ]}
          orientation="horizontal"
          valueFormat="deals"
        />

        {/* Weekly Activity Chart */}
        <ChartBar
          title={t('dashboard.sections.weeklyActivity')}
          data={(() => {
            const wd = weekdayShort(lang);
            // Mon..Sun order in our chart
            const order = [1, 2, 3, 4, 5, 6, 0];
            const colors = ['bg-primary', 'bg-green-500', 'bg-primary-light', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-gray-500'];
            const fallback = [12, 18, 15, 22, 25, 8, 5];
            return analytics.weeklyActivity?.days?.map((day, idx) => ({
              label: day.shortName || wd[order[idx]],
              value: day.activities || 0,
              color: colors[idx],
            })) || order.map((dow, idx) => ({
              label: wd[dow],
              value: fallback[idx],
              color: colors[idx],
            }));
          })()}
          height={150}
          showValues={true}
          loading={analyticsLoading}
        />

        {/* Payment Risks Section */}
        <RiskOrdersSection
          orders={deals.map(deal => ({
            id: deal.id,
            clientName: deal.client?.name || t('dashboard.fallbacks.client'),
            clientPhone: deal.client?.phone || '',
            status: deal.status,
            totalAmount: deal.totalAmount?.amount || 0,
            paidAmount: (deal.prepayment?.amount || 0) + (deal.finalPayment?.amount || 0),
            statusChangedAt: deal.updatedAt || deal.createdAt
          }))}
        />

        {/* Urgent Tasks + Today's Measurements — side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgent Tasks */}
          <div>
            <h2 className="text-lg font-bold mb-3">{t('dashboard.manager.urgentTasks')}</h2>
            {urgentTasks.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <Icon name="check_circle" size={40} className="text-green-500" />
                <p className="text-text-secondary mt-2">{t('dashboard.manager.allDone')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task, idx) => (
                  <div
                    key={idx}
                    onClick={task.action}
                    className={`bg-white rounded-xl p-4 shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all ${task.severity === 'high' ? 'border-red-500' : 'border-yellow-500'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-full flex items-center justify-center ${task.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                        <Icon name={task.type === 'payment' ? 'attach_money' : 'event'} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{task.title}</p>
                        <p className="text-xs text-text-secondary">{task.description}</p>
                      </div>
                      <Icon name="chevron_right" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Measurements */}
          <div>
            <h2 className="text-lg font-bold mb-3">Бүгінгі өлшемдер</h2>
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : measurements.filter(m => {
              const today = new Date().toDateString();
              return new Date(m.scheduledAt).toDateString() === today;
            }).length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                <Icon name="event_busy" size={40} className="text-gray-300" />
                <p className="text-text-secondary mt-2">Бүгін өлшем жоқ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {measurements
                  .filter(m => {
                    const today = new Date().toDateString();
                    return new Date(m.scheduledAt).toDateString() === today;
                  })
                  .map(m => (
                    <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-primary font-bold">
                            {formatTime24(m.scheduledAt)}
                          </p>
                          <p className="font-bold">{m.clientName}</p>
                          <p className="text-sm text-text-secondary">{m.address}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/15 text-primary-dark'
                          }`}>
                          {m.status === 'completed' ? 'Аяқталды' : 'Жоспарланған'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Designers */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center justify-between">
            <span>Топ дизайнерлер</span>
            <span className="text-sm text-gray-500 font-normal">осы ай</span>
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              {(analytics.designersRanking?.slice(0, 5) || [
                { name: 'Айдос Қасымов', completedMeasurements: 12, totalRevenue: 4500000 },
                { name: 'Мадина Сәрсенбаева', completedMeasurements: 10, totalRevenue: 3800000 },
                { name: 'Ернар Асқаров', completedMeasurements: 8, totalRevenue: 3200000 },
                { name: 'Гүлжан Омарова', completedMeasurements: 7, totalRevenue: 2900000 },
                { name: 'Қайрат Нұрлыбеков', completedMeasurements: 5, totalRevenue: 2100000 }
              ]).map((designer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{designer.name}</p>
                      <p className="text-xs text-gray-500">{designer.completedMeasurements || designer.sales || 0} сатылым</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{((designer.totalRevenue || designer.amount || 0) / 1000000).toFixed(1)}M ₸</p>
                    <p className="text-xs text-gray-500">{(((designer.totalRevenue || designer.amount || 0) / 16600000) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/manager/order/new')}
            className="w-full bg-primary hover:brightness-110 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
          >
            <Icon name="add" size={24} />
            <span>Жаңа тапсырыс құру</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/manager/clients')}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
            >
              <Icon name="group" size={24} className="text-primary" />
              <p className="text-sm">Клиенттер</p>
            </button>
            <button
              onClick={() => navigate('/manager/orders')}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
            >
              <Icon name="handshake" size={24} className="text-green-600" />
              <p className="text-sm">Тапсырыстар</p>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default ManagerDashboard;
