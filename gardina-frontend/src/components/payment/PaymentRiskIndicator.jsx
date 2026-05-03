import React from 'react';
import Icon from '../common/Icon';

/**
 * Компонент для отображения уровня риска по платежам
 */
const PaymentRiskIndicator = ({
  totalAmount,
  paidAmount,
  requiredPercent = 80,
  showDetails = true
}) => {
  // Рассчитываем проценты и риски
  const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const requiredAmount = Math.round(totalAmount * (requiredPercent / 100));
  const remainingAmount = totalAmount - paidAmount;
  const shortfallAmount = requiredAmount - paidAmount;

  // Определяем уровень риска
  const getRiskLevel = () => {
    if (paidPercent >= requiredPercent) return 'safe';
    if (paidPercent >= 50) return 'medium';
    return 'high';
  };

  const riskLevel = getRiskLevel();

  // Конфигурация для разных уровней риска
  const riskConfig = {
    safe: {
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      progressBg: 'bg-green-500',
      label: 'Қауіпсіз',
      icon: 'check_circle',
      description: 'Төлем жеткілікті'
    },
    medium: {
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      progressBg: 'bg-yellow-500',
      label: 'Орташа қауіп',
      icon: 'warning',
      description: `${shortfallAmount.toLocaleString()} ₸ жетіспейді`
    },
    high: {
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progressBg: 'bg-red-500',
      label: 'Жоғары қауіп',
      icon: 'error',
      description: `Тек ${paidPercent}% төленген`
    }
  };

  const config = riskConfig[riskLevel];

  // Компактный вид (только индикатор)
  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.borderColor} border`}>
        <Icon name={config.icon} size={16} className={config.iconColor} />
        <span className={`text-xs font-bold ${config.textColor}`}>
          {paidPercent}%
        </span>
      </div>
    );
  }

  // Детальный вид
  return (
    <div className={`rounded-xl p-4 ${config.bgColor} ${config.borderColor} border`}>
      {/* Заголовок с иконкой */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`size-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon name={config.icon} size={18} className={config.iconColor} />
          </div>
          <div>
            <p className={`font-bold text-sm ${config.textColor}`}>{config.label}</p>
            <p className={`text-xs ${config.textColor} opacity-75`}>{config.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${config.textColor}`}>{paidPercent}%</p>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>төленген</p>
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="relative h-2 bg-white/50 rounded-full overflow-hidden mb-3">
        <div
          className={`absolute left-0 top-0 h-full ${config.progressBg} transition-all duration-500`}
          style={{ width: `${Math.min(paidPercent, 100)}%` }}
        />
        {/* Отметка требуемого уровня */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-600 opacity-50"
          style={{ left: `${requiredPercent}%` }}
        />
      </div>

      {/* Детали суммы */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>Барлығы</p>
          <p className={`text-sm font-bold ${config.textColor}`}>
            {totalAmount.toLocaleString()}₸
          </p>
        </div>
        <div>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>Төленген</p>
          <p className={`text-sm font-bold ${config.textColor}`}>
            {paidAmount.toLocaleString()}₸
          </p>
        </div>
        <div>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>Қалды</p>
          <p className={`text-sm font-bold ${config.textColor}`}>
            {remainingAmount.toLocaleString()}₸
          </p>
        </div>
      </div>

      {/* Предупреждения для рисковых платежей */}
      {riskLevel !== 'safe' && (
        <div className="mt-3 pt-3 border-t border-current opacity-30">
          <div className={`flex items-start gap-2 ${config.textColor}`}>
            <Icon name="info" size={16} />
            <div className="text-xs">
              {riskLevel === 'high' ? (
                <p>
                  <strong>Назар аударыңыз!</strong> Төлем өте аз.
                  Өндіріске жібермес бұрын басшылықпен келісіңіз.
                </p>
              ) : (
                <p>
                  <strong>Бақылау қажет!</strong> Минимум {requiredPercent}% қажет.
                  Клиентке төлем туралы еске салыңыз.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Экшн кнопки для проблемных платежей */}
      {riskLevel !== 'safe' && (
        <div className="mt-3 flex gap-2">
          <button className={`flex-1 py-1.5 px-3 bg-white/70 rounded-lg text-xs font-bold ${config.textColor} hover:bg-white transition-colors flex items-center justify-center gap-1`}>
            <Icon name="call" size={14} />
            Қоңырау шалу
          </button>
          <button className={`flex-1 py-1.5 px-3 bg-white/70 rounded-lg text-xs font-bold ${config.textColor} hover:bg-white transition-colors flex items-center justify-center gap-1`}>
            <Icon name="chat" size={14} />
            Хабарлама
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentRiskIndicator;