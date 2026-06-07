import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, measurementsAPI, ordersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import Icon from '../components/common/Icon';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t, lang } = useI18n();
    const fmt = (n) => (n || 0).toLocaleString(lang === 'kz' ? 'kk-KZ' : 'ru-RU');
    const [activeTab, setActiveTab] = useState('measurements');
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [deals, setDeals] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        loadClientData();
    }, [id]);

    const loadClientData = async () => {
        try {
            setLoading(true);
            const [clientRes, measurementsRes, dealsRes] = await Promise.all([
                clientsAPI.getById(id),
                measurementsAPI.getAll({ clientId: id }),
                ordersAPI.getAll({ clientId: id })
            ]);

            if (clientRes.data.success) {
                setClient(clientRes.data.data);
                const c = clientRes.data.data;
                setEditForm({ name: c.name || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '' });
            }
            if (measurementsRes.data.success) setMeasurements(measurementsRes.data.data);
            if (dealsRes.data.success) setDeals(dealsRes.data.data);

        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async () => {
        if (!editForm.name.trim()) return;
        setSaving(true);
        try {
            const res = await clientsAPI.update(id, editForm);
            if (res.data.success) {
                setClient(res.data.data);
                setShowEditModal(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClient = async () => {
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await clientsAPI.delete(id);
            if (res.data?.success) {
                navigate(user?.role === 'admin' ? '/admin/clients' : '/manager/clients');
            } else {
                setDeleteError(res.data?.error || t('clients.detail.deleteError', 'Клиентті жою мүмкін болмады'));
            }
        } catch (e) {
            // Backend blocks deletion when the client has linked deals/measurements.
            setDeleteError(
                e.response?.data?.error ||
                t('clients.detail.deleteErrorLinked', 'Жою мүмкін емес. Клиентте мәмілелер немесе өлшеулер бар болуы мүмкін.')
            );
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        const cls = {
            scheduled: 'bg-primary/15 text-primary',
            in_progress: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            proposal_sent: 'bg-primary/10 text-primary-dark',
            contract_signed: 'bg-primary/15 text-primary-dark',
        }[status] || 'bg-muted text-foreground';
        const label = t(`orders.status.${status}`, t(`orders.funnel.statusLabels.${status}`, status));
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light p-4">
                <SkeletonCard />
                <div className="mt-8 space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (!client) return (
        <div className="min-h-screen flex items-center justify-center">
            <p>{t('common.notFound')}</p>
        </div>
    );

    return (
        <div className="bg-background-light min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted">
                            <Icon name="arrow_back" />
                        </button>
                        <h1 className="text-xl font-bold line-clamp-1">{client.name}</h1>
                    </div>
                    <button onClick={() => setShowEditModal(true)} className="p-2 rounded-full hover:bg-muted">
                        <Icon name="edit" />
                    </button>
                </div>
            </header>

            <main className="p-4 max-w-6xl mx-auto lg:grid lg:grid-cols-[320px_1fr] lg:gap-6 lg:items-start">
                {/* Client Info Card */}
                <div className="bg-card rounded-2xl p-5 shadow-sm border border-border mb-6 lg:mb-0 lg:sticky lg:top-20">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="person" className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{client.name}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">{client.address || t('orders.card.unknownAddress')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                            <a href={`tel:${client.phone}`} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-muted hover:bg-muted transition-colors">
                                <Icon name="call" size={20} className="text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">{lang === 'kz' ? 'Қоңырау' : 'Звонок'}</span>
                            </a>
                            {client.whatsapp && (
                                <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                                    <Icon name="chat" size={20} className="text-green-600" />
                                    <span className="text-sm font-semibold text-green-700">WhatsApp</span>
                                </a>
                            )}
                        </div>

                        <button
                            onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                            className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold border border-red-100"
                        >
                            <Icon name="delete" size={18} />
                            {t('clients.detail.deleteClient', 'Клиентті жою')}
                        </button>
                    </div>
                </div>

                {/* Right column: tabs + list */}
                <div>
                {/* Tabs */}
                <div className="flex p-1 bg-muted rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('measurements')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'measurements' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('clients.detail.measurements')}
                    </button>
                    <button
                        onClick={() => setActiveTab('deals')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'deals' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('clients.detail.deals')}
                    </button>
                </div>

                {/* List Content */}
                <div className="space-y-3">
                    {activeTab === 'measurements' ? (
                        measurements.length > 0 ? (
                            measurements.map(m => (
                                <div key={m.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-foreground">
                                            {new Date(m.scheduledAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                                        </span>
                                        {getStatusBadge(m.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{m.address}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('clients.detail.noMeasurements')}
                            </div>
                        )
                    ) : (
                        deals.length > 0 ? (
                            deals.map(d => (
                                <div key={d.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-foreground">
                                            #{d.id.slice(0, 8)}
                                        </span>
                                        {getStatusBadge(d.status)}
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-muted-foreground">{t('orders.card.amount')}:</span>
                                        <span className="font-semibold">{fmt(d.totalAmount?.amount)} ₸</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('clients.detail.noDeals')}
                            </div>
                        )
                    )}
                </div>
                </div>
            </main>

            <BottomNav />

            {/* Edit Client Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-5">{t('clients.create.titleEdit')}</h3>
                        <div className="space-y-4">
                            {[
                                { label: `${t('clients.create.fieldName')} *`, key: 'name', placeholder: t('clients.create.fieldNamePlaceholder') },
                                { label: t('clients.create.fieldPhone'), key: 'phone', placeholder: t('clients.create.fieldPhonePlaceholder') },
                                { label: t('clients.create.fieldAddress'), key: 'address', placeholder: t('clients.create.fieldAddressPlaceholder') },
                                { label: t('clients.create.fieldNote'), key: 'notes', placeholder: t('clients.create.fieldNotePlaceholder') },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-semibold text-foreground mb-1.5">{f.label}</label>
                                    <input
                                        type="text"
                                        value={editForm[f.key]}
                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full px-4 py-3 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleSaveClient} disabled={saving || !editForm.name.trim()} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50">
                                {saving ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Client Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setShowDeleteConfirm(false)}>
                    <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <Icon name="delete" size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('clients.detail.deleteClient', 'Клиентті жою')}</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                <span className="font-semibold">{client?.name}</span> {t('clients.detail.deleteConfirm', 'клиентін жойғыңыз келе ме? Бұл әрекетті болдырмау мүмкін емес.')}
                            </p>
                            {deleteError && (
                                <p className="text-red-500 text-sm font-medium mb-4 bg-red-50 rounded-lg p-2">{deleteError}</p>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl disabled:opacity-50">
                                    {t('common.cancel', 'Болдырмау')}
                                </button>
                                <button onClick={handleDeleteClient} disabled={deleting} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                                    {deleting ? t('clients.detail.deleting', 'Жойылуда...') : t('clients.detail.delete', 'Жою')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
