import React from 'react';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';

/**
 * Компонент для отображения уровня риска по платежам
 */
const PaymentRiskIndicator = ({
  totalAmount,
  paidAmount,
  requiredPercent = 80,
  showDetails = true
}) => {
  const { t } = useI18n();
  // Заказ ещё не оценён — риск не считаем, чтобы не "кричать волком" красным на 0₸.
  const isUnpriced = !totalAmount || totalAmount <= 0;
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
      label: t('payments.risk.safe.label'),
      icon: 'check_circle',
      description: t('payments.risk.safe.desc')
    },
    medium: {
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      progressBg: 'bg-yellow-500',
      label: t('payments.risk.medium.label'),
      icon: 'warning',
      description: t('payments.risk.medium.desc', { amount: shortfallAmount.toLocaleString() })
    },
    high: {
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progressBg: 'bg-red-500',
      label: t('payments.risk.high.label'),
      icon: 'error',
      description: t('payments.risk.high.desc', { percent: paidPercent })
    }
  };

  const config = riskConfig[riskLevel];

  // Не оценён → нейтральное состояние вместо ложного "высокого риска"
  if (isUnpriced) {
    if (!showDetails) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-soft border border-border-light">
          <Icon name="request_quote" size={16} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">—</span>
        </div>
      );
    }
    return (
      <div className="rounded-xl p-4 bg-neutral-soft border border-border-light">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-surface-light flex items-center justify-center">
            <Icon name="request_quote" size={18} className="text-text-secondary" />
          </div>
          <div>
            <p className="font-bold text-sm text-text-main">{t('payments.unpriced.title')}</p>
            <p className="text-xs text-text-secondary">{t('payments.unpriced.subtitle')}</p>
          </div>
        </div>
      </div>
    );
  }

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
          <p className={`text-[10px] ${config.textColor} opacity-75`}>{t('payments.paidShort')}</p>
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="relative h-2 bg-card/50 rounded-full overflow-hidden mb-3">
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
          <p className={`text-[10px] ${config.textColor} opacity-75`}>{t('payments.detail.total')}</p>
          <p className={`text-sm font-bold ${config.textColor}`}>
            {totalAmount.toLocaleString()}₸
          </p>
        </div>
        <div>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>{t('payments.detail.paid')}</p>
          <p className={`text-sm font-bold ${config.textColor}`}>
            {paidAmount.toLocaleString()}₸
          </p>
        </div>
        <div>
          <p className={`text-[10px] ${config.textColor} opacity-75`}>{t('payments.detail.remaining')}</p>
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
                  <strong>{t('payments.warn.attention')}</strong> {t('payments.indicator.highWarn')}
                </p>
              ) : (
                <p>
                  <strong>{t('payments.indicator.mediumWarnTitle')}</strong> {t('payments.indicator.mediumWarnBody', { percent: requiredPercent })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Экшн кнопки для проблемных платежей */}
      {riskLevel !== 'safe' && (
        <div className="mt-3 flex gap-2">
          <button className={`flex-1 py-1.5 px-3 bg-card/70 rounded-lg text-xs font-bold ${config.textColor} hover:bg-card transition-colors flex items-center justify-center gap-1`}>
            <Icon name="call" size={14} />
            {t('payments.action.call')}
          </button>
          <button className={`flex-1 py-1.5 px-3 bg-card/70 rounded-lg text-xs font-bold ${config.textColor} hover:bg-card transition-colors flex items-center justify-center gap-1`}>
            <Icon name="chat" size={14} />
            {t('payments.action.message')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentRiskIndicator;