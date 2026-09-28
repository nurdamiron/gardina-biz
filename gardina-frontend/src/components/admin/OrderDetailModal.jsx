import React from 'react';
import { formatDateKZ, formatTime24, formatDateTimeFull } from '../../utils/dateUtils';
import { money } from '../../utils/money';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';
import { calculateRoomEstimate, roomFromWindow, estimateLineName } from '../../utils/roomEstimate';

/**
 * Order Detail Modal for Admin
 * Shows complete order history, timeline, and all related data
 */
const OrderDetailModal = ({ order, measurement, onClose }) => {
  const { t } = useI18n();
  if (!order) return null;

  // Same estimate the client received (utils/roomEstimate), not the stale clientCheck snapshot.
  const windowEstimate = (w) => calculateRoomEstimate(roomFromWindow(w));
  const totalPrice = measurement?.windows?.reduce((sum, w) => sum + windowEstimate(w).total, 0) || order.totalAmount?.amount || 0;
  // Deals carry many status names (legacy and simplified); the modal works with one stage set.
  const STAGE = {
    new: 'scheduled', lead: 'scheduled', assigned: 'scheduled', measurement_scheduled: 'scheduled', scheduled: 'scheduled',
    measuring: 'measured', measurement_done: 'measured', measured: 'measured', proposal_sent: 'measured', proposal_accepted: 'measured', contract_signed: 'measured',
    in_sewing: 'in_production', in_production: 'in_production', corrections: 'in_production',
    ready_to_install: 'ready', ready_for_installation: 'ready', ready: 'ready',
    installing: 'installing', installation_scheduled: 'installing',
    installed: 'completed', completed: 'completed', cancelled: 'cancelled', rejected: 'rejected',
  };
  const stage = STAGE[order.status] || order.status;

  // There is no order.paidAmount in the API; paid = prepayment + final payment, as on the deal page.
  const paidAmount = money(order.prepayment) + money(order.finalPayment);

  // Build order timeline
  const getOrderTimeline = () => {
    const events = [];

    // Step 1: Order created & measurement scheduled
    if (order.createdAt) {
      events.push({
        icon: 'add_circle',
        color: 'bg-primary',
        label: t('orders.detailModal.created', 'Тапсырыс құрылды'),
        date: order.createdAt,
        description: t('orders.detailModal.designerAssigned', { name: order.designer?.name || t('orders.detailModal.unknown', 'Белгісіз') }, 'Дизайнер тағайындалды: {name}'),
        subdescription: measurement?.scheduledAt
          ? t('orders.detailModal.visitTime', { date: formatDateKZ(measurement.scheduledAt), time: formatTime24(measurement.scheduledAt) }, 'Өлшемге келу уақыты: {date} • {time}')
          : null,
        timestamp: new Date(order.createdAt)
      });
    }

    // Step 2: Measurement started (when designer arrived)
    if (measurement?.startedAt) {
      events.push({
        icon: 'play_arrow',
        color: 'bg-primary/100',
        label: t('orders.detailModal.measureStarted', 'Өлшем басталды'),
        date: measurement.startedAt,
        description: t('orders.detailModal.measureStartedDesc', 'Дизайнер келді және өлшеуді бастады'),
        timestamp: new Date(measurement.startedAt)
      });
    }

    // Step 3: Measurement completed
    if (stage === 'measured' || stage === 'in_production' || stage === 'ready' || stage === 'installing' || stage === 'completed') {
      events.push({
        icon: 'check_circle',
        color: 'bg-primary-light',
        label: t('orders.detailModal.measureDone', 'Өлшем аяқталды'),
        date: measurement?.completedAt,
        description: t('orders.detailModal.windowsMeasured', { n: measurement?.windows?.length || 0 }, '{n} терезе өлшенді'),
        showDate: false
      });
    }

    // Contract & Prepayment
    if (stage === 'in_production' || stage === 'ready' || stage === 'installing' || stage === 'completed') {
      events.push({
        icon: 'assignment',
        color: 'bg-green-500',
        label: t('orders.detailModal.contract', 'Келісім-шарт және алдын ала төлем'),
        date: order.contractSignedAt,
        description: t('orders.detailModal.received', { amount: money(order.prepayment).toLocaleString() }, 'Алынды: {amount} ₸'),
        showDate: false
      });
    }

    // Production
    if (stage === 'in_production' || stage === 'ready' || stage === 'installing' || stage === 'completed') {
      events.push({
        icon: 'factory',
        color: 'bg-orange-500',
        label: t('orders.detailModal.production', 'Өндірісте'),
        date: null,
        description: t('orders.detailModal.productionDesc', 'Тігу процесінде'),
        showDate: false
      });
    }

    // Ready for installation
    if (stage === 'ready' || stage === 'installing' || stage === 'completed') {
      events.push({
        icon: 'check_circle',
        color: 'bg-green-500',
        label: t('orders.detailModal.ready', 'Орнатуға дайын'),
        date: null,
        description: t('orders.detailModal.readyDesc', 'Тапсырыс дайын'),
        showDate: false
      });
    }

    // Installing
    if (stage === 'installing' || stage === 'completed') {
      events.push({
        icon: 'construction',
        color: 'bg-lime-500',
        label: t('orders.detailModal.installing', 'Орнатылуда'),
        date: null,
        description: t('orders.detailModal.installingDesc', 'Орнату процесі'),
        showDate: false
      });
    }

    // Completed
    if (stage === 'completed') {
      events.push({
        icon: 'task_alt',
        color: 'bg-green-600',
        label: t('orders.detailModal.completed', 'Тапсырыс аяқталды'),
        date: null,
        description: t('orders.detailModal.completedDesc', 'Толығымен аяқталды'),
        showDate: false
      });
    }

    // Rejected
    if (stage === 'rejected') {
      events.push({
        icon: 'block',
        color: 'bg-gray-500',
        label: t('orders.detailModal.rejected', 'Клиент бас тартты'),
        date: null,
        description: t('orders.detailModal.rejectedDesc', 'Келісімге келмеді'),
        showDate: false
      });
    }

    // Cancelled
    if (stage === 'cancelled') {
      events.push({
        icon: 'cancel',
        color: 'bg-red-500',
        label: t('orders.detailModal.cancelled', 'Тапсырыс болдырылды'),
        date: null,
        description: t('orders.detailModal.cancelledDesc', 'Себебі көрсетілмеген'),
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
    'scheduled': t('orders.detailModal.status_scheduled', 'Жаңа'),
    'measured': t('orders.detailModal.status_measured', 'Өлшем аяқталды'),
    'in_production': t('orders.detailModal.status_in_production', 'Өндірісте'),
    'ready': t('orders.detailModal.status_ready', 'Дайын'),
    'installing': t('orders.detailModal.status_installing', 'Орнатылуда'),
    'completed': t('orders.detailModal.status_completed', 'Аяқталды'),
    'cancelled': t('orders.detailModal.status_cancelled', 'Болдырылды'),
    'rejected': t('orders.detailModal.status_rejected', 'Бас тартты'),

    // Legacy (backward compatibility)
    'lead': t('orders.detailModal.status_lead', 'Жаңа өтініш'),
    'proposal_sent': t('orders.detailModal.status_proposal_sent', 'Ұсыныс жіберілді'),
    'proposal_accepted': t('orders.detailModal.status_proposal_accepted', 'Ұсыныс қабылданды'),
    'contract_signed': t('orders.detailModal.status_contract_signed', 'Келісім-шарт'),
    'payment_pending': t('orders.detailModal.status_payment_pending', 'Төлем күтілуде'),
    'production': t('orders.detailModal.status_production', 'Өндірісте'),
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-card w-full md:max-w-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-black">{t('orders.detailModal.title', { id: order.id.slice(0, 8) }, 'Тапсырыс #{id}')}</h2>
            <p className="text-sm opacity-90">{order.client?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-full bg-card/20 hover:bg-card/30 flex items-center justify-center transition-all"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${statusColors[stage]} shadow-lg`}>
              {statusLabels[stage]}
            </span>
            {order.paymentStatus && (
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {order.paymentStatus === 'paid' ? t('orders.detailModal.paid', 'Төленді') : t('orders.detailModal.awaitingPayment', 'Төлем күтілуде')}
              </span>
            )}
          </div>

          {/* CLIENT INFO */}
          <div className="bg-primary/10 border-2 border-primary/25 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="person" className="text-primary" />
              <h3 className="font-bold text-primary-dark">{t('orders.detailModal.clientInfo', 'Клиент ақпараты')}</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-dark">{t('orders.detailModal.name', 'Аты:')}</span>
                <span className="font-bold text-primary-dark">{order.client?.name || t('orders.detailModal.unknown', 'Белгісіз')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-primary-dark">Телефон:</span>
                <a
                  href={`tel:${order.client?.phone || measurement?.clientPhone}`}
                  className="font-bold text-primary-dark hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.client?.phone || measurement?.clientPhone || t('orders.detailModal.none', 'Жоқ')}
                </a>
              </div>
              {(order.client?.address || measurement?.address) && (
                <div className="flex justify-between items-start">
                  <span className="text-primary-dark">{t('orders.detailModal.address', 'Мекенжай:')}</span>
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
              <h3 className="font-bold text-green-900">{t('orders.detailModal.finance', 'Қаржылық ақпарат')}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-700">{t('orders.detailModal.total', 'Жалпы құн:')}</span>
                <span className="text-2xl font-black text-green-900">{totalPrice.toLocaleString()} ₸</span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">{t('orders.detailModal.paidLabel', 'Төленді:')}</span>
                  <span className="text-lg font-bold text-green-700">{paidAmount.toLocaleString()} ₸</span>
                </div>
              )}
              {(totalPrice - (paidAmount || 0)) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-green-700">{t('orders.detailModal.remaining', 'Қалдық:')}</span>
                  <span className="text-lg font-bold text-amber-700">
                    {(totalPrice - (paidAmount || 0)).toLocaleString()} ₸
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
                <h3 className="font-bold text-primary-dark">{t('orders.detailModal.measurement', 'Өлшем деректері')}</h3>
              </div>
              <div className="space-y-2 text-sm">
                {measurement.scheduledAt && (
                  <div className="flex justify-between items-center bg-card/50 px-3 py-2 rounded-lg mb-2">
                    <span className="text-primary-dark">{t('orders.detailModal.time', 'Уақыты:')}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary-dark">{formatDateKZ(measurement.scheduledAt)}</span>
                      <span className="text-primary/40">•</span>
                      <span className="font-bold text-primary">{formatTime24(measurement.scheduledAt)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-primary-dark">{t('orders.detailModal.statusLabel', 'Статус:')}</span>
                  <span className="font-bold text-primary-dark">
                    {measurement.status === 'completed' ? t('orders.detailModal.measureDoneShort', 'Аяқталды') : t('orders.detailModal.pending', 'Күтілуде')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-dark">{t('orders.detailModal.windows', 'Терезелер:')}</span>
                  <span className="font-bold text-primary-dark">{t('orders.detailModal.windowsCount', { n: measurement.windows?.length || 0 }, '{n} терезе')}</span>
                </div>
                {measurement.roomType && (
                  <div className="flex justify-between">
                    <span className="text-primary-dark">{t('orders.detailModal.rooms', 'Бөлмелер:')}</span>
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
          <div className="bg-card border-2 border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="timeline" className="text-primary" />
              <h3 className="font-bold text-foreground">{t('orders.detailModal.history', 'Тапсырыс тарихы')}</h3>
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
                      <p className="font-bold text-foreground text-base">{event.label}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {event.subdescription && (
                      <p className="text-sm text-primary font-bold mt-1">{event.subdescription}</p>
                    )}
                    {event.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1.5">
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
                <h3 className="font-bold text-amber-900">{t('orders.detailModal.details', { n: measurement.windows.length }, 'Детальдар ({n} бөлме)')}</h3>
              </div>

              <div className="space-y-3">
                {measurement.windows.map((window, idx) => {
                  const est = windowEstimate(window);
                  const price = est.total;
                  const items = est.lines.map((l) => ({ name: estimateLineName(l, t), total: l.total }));

                  return (
                    <div key={idx} className="bg-card rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-amber-900">{idx + 1}. {window.roomName}</p>
                        <p className="font-black text-green-600">{price.toLocaleString()} ₸</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-amber-700">{t('orders.detailModal.fabric', 'Мата:')}</span>
                          <span className="font-bold text-amber-900 ml-1">{window.fabricCode}</span>
                        </div>
                        <div>
                          <span className="text-amber-700">{t('orders.detailModal.width', 'Ені:')}</span>
                          <span className="font-bold text-amber-900 ml-1">{roomFromWindow(window).corniceLength}м</span>
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
            <div className="bg-muted border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="note" className="text-muted-foreground" />
                <h3 className="font-bold text-foreground">{t('orders.detailModal.comments', 'Коментарийлер')}</h3>
              </div>
              <p className="text-sm text-foreground whitespace-pre-line">{order.notes}</p>
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
              {t('orders.detailModal.openMeasurement', 'Өлшемді ашу')}
            </button>
            <button
              onClick={onClose}
              className="px-6 bg-muted text-foreground font-bold py-3 rounded-xl hover:bg-gray-300 transition-all"
            >
              {t('orders.detailModal.close', 'Жабу')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
