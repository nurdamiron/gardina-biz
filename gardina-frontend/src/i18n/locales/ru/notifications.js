const notifications = {
  title: 'Уведомления',
  empty: 'Уведомлений пока нет',
  emptyHint: 'Здесь будут появляться важные события',
  loading: 'Загрузка…',
  markAllRead: 'Прочитать все',
  unread: 'непрочитано',

  filters: {
    all: 'Все',
    unread: 'Непрочитанные',
    today: 'Сегодня',
  },

  types: {
    deal_status: 'Статус сделки',
    payment: 'Оплата',
    measurement_reminder: 'Напоминание о замере',
    task_assigned: 'Назначена задача',
    proposal_viewed: 'Клиент посмотрел КП',
    stock_low: 'Мало на складе',
    info: 'Информация',
  },

  badges: {
    important: 'Важно',
  },

  permissionPrompt: {
    title: 'Включить push-уведомления?',
    body: 'Чтобы вы не пропустили важные обновления по сделкам и задачам.',
    enable: 'Включить',
    later: 'Позже',
  },
};

export default notifications;
