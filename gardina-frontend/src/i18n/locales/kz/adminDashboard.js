const adminDashboard = {
  title: 'Админ панелі',
  analyticsError: 'Аналитиканың бір бөлігі жүктелмеді. Деректер толық болмауы мүмкін.',
  retry: 'Қайталау',
  tabs: {
    overview: 'Жалпы',
    timeline: 'Таймлайн',
    finance: 'Қаржы',
    team: 'Команда',
    products: 'Продукттар',
    clients: 'Клиенттер',
    leads: 'Сайттан өтінім',
  },
  widgets: {
    paymentRisks: {
      title: 'Тәуекелдегі ақша',
      empty: 'Барлық тапсырыс төленген',
      action: 'Барлық тапсырыс',
      daysShort: 'к',
      overdue: '14 күннен асқан: {count}',
    },
    today: {
      title: 'Бүгін',
      empty: 'Бүгінге өлшем де, жаңа өтінім де жоқ',
      action: 'Барлық өлшем',
      measurements: 'Бүгінгі өлшем',
      newLeads: 'Жаңа өтінім',
    },
    revenue: {
      title: '6 айдағы түсім',
    },
    funnel: {
      title: 'Сату воронкасы',
      empty: 'Кезеңде мәміле жоқ',
      action: 'Воронканы ашу',
      stages: {
        leads: 'Лидтер',
        meetings: 'Өлшемдер',
        proposals: 'Ұсыныстар',
        contracts: 'Келісімшарттар',
        completed: 'Аяқталған',
      },
    },
    topProducts: {
      title: 'Сату көшбасшылары',
      empty: 'Кезеңде сатылым болмады',
      action: 'Каталог',
      orders: '{count} тапсырыста',
    },
    sources: {
      title: 'Клиент көздері',
      empty: 'Кезеңде жаңа клиент жоқ',
      action: 'Барлық клиент',
    },
    efficiency: {
      title: 'Тиімділік',
      empty: 'Дерек әзірге жоқ',
      avgTime: 'Өлшем',
      hoursShort: ' сағ',
      conversion: 'Конверсия',
      avgCheck: 'Орташа чек',
      satisfaction: 'Баға',
    },
    recent: {
      title: 'Соңғы өлшемдер',
      empty: 'Өлшем жоқ',
      action: 'Барлығын көру',
    },
    retention: {
      title: 'Қайталама клиенттер',
      empty: 'Дерек әзірге жоқ',
      returning: 'Қайталама:',
      new: 'Жаңа:',
    },
  },
  sections: {
    quickActions: 'Жылдам әрекеттер',
    measurementsTimeline: 'Өлшемдер Timeline',
    financialAnalysis: 'Қаржылық талдау',
    teamPerformance: 'Команда өнімділігі',
    productsAnalytics: 'Өнімдер аналитикасы',
    clientsAnalytics: 'Клиенттер аналитикасы',
  },
};

export default adminDashboard;
