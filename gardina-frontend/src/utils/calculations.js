/**
 * Утилиты для автоматических расчётов замеров
 */

// ═══════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════

export const SOLUTION_TYPES = [
  { id: 'classic', name: 'Классикалық перде', icon: 'curtains' },
  { id: 'roman', name: 'Рим пердесі', icon: 'blinds' },
  { id: 'roller', name: 'Рулонды перде', icon: 'roller_shades' },
  { id: 'jalousie_h', name: 'Жалюзи (көлденең)', icon: 'blinds' },
  { id: 'jalousie_v', name: 'Жалюзи (тік)', icon: 'vertical_shades' },
  { id: 'zebra', name: 'Күн-түн (Зебра)', icon: 'gradient' },
  { id: 'plisse', name: 'Плиссе', icon: 'view_agenda' },
];

export const SEWING_TYPES = [
  { id: 'tape', name: 'Шторная лента', rate: 800 },
  { id: 'luyvers', name: 'Люверс', rate: 1200 },
  { id: 'kant', name: 'Кант', rate: 1500 },
];

// Дефолтная ставка пошива
export const DEFAULT_SEWING_RATE = 1700; // тг/метр

// Коэффициенты для разных типов тканей
export const FABRIC_COEFFICIENTS = {
  curtain: 2,  // Перде ×2
  tulle: 3,    // Тюль ×3
};

export const TAPE_ROLLS = [
  { id: 'tape_10m', name: 'Таспа 10м', meters: 10, price: 2000 },
  { id: 'tape_25m', name: 'Таспа 25м', meters: 25, price: 4500 },
  { id: 'tape_50m', name: 'Таспа 50м', meters: 50, price: 8000 },
];

export const HOOK_TYPES = [
  { id: 'plastic', name: 'Пластик', pricePerPack: 500, qtyPerPack: 100 },
  { id: 'metal', name: 'Темір', pricePerPack: 1500, qtyPerPack: 100 },
];

export const JALOUSIE_MATERIALS = [
  { id: 'aluminum', name: 'Алюминий', pricePerSqm: 8500 },
  { id: 'wood', name: 'Ағаш', pricePerSqm: 15000 },
  { id: 'plastic', name: 'Пластик', pricePerSqm: 6000 },
];

export const JALOUSIE_SLATS = [
  { id: 16, name: '16мм' },
  { id: 25, name: '25мм' },
  { id: 50, name: '50мм' },
];

export const ZEBRA_SYSTEMS = [
  { id: 'open', name: 'Ашық (бюджет)', pricePerSqm: 6500 },
  { id: 'cassette', name: 'Кассета (премиум)', pricePerSqm: 9000 },
];

export const ROMAN_MECHANISMS = [
  { id: 'chain', name: 'Тізбек (цепочка)', price: 5000 },
  { id: 'motor', name: 'Мотор (пульт)', price: 25000 },
];

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ МЕТРАЖА ТКАНИ
// ═══════════════════════════════════════════════════════════════

/**
 * Расчёт метража для перде (ткань)
 * Формула: ceil(длина × 2 + 0.5)
 */
export const calculateCurtainMeters = (corniceLength) => {
  if (!corniceLength || corniceLength <= 0) return 0;
  return Math.ceil(corniceLength * 2 + 0.5);
};

/**
 * Расчёт метража для тюль
 * Формула: ceil(длина × 3 + 0.5)
 */
