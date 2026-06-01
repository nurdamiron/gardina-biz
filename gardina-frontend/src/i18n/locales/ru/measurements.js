const measurements = {
  title: 'Замеры',
  empty: 'Замеров пока нет',
  emptyHint: 'Новые задачи назначает менеджер',
  loading: 'Загрузка замеров…',

  tabs: {
    planned: 'Запланированные',
    completed: 'Завершённые',
  },

  card: {
    urgent: 'СРОЧНО',
    unknownClient: 'Клиент',
    room: 'Помещение',
    unknownRoom: '—',
    start: 'Начать',
    completed: 'Завершено',
  },

  status: {
    scheduled: 'Запланирован',
    in_progress: 'В работе',
    completed: 'Завершён',
    cancelled: 'Отменён',
    pending: 'Ожидает',
  },

  groups: {
    today: 'Сегодня',
    tomorrow: 'Завтра',
    yesterday: 'Вчера',
    future: 'Будущие',
  },

  detail: {
    numberPrefix: 'Замер',
    urgent: 'СРОЧНО',
    loading: 'Загрузка…',
    errorTitle: 'Ошибка',
    notFound: 'Замер не найден',
    back: 'Назад',
    unknownClient: 'Без имени',
    openOnMap: 'Открыть на карте',
    generalNote: 'Общее примечание',
    completedTitle: 'Замер завершён',
    completedSubtitle: 'Данные успешно сохранены',
  },

  rooms: {
    title: 'Помещения',
    unit: 'помещ.',
    empty: 'Помещения пока не добавлены',
    add: 'Добавить помещение',
    edit: 'Изменить',
    fabricUnit: 'ткань',
    fabrics: 'Ткани',
    estimate: 'Смета',
    total: 'Итого:',
    photos: 'Фото',
    note: 'Примечание',
    tulle: 'Тюль (x3)',
    curtain: 'Штора (x2)',
  },

  estimate: {
    sewing: 'Пошив',
    tape: 'Лента',
    hooks: 'Крючки',
    cornice: 'Карниз',
    installation: 'Установка',
  },

  units: {
    meter: 'м',
    roll: 'рулон',
    pack: 'уп.',
    piece: 'шт',
  },

  summary: {
    rooms: 'Помещения',
    noEstimate: 'Без сметы',
    paymentOk: 'Оплата OK',
    paymentRisk: 'Есть риск',
    paymentDanger: 'Опасно!',
    totalAmount: 'Общая сумма',
  },

  warning: {
    title: 'Оплата недостаточна!',
    clientPaidPrefix: 'Клиент оплатил всего ',
    clientPaidSuffix: '%.',
    minRequiredPrefix: 'Минимум 80% (',
    minRequiredSuffix: ' ₸).',
    adviceLabel: 'Рекомендация:',
    advicePrefix: 'Перед отправкой в производство нужно получить ',
    adviceSuffix: ' ₸.',
    addPayment: 'Добавить оплату',
  },

  complete: {
    completing: 'Завершается…',
    needPayment: 'Нужна оплата 80%',
    finish: 'Завершить замер',
    hint: 'Чтобы завершить замер, клиент должен оплатить минимум 80%',
  },

  toast: {
    errorPrefix: 'Ошибка: ',
    enterAmount: 'Введите сумму',
    paymentAdded: 'Оплата добавлена',
    paymentError: 'Ошибка при оплате',
  },
};

export default measurements;
