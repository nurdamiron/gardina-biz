import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatDateKZ, formatTime24 } from '../../utils/dateUtils';
import BottomNav from '../../components/navigation/BottomNav';
import OnboardingChecklist from '../../components/admin/OnboardingChecklist';
import StatsCard from '../../components/analytics/StatsCard';
import ChartBar from '../../components/analytics/ChartBar';
import ChartLine from '../../components/analytics/ChartLine';
import KPICard from '../../components/analytics/KPICard';
import FunnelChart from '../../components/analytics/FunnelChart';
import RecentMeasurementsWidget from '../../components/admin/widgets/RecentMeasurementsWidget';
import FunnelWidget from '../../components/admin/widgets/FunnelWidget';
import PaymentRisksWidget from '../../components/admin/widgets/PaymentRisksWidget';
import TodayWidget from '../../components/admin/widgets/TodayWidget';
import TopProductsWidget from '../../components/admin/widgets/TopProductsWidget';
import ClientSourcesWidget from '../../components/admin/widgets/ClientSourcesWidget';
import EfficiencyWidget from '../../components/admin/widgets/EfficiencyWidget';
import RetentionWidget from '../../components/admin/widgets/RetentionWidget';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';
import api from '../../services/api';
import { NOUNS } from '../../utils/plural';
import { formatMoneyShort } from '../../utils/money';

/**
 * Admin Dashboard
 * Comprehensive view with timeline, analytics, and measurements
 */
