import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const fmt = (n, unit = '₸') => {
  if (!n) return `0 ${unit}`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M ${unit}`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K ${unit}`;
  return `${n} ${unit}`;
};

const AdminReports = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
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
  const maxTrend = Math.max(...data.monthlyTrends.map(t => t.revenue || 0), 1);

  return (
    <div className="bg-background-light min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-xl font-bold flex-1">{t('adminReports.title')}</h1>
          <button onClick={load} className="p-2 rounded-full hover:bg-gray-100">
            <Icon name="refresh" size={20} className="text-gray-500" />
          </button>
        </div>
        {/* Period selector */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {PERIOD_OPTIONS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${period === p.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Overview KPIs ───────────────────────────────── */}
            <Section title={t('adminReports.sections.overview')} icon="monitoring">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Жалпы табыс', value: fmt(d?.totalRevenue), icon: 'payments', color: 'green' },
                  { label: 'Аяқталған', value: d?.completedDeals ?? '—', icon: 'check_circle', color: 'blue' },
                  { label: 'Жасалған', value: d?.totalDeals ?? '—', icon: 'assignment', color: 'purple' },
                  { label: 'Клиенттер', value: d?.totalClients ?? '—', icon: 'group', color: 'amber' },
                ].map(s => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>
            </Section>

            {/* ── Revenue Trend ────────────────────────────────── */}
            {data.monthlyTrends.length > 0 && (
              <Section title={t('adminReports.sections.revenueTrend')} icon="show_chart">
                <div className="space-y-2">
                  {data.monthlyTrends.slice(0, 6).map((m, i) => {
                    const pct = maxTrend > 0 ? Math.round(((m.revenue || 0) / maxTrend) * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">{m.month || m.period}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-primary rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 4)}%` }}>
                            {pct > 15 && <span className="text-white text-xs font-bold">{fmt(m.revenue)}</span>}
                          </div>
                        </div>
                        {pct <= 15 && <span className="text-xs text-gray-600 font-medium w-20">{fmt(m.revenue)}</span>}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Revenue Breakdown ────────────────────────────── */}
            {data.revenueBreakdown && (
              <Section title={t('adminReports.sections.revenueBreakdown')} icon="bar_chart">
                <div className="space-y-3">
                  {[
                    { label: 'Мата', key: 'fabricRevenue', color: 'bg-primary' },
                    { label: 'Тігу', key: 'sewingRevenue', color: 'bg-green-500' },
                    { label: 'Орнату', key: 'installationRevenue', color: 'bg-amber-500' },
                    { label: 'Жеткізу', key: 'deliveryRevenue', color: 'bg-primary-light' },
                  ].filter(item => data.revenueBreakdown[item.key]).map(item => {
                    const val = data.revenueBreakdown[item.key] || 0;
                    const total = data.revenueBreakdown.totalRevenue || 1;
                    const pct = Math.round((val / total) * 100);
                    return (
                      <div key={item.key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="font-semibold">{fmt(val)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── Designers Ranking ───────────────────────────── */}
            {data.designersRanking.length > 0 && (
              <Section title={t('adminReports.sections.designersRanking')} icon="star">
                <div className="space-y-3">
                  {data.designersRanking.map((des, i) => (
                    <div key={des.id || i} className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{des.name}</p>
                        <p className="text-xs text-gray-400">{des.completedDeals ?? 0} тапсырыс</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">{fmt(des.revenue || des.totalRevenue)}</p>
                        <p className="text-xs text-gray-400">{fmt(des.commission || des.totalCommission)} комиссия</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Team KPIs ────────────────────────────────────── */}
            {data.teamKPIs && (
              <Section title={t('adminReports.sections.teamKpi')} icon="groups">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Орт. конверсия', value: `${data.teamKPIs.avgConversionRate ?? 0}%`, icon: 'sync' },
                    { label: 'Орт. сумма', value: fmt(data.teamKPIs.avgDealValue), icon: 'payments' },
                    { label: 'Жабу жылдамдығы', value: `${data.teamKPIs.avgClosingDays ?? 0} күн`, icon: 'schedule' },
                    { label: 'Белсенді', value: data.teamKPIs.activeDesigners ?? '—', icon: 'person' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <Icon name={s.icon} size={18} className="text-primary mb-1" />
                      <p className="text-lg font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
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
                    { label: 'Жаңа клиент', key: 'newClients', color: 'bg-primary' },
                    { label: 'Өлшем тапсырысы', key: 'withMeasurements', color: 'bg-primary/100' },
                    { label: 'Ұсыныс жіберілді', key: 'withProposals', color: 'bg-primary/50' },
                    { label: 'Шарт жасалды', key: 'withContracts', color: 'bg-primary-light' },
                    { label: 'Аяқталды', key: 'completed', color: 'bg-primary' },
                  ].map((stage, i, arr) => {
                    const val = data.clientFunnel[stage.key] || 0;
                    const first = data.clientFunnel[arr[0].key] || 1;
                    const pct = Math.round((val / first) * 100);
                    return (
                      <div key={stage.key} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 truncate">{stage.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className={`h-full ${stage.color} rounded-full flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 5)}%` }}>
                            {pct > 20 && <span className="text-white text-[10px] font-bold">{val}</span>}
                          </div>
                        </div>
                        {pct <= 20 && <span className="text-xs font-bold text-gray-700 w-6">{val}</span>}
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
                        <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.salesCount ?? p.count ?? 0} рет сатылды</p>
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
                        <p className="font-medium text-sm text-gray-900 truncate">{r.clientName || r.client_name}</p>
                        <p className="text-xs text-gray-400">{r.daysOverdue ?? 0} күн өтті • {fmt(r.remainingAmount || r.remaining_amount)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${r.riskLevel === 'high' || r.risk_level === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.riskLevel === 'high' || r.risk_level === 'high' ? 'Жоғары' : 'Орташа'}
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
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
      <Icon name={icon} size={18} className="text-primary" />
      <h2 className="font-bold text-gray-800">{title}</h2>
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
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className={`size-10 rounded-full ${colors[color] || colors.blue} flex items-center justify-center mb-3`}>
        <Icon name={icon} size={20} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

export default AdminReports;
