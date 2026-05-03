import React, { useState, useEffect } from 'react';
import { 
  calculateRomanWidth,
  ROMAN_MECHANISMS,
  formatPrice 
} from '../../utils/calculations';
import { catalogAPI } from '../../services/api';
import Icon from '../common/Icon';

/**
 * Форма для римских штор
 */
const RomanShadeForm = ({ data, onChange }) => {
  const [fabrics, setFabrics] = useState([]);
  const [searchFabric, setSearchFabric] = useState('');
  const [showFabricList, setShowFabricList] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      // Для римских штор загружаем только ткани (перде)
      const res = await catalogAPI.searchFabrics('', 'curtain');
      setFabrics(res.data?.data || []);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const width = parseFloat(data.width) || 0;
  const romanWidth = calculateRomanWidth(width);
  const quantity = data.quantity || 1;

  // Расчёты (умножаем на количество штор)
  const fabricTotal = romanWidth * (data.fabric?.pricePerMeter || 0) * quantity;
  const mechanism = ROMAN_MECHANISMS.find(m => m.id === data.mechanism);
  const mechanismTotal = (mechanism?.price || 0) * quantity;
  const systemTotal = 12000 * quantity;
  const sewingTotal = 8000 * quantity;
  const installPrice = data.installation?.needed ? (data.installation?.price || 4000) : 0;

  const roomTotal = fabricTotal + mechanismTotal + systemTotal + sewingTotal + installPrice;

  const updateData = (updates) => {
    onChange({ ...data, ...updates });
  };

  const filteredFabrics = fabrics.filter(f => 
    (f.name?.toLowerCase().includes(searchFabric.toLowerCase()) ||
     f.code?.toLowerCase().includes(searchFabric.toLowerCase()))
  ).slice(0, 5);

  const selectFabric = (fabric) => {
    updateData({
      fabric: {
        fabricId: fabric.id,
        fabricName: fabric.name,
        fabricCode: fabric.code,
        pricePerMeter: fabric.pricePerMeter,
      }
    });
    setSearchFabric(fabric.name);
    setShowFabricList(false);
  };

  return (
    <div className="space-y-6">
      {/* Размеры */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="straighten" className="text-primary" />
          <h3 className="font-bold text-gray-900">Терезе өлшемі</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Ені</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={data.width || ''}
                onChange={(e) => updateData({ width: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all text-xl font-bold"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">м</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Биіктігі</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={data.height || ''}
                onChange={(e) => updateData({ height: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-gray-50 border-2 border-transparent rounded-xl 
                  focus:bg-white focus:border-primary transition-all text-xl font-bold"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">м</span>
            </div>
          </div>
        </div>

        {width > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/15">
            <div className="flex justify-between items-center">
              <span className="text-primary-dark">Мата ені (+ 10см):</span>
              <span className="text-xl font-bold text-primary-dark">{romanWidth} м</span>
            </div>
          </div>
        )}
      </div>

      {/* Количество штор */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="grid_view" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Штора саны</h3>
        </div>

        <div className="flex gap-3">
          {[1, 2, 3].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => updateData({ quantity: num })}
              className={`flex-1 py-3 rounded-xl font-bold text-xl transition-all ${
                data.quantity === num
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Ткань */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="texture" className="text-amber-600" />
          <h3 className="font-bold text-gray-900">Мата</h3>
          {fabricTotal > 0 && (
            <span className="ml-auto text-sm font-bold text-green-600">{formatPrice(fabricTotal)}</span>
          )}
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchFabric}
            onChange={(e) => {
              setSearchFabric(e.target.value);
              setShowFabricList(true);
            }}
            onFocus={() => setShowFabricList(true)}
            className="w-full h-12 px-4 bg-gray-50 border-2 border-transparent rounded-xl 
              focus:bg-white focus:border-primary transition-all"
            placeholder="Мата іздеу..."
          />
          
          {showFabricList && filteredFabrics.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              {filteredFabrics.map(fabric => (
                <button
                  key={fabric.id}
                  type="button"
                  onClick={() => selectFabric(fabric)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-0 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-gray-900">{fabric.name}</p>
                    <p className="text-xs text-gray-500">{fabric.code}</p>
                  </div>
                  <span className="font-bold text-primary">{formatPrice(fabric.pricePerMeter)}/м</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {data.fabric?.fabricName && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{data.fabric.fabricName}</p>
                <p className="text-xs text-gray-500">{data.fabric.fabricCode}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateData({ fabric: null });
                  setSearchFabric('');
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>{romanWidth} м × {formatPrice(data.fabric.pricePerMeter)}</span>
              <span className="font-bold text-amber-700">{formatPrice(fabricTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Механизм */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="settings" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Механизм</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ROMAN_MECHANISMS.map(mech => (
            <button
              key={mech.id}
              type="button"
              onClick={() => updateData({ mechanism: mech.id })}
              className={`py-4 rounded-xl font-bold transition-all ${
                data.mechanism === mech.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="block">{mech.name}</span>
              <span className="block text-xs opacity-70 mt-1">{formatPrice(mech.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Система/Карниз */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="horizontal_rule" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Рим жүйесі</h3>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
          <span className="text-gray-700">Стандарт жүйе</span>
          <span className="font-bold text-gray-900">{formatPrice(systemTotal)}</span>
        </div>
      </div>

      {/* Пошив */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="cut" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Тігу</h3>
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
          <span className="text-gray-700">Рим пердесін тігу</span>
          <span className="font-bold text-gray-900">{formatPrice(sewingTotal)}</span>
        </div>
      </div>

      {/* Монтаж */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="build" className="text-gray-600" />
          <h3 className="font-bold text-gray-900">Орнату</h3>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            role="checkbox"
            aria-checked={data.installation?.needed || false}
            onClick={() => updateData({
              installation: {
                ...data.installation,
                needed: !data.installation?.needed,
                price: data.installation?.price || 4000,
              }
            })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
              data.installation?.needed ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
              data.installation?.needed ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
          <span className="font-medium text-gray-700">Орнату керек</span>
          {data.installation?.needed && (
            <span className="ml-auto font-bold text-gray-600">{formatPrice(installPrice)}</span>
          )}
        </label>
      </div>

      {/* Итого */}
      {roomTotal > 0 && (
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <div className="space-y-2 text-sm mb-3">
            {fabricTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Мата</span>
                <span className="font-bold text-green-800">{formatPrice(fabricTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-green-700">Механизм</span>
              <span className="font-bold text-green-800">{formatPrice(mechanismTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Жүйе</span>
              <span className="font-bold text-green-800">{formatPrice(systemTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Тігу</span>
              <span className="font-bold text-green-800">{formatPrice(sewingTotal)}</span>
            </div>
            {installPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-green-700">Орнату</span>
                <span className="font-bold text-green-800">{formatPrice(installPrice)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-green-200 pt-3 flex justify-between items-center">
            <span className="font-bold text-green-800">Барлығы:</span>
            <span className="text-2xl font-black text-green-700">{formatPrice(roomTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RomanShadeForm;

