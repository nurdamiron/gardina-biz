import React, { useState, useEffect } from 'react';
import { 
  calculateTapeRolls,
  calculateHooksQuantity,
  calculateHookPacks,
  TAPE_ROLLS,
  HOOK_TYPES,
  formatPrice 
} from '../../utils/calculations';
import { catalogAPI } from '../../services/api';
import Icon from '../common/Icon';

// Коэффициенты по типу товара (автоматически из категории)
const FABRIC_COEFFICIENTS = {
  curtain: 2,  // Перде ×2
  tulle: 3,    // Тюль ×3
};

/**
 * Форма для классических штор
 * - Добавление тканей по одной
 * - Пошив 1700 тг/м (редактируемый)
 * - Лента, крючки, аксессуары
 */
const ClassicCurtainForm = ({ data, onChange }) => {
  const [fabrics, setFabrics] = useState([]);
  const [cornices, setCornices] = useState([]);
  const [catalogAccessories, setCatalogAccessories] = useState([]);
  const [searchFabric, setSearchFabric] = useState('');
  const [searchCornice, setSearchCornice] = useState('');
  const [showFabricList, setShowFabricList] = useState(false);
  const [showCorniceList, setShowCorniceList] = useState(false);
  const [showAddFabric, setShowAddFabric] = useState(false);
  const [showAddAccessory, setShowAddAccessory] = useState(false);
  
  // Текущая добавляемая ткань
  const [newFabric, setNewFabric] = useState({
    fabricId: null,
    fabricName: '',
    fabricCode: '',
    fabricType: null,
    pricePerMeter: 0,
  });

  // Для добавления аксессуара
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [accessoryQty, setAccessoryQty] = useState(1);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [curtainsRes, tullesRes, cornicesRes, accessoriesRes] = await Promise.all([
        catalogAPI.searchFabrics('', 'curtain'),
        catalogAPI.searchFabrics('', 'tulle'),
        catalogAPI.searchFabrics('', 'cornice'),
        catalogAPI.searchFabrics('', 'accessory'),
      ]);
      
      const allFabrics = [
        ...(curtainsRes.data?.data || []),
        ...(tullesRes.data?.data || []),
      ];
      
      setFabrics(allFabrics);
      setCornices(cornicesRes.data?.data || []);
      setCatalogAccessories(accessoriesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const corniceLength = parseFloat(data.corniceLength) || 0;
  const sewingRateValue = data.sewingRate !== undefined && data.sewingRate !== '' ? parseInt(data.sewingRate) : 1700;
  const sewingRate = isNaN(sewingRateValue) ? 1700 : sewingRateValue;

  // Список добавленных тканей
  const fabricItems = data.fabricItems || [];

  // Расчёт метража для каждой ткани
  const calculateMeters = (fabricType) => {
    const type = fabricType || 'curtain';
    const coefficient = FABRIC_COEFFICIENTS[type] || 2;
    return Math.ceil(corniceLength * coefficient + 0.5);
  };

  const getFabricTypeLabel = (type) => {
    return type === 'tulle' ? 'Тюль' : 'Перде';
  };

  // Общий метраж всех тканей (для ленты и крючков)
  const totalFabricMeters = fabricItems.reduce((sum, item) => {
    return sum + calculateMeters(item.fabricType);
  }, 0);

  // Стоимость тканей
  const totalFabricCost = fabricItems.reduce((sum, item) => {
    const meters = calculateMeters(item.fabricType);
    return sum + (meters * (item.pricePerMeter || 0));
  }, 0);

  // Стоимость пошива
  const totalSewingCost = totalFabricMeters * sewingRate;

  // Карниз
  const corniceTotal = data.cornice?.needed 
    ? corniceLength * (data.cornice?.pricePerMeter || 0) 
    : 0;

  // Лента
  const selectedTapeRoll = TAPE_ROLLS.find(t => t.id === data.tape?.rollId) || TAPE_ROLLS[2];
  const tapeRolls = calculateTapeRolls(totalFabricMeters, selectedTapeRoll.meters);
  const tapeTotal = tapeRolls * selectedTapeRoll.price;

  // Крючки
  const hooksQty = calculateHooksQuantity(totalFabricMeters);
  const selectedHookType = HOOK_TYPES.find(h => h.id === data.hooks?.type) || HOOK_TYPES[0];
  const hookPacks = calculateHookPacks(hooksQty, selectedHookType.qtyPerPack);
  const hooksTotal = hookPacks * selectedHookType.pricePerPack;

  // Дополнительные аксессуары
  const extras = data.extras || [];
  const extrasTotal = extras.reduce((sum, e) => sum + (e.total || 0), 0);

  // Итого аксессуары
  const accessoriesTotal = (totalFabricMeters > 0 ? tapeTotal + hooksTotal : 0) + extrasTotal;

  // Установка (орнату) - за метр карниза
  const installationRate = data.installationRate !== undefined && data.installationRate !== '' 
    ? parseInt(data.installationRate) 
    : 1500;
  const installationTotal = corniceLength > 0 ? corniceLength * (isNaN(installationRate) ? 1500 : installationRate) : 0;

  // ИТОГО по комнате
  const roomTotal = totalFabricCost + totalSewingCost + corniceTotal + accessoriesTotal + installationTotal;

  // Обновление данных
  const updateData = (updates) => {
    onChange({ ...data, ...updates });
  };

  // Фильтрация каталога
  const filteredFabrics = fabrics.filter(f => 
    f.name?.toLowerCase().includes(searchFabric.toLowerCase()) ||
    f.code?.toLowerCase().includes(searchFabric.toLowerCase())
  ).slice(0, 8);

  const filteredCornices = cornices.filter(f => 
    f.name?.toLowerCase().includes(searchCornice.toLowerCase()) ||
    f.code?.toLowerCase().includes(searchCornice.toLowerCase())
  ).slice(0, 5);

  // Выбор ткани
  const selectFabricToAdd = (fabric) => {
    setNewFabric({
      fabricId: fabric.id,
      fabricName: fabric.name,
      fabricCode: fabric.code,
      fabricType: fabric.type,
      pricePerMeter: fabric.pricePerMeter,
    });
    setSearchFabric(fabric.name);
    setShowFabricList(false);
  };

  // Добавление ткани
  const addFabricItem = () => {
    if (!newFabric.fabricId) return;

    const updatedItems = [
      ...fabricItems,
      {
        id: `fabric_${Date.now()}`,
        ...newFabric,
      }
    ];

    updateData({ fabricItems: updatedItems });
    
    setNewFabric({
      fabricId: null,
      fabricName: '',
      fabricCode: '',
      fabricType: null,
      pricePerMeter: 0,
    });
    setSearchFabric('');
    setShowAddFabric(false);
  };

  // Удаление ткани
  const removeFabricItem = (itemId) => {
    updateData({
      fabricItems: fabricItems.filter(item => item.id !== itemId)
    });
  };

  // Выбор карниза
  const selectCornice = (cornice) => {
    updateData({
      cornice: {
        ...data.cornice,
        needed: true,
        productId: cornice.id,
        productName: cornice.name,
        productCode: cornice.code,
        pricePerMeter: cornice.pricePerMeter,
      }
    });
    setSearchCornice(cornice.name);
    setShowCorniceList(false);
  };

  // Добавление аксессуара
  const getSelectedAccessoryData = () => {
    if (!selectedAccessory) return null;
    return catalogAccessories.find(a => a.id === selectedAccessory);
  };

  const addAccessory = () => {
    const accessory = getSelectedAccessoryData();
    if (!accessory) return;

    const qty = accessoryQty || 1;
    const newExtra = {
      id: `${accessory.id}_${Date.now()}`,
      productId: accessory.id,
      name: accessory.name,
      code: accessory.code,
      unit: accessory.unit || 'дн',
      quantity: qty,
      unitPrice: accessory.pricePerMeter || accessory.price || 0,
      total: qty * (accessory.pricePerMeter || accessory.price || 0),
    };

    updateData({
      extras: [...extras, newExtra]
    });

    setShowAddAccessory(false);
    setSelectedAccessory('');
    setAccessoryQty(1);
  };

  const removeAccessory = (id) => {
    updateData({
      extras: extras.filter(e => e.id !== id)
    });
  };

  const selectedAccessoryItem = getSelectedAccessoryData();

  return (
    <div className="space-y-6">
      {/* Размеры */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="straighten" className="text-primary" />
          <h3 className="font-bold text-gray-900">Өлшемдер</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Карниз ұзындығы
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={data.corniceLength || ''}
                onChange={(e) => updateData({ corniceLength: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all text-xl font-bold"
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">м</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Биіктігі
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={data.ceilingHeight || ''}
                onChange={(e) => updateData({ ceilingHeight: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all text-xl font-bold"
                placeholder="2.70"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">м</span>
            </div>
          </div>
        </div>
      </div>

      {/* Добавленные ткани */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="texture" className="text-amber-600" />
            <h3 className="font-bold text-gray-900">Маталар</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddFabric(true)}
            className="text-primary font-bold text-sm flex items-center gap-1"
          >
            <Icon name="add" size={20} />
            Қосу
          </button>
        </div>

        {fabricItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon name="inventory_2" size={32} />
            <p className="text-sm mt-2">Мата қосылмаған</p>
            <button
              type="button"
              onClick={() => setShowAddFabric(true)}
              className="mt-3 text-primary font-bold text-sm"
            >
              + Мата қосу
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fabricItems.map((item) => {
              const meters = calculateMeters(item.fabricType);
              const coefficient = FABRIC_COEFFICIENTS[item.fabricType] || 2;
              const itemTotal = meters * (item.pricePerMeter || 0);

              return (
                <div 
                  key={item.id}
                  className="p-4 bg-amber-50 rounded-xl border border-amber-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.fabricType === 'tulle' 
                          ? 'text-primary bg-primary/10' 
                          : 'text-amber-600 bg-amber-100'
                      }`}>
                        {getFabricTypeLabel(item.fabricType)} ×{coefficient}
                      </span>
                      <p className="font-bold text-gray-900 mt-1">{item.fabricName}</p>
                      <p className="text-xs text-gray-500">{item.fabricCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFabricItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {meters} м × {formatPrice(item.pricePerMeter)}
                    </span>
                    <span className="font-bold text-amber-700">{formatPrice(itemTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Пошив */}
      {fabricItems.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="cut" className="text-primary" />
            <h3 className="font-bold text-gray-900">Тігу</h3>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Тігу бағасы (1 метр үшін)
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.sewingRate ?? 1700}
                onChange={(e) => updateData({ sewingRate: e.target.value === '' ? '' : parseInt(e.target.value) })}
                placeholder="1700"
                className="w-full h-12 px-4 pr-16 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₸/м</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Күрделі тігу үшін бағаны өзгертуге болады</p>
          </div>

          <div className="p-3 bg-primary/5 rounded-xl border border-primary/15">
            <div className="flex justify-between items-center">
              <span className="text-primary-dark">
                {totalFabricMeters} м × {formatPrice(sewingRate)}
              </span>
              <span className="text-lg font-bold text-primary-dark">{formatPrice(totalSewingCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Карниз */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="horizontal_rule" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Карниз</h3>
          {corniceTotal > 0 && (
            <span className="ml-auto text-sm font-bold text-green-600">{formatPrice(corniceTotal)}</span>
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => updateData({ cornice: { ...data.cornice, needed: true } })}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              data.cornice?.needed
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Керек
          </button>
          <button
            type="button"
            onClick={() => updateData({ cornice: { needed: false } })}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              data.cornice?.needed === false
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Бар (орнатылған)
          </button>
        </div>

        {data.cornice?.needed && (
          <div className="relative">
            <input
              type="text"
              value={searchCornice}
              onChange={(e) => {
                setSearchCornice(e.target.value);
                setShowCorniceList(true);
              }}
              onFocus={() => setShowCorniceList(true)}
              className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl 
                focus:bg-white focus:border-primary transition-all"
              placeholder="Карниз таңдау..."
            />
            
            {showCorniceList && filteredCornices.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                {filteredCornices.map(cornice => (
                  <button
                    key={cornice.id}
                    type="button"
                    onClick={() => selectCornice(cornice)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{cornice.name}</p>
                      <p className="text-xs text-gray-500">{cornice.code}</p>
                    </div>
                    <span className="font-bold text-primary">{formatPrice(cornice.pricePerMeter)}/м</span>
                  </button>
                ))}
              </div>
            )}

            {data.cornice?.productName && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{data.cornice.productName}</p>
                    <p className="text-xs text-gray-500">{corniceLength} м × {formatPrice(data.cornice.pricePerMeter)}</p>
                  </div>
                  <span className="font-bold text-gray-700">{formatPrice(corniceTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Лента и Крючки - компактно */}
      {totalFabricMeters > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="inventory_2" className="text-primary" />
            <h3 className="font-bold text-gray-900">Таспа / Ілгек</h3>
          </div>

          <div className="space-y-3">
            {/* Лента */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon name="straighten" className="text-primary" />
                <div>
                  <p className="font-bold text-gray-900">Таспа 50м</p>
                  <p className="text-xs text-gray-500">{totalFabricMeters}м керек = {tapeRolls} рулон</p>
                </div>
              </div>
              <span className="font-bold text-primary-dark">{formatPrice(tapeTotal)}</span>
            </div>

            {/* Крючки */}
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon name="link" className="text-primary" />
                <div>
                  <p className="font-bold text-gray-900">Ілгек (пластик)</p>
                  <p className="text-xs text-gray-500">{hooksQty} дн керек = {hookPacks} қап</p>
                </div>
              </div>
              <span className="font-bold text-primary-dark">{formatPrice(hooksTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Дополнительные аксессуары */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="add_circle" className="text-amber-500" />
            <h3 className="font-bold text-gray-900">Қосымша</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAccessory(true)}
            className="text-primary font-bold text-sm flex items-center gap-1"
          >
            <Icon name="add" size={20} />
            Қосу
          </button>
        </div>

        {extras.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Қосымша аксессуар жоқ</p>
        ) : (
          <div className="space-y-2">
            {extras.map(extra => (
              <div key={extra.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="font-bold text-gray-900">{extra.name}</p>
                  <p className="text-xs text-gray-500">{extra.quantity} {extra.unit} × {formatPrice(extra.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-700">{formatPrice(extra.total)}</span>
                  <button
                    type="button"
                    onClick={() => removeAccessory(extra.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Установка (Орнату) */}
      {corniceLength > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="build" className="text-green-600" />
            <h3 className="font-bold text-gray-900">Орнату</h3>
            <span className="ml-auto text-sm font-bold text-green-600">{formatPrice(installationTotal)}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Орнату бағасы (1 метр үшін)
            </label>
            <div className="relative">
              <input
                type="number"
                value={data.installationRate ?? 1500}
                onChange={(e) => updateData({ installationRate: e.target.value === '' ? '' : parseInt(e.target.value) })}
                placeholder="1500"
                className="w-full h-12 px-4 pr-16 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₸/м</span>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex justify-between items-center">
              <span className="text-green-700">
                {corniceLength} м × {formatPrice(installationRate)}
              </span>
              <span className="text-lg font-bold text-green-800">{formatPrice(installationTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Итого по комнате */}
      {roomTotal > 0 && (
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <div className="space-y-2 text-sm mb-3">
            {totalFabricCost > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Маталар ({fabricItems.length})</span>
                <span className="font-bold text-green-800">{formatPrice(totalFabricCost)}</span>
              </div>
            )}
            {totalSewingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Тігу ({totalFabricMeters} м)</span>
                <span className="font-bold text-green-800">{formatPrice(totalSewingCost)}</span>
              </div>
            )}
            {corniceTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Карниз</span>
                <span className="font-bold text-green-800">{formatPrice(corniceTotal)}</span>
              </div>
            )}
            {totalFabricMeters > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-green-700">Таспа ({tapeRolls} рулон)</span>
                  <span className="font-bold text-green-800">{formatPrice(tapeTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Ілгектер ({hookPacks} қап)</span>
                  <span className="font-bold text-green-800">{formatPrice(hooksTotal)}</span>
                </div>
              </>
            )}
            {extrasTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Қосымша</span>
                <span className="font-bold text-green-800">{formatPrice(extrasTotal)}</span>
              </div>
            )}
            {installationTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Орнату</span>
                <span className="font-bold text-green-800">{formatPrice(installationTotal)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-green-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-green-800">Бөлме барлығы:</span>
            <span className="text-2xl font-black text-green-700">{formatPrice(roomTotal)}</span>
          </div>
        </div>
      )}

      {/* Модалка добавления ткани */}
      {showAddFabric && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddFabric(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Мата қосу</h3>
              <button 
                onClick={() => setShowAddFabric(false)} 
                className="size-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <Icon name="close" size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Мата таңдау</label>
                <div className="relative">
                  <Icon name="search" className="text-gray-400" />
                  <input
                    type="text"
                    value={searchFabric}
                    onChange={(e) => {
                      setSearchFabric(e.target.value);
                      setShowFabricList(true);
                    }}
                    onFocus={() => setShowFabricList(true)}
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent rounded-xl 
                      focus:bg-white focus:border-primary transition-all text-lg"
                    placeholder="Мата іздеу..."
                  />
                </div>
                
                {showFabricList && filteredFabrics.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    {filteredFabrics.map(fabric => (
                      <button
                        key={fabric.id}
                        type="button"
                        onClick={() => selectFabricToAdd(fabric)}
                        className={`w-full px-4 py-3 text-left border-b last:border-0 border-gray-100 flex items-center gap-3 transition-colors ${
                          newFabric.fabricId === fabric.id ? 'bg-primary/10' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{fabric.name}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              fabric.type === 'tulle' 
                                ? 'text-primary bg-primary/10' 
                                : 'text-amber-600 bg-amber-100'
                            }`}>
                              {fabric.type === 'tulle' ? 'Тюль' : 'Перде'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{fabric.code}</p>
                        </div>
                        <span className="font-bold text-primary">{formatPrice(fabric.pricePerMeter)}/м</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {newFabric.fabricName && corniceLength > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="check_circle" className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">Таңдалды</span>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${
                      newFabric.fabricType === 'tulle' 
                        ? 'text-primary bg-primary/10' 
                        : 'text-amber-600 bg-amber-100'
                    }`}>
                      {getFabricTypeLabel(newFabric.fabricType)} ×{FABRIC_COEFFICIENTS[newFabric.fabricType] || 2}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900">{newFabric.fabricName}</p>
                  <p className="text-xs text-gray-500 mb-3">{newFabric.fabricCode}</p>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">{calculateMeters(newFabric.fabricType)} м × {formatPrice(newFabric.pricePerMeter)}</span>
                    <span className="text-lg font-black text-green-700">
                      {formatPrice(calculateMeters(newFabric.fabricType) * newFabric.pricePerMeter)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={addFabricItem}
                disabled={!newFabric.fabricId}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  shadow-lg shadow-primary/30"
              >
                <Icon name="add" />
                Қосу
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления аксессуара */}
      {showAddAccessory && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowAddAccessory(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Аксессуар қосу</h3>
              <button 
                onClick={() => setShowAddAccessory(false)} 
                className="size-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <Icon name="close" size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Өнім таңдау</label>
                
                {catalogAccessories.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Icon name="inventory_2" size={32} />
                    <p className="text-sm mt-2">Каталогта аксессуар жоқ</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {catalogAccessories.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccessory(acc.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                          selectedAccessory === acc.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{acc.name}</p>
                          <p className={`text-xs ${selectedAccessory === acc.id ? 'text-white/70' : 'text-gray-500'}`}>
                            {acc.code}
                          </p>
                        </div>
                        <span className={`font-bold ${selectedAccessory === acc.id ? 'text-white' : 'text-primary'}`}>
                          {formatPrice(acc.pricePerMeter || acc.price || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedAccessory && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Саны</label>
                  <input
                    type="number"
                    min="1"
                    value={accessoryQty === '' ? '' : accessoryQty}
                    onChange={(e) => setAccessoryQty(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="1"
                    className="w-full h-14 px-4 bg-gray-50 border-2 border-transparent rounded-xl 
                      focus:bg-white focus:border-primary transition-all text-xl font-bold text-center"
                  />
                </div>
              )}

              {selectedAccessoryItem && (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="check_circle" className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">Таңдалды</span>
                  </div>
                  <p className="font-bold text-gray-900">{selectedAccessoryItem.name}</p>
                  <div className="flex justify-between items-center mt-3 p-3 bg-white rounded-lg">
                    <span className="text-gray-600">
                      {accessoryQty || 1} × {formatPrice(selectedAccessoryItem.pricePerMeter || selectedAccessoryItem.price || 0)}
                    </span>
                    <span className="text-lg font-black text-green-700">
                      {formatPrice((accessoryQty || 1) * (selectedAccessoryItem.pricePerMeter || selectedAccessoryItem.price || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={addAccessory}
                disabled={!selectedAccessory}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  shadow-lg shadow-primary/30"
              >
                <Icon name="add" />
                Қосу
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassicCurtainForm;
