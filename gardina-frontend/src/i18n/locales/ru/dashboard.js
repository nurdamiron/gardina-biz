const dashboard = {
  // Common
  greeting: 'Здравствуйте',
  todayAt: 'Сегодня',
  loading: 'Загрузка дашборда…',
  empty: 'Данных пока нет',
  more: 'Ещё',
  viewAll: 'Все',

  // Stat cards
  stats: {
    totalMeasurements: 'Всего замеров',
    completedSuffix: 'завершено',
    totalClients: 'Клиенты',
    clientsSubtext: 'Всего клиентов',
    totalDeals: 'Сделки',
    dealsSubtext: 'Все сделки',
    revenue: 'Выручка',
    revenueSubtext: 'Общая выручка',
    averageCheck: 'Средний чек',
    averageCheckSubtitle: 'на замер',
    conversion: 'Конверсия',
    conversionSubtitle: 'замер → продажа',
    monthlyKpi: 'KPI за месяц',
    monthlyTarget: 'Цель',
    measurementUnit: 'замер',
    dealUnit: 'сделок',
  },

  // Sections
  sections: {
    todayTasks: 'Сегодня',
    todayTasksEmpty: 'На сегодня задач нет',
    todayTasksHint: 'Новые задачи назначает менеджер',
    upcomingMeasurements: 'Предстоящие замеры',
    noUpcoming: 'Нет запланированных замеров',
    noUpcomingHint: 'Когда менеджер назначит задачу, придёт уведомление',
    revenueDynamics: 'Динамика выручки',
    salesFunnelMini: 'Воронка продаж (мини)',
    weeklyActivity: 'Недельная активность',
    needsAction: 'Требуют действий',
    designersKpi: 'KPI дизайнеров',
    managersKpi: 'KPI менеджеров',
    designersRanking: 'Рейтинг дизайнеров',
    salesByCategory: 'Продажи по категориям',
    monthlyTrend: 'Тренд продаж по месяцам',
    topProducts: 'Топ продуктов',
    paymentRisks: 'Рисковые оплаты',
  },

  // Funnel
  funnel: {
    leads: 'Лиды',
    proposals: 'Предложения',
    contracts: 'Контракты',
    inProduction: 'В производстве',
    completed: 'Завершено',
  },

  // Statuses (used as chips on cards)
  statuses: {
    scheduled: 'Запланирован',
    in_progress: 'В работе',
    measured: 'Замер сделан',
    in_production: 'В производстве',
    ready: 'Готов',
    installing: 'Монтаж',
    completed: 'Завершено',
    cancelled: 'Отменён',
    proposal_sent: 'Ждём ответа клиента',
    payment_pending: 'Ждём оплату',
    payment_due: 'Оплата требуется',
    confirm_required: 'Требуется подтверждение',
  },

  // Default fallbacks
  fallbacks: {
    client: 'Клиент',
    address: 'Адрес не указан',
    designer: 'Дизайнер',
  },

  // Categories (for charts)
  categories: {
    curtain: 'Шторы',
    tulle: 'Тюль',
    cornice: 'Карниз',
    jalousie: 'Жалюзи',
    decor: 'Декор',
    other: 'Другое',
  },

  // Quick actions for designers
  quickActions: {
    newClient: 'Новый клиент',
    newMeasurement: 'Новый замер',
    newOrder: 'Новый заказ',
    funnel: 'Воронка',
  },

  designerHello: 'Привет, {name}!',
  todayLabel: 'Сегодня',
  thisWeek: 'Неделя',
  thisMonth: 'В этом месяце',
  completedMeasurements: 'Выполнено замеров',
  inCompany: 'В компании',
  monthlyMetric: 'Цель за месяц',
  myResults: 'Мой результат',
  sales: 'Продажи',
  goalPrefix: 'Цель',
  urgent: 'СРОЧНО',
  nearestMeeting: 'Ближайшая встреча',
  measurementType: 'Замер',
  scheduleMeeting: 'Назначить встречу',
  upcomingMeetings: 'Предстоящие встречи',
  start: 'Начать',
  dealShortLabel: 'Сделка',

  ranking: {
    designer: 'Дизайнер',
  },

  // KPICard (designer dashboard)
  kpiCard: {
    outOf: 'из {target} {unit}',
    done: 'Выполнено',
    inProgress: 'В процессе',
    behind: 'Отставание',
  },

  // FunnelChart
  funnelChart: {
    noData: 'Нет данных',
    conversion: 'Конверсия',
    totalConversion: 'Общая конверсия:',
  },

  manager: {
    panelTitle: 'Панель менеджера',
    hello: 'Привет, {name}!',
    measurements: 'Замеры',
    measurementsScheduled: 'Запланированы',
    proposalsSent: 'Отправлены',
    closedSuccess: 'Успешно закрыто',
    revenueDeals: 'Все сделки',
    urgentTasks: 'Срочные задачи',
    allDone: 'Все задачи выполнены!',
    paymentPending: '{name} — ждём оплату',
    confirmRequired: '{name} — нужно подтвердить',
    todayMeasurements: 'Замеры на сегодня',
    noTodayMeasurements: 'На сегодня замеров нет',
    topDesigners: 'Топ дизайнеров',
    thisMonth: 'этот месяц',
    salesUnit: 'продаж',
    newOrder: 'Создать новый заказ',
    clients: 'Клиенты',
    orders: 'Заказы',
  },

  // Designer dashboard
  designer: {
    error: 'Ошибка',
    retry: 'Повторить',
    logout: 'Выйти',
    urgentBadge: 'СРОЧНО',
    call: 'Позвонить',
    personalRating: 'Личный рейтинг',
    nextLevelPrefix: 'До следующего уровня',
    nextLevelSuffix: 'замеров',
    rankPositionUnit: 'позиции',
    todayTasks: 'Задачи на сегодня',
    tomorrow: 'Завтра',
    upcomingTasks: 'Предстоящие задачи',
    viewAll: 'Все →',
  },

  // Lang-aware month/weekday arrays for designer date formatting
  dateNames: {
    monthsRu: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    weekdaysRu: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  },
};

export default dashboard;
