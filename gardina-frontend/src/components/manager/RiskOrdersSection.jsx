import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentRiskIndicator from '../payment/PaymentRiskIndicator';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';
import { pluralize, pluralUnit, NOUNS } from '../../utils/plural';

/**
 * Секция для отображения заказов с рисками по оплате
 */
const RiskOrdersSection = ({ orders = [] }) => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState('high'); // По умолчанию раскрыт высокий риск

  // Фильтруем заказы по уровню риска
  const calculateRiskLevel = (order) => {
    const paidPercent = order.totalAmount > 0
      ? (order.paidAmount / order.totalAmount) * 100
      : 0;

    if (paidPercent >= 80) return 'safe';
    if (paidPercent >= 50) return 'medium';
    return 'high';
  };

  // Группируем заказы по рискам
  const riskGroups = {
    high: [],
    medium: [],
    safe: []
  };

  orders.forEach(order => {
    // Только для заказов в производстве или готовых
    if (['in_production', 'ready', 'installing'].includes(order.status)) {
      const riskLevel = calculateRiskLevel(order);
      riskGroups[riskLevel].push(order);
    }
  });

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sendReminder = async (orderId, clientPhone) => {
    // TODO: Интеграция с WhatsApp API
    console.log('Sending reminder to', clientPhone, 'for order', orderId);
    alert(`Еске салу жіберілді: ${clientPhone}`);
  };

  const callClient = (clientPhone) => {
    window.location.href = `tel:${clientPhone}`;
  };

  const renderRiskSection = (riskLevel, config) => {
    const orders = riskGroups[riskLevel];
    const isExpanded = expandedSection === riskLevel;

    if (orders.length === 0) return null;

    return (
      <div className="mb-4">
        {/* Заголовок секции */}
        <button
          onClick={() => toggleSection(riskLevel)}
          className={`w-full flex items-center justify-between p-3 rounded-xl ${config.bgColor} ${config.borderColor} border hover:brightness-95 transition-all`}
        >
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <Icon name={config.icon} size={18} className={config.iconColor} />
            </div>
            <div className="text-left">
              <p className={`font-bold text-sm ${config.textColor}`}>
                {config.label} ({orders.length})
              </p>
              <p className={`text-xs ${config.textColor} opacity-75`}>
                {config.description}
              </p>
            </div>
          </div>
          <Icon name="expand_more" size={20} />
        </button>

        {/* Список заказов */}
        {isExpanded && (
          <div className="mt-2 space-y-2">
            {orders.map(order => {
              const paidPercent = order.totalAmount > 0
                ? Math.round((order.paidAmount / order.totalAmount) * 100)
                : 0;
              const shortfall = Math.round(order.totalAmount * 0.8) - order.paidAmount;
              const daysInStatus = Math.floor((Date.now() - new Date(order.statusChangedAt)) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/deals/${order.id}`)}
                    >
                      <h4 className="font-bold text-sm">{order.clientName}</h4>
                      <p className="text-xs text-gray-500">{order.clientPhone}</p>
                    </div>
                    <PaymentRiskIndicator
                      totalAmount={order.totalAmount}
                      paidAmount={order.paidAmount}
                      showDetails={false}
                    />
                  </div>

                  {/* Детали заказа */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-gray-500">{t('payments.row.status')}</span>
                      <p className="font-bold">
                        {order.status === 'in_production' ? t('payments.orderStatus.in_production') :
                         order.status === 'ready' ? t('payments.orderStatus.ready') : t('payments.orderStatus.installing')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payments.row.days')}</span>
                      <p className="font-bold">{pluralize(daysInStatus, NOUNS.day, lang)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payments.row.paid')}</span>
                      <p className="font-bold">{order.paidAmount.toLocaleString()} ₸</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payments.row.shortfall')}</span>
                      <p className="font-bold text-red-600">
                        {shortfall > 0 ? `${shortfall.toLocaleString()} ₸` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Предупреждения */}
                  {riskLevel === 'high' && daysInStatus > 2 && (
                    <div className="mb-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-800 flex items-center gap-1">
                        <Icon name="warning" size={14} />
                        {t('payments.warnHigh', { days: daysInStatus, percent: paidPercent })}
                      </p>
                    </div>
                  )}

                  {riskLevel === 'medium' && order.status === 'ready' && (
                    <div className="mb-3 p-2 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-yellow-800 flex items-center gap-1">
                        <Icon name="info" size={14} />
                        {t('payments.warnMedium')}
                      </p>
                    </div>
                  )}

                  {/* Экшн кнопки */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => callClient(order.clientPhone)}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon name="call" size={14} />
                      {t('payments.rowAction.call')}
                    </button>
                    <button
                      onClick={() => sendReminder(order.id, order.clientPhone)}
                      className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110 transition-colors flex items-center justify-center gap-1"
                    >
                      <Icon name="chat" size={14} />
                      {t('payments.rowAction.remind')}
                    </button>
                    <button
                      onClick={() => navigate(`/deals/${order.id}`)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      <Icon name="arrow_forward" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Конфигурация для разных уровней риска
  const riskConfigs = {
    high: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: 'error',
      label: t('payments.level.high.label'),
      description: t('payments.level.high.desc')
    },
    medium: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: 'warning',
      label: t('payments.level.medium.label'),
      description: t('payments.level.medium.desc')
    },
    safe: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: 'check_circle',
      label: t('payments.level.safe.label'),
      description: t('payments.level.safe.desc')
    }
  };

  // Считаем общую статистику
  const totalRiskOrders = riskGroups.high.length + riskGroups.medium.length;
  const totalRiskAmount = [...riskGroups.high, ...riskGroups.medium].reduce(
    (sum, order) => sum + (Math.round(order.totalAmount * 0.8) - order.paidAmount),
    0
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{t('payments.section.title')}</h3>
        {totalRiskOrders > 0 && (
          <div className="text-right">
            <p className="text-2xl font-black text-red-600">{totalRiskOrders}</p>
            <p className="text-xs text-gray-500">{pluralUnit(totalRiskOrders, NOUNS.order, lang)}</p>
          </div>
        )}
      </div>

      {/* Общая сумма недоплат */}
      {totalRiskAmount > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">{t('payments.section.totalUnpaid')}</p>
          <p className="text-xl font-black text-gray-900">{totalRiskAmount.toLocaleString()} ₸</p>
        </div>
      )}

      {/* Секции по уровням риска */}
      {renderRiskSection('high', riskConfigs.high)}
      {renderRiskSection('medium', riskConfigs.medium)}
      {renderRiskSection('safe', riskConfigs.safe)}

      {/* Если нет заказов с рисками */}
      {totalRiskOrders === 0 && riskGroups.safe.length === 0 && (
        <div className="text-center py-8">
          <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Icon name="done_all" size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500">{t('payments.section.empty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('payments.section.emptySubtitle')}</p>
        </div>
      )}
    </div>
  );
};

export default RiskOrdersSection;