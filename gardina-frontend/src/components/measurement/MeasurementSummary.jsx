import React from 'react';
import Icon from '../common/Icon';
import {
  calculateTapeRolls,
  calculateHooksQuantity,
  calculateHookPacks,
  TAPE_ROLLS,
  HOOK_TYPES,
  JALOUSIE_MATERIALS,
  ZEBRA_SYSTEMS,
  formatPrice
} from '../../utils/calculations';

// Коэффициенты для расчёта метража
const FABRIC_COEFFICIENTS = {
  curtain: 2,
  tulle: 3,
};

/**
 * Итоговая смета замера
 * Читает данные напрямую из комнат (fabricItems, sewingRate, etc.)
 */
const MeasurementSummary = ({ 
  rooms, 
  accessories,  // legacy, может быть пустым
  settings,     // legacy, может быть пустым
  onComplete 
}) => {
  // Расчёт по комнатам
  let roomsTotal = 0;
  
  const roomsSummary = rooms.map(room => {
    const corniceLength = parseFloat(room.corniceLength) || 0;
    const fabricItems = room.fabricItems || [];
    const sewingRate = room.sewingRate !== undefined && room.sewingRate !== '' 
      ? parseInt(room.sewingRate) 
      : 1700;
    const installationRate = room.installationRate !== undefined && room.installationRate !== '' 
      ? parseInt(room.installationRate) 
      : 1500;
    const extras = room.extras || [];

    let roomTotal = 0;
    const details = [];

    if (room.solutionType === 'classic') {
      // Расчёт метража для каждой ткани
      const calculateMeters = (item) => {
        const type = item.fabricType || item.type;
        const coefficient = FABRIC_COEFFICIENTS[type] || 2;
        return Math.ceil(corniceLength * coefficient + 0.5);
      };

      // Ткани
      let totalFabricMeters = 0;
      let totalFabricCost = 0;

      fabricItems.forEach(item => {
        const meters = calculateMeters(item);
        totalFabricMeters += meters;
        totalFabricCost += meters * (item.pricePerMeter || 0);
      });

      if (totalFabricCost > 0) {
        details.push({
          name: `Маталар (${fabricItems.length})`,
          value: formatPrice(totalFabricCost),
          sub: fabricItems.map(f => `${f.fabricName || f.fabricCode || '?'}: ${calculateMeters(f)}м`).join(', ')
        });
        roomTotal += totalFabricCost;
      }

      // Пошив
      const sewingTotal = totalFabricMeters * sewingRate;
      if (sewingTotal > 0) {
        details.push({ 
          name: `Тігу (${totalFabricMeters} м × ${formatPrice(sewingRate)})`, 
          value: formatPrice(sewingTotal) 
        });
        roomTotal += sewingTotal;
      }

      // Карниз
      const corniceTotal = room.cornice?.needed 
        ? corniceLength * (room.cornice?.pricePerMeter || 0)
        : 0;
      if (corniceTotal > 0) {
        details.push({ 
          name: `Карниз (${corniceLength}м)`, 
          value: formatPrice(corniceTotal) 
        });
        roomTotal += corniceTotal;
      }

      // Лента и крючки
      if (totalFabricMeters > 0) {
        const selectedTapeRoll = TAPE_ROLLS.find(t => t.id === room.tape?.rollId) || TAPE_ROLLS[2];
        const tapeRolls = calculateTapeRolls(totalFabricMeters, selectedTapeRoll.meters);
        const tapeTotal = tapeRolls * selectedTapeRoll.price;

        const hooksQty = calculateHooksQuantity(totalFabricMeters);
        const selectedHookType = HOOK_TYPES.find(h => h.id === room.hooks?.type) || HOOK_TYPES[0];
        const hookPacks = calculateHookPacks(hooksQty, selectedHookType.qtyPerPack);
        const hooksTotal = hookPacks * selectedHookType.pricePerPack;

        details.push({ 
          name: `Таспа (${tapeRolls} рулон)`, 
          value: formatPrice(tapeTotal) 
        });
        details.push({ 
          name: `Ілгектер (${hookPacks} қап)`, 
          value: formatPrice(hooksTotal) 
        });
        
        roomTotal += tapeTotal + hooksTotal;
      }

      // Дополнительные аксессуары
      if (extras.length > 0) {
        const extrasTotal = extras.reduce((sum, e) => sum + (e.total || 0), 0);
        details.push({ 
          name: `Қосымша (${extras.length})`, 
          value: formatPrice(extrasTotal),
          sub: extras.map(e => `${e.name}: ${e.quantity}дн`).join(', ')
        });
        roomTotal += extrasTotal;
      }

      // Установка
      const installationTotal = corniceLength > 0 ? corniceLength * installationRate : 0;
      if (installationTotal > 0) {
        details.push({ 
          name: `Орнату (${corniceLength}м × ${formatPrice(installationRate)})`, 
          value: formatPrice(installationTotal) 
        });
        roomTotal += installationTotal;
      }
    } else if (room.solutionType === 'jalousie_h' || room.solutionType === 'jalousie_v') {
      // Жалюзи — цены из констант
      const width = parseFloat(room.width) || 0;
      const height = parseFloat(room.height) || 0;
      const area = parseFloat((width * height).toFixed(2));
      const material = JALOUSIE_MATERIALS.find(m => m.id === (room.material || 'aluminum'));
      const pricePerSqm = material?.pricePerSqm || 8500;
      const productTotal = Math.round(area * pricePerSqm);
      const installTotal = room.installation?.needed ? (room.installation?.price || 4000) : 0;

      details.push({
        name: `${room.solutionType === 'jalousie_h' ? 'Көлденең' : 'Тік'} жалюзи (${area}м² × ${formatPrice(pricePerSqm)})`,
        value: formatPrice(productTotal)
      });
      if (installTotal > 0) {
        details.push({ name: 'Орнату', value: formatPrice(installTotal) });
      }
      roomTotal += productTotal + installTotal;

    } else if (room.solutionType === 'zebra') {
      // Зебра — цены из констант
      const width = parseFloat(room.width) || 0;
      const height = parseFloat(room.height) || 0;
      const area = parseFloat((width * height).toFixed(2));
      const system = ZEBRA_SYSTEMS.find(s => s.id === (room.system || 'open'));
      const pricePerSqm = system?.pricePerSqm || 6500;
      const productTotal = Math.round(area * pricePerSqm);
      const installTotal = room.installation?.needed ? (room.installation?.price || 4000) : 0;

      details.push({
        name: `Зебра ${system?.name || ''} (${area}м² × ${formatPrice(pricePerSqm)})`,
        value: formatPrice(productTotal)
      });
      if (installTotal > 0) {
        details.push({ name: 'Орнату', value: formatPrice(installTotal) });
      }
      roomTotal += productTotal + installTotal;

    } else if (room.solutionType === 'roman') {
      // Римские шторы — romanWidth = ширина + 0.1м припуск, умножаем на количество
      const width = parseFloat(room.width) || 0;
      const romanWidth = parseFloat((width + 0.1).toFixed(2));
      const quantity = room.quantity || 1;
      const fabricPrice = room.fabric?.pricePerMeter || 0;
      const fabricTotal = parseFloat((romanWidth * fabricPrice * quantity).toFixed(2));
      const mechanismTotal = (room.mechanism === 'motor' ? 25000 : 5000) * quantity;
      const systemTotal = 12000 * quantity;
      const sewingTotal = 8000 * quantity;
      const installTotal = room.installation?.needed ? (room.installation?.price || 4000) : 0;

      const quantityLabel = quantity > 1 ? ` × ${quantity} шт` : '';
      if (fabricTotal > 0) {
        details.push({
          name: `Мата (${romanWidth}м × ${formatPrice(fabricPrice)}${quantityLabel})`,
          value: formatPrice(fabricTotal)
        });
      }
      details.push({ name: `Механизм${quantityLabel}`, value: formatPrice(mechanismTotal) });
      details.push({ name: `Жүйе/Карниз${quantityLabel}`, value: formatPrice(systemTotal) });
      details.push({ name: `Тігу${quantityLabel}`, value: formatPrice(sewingTotal) });
      if (installTotal > 0) {
        details.push({ name: 'Орнату', value: formatPrice(installTotal) });
      }

      roomTotal = fabricTotal + mechanismTotal + systemTotal + sewingTotal + installTotal;
    }

    roomsTotal += roomTotal;

    return {
      name: room.name,
      solutionType: room.solutionType,
      total: roomTotal,
      details,
    };
  });

  // Итого
  const grandTotal = roomsTotal;

  const getSolutionLabel = (type) => {
    const labels = {
      classic: 'Классика',
      roman: 'Рим пердесі',
      roller: 'Рулонды',
      jalousie_h: 'Жалюзи (көл.)',
      jalousie_v: 'Жалюзи (тік)',
      zebra: 'Зебра',
      plisse: 'Плиссе',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="receipt_long" className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Жалпы смета</h2>
      </div>

      {/* Комнаты */}
      <div className="space-y-4">
        {roomsSummary.map((room, idx) => (
          <div key={idx} className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">{room.name}</h3>
                <span className="text-xs text-muted-foreground">{getSolutionLabel(room.solutionType)}</span>
              </div>
              <span className="text-lg font-bold text-primary">{formatPrice(room.total)}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              {room.details.map((detail, i) => (
                <div key={i}>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{detail.name}</span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                  {detail.sub && (
                    <p className="text-xs text-muted-foreground mt-0.5">{detail.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Пустое состояние */}
      {rooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="inventory_2" size={40} />
          <p className="mt-2">Бөлме қосылмаған</p>
        </div>
      )}

      {/* Итого */}
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
            <span className="text-lg font-bold">ЖАЛПЫ СОМА:</span>
            <span className="text-3xl font-black">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      )}

      {/* Действия */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="py-4 bg-card border-2 border-border text-foreground font-bold rounded-2xl flex items-center justify-center gap-2"
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
          Аяқтау
        </button>
      </div>
    </div>
  );
};

export default MeasurementSummary;
