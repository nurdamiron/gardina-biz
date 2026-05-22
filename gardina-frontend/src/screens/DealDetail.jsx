import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, measurementsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/statusLabels';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import { formatTime24, monthNames, weekdayNames } from '../utils/dateUtils';
import AuditLog from '../components/AuditLog/AuditLog';
import Icon from '../components/common/Icon';

const DealDetail = () => {
    const { t, lang } = useI18n();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState(null);
    const [measurement, setMeasurement] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadDeal();
    }, [id]);

    const loadDeal = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getById(id);
            if (response.data.success) {
                const dealData = response.data.data;
                setDeal(dealData);

                // Load measurement data if measurementId exists
                if (dealData.measurementId) {
                    try {
                        const measurementRes = await measurementsAPI.getById(dealData.measurementId);
                        if (measurementRes.data.success) {
                            setMeasurement(measurementRes.data.data);
                        }
                    } catch (err) {
                    }
                }

                // Also try to load measurement by matching clientId and designerId
                if (!dealData.measurementId && dealData.clientId && dealData.designerId) {
                    try {
                        const measurementsRes = await measurementsAPI.getAll({
                            clientId: dealData.clientId,
                            designerId: dealData.designerId,
                            limit: 1
                        });
                        if (measurementsRes.data.success && measurementsRes.data.data && measurementsRes.data.data.length > 0) {
                            const measurementData = measurementsRes.data.data[0];
                            setMeasurement(measurementData);
                        }
                    } catch (err) {
                    }
                }
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'lead': 'bg-primary/10 text-primary-dark border border-primary/25',
            'proposal_sent': 'bg-primary/10 text-primary border border-primary/25',
            'proposal_accepted': 'bg-primary/5 text-primary-dark border border-primary/20',
            'contract_signed': 'bg-primary/5 text-primary-light border border-primary/20',
            'payment_pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
            'production': 'bg-orange-50 text-orange-700 border border-orange-200',
            'completed': 'bg-green-50 text-green-700 border border-green-200',
            'cancelled': 'bg-red-50 text-red-700 border border-red-200'
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border border-gray-200';
    };

    const getStatusLabel = (status) => STATUS_LABELS[status] || status;

    const getPaymentStatusLabel = (status) => t(`orders.payment.${status}`, status);

    const getPaymentStatusColor = (status) => {
        const colors = {
            'pending': 'bg-gray-50 text-gray-700',
            'partial': 'bg-amber-50 text-amber-700',
            'paid': 'bg-emerald-50 text-emerald-700',
            'refunded': 'bg-rose-50 text-rose-700'
        };
        return colors[status] || 'bg-gray-50 text-gray-700';
    };

    const formatScheduledDate = (dateString) => {
        if (!dateString) return null;

        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const scheduledDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let dayLabel = '';
        let dayColor = 'text-gray-900';

        const months = monthNames(lang);
        const weekdays = weekdayNames(lang);
        const labels = {
            today: lang === 'kz' ? 'Бүгін' : 'Сегодня',
            tomorrow: lang === 'kz' ? 'Ертең' : 'Завтра',
            yesterday: lang === 'kz' ? 'Кеше' : 'Вчера',
        };

        if (scheduledDate.getTime() === today.getTime()) {
            dayLabel = labels.today;
            dayColor = 'text-green-600';
        } else if (scheduledDate.getTime() === tomorrow.getTime()) {
            dayLabel = labels.tomorrow;
            dayColor = 'text-primary';
        } else if (scheduledDate.getTime() === yesterday.getTime()) {
            dayLabel = labels.yesterday;
            dayColor = 'text-gray-500';
        } else if (scheduledDate > today) {
            const daysUntil = Math.ceil((scheduledDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
                dayLabel = weekdays[scheduledDate.getDay()];
                dayColor = 'text-primary';
            } else {
                dayLabel = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]}`;
                dayColor = 'text-gray-900';
            }
        } else {
            dayLabel = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]}`;
            dayColor = 'text-gray-500';
        }

        const time = formatTime24(dateString);
        const fullDateKazakh = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]} ${scheduledDate.getFullYear()}`;

        return { dayLabel, time, dayColor, fullDate: date, fullDateKazakh };
    };

    const getNextStatusAction = (status) => {
        const statusFlow = {
            'lead': {
                nextStatus: 'proposal_sent',
                label: 'Бастау',
                icon: 'play_arrow',
                color: 'bg-primary hover:brightness-110'
            },
            'proposal_sent': {
                nextStatus: 'proposal_accepted',
                label: 'Ұсыныс қабылданды',
                icon: 'check_circle',
                color: 'bg-primary hover:brightness-110'
            },
            'proposal_accepted': {
                nextStatus: 'contract_signed',
                label: 'Келісім-шарт жасау',
                icon: 'contract_edit',
                color: 'bg-primary-light hover:brightness-110'
            },
            'contract_signed': {
                nextStatus: 'production',
                label: 'Өндіріске жіберу',
                icon: 'precision_manufacturing',
                color: 'bg-orange-600 hover:bg-orange-700'
            },
            'production': {
                nextStatus: 'completed',
                label: 'Аяқтау',
                icon: 'done_all',
                color: 'bg-green-600 hover:bg-green-700'
            },
            'completed': null,
            'cancelled': null
        };

        return statusFlow[status] || null;
    };

    const openStatusModal = (newStatus) => {
        setPendingStatus(newStatus);
        setShowStatusModal(true);
        setStatusError(null);
    };

    const handleStatusChange = async () => {
        try {
            const response = await ordersAPI.updateStatus(deal.id, pendingStatus);
            if (response.data.success) {
                setDeal(response.data.data);
                setShowStatusModal(false);
                setPendingStatus(null);
            }
        } catch (error) {
            setStatusError('Статусты өзгерту кезінде қате пайда болды');
        }
    };

    const handleEdit = () => {
        // Navigate to measurement details if available
        if (measurement?.id) {
            navigate(`/manager/measurements/${measurement.id}`);
        } else {
            // Otherwise navigate to deals edit page (TODO: create edit page)
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await ordersAPI.delete(deal.id);
            setDeleting(false);
            setShowDeleteModal(false);
            navigate(user?.role === 'admin' ? '/admin/orders' : '/manager/orders');
        } catch (error) {
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-4"><SkeletonCard /><SkeletonCard /></div>;
    if (!deal) return <div className="flex justify-center p-8 text-gray-400">Тапсырыс табылмады</div>;

    const total = deal.totalAmount || 0;
    const prepayment = deal.prepayment || 0;
    const finalPayment = deal.finalPayment || 0;
    const paid = prepayment + finalPayment;
    const remaining = total - paid;
    const progress = total > 0 ? (paid / total) * 100 : 0;

    return (
        <div className="bg-background-light min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <Icon name="arrow_back" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">Тапсырыс #{deal.id.slice(0, 8)}</h1>
                        <p className="text-xs text-gray-500">{new Date(deal.createdAt).toLocaleDateString('kk-KZ')} бастап</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(deal.status)}`}>
                        {getStatusLabel(deal.status)}
                    </span>
                </div>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Amount Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm opacity-90 font-medium">Жалпы сома</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(deal.paymentStatus)}`}>
                            {getPaymentStatusLabel(deal.paymentStatus)}
                        </span>
                    </div>
                    <div className="mb-4">
                        <span className="text-4xl font-bold">
                            {total.toLocaleString()} ₸
                        </span>
                    </div>

                    {total > 0 && (
                        <>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="opacity-75 text-xs mb-1">Төленді</p>
                                    <p className="font-bold">{paid.toLocaleString()} ₸</p>
                                </div>
                                <div>
                                    <p className="opacity-75 text-xs mb-1">Қалды</p>
                                    <p className="font-bold">{remaining.toLocaleString()} ₸</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Info cards — 2-col on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Client Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                        <Icon name="person" className="text-primary" />
                        Клиент туралы мәлімет
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Аты-жөні</p>
                            <p className="font-bold text-gray-900">{deal.client?.name || '---'}</p>
                        </div>

                        {deal.client?.phone && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Телефон</p>
                                <a
                                    href={`tel:${deal.client.phone}`}
                                    className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors w-fit"
                                >
                                    <Icon name="call" size={18} />
                                    {deal.client.phone}
                                </a>
                            </div>
                        )}

                        <div>
                            <p className="text-xs text-gray-500 mb-1">Мекенжай</p>
                            {(measurement?.address || deal.client?.address) ? (
                                <>
                                    <p className="text-sm text-gray-700 flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                                        <Icon name="location_on" size={18} className="text-gray-400" />
                                        <span>{measurement?.address || deal.client?.address}</span>
                                    </p>

                                    {/* 2GIS Map Button - show if measurement has mapLink */}
                                    {measurement?.mapLink && (
                                        <a
                                            href={measurement.mapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/15 transition-colors border border-primary/25"
                                        >
                                            <Icon name="map" size={20} />
                                            2GIS картада көру
                                        </a>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Мекенжай көрсетілмеген</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Designer Info */}
                {deal.designer?.name && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <Icon name="design_services" className="text-primary" />
                            Дизайнер
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                                {deal.designer.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{deal.designer.name}</p>
                                {deal.designerCommission > 0 && (
                                    <p className="text-xs text-gray-500">Комиссия: {deal.designerCommission.toLocaleString()} ₸</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details */}
                {(prepayment > 0 || finalPayment > 0) && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <Icon name="payments" className="text-primary" />
                            Төлем мәліметтері
                        </h3>
                        <div className="space-y-3">
                            {prepayment > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Алдын ала төлем</span>
                                    <span className="font-bold text-gray-900">{prepayment.toLocaleString()} ₸</span>
                                </div>
                            )}
                            {finalPayment > 0 && (
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Соңғы төлем</span>
                                    <span className="font-bold text-gray-900">{finalPayment.toLocaleString()} ₸</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Measurement Info */}
                {measurement && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900">
                            <Icon name="straighten" className="text-primary" />
                            Өлшем туралы
                        </h3>
                        <div className="space-y-3">
                            {measurement.roomType && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm text-gray-600">Бөлме</span>
                                    <span className="font-semibold text-gray-900">{measurement.roomType}</span>
                                </div>
                            )}
                            {measurement.scheduledAt && (() => {
                                const scheduled = formatScheduledDate(measurement.scheduledAt);
                                return scheduled ? (
                                    <div className="py-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-4 border border-primary/15">
                                        <p className="text-xs text-gray-600 mb-2 font-medium">Жоспарланған уақыт</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-white flex items-center justify-center">
                                                    <Icon name="event" className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-base ${scheduled.dayColor}`}>
                                                        {scheduled.dayLabel}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {scheduled.fullDateKazakh}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-primary/25">
                                                    <Icon name="schedule" size={16} className="text-primary" />
                                                    <span className="font-bold text-primary-dark">{scheduled.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                            {measurement.notes && (
                                <div className="pt-2">
                                    <p className="text-xs text-gray-600 mb-2 font-medium">Ескертпе</p>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{measurement.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Deadline */}
                {deal.deadline && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <Icon name="schedule" size={24} className="text-amber-600" />
                            <div>
                                <p className="text-xs text-amber-700 font-medium">Мерзімі</p>
                                <p className="font-bold text-amber-900">
                                    {new Date(deal.deadline).toLocaleDateString('kk-KZ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                </div>{/* end info grid */}

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    {/* Next Status Button */}
                    {(() => {
                        const nextAction = getNextStatusAction(deal.status);
                        return nextAction ? (
                            <button
                                onClick={() => openStatusModal(nextAction.nextStatus)}
                                className={`w-full ${nextAction.color} text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2`}
                            >
                                <Icon name={nextAction.icon} size={22} />
                                {nextAction.label}
                            </button>
                        ) : deal.status === 'completed' ? (
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-center gap-2">
                                <Icon name="check_circle" size={24} className="text-green-600" />
                                <span className="font-bold text-green-700">Тапсырыс аяқталды</span>
                            </div>
                        ) : null;
                    })()}

                    {/* Additional Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        {measurement && (
                        <button
                            onClick={handleEdit}
                            className="bg-white text-gray-700 border-2 border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Icon name="straighten" />
                            Өлшем деталі
                        </button>
                        )}
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-white text-red-600 border-2 border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Icon name="delete" />
                            Жою
                        </button>
                    </div>
                </div>

                {/* Audit Log Section */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-4">
                  <AuditLog entityType="Deal" entityId={deal.id} />
                </div>
            </main>

            <BottomNav />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-red-50 flex items-center justify-center">
                                    <Icon name="delete_forever" size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Тапсырысты жою</h3>
                                    <p className="text-xs text-gray-500">Бұл әрекетті болдырмау мүмкін емес</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                <p className="text-sm text-red-800 font-medium text-center">
                                    Тапсырыс #{deal.id.slice(0, 8)} толығымен жойылады. Растайсыз ба?
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    Болдырмау
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Жойылуда...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="delete" size={20} />
                                            Жою
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon name="swap_horiz" size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Статусты өзгерту</h3>
                                    <p className="text-xs text-gray-500">Тапсырыс статусын жаңарту</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600">Ағымдағы статус:</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(deal.status)}`}>
                                        {getStatusLabel(deal.status)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-center my-2">
                                    <Icon name="arrow_downward" className="text-gray-400" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Жаңа статус:</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(pendingStatus)}`}>
                                        {getStatusLabel(pendingStatus)}
                                    </span>
                                </div>
                            </div>

                            {statusError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                                    <p className="text-sm text-red-700 font-medium">{statusError}</p>
                                </div>
                            )}

                            <p className="text-sm text-gray-600 text-center mb-6">
                                Статусты өзгертуге сенімдісіз бе?
                            </p>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        setPendingStatus(null);
                                        setStatusError(null);
                                    }}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Болдырмау
                                </button>
                                <button
                                    onClick={handleStatusChange}
                                    className="px-4 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                                >
                                    Растау
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealDetail;
