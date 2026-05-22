import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogAPI } from '../../services/api';
import { useUI } from '../../contexts/UIContext';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
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
        { id: 'all', label: 'Барлығы' },
        { id: 'curtain', label: 'Перде' },
        { id: 'tulle', label: 'Тюль' },
        { id: 'cornice', label: 'Карниз' },
        { id: 'jalousie', label: 'Жалюзи' },
        { id: 'accessory', label: 'Фурнитура' },
        { id: 'ready_made', label: 'Дайын өнім' },
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
        <div className="bg-background-light min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">{t('adminCatalog.title')}</h1>
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
                                : 'bg-white text-gray-600 border-2 border-gray-100'
                                }`}
                        >
                            <Icon name={tab.icon} size={22} />
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Icon name="search" className="text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('adminCatalog.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-primary transition-all"
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
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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
                            <div className="bg-white rounded-xl p-8 text-center">
                                <Icon name="inventory_2" size={40} className="text-gray-300" />
                                <p className="text-gray-500 mt-2">
                                    {searchQuery ? t('adminCatalog.empty.notFound') : t('adminCatalog.empty.catalogEmpty')}
                                </p>
                            </div>
                        ) : (
                            filteredFabrics.map(fabric => (
                                <div
                                    key={fabric.id}
                                    onClick={() => navigate(`/admin/catalog/products/${fabric.id}`)}
                                    className="bg-white rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            {/* Thumbnail if exists */}
                                            {fabric.image_url ? (
                                                <div className="size-16 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 border border-gray-100" style={{ backgroundImage: `url(${fabric.image_url})` }} />
                                            ) : (
                                                <div className="size-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                                    <Icon name="image" className="text-gray-300" />
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{fabric.name}</p>
                                                <p className="text-sm text-gray-500">{fabric.brand || '—'}</p>
                                                <div className="flex gap-1 mt-1">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                                                        {t(`adminCatalog.categories.${fabric.type}`, fabric.type)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">{fabric.pricePerMeter?.toLocaleString()} ₸</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">
                                                {t(`adminCatalog.units.${fabric.unit || 'meter'}`)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">{t('adminCatalog.card.cost')}: {fabric.costPrice?.toLocaleString()} ₸</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'services' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {services.length === 0 ? (
                            <div className="bg-white rounded-xl p-8 text-center">
                                <Icon name="build" size={40} className="text-gray-300" />
                                <p className="text-gray-500 mt-2">{t('adminCatalog.empty.servicesEmpty')}</p>
                            </div>
                        ) : (
                            services.map(service => (
                                <div key={service.id} className="bg-white rounded-xl p-4 shadow-sm group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{service.name}</p>
                                            <p className="text-sm text-gray-500">{service.description}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/15 text-primary-dark rounded text-xs font-medium">
                                                {service.serviceType} • {service.calcMethod}
                                            </span>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-bold text-lg text-primary">{service.baseRate?.toLocaleString()} ₸</p>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/catalog/services/${service.id}`);
                                                    }}
                                                    className="size-8 rounded-lg bg-gray-50 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                                                >
                                                    <Icon name="edit" size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteService(service.id, service.name);
                                                    }}
                                                    className="size-8 rounded-lg bg-gray-50 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
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
