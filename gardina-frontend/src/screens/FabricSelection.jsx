import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { proposalsAPI, ordersAPI } from '../services/api';
import Icon from '../components/common/Icon';

const FabricSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: measurementId } = useParams();
  const { user } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [notes, setNotes] = useState('');
  const [darknessLevel, setDarknessLevel] = useState('medium');
  const [complexity, setComplexity] = useState('medium');
  const [saving, setSaving] = useState(false);

  const windowData = location.state?.windowData;
  const photos = location.state?.photos || [];

  const clientBudget = {
    min: 50000,
    max: 70000,
  };

  // Calculate prices based on selections
  const calculatePrice = (baseFabric) => {
    let fabricCost = baseFabric;
    let sewingCost = 12000;

    if (darknessLevel === 'medium') fabricCost *= 1.2;
    if (darknessLevel === 'blackout') fabricCost *= 1.5;

    if (complexity === 'medium') sewingCost *= 1.3;
    if (complexity === 'complex') sewingCost *= 2;

    const curtainCost = 8000 + (complexity === 'complex' ? 4000 : 0);
    const installationCost = 5000;

    return {
      fabric: Math.round(fabricCost),
      sewing: Math.round(sewingCost),
      curtain: curtainCost,
      installation: installationCost,
      total: Math.round(fabricCost + sewingCost + curtainCost + installationCost),
    };
  };

  const variants = useMemo(() => [
    {
      id: 1,
      name: 'ЭКОНОМ',
      fabric: 'Velvet Soft #102',
      description: 'Жұмсақ текстуралы, күңгірт әрлеу. Жарық өткізгіштігі 60%.',
      meters: 6.5,
      ...calculatePrice(20000),
    },
    {
      id: 2,
      name: 'ОРТАША',
      fabric: 'Canvas Linen #05',
      description: 'Табиғи зығыр фактурасы, тозуға төзімді. Түркия өндірісі.',
      meters: 7.2,
      ...calculatePrice(35000),
    },
    {
      id: 3,
      name: 'ПРЕМИУМ',
      fabric: 'Royal Jacquard Gold',
      description: 'Жаккард өрнегі бар эксклюзивті итальяндық топтама.',
      meters: 8.0,
      ...calculatePrice(60000),
    },
  ], [darknessLevel, complexity]);

  // Auto-select first in-budget variant
  useEffect(() => {
    if (!selectedVariant) {
      const inBudget = variants.find(v => v.total <= clientBudget.max);
      setSelectedVariant(inBudget || variants[0]);
    }
  }, [variants, selectedVariant, clientBudget.max]);

  const handleSubmit = async () => {
    if (!selectedVariant) {
      return;
    }

    try {
      setSaving(true);

      const { dealId, clientId } = location.state || {};

      // Create proposal in Backend
      await proposalsAPI.create({
        measurementId,
        clientId,
        designerId: user.id,
        dealId,
        variantName: selectedVariant.name,
        fabricCost: selectedVariant.fabric,
        sewingCost: selectedVariant.sewing,
        curtainCost: selectedVariant.curtain,
        installationCost: selectedVariant.installation,
        totalCost: selectedVariant.total,
        notes,
      });

      setSaving(false);

      // Navigate back to Hub
      navigate(`/designer/measurements/${measurementId}`);
    } catch (error) {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background-light/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-bold leading-tight tracking-tight">Дизайн / мата таңдау</h2>
            <p className="text-text-secondary text-xs font-medium">Өлшем алу • Қадам 2/3</p>
          </div>
        </div>
      </header>

      {/* Client Budget */}
      <section className="mt-4 px-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-primary/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Клиент бюджеті</span>
            <div className="text-lg font-bold mt-0.5">
              {clientBudget.min.toLocaleString()} – {clientBudget.max.toLocaleString()} ₸
            </div>
          </div>
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="account_balance_wallet" size={24} />
          </div>
        </div>
      </section>

      {/* Options */}
      <section className="mt-6 px-4 space-y-5">
        {/* Darkness */}
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Icon name="light_mode" size={18} className="text-primary" />
            Жарық өткізбеу деңгейі
          </h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'transparent', label: 'Декоративті' },
              { id: 'medium', label: 'Орташа' },
              { id: 'blackout', label: 'Блэкаут' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDarknessLevel(option.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap ${
                  darknessLevel === option.id
                    ? 'bg-primary text-background-dark border-primary font-bold shadow-sm'
                    : 'bg-white border-gray-200 hover:border-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Complexity */}
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Icon name="straighten" size={18} className="text-primary" />
            Тігу күрделілігі
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'simple', label: 'Жай' },
              { id: 'medium', label: 'Орташа' },
              { id: 'complex', label: 'Күрделі' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setComplexity(option.id)}
                className={`px-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                  complexity === option.id
                    ? 'bg-primary text-background-dark border-primary font-bold shadow-sm'
                    : 'bg-white border-gray-200 hover:border-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Variants */}
      <section className="mt-8 px-4">
        <h3 className="text-lg font-bold mb-4">Мата нұсқалары</h3>
        <div className="space-y-4">
          {variants.map((variant) => {
            const inBudget = variant.total >= clientBudget.min && variant.total <= clientBudget.max;

            return (
              <label key={variant.id} className="block relative cursor-pointer">
                <input
                  type="radio"
                  name="fabric_option"
                  checked={selectedVariant?.id === variant.id}
                  onChange={() => setSelectedVariant(variant)}
                  className="peer sr-only"
                />
                <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-gray-100 peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between p-3 pb-0">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      variant.name === 'ЭКОНОМ' ? 'bg-gray-100 text-gray-600' :
                      variant.name === 'ОРТАША' ? 'bg-primary/10 text-primary' :
                      'bg-primary/5 text-primary'
                    }`}>
                      {variant.name}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                      inBudget ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                    }`}>
                      <Icon name={inBudget ? 'check' : 'warning'} size={12} />
                      {inBudget ? 'Бюджетке сай' : 'Бюджеттен тыс'}
                    </span>
                  </div>

                  <div className="p-3 flex gap-4">
                    <div className="w-24 h-24 shrink-0 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 shadow-inner flex items-center justify-center">
                      <Icon name="texture" size={28} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base truncate">{variant.fabric}</h4>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{variant.description}</p>
                      <div className="mt-2 text-xs font-medium text-text-main">
                        Мата шығыны: <span className="font-bold">{variant.meters} м</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <div className="bg-background-light rounded-lg p-3 text-xs space-y-1.5 text-text-secondary">
                      <div className="flex justify-between">
                        <span>Мата:</span>
                        <span className="font-medium text-text-main">{variant.fabric.toLocaleString()} ₸</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Тігу:</span>
                        <span className="font-medium text-text-main">{variant.sewing.toLocaleString()} ₸</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Карниз:</span>
                        <span className="font-medium text-text-main">{variant.curtain.toLocaleString()} ₸</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Орнату:</span>
                        <span className="font-medium text-text-main">{variant.installation.toLocaleString()} ₸</span>
                      </div>
                      <div className="h-px bg-gray-200 my-1"></div>
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-text-main">Барлығы:</span>
                        <span className="text-lg font-bold text-primary leading-none">{variant.total.toLocaleString()} ₸</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 transition-opacity">
                    <Icon name="check_circle" size={28} className="text-primary" />
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      <section className="mt-8 px-4 mb-24">
        <label className="block text-sm font-bold mb-2">Ескертулер мен ұсыныстар</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm p-3 resize-none shadow-sm"
          placeholder="Мысалы: Клиент ашық түстерді қалайды..."
          rows="3"
        />
      </section>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-text-secondary">Таңдалған нұсқа:</span>
          <span className="font-bold text-lg">
            {selectedVariant ? selectedVariant.total.toLocaleString() : '0'} ₸
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-12 rounded-xl bg-gray-100 text-text-main text-base font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Icon name="arrow_back" />
            Артқа
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !selectedVariant}
            className="h-12 rounded-xl bg-primary text-white text-base font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Сақталуда...
              </>
            ) : (
              <>
                Жалғастыру
                <Icon name="arrow_forward" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FabricSelection;
