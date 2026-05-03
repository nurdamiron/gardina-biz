import React, { useState } from 'react';
import PaymentRiskIndicator from './PaymentRiskIndicator';
import { formatDateKZ, formatTime24 } from '../../utils/dateUtils';
import Icon from '../common/Icon';

/**
 * Компонент для отслеживания истории платежей и рисков
 */
const PaymentTracking = ({
  deal,
  onAddPayment,
  canEdit = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    type: 'prepayment',
    note: ''
  });
  const [saving, setSaving] = useState(false);

  // Расчёт финансов
  const totalAmount = deal?.totalAmount || 0;
  const requiredPrepayment = Math.round(totalAmount * 0.8); // 80%
  const paidAmount = (deal?.prepaidAmount || 0) + (deal?.finalAmount || 0);
  const remainingAmount = totalAmount - paidAmount;
  const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // История платежей
  const payments = deal?.payments || [];

  // Определяем риск
  const getRiskStatus = () => {
    if (paidPercent >= 80) return { text: 'Төлем жеткілікті', color: 'text-green-600' };
    if (paidPercent >= 50) return { text: 'Бақылау қажет', color: 'text-yellow-600' };
    return { text: 'Жоғары қауіп!', color: 'text-red-600' };
  };

  const riskStatus = getRiskStatus();

  const handleSubmitPayment = async () => {
    if (!paymentForm.amount || isNaN(paymentForm.amount)) return;

    setSaving(true);
    try {
      await onAddPayment({
        ...paymentForm,
        amount: parseInt(paymentForm.amount, 10)
      });
      setPaymentForm({ amount: '', type: 'prepayment', note: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Заголовок с индикатором риска */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Төлемдер</h3>
          <span className={`font-bold text-sm ${riskStatus.color}`}>
            {riskStatus.text}
          </span>
        </div>

        {/* Индикатор риска */}
        <PaymentRiskIndicator
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          requiredPercent={80}
          showDetails={true}
        />
      </div>

      {/* Финансовая сводка */}
      <div className="p-4 bg-gray-50 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Жалпы сома</p>
          <p className="text-xl font-black text-gray-900">{totalAmount.toLocaleString()} ₸</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Қажет (80%)</p>
          <p className="text-xl font-black text-primary">{requiredPrepayment.toLocaleString()} ₸</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Төленген</p>
          <p className="text-xl font-black text-green-600">{paidAmount.toLocaleString()} ₸</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Қалды</p>
          <p className="text-xl font-black text-orange-600">{remainingAmount.toLocaleString()} ₸</p>
        </div>
      </div>

      {/* История платежей */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">Төлем тарихы</h4>
          <span className="text-xs text-gray-500">{payments.length} төлем</span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <Icon name="payments" size={32} className="text-gray-300" />
            <p className="text-sm text-gray-500 mt-2">Төлемдер әлі жоқ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment, idx) => {
              const isPartial = payment.amount < requiredPrepayment;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    isPartial ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`size-8 rounded-full flex items-center justify-center ${
                        isPartial ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                      }`}>
                        <Icon name={payment.type === 'final' ? 'done_all' : 'payments'} size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {payment.type === 'prepayment' ? 'Алдын ала төлем' :
                           payment.type === 'final' ? 'Қорытынды төлем' : 'Қосымша төлем'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateKZ(payment.createdAt)} • {formatTime24(payment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-gray-900">{payment.amount.toLocaleString()} ₸</p>
                      {isPartial && payment.type === 'prepayment' && (
                        <p className="text-[10px] text-yellow-700 font-bold">
                          {Math.round((payment.amount / totalAmount) * 100)}% ғана
                        </p>
                      )}
                    </div>
                  </div>
                  {payment.note && (
                    <p className="mt-2 text-xs text-gray-600 pl-10">{payment.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Предупреждения */}
        {paidPercent < 80 && deal?.status === 'in_production' && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-2">
              <Icon name="warning" size={18} className="text-red-600" />
              <div>
                <p className="text-sm font-bold text-red-800">Назар аударыңыз!</p>
                <p className="text-xs text-red-700 mt-1">
                  Төлем тек {paidPercent}%. Өндіріске жіберілген, бірақ минимум 80% қажет.
                  Клиентке төлем туралы еске салыңыз!
                </p>
              </div>
            </div>
          </div>
        )}

        {paidPercent < 80 && deal?.status === 'ready' && (
          <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-start gap-2">
              <Icon name="error" size={18} className="text-orange-600" />
              <div>
                <p className="text-sm font-bold text-orange-800">Орнатпаңыз!</p>
                <p className="text-xs text-orange-700 mt-1">
                  Тапсырыс дайын, бірақ клиент тек {paidPercent}% төледі.
                  Орнатпас бұрын қалған {(requiredPrepayment - paidAmount).toLocaleString()} ₸ алу керек!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Форма добавления платежа */}
        {canEdit && (
          <>
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 w-full py-3 border-2 border-dashed border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="add" />
                Төлем қосу
              </button>
            ) : (
              <div className="mt-4 p-3 bg-primary/10 rounded-xl border border-primary/25">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Сома"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <select
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="prepayment">Алдын ала</option>
                    <option value="final">Қорытынды</option>
                    <option value="extra">Қосымша</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Ескерту (міндетті емес)"
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitPayment}
                    disabled={saving || !paymentForm.amount}
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50"
                  >
                    {saving ? 'Сақталуда...' : 'Сақтау'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setPaymentForm({ amount: '', type: 'prepayment', note: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm"
                  >
                    Болдырмау
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;