const orders = {
  title: 'Все заказы',
  newOrder: 'Заказ',
  empty: 'Заказов пока нет',
  emptyHint: 'Когда поступит первый заказ — он появится здесь',
  emptyCta: '+ Новый заказ',
  loading: 'Загрузка заказов…',

  modes: {
    manager: 'Режим менеджера',
    admin: 'Режим админа',
    sales: 'Режим продаж',
  },

  filters: {
    all: 'Все',
    active: 'Активные',
    completed: 'Завершённые',
    cancelled: 'Отменённые',
    risk: 'Риск',
    allStatus: 'Все статусы',
    allDesigners: 'Все дизайнеры',
  },

  card: {
    label: 'Дата',
    amount: 'Сумма',
    paid: 'Оплачено',
    designer: 'Дизайнер',
    windows: '{count} окон',
    urgent: 'СРОЧНО',
    unknownClient: 'Клиент',
    unknownAddress: 'Адрес не указан',
    unknownDesigner: '—',
  },

  // Order pipeline statuses (the simplified set)
  status: {
    scheduled: 'Новый',
    measured: 'Замер сделан',
    in_production: 'В производстве',
    ready: 'Готов',
    installing: 'Монтаж',
    completed: 'Завершён',
    cancelled: 'Отменён',
    rejected: 'Отказ',
    // Legacy / extra
    new: 'Новый',
    assigned: 'Назначен',
    measuring: 'Замер',
    in_sewing: 'Пошив',
    corrections: 'Правки',
    ready_to_install: 'К монтажу',
    lead: 'Лид',
    proposal_sent: 'КП отправлено',
    proposal_accepted: 'КП принято',
    contract_signed: 'Договор',
    payment_pending: 'Ждём оплату',
    production: 'Производство',
  },

  // Payment statuses
  payment: {
    pending: 'Не оплачен',
    partial: 'Частично оплачен',
    paid: 'Оплачен',
    refunded: 'Возвращён',
  },

  // Time-until labels for upcoming measurements
  time: {
    past: 'Просрочено',
    lessThanHour: '< 1 часа',
    inHours: 'через {hours} ч',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    inDays: 'через {days} дн',
  },

  funnel: {
    title: 'Воронка продаж',
    myOrders: 'Мои заказы',
    countSuffix: '{count} заказов',
    totalResult: 'Общий результат',
    totalDeals: '{count} сделок',
    create: 'Создать заказ',
    leads: 'Лиды',
    proposals: 'Предложения',
    contracts: 'Контракты',
    production: 'Производство',
    completed: 'Завершено',
    stages: {
      proposal_sent: 'КП отправлено',
      proposal_accepted: 'КП принято',
      contract_signed: 'Договор',
      prepayment_received: 'Аванс получен',
      in_production: 'В производстве',
      ready_for_installation: 'Готов к монтажу',
      installation_scheduled: 'Монтаж назначен',
      installed: 'Смонтировано',
      completed: 'Завершено',
    },
    statusLabels: {
      new: 'Новый',
      assigned: 'Назначен',
      measuring: 'Замер',
      measurement_done: 'Замер сделан',
      in_sewing: 'Пошив',
      corrections: 'Правки',
      ready_to_install: 'К монтажу',
      installing: 'Монтаж',
      completed: 'Завершён',
      cancelled: 'Отменён',
    },
  },
};

export default orders;
