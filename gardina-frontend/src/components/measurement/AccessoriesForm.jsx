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

/**
 * Компонент аксессуаров (лента, крючки, дополнительные)
 * Аксессуары загружаются из каталога
 */
const AccessoriesForm = ({ totalTapeMeters, data, onChange }) => {
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState('');
  const [extraQty, setExtraQty] = useState(1);
  const [catalogAccessories, setCatalogAccessories] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Загрузка аксессуаров из каталога
  useEffect(() => {
    loadAccessories();
  }, []);

  const loadAccessories = async () => {
    try {
      setLoadingCatalog(true);
      const response = await catalogAPI.searchFabrics('', 'accessory');
      setCatalogAccessories(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load accessories:', error);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // Лента
  const selectedTapeRoll = TAPE_ROLLS.find(t => t.id === data.tape?.rollId) || TAPE_ROLLS[2]; // default 50m
  const tapeRolls = calculateTapeRolls(totalTapeMeters, selectedTapeRoll.meters);
  const tapeTotal = tapeRolls * selectedTapeRoll.price;

  // Крючки
  const hooksQty = calculateHooksQuantity(totalTapeMeters);
  const selectedHookType = HOOK_TYPES.find(h => h.id === data.hooks?.type) || HOOK_TYPES[0]; // default plastic
  const hookPacks = calculateHookPacks(hooksQty, selectedHookType.qtyPerPack);
  const hooksTotal = hookPacks * selectedHookType.pricePerPack;

  // Дополнительные
  const extras = data.extras || [];
  const extrasTotal = extras.reduce((sum, e) => sum + (e.total || 0), 0);

  const accessoriesTotal = tapeTotal + hooksTotal + extrasTotal;

  const updateData = (updates) => {
    onChange({ ...data, ...updates });
  };

  const getSelectedAccessory = () => {
    if (!selectedExtra) return null;
    return catalogAccessories.find(a => a.id === selectedExtra);
  };

  const addExtra = () => {
    const accessory = getSelectedAccessory();
    if (!accessory) return;

    const newExtra = {
      id: `${accessory.id}_${Date.now()}`,
      productId: accessory.id,
      name: accessory.name,
      code: accessory.code,
      unit: accessory.unit || 'дн',
      quantity: extraQty,
      unitPrice: accessory.pricePerMeter || accessory.price || 0,
      total: extraQty * (accessory.pricePerMeter || accessory.price || 0),
    };

    updateData({
      extras: [...extras, newExtra]
    });

    setShowAddExtra(false);
    setSelectedExtra('');
    setExtraQty(1);
  };

  const removeExtra = (id) => {
    updateData({
      extras: extras.filter(e => e.id !== id)
    });
  };

  if (totalTapeMeters <= 0) {
    return null; // Не показываем если нет классических штор
  }

  const selectedAccessory = getSelectedAccessory();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="category" className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Аксессуарлар</h2>
        <span className="ml-auto text-sm font-bold text-green-600">{formatPrice(accessoriesTotal)}</span>
      </div>

      {/* Лента */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="straighten" className="text-primary" />
          <h3 className="font-bold text-foreground">Таспа</h3>
        </div>

        <div className="p-3 bg-primary/10 rounded-xl border border-primary/15 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-primary-dark">Қажет метраж:</span>
            <span className="text-xl font-bold text-primary-dark">{totalTapeMeters} м</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Рулон өлшемі</label>
          <div className="flex gap-2">
            {TAPE_ROLLS.map(roll => (
              <button
                key={roll.id}
                type="button"
                onClick={() => updateData({ tape: { ...data.tape, rollId: roll.id } })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  data.tape?.rollId === roll.id || (!data.tape?.rollId && roll.id === 'tape_50m')
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="block">{roll.meters}м</span>
                <span className="block text-xs opacity-70">{formatPrice(roll.price)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
          <span className="text-foreground">{tapeRolls} рулон × {formatPrice(selectedTapeRoll.price)}</span>
          <span className="font-bold text-foreground">{formatPrice(tapeTotal)}</span>
        </div>
      </div>

      {/* Крючки */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="link" className="text-primary-light" />
          <h3 className="font-bold text-foreground">Ілгектер</h3>
        </div>

        <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-primary-dark">Қажет саны:</span>
            <span className="text-xl font-bold text-primary-dark">{hooksQty} дн</span>
          </div>
          <p className="text-xs text-primary mt-1">({totalTapeMeters}м × 5 = {hooksQty} дана)</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">Түрі</label>
          <div className="flex gap-3">
            {HOOK_TYPES.map(hook => (
              <button
                key={hook.id}
                type="button"
                onClick={() => updateData({ hooks: { ...data.hooks, type: hook.id } })}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  data.hooks?.type === hook.id || (!data.hooks?.type && hook.id === 'plastic')
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="block">{hook.name}</span>
                <span className="block text-xs opacity-70">{formatPrice(hook.pricePerPack)}/100дн</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
          <span className="text-foreground">{hookPacks} қап × {formatPrice(selectedHookType.pricePerPack)}</span>
          <span className="font-bold text-foreground">{formatPrice(hooksTotal)}</span>
        </div>
      </div>

      {/* Дополнительные аксессуары */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="add_circle" className="text-amber-500" />
            <h3 className="font-bold text-foreground">Қосымша</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddExtra(true)}
            className="text-primary font-bold text-sm flex items-center gap-1"
          >
            <Icon name="add" size={20} />
            Қосу
          </button>
        </div>

        {extras.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Қосымша аксессуар жоқ</p>
        ) : (
          <div className="space-y-2">
            {extras.map(extra => (
              <div key={extra.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="font-bold text-foreground">{extra.name}</p>
                  <p className="text-xs text-muted-foreground">{extra.quantity} {extra.unit} × {formatPrice(extra.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-700">{formatPrice(extra.total)}</span>
                  <button
                    type="button"
                    onClick={() => removeExtra(extra.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модалка добавления аксессуара */}
      {showAddExtra && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowAddExtra(false)}
        >
          <div 
            className="bg-card rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Аксессуар қосу</h3>
              <button 
                onClick={() => setShowAddExtra(false)} 
                className="size-8 rounded-full bg-muted flex items-center justify-center"
              >
                <Icon name="close" size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Список аксессуаров как кнопки */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">Өнім таңдау</label>
                
                {loadingCatalog ? (
                  <div className="text-center py-8">
                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : catalogAccessories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="inventory_2" size={32} />
                    <p className="text-sm mt-2">Каталогта аксессуар жоқ</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {catalogAccessories.map(acc => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedExtra(acc.id)}
                        className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${
                          selectedExtra === acc.id
                            ? 'bg-primary text-white'
                            : 'bg-muted hover:bg-muted'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{acc.name}</p>
                          <p className={`text-xs ${selectedExtra === acc.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {acc.code}
                          </p>
                        </div>
                        <span className={`font-bold ${selectedExtra === acc.id ? 'text-white' : 'text-primary'}`}>
                          {formatPrice(acc.pricePerMeter || acc.price || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Количество */}
              {selectedExtra && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Саны</label>
                  <input
                    type="number"
                    min="1"
                    value={extraQty}
                    onChange={(e) => setExtraQty(parseInt(e.target.value) || 1)}
                    className="w-full h-14 px-4 bg-muted border-2 border-transparent rounded-xl 
                      focus:bg-card focus:border-primary transition-all text-xl font-bold text-center"
                  />
                </div>
              )}

              {/* Превью */}
              {selectedAccessory && (
                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="check_circle" className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">Таңдалды</span>
                  </div>
                  <p className="font-bold text-foreground">{selectedAccessory.name}</p>
                  <div className="flex justify-between items-center mt-3 p-3 bg-card rounded-lg">
                    <span className="text-muted-foreground">
                      {extraQty} × {formatPrice(selectedAccessory.pricePerMeter || selectedAccessory.price || 0)}
                    </span>
                    <span className="text-lg font-black text-green-700">
                      {formatPrice(extraQty * (selectedAccessory.pricePerMeter || selectedAccessory.price || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка добавить */}
            <div className="sticky bottom-0 bg-card p-5 border-t border-border">
              <button
                type="button"
                onClick={addExtra}
                disabled={!selectedExtra}
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

      {/* Итого аксессуары */}
      <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
        <div className="space-y-2 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-primary-dark">Таспа ({tapeRolls} рулон)</span>
            <span className="font-bold text-primary-dark">{formatPrice(tapeTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-primary-dark">Ілгектер ({hookPacks} қап)</span>
            <span className="font-bold text-primary-dark">{formatPrice(hooksTotal)}</span>
          </div>
          {extrasTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-primary-dark">Қосымша</span>
              <span className="font-bold text-primary-dark">{formatPrice(extrasTotal)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
          <span className="font-bold text-primary-dark">Аксессуарлар барлығы:</span>
          <span className="text-xl font-black text-primary-dark">{formatPrice(accessoriesTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default AccessoriesForm;
