import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import EmptyState from '../../components/common/EmptyState';
import { useI18n } from '../../contexts/I18nContext';
import { formatMoneyShort } from '../../utils/money';
import { pluralUnit, NOUNS } from '../../utils/plural';

const AdminReports = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  // Единый форматтер сумм — больше никаких «2252K»/«1254k» вразнобой.
  const fmt = (n) => formatMoneyShort(n, lang);
  const PERIOD_OPTIONS = [
    { value: '7', label: t('adminReports.periods.d7') },
    { value: '30', label: t('adminReports.periods.d30') },
    { value: '90', label: t('adminReports.periods.d90') },
    { value: '365', label: t('adminReports.periods.d365') },
  ];

  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    dashboard: null,
    monthlyTrends: [],
    designersRanking: [],
    revenueBreakdown: null,
    paymentRisks: [],
    topProducts: [],
    clientFunnel: null,
    teamKPIs: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, trends, ranking, revenue, risks, products, funnel, kpis] = await Promise.allSettled([
        api.get(`/analytics/dashboard-stats?period=${period}`),
        api.get(`/analytics/monthly-trends?months=6`),
        api.get(`/analytics/designers-ranking?period=${period}`),
        api.get(`/analytics/revenue-breakdown?period=${period}`),
        api.get(`/analytics/payment-risks`),
        api.get(`/analytics/top-products?limit=5&period=${period}`),
        api.get(`/analytics/client-funnel?period=${period}`),
        api.get(`/analytics/team-kpis?period=${period}`),
      ]);

      setData({
        dashboard: dash.status === 'fulfilled' ? dash.value.data?.data : null,
        monthlyTrends: trends.status === 'fulfilled' ? (trends.value.data?.data || []) : [],
        designersRanking: ranking.status === 'fulfilled' ? (ranking.value.data?.data || []) : [],
        revenueBreakdown: revenue.status === 'fulfilled' ? revenue.value.data?.data : null,
        paymentRisks: risks.status === 'fulfilled' ? (risks.value.data?.data || []) : [],
        topProducts: products.status === 'fulfilled' ? (products.value.data?.data || []) : [],
        clientFunnel: funnel.status === 'fulfilled' ? funnel.value.data?.data : null,
        teamKPIs: kpis.status === 'fulfilled' ? kpis.value.data?.data : null,
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const d = data.dashboard;
  // Normalize trend items: the API returns { label, monthIndex, value }; the chart expects { month, revenue }.
  const RU_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const trends = (data.monthlyTrends || []).map(t => ({
    revenue: t.revenue ?? t.value ?? 0,
    month: (typeof t.monthIndex === 'number' ? RU_MONTHS[t.monthIndex] : null) || t.month || t.label || t.period || '',
  }));
  const maxTrend = Math.max(...trends.map(t => t.revenue), 1);
  // Normalize revenue breakdown: API returns { fabric, sewing, installation, accessories, total };
  // the chart expects { fabricRevenue, sewingRevenue, installationRevenue, deliveryRevenue, totalRevenue }.
  const rb = data.revenueBreakdown;
  const breakdown = rb ? {
    fabricRevenue: rb.fabricRevenue ?? rb.fabric ?? 0,
    sewingRevenue: rb.sewingRevenue ?? rb.sewing ?? 0,
    installationRevenue: rb.installationRevenue ?? rb.installation ?? 0,
    deliveryRevenue: rb.deliveryRevenue ?? rb.delivery ?? rb.accessories ?? 0,
    totalRevenue: rb.totalRevenue ?? rb.total ?? 0,
  } : null;

  return (
    <div className="bg-background-light min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-xl font-bold flex-1">{t('adminReports.title')}</h1>
          <button onClick={load} className="p-2 rounded-full hover:bg-muted">
            <Icon name="refresh" size={20} className="text-muted-foreground" />
          </button>
        </div>
        {/* Period selector */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${period === p.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-5 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Overview KPIs ───────────────────────────────── */}
            <Section title={t('adminReports.sections.overview')} icon="monitoring">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t('adminReports.stats.totalRevenue'), value: fmt(d?.totalRevenue), icon: 'payments', color: 'green' },
                  { label: t('adminReports.stats.completedDeals'), value: d?.completedDeals ?? 0, icon: 'check_circle', color: 'blue' },
                  { label: t('adminReports.stats.totalDeals'), value: d?.totalDeals ?? 0, icon: 'assignment', color: 'purple' },
                  { label: t('adminReports.stats.totalClients'), value: d?.totalClients ?? 0, icon: 'group', color: 'amber' },
                ].map(s => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </Section>

            {/* ── Revenue Trend ────────────────────────────────── */}
            {trends.length > 0 && (
              <Section title={t('adminReports.sections.revenueTrend')} icon="show_chart">
                {maxTrend <= 1 ? (
                  <EmptyState size="sm" icon="show_chart" title={t('reports.noDataPeriod', 'Нет данных за период')} />
                ) : (
                <div className="space-y-2">
                  {trends.slice(0, 6).map((m, i) => {
                    const pct = maxTrend > 0 ? Math.round(((m.revenue || 0) / maxTrend) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-text-secondary w-16 text-right flex-shrink-0">{m.month || m.period}</span>
                        <div className="flex-1 bg-background-light rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${pct === 0 ? 0 : Math.max(pct, 4)}%` }}>
                            {pct > 15 && <span className="text-white text-xs font-bold">{fmt(m.revenue)}</span>}
                          </div>
                        </div>
                        {pct <= 15 && <span className="text-xs text-text-secondary font-medium w-20">{fmt(m.revenue)}</span>}
                      </div>
                    );
                  })}
                </div>
                )}
              </Section>
            )}

            {/* ── Revenue Breakdown ────────────────────────────── */}
            {breakdown && (
              <Section title={t('adminReports.sections.revenueBreakdown')} icon="bar_chart">
                {(() => {
                  const parts = [
                    { label: t('adminReports.revenueParts.fabric'), key: 'fabricRevenue', color: 'bg-primary' },
                    { label: t('adminReports.revenueParts.sewing'), key: 'sewingRevenue', color: 'bg-primary-light' },
                    { label: t('adminReports.revenueParts.installation'), key: 'installationRevenue', color: 'bg-warning' },
                    { label: t('adminReports.revenueParts.delivery'), key: 'deliveryRevenue', color: 'bg-accent' },
                  ].filter(item => breakdown[item.key]);
                  if (parts.length === 0) {
                    return <EmptyState size="sm" icon="bar_chart" title={t('reports.noDataPeriod', 'Нет данных за период')} />;
                  }
                  return (
                    <div className="space-y-3">
                      {parts.map(item => {
                        const val = breakdown[item.key] || 0;
                        const total = breakdown.totalRevenue || 1;
                        const pct = Math.round((val / total) * 100);
                        return (
                          <div key={item.key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-text-secondary">{item.label}</span>
                              <span className="font-semibold text-text-main">{fmt(val)} <span className="text-text-secondary/70 font-normal">({pct}%)</span></span>
                            </div>
                            <div className="h-2 bg-background-light rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Section>
            )}

            {/* ── Designers Ranking ───────────────────────────── */}
            {data.designersRanking.length > 0 && (
              <Section title={t('adminReports.sections.designersRanking')} icon="star">
                <div className="space-y-3">
                  {data.designersRanking.map((des, i) => (
                    <div key={des.id || i} className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-muted text-muted-foreground' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{des.name}</p>
                        {(() => {
                          const orders = des.completedDeals ?? des.completedMeasurements ?? 0;
                          return <p className="text-xs text-muted-foreground">{orders} {pluralUnit(orders, NOUNS.order, lang)}</p>;
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">{fmt(des.revenue || des.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{fmt(des.commission || des.totalCommission)} {t('adminReports.commission')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Team KPIs ────────────────────────────────────── */}
            {data.teamKPIs && (
              <Section title={t('adminReports.sections.teamKpi')} icon="groups">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: t('adminReports.teamKpiLabels.avgConversion'), value: `${data.teamKPIs.avgConversionRate ?? 0}%`, icon: 'sync' },
                    { label: t('adminReports.teamKpiLabels.avgDeal'), value: fmt(data.teamKPIs.avgDealValue), icon: 'payments' },
                    { label: t('adminReports.teamKpiLabels.closingSpeed'), value: t('adminReports.daysShort', { days: data.teamKPIs.avgClosingDays ?? 0 }), icon: 'schedule' },
                    { label: t('adminReports.teamKpiLabels.active'), value: data.teamKPIs.activeDesigners ?? 0, icon: 'person' },
                  ].map(s => (
                    <div key={s.label} className="bg-muted rounded-xl p-3">
                      <Icon name={s.icon} size={18} className="text-primary mb-1" />
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Client Funnel ─────────────────────────────────── */}
            {data.clientFunnel && (
              <Section title={t('adminReports.sections.clientFunnel')} icon="filter_alt">
                <div className="space-y-2">
                  {[
                    { label: t('adminReports.clientFunnelStages.newClient'), key: 'newClients', color: 'bg-primary' },
                    { label: t('adminReports.clientFunnelStages.withMeasurements'), key: 'withMeasurements', color: 'bg-primary/100' },
                    { label: t('adminReports.clientFunnelStages.withProposals'), key: 'withProposals', color: 'bg-primary/50' },
                    { label: t('adminReports.clientFunnelStages.withContracts'), key: 'withContracts', color: 'bg-primary-light' },
                    { label: t('adminReports.clientFunnelStages.completed'), key: 'completed', color: 'bg-primary' },
                  ].map((stage, i, arr) => {
                    const val = data.clientFunnel[stage.key] || 0;
                    const first = data.clientFunnel[arr[0].key] || 1;
                    const pct = Math.round((val / first) * 100);
                    return (
                      <div key={stage.key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 truncate">{stage.label}</span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div className={`h-full ${stage.color} rounded-full flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 5)}%` }}>
                            {pct > 20 && <span className="text-white text-[10px] font-bold">{val}</span>}
                          </div>
                        </div>
                        {pct <= 20 && <span className="text-xs font-bold text-foreground w-6">{val}</span>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Top Products ─────────────────────────────────── */}
            {data.topProducts.length > 0 && (
              <Section title={t('adminReports.sections.topProducts')} icon="star">
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => (
                    <div key={p.id || i} className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name="texture" size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{t('adminReports.soldTimes', { count: p.salesCount ?? p.count ?? 0 })}</p>
                      </div>
                      <p className="font-bold text-sm text-primary">{fmt(p.revenue || p.totalRevenue)}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Payment Risks ─────────────────────────────────── */}
            {data.paymentRisks.length > 0 && (
              <Section title={t('adminReports.sections.paymentRisks')} icon="warning">
                <div className="space-y-3">
                  {data.paymentRisks.slice(0, 5).map((r, i) => (
                    <div key={r.id || i} className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Icon name="warning" size={16} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{r.clientName || r.client_name}</p>
                        <p className="text-xs text-muted-foreground">{t('adminReports.daysOverdue', { days: r.daysOverdue ?? 0 })} • {fmt(r.remainingAmount || r.remaining_amount)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${r.riskLevel === 'high' || r.risk_level === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.riskLevel === 'high' || r.risk_level === 'high' ? t('adminReports.riskLevels.high') : t('adminReports.riskLevels.medium')}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
      <Icon name={icon} size={18} className="text-primary" />
      <h2 className="font-bold text-foreground">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-primary/10 text-primary',
    purple: 'bg-primary/5 text-primary',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-muted rounded-2xl p-4">
      <div className={`size-10 rounded-full ${colors[color] || colors.blue} flex items-center justify-center mb-3`}>
        <Icon name={icon} size={20} />
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
};

export default AdminReports;
