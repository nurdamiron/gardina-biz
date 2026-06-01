import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useUI } from '../contexts/UIContext';
import { measurementsAPI, catalogAPI } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import { pluralize, NOUNS } from '../utils/plural';
import PaymentRiskIndicator from '../components/payment/PaymentRiskIndicator';
import PaymentTracking from '../components/payment/PaymentTracking';
import { formatTime24, formatDate } from '../utils/dateUtils';
import Icon from '../components/common/Icon';

// Fallback constants — used only if catalog API is unavailable
const TAPE_ROLL_METERS = 50;
const TAPE_ROLL_PRICE = 2500;
const HOOKS_PER_PACK = 100;
const HOOKS_PACK_PRICE = 1500;
const DEFAULT_SEWING_RATE = 1700;
const DEFAULT_INSTALLATION_RATE = 1500;

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU').format(price || 0) + ' ₸';
};

/**
 * Measurement Details Screen - Improved
 */
const MeasurementDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { refreshData } = useApp();
  const { showToast } = useUI();
  const { t, lang } = useI18n();
  const [measurement, setMeasurement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [catalogRates, setCatalogRates] = useState({
    sewingRate: DEFAULT_SEWING_RATE,
    installationRate: DEFAULT_INSTALLATION_RATE,
    tapePrice: TAPE_ROLL_PRICE,
    hooksPrice: HOOKS_PACK_PRICE,
  });

  useEffect(() => {
    if (id) {
      loadMeasurement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load rates from catalog so display stays in sync with admin-configured prices
  useEffect(() => {
    catalogAPI.getServices()
      .then(res => {
        const services = res.data?.data || [];
        const updates = {};
        services.forEach(s => {
          if (s.type === 'sewing' && s.price_per_unit) updates.sewingRate = s.price_per_unit;
          if (s.type === 'installation' && s.price_per_unit) updates.installationRate = s.price_per_unit;
          if (s.type === 'tape' && s.price_per_unit) updates.tapePrice = s.price_per_unit;
          if (s.type === 'hooks' && s.price_per_unit) updates.hooksPrice = s.price_per_unit;
        });
        if (Object.keys(updates).length > 0) {
          setCatalogRates(prev => ({ ...prev, ...updates }));
        }
      })
      .catch(() => {
        // Silently use fallback constants if catalog API is unavailable
      });
  }, []);

  const loadMeasurement = async () => {
    try {
      setLoading(true);
      const response = await measurementsAPI.getById(id);
      setMeasurement(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleRoomExpand = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // Расчет сметы для комнаты из priceBreakdown
  // Rates: use saved per-window value first, then catalog rates, then fallback constants
  const calculateRoomEstimate = (window) => {
    const pb = window.priceBreakdown || {};
    const items = [];
    let total = 0;

    const widthM = (window.dimensions?.widthCenter || window.dimensions?.width || 0) / 1000;

    // 1. Ткани
    if (pb.fabricItems && pb.fabricItems.length > 0) {
      let totalFabricMeters = 0;
      pb.fabricItems.forEach(item => {
        const coef = item.fabricType === 'tulle' ? 3 : 2;
        const meters = Math.ceil(widthM * coef + 0.5);
        const itemTotal = meters * (item.pricePerMeter || 0);
        totalFabricMeters += meters;
        items.push({ name: item.fabricName || item.fabricCode, qty: meters, unit: t('measurements.units.meter', 'м'), price: item.pricePerMeter || 0, total: itemTotal, type: 'fabric' });
        total += itemTotal;
      });

      // 2. Тігу — saved rate → catalog rate → fallback constant
      const sewRate = pb.sewingRate ?? catalogRates.sewingRate;
      if (totalFabricMeters > 0 && sewRate > 0) {
        const sewTotal = totalFabricMeters * sewRate;
        items.push({ name: t('measurements.estimate.sewing', 'Тігу'), qty: totalFabricMeters, unit: t('measurements.units.meter', 'м'), price: sewRate, total: sewTotal, type: 'sewing' });
        total += sewTotal;
      }

      // 3. Таспа — catalog rate → fallback constant
      if (totalFabricMeters > 0) {
        const tapePrice = catalogRates.tapePrice;
        const rolls = Math.ceil(totalFabricMeters / TAPE_ROLL_METERS);
        const tapeTotal = rolls * tapePrice;
        items.push({ name: `${t('measurements.estimate.tape', 'Таспа')} (${TAPE_ROLL_METERS}${t('measurements.units.meter', 'м')})`, qty: rolls, unit: t('measurements.units.roll', 'рулон'), price: tapePrice, total: tapeTotal, type: 'tape' });
        total += tapeTotal;

        // 4. Ілгектер — catalog rate → fallback constant
        const hooksPrice = catalogRates.hooksPrice;
        const hooksQty = totalFabricMeters * 5;
        const packs = Math.ceil(hooksQty / HOOKS_PER_PACK);
        const hooksTotal = packs * hooksPrice;
        items.push({ name: t('measurements.estimate.hooks', 'Ілгектер'), qty: packs, unit: t('measurements.units.pack', 'қап'), price: hooksPrice, total: hooksTotal, type: 'hooks' });
        total += hooksTotal;
      }
    }

    // 5. Карниз
    if (pb.cornice?.needed && pb.cornice?.pricePerMeter) {
      const corniceTotal = widthM * pb.cornice.pricePerMeter;
      items.push({ name: pb.cornice.name || t('measurements.estimate.cornice', 'Карниз'), qty: widthM.toFixed(1), unit: t('measurements.units.meter', 'м'), price: pb.cornice.pricePerMeter, total: corniceTotal, type: 'cornice' });
      total += corniceTotal;
    }

    // 6. Орнату — saved rate → catalog rate → fallback constant
    const installRate = pb.installationRate ?? catalogRates.installationRate;
    if (widthM > 0 && installRate > 0) {
      const installTotal = widthM * installRate;
      items.push({ name: t('measurements.estimate.installation', 'Орнату'), qty: widthM.toFixed(1), unit: t('measurements.units.meter', 'м'), price: installRate, total: installTotal, type: 'installation' });
      total += installTotal;
    }

    // 7. Аксессуарлар
    if (pb.extras && pb.extras.length > 0) {
      pb.extras.forEach(extra => {
        items.push({ name: extra.name, qty: extra.quantity || 1, unit: extra.unit || t('measurements.units.piece', 'дн'), price: extra.pricePerUnit || 0, total: extra.total || 0, type: 'accessory' });
        total += extra.total || 0;
      });
    }

    return { items, total };
  };

  const openMap = () => {
    if (measurement?.mapLink) {
      window.open(measurement.mapLink, '_blank');
    }
  };

  const handleComplete = async () => {
    if (!measurement?.id) return;

    try {
      setCompleting(true);
      // Call complete API to mark measurement as completed
      await measurementsAPI.complete(measurement.id, {
        notes: t('measurements.detail.completedTitle', 'Өлшем аяқталды'),
      });

      // Refresh data in AppContext to update cache
      await refreshData();

      // Navigate back to measurements list
      navigate(user?.role === 'manager' ? '/manager/measurements' : '/designer/measurements');
    } catch (error) {
      showToast(t('measurements.toast.errorPrefix', 'Қате: ') + (error.response?.data?.error || error.message), 'error');
      setCompleting(false);
    }
  };

  const handleEditRoom = (window) => {
    navigate(`/designer/measurements/${id}/room`, {
      state: {
        measurementId: id,
        measurement,
        roomName: window.roomName,
        editMode: true,
        windowId: window.id
      }
    });
  };

  const handleOpenImage = (imageUrl, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowImageModal(false);
    setSelectedImage(null);
  };

  // Финансы по замеру (смета + платежи)
  const calculateMeasurementFinance = (measurementData) => {
    const windows = measurementData?.windows || [];
    // amounts arrive from the API as numeric strings — coerce before summing,
    // otherwise `s + p.amount` concatenates strings ("0" + "210000.00" + …) → NaN%.
    const plannedTotal = windows.reduce(
      (sum, w) => sum + Number(w.priceBreakdown?.clientCheck?.total || 0),
      0
    );
    const payments = measurementData?.payments || [];
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(plannedTotal - paid, 0);
    const eightyPercent = Math.round(plannedTotal * 0.8);
    return { plannedTotal, paid, outstanding, eightyPercent, payments };
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">{t('measurements.detail.loading', 'Жүктелуде...')}</p>
        </div>
      </div>
    );
  }

  if (error || !measurement) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md">
          <Icon name="error" size={48} className="text-red-500" />
          <h2 className="text-xl font-bold mt-4">{t('measurements.detail.errorTitle', 'Қате')}</h2>
          <p className="text-text-secondary mt-2">{error || t('measurements.detail.notFound', 'Өлшем табылмады')}</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-bold">
            {t('measurements.detail.back', 'Артқа')}
          </button>
        </div>
      </div>
    );
  }

  // Фильтруем глобальные аксессуары
  const rooms = measurement.windows?.filter(w => w.roomName !== 'Қосымша (Таспа/Аксессуар)') || [];
  const totalRooms = rooms.length;
  const isPriorityHigh = measurement.priority === 'high';

  // Общая сумма
  const totalEstimate = rooms.reduce((sum, room) => {
    const { total } = calculateRoomEstimate(room);
    return sum + total;
  }, 0);

  const finance = calculateMeasurementFinance(measurement);
  // Per-window priceBreakdown can be 0 while the room rows show real prices
  // (calculateRoomEstimate). Fall back to the room total so the summary tile and
  // the room list don't contradict each other.
  if (finance.plannedTotal <= 0 && totalEstimate > 0) {
    finance.plannedTotal = totalEstimate;
    finance.outstanding = Math.max(totalEstimate - finance.paid, 0);
    finance.eightyPercent = Math.round(totalEstimate * 0.8);
  }
  const payments = finance.payments || [];

  const handleAddPayment = async (paymentData) => {
    if (!paymentData.amount || isNaN(paymentData.amount)) {
      showToast(t('measurements.toast.enterAmount', 'Соманы енгізіңіз'), 'error');
      return;
    }
    try {
      await measurementsAPI.addPayment(id, {
        type: paymentData.type,
        amount: parseInt(paymentData.amount, 10),
        note: paymentData.note,
      });
      await loadMeasurement(); // refresh to get payments
      showToast(t('measurements.toast.paymentAdded', 'Төлем қосылды'), 'success');
    } catch (error) {
      showToast(error.response?.data?.error || t('measurements.toast.paymentError', 'Қате төлемде'), 'error');
      throw error; // Re-throw for PaymentTracking component to handle
    }
  };

  return (
    <div className="bg-background-light min-h-screen pb-32">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Icon name="arrow_back" className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t('measurements.detail.numberPrefix', 'Өлшем')} #{measurement.measurementNumber || id.slice(0,8)}</h1>
              <p className="text-xs text-text-secondary">{formatDate(measurement.scheduledAt, lang)} • {formatTime24(measurement.scheduledAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPriorityHigh && (
              <div className="px-2 py-1 bg-red-500 text-white rounded-full flex items-center gap-1">
                <Icon name="priority_high" size={14} />
                <span className="text-xs font-bold">{t('measurements.detail.urgent', 'ШҰҒЫЛ')}</span>
              </div>
            )}
            <button
              onClick={() => navigate(`/designer/measurements/${id}/proposal`)}
              className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/15 transition-colors"
            >
              <Icon name="description" size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto">
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

        {/* CLIENT INFO */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="person" size={24} />
              </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{measurement.clientName || t('measurements.detail.unknownClient', 'Белгісіз')}</h3>
                {measurement.clientPhone && (
                <a href={`tel:${measurement.clientPhone}`} className="text-sm text-primary font-medium flex items-center gap-1">
                  <Icon name="call" size={14} />
                    {measurement.clientPhone}
                  </a>
                )}
            </div>
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-gray-50">
            <div className="flex items-start gap-2">
              <Icon name="location_on" size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{measurement.address}</p>
                {measurement.mapLink && (
                  <button onClick={openMap} className="mt-1 text-xs text-primary font-bold flex items-center gap-1">
                    <Icon name="open_in_new" size={12} />
                    {t('measurements.detail.openOnMap', 'Картада ашу')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATUS WITH PAYMENT RISK */}
        <section className={`rounded-xl p-3 ${
          measurement.status === 'completed'
            ? 'bg-green-50 border border-green-200'
            : measurement.status === 'in_progress'
            ? 'bg-primary/10 border border-primary/25'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-full flex items-center justify-center ${
                measurement.status === 'completed' ? 'bg-green-500' :
                measurement.status === 'in_progress' ? 'bg-primary' : 'bg-amber-500'
              } text-white`}>
                <Icon name={measurement.status === 'completed' ? 'check' :
                   measurement.status === 'in_progress' ? 'pending' : 'schedule'} size={18} />
              </div>
              <p className={`font-bold text-sm ${
                measurement.status === 'completed' ? 'text-green-800' :
                measurement.status === 'in_progress' ? 'text-primary' : 'text-amber-800'
              }`}>
                {measurement.status === 'completed' ? t('measurements.status.completed', 'Аяқталды') :
                 measurement.status === 'in_progress' ? t('measurements.status.in_progress', 'Орындалуда') : t('measurements.status.pending', 'Күтуде')}
              </p>
            </div>
            {/* Мини индикатор риска платежей */}
            {measurement.status !== 'completed' && (
              <PaymentRiskIndicator
                totalAmount={finance.plannedTotal}
                paidAmount={finance.paid}
                requiredPercent={80}
                showDetails={false}
              />
            )}
          </div>
        </section>

        {/* ROOMS LIST */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold text-gray-900">{t('measurements.rooms.title', 'Бөлмелер')}</h2>
            <span className="text-sm text-gray-500">{pluralize(totalRooms, NOUNS.room, lang)}</span>
          </div>

          {totalRooms === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Icon name="add_home" size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">{t('measurements.rooms.empty', 'Әлі бөлме қосылмаған')}</p>
              {['designer', 'admin'].includes(user?.role) && (
                <button
                  onClick={() => navigate(`/designer/measurements/${id}/room`, { state: { measurementId: id, measurement } })}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all"
                >
                  {t('measurements.rooms.add', 'Бөлме қосу')}
                </button>
              )}
            </div>
          ) : (
            <>
              {rooms.map((room, index) => {
                const { items, total } = calculateRoomEstimate(room);
                const widthM = ((room.dimensions?.widthCenter || room.dimensions?.width || 0) / 1000).toFixed(1);
                const heightM = ((room.dimensions?.heightCenter || room.dimensions?.height || 0) / 1000).toFixed(1);
                const isExpanded = expandedRooms[room.id];
                const pb = room.priceBreakdown || {};
                const fabricCount = pb.fabricItems?.length || 0;

                return (
                  <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Room Header - Collapsible */}
                    <div 
                      className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleRoomExpand(room.id)}
                    >
                      <div className="size-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg">
                            {index + 1}
                          </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{room.roomName}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{widthM}{t('measurements.units.meter', 'м')} × {heightM}{t('measurements.units.meter', 'м')}</span>
                          {fabricCount > 0 && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>{fabricCount} {t('measurements.rooms.fabricUnit', 'мата')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatPrice(total)}</p>
                        <Icon name="expand_more" size={20} />
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {/* Edit Button — only designer/admin can edit rooms */}
                        {measurement.status !== 'completed' && ['designer', 'admin'].includes(user?.role) && (
                          <div className="p-3 bg-gray-50 flex">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditRoom(room); }}
                              className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1"
                            >
                              <Icon name="edit" size={18} />
                              {t('measurements.rooms.edit', 'Өзгерту')}
                            </button>
                            </div>
                          )}

                        {/* Fabrics */}
                        {pb.fabricItems && pb.fabricItems.length > 0 && (
                          <div className="p-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">{t('measurements.rooms.fabrics', 'Маталар')}</p>
                            <div className="space-y-2">
                              {pb.fabricItems.map((fabric, idx) => {
                                const coef = fabric.fabricType === 'tulle' ? 3 : 2;
                                const meters = Math.ceil(parseFloat(widthM) * coef + 0.5);
                                return (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="size-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                      <Icon name="palette" />
                        </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-sm">{fabric.fabricName || fabric.fabricCode}</p>
                                      <p className="text-xs text-gray-500">
                                        {fabric.fabricType === 'tulle' ? t('measurements.rooms.tulle', 'Тюль (x3)') : t('measurements.rooms.curtain', 'Перде (x2)')} = {meters}{t('measurements.units.meter', 'м')}
                              </p>
                            </div>
                                    <p className="font-bold text-sm">{formatPrice(meters * (fabric.pricePerMeter || 0))}</p>
                            </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                        {/* Estimate Table */}
                        {items.length > 0 && (
                          <div className="p-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">{t('measurements.rooms.estimate', 'Смета')}</p>
                            <div className="space-y-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <div className={`size-6 rounded flex items-center justify-center text-white text-[12px] ${
                                      item.type === 'fabric' ? 'bg-amber-500' :
                                      item.type === 'sewing' ? 'bg-primary-light' :
                                      item.type === 'cornice' ? 'bg-primary' :
                                      item.type === 'installation' ? 'bg-green-500' :
                                      item.type === 'tape' || item.type === 'hooks' ? 'bg-primary/100' :
                                      'bg-gray-500'
                                    }`}>
                                      <Icon name={item.type === 'fabric' ? 'palette' :
                                         item.type === 'sewing' ? 'checkroom' :
                                         item.type === 'cornice' ? 'view_column' :
                                         item.type === 'installation' ? 'handyman' :
                                         item.type === 'tape' ? 'straighten' :
                                         item.type === 'hooks' ? 'link' :
                                         'extension'} size={14} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{item.name}</p>
                                      <p className="text-xs text-gray-400">{item.qty} {item.unit} × {formatPrice(item.price)}</p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-sm">{formatPrice(item.total)}</p>
                            </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                              <span className="font-bold text-gray-700">{t('measurements.rooms.total', 'Барлығы:')}</span>
                              <span className="text-xl font-black text-green-600">{formatPrice(total)}</span>
                          </div>
                        </div>
                      )}

                        {/* Photos */}
                        {room.designPhotos && room.designPhotos.length > 0 && (
                          <div className="p-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-3">
                              {t('measurements.rooms.photos', 'Фото')} ({room.designPhotos.length})
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {room.designPhotos.map((photo, idx) => (
                                <div 
                                  key={idx} 
                                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={(e) => { e.stopPropagation(); handleOpenImage(photo.url, e); }}
                                >
                                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                          </div>
                              ))}
                            </div>
                        </div>
                      )}

                        {/* Notes */}
                        {room.notes && (
                          <div className="p-4 border-t border-gray-100 bg-amber-50">
                            <p className="text-xs font-bold text-amber-700 uppercase mb-1">{t('measurements.rooms.note', 'Ескертпе')}</p>
                            <p className="text-sm text-amber-900">{room.notes}</p>
                        </div>
                      )}
                        </div>
                      )}
                  </div>
                );
              })}

              {/* Add Room Button — only designer/admin */}
              {measurement.status !== 'completed' && ['designer', 'admin'].includes(user?.role) && (
              <button
                  onClick={() => navigate(`/designer/measurements/${id}/room`, { state: { measurementId: id, measurement } })}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                  <Icon name="add" />
                  {t('measurements.rooms.add', 'Бөлме қосу')}
              </button>
              )}
            </>
          )}
        </section>

        {/* Notes */}
        {measurement.notes && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('measurements.detail.generalNote', 'Жалпы ескертпе')}</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{measurement.notes}</p>
          </section>
        )}

        </div>{/* end left column */}

        {/* ── RIGHT COLUMN (sidebar) ── */}
        <div className="space-y-4 lg:sticky lg:top-20">

        {/* SUMMARY STATS */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Icon name="door_sliding" />
            </div>
            <p className="text-2xl font-black text-gray-900">{totalRooms}</p>
            <p className="text-xs text-gray-500">{t('measurements.summary.rooms', 'Бөлме')}</p>
          </div>
          {finance.plannedTotal <= 0 ? (
            <div className="rounded-xl p-4 border border-border-light bg-neutral-soft text-center">
              <div className="size-10 rounded-full bg-surface-light text-text-secondary flex items-center justify-center mx-auto mb-2">
                <Icon name="request_quote" />
              </div>
              <p className="text-xl font-black text-text-main">—</p>
              <p className="text-xs font-bold text-text-secondary">{t('measurements.summary.noEstimate', 'Сметасыз')}</p>
            </div>
          ) : (
          <div className={`rounded-xl p-4 border text-center ${
            finance.paid >= finance.eightyPercent
              ? 'bg-surface-light border-border-light'
              : finance.paid >= finance.plannedTotal * 0.5
              ? 'bg-warning-soft border-warning/20'
              : 'bg-danger-soft border-danger/20'
          }`}>
            <div className={`size-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
              finance.paid >= finance.eightyPercent
                ? 'bg-success-soft text-success'
                : finance.paid >= finance.plannedTotal * 0.5
                ? 'bg-warning-soft text-warning'
                : 'bg-danger-soft text-danger'
            }`}>
              <Icon name={finance.paid >= finance.eightyPercent ? 'check_circle' : 'warning'} />
            </div>
            <p className="text-xl font-black text-text-main">{Math.round((finance.paid / finance.plannedTotal) * 100) || 0}%</p>
            <p className="text-xs font-bold text-text-main">
              {finance.paid >= finance.eightyPercent
                ? t('measurements.summary.paymentOk', 'Төлем OK')
                : finance.paid >= finance.plannedTotal * 0.5
                ? t('measurements.summary.paymentRisk', 'Қауіп бар')
                : t('measurements.summary.paymentDanger', 'Қауіпті!')}
            </p>
          </div>
          )}
        </section>

        {/* PAYMENT TRACKING */}
        <section id="payment-section">
          <PaymentTracking
            deal={{
              id: measurement.id,
              totalAmount: finance.plannedTotal,
              prepaidAmount: finance.payments
                .filter(p => p.type === 'prepayment')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0),
              finalAmount: finance.payments
                .filter(p => p.type === 'final')
                .reduce((sum, p) => sum + Number(p.amount || 0), 0),
              payments: finance.payments.map(p => ({
                amount: Number(p.amount || 0),
                type: p.type || 'prepayment',
                note: p.note || '',
                createdAt: p.date || new Date().toISOString()
              })),
              status: measurement.status === 'completed' ? 'completed' :
                      measurement.status === 'in_progress' ? 'in_production' :
                      'scheduled',
              client: {
                name: measurement.clientName,
                phone: measurement.clientPhone
              },
              updatedAt: measurement.updatedAt || measurement.scheduledAt,
              createdAt: measurement.createdAt || measurement.scheduledAt
            }}
            onAddPayment={handleAddPayment}
            canEdit={user?.role !== 'designer'}
          />
        </section>

        {/* TOTAL SUMMARY */}
        {totalRooms > 0 && (
          <section className="bg-gray-900 text-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">{t('measurements.summary.totalAmount', 'Жалпы сома')}</span>
              <span className="text-sm text-gray-500">{pluralize(totalRooms, NOUNS.room, lang)}</span>
            </div>
            <p className="text-4xl font-black">{formatPrice(totalEstimate)}</p>
          </section>
        )}

        {/* PAYMENT WARNING BEFORE COMPLETE */}
        {totalRooms > 0 && measurement.status !== 'completed' && finance.paid < finance.eightyPercent && (
          <section className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Icon name="warning" className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-orange-900">{t('measurements.warning.title', 'Төлем жеткіліксіз!')}</p>
                <p className="text-sm text-orange-800 mt-1">
                  {t('measurements.warning.clientPaidPrefix', 'Клиент тек ')}{Math.round((finance.paid / finance.plannedTotal) * 100)}{t('measurements.warning.clientPaidSuffix', '% төледі.')}
                  {' '}{t('measurements.warning.minRequiredPrefix', 'Минимум 80% (')}{finance.eightyPercent.toLocaleString()}{t('measurements.warning.minRequiredSuffix', ' ₸) қажет.')}
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  <strong>{t('measurements.warning.adviceLabel', 'Ұсыныс:')}</strong> {t('measurements.warning.advicePrefix', 'Өндіріске жібермес бұрын ')}{(finance.eightyPercent - finance.paid).toLocaleString()}{t('measurements.warning.adviceSuffix', ' ₸ алу керек.')}
                </p>
                {user?.role !== 'designer' && (
                  <button
                    onClick={() => {
                      document.querySelector('#payment-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors flex items-center gap-1"
                  >
                    <Icon name="payments" size={16} />
                    {t('measurements.warning.addPayment', 'Төлем қосу')}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* COMPLETE BUTTON */}
        {totalRooms > 0 && measurement.status !== 'completed' && (
          <section className="pt-2">
            <button
              onClick={handleComplete}
              disabled={completing || finance.paid < finance.eightyPercent}
              className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2
                ${finance.paid < finance.eightyPercent
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-primary text-white hover:brightness-110'}
                disabled:opacity-50`}
            >
              {completing ? (
                <>
                  <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('measurements.complete.completing', 'Аяқталуда...')}
                </>
              ) : finance.paid < finance.eightyPercent ? (
                <>
                  <Icon name="block" />
                  {t('measurements.complete.needPayment', '80% төлем қажет')}
                </>
              ) : (
                <>
                  <Icon name="done_all" />
                  {t('measurements.complete.finish', 'Өлшемді аяқтау')}
                </>
              )}
            </button>
            {finance.paid < finance.eightyPercent && (
              <p className="text-xs text-center text-gray-500 mt-2">
                {t('measurements.complete.hint', 'Өлшемді аяқтау үшін клиент минимум 80% төлеуі керек')}
              </p>
            )}
          </section>
        )}

        {/* COMPLETED STATE */}
        {measurement.status === 'completed' && (
          <section className="bg-green-50 rounded-2xl p-5 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="check_circle" size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-green-900">{t('measurements.detail.completedTitle', 'Өлшем аяқталды')}</p>
                <p className="text-sm text-green-700">{t('measurements.detail.completedSubtitle', 'Мәліметтер сәтті сақталды')}</p>
              </div>
            </div>
          </section>
        )}

        </div>{/* end right column */}

        </div>{/* end grid */}
      </main>

      {/* IMAGE VIEWER MODAL */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <div className="relative w-full max-w-4xl">
            <button
              onClick={handleCloseImageModal}
              className="absolute -top-12 right-0 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <Icon name="close" />
            </button>
              <img
                src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementDetails;
