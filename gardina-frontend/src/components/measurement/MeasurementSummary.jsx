import React from 'react';
import Icon from '../common/Icon';
import { formatPrice } from '../../utils/calculations';
import { calculateRoomEstimate, estimateLineName, unitLabel } from '../../utils/roomEstimate';
import { useI18n } from '../../contexts/I18nContext';

/** wa.me wants digits only in international format; KZ numbers written as 8XXXXXXXXXX become 7XXXXXXXXXX. */
const toWhatsAppNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  return digits;
};

/**
 * Итоговая смета замера. Totals come from calculateRoomEstimate, the same function the room card
 * and the payments page use, so the client sees the same number the manager collects payment on.
 */
const MeasurementSummary = ({ rooms, onComplete, clientName, clientPhone }) => {
  const { t } = useI18n();

  const roomsSummary = rooms.map((room) => {
    const { total, lines } = calculateRoomEstimate(room);
    return { name: room.name, solutionType: room.solutionType || 'classic', total, lines };
  });
  const grandTotal = roomsSummary.reduce((sum, r) => sum + r.total, 0);

  const solutionLabel = (type) => t(`measurements.estimate.solution.${type}`, type);
  const lineSub = (line) => (line.unit === 'piece' && line.qty === 1 ? '' : `${line.qty} ${unitLabel(line.unit, t)} × ${formatPrice(line.price)}`);

  const shareToWhatsApp = () => {
    const number = toWhatsAppNumber(clientPhone);
    if (!number) {
      window.alert(t('measurements.estimate.whatsappNoPhone', 'Клиенттің телефоны көрсетілмеген'));
      return;
    }
    const greeting = t('measurements.estimate.whatsappGreeting', 'Сәлеметсіз бе, {name}! Өлшем бойынша смета:')
      .replace('{name}', clientName || '');
    const body = roomsSummary.map((room) => [
      `*${room.name}* (${solutionLabel(room.solutionType)}): ${formatPrice(room.total)}`,
      ...room.lines.map((l) => `  • ${estimateLineName(l, t)}: ${formatPrice(l.total)}`),
    ].join('\n'));
    const text = [greeting, '', ...body, '', `*${t('measurements.estimate.whatsappTotal', 'Барлығы')}: ${formatPrice(grandTotal)}*`].join('\n');
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="receipt_long" className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">{t('measurements.estimate.title', 'Жалпы смета')}</h2>
      </div>

      <div className="space-y-4">
        {roomsSummary.map((room, idx) => (
          <div key={idx} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">{room.name}</h3>
                <span className="text-xs text-muted-foreground">{solutionLabel(room.solutionType)}</span>
              </div>
              <span className="text-lg font-bold text-primary">{formatPrice(room.total)}</span>
            </div>

            <div className="space-y-2 text-sm">
              {room.lines.map((line, i) => (
                <div key={i}>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{estimateLineName(line, t)}</span>
                    <span className="font-medium">{formatPrice(line.total)}</span>
                  </div>
                  {lineSub(line) && <p className="text-xs text-muted-foreground mt-0.5">{lineSub(line)}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="inventory_2" size={40} />
          <p className="mt-2">{t('measurements.estimate.noRooms', 'Бөлме қосылмаған')}</p>
        </div>
      )}

      {grandTotal > 0 && (
        <div className="bg-green-500 rounded-2xl p-6 text-white">
          <div className="space-y-2 text-sm opacity-90 mb-4">
            {roomsSummary.map((room, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{room.name}</span>
                <span>{formatPrice(room.total)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/30 pt-4 flex justify-between items-center">
            <span className="text-lg font-bold">{t('measurements.estimate.grandTotal', 'ЖАЛПЫ СОМА:')}</span>
            <span className="text-3xl font-black">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={shareToWhatsApp}
          disabled={grandTotal <= 0}
          className="py-4 bg-card border-2 border-border text-foreground font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Icon name="share" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={rooms.length === 0}
          className="py-4 bg-primary text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 disabled:opacity-50"
        >
          <Icon name="check_circle" />
          {t('measurements.estimate.finish', 'Аяқтау')}
        </button>
      </div>
    </div>
  );
};

export default MeasurementSummary;
