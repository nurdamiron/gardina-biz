const adminReports = {
  title: 'Отчёты',
  periods: {
    d7: '7 дней',
    d30: '30 дней',
    d90: '3 месяца',
    d365: '1 год',
  },
  sections: {
    overview: 'Общие показатели',
    revenueTrend: 'Тренд выручки',
    revenueBreakdown: 'Структура выручки',
    designersRanking: 'Рейтинг дизайнеров',
    teamKpi: 'KPI команды',
    clientFunnel: 'Воронка клиентов',
    topProducts: 'Лучшие ткани',
    paymentRisks: 'Риски оплат',
  },
  stats: {
    totalRevenue: 'Общая выручка',
    completedDeals: 'Завершённые',
    totalDeals: 'Всего сделок',
    totalClients: 'Клиенты',
  },
  revenueParts: {
    fabric: 'Ткани',
    sewing: 'Пошив',
    installation: 'Монтаж',
    delivery: 'Доставка',
  },
  teamKpiLabels: {
    avgConversion: 'Сред. конверсия',
    avgDeal: 'Сред. сумма',
    closingSpeed: 'Скорость закрытия',
    active: 'Активные',
  },
  clientFunnelStages: {
    newClient: 'Новый клиент',
    withMeasurements: 'С замером',
    withProposals: 'КП отправлено',
    withContracts: 'Договор заключён',
    completed: 'Завершено',
  },
  commission: 'комиссия',
  soldTimes: 'продано {count} раз',
  daysOverdue: 'просрочено {days} дн.',
  daysShort: '{days} дн.',
  riskLevels: {
    high: 'Высокий',
    medium: 'Средний',
  },
};

export default adminReports;
