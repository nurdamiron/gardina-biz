import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, usersAPI, measurementsAPI } from '../services/api';
import BottomNav from '../components/navigation/BottomNav';
import OrderDetailModal from '../components/admin/OrderDetailModal';
import { SkeletonCard } from '../components/common/Skeleton';
import { formatTime24, formatDateKZ, formatDateTimeFull } from '../utils/dateUtils';
import { getStatusLabel, getStatusColor } from '../utils/statusLabels';
import Icon from '../components/common/Icon';

// Helper: Calculate time until scheduled measurement
const getTimeUntil = (scheduledAt) => {
    if (!scheduledAt) return null;

    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return { label: 'Өткен', color: 'text-red-600', isPast: true };
    if (diffHours < 1) return { label: '< 1 сағат', color: 'text-red-600', isPast: false };
    if (diffHours < 3) return { label: `${diffHours} сағатта`, color: 'text-orange-600', isPast: false };
    if (diffDays < 1) return { label: 'Бүгін', color: 'text-green-600', isPast: false };
    if (diffDays === 1) return { label: 'Ертең', color: 'text-primary', isPast: false };
    if (diffDays < 7) return { label: `${diffDays} күнде`, color: 'text-gray-600', isPast: false };

    return { label: formatDateKZ(scheduledAt), color: 'text-gray-500', isPast: false };
};

// Helper: Get order progress based on simplified status
const getOrderProgress = (status) => {
    const stages = {
        'scheduled': { step: 1, total: 6, label: 'Жаңа', icon: 'event', color: 'blue' },
        'measured': { step: 2, total: 6, label: 'Өлшем аяқталды', icon: 'straighten', color: 'purple' },
        'in_production': { step: 3, total: 6, label: 'Өндірісте', icon: 'factory', color: 'orange' },
        'ready': { step: 4, total: 6, label: 'Дайын', icon: 'check_circle', color: 'green' },
        'installing': { step: 5, total: 6, label: 'Орнатылуда', icon: 'construction', color: 'lime' },
        'completed': { step: 6, total: 6, label: 'Аяқталды', icon: 'task_alt', color: 'green' },
        'cancelled': { step: 0, total: 6, label: 'Болдырылды', icon: 'cancel', color: 'red' },
        'rejected': { step: 0, total: 6, label: 'Бас тартты', icon: 'block', color: 'gray' }
    };
    return stages[status] || { step: 1, total: 6, label: status, icon: 'help', color: 'gray' };
};

