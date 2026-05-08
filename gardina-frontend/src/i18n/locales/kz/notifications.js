const notifications = {
  title: 'Хабарландырулар',
  empty: 'Әзірге хабарландыру жоқ',
  emptyHint: 'Маңызды оқиғалар осы жерде шығады',
  loading: 'Жүктелуде…',
  markAllRead: 'Барлығын оқылды деп белгілеу',
  unread: 'оқылмаған',

  filters: {
    all: 'Барлығы',
    unread: 'Оқылмаған',
    today: 'Бүгін',
  },

  types: {
    deal_status: 'Мәміле күйі',
    payment: 'Төлем',
    measurement_reminder: 'Өлшем туралы еске салу',
    task_assigned: 'Тапсырма берілді',
    proposal_viewed: 'Клиент КП-ны қарады',
    stock_low: 'Қоймада аз',
    info: 'Ақпарат',
  },

  badges: {
    important: 'Маңызды',
  },

  permissionPrompt: {
    title: 'Push-хабарламаларды қосу керек пе?',
    body: 'Мәмілелер мен тапсырмалар бойынша жаңарту өткізіп алмау үшін.',
    enable: 'Қосу',
    later: 'Кейінірек',
  },
};

export default notifications;
