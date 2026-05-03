import React from 'react';
import { formatDateKZ, formatTime24, formatDateTimeFull } from '../../utils/dateUtils';
import Icon from '../common/Icon';

/**
 * Order Detail Modal for Admin
 * Shows complete order history, timeline, and all related data
 */
const OrderDetailModal = ({ order, measurement, onClose }) => {
  if (!order) return null;

  // Calculate totals from measurement windows
  const totalPrice = measurement?.windows?.reduce((sum, w) => {
    return sum + (w.priceBreakdown?.clientCheck?.total || 0);
  }, 0) || order.totalAmount?.amount || 0;

  // Build order timeline
  const getOrderTimeline = () => {
    const events = [];

    // Step 1: Order created & measurement scheduled
    if (order.createdAt) {
      events.push({
        icon: 'add_circle',
        color: 'bg-primary',
        label: 'Тапсырыс құрылды',
        date: order.createdAt,
        description: `Дизайнер тағайындалды: ${order.designer?.name || 'Белгісіз'}`,
        subdescription: measurement?.scheduledAt
          ? `Өлшемге келу уақыты: ${formatDateKZ(measurement.scheduledAt)} • ${formatTime24(measurement.scheduledAt)}`
          : null,
        timestamp: new Date(order.createdAt)
      });
    }

    // Step 2: Measurement started (when designer arrived)
    if (measurement?.startedAt) {
      events.push({
        icon: 'play_arrow',
        color: 'bg-primary/100',
        label: 'Өлшем басталды',
        date: measurement.startedAt,
        description: `Дизайнер келді және өлшеуді бастады`,
        timestamp: new Date(measurement.startedAt)
      });
    }

    // Step 3: Measurement completed
    if (order.status === 'measured' || order.status === 'in_production' || order.status === 'ready' || order.status === 'installing' || order.status === 'completed') {
      events.push({
        icon: 'check_circle',
        color: 'bg-primary-light',
        label: 'Өлшем аяқталды',
        date: measurement?.completedAt,
        description: `${measurement?.windows?.length || 0} терезе өлшенді`,
        showDate: false
      });
    }

    // Contract & Prepayment
    if (order.status === 'in_production' || order.status === 'ready' || order.status === 'installing' || order.status === 'completed') {
      events.push({
        icon: 'assignment',
        color: 'bg-green-500',
        label: 'Келісім-шарт және ДДС',
        date: order.contractSignedAt,
        description: `Алынды: ${(order.prepayment || 0).toLocaleString()} ₸`,
        showDate: false
      });
    }

    // Production
    if (order.status === 'in_production' || order.status === 'ready' || order.status === 'installing' || order.status === 'completed') {
      events.push({
        icon: 'factory',
        color: 'bg-orange-500',
        label: 'Өндірісте',
        date: null,
        description: 'Тігу процесінде',
        showDate: false
      });
    }

    // Ready for installation
    if (order.status === 'ready' || order.status === 'installing' || order.status === 'completed') {
      events.push({
        icon: 'check_circle',
        color: 'bg-green-500',
        label: 'Орнатуға дайын',
        date: null,
        description: 'Тапсырыс дайын',
        showDate: false
      });
    }

    // Installing
    if (order.status === 'installing' || order.status === 'completed') {
      events.push({
        icon: 'construction',
        color: 'bg-lime-500',
        label: 'Орнатылуда',
        date: null,
        description: 'Орнату процесі',
        showDate: false
      });
    }

    // Completed
    if (order.status === 'completed') {
      events.push({
        icon: 'task_alt',
        color: 'bg-green-600',
        label: 'Тапсырыс аяқталды',
        date: null,
        description: 'Толығымен аяқталды',
        showDate: false
      });
    }

    // Rejected
    if (order.status === 'rejected') {
      events.push({
        icon: 'block',
        color: 'bg-gray-500',
        label: 'Клиент бас тартты',
        date: null,
        description: 'Келісімге келмеді',
        showDate: false
      });
    }

    // Cancelled
    if (order.status === 'cancelled') {
      events.push({
        icon: 'cancel',
        color: 'bg-red-500',
        label: 'Тапсырыс болдырылды',
        date: null,
        description: 'Себебі көрсетілмеген',
        showDate: false
      });
    }

    return events;
  };

  const timeline = getOrderTimeline();

  const statusColors = {
    // Simplified statuses
    'scheduled': 'bg-primary',
    'measured': 'bg-primary-light',
    'in_production': 'bg-orange-500',
    'ready': 'bg-green-500',
    'installing': 'bg-lime-500',
    'completed': 'bg-green-600',
    'cancelled': 'bg-red-500',

    // Legacy (backward compatibility)
    'lead': 'bg-primary',
    'proposal_sent': 'bg-primary/100',
    'proposal_accepted': 'bg-primary-light',
    'contract_signed': 'bg-primary/50',
    'payment_pending': 'bg-yellow-500',
    'production': 'bg-orange-500',
  };

  const statusLabels = {
    // Simplified statuses
    'scheduled': 'Жаңа',
    'measured': 'Өлшем аяқталды',
    'in_production': 'Өндірісте',
    'ready': 'Дайын',
    'installing': 'Орнатылуда',
    'completed': 'Аяқталды',
    'cancelled': 'Болдырылды',
    'rejected': 'Бас тартты',

    // Legacy (backward compatibility)
    'lead': 'Жаңа өтініш',
    'proposal_sent': 'Ұсыныс жіберілді',
    'proposal_accepted': 'Ұсыныс қабылданды',
    'contract_signed': 'Келісім-шарт',
    'payment_pending': 'Төлем күтілуде',
    'production': 'Өндірісте',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-black">Тапсырыс #{order.id.slice(0, 8)}</h2>
            <p className="text-sm opacity-90">{order.client?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${statusColors[order.status]} shadow-lg`}>
              {statusLabels[order.status]}
            </span>
            {order.paymentStatus && (
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {order.paymentStatus === 'paid' ? 'Төленді' : 'Төлем күтілуде'}
              </span>
            )}
          </div>

          {/* CLIENT INFO */}
          <div className="bg-primary/10 border-2 border-primary/25 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="person" className="text-primary" />
              <h3 className="font-bold text-primary-dark">Клиент ақпараты</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-dark">Аты:</span>
                <span className="font-bold text-primary-dark">{order.client?.name || 'Белгісіз'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-dark">Телефон:</span>
                <a
                  href={`tel:${order.client?.phone || measurement?.clientPhone}`}
                  className="font-bold text-primary-dark hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.client?.phone || measurement?.clientPhone || 'Жоқ'}
                </a>
              </div>
              {(order.client?.address || measurement?.address) && (
                <div className="flex justify-between items-start">
                  <span className="text-primary-dark">Мекенжай:</span>
                  <span className="font-bold text-primary-dark text-right max-w-[60%]">
                    {order.client?.address || measurement?.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FINANCIAL INFO */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="payments" className="text-green-600" />
              <h3 className="font-bold text-green-900">Қаржылық ақпарат</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Жалпы құн:</span>
                <span className="text-2xl font-black text-green-900">{totalPrice.toLocaleString()} ₸</span>
              </div>
              {order.paidAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Төленді:</span>
                  <span className="text-lg font-bold text-green-700">{order.paidAmount.toLocaleString()} ₸</span>
                </div>
              )}
              {(totalPrice - (order.paidAmount || 0)) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Қалдық:</span>
                  <span className="text-lg font-bold text-amber-700">
                    {(totalPrice - (order.paidAmount || 0)).toLocaleString()} ₸
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* MEASUREMENT INFO */}
          {measurement && (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="straighten" className="text-primary" />
                <h3 className="font-bold text-primary-dark">Өлшем деректері</h3>
              </div>
              <div className="space-y-2 text-sm">
                {measurement.scheduledAt && (
                  <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-lg mb-2">
                    <span className="text-primary-dark">Уақыты:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-dark">{formatDateKZ(measurement.scheduledAt)}</span>
                      <span className="text-primary/40">•</span>
                      <span className="font-bold text-primary">{formatTime24(measurement.scheduledAt)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-primary-dark">Статус:</span>
                  <span className="font-bold text-primary-dark">
                    {measurement.status === 'completed' ? 'Аяқталды' : 'Күтілуде'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-dark">Терезелер:</span>
                  <span className="font-bold text-primary-dark">{measurement.windows?.length || 0} терезе</span>
                </div>
                {measurement.roomType && (
                  <div className="flex justify-between">
                    <span className="text-primary-dark">Бөлмелер:</span>
                    <span className="font-bold text-primary-dark">{measurement.roomType}</span>
                  </div>
                )}
                {order.designer && (
                  <div className="flex justify-between items-center">
                    <span className="text-primary-dark">Дизайнер:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-dark">{order.designer.name}</span>
                      <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                        {order.designer.name[0]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TIMELINE */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="timeline" className="text-primary" />
              <h3 className="font-bold text-gray-900">Тапсырыс тарихы</h3>
            </div>

            <div className="relative pl-8 space-y-4">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>

              {timeline.map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-[30px] top-1 size-4 rounded-full ${event.color} border-2 border-white shadow-lg`}></div>

                  {/* Event */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={event.icon} size={20} className={event.color.replace('bg-', 'text-')} />
                      <p className="font-bold text-gray-900 text-base">{event.label}</p>
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    {event.subdescription && (
                      <p className="text-sm text-primary font-bold mt-1">{event.subdescription}</p>
                    )}
                    {event.timestamp && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        {formatDateTimeFull(event.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WINDOWS DETAILS */}
          {measurement?.windows && measurement.windows.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="inventory" className="text-amber-600" />
                <h3 className="font-bold text-amber-900">Детальдар ({measurement.windows.length} бөлме)</h3>
              </div>

              <div className="space-y-3">
                {measurement.windows.map((window, idx) => {
                  const price = window.priceBreakdown?.clientCheck?.total || 0;
                  const items = window.priceBreakdown?.clientCheck?.items || [];

                  return (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-amber-900">{idx + 1}. {window.roomName}</p>
                        <p className="font-black text-green-600">{price.toLocaleString()} ₸</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-amber-700">Мата:</span>
                          <span className="font-bold text-amber-900 ml-1">{window.fabricCode}</span>
                        </div>
                        <div>
                          <span className="text-amber-700">Ені:</span>
                          <span className="font-bold text-amber-900 ml-1">{window.lengthMeters}м</span>
                        </div>
                      </div>

                      {/* Price items */}
                      {items.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-amber-100">
                          {items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-xs text-amber-800 py-0.5">
                              <span>{item.name}</span>
                              <span className="font-bold">{item.total?.toLocaleString()} ₸</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTES */}
          {order.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="note" className="text-gray-600" />
                <h3 className="font-bold text-gray-900">Коментарийлер</h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => window.open(`/measurements/${measurement?.id}`, '_blank')}
              disabled={!measurement}
              className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name="open_in_new" />
              Өлшемді ашу
            </button>
            <button
              onClick={onClose}
              className="px-6 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-all"
            >
              Жабу
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