const OrdersList = ({ filterByManager = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // State
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [designers, setDesigners] = useState([]);
    const [measurements, setMeasurements] = useState({});

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [designerFilter, setDesignerFilter] = useState('all');

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, filterByManager]);

    const loadData = async () => {
        try {
            setLoading(true);
            const baseFilters = filterByManager ? { managerId: user?.id } : {};
            const [dealsRes, designersRes, measurementsRes] = await Promise.all([
                ordersAPI.getAll(baseFilters),
                usersAPI.getDesigners(),
                measurementsAPI.getAll({ limit: 100 })
            ]);

            if (dealsRes.data.success) {
                setOrders(dealsRes.data.data);
            }
            if (designersRes.data.success) {
                setDesigners(designersRes.data.data);
            }
            if (measurementsRes.data.success) {
                // Create measurement map by clientId + designerId
                const measurementMap = {};
                const measurementList = Array.isArray(measurementsRes.data.data)
                    ? measurementsRes.data.data
                    : measurementsRes.data.data.measurements || [];

                measurementList.forEach(m => {
                    const key = `${m.clientId}_${m.designerId}`;
                    if (!measurementMap[key] || new Date(m.scheduledAt) > new Date(measurementMap[key].scheduledAt)) {
                        measurementMap[key] = m;
                    }
                });
                setMeasurements(measurementMap);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // Status colors with Tailwind classes (simplified)
    const getStatusColorClass = (status) => {
        const colors = {
            // New simplified statuses
            'scheduled': 'bg-primary/10 text-primary-dark border border-primary/25',
            'measured': 'bg-primary/5 text-primary-dark border border-primary/20',
            'in_production': 'bg-orange-50 text-orange-700 border border-orange-200',
            'ready': 'bg-green-50 text-green-700 border border-green-200',
            'installing': 'bg-lime-50 text-lime-700 border border-lime-200',
            'completed': 'bg-green-50 text-green-700 border border-green-200',
            'cancelled': 'bg-red-50 text-red-700 border border-red-200',

            // Legacy statuses (backward compatibility)
            'new': 'bg-primary/10 text-primary-dark border border-primary/25',
            'assigned': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
            'measuring': 'bg-primary/5 text-primary-dark border border-primary/20',
            'in_sewing': 'bg-orange-50 text-orange-700 border border-orange-200',
            'corrections': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
            'ready_to_install': 'bg-green-50 text-green-700 border border-green-200',
            'lead': 'bg-primary/10 text-primary-dark border border-primary/25',
            'proposal_sent': 'bg-primary/10 text-primary border border-primary/25',
            'proposal_accepted': 'bg-primary/5 text-primary-dark border border-primary/20',
            'contract_signed': 'bg-primary/5 text-primary-light border border-primary/20',
            'payment_pending': 'bg-yellow-50 text-yellow-700 border border-yellow-200',
            'production': 'bg-orange-50 text-orange-700 border border-orange-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-600 border border-gray-200';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            'pending': 'bg-gray-50 text-gray-700 border border-gray-200',
            'partial': 'bg-amber-50 text-amber-700 border border-amber-200',
            'paid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            'refunded': 'bg-rose-50 text-rose-700 border border-rose-200'
        };
        return colors[status] || 'bg-gray-50 text-gray-600 border border-gray-200';
    };

    const getPaymentLabel = (status) => {
        const labels = {
            'pending': 'Төленбеген',
            'partial': 'Жартылай төленді',
            'paid': 'Төленді',
            'refunded': 'Қайтарылды'
        };
        return labels[status] || status;
    };

    // Filter logic (для менеджера дизайнерский фильтр не нужен)
    const filteredOrders = orders.filter(order => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const designerMatch = filterByManager
            ? true
            : designerFilter === 'all' ||
              order.designerId === designerFilter ||
              order.designer?.id === designerFilter;
        return statusMatch && designerMatch;
    });

    return (
        <div className="bg-background-light min-h-screen flex flex-col pb-24">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Барлық тапсырыстар</h1>
                    <button
                        onClick={() => navigate(user?.role === 'admin' ? '/admin/order/new' : user?.role === 'sales' ? '/sales/order/new' : '/manager/order/new')}
                        className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Icon name="add_circle" size={20} />
                        Тапсырыс
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1.5 rounded-full whitespace-nowrap">
                        {filterByManager ? 'Менеджер режимі' : 'Админ режимі'}
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border-none text-gray-600 text-xs font-semibold rounded-full py-1.5 px-3 min-w-[120px]"
                    >
                        <option value="all">Барлық статус</option>
                        <option value="scheduled">Жаңа</option>
                        <option value="measured">Өлшем аяқталды</option>
                        <option value="in_production">Өндірісте</option>
                        <option value="ready">Дайын</option>
                        <option value="installing">Орнатылуда</option>
                        <option value="completed">Аяқталды</option>
                        <option value="cancelled">Болдырылды</option>
                        <option value="rejected">Бас тартты</option>
                    </select>

                    {!filterByManager && (
                        <select
                            value={designerFilter}
                            onChange={(e) => setDesignerFilter(e.target.value)}
                            className="bg-gray-50 border-none text-gray-600 text-xs font-semibold rounded-full py-1.5 px-3 min-w-[120px]"
                        >
                            <option value="all">Дизайнерлер</option>
                            {designers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 px-4 pt-4 flex flex-col gap-3">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map(order => {
                        const measurementKey = `${order.clientId}_${order.designerId}`;
                        const measurement = measurements[measurementKey];
                        const isPriorityHigh = measurement?.priority === 'high';
                        const progress = getOrderProgress(order.status);
                        const timeUntil = measurement?.scheduledAt ? getTimeUntil(measurement.scheduledAt) : null;

                        // Financial calculations
                        const totalAmount = order.totalAmount || 0;
                        const prepayment = order.prepayment || 0;
                        const remaining = totalAmount - prepayment;
                        const paymentProgress = totalAmount > 0 ? (prepayment / totalAmount) * 100 : 0;

                        return (
                            <div
                                key={order.id}
                                onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedMeasurement(measurement);
                                    setShowDetailModal(true);
                                }}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/25 transition-all cursor-pointer active:scale-[0.99]"
                            >
                                <div className="p-5 space-y-4">
                                    {/* Row 1: Client + Status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">#{order.id.slice(0, 6)}</span>
                                                {isPriorityHigh && (
                                                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-red-100">
                                                        <Icon name="local_fire_department" size={11} />
                                                        ШҰҒЫЛ
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                                {order.client?.name || 'Клиент'}
                                            </h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Icon name="location_on" size={14} className="text-gray-400" />
                                                <span className="line-clamp-1">{measurement?.address || order.client?.address || 'Мекенжай жоқ'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${getStatusColorClass(order.status)}`}>
                                                <Icon name={progress.icon} size={16} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">{progress.label}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                                                <Icon name="payments" size={12} />
                                                <span className="text-[10px] font-bold">{getPaymentLabel(order.paymentStatus || 'pending')}</span>
                                            </div>
                                            {timeUntil && (order.status === 'scheduled' || order.status === 'lead') && (
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${timeUntil.color} bg-gray-50/70`}>
                                                    <Icon name="alarm" size={12} />
                                                    <span className="text-[9px] font-bold">{timeUntil.label}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Date + Amounts */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                            <Icon name="event" size={18} className="text-primary" />
                                            <div className="text-sm">
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Күн</p>
                                                <p className="font-bold text-gray-900">
                                                    {measurement?.scheduledAt ? formatDateTimeFull(measurement.scheduledAt) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Сома</p>
                                                <p className="font-black text-gray-900 text-lg">{(order.totalAmount || 0).toLocaleString()} ₸</p>
                                            </div>
                                            {prepayment > 0 && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Алынды</span>
                                                    <span className="text-sm font-bold text-green-600">{prepayment.toLocaleString()} ₸</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Steps */}
                                    <div>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: progress.total }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                                        i < progress.step
                                                            ? progress.color === 'blue' ? 'bg-primary' :
                                                              progress.color === 'purple' ? 'bg-primary-light' :
                                                              progress.color === 'orange' ? 'bg-orange-500' :
                                                              progress.color === 'green' ? 'bg-green-500' :
                                                              progress.color === 'lime' ? 'bg-lime-500' :
                                                              'bg-gray-500'
                                                            : 'bg-gray-200'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Footer: Designer + Windows count */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {order.designer?.name?.[0] || '?'}
                                            </div>
                                        <div>
                                                <p className="text-[9px] text-gray-400 font-bold">Дизайнер</p>
                                                <p className="text-xs font-bold text-gray-700">{order.designer?.name || '---'}</p>
                                            </div>
                                        </div>
                                        {measurement?.windows?.length > 0 && (
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                                                <Icon name="window" size={16} className="text-gray-600" />
                                                <span className="text-xs font-bold text-gray-700">{measurement.windows.length} терезе</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Icon name="inbox" size={32} className="text-gray-300" />
                        </div>
                        <p className="font-medium">Тапсырыстар жоқ</p>
                        <button onClick={() => navigate(user?.role === 'admin' ? '/admin/order/new' : user?.role === 'sales' ? '/sales/order/new' : '/manager/order/new')} className="text-primary text-sm font-bold mt-2">
                            + Жаңа тапсырыс
                        </button>
                    </div>
                )}
            </main>

            {/* Order Detail Modal */}
            {showDetailModal && (
                <OrderDetailModal
                    order={selectedOrder}
                    measurement={selectedMeasurement}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedOrder(null);
                        setSelectedMeasurement(null);
                    }}
                />
            )}

            <BottomNav />
        </div>
    );
};

export default OrdersList;
