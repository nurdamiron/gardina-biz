import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import { formatTime24 } from '../utils/dateUtils';
// Import analytics components
import ChartLine from '../components/analytics/ChartLine';
import StatsCard from '../components/analytics/StatsCard';
import KPICard from '../components/analytics/KPICard';
import Icon from '../components/common/Icon';

/**
 * Designer Dashboard
 * Упрощенный дашборд для дизайнера:
 * - Статистика выполненных замеров (сегодня/неделя/месяц)
 * - Сегодняшние задачи
 * - Ближайшие замеры (завтра и т.д.)
 * 
 * БЕЗ: продаж, сделок, FAB кнопки создания
 */
const DesignerDashboard = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    measurements: allMeasurements,
    analytics,
    loading: appLoading,
    analyticsLoading,
    loadData,
    loadAnalytics
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await loadData();
      await loadAnalytics('designer', user.id);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [loadData, loadAnalytics, user.id]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers
  const now = new Date();
  const today = now.toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();

  // Filter measurements by date
  const todayMeasurements = allMeasurements.filter(m => {
    const date = new Date(m.scheduledAt).toDateString();
    return date === today && m.status === 'scheduled';
  });

  const tomorrowMeasurements = allMeasurements.filter(m => {
    const date = new Date(m.scheduledAt).toDateString();
    return date === tomorrow && m.status === 'scheduled';
  });

  const upcomingMeasurements = allMeasurements.filter(m => {
    const date = new Date(m.scheduledAt);
    return date > now && 
           date.toDateString() !== today && 
           date.toDateString() !== tomorrow && 
           m.status === 'scheduled';
  }).slice(0, 3);

  // Statistics
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = {
    today: allMeasurements.filter(m => 
      new Date(m.scheduledAt).toDateString() === today && 
      m.status === 'completed'
    ).length,
    week: allMeasurements.filter(m => 
      new Date(m.scheduledAt) >= startOfWeek && 
      m.status === 'completed'
    ).length,
    month: allMeasurements.filter(m => 
      new Date(m.scheduledAt) >= startOfMonth && 
      m.status === 'completed'
    ).length,
  };

  // Date formatting
  const formatDateKZ = (dateString) => {
    const date = new Date(dateString);
    const months = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    const weekdays = ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'];
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      weekday: weekdays[date.getDay()],
      full: `${date.getDate()} ${months[date.getMonth()]}`,
    };
  };

  const todayFormatted = formatDateKZ(now);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
          <Icon name="error" size={48} className="text-red-500" />
          <h2 className="text-xl font-bold mt-4">Қате</h2>
          <p className="text-text-secondary mt-2">{error}</p>
          <div className="flex gap-3 mt-6">
            <button onClick={loadDashboardData} className="flex-1 px-6 py-2 bg-primary text-white rounded-lg font-bold">
              Қайталау
            </button>
            <button onClick={logout} className="px-6 py-2 bg-gray-100 rounded-lg font-bold">
              Шығу
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Task Card Component
  const TaskCard = ({ measurement, showDate = false }) => {
    const dateInfo = formatDateKZ(measurement.scheduledAt);
    const isPriorityHigh = measurement.priority === 'high';

    return (
      <div 
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/15">
              <Icon name="schedule" size={18} className="text-primary" />
              <span className="font-bold text-primary-dark">{formatTime24(measurement.scheduledAt)}</span>
            </div>
            {showDate && (
              <span className="text-xs text-gray-500">{dateInfo.full}</span>
            )}
          </div>
          {isPriorityHigh && (
            <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded-full text-[10px] font-bold text-white animate-pulse">
              <Icon name="local_fire_department" size={12} />
              ШҰҒЫЛ
            </div>
          )}
        </div>

        {/* Client Name */}
        <h3 className="font-bold text-gray-900 text-lg mb-2">
          {measurement.clientName || 'Клиент'}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
          <Icon name="location_on" size={18} className="text-gray-400" />
          <span className="line-clamp-1">{measurement.address || 'Мекенжай көрсетілмеген'}</span>
        </div>

        {/* Room Type if available */}
        {measurement.roomType && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Icon name="door_front" size={16} />
            <span>{measurement.roomType}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {measurement.clientPhone && (
            <a
              href={`tel:${measurement.clientPhone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon name="call" size={18} />
              Қоңырау
            </a>
          )}
          <button
            onClick={() => navigate(`/designer/measurements/${measurement.id}`)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <Icon name="play_arrow" size={18} />
            Бастау
          </button>
        </div>
      </div>
    );
  };

  // Empty State Component
  const EmptyState = ({ icon, title, description }) => (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <Icon name={icon} size={48} className="text-gray-300" />
      <p className="text-gray-900 font-bold mt-4">{title}</p>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </div>
  );

  return (
    <div className="bg-background-light min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="rounded-full size-12 border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                <Icon name="person" size={24} className="text-primary" />
              </div>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{t('dashboard.designerHello', { name: user?.name || '' })}</h2>
              <p className="text-gray-500 text-sm">
                {todayFormatted.weekday}, {todayFormatted.day} {todayFormatted.month}
              </p>
            </div>
          </div>
          <button 
            onClick={loadDashboardData} 
            className="size-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Icon name="refresh" className="text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
      {/* Statistics */}
      <section className="px-4 mt-4">
        <div className="bg-primary rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="analytics" className="text-white/80" />
            <h2 className="font-bold text-white/90">{t('dashboard.completedMeasurements')}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-3xl font-black">{stats.today}</p>
              <p className="text-xs font-medium text-white/80 mt-1">{t('dashboard.todayLabel')}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-3xl font-black">{stats.week}</p>
              <p className="text-xs font-medium text-white/80 mt-1">{t('dashboard.thisWeek')}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-3xl font-black">{stats.month}</p>
              <p className="text-xs font-medium text-white/80 mt-1">{t('dashboard.thisMonth')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Analytics */}
      <section className="mt-6 px-4 space-y-4">
        {/* Earnings Chart */}
        <ChartLine
          title={t('dashboard.sections.revenueDynamics')}
          data={analytics.designerEarnings?.monthly || monthShort(lang).slice(0, 6).map((label, i) => ({
            label,
            value: [320000, 380000, 450000, 420000, 510000, 580000][i],
          }))}
          height={180}
          valueFormat="currency"
          color="stroke-green-500"
          loading={analyticsLoading}
        />

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title={t('dashboard.stats.averageCheck')}
            value={analytics.designerPerformance?.averageCheck ?
              `${Math.round(analytics.designerPerformance.averageCheck / 1000)}K` : "450K"}
            subtitle={t('dashboard.stats.averageCheckSubtitle')}
            icon="attach_money"
            trend={analytics.designerPerformance?.averageCheckTrend || "up"}
            trendValue={analytics.designerPerformance?.averageCheckTrendValue || "+8%"}
            iconBg="bg-green-500"
            loading={analyticsLoading}
          />
          <StatsCard
            title={t('dashboard.stats.conversion')}
            value={analytics.designerPerformance?.conversionRate || "72%"}
            subtitle={t('dashboard.stats.conversionSubtitle')}
            icon="trending_up"
            trend={analytics.designerPerformance?.conversionTrend || "up"}
            trendValue={analytics.designerPerformance?.conversionTrendValue || "+5%"}
            iconBg="bg-primary"
            loading={analyticsLoading}
          />
        </div>

        {/* Monthly KPI */}
        <KPICard
          title={t('dashboard.stats.monthlyKpi')}
          value={analytics.designerPerformance?.currentMonthMeasurements || stats.month}
          target={analytics.designerPerformance?.monthlyTarget || 20}
          unit={t('dashboard.stats.measurementUnit')}
          period={new Date().toLocaleString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', { month: 'long' })}
          icon="flag"
          loading={analyticsLoading}
        />

        {/* Personal Rating */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Icon name="star" />
              Жеке рейтинг
            </h3>
            <span className="text-2xl font-black">
              #{analytics.designersRanking?.findIndex(d => d.id === user.id) + 1 || 3}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">{t('dashboard.inCompany')}</span>
              <span className="font-bold">{analytics.designersRanking?.length || 12} {lang === 'kz' ? 'дизайнерден' : 'дизайнеров'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">{t('dashboard.monthlyMetric')}</span>
              <span className="font-bold">
                {analytics.designerPerformance?.monthlyRankChange > 0 ? '+' : ''}
                {analytics.designerPerformance?.monthlyRankChange || '+2'} орын
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-white transition-all duration-500"
                style={{width: `${analytics.designerPerformance?.kpiProgress || 75}%`}}></div>
            </div>
            <p className="text-xs opacity-75 text-center mt-2">
              Келесі деңгейге дейін {analytics.designerPerformance?.remainingToNextLevel || 5} өлшем
            </p>
          </div>
        </div>
      </section>

      {/* Today's Tasks */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon name="today" className="text-primary" />
            Бүгінгі тапсырмалар
          </h2>
          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm font-bold">
            {todayMeasurements.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : todayMeasurements.length === 0 ? (
          <EmptyState
            icon="event_available"
            title={t('dashboard.sections.todayTasksEmpty')}
            description={t('dashboard.sections.todayTasksHint')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {todayMeasurements
              .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
              .map(m => (
                <TaskCard key={m.id} measurement={m} />
              ))
            }
          </div>
        )}
      </section>

      {/* Tomorrow's Tasks */}
      {tomorrowMeasurements.length > 0 && (
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Icon name="event" className="text-primary" />
              Ертең
            </h2>
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm font-bold">
              {tomorrowMeasurements.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {tomorrowMeasurements
              .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
              .map(m => (
                <TaskCard key={m.id} measurement={m} />
              ))
            }
          </div>
        </section>
      )}

      {/* Upcoming Tasks */}
      {upcomingMeasurements.length > 0 && (
        <section className="mt-6 px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Icon name="date_range" className="text-gray-400" />
              Алдағы тапсырмалар
            </h2>
            <button 
              onClick={() => navigate('/designer/measurements')}
              className="text-primary text-sm font-bold"
            >
              Барлығы →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcomingMeasurements.map(m => (
              <TaskCard key={m.id} measurement={m} showDate />
            ))}
          </div>
        </section>
      )}

      {/* No upcoming at all */}
      {!loading && todayMeasurements.length === 0 && tomorrowMeasurements.length === 0 && upcomingMeasurements.length === 0 && (
        <section className="px-4 mt-6">
          <EmptyState 
            icon="calendar_month"
            title={t('dashboard.sections.noUpcoming')}
            description={t('dashboard.sections.noUpcomingHint')}
          />
        </section>
      )}

      </div>{/* end max-w-7xl */}

      <BottomNav />
    </div>
  );
};

export default DesignerDashboard;

