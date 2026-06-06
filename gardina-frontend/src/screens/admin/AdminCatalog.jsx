import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogAPI } from '../../services/api';
import { useUI } from '../../contexts/UIContext';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import { useI18n } from '../../contexts/I18nContext';

/**
 * Admin Catalog Page
 * Manage fabrics, curtains, and services
 */
const AdminCatalog = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { confirm, showToast } = useUI();
    const [activeTab, setActiveTab] = useState('fabrics');
    const [fabrics, setFabrics] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const categories = [
        { id: 'all', label: t('adminCatalog.categories.all', 'Все') },
        { id: 'curtain', label: t('adminCatalog.categories.curtain', 'Шторы') },
        { id: 'tulle', label: t('adminCatalog.categories.tulle', 'Тюль') },
        { id: 'cornice', label: t('adminCatalog.categories.cornice', 'Карниз') },
        { id: 'jalousie', label: t('adminCatalog.categories.jalousie', 'Жалюзи') },
        { id: 'accessory', label: t('adminCatalog.categories.accessory', 'Фурнитура') },
        { id: 'ready_made', label: t('adminCatalog.categories.ready_made', 'Готовые изделия') },
    ];

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'fabrics') {
                const res = await catalogAPI.searchFabrics('');
                setFabrics(res.data?.data || []);
            } else if (activeTab === 'services') {
                const res = await catalogAPI.getServices();
                setServices(res.data?.data || []);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (id, serviceName) => {
        const confirmed = await confirm({
            title: 'Қызметті жою',
            message: `"${serviceName}" қызметін жоюға сенімдісіз бе?\n\nБұл әрекетті қайтару мүмкін емес.`,
            confirmText: 'Иә, жою',
            cancelText: 'Жоқ',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            await catalogAPI.deleteService(id);
            setServices(prev => prev.filter(s => s.id !== id));
            showToast('Қызмет сәтті жойылды', 'success');
        } catch (error) {
            showToast('Қате орын алды', 'error');
        }
    };

    const tabs = [
        { id: 'fabrics', label: t('adminCatalog.tabs.products'), icon: 'inventory_2', count: fabrics.length },
        { id: 'services', label: t('adminCatalog.tabs.services'), icon: 'build', count: services.length },
    ];

    const filteredFabrics = fabrics.filter(f => {
        const matchesSearch =
            f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.brand?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === 'all' || f.type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="bg-background-light min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-foreground">{t('adminCatalog.title')}</h1>
                    <button
                        onClick={() => navigate(activeTab === 'fabrics' ? '/admin/catalog/products/new' : '/admin/catalog/services/new')}
                        className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
                    >
                        <Icon name="add" className="text-white" />
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-4 max-w-5xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-card text-muted-foreground border-2 border-border'
                                }`}
                        >
                            <Icon name={tab.icon} size={22} />
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-card/20' : 'bg-muted'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/70 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('adminCatalog.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-3 bg-surface-light border border-border-light rounded-xl focus:border-primary outline-none transition-all"
                    />
                </div>

                {/* Category Filters */}
                {activeTab === 'fabrics' && (
                    <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar -mx-4 px-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterType(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filterType === cat.id
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : activeTab === 'fabrics' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredFabrics.length === 0 ? (
                            <div className="bg-card rounded-xl p-8 text-center">
                                <Icon name="inventory_2" size={40} className="text-muted-foreground" />
                                <p className="text-muted-foreground mt-2">
                                    {searchQuery ? t('adminCatalog.empty.notFound') : t('adminCatalog.empty.catalogEmpty')}
                                </p>
                            </div>
                        ) : (
                            filteredFabrics.map(fabric => {
                                const price = Number(fabric.pricePerMeter) || 0;
                                const cost = Number(fabric.costPrice) || 0;
                                const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null;
                                const marginCls = margin == null ? '' : margin >= 40 ? 'bg-success-soft text-success' : margin >= 20 ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger';
                                const stock = Number(fabric.stockQuantity ?? fabric.stock_quantity);
                                const unitLabel = t(`adminCatalog.units.${fabric.unit || 'meter'}`);
                                return (
                                <Card
                                    key={fabric.id}
                                    onClick={() => navigate(`/admin/catalog/products/${fabric.id}`)}
                                >
                                    <div className="flex gap-3">
                                        {fabric.image_url ? (
                                            <div className="size-16 rounded-xl bg-muted bg-cover bg-center shrink-0 border border-border-light" style={{ backgroundImage: `url(${fabric.image_url})` }} />
                                        ) : (
                                            <div className="size-16 rounded-xl bg-background-light flex items-center justify-center shrink-0 border border-border-light">
                                                <Icon name="image" className="text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-text-main leading-tight truncate">{fabric.name}</p>
                                                    <p className="text-sm text-text-secondary truncate">{fabric.brand || '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-lg text-text-main whitespace-nowrap">{price.toLocaleString('ru-RU')} ₸</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{unitLabel}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 bg-background-light text-text-secondary text-xs rounded-full font-medium">
                                                    {t(`adminCatalog.categories.${fabric.type}`, fabric.type)}
                                                </span>
                                                {margin != null && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${marginCls}`}>
                                                        <Icon name="percent" size={11} /> {t('adminCatalog.card.margin', 'Маржа')} {margin}%
                                                    </span>
                                                )}
                                                {Number.isFinite(stock) && stock > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-info-soft text-info">
                                                        <Icon name="inventory_2" size={11} /> {stock} {unitLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {cost > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-secondary/80">
                                            <span>{t('adminCatalog.card.cost')}: {cost.toLocaleString('ru-RU')} ₸</span>
                                            {margin != null && <span>{t('adminCatalog.card.profit', 'Прибыль')}: {(price - cost).toLocaleString('ru-RU')} ₸/{unitLabel}</span>}
                                        </div>
                                    )}
                                </Card>
                                );
                            })
                        )}
                    </div>
                ) : activeTab === 'services' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {services.length === 0 ? (
                            <div className="bg-card rounded-xl p-8 text-center">
                                <Icon name="build" size={40} className="text-muted-foreground" />
                                <p className="text-muted-foreground mt-2">{t('adminCatalog.empty.servicesEmpty')}</p>
                            </div>
                        ) : (
                            services.map(service => (
                                <div key={service.id} className="bg-card rounded-xl p-4 shadow-sm group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground">{service.name}</p>
                                            <p className="text-sm text-muted-foreground">{service.description}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/15 text-primary-dark rounded text-xs font-medium">
                                                {service.serviceType} • {service.calcMethod}
                                            </span>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-bold text-lg text-primary">{service.baseRate?.toLocaleString()} ₸</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 pl-2 border-l border-border">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/catalog/services/${service.id}`);
                                                    }}
                                                    className="size-8 rounded-lg bg-muted text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                                                >
                                                    <Icon name="edit" size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteService(service.id, service.name);
                                                    }}
                                                    className="size-8 rounded-lg bg-muted text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                                                >
                                                    <Icon name="delete" size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : null}
            </main>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default AdminCatalog;
