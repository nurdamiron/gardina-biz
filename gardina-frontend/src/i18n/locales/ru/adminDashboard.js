const adminDashboard = {
  title: 'Панель админа',
  analyticsError: 'Не удалось загрузить часть аналитики. Данные могут быть неполными.',
  retry: 'Повторить',
  tabs: {
    overview: 'Обзор',
    timeline: 'Таймлайн',
    finance: 'Финансы',
    team: 'Команда',
    products: 'Продукты',
    clients: 'Клиенты',
    leads: 'Заявки с сайта',
  },
  widgets: {
    paymentRisks: {
      title: 'Деньги на риске',
      empty: 'Все заказы оплачены',
      action: 'Все заказы',
      daysShort: 'д',
      overdue: 'Просрочено больше 14 дней: {count}',
    },
    today: {
      title: 'Сегодня',
      empty: 'На сегодня замеров и новых заявок нет',
      action: 'Все замеры',
      measurements: 'Замеров сегодня',
      newLeads: 'Новых заявок',
    },
    revenue: {
      title: 'Выручка за 6 месяцев',
    },
    funnel: {
      title: 'Воронка продаж',
      empty: 'Сделок за период нет',
      action: 'Открыть воронку',
      stages: {
        leads: 'Лиды',
        meetings: 'Замеры',
        proposals: 'Предложения',
        contracts: 'Контракты',
        completed: 'Завершено',
      },
    },
    topProducts: {
      title: 'Топ продаж',
      empty: 'Продаж за период не было',
      action: 'Каталог',
      orders: 'в {count} заказах',
    },
    sources: {
      title: 'Источники клиентов',
      empty: 'Новых клиентов за период нет',
      action: 'Все клиенты',
    },
    efficiency: {
      title: 'Эффективность',
      empty: 'Данных пока нет',
      avgTime: 'Замер',
      hoursShort: ' ч',
      conversion: 'Конверсия',
      avgCheck: 'Средний чек',
      satisfaction: 'Оценка',
    },
    recent: {
      title: 'Последние замеры',
      empty: 'Замеров нет',
      action: 'Смотреть все',
    },
    retention: {
      title: 'Повторные клиенты',
      empty: 'Данных пока нет',
      returning: 'Повторных:',
      new: 'Новых:',
    },
  },
  sections: {
    quickActions: 'Быстрые действия',
    measurementsTimeline: 'Таймлайн замеров',
    financialAnalysis: 'Финансовая аналитика',
    teamPerformance: 'Эффективность команды',
    productsAnalytics: 'Аналитика продуктов',
    clientsAnalytics: 'Аналитика клиентов',
  },
};

export default adminDashboard;
