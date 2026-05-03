import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsAPI, measurementsAPI, ordersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import Icon from '../components/common/Icon';

const ClientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('measurements');
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [deals, setDeals] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', notes: '' });
    const [saving, setSaving] = useState(false);

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'scheduled': return <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium">Жоспарланған</span>;
            case 'in_progress': return <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-medium">Орындалуда</span>;
            case 'completed': return <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium">Аяқталды</span>;
            case 'proposal_sent': return <span className="px-2 py-0.5 rounded bg-primary/10 text-primary-dark text-xs font-medium">Ұсыныс жіберілді</span>;
            case 'contract_signed': return <span className="px-2 py-0.5 rounded bg-primary/15 text-primary-dark text-xs font-medium">Келісім-шарт</span>;
            default: return <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs font-medium">{status}</span>;
        }
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
            <p>Клиент табылмады</p>
        </div>
    );

    return (
        <div className="bg-background-light min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm border-b">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-200">
                            <Icon name="arrow_back" />
                        </button>
                        <h1 className="text-xl font-bold line-clamp-1">{client.name}</h1>
                    </div>
                    <button onClick={() => setShowEditModal(true)} className="p-2 rounded-full hover:bg-gray-200">
                        <Icon name="edit" />
                    </button>
                </div>
            </header>

            <main className="p-4">
                {/* Client Info Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon name="person" className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{client.address || 'Мекенжайы көрсетілмеген'}</p>
                                {user?.role === 'admin' && client.created_by_name && (
                                    <p className="text-xs text-primary/70 mt-1 font-medium">Қосқан: {client.created_by_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                            <a href={`tel:${client.phone}`} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                <Icon name="call" size={20} className="text-gray-600" />
                                <span className="text-sm font-semibold text-gray-700">Қоңырау</span>
                            </a>
                            {client.whatsapp && (
                                <a href={`https://wa.me/${client.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                                    <Icon name="chat" size={20} className="text-green-600" />
                                    <span className="text-sm font-semibold text-green-700">WhatsApp</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('measurements')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'measurements' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Өлшемдер
                    </button>
                    <button
                        onClick={() => setActiveTab('deals')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${activeTab === 'deals' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Мәмілелер
                    </button>
                </div>

                {/* List Content */}
                <div className="space-y-3">
                    {activeTab === 'measurements' ? (
                        measurements.length > 0 ? (
                            measurements.map(m => (
                                <div key={m.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {new Date(m.scheduledAt).toLocaleDateString()}
                                        </span>
                                        {getStatusBadge(m.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{m.address}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                Өлшемдер жоқ
                            </div>
                        )
                    ) : (
                        deals.length > 0 ? (
                            deals.map(d => (
                                <div key={d.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            #{d.id.slice(0, 8)}
                                        </span>
                                        {getStatusBadge(d.status)}
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-2">
                                        <span className="text-gray-500">Бюджет:</span>
                                        <span className="font-semibold">{(d.totalAmount?.amount || 0).toLocaleString()} ₸</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                Мәмілелер жоқ
                            </div>
                        )
                    )}
                </div>
            </main>

            <BottomNav />

            {/* Edit Client Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-5">Клиентті өзгерту</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Аты-жөні *', key: 'name', placeholder: 'Клиент аты' },
                                { label: 'Телефон', key: 'phone', placeholder: '+7 (XXX) XXX-XX-XX' },
                                { label: 'Мекенжайы', key: 'address', placeholder: 'Мекенжайды енгізіңіз' },
                                { label: 'Ескерту', key: 'notes', placeholder: 'Қосымша ақпарат' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                                    <input
                                        type="text"
                                        value={editForm[f.key]}
                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">
                                Болдырмау
                            </button>
                            <button onClick={handleSaveClient} disabled={saving || !editForm.name.trim()} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50">
                                {saving ? 'Сақталуда...' : 'Сақтау'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
