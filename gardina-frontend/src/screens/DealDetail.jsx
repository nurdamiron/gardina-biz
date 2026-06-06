import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI, measurementsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { money } from '../utils/money';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import { formatTime24, formatDate, monthNames, weekdayNames } from '../utils/dateUtils';
import AuditLog from '../components/AuditLog/AuditLog';
import Icon from '../components/common/Icon';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';

// Payment status → semantic tone (pending/partial/paid/refunded)
const PAYMENT_TONE = { pending: 'neutral', partial: 'warning', paid: 'success', refunded: 'danger' };

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
        let dayColor = 'text-foreground';

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
            dayColor = 'text-muted-foreground';
        } else if (scheduledDate > today) {
            const daysUntil = Math.ceil((scheduledDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
                dayLabel = weekdays[scheduledDate.getDay()];
                dayColor = 'text-primary';
            } else {
                dayLabel = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]}`;
                dayColor = 'text-foreground';
            }
        } else {
            dayLabel = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]}`;
            dayColor = 'text-muted-foreground';
        }

        const time = formatTime24(dateString);
        const fullDateKazakh = `${scheduledDate.getDate()} ${months[scheduledDate.getMonth()]} ${scheduledDate.getFullYear()}`;

        return { dayLabel, time, dayColor, fullDate: date, fullDateKazakh };
    };

    // Next-step CTA per status. One brand-green action (no ad-hoc orange/green);
    // label localized via t() with the Kazakh original as fallback.
    const getNextStatusAction = (status) => {
        const statusFlow = {
            'lead':              { nextStatus: 'proposal_sent',     key: 'orders.statusFlow.start',          kz: 'Бастау',               icon: 'play_arrow' },
            'proposal_sent':     { nextStatus: 'proposal_accepted', key: 'orders.statusFlow.proposalAccept', kz: 'Ұсыныс қабылданды',    icon: 'check_circle' },
            'proposal_accepted': { nextStatus: 'contract_signed',   key: 'orders.statusFlow.signContract',   kz: 'Келісім-шарт жасау',   icon: 'contract_edit' },
            'contract_signed':   { nextStatus: 'production',        key: 'orders.statusFlow.toProduction',   kz: 'Өндіріске жіберу',     icon: 'precision_manufacturing' },
            'production':        { nextStatus: 'completed',         key: 'orders.statusFlow.complete',       kz: 'Аяқтау',               icon: 'done_all' },
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
            setStatusError(t('orders.statusModal.error', 'Статусты өзгерту кезінде қате пайда болды'));
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

    const backToList = () => navigate(user?.role === 'admin' ? '/admin/orders' : '/manager/orders');

    if (loading) return <div className="p-4 max-w-5xl mx-auto"><SkeletonCard /><SkeletonCard /></div>;
    if (!deal) return (
        <div className="bg-background-light min-h-screen pb-32">
            <header className="sticky top-0 z-20 bg-surface-light border-b border-border-light px-4 py-3">
                <button onClick={() => navigate(-1)} className="size-10 -ml-1 shrink-0 rounded-full bg-background-light hover:bg-border-light flex items-center justify-center" aria-label={t('common.back', 'Назад')}>
                    <Icon name="arrow_back" />
                </button>
            </header>
            <EmptyState
                icon="inventory_2"
                title={t('orders.detail.notFound', 'Заказ не найден')}
                subtitle={t('orders.detail.notFoundHint', 'Возможно, он был удалён или у вас нет доступа.')}
                actionLabel={t('orders.detail.backToList', 'К списку сделок')}
                actionIcon="arrow_back"
                onAction={backToList}
            />
            <BottomNav />
        </div>
    );

    const total = money(deal.totalAmount);
    const prepayment = money(deal.prepayment);
    const finalPayment = money(deal.finalPayment);
    const paid = prepayment + finalPayment;
    const remaining = total - paid;
    const progress = total > 0 ? (paid / total) * 100 : 0;
    // Derive the payment badge from the actual numbers so it can't contradict the
    // amount card (stale deal.paymentStatus showed "partial" while 100% was paid).
    const derivedPayment = total > 0
        ? (remaining <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending')
        : (deal.paymentStatus || 'pending');

    return (
        <div className="bg-background-light min-h-screen pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-surface-light border-b border-border-light px-4 py-3">
                <div className="flex items-center gap-3 max-w-5xl mx-auto">
                    <button onClick={() => navigate(-1)} className="size-10 -ml-1 shrink-0 rounded-full bg-background-light hover:bg-border-light flex items-center justify-center" aria-label={t('common.back', 'Назад')}>
                        <Icon name="arrow_back" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-text-main">{t('orders.detail.title', 'Заказ')} #{deal.id.slice(0, 8)}</h1>
                        <p className="text-xs text-text-secondary">{t('orders.detail.createdOn', 'Создан')} {formatDate(deal.createdAt, lang)}</p>
                    </div>
                    <StatusBadge status={deal.status} />
                </div>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Amount Card — flat surface, on-brand (no marketing gradient) */}
                <div className="bg-surface-light rounded-2xl p-6 border border-border-light shadow-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-text-secondary">{t('orders.detail.totalAmount', 'Общая сумма')}</span>
                        <StatusBadge
                            status={derivedPayment}
                            tone={PAYMENT_TONE[derivedPayment] || 'neutral'}
                            label={t(`orders.payment.${derivedPayment}`, derivedPayment)}
                        />
                    </div>
                    <div className="mb-5">
                        <span className="text-4xl font-bold text-text-main tracking-tight">
                            {total.toLocaleString('ru-RU')} ₸
                        </span>
                    </div>

                    {total > 0 && (
                        <>
                            <div className="h-2 bg-primary/15 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-text-secondary mb-1">{t('orders.detail.paid', 'Оплачено')}</p>
                                    <p className="font-bold text-text-main">{paid.toLocaleString('ru-RU')} ₸</p>
                                </div>
                                <div>
                                    <p className="text-xs text-text-secondary mb-1">{t('orders.detail.remaining', 'Остаток')}</p>
                                    <p className="font-bold text-text-main">{remaining.toLocaleString('ru-RU')} ₸</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Info cards — 2-col on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Client Info */}
                <div className="bg-surface-light rounded-2xl p-5 border border-border-light shadow-card">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-text-main">
                        <Icon name="person" className="text-primary" />
                        {t('orders.detail.clientInfo', 'Клиент туралы мәлімет')}
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-text-secondary mb-1">{t('orders.detail.fullName', 'Аты-жөні')}</p>
                            <p className="font-bold text-text-main">{deal.client?.name || '—'}</p>
                        </div>

                        {deal.client?.phone && (
                            <div>
                                <p className="text-xs text-text-secondary mb-1">{t('orders.detail.phone', 'Телефон')}</p>
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
                            <p className="text-xs text-text-secondary mb-1">{t('orders.detail.address', 'Мекенжай')}</p>
                            {(measurement?.address || deal.client?.address) ? (
                                <>
                                    <p className="text-sm text-text-main flex items-start gap-2 bg-background-light p-3 rounded-lg">
                                        <Icon name="location_on" size={18} className="text-text-secondary/70" />
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
                                            {t('orders.detail.viewOnMap', '2GIS картада көру')}
                                        </a>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-text-secondary">{t('orders.detail.noAddress', 'Мекенжай көрсетілмеген')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Designer Info */}
                {deal.designer?.name && (
                    <div className="bg-surface-light rounded-2xl p-5 border border-border-light shadow-card">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-text-main">
                            <Icon name="design_services" className="text-primary" />
                            {t('orders.card.designer', 'Дизайнер')}
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-lg">
                                {deal.designer.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-text-main">{deal.designer.name}</p>
                                {money(deal.designerCommission) > 0 && (
                                    <p className="text-xs text-text-secondary">{t('orders.detail.commission', 'Комиссия')}: {money(deal.designerCommission).toLocaleString('ru-RU')} ₸</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details */}
                {(prepayment > 0 || finalPayment > 0) && (
                    <div className="bg-surface-light rounded-2xl p-5 border border-border-light shadow-card">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-text-main">
                            <Icon name="payments" className="text-primary" />
                            {t('orders.detail.paymentDetails', 'Төлем мәліметтері')}
                        </h3>
                        <div className="space-y-3">
                            {prepayment > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-border-light">
                                    <span className="text-sm text-text-secondary">{t('orders.detail.prepayment', 'Алдын ала төлем')}</span>
                                    <span className="font-bold text-text-main">{prepayment.toLocaleString('ru-RU')} ₸</span>
                                </div>
                            )}
                            {finalPayment > 0 && (
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-text-secondary">{t('orders.detail.finalPayment', 'Соңғы төлем')}</span>
                                    <span className="font-bold text-text-main">{finalPayment.toLocaleString('ru-RU')} ₸</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Measurement Info */}
                {measurement && (
                    <div className="bg-surface-light rounded-2xl p-5 border border-border-light shadow-card">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-text-main">
                            <Icon name="straighten" className="text-primary" />
                            {t('orders.detail.measurement', 'Өлшем туралы')}
                        </h3>
                        <div className="space-y-3">
                            {measurement.roomType && (
                                <div className="flex justify-between items-center py-2 border-b border-border-light">
                                    <span className="text-sm text-text-secondary">{t('orders.detail.room', 'Бөлме')}</span>
                                    <span className="font-semibold text-text-main">{measurement.roomType}</span>
                                </div>
                            )}
                            {measurement.scheduledAt && (() => {
                                const scheduled = formatScheduledDate(measurement.scheduledAt);
                                return scheduled ? (
                                    <div className="py-3 bg-primary/5 rounded-xl px-4 border border-primary/15">
                                        <p className="text-xs text-text-secondary mb-2 font-medium">{t('orders.detail.scheduledTime', 'Жоспарланған уақыт')}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-card flex items-center justify-center">
                                                    <Icon name="event" className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className={`font-bold text-base ${scheduled.dayColor}`}>
                                                        {scheduled.dayLabel}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {scheduled.fullDateKazakh}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-lg border border-primary/25">
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
                                    <p className="text-xs text-text-secondary mb-2 font-medium">{t('orders.detail.note', 'Ескертпе')}</p>
                                    <p className="text-sm text-text-main bg-background-light p-3 rounded-lg leading-relaxed">{measurement.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Deadline */}
                {deal.deadline && (
                    <div className="bg-warning-soft border border-warning/20 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <Icon name="schedule" size={24} className="text-warning" />
                            <div>
                                <p className="text-xs text-warning font-medium">{t('orders.detail.deadline', 'Мерзімі')}</p>
                                <p className="font-bold text-text-main">
                                    {formatDate(deal.deadline, lang)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                </div>{/* end info grid */}

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    {/* Next Status Button — single brand-green CTA */}
                    {(() => {
                        const nextAction = getNextStatusAction(deal.status);
                        return nextAction ? (
                            <Button
                                size="lg"
                                fullWidth
                                onClick={() => openStatusModal(nextAction.nextStatus)}
                                icon={<Icon name={nextAction.icon} size={20} />}
                            >
                                {t(nextAction.key, nextAction.kz)}
                            </Button>
                        ) : deal.status === 'completed' ? (
                            <div className="bg-success-soft border border-success/25 rounded-xl p-4 flex items-center justify-center gap-2">
                                <Icon name="check_circle" size={22} className="text-success" />
                                <span className="font-bold text-success">{t('orders.detail.completed', 'Тапсырыс аяқталды')}</span>
                            </div>
                        ) : null;
                    })()}

                    {/* Secondary + destructive actions */}
                    <div className="flex items-center justify-between gap-3">
                        {measurement ? (
                            <Button variant="secondary" onClick={handleEdit} icon={<Icon name="straighten" size={18} />}>
                                {t('orders.detail.measurementDetails', 'Өлшем деталі')}
                            </Button>
                        ) : <span />}
                        <Button variant="danger" onClick={() => setShowDeleteModal(true)} icon={<Icon name="delete" size={18} />}>
                            {t('common.delete', 'Жою')}
                        </Button>
                    </div>
                </div>

                {/* Audit Log Section */}
                <div className="bg-surface-light rounded-2xl p-5 border border-border-light shadow-card mt-4">
                  <AuditLog entityType="Deal" entityId={deal.id} />
                </div>
            </main>

            <BottomNav />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-surface-light rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border-light">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-danger-soft flex items-center justify-center">
                                    <Icon name="delete_forever" size={24} className="text-danger" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">{t('orders.delete.title', 'Тапсырысты жою')}</h3>
                                    <p className="text-xs text-text-secondary">{t('orders.delete.subtitle', 'Бұл әрекетті болдырмау мүмкін емес')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="bg-danger-soft border border-danger/20 rounded-xl p-4 mb-4">
                                <p className="text-sm text-danger font-medium text-center">
                                    {t('orders.delete.confirmPrefix', 'Тапсырыс')} #{deal.id.slice(0, 8)} {t('orders.delete.confirmSuffix', 'толығымен жойылады. Растайсыз ба?')}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" fullWidth disabled={deleting} onClick={() => setShowDeleteModal(false)}>
                                    {t('common.cancel', 'Болдырмау')}
                                </Button>
                                <Button variant="dangerSolid" fullWidth loading={deleting} onClick={handleDelete} icon={<Icon name="delete" size={18} />}>
                                    {deleting ? t('orders.delete.deleting', 'Жойылуда...') : t('common.delete', 'Жою')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-surface-light rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border-light">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon name="swap_horiz" size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main">{t('orders.statusModal.title', 'Статусты өзгерту')}</h3>
                                    <p className="text-xs text-text-secondary">{t('orders.statusModal.subtitle', 'Тапсырыс статусын жаңарту')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="bg-background-light rounded-xl p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-text-secondary">{t('orders.statusModal.current', 'Ағымдағы статус')}</span>
                                    <StatusBadge status={deal.status} />
                                </div>
                                <div className="flex items-center justify-center my-2">
                                    <Icon name="arrow_downward" className="text-text-secondary/60" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary">{t('orders.statusModal.new', 'Жаңа статус')}</span>
                                    <StatusBadge status={pendingStatus} />
                                </div>
                            </div>

                            {statusError && (
                                <div className="bg-danger-soft border border-danger/20 rounded-xl p-3 mb-4">
                                    <p className="text-sm text-danger font-medium">{statusError}</p>
                                </div>
                            )}

                            <p className="text-sm text-text-secondary text-center mb-6">
                                {t('orders.statusModal.confirmText', 'Статусты өзгертуге сенімдісіз бе?')}
                            </p>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" fullWidth onClick={() => { setShowStatusModal(false); setPendingStatus(null); setStatusError(null); }}>
                                    {t('common.cancel', 'Болдырмау')}
                                </Button>
                                <Button fullWidth onClick={handleStatusChange}>
                                    {t('common.confirm', 'Растау')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealDetail;
