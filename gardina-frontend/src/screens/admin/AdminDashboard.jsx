import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { formatDateKZ, formatTime24 } from '../../utils/dateUtils';
import BottomNav from '../../components/navigation/BottomNav';
import OnboardingChecklist from '../../components/admin/OnboardingChecklist';
// Import new analytics components
import StatsCard from '../../components/analytics/StatsCard';
import ChartBar from '../../components/analytics/ChartBar';
import ChartLine from '../../components/analytics/ChartLine';
import KPICard from '../../components/analytics/KPICard';
import FunnelChart from '../../components/analytics/FunnelChart';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

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

    useEffect(() => {
        initializeData();
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

            // Calculate revenue from completed measurements
            const measurementRevenue = measurementsData.reduce((sum, m) => {
                if (m.status === 'completed' && m.windows) {
                    const windowsTotal = m.windows.reduce((wSum, w) => {
                        return wSum + (w.priceBreakdown?.clientCheck?.total || 0);
                    }, 0);
                    return sum + windowsTotal;
                }
                return sum;
            }, 0);

            setStats({
                totalDeals: dealsData.length,
                totalClients: clientsData.length,
                totalMeasurements: measurementsData.length,
                revenue: totalRevenue + measurementRevenue,
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
        { label: t('dashboard.stats.totalMeasurements'), value: stats.totalMeasurements, icon: 'straighten', color: 'bg-primary', subtext: `${stats.completedMeasurements} ${t('dashboard.stats.completedSuffix')}` },
        { label: t('dashboard.stats.totalClients'), value: stats.totalClients, icon: 'group', color: 'bg-green-500', subtext: t('dashboard.stats.clientsSubtext') },
        { label: t('dashboard.stats.totalDeals'), value: stats.totalDeals, icon: 'handshake', color: 'bg-primary-light', subtext: t('dashboard.stats.dealsSubtext') },
        { label: t('dashboard.stats.revenue'), value: `${(stats.revenue / 1000).toFixed(0)}K ₸`, icon: 'payments', color: 'bg-amber-500', subtext: t('dashboard.stats.revenueSubtext') },
    ];

    return (
        <div className="bg-background-light min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-xl font-bold text-gray-900">{t('adminDashboard.title')}</h1>
                    <button onClick={refreshData} className="size-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <Icon name="refresh" className="text-gray-600" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'overview' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'timeline' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.timeline')}
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'finance' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.finance')}
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'team' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.team')}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'products' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.products')}
                    </button>
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                            activeTab === 'clients' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('adminDashboard.tabs.clients')}
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-4 max-w-7xl mx-auto">
                <OnboardingChecklist />
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, idx) => (
                        <div key={idx} className={`${stat.color} rounded-2xl p-4 shadow-lg text-white`}>
                            <div className="flex items-center justify-between mb-2">
                                <Icon name={stat.icon} size={24} />
                            </div>
                            <p className="text-3xl font-black mb-1">
                                {loading ? '...' : stat.value}
                            </p>
                            <p className="text-xs opacity-90 font-medium">{stat.label}</p>
                            {stat.subtext && (
                                <p className="text-[10px] opacity-75 mt-1">{stat.subtext}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <h2 className="text-lg font-bold">Жылдам әрекеттер</h2>

                            <button
                                onClick={() => navigate('/admin/catalog')}
                                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 text-white font-bold py-5 rounded-2xl shadow-lg transition-all flex items-center gap-3 px-5"
                            >
                                <Icon name="inventory_2" size={28} />
                                <div className="text-left flex-1">
                                    <p className="text-base font-bold">Каталогты басқару</p>
                                    <p className="text-xs opacity-90">Маталар, қызметтер, бағалар</p>
                                </div>
                            </button>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <button
                                    onClick={() => navigate('/admin/clients')}
                                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <Icon name="groups" size={28} className="text-primary" />
                                    <p className="text-sm">Клиенттер</p>
                                </button>
                                <button
                                    onClick={() => navigate('/admin/orders')}
                                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <Icon name="shopping_cart" size={28} className="text-primary" />
                                    <p className="text-sm">Тапсырыстар</p>
                                </button>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <Icon name="manage_accounts" size={28} className="text-primary-light" />
                                    <p className="text-sm">Команда</p>
                                </button>
                                <button
                                    onClick={() => navigate('/admin/reports')}
                                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <Icon name="bar_chart" size={28} className="text-green-600" />
                                    <p className="text-sm">Есептер</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TIMELINE TAB */}
                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Өлшемдер Timeline</h2>
                            <span className="text-sm text-gray-500">{measurements.length} өлшем</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : Object.keys(groupedMeasurements).length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center">
                                <Icon name="event_busy" size={40} className="text-gray-300" />
                                <p className="text-gray-500 mt-3">Өлшем жоқ</p>
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
                                                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                                                            >
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h3 className="font-bold text-gray-900">{measurement.clientName}</h3>
                                                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${statusColors[measurement.status]}`}>
                                                                                {statusLabels[measurement.status]}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <Icon name="schedule" size={14} />
                                                                            {formatTime24(measurement.scheduledAt)}
                                                                        </p>
                                                                    </div>
                                                                    {totalPrice > 0 && (
                                                                        <div className="text-right">
                                                                            <p className="text-lg font-black text-green-600">{totalPrice.toLocaleString()} ₸</p>
                                                                            <p className="text-[10px] text-gray-500">Болжалды құн</p>
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
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
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
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-4">Көрсеткіштер</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Аяқталу жылдамдығы</span>
                                        <span className="font-bold text-gray-900">
                                            {stats.totalMeasurements > 0
                                                ? ((stats.completedMeasurements / stats.totalMeasurements) * 100).toFixed(0)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                                            style={{ width: `${stats.totalMeasurements > 0 ? (stats.completedMeasurements / stats.totalMeasurements) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Орташа өлшем құны</span>
                                        <span className="font-bold text-gray-900">
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
                                period={t('common.month')}
                                icon="design_services"
                                loading={analyticsLoading}
                            />
                            <KPICard
                                title={t('dashboard.sections.managersKpi')}
                                value={analytics.teamKPIs?.managers?.closedDeals || deals.filter(d => d.status === 'completed').length}
                                target={analytics.teamKPIs?.managers?.target || 30}
                                unit={t('dashboard.stats.dealUnit')}
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
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Тиімділік көрсеткіштері</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Орташа өлшем уақыты</span>
                                    <span className="font-bold text-gray-900">2.5 сағат</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Конверсия өлшем → мәміле</span>
                                    <span className="font-bold text-green-600">68%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Орташа чек</span>
                                    <span className="font-bold text-gray-900">450,000 ₸</span>
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
                            data={analytics.monthlyTrends || monthShort(undefined).slice(0, 6).map((label, i) => ({
                                label,
                                value: [3200000, 3500000, 4100000, 3800000, 4500000, 5200000][i],
                            }))}
                            height={200}
                            valueFormat="currency"
                            loading={analyticsLoading}
                        />

                        {/* Top Products */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Топ сатылымдар</h3>
                            <div className="space-y-3">
                                {['Blackout Royal', 'Tюль Crystal', 'Карниз Premium', 'Жалюзи Wood'].map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                                            <div>
                                                <p className="font-bold text-gray-900">{product}</p>
                                                <p className="text-xs text-gray-500">15 сатылым</p>
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
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icon name="location_on" className="text-primary" />
                                География бойынша
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary"></div>
                                        <span className="text-sm text-gray-700">Алматы</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">65%</span>
                                        <span className="text-xs text-gray-500">(98 клиент)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-gray-700">Астана</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">25%</span>
                                        <span className="text-xs text-gray-500">(38 клиент)</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full bg-primary-light"></div>
                                        <span className="text-sm text-gray-700">Басқа</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">10%</span>
                                        <span className="text-xs text-gray-500">(14 клиент)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <BottomNav />
        </div>
    );
};

export default AdminDashboard;
