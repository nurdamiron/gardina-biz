const adminReports = {
  title: 'Есептер',
  periods: {
    d7: '7 күн',
    d30: '30 күн',
    d90: '3 ай',
    d365: '1 жыл',
  },
  sections: {
    overview: 'Жалпы көрсеткіштер',
    revenueTrend: 'Табыс тренді',
    revenueBreakdown: 'Табыс құрамы',
    designersRanking: 'Дизайнерлер рейтингі',
    teamKpi: 'Команда KPI',
    clientFunnel: 'Клиент воронкасы',
    topProducts: 'Үздік маталар',
    paymentRisks: 'Төлем тәуекелдері',
  },
  stats: {
    totalRevenue: 'Жалпы табыс',
    completedDeals: 'Аяқталған',
    totalDeals: 'Барлық мәмілелер',
    totalClients: 'Клиенттер',
  },
  revenueParts: {
    fabric: 'Маталар',
    sewing: 'Тігу',
    installation: 'Орнату',
    delivery: 'Жеткізу',
  },
  teamKpiLabels: {
    avgConversion: 'Орт. конверсия',
    avgDeal: 'Орт. сома',
    closingSpeed: 'Жабу жылдамдығы',
    active: 'Белсенді',
  },
  clientFunnelStages: {
    newClient: 'Жаңа клиент',
    withMeasurements: 'Өлшем тапсырысы',
    withProposals: 'Ұсыныс жіберілді',
    withContracts: 'Шарт жасалды',
    completed: 'Аяқталды',
  },
  commission: 'комиссия',
  soldTimes: '{count} рет сатылды',
  daysOverdue: '{days} күн өтті',
  daysShort: '{days} күн',
  riskLevels: {
    high: 'Жоғары',
    medium: 'Орташа',
  },
};

export default adminReports;
