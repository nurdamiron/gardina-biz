import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard, SkeletonStats } from '../components/common/Skeleton';
import { formatTime24 } from '../utils/dateUtils';
import { formatMoneyShort } from '../utils/money';
import Icon from '../components/common/Icon';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const { measurements: allMeasurements, deals, loadData, loading: appLoading } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await loadData();
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter scheduled meetings from cached data
  const meetings = allMeasurements.filter(m => m.status === 'scheduled');

  const stats = {
    sales: deals.reduce((sum, deal) => sum + (deal.totalAmount?.amount || deal.totalAmount || 0), 0),
    measurements: meetings.length,
    deals: deals.filter(d => d.status !== 'lead').length,
    goal: 200000,
  };
  // Guard against division by zero (NaN/Infinity when goal is 0)
  const progress = stats.goal > 0 ? Math.round((stats.sales / stats.goal) * 100) : 0;
  const urgentActions = deals.filter(d => d.status === 'proposal_sent' || d.paymentStatus === 'pending');

  // Remove fullscreen loading - show skeleton instead

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light p-4">
        <div className="text-center p-8 bg-card rounded-2xl shadow-sm max-w-md">
          <Icon name="error" size={48} className="text-red-500" />
          <h2 className="text-xl font-bold mt-4">{t('common.error')}</h2>
          <p className="text-text-secondary mt-2">{error}</p>
          <div className="flex gap-3 mt-6">
            <button onClick={loadDashboardData} className="flex-1 px-6 py-2 bg-primary text-white rounded-lg font-bold">
              {t('common.retry')}
            </button>
            <button onClick={logout} className="px-6 py-2 bg-muted rounded-lg font-bold">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen pb-32">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="rounded-full size-10 border border-border bg-primary/10 flex items-center justify-center">
                <Icon name="person" size={20} className="text-primary" />
              </div>
              <div className="absolute bottom-0 right-0 size-2.5 bg-primary rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">{t('dashboard.designerHello').replace('{name}', user?.name || '')}</h2>
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                {new Date().toLocaleDateString('kk-KZ', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/measurements')} className="size-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center relative transition-colors">
            <Icon name="notifications" className="text-muted-foreground" />
            {urgentActions.length > 0 && <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
      {/* 1. MY RESULTS - First */}
      <section className="mt-4 mb-6">
        <h2 className="text-xl font-bold px-4 pb-3">
          {t('dashboard.myResults')} <span className="text-sm font-normal text-text-secondary ml-1">({t('dashboard.thisWeek')})</span>
        </h2>
        {loading ? (
          <div className="mx-4"><SkeletonStats /></div>
        ) : (
          <div className="mx-4 bg-card rounded-2xl p-5 shadow-sm border">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-secondary uppercase">{t('dashboard.sales')}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold">{formatMoneyShort(stats.sales, lang)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-primary/10 rounded-lg p-2 flex flex-col items-center min-w-[70px]">
                  <span className="text-lg font-bold text-primary">{stats.measurements}</span>
                  <span className="text-[10px] font-medium text-text-secondary">{t('dashboard.stats.measurementUnit')}</span>
                </div>
                <div className="bg-muted rounded-lg p-2 flex flex-col items-center min-w-[70px]">
                  <span className="text-lg font-bold">{stats.deals}</span>
                  <span className="text-[10px] font-medium text-text-secondary">{t('dashboard.stats.dealUnit')}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-text-secondary">{t('dashboard.goalPrefix')}: {formatMoneyShort(stats.goal, lang)}</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. URGENT ACTIONS - Second */}
      <section className="mt-8">
        <h2 className="text-xl font-bold px-4 pb-3">{t('dashboard.sections.needsAction')}</h2>
        <div className="px-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {urgentActions.length === 0 ? (
            <div className="bg-card p-6 rounded-xl shadow-sm text-center">
              <Icon name="check_circle" size={32} className="text-green-500" />
              <p className="text-text-secondary mt-2 text-sm">{t('dashboard.manager.allDone')}</p>
            </div>
          ) : (
            urgentActions.map(deal => (
              <div key={deal.id} onClick={() => navigate(`/deals/${deal.id}`)} className="flex items-center gap-4 bg-card p-3 rounded-xl shadow-sm border-l-4 border-red-500 cursor-pointer">
                <div className="size-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Icon name="attach_money" size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold">{t('dashboard.dealShortLabel')} #{deal.id.slice(0, 8)}</p>
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t('dashboard.urgent')}</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {deal.status === 'proposal_sent' ? 'Клиент жауабын күтуде' : 'Төлем күтілуде'}
                  </p>
                </div>
                <Icon name="chevron_right" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. UPCOMING MEETINGS - Third */}
      <section className="mt-8 mb-6">
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-xl font-bold">{t('dashboard.upcomingMeetings')}</h2>
          <button onClick={() => navigate('/measurements')} className="text-sm font-medium text-primary">{t('dashboard.viewAll')}</button>
        </div>
        <div className="px-4 flex flex-col gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : meetings.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 shadow-sm text-center">
              <Icon name="event_busy" size={48} className="text-muted-foreground" />
              <p className="text-text-secondary mt-4">{t('dashboard.sections.noUpcoming')}</p>
              <button onClick={() => navigate('/measurements/new')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-bold">
                {t('dashboard.scheduleMeeting')}
              </button>
            </div>
          ) : (
            (() => {
              const meeting = meetings[0]; // Only first (nearest) meeting
              if (!meeting) return null;
              const isPriorityHigh = meeting.priority === 'high';

              return (
                <div
                  key={meeting.id}
                  className="group bg-card rounded-2xl p-5 shadow-sm border-2 border-primary/20 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded text-[10px] font-bold text-green-600 border border-green-200">
                          <Icon name="stars" size={14} />
                          {t('dashboard.nearestMeeting')}
                        </div>
                        {isPriorityHigh && (
                          <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold text-white animate-pulse">
                            <Icon name="local_fire_department" size={12} />
                            {t('dashboard.urgent')}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors">
                        {meeting.clientName || t('dashboard.fallbacks.client')}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary-dark border border-primary/25">
                        {t('dashboard.measurementType')}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg border border-primary/15 flex-1">
                      <Icon name="event" size={18} className="text-primary" />
                      <span className="font-bold text-primary-dark text-sm">
                        {new Date(meeting.scheduledAt).toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
                      <Icon name="schedule" size={18} className="text-primary" />
                      <span className="font-bold text-primary text-sm">{formatTime24(meeting.scheduledAt)}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 bg-muted/50 p-2 rounded-lg">
                    <Icon name="location_on" size={18} />
                    <span className="line-clamp-1 font-medium">{meeting.address}</span>
                  </div>

                  {/* Room Type & Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Бөлме</p>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {meeting.roomType || '---'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/measurements/${meeting.id}`)}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-1"
                    >
                      <Icon name="play_arrow" size={18} />
                      {t('dashboard.start')}
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </section>

      </div>{/* end max-w-5xl */}
      <div className="fixed bottom-24 right-4 z-30">
        <button onClick={() => navigate('/measurements/new')} className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-[0_4px_14px_rgba(27,94,69,0.45)] hover:brightness-110 active:scale-95">
          <Icon name="add" size={32} />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
