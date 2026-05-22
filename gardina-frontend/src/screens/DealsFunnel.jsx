import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import Icon from '../components/common/Icon';

const DealsFunnel = ({ filterByManager = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const fmt = (n) => (n || 0).toLocaleString(lang === 'kz' ? 'kk-KZ' : 'ru-RU');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [deals, setDeals] = useState([]);
    const [designers, setDesigners] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        designerId: ''
    });

    // Определяем показывать ли фильтры (для админа) или нет (для менеджера)
    const isAdmin = user?.role === 'admin';
    const showFilters = isAdmin && !filterByManager;

    useEffect(() => {
        loadData();
        if (showFilters) loadDesigners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Для менеджера загружаем список сделок, для админа - воронку
            if (filterByManager) {
                const response = await ordersAPI.getAll({ managerId: user?.id });
                if (response.data.success) {
                    setDeals(response.data.data || []);
                }
            } else {
                const response = await ordersAPI.getFunnel(filters);
            if (response.data.success) {
                setStats(response.data.data);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDesigners = async () => {
        try {
            const response = await usersAPI.getDesigners();
            if (response.data.success) {
                setDesigners(response.data.data);
            }
        } catch (error) {
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Funnel stages — labels translated
    const STAGES = [
        { id: 'proposal_sent', color: 'bg-primary' },
        { id: 'proposal_accepted', color: 'bg-primary/100' },
        { id: 'contract_signed', color: 'bg-primary-light' },
        { id: 'prepayment_received', color: 'bg-primary-light' },
        { id: 'in_production', color: 'bg-orange-500' },
        { id: 'ready_for_installation', color: 'bg-yellow-500' },
        { id: 'installation_scheduled', color: 'bg-lime-500' },
        { id: 'installed', color: 'bg-green-500' },
        { id: 'completed', color: 'bg-teal-600' },
    ].map((s) => ({ ...s, label: t(`orders.funnel.stages.${s.id}`, s.id) }));

    // Calculate maximum value for bar scaling
    const maxCount = Math.max(...stats.map(s => s.count), 1);
    const totalDeals = stats.reduce((sum, s) => sum + s.count, 0);
    const totalAmount = stats.reduce((sum, s) => sum + s.totalAmount, 0);

    const getStatForStage = (stageId) => {
        return stats.find(s => s.status === stageId) || { count: 0, totalAmount: 0 };
    };

    // Status colors only — labels through t()
    const STATUS_COLORS = {
        new: 'bg-primary',
        assigned: 'bg-primary/100',
        measuring: 'bg-primary-light',
        measurement_done: 'bg-primary-light',
        in_sewing: 'bg-orange-500',
        corrections: 'bg-yellow-500',
        ready_to_install: 'bg-lime-500',
        installing: 'bg-green-500',
        completed: 'bg-teal-600',
        cancelled: 'bg-red-500',
    };
    const getStatusInfo = (status) => ({
        label: t(`orders.funnel.statusLabels.${status}`, status),
        color: STATUS_COLORS[status] || 'bg-gray-500',
    });

    // Для Manager: показываем список сделок
    if (filterByManager) {
        return (
            <div className="bg-background-light min-h-screen pb-24">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold">{t('orders.funnel.myOrders')}</h1>
                    <p className="text-sm text-gray-500">{t('orders.funnel.countSuffix', { count: deals.length })}</p>
                </header>

                <main className="p-4 max-w-7xl mx-auto">
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : deals.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Icon name="inbox" size={28} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500">{t('orders.empty')}</p>
                            <button
                                onClick={() => navigate('/manager/order/new')}
                                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold"
                            >
                                {t('orders.funnel.create')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {deals.map((deal) => {
                            const statusInfo = getStatusInfo(deal.status);
                            return (
                                <div
                                    key={deal.id}
                                    onClick={() => navigate(`/manager/orders/${deal.id}`)}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold">{deal.clientName || t('orders.card.unknownClient')}</h3>
                                            <p className="text-sm text-gray-500">{deal.address || t('orders.card.unknownAddress')}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Icon name="person" size={16} />
                                            {deal.designerName || t('orders.card.designer')}
                                        </div>
                                        {deal.totalAmount > 0 && (
                                            <span className="font-bold text-green-600">{fmt(deal.totalAmount)} ₸</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    )}

                    {/* FAB для создания задачи */}
                    <button
                        onClick={() => navigate('/manager/order/new')}
                        className="fixed right-4 bottom-28 size-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
                    >
                        <Icon name="add" size={24} />
                    </button>
                </main>

                <BottomNav />
            </div>
        );
    }

    // Для Admin: показываем воронку
    return (
        <div className="bg-background-light min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-gray-50 flex items-center justify-center" aria-label={t('common.back')}>
                        <Icon name="arrow_back" className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold">{t('orders.funnel.title')}</h1>
                </div>

                {/* Filters - только для админа */}
                {showFilters && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <select
                        value={filters.designerId}
                        onChange={(e) => handleFilterChange('designerId', e.target.value)}
                        className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 min-w-[150px]"
                    >
                        <option value="">{t('orders.filters.allDesigners')}</option>
                        {designers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2"
                    />
                </div>
                )}
            </header>

            <main className="p-4 max-w-3xl mx-auto">
                {/* Summary Card */}
                <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-lg mb-6">
                    <p className="text-gray-400 text-sm mb-1">{t('orders.funnel.totalResult')}</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-bold">{fmt(totalAmount)} ₸</h2>
                            <p className="text-sm mt-1 text-gray-400">{t('orders.funnel.totalDeals', { count: totalDeals })}</p>
                        </div>
                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon name="monitoring" size={24} />
                        </div>
                    </div>
                </div>

                {/* Funnel Chart */}
                <div className="space-y-4">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        STAGES.map((stage) => {
                            const stat = getStatForStage(stage.id);
                            const percentage = totalDeals > 0 ? Math.round((stat.count / totalDeals) * 100) : 0;
                            const widthFormatted = Math.max((stat.count / maxCount) * 100, 5) + "%";

                            return (
                                <div key={stage.id} className="relative">
                                    <div className="flex justify-between items-end mb-1 px-1">
                                        <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                                        <span className="text-xs font-bold text-gray-900">{fmt(stat.totalAmount)} ₸</span>
                                    </div>

                                    <div className="h-10 bg-gray-100 rounded-lg overflow-hidden relative flex items-center">
                                        <div
                                            className={`h-full ${stage.color} opacity-20 absolute left-0 top-0`}
                                            style={{ width: widthFormatted }}
                                        ></div>
                                        <div
                                            className={`h-full ${stage.color} absolute left-0 top-0 w-1`}
                                        ></div>

                                        <div className="w-full flex justify-between items-center px-3 relative z-10">
                                            <span className="font-bold text-gray-800">{stat.count}</span>
                                            <span className="text-xs text-gray-500 font-medium">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default DealsFunnel;
