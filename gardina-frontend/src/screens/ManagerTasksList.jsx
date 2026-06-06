import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../contexts/I18nContext';
import { usersAPI } from '../services/api';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import Icon from '../components/common/Icon';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';

const ManagerTasksList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const { measurements, loadData } = useApp();

    const [loading, setLoading] = useState(false);
    const [designers, setDesigners] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [designerFilter, setDesignerFilter] = useState('all');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadData(), // Load all measurements
                loadDesigners()
            ]);
            setLoading(false);
        } catch (error) {
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

    // Filter logic
    const filteredMeasurements = measurements.filter(m => {
        const statusMatch = statusFilter === 'all' || m.status === statusFilter;
        const designerMatch = designerFilter === 'all' || m.designerId === designerFilter;
        return statusMatch && designerMatch;
    });

    const getStatusBadge = (status) => {
        const cls = {
            scheduled: 'bg-primary/15 text-primary',
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
        }[status] || 'bg-muted text-foreground';
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{t(`measurements.status.${status}`, status)}</span>;
    };

    return (
        <div className="bg-background-light min-h-screen flex flex-col pb-32">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-foreground">{t('tasks.list.title')}</h1>
                    <button
                        onClick={() => navigate('/manager/order/new')}
                        className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all shadow-sm active:scale-95"
                    >
                        <Icon name="add" size={18} />
                        {t('clients.list.add')}
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                    >
                        <option value="all">{t('orders.filters.allStatus')}</option>
                        <option value="scheduled">{t('measurements.status.scheduled')}</option>
                        <option value="in_progress">{t('measurements.status.in_progress')}</option>
                        <option value="completed">{t('measurements.status.completed')}</option>
                    </select>

                    <select
                        value={designerFilter}
                        onChange={(e) => setDesignerFilter(e.target.value)}
                        className="bg-card border border-border text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
                    >
                        <option value="all">{t('orders.filters.allDesigners')}</option>
                        {designers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-4 pt-4 max-w-7xl mx-auto w-full">
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                ) : filteredMeasurements.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredMeasurements.map(item => (
                            <Card
                                key={item.id}
                                onClick={() => navigate(`/manager/measurements/${item.id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-text-main">{item.clientName || t('orders.card.unknownClient')}</h3>
                                        <p className="text-xs text-muted-foreground">{item.clientPhone}</p>
                                    </div>
                                    {getStatusBadge(item.status)}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <Icon name="location_on" size={18} />
                                    <span className="line-clamp-1">{item.address}</span>
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-light">
                                    {(() => {
                                        const designerName = designers.find(d => d.id === item.designerId)?.name || item.designerName;
                                        return designerName ? (
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Avatar name={designerName} size="sm" />
                                                <span className="text-xs text-text-secondary truncate">{designerName}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="size-8 rounded-full border border-dashed border-border-light flex items-center justify-center shrink-0">
                                                    <Icon name="person" size={14} className="text-text-secondary/60" />
                                                </div>
                                                <span className="text-xs text-text-secondary/70">{t('tasks.card.unassigned', 'Не назначен')}</span>
                                            </div>
                                        );
                                    })()}
                                    <span className="text-xs font-medium text-text-secondary/70 shrink-0">
                                        {new Date(item.scheduledAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Icon name="inbox" size={48} />
                        <p>{t('tasks.list.empty')}</p>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default ManagerTasksList;