const AdminDashboard = () => {
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        measurements,
        deals,
        clients,
        designers,
        analytics,
        loading,
        analyticsLoading,
        analyticsError,
        loadData,
        loadAnalytics
    } = useApp();

    const [stats, setStats] = useState({
        totalDeals: 0,
        totalClients: 0,
        totalMeasurements: 0,
        revenue: 0,
        completedMeasurements: 0,
        pendingMeasurements: 0,
    });
    const [localLoading, setLocalLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [updatingLead, setUpdatingLead] = useState(null);

    useEffect(() => {
        initializeData();
        // Pre-load leads count for badge on tab button
        api.get('/leads').then((r) => setLeads(r.data.data || [])).catch(() => {});
    }, []);

    const initializeData = async () => {
        try {
            setLocalLoading(true);
            // loadData returns { measurements, deals } directly — no redundant API calls needed
            const freshData = await loadData();
            // loadAnalytics loads clients into context and returns them via _clients
            const analyticsResult = await loadAnalytics('admin', user.id);

            const dealsData = freshData?.deals || deals;
            const measurementsData = freshData?.measurements || measurements;
            const clientsData = analyticsResult?._clients || clients;

            // Calculate revenue from deals
            const totalRevenue = dealsData.reduce((sum, d) => {
                return sum + (d.totalAmount?.amount || 0);
            }, 0);

            setStats({
                totalDeals: dealsData.length,
                totalClients: clientsData.length,
                totalMeasurements: measurementsData.length,
                // Revenue = deals only. Previously deals + measurement-window
                // estimates were summed — the SAME money — doubling the total.
                revenue: totalRevenue,
                completedMeasurements: measurementsData.filter(m => m.status === 'completed').length,
                pendingMeasurements: measurementsData.filter(m => m.status === 'scheduled').length,
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLocalLoading(false);
        }
    };

    const refreshData = async () => {
        await loadData(null, true);
        await loadAnalytics('admin', user.id, { force: true });
    };

    const loadLeads = useCallback(async () => {
        setLeadsLoading(true);
        try {
            const res = await api.get('/leads');
            setLeads(res.data.data || []);
        } catch (e) {
            console.error('loadLeads:', e.message);
        } finally {
            setLeadsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'leads') loadLeads();
    }, [activeTab, loadLeads]);

    const updateLeadStatus = async (id, status) => {
        setUpdatingLead(id);
        try {
            const res = await api.patch(`/leads/${id}/status`, { status });
            setLeads((prev) => prev.map((l) => (l.id === id ? res.data.data : l)));
        } catch (e) {
            console.error('updateLeadStatus:', e.message);
        } finally {
            setUpdatingLead(null);
        }
    };

    // Group measurements by date for timeline
    const getMeasurementsByDate = () => {
        const sorted = [...measurements].sort((a, b) =>
            new Date(b.scheduledAt) - new Date(a.scheduledAt)
        );

        const grouped = {};
        sorted.forEach(m => {
            const date = new Date(m.scheduledAt).toDateString();
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(m);
        });

        return grouped;
    };

    const groupedMeasurements = getMeasurementsByDate();

    // Calculate financial analytics
    const getFinancialBreakdown = () => {
        let fabricCost = 0;
        let sewingCost = 0;
        let installCost = 0;
        let totalRevenue = 0;

        measurements.forEach(m => {
            if (m.status === 'completed' && m.windows) {
                m.windows.forEach(w => {
                    const items = w.priceBreakdown?.clientCheck?.items || [];
                    items.forEach(item => {
                        totalRevenue += item.total || 0;
                        if (item.name.includes('Мата')) fabricCost += item.total || 0;
                        if (item.name.includes('Тігу')) sewingCost += item.total || 0;
                        if (item.name.includes('Монтаж')) installCost += item.total || 0;
                    });
                });
            }
        });

        return { fabricCost, sewingCost, installCost, totalRevenue };
    };

    const financialBreakdown = getFinancialBreakdown();

    const statCards = [
        { label: t('dashboard.stats.totalMeasurements'), value: stats.totalMeasurements, icon: 'straighten', accent: 'border-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary', subtext: `${stats.completedMeasurements} ${t('dashboard.stats.completedSuffix')}` },
        { label: t('dashboard.stats.totalClients'), value: stats.totalClients, icon: 'group', accent: 'border-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', subtext: t('dashboard.stats.clientsSubtext') },
        { label: t('dashboard.stats.totalDeals'), value: stats.totalDeals, icon: 'handshake', accent: 'border-primary-light', iconBg: 'bg-primary/5', iconColor: 'text-primary-light', subtext: t('dashboard.stats.dealsSubtext') },
        { label: t('dashboard.stats.revenue'), value: formatMoneyShort(stats.revenue, lang), icon: 'payments', accent: 'border-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', subtext: t('dashboard.stats.revenueSubtext') },
    ];

    return (
        <div className="bg-background-light min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold text-foreground">{t('adminDashboard.title')}</h1>
                    <button onClick={refreshData} className="size-10 rounded-full bg-muted hover:bg-muted flex items-center justify-center transition-colors">
                        <Icon name="refresh" className="text-muted-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'overview' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'timeline' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.timeline')}
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'finance' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.finance')}
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'team' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.team')}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'products' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.products')}
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'clients' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.clients')}
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`relative px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'leads' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {t('adminDashboard.tabs.leads')}
                        {leads.filter((l) => l.status === 'new').length > 0 && activeTab !== 'leads' && (
                            <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {leads.filter((l) => l.status === 'new').length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-5 max-w-7xl mx-auto">
                {analyticsError && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <Icon name="warning" className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-amber-800">{t('adminDashboard.analyticsError')}</p>
                        </div>
                        <button
                            onClick={refreshData}
                            className="text-sm font-medium text-amber-700 hover:text-amber-900 shrink-0"
                        >
                            {t('adminDashboard.retry')}
                        </button>
                    </div>
                )}
                <OnboardingChecklist />

                {/* ── Stats row ── compact white cards, left-accent border */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-surface-light rounded-xl border border-border-light shadow-card px-4 py-3 flex items-center gap-3 hover:border-primary/30 transition-colors"
                        >
                            <div className={`size-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                                <Icon name={stat.icon} size={20} className={stat.iconColor} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-black text-text-main leading-none whitespace-nowrap">
                                    {localLoading ? <span className="inline-block w-8 h-6 bg-background-light rounded animate-pulse" /> : stat.value}
                                </p>
                                <p className="text-xs font-semibold text-text-secondary mt-0.5 leading-tight">{stat.label}</p>
                                {stat.subtext && <p className="text-[10px] text-text-secondary/70 truncate">{stat.subtext}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── OVERVIEW TAB ──
                    Ordered by what an owner acts on: today's work and unpaid
                    money first, then trend, then the slower analytics. Quick
                    actions are navigation, so they sit at the bottom. */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">

                        {/* What needs a person today */}
                        <div className="grid gap-4 items-start lg:grid-cols-3">
                            <TodayWidget measurements={measurements} leads={leads} loading={localLoading} />
                            <PaymentRisksWidget risks={analytics.paymentRisks} loading={analyticsLoading} />
                            <RecentMeasurementsWidget measurements={measurements} loading={localLoading} />
                        </div>

                        {/* Where the business is heading.
                            items-start: without it the grid stretches the
                            shorter card to the taller one's height, which left
                            a half-empty panel under the chart. */}
                        <div className="grid gap-4 items-start lg:grid-cols-[1.7fr_1fr]">
                            <ChartLine
                                title={t('adminDashboard.widgets.revenue.title')}
                                data={analytics.monthlyTrends || []}
                                valueFormat="currency"
                                height={190}
                                loading={analyticsLoading}
                            />
                            <FunnelWidget funnel={analytics.clientFunnel} loading={analyticsLoading} />
                        </div>

                        {/* Slower-moving analytics */}
                        <div className="grid gap-4 items-start sm:grid-cols-2 xl:grid-cols-4">
                            <TopProductsWidget products={analytics.topProducts} loading={analyticsLoading} />
                            <ClientSourcesWidget sources={analytics.clientsBySource} loading={analyticsLoading} />
                            <RetentionWidget retention={analytics.clientRetention} loading={analyticsLoading} />
                            <EfficiencyWidget efficiency={analytics.teamEfficiency} loading={analyticsLoading} />
                        </div>

                        {/* Navigation */}
                        <div className="space-y-3 pt-1">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t('adminDashboard.sections.quickActions')}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {[
                                    { path: '/admin/catalog', icon: 'inventory_2', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: 'Каталог', sub: lang === 'kz' ? 'Маталар, бағалар' : 'Ткани, цены' },
                                    { path: '/admin/clients', icon: 'groups', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: t('adminDashboard.tabs.clients'), sub: `${stats.totalClients}` },
                                    { path: '/admin/orders', icon: 'shopping_cart', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: lang === 'kz' ? 'Тапсырыстар' : 'Заказы', sub: `${stats.totalDeals}` },
                                    { path: '/admin/users', icon: 'manage_accounts', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: t('adminDashboard.tabs.team'), sub: lang === 'kz' ? 'Қызметкерлер' : 'Сотрудники' },
                                    { path: '/admin/reports', icon: 'bar_chart', iconBg: 'bg-primary/10', iconColor: 'text-primary', label: lang === 'kz' ? 'Есептер' : 'Отчёты', sub: lang === 'kz' ? 'Аналитика' : 'Аналитика' },
                                    { path: '/admin/design-studio', icon: 'palette', iconBg: 'bg-accent/20', iconColor: 'text-primary', label: lang === 'kz' ? 'Дизайн генерациясы' : 'Генерация дизайна', sub: lang === 'kz' ? 'AI визуализация' : 'AI-визуализация' },
                                ].map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className="group flex flex-col items-start gap-3 p-4 rounded-2xl border border-border-light bg-surface-light hover:border-primary/40 hover:shadow-card transition-all text-left"
                                    >
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                                            <Icon name={item.icon} size={22} className={item.iconColor} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-tight text-text-main">{item.label}</p>
                                            <p className="text-[11px] mt-0.5 text-text-secondary">{item.sub}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Өлшемдер Timeline</h2>
                            <span className="text-sm text-muted-foreground">{measurements.length} өлшем</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : Object.keys(groupedMeasurements).length === 0 ? (
                            <div className="bg-card rounded-2xl p-8 text-center">
                                <Icon name="event_busy" size={40} className="text-muted-foreground" />
                                <p className="text-muted-foreground mt-3">Өлшем жоқ</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedMeasurements).map(([dateString, items], groupIdx) => {
                                    const date = new Date(dateString);
                                    const dayLabel = formatDateKZ(dateString);

                                    return (
                                        <div key={groupIdx} className="relative">
                                            {/* Date Label */}
                                            <div className="sticky top-20 z-10 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-xl shadow-lg mb-3 flex items-center gap-2">
                                                <Icon name="calendar_today" />
                                                <span className="font-bold">{dayLabel}</span>
                                                <span className="ml-auto text-xs opacity-75">{items.length} өлшем</span>
                                            </div>

                                            {/* Timeline Items */}
                                            <div className="space-y-3 relative pl-6">
                                                {/* Vertical Line */}
                                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent"></div>

                                                {items.map((measurement, idx) => {
                                                    const totalPrice = measurement.windows?.reduce((sum, w) => {
                                                        return sum + (w.priceBreakdown?.clientCheck?.total || 0);
                                                    }, 0) || 0;

                                                    const statusColors = {
                                                        'scheduled': 'bg-primary',
                                                        'in_progress': 'bg-yellow-500',
                                                        'completed': 'bg-green-500',
                                                        'cancelled': 'bg-red-500'
                                                    };

                                                    const statusLabels = {
                                                        'scheduled': 'Жоспарланған',
                                                        'in_progress': 'Орындалуда',
                                                        'completed': 'Аяқталды',
                                                        'cancelled': 'Болдырылмады'
                                                    };

                                                    return (
                                                        <div key={measurement.id} className="relative">
                                                            {/* Timeline Dot */}
                                                            <div className={`absolute -left-[22px] top-4 size-3 rounded-full ${statusColors[measurement.status]} border-2 border-white shadow-lg`}></div>

                                                            {/* Measurement Card */}
                                                            <div
                                                                onClick={() => navigate(`/measurements/${measurement.id}`)}
                                                                className="bg-card rounded-xl p-4 shadow-sm border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                                                            >
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-bold text-foreground">{measurement.clientName}</h3>
                                                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${statusColors[measurement.status]}`}>
                                                                                {statusLabels[measurement.status]}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Icon name="schedule" size={14} />
                                                                            {formatTime24(measurement.scheduledAt)}
                                                                        </p>
                                                                    </div>
                                                                    {totalPrice > 0 && (
                                                                        <div className="text-right">
                                                                            <p className="text-lg font-black text-green-600">{totalPrice.toLocaleString()} ₸</p>
                                                                            <p className="text-[10px] text-muted-foreground">Болжалды құн</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Windows Count */}
                                                                {measurement.windows && measurement.windows.length > 0 && (
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="px-2 py-1 bg-primary/5 text-primary-dark rounded-lg font-medium">
                                                                            {measurement.windows.length} бөлме
                                                                        </span>
                                                                        <span className="px-2 py-1 bg-primary/10 text-primary-dark rounded-lg font-medium">
                                                                            #{measurement.id.slice(0, 8)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Address */}
                                                                {measurement.address && (
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                                                        <Icon name="location_on" size={14} />
                                                                        <span className="line-clamp-1">{measurement.address}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* FINANCE TAB */}
                {activeTab === 'finance' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Қаржылық талдау</h2>

                        {/* Total Revenue Card */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
                            <p className="text-sm opacity-90 mb-1">Жалпы кіріс</p>
                            <p className="text-4xl font-black mb-2">{financialBreakdown.totalRevenue.toLocaleString()} ₸</p>
                            <p className="text-xs opacity-75">Аяқталған өлшемдерден</p>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Icon name="analytics" className="text-primary" />
                                Кіріс бөлінісі
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                            <Icon name="texture" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-amber-900">Мата</p>
                                            <p className="text-xs text-amber-700">
                                                {financialBreakdown.totalRevenue > 0 ? ((financialBreakdown.fabricCost / financialBreakdown.totalRevenue) * 100).toFixed(0) : 0}% кірістен
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-amber-900">{financialBreakdown.fabricCost.toLocaleString()} ₸</p>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-primary-light text-white flex items-center justify-center">
                                            <Icon name="cut" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary-dark">Тігу</p>
                                            <p className="text-xs text-primary-dark">
                                                {financialBreakdown.totalRevenue > 0 ? ((financialBreakdown.sewingCost / financialBreakdown.totalRevenue) * 100).toFixed(0) : 0}% кірістен
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-primary-dark">{financialBreakdown.sewingCost.toLocaleString()} ₸</p>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/25">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-primary text-white flex items-center justify-center">
                                            <Icon name="build" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary-dark">Монтаж</p>
                                            <p className="text-xs text-primary-dark">
                                                {financialBreakdown.totalRevenue > 0 ? ((financialBreakdown.installCost / financialBreakdown.totalRevenue) * 100).toFixed(0) : 0}% кірістен
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-primary-dark">{financialBreakdown.installCost.toLocaleString()} ₸</p>
                                </div>
                            </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                            <h3 className="font-bold text-foreground mb-4">Көрсеткіштер</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Аяқталу жылдамдығы</span>
                                        <span className="font-bold text-foreground">
                                            {stats.totalMeasurements > 0
                                                ? ((stats.completedMeasurements / stats.totalMeasurements) * 100).toFixed(0)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                            style={{ width: `${stats.totalMeasurements > 0 ? (stats.completedMeasurements / stats.totalMeasurements) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Орташа өлшем құны</span>
                                        <span className="font-bold text-foreground">
                                            {stats.completedMeasurements > 0
                                                ? (financialBreakdown.totalRevenue / stats.completedMeasurements).toLocaleString(0)
                                                : 0} ₸
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TEAM TAB */}
                {activeTab === 'team' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">{lang === 'kz' ? 'Команда өнімділігі' : 'Производительность команды'}</h2>

                        {/* Team KPIs */}
                        <div className="grid grid-cols-2 gap-3">
                            <KPICard
                                title={t('dashboard.sections.designersKpi')}
                                value={analytics.teamKPIs?.designers?.completedMeasurements || measurements.filter(m => m.status === 'completed').length}
                                target={analytics.teamKPIs?.designers?.target || 50}
                                unit={t('dashboard.stats.measurementUnit')}
                                unitForms={NOUNS.measurement}
                                period={t('common.month')}
                                icon="design_services"
                                loading={analyticsLoading}
                            />
                            <KPICard
                                title={t('dashboard.sections.managersKpi')}
                                value={analytics.teamKPIs?.managers?.closedDeals || deals.filter(d => d.status === 'completed').length}
                                target={analytics.teamKPIs?.managers?.target || 30}
                                unit={t('dashboard.stats.dealUnit')}
                                unitForms={NOUNS.deal}
                                period={t('common.month')}
                                icon="support_agent"
                                loading={analyticsLoading}
                            />
                        </div>

                        {/* Performance Chart */}
                        <ChartBar
                            title={t('dashboard.sections.designersRanking')}
                            data={analytics.designersRanking?.map((designer, idx) => ({
                                label: designer.name || `${t('dashboard.ranking.designer')} ${idx + 1}`,
                                value: designer.completedMeasurements || 0,
                                color: ['bg-primary', 'bg-green-500', 'bg-primary-light', 'bg-yellow-500'][idx % 4]
                            })) || [1, 2, 3, 4].map((n, idx) => ({
                                label: `${t('dashboard.ranking.designer')} ${n}`,
                                value: [25, 20, 15, 10][idx],
                                color: ['bg-primary', 'bg-green-500', 'bg-primary-light', 'bg-yellow-500'][idx],
                            }))}
                            height={200}
                            valueFormat="number"
                            loading={analyticsLoading}
                        />

                        {/* Efficiency Stats */}
                        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                            <h3 className="font-bold text-foreground mb-4">Тиімділік көрсеткіштері</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Орташа өлшем уақыты</span>
                                    <span className="font-bold text-foreground">2.5 сағат</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Конверсия өлшем → мәміле</span>
                                    <span className="font-bold text-green-600">68%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Орташа чек</span>
                                    <span className="font-bold text-foreground">450,000 ₸</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">{lang === 'kz' ? 'Өнімдер аналитикасы' : 'Аналитика по продуктам'}</h2>

                        {/* Product Sales Distribution */}
                        <ChartBar
                            title={t('dashboard.sections.salesByCategory')}
                            data={analytics.productSales?.categories?.map((cat, idx) => ({
                                label: cat.name || cat.category,
                                value: cat.percentage || cat.value || 0,
                                color: ['bg-primary', 'bg-primary-light', 'bg-green-500', 'bg-yellow-500'][idx % 4]
                            })) || [
                                { label: t('dashboard.categories.curtain'), value: 45, color: 'bg-primary' },
                                { label: t('dashboard.categories.tulle'), value: 30, color: 'bg-primary-light' },
                                { label: t('dashboard.categories.cornice'), value: 15, color: 'bg-green-500' },
                                { label: t('dashboard.categories.jalousie'), value: 10, color: 'bg-yellow-500' },
                            ]}
                            height={200}
                            horizontal={true}
                            valueFormat="percent"
                            loading={analyticsLoading}
                        />

                        {/* Monthly Sales Trend */}
                        <ChartLine
                            title={t('dashboard.sections.monthlyTrend')}
                            /* Was `monthShort(...)` with a hardcoded
                               [3.2M, 3.5M, …] fallback: monthShort was never
                               imported, so a missing trend threw a
                               ReferenceError — and when it did not, it showed
                               invented revenue. ChartLine renders its own
                               empty state for [], which is the honest one. */
                            data={analytics.monthlyTrends || []}
                            height={200}
                            valueFormat="currency"
                            loading={analyticsLoading}
                        />

                        {/* Top Products */}
                        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                            <h3 className="font-bold text-foreground mb-4">Топ сатылымдар</h3>
                            <div className="space-y-3">
                                {['Blackout Royal', 'Tюль Crystal', 'Карниз Premium', 'Жалюзи Wood'].map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                                            <div>
                                                <p className="font-bold text-foreground">{product}</p>
                                                <p className="text-xs text-muted-foreground">15 сатылым</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-green-600">1,500,000 ₸</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CLIENTS TAB */}
                {activeTab === 'clients' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Клиенттер аналитикасы</h2>

                        {/* Client Statistics */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatsCard
                                title="Жаңа клиенттер"
                                value={analytics.dashboardStats?.newClients || clients.filter(c => {
                                    const createdDate = new Date(c.createdAt);
                                    const startOfMonth = new Date();
                                    startOfMonth.setDate(1);
                                    return createdDate >= startOfMonth;
                                }).length || "0"}
                                subtitle="Осы айда"
                                icon="person_add"
                                trend="up"
                                trendValue={analytics.dashboardStats?.newClientsGrowth || "+12%"}
                                iconBg="bg-green-500"
                                loading={analyticsLoading}
                            />
                            <StatsCard
                                title="Қайта келгендер"
                                value={analytics.dashboardStats?.retentionRate || "28%"}
                                subtitle="Retention rate"
                                icon="repeat"
                                trend="up"
                                trendValue={analytics.dashboardStats?.retentionGrowth || "+5%"}
                                iconBg="bg-primary"
                                loading={analyticsLoading}
                            />
                        </div>

                        {/* Client Funnel */}
                        <FunnelChart
                            title="Клиенттер воронкасы"
                            data={analytics.clientFunnel || [
                                { label: 'Лидтер', value: 150, color: 'bg-primary' },
                                { label: 'Кездесулер', value: 100, color: 'bg-primary/100' },
                                { label: 'Ұсыныстар', value: 75, color: 'bg-primary-light' },
                                { label: 'Келісімшарттар', value: 50, color: 'bg-primary-light' },
                                { label: 'Аяқталған', value: 45, color: 'bg-green-500' }
                            ]}
                            orientation="horizontal"
                            valueFormat="deals"
                            loading={analyticsLoading}
                        />

                        {/* Geographic Distribution */}
                        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Icon name="location_on" className="text-primary" />
                                География бойынша
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary"></div>
                                        <span className="text-sm text-foreground">Алматы</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">65%</span>
                                        <span className="text-xs text-muted-foreground">(98 клиент)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-foreground">Астана</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">25%</span>
                                        <span className="text-xs text-muted-foreground">(38 клиент)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary-light"></div>
                                        <span className="text-sm text-foreground">Басқа</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">10%</span>
                                        <span className="text-xs text-muted-foreground">(14 клиент)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LEADS TAB ── */}
                {activeTab === 'leads' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Заявки с лендинга</h2>
                            <button
                                onClick={loadLeads}
                                className="size-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                                <Icon name="refresh" size={16} className="text-muted-foreground" />
                            </button>
                        </div>

                        {leadsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                                        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="bg-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center shadow-sm border border-border">
                                <Icon name="inbox" size={40} className="text-muted-foreground" />
                                <p className="text-muted-foreground font-medium">Заявок пока нет</p>
                                <p className="text-xs text-muted-foreground">Они появятся, когда кто-то заполнит форму на сайте</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leads.map((lead) => {
                                    const statusCfg = {
                                        new:       { label: 'Новый',        cls: 'bg-blue-100 text-blue-700' },
                                        contacted: { label: 'Связались',    cls: 'bg-amber-100 text-amber-700' },
                                        converted: { label: 'Клиент',       cls: 'bg-green-100 text-green-700' },
                                        rejected:  { label: 'Отказ',        cls: 'bg-muted text-muted-foreground' },
                                    };
                                    const cfg = statusCfg[lead.status] || statusCfg.new;
                                    const date = new Date(lead.created_at);
                                    const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
                                    const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div key={lead.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-foreground text-sm">{lead.name}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                                                    </div>
                                                    <a
                                                        href={`tel:${lead.phone}`}
                                                        className="text-sm text-primary font-medium hover:underline"
                                                    >
                                                        {lead.phone}
                                                    </a>
                                                    {lead.salon && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">Салон: {lead.salon}</p>
                                                    )}
                                                    {lead.comment && (
                                                        <p className="text-xs text-muted-foreground mt-1 italic">"{lead.comment}"</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground mt-1.5">{dateStr} · {timeStr}</p>
                                                </div>

                                                <div className="flex flex-col gap-1.5 shrink-0">
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="size-8 rounded-xl bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
                                                        title="WhatsApp"
                                                    >
                                                        <Icon name="chat" size={16} className="text-green-600" />
                                                    </a>
                                                    <a
                                                        href={`tel:${lead.phone}`}
                                                        className="size-8 rounded-xl bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                        title="Позвонить"
                                                    >
                                                        <Icon name="call" size={16} className="text-blue-600" />
                                                    </a>
                                                </div>
                                            </div>

                                            {/* Status actions */}
                                            {lead.status !== 'converted' && lead.status !== 'rejected' && (
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                                                    {lead.status === 'new' && (
                                                        <button
                                                            onClick={() => updateLeadStatus(lead.id, 'contacted')}
                                                            disabled={updatingLead === lead.id}
                                                            className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                                                        >
                                                            Связались
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => updateLeadStatus(lead.id, 'converted')}
                                                        disabled={updatingLead === lead.id}
                                                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                                                    >
                                                        Стал клиентом
                                                    </button>
                                                    <button
                                                        onClick={() => updateLeadStatus(lead.id, 'rejected')}
                                                        disabled={updatingLead === lead.id}
                                                        className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-muted text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                                    >
                                                        Отказ
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

            </main>

            <BottomNav />
        </div>
    );
};

export default AdminDashboard;