export const calculateTulleMeters = (corniceLength) => {
  if (!corniceLength || corniceLength <= 0) return 0;
  return Math.ceil(corniceLength * 3 + 0.5);
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ ЛЕНТЫ
// ═══════════════════════════════════════════════════════════════

/**
 * Общий метраж ленты = сумма всех метров тканей
 */
export const calculateTotalTapeMeters = (rooms) => {
  return rooms.reduce((total, room) => {
    if (room.solutionType !== 'classic') return total;
    
    const corniceLength = parseFloat(room.corniceLength) || 0;
    const fabricItems = room.fabricItems || [];
    
    const roomMeters = fabricItems.reduce((sum, item) => {
      return sum + calculateFabricMeters(corniceLength, item.fabricType || item.type);
    }, 0);
    
    return total + roomMeters;
  }, 0);
};

/**
 * Количество рулонов ленты
 */
export const calculateTapeRolls = (totalMeters, rollSize = 50) => {
  if (totalMeters <= 0) return 0;
  return Math.ceil(totalMeters / rollSize);
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ КРЮЧКОВ
// ═══════════════════════════════════════════════════════════════

/**
 * Количество крючков = метраж ленты × 5
 */
export const calculateHooksQuantity = (tapeMeters) => {
  return Math.ceil(tapeMeters * 5);
};

/**
 * Количество упаковок крючков
 */
export const calculateHookPacks = (totalHooks, packSize = 100) => {
  if (totalHooks <= 0) return 0;
  return Math.ceil(totalHooks / packSize);
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ ПОШИВА
// ═══════════════════════════════════════════════════════════════

/**
 * Стоимость пошива = метраж × тариф
 */
export const calculateSewingCost = (meters, sewingType) => {
  const type = SEWING_TYPES.find(t => t.id === sewingType);
  if (!type) return 0;
  return meters * type.rate;
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ ДЛЯ ЖАЛЮЗИ / ЗЕБРА
// ═══════════════════════════════════════════════════════════════

/**
 * Площадь окна
 */
export const calculateArea = (width, height) => {
  return parseFloat((width * height).toFixed(2));
};

/**
 * Стоимость жалюзи
 */
export const calculateJalousieCost = (area, material) => {
  const mat = JALOUSIE_MATERIALS.find(m => m.id === material);
  if (!mat) return 0;
  return Math.round(area * mat.pricePerSqm);
};

/**
 * Стоимость зебры
 */
export const calculateZebraCost = (area, system) => {
  const sys = ZEBRA_SYSTEMS.find(s => s.id === system);
  if (!sys) return 0;
  return Math.round(area * sys.pricePerSqm);
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ ДЛЯ РИМСКИХ ШТОР
// ═══════════════════════════════════════════════════════════════

/**
 * Ширина римской шторы = ширина окна + припуск
 */
export const calculateRomanWidth = (windowWidth, margin = 0.1) => {
  return parseFloat((windowWidth + margin).toFixed(2));
};

// ═══════════════════════════════════════════════════════════════
// РАСЧЁТ МОНТАЖА
// ═══════════════════════════════════════════════════════════════

/**
 * Монтаж за комнату
 */
export const calculateInstallationByRoom = (roomCount, ratePerRoom = 5000) => {
  return roomCount * ratePerRoom;
};

/**
 * Монтаж за метр
 */
export const calculateInstallationByMeter = (totalMeters, ratePerMeter = 1000) => {
  return Math.round(totalMeters * ratePerMeter);
};

// ═══════════════════════════════════════════════════════════════
// ОБЩИЙ РАСЧЁТ КОМНАТЫ
// ═══════════════════════════════════════════════════════════════

/**
 * Расчёт метража для ткани по типу
 */
export const calculateFabricMeters = (corniceLength, fabricType) => {
  const coefficient = FABRIC_COEFFICIENTS[fabricType] || 2;
  return Math.ceil(corniceLength * coefficient + 0.5);
};

/**
 * Полный расчёт для классических штор
 * Новая структура с fabricItems и sewingRate
 */
export const calculateClassicRoom = (room) => {
  const corniceLength = parseFloat(room.corniceLength) || 0;
  const sewingRate = room.sewingRate || DEFAULT_SEWING_RATE;
  const fabricItems = room.fabricItems || [];
  
  // Расчёт по каждой ткани
  let totalFabricMeters = 0;
  let totalFabricCost = 0;
  
  fabricItems.forEach(item => {
    const meters = calculateFabricMeters(corniceLength, item.fabricType || item.type);
    totalFabricMeters += meters;
    totalFabricCost += meters * (item.pricePerMeter || 0);
  });
  
  // Пошив
  const sewingTotal = totalFabricMeters * sewingRate;
  
  // Карниз
  const corniceTotal = room.cornice?.needed 
    ? corniceLength * (room.cornice?.pricePerMeter || 0)
    : 0;
  
  return {
    totalFabricMeters,
    totalFabricCost,
    sewingTotal,
    corniceTotal,
    roomTotal: totalFabricCost + sewingTotal + corniceTotal,
  };
};

/**
 * Полный расчёт для жалюзи
 */
export const calculateJalousieRoom = (room) => {
  const width = parseFloat(room.width) || 0;
  const height = parseFloat(room.height) || 0;
  const area = calculateArea(width, height);
  
  const productTotal = calculateJalousieCost(area, room.material || 'aluminum');
  const installTotal = room.installation?.needed ? (room.installation?.price || 3000) : 0;
  
  return {
    area,
    productTotal,
    installTotal,
    roomTotal: productTotal + installTotal,
  };
};

/**
 * Полный расчёт для зебры
 */
export const calculateZebraRoom = (room) => {
  const width = parseFloat(room.width) || 0;
  const height = parseFloat(room.height) || 0;
  const area = calculateArea(width, height);
  
  const productTotal = calculateZebraCost(area, room.system || 'open');
  const installTotal = room.installation?.needed ? (room.installation?.price || 4000) : 0;
  
  return {
    area,
    productTotal,
    installTotal,
    roomTotal: productTotal + installTotal,
  };
};

/**
 * Полный расчёт для римских штор
 */
export const calculateRomanRoom = (room) => {
  const width = parseFloat(room.width) || 0;
  const romanWidth = calculateRomanWidth(width);
  
  // Ткань
  const fabricPrice = room.fabric?.pricePerMeter || 0;
  const fabricTotal = romanWidth * fabricPrice;
  
  // Механизм
  const mechanism = ROMAN_MECHANISMS.find(m => m.id === room.mechanism);
  const mechanismTotal = mechanism?.price || 0;
  
  // Система/карниз
  const systemTotal = room.system?.price || 12000;
  
  // Пошив
  const sewingTotal = room.sewing || 8000;
  
  const installTotal = room.installation?.needed ? (room.installation?.price || 4000) : 0;
  
  return {
    romanWidth,
    fabricTotal,
    mechanismTotal,
    systemTotal,
    sewingTotal,
    installTotal,
    roomTotal: fabricTotal + mechanismTotal + systemTotal + sewingTotal + installTotal,
  };
};

// ═══════════════════════════════════════════════════════════════
// ОБЩИЙ РАСЧЁТ ЗАМЕРА
// ═══════════════════════════════════════════════════════════════

/**
 * Полный расчёт всего замера
 */
export const calculateMeasurementTotal = (rooms, accessories, settings = {}) => {
  let roomsTotal = 0;
  let totalTapeMeters = 0;
  let totalCorniceMeters = 0;
  let classicRoomCount = 0;
  
  // Расчёт по комнатам
  rooms.forEach(room => {
    let calc;
    
    switch (room.solutionType) {
      case 'classic':
        calc = calculateClassicRoom(room);
        totalTapeMeters += calc.totalFabricMeters;
        totalCorniceMeters += parseFloat(room.corniceLength) || 0;
        classicRoomCount++;
        break;
      case 'jalousie_h':
      case 'jalousie_v':
        calc = calculateJalousieRoom(room);
        break;
      case 'zebra':
        calc = calculateZebraRoom(room);
        break;
      case 'roman':
        calc = calculateRomanRoom(room);
        break;
      default:
        calc = { roomTotal: 0 };
    }
    
    roomsTotal += calc.roomTotal;
  });
  
  // Аксессуары (только для классических штор)
  let accessoriesTotal = 0;
  
  if (totalTapeMeters > 0) {
    // Лента
    const tapeRoll = TAPE_ROLLS.find(t => t.id === accessories.tape?.rollId) || TAPE_ROLLS[2];
    const tapeRolls = calculateTapeRolls(totalTapeMeters, tapeRoll.meters);
    const tapeTotal = tapeRolls * tapeRoll.price;
    
    // Крючки
    const hooksQty = calculateHooksQuantity(totalTapeMeters);
    const hookType = HOOK_TYPES.find(h => h.id === accessories.hooks?.type) || HOOK_TYPES[0];
    const hookPacks = calculateHookPacks(hooksQty, hookType.qtyPerPack);
    const hooksTotal = hookPacks * hookType.pricePerPack;
    
    accessoriesTotal = tapeTotal + hooksTotal;
    
    // Дополнительные аксессуары
    if (accessories.extras && accessories.extras.length > 0) {
      accessories.extras.forEach(extra => {
        accessoriesTotal += extra.total || 0;
      });
    }
  }
  
  // Монтаж
  let installationTotal = 0;
  if (settings.installationMethod === 'per_room') {
    installationTotal = calculateInstallationByRoom(
      rooms.length, 
      settings.installationRatePerRoom || 5000
    );
  } else {
    installationTotal = calculateInstallationByMeter(
      totalCorniceMeters,
      settings.installationRatePerMeter || 1000
    );
  }
  
  // Доставка
  const deliveryTotal = settings.delivery || 0;
  
  return {
    roomsTotal,
    totalTapeMeters,
    totalCorniceMeters,
    accessoriesTotal,
    installationTotal,
    deliveryTotal,
    grandTotal: roomsTotal + accessoriesTotal + installationTotal + deliveryTotal,
  };
};

// ═══════════════════════════════════════════════════════════════
// ФОРМАТИРОВАНИЕ
// ═══════════════════════════════════════════════════════════════

/**
 * Форматирование цены
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('kk-KZ').format(Math.round(price)) + ' ₸';
};

/**
 * Форматирование метров
 */
export const formatMeters = (meters) => {
  return `${meters} м`;
};

