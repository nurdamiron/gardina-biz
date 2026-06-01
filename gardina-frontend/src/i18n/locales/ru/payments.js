const payments = {
  // PaymentTracking header / summary
  title: 'Платежи',
  status: {
    sufficient: 'Оплата достаточна',
    controlNeeded: 'Нужен контроль',
    high: 'Высокий риск!',
  },
  summary: {
    total: 'Общая сумма',
    required: 'Нужно (80%)',
    paid: 'Оплачено',
    remaining: 'Остаток',
  },
  history: {
    title: 'История платежей',
    empty: 'Платежей пока нет',
  },
  type: {
    prepayment: 'Предоплата',
    final: 'Итоговый платёж',
    extra: 'Доплата',
  },
  partialPercent: 'только {percent}%',
  warn: {
    attention: 'Внимание!',
    production: 'Оплата только {percent}%. Отправлено в производство, но требуется минимум 80%. Напомните клиенту об оплате!',
    dontInstall: 'Не устанавливайте!',
    ready: 'Заказ готов, но клиент оплатил только {percent}%. Перед монтажом нужно получить оставшиеся {amount} ₸!',
  },
  form: {
    addPayment: 'Добавить платёж',
    amount: 'Сумма',
    prepayment: 'Предоплата',
    final: 'Итоговый',
    extra: 'Доплата',
    note: 'Примечание (необязательно)',
    saving: 'Сохранение…',
    save: 'Сохранить',
    cancel: 'Отмена',
  },

  // PaymentRiskIndicator
  risk: {
    safe: { label: 'Безопасно', desc: 'Оплата достаточна' },
    medium: { label: 'Средний риск', desc: 'Не хватает {amount} ₸' },
    high: { label: 'Высокий риск', desc: 'Оплачено только {percent}%' },
  },
  paidShort: 'оплачено',
  detail: {
    total: 'Всего',
    paid: 'Оплачено',
    remaining: 'Остаток',
  },
  indicator: {
    highWarn: 'Оплата слишком мала. Перед отправкой в производство согласуйте с руководством.',
    mediumWarnTitle: 'Нужен контроль!',
    mediumWarnBody: 'Минимум {percent}% обязателен. Напомните клиенту об оплате.',
  },
  action: {
    call: 'Позвонить',
    message: 'Сообщение',
  },
  unpriced: {
    title: 'Смета не определена',
    subtitle: 'Сумма появится после расчёта',
  },

  // RiskOrdersSection (manager dashboard)
  section: {
    title: 'Риски оплат',
    totalUnpaid: 'Общая сумма неоплат:',
    empty: 'Рисковых платежей нет',
    emptySubtitle: 'Все заказы безопасны',
  },
  row: {
    status: 'Статус:',
    days: 'Дней:',
    paid: 'Оплачено:',
    shortfall: 'Не хватает:',
  },
  orderStatus: {
    in_production: 'В производстве',
    ready: 'Готов',
    installing: 'Монтаж',
  },
  warnHigh: 'В производстве {days} дн., оплата только {percent}%!',
  warnMedium: 'Перед монтажом нужно получить доплату!',
  level: {
    high: { label: 'Высокий риск', desc: 'Оплата ниже 50% — нужны срочные действия' },
    medium: { label: 'Средний риск', desc: 'Оплата 50–79% — нужен контроль' },
    safe: { label: 'Безопасно', desc: 'Оплата 80%+ — всё хорошо' },
  },
  rowAction: {
    call: 'Звонок',
    remind: 'Напомнить',
  },
};

export default payments;
