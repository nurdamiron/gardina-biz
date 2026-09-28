import { useI18n } from '../../contexts/I18nContext';
import React from 'react';
import Icon from '../common/Icon';
import {
  calculateArea,
  calculateJalousieCost,
  calculateZebraCost,
  JALOUSIE_MATERIALS,
  JALOUSIE_SLATS,
  ZEBRA_SYSTEMS,
  formatPrice 
} from '../../utils/calculations';

/**
 * Форма для жалюзи и зебры
 */
const JalousieZebraForm = ({ type, data, onChange }) => {
  const { t } = useI18n();
  const isJalousie = type === 'jalousie_h' || type === 'jalousie_v';
  const isZebra = type === 'zebra';
  
  const width = parseFloat(data.width) || 0;
  const height = parseFloat(data.height) || 0;
  const area = calculateArea(width, height);
  
  let productTotal = 0;
  if (isJalousie) {
    productTotal = calculateJalousieCost(area, data.material || 'aluminum');
  } else if (isZebra) {
    productTotal = calculateZebraCost(area, data.system || 'open');
  }
  
  const installPrice = data.installation?.needed ? (data.installation?.price || 4000) : 0;
  const roomTotal = productTotal + installPrice;

  const updateData = (updates) => {
    onChange({ ...data, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Размеры */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="straighten" className="text-primary" />
          <h3 className="font-bold text-foreground">{t('measurements.form.windowSize', 'Терезе өлшемі')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">{t('measurements.form.width', 'Ені')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={data.width || ''}
                onChange={(e) => updateData({ width: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-muted border-2 border-transparent rounded-xl 
                  focus:bg-card focus:border-primary transition-all text-xl font-bold"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">м</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">{t('measurements.form.height', 'Биіктігі')}</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={data.height || ''}
                onChange={(e) => updateData({ height: e.target.value })}
                className="w-full h-14 px-4 pr-10 bg-muted border-2 border-transparent rounded-xl 
                  focus:bg-card focus:border-primary transition-all text-xl font-bold"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">м</span>
            </div>
          </div>
        </div>

        {area > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/15">
            <div className="flex justify-between items-center">
              <span className="text-primary-dark">{t('measurements.form.area', 'Ауданы:')}</span>
              <span className="text-xl font-bold text-primary-dark">{area} м²</span>
            </div>
          </div>
        )}
      </div>

      {/* Жалюзи опции */}
      {isJalousie && (
        <>
          {/* Материал */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="texture" className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">Материал</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {JALOUSIE_MATERIALS.map(mat => (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => updateData({ material: mat.id })}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    data.material === mat.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="block text-sm">{t(`measurements.form.material.${mat.id}`, mat.name)}</span>
                  <span className="block text-xs opacity-70 mt-1">{formatPrice(mat.pricePerSqm)}/м²</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ширина ламели */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="width" className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">{t('measurements.form.slatWidth', 'Ламель ені')}</h3>
            </div>

            <div className="flex gap-3">
              {JALOUSIE_SLATS.map(slat => (
                <button
                  key={slat.id}
                  type="button"
                  onClick={() => updateData({ slat: slat.id })}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    data.slat === slat.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {slat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Цвет */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="palette" className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">{t('measurements.form.color', 'Түсі')}</h3>
            </div>

            <input
              type="text"
              value={data.color || ''}
              onChange={(e) => updateData({ color: e.target.value })}
              className="w-full h-12 px-4 bg-muted border-2 border-transparent rounded-xl 
                focus:bg-card focus:border-primary transition-all"
              placeholder={t('measurements.form.colorPlaceholder', 'Мысалы: Ақ, Қоңыр, т.б.')}
            />
          </div>
        </>
      )}

      {/* Зебра опции */}
      {isZebra && (
        <>
          {/* Система */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="settings" className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">{t('measurements.form.systemType', 'Жүйе түрі')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ZEBRA_SYSTEMS.map(sys => (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => updateData({ system: sys.id })}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    data.system === sys.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span className="block">{t(`measurements.form.zebraSystem.${sys.id}`, sys.name)}</span>
                  <span className="block text-xs opacity-70 mt-1">{formatPrice(sys.pricePerSqm)}/м²</span>
                </button>
              ))}
            </div>
          </div>

          {/* Цвет */}
          <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="palette" className="text-muted-foreground" />
              <h3 className="font-bold text-foreground">{t('measurements.form.color', 'Түсі')}</h3>
            </div>

            <input
              type="text"
              value={data.color || ''}
              onChange={(e) => updateData({ color: e.target.value })}
              className="w-full h-12 px-4 bg-muted border-2 border-transparent rounded-xl 
                focus:bg-card focus:border-primary transition-all"
              placeholder={t('measurements.form.colorPlaceholder', 'Мысалы: Ақ, Қоңыр, т.б.')}
            />
          </div>
        </>
      )}

      {/* Монтаж */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="build" className="text-muted-foreground" />
          <h3 className="font-bold text-foreground">{t('measurements.form.installation', 'Орнату')}</h3>
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
              data.installation?.needed ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-card rounded-full shadow transition-transform duration-200 ${
              data.installation?.needed ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </div>
          <span className="font-medium text-foreground">{t('measurements.form.installationNeeded', 'Орнату керек')}</span>
          {data.installation?.needed && (
            <span className="ml-auto font-bold text-muted-foreground">{formatPrice(installPrice)}</span>
          )}
        </label>
      </div>

      {/* Расчёт */}
      {productTotal > 0 && (
        <div className="bg-primary/10 rounded-2xl p-5 border border-primary/25">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="calculate" className="text-primary" />
            <h3 className="font-bold text-primary">{t('measurements.form.calculation', 'Есептеу')}</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-primary-dark">
                {area} м² × {formatPrice(
                  isJalousie 
                    ? JALOUSIE_MATERIALS.find(m => m.id === data.material)?.pricePerSqm || 0
                    : ZEBRA_SYSTEMS.find(s => s.id === data.system)?.pricePerSqm || 0
                )}/м²
              </span>
              <span className="font-bold text-primary-dark">{formatPrice(productTotal)}</span>
            </div>
            {installPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-primary-dark">{t('measurements.form.installation', 'Орнату')}</span>
                <span className="font-bold text-primary-dark">{formatPrice(installPrice)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Итого */}
      {roomTotal > 0 && (
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <div className="flex justify-between items-center">
            <span className="font-bold text-green-800">{t('measurements.form.total', 'Барлығы:')}</span>
            <span className="text-2xl font-black text-green-700">{formatPrice(roomTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JalousieZebraForm;

