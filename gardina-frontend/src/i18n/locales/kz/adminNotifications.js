const adminNotifications = {
  title: 'Хабарламалар',
  tabs: {
    send: 'Жіберу',
    history: 'Тарих',
    stats: 'Статистика',
  },
  sections: {
    recipients: 'Алушылар',
    message: 'Хабарлама',
    byType: 'Түр бойынша',
    recent7d: 'Соңғы 7 күн',
  },
  recipientFilters: {
    all: 'Барлық пайдаланушылар',
    admin: 'Әкімшілер',
    manager: 'Менеджерлер',
    designer: 'Дизайнерлер',
  },
  types: {
    info: 'Ақпарат',
    success: 'Сәтті',
    warning: 'Ескерту',
    error: 'Қате',
  },
  fields: {
    title: 'Тақырып',
    titlePlaceholder: 'Хабарлама туралы',
    body: 'Мәтін',
    bodyPlaceholder: 'Толық хабарлама',
    actionUrl: 'Сілтеме (міндетті емес)',
    sendPush: 'Push жіберу',
  },
  send: 'Жіберу',
  sending: 'Жіберілуде…',
  sentSuccess: 'Жіберілді: {count}',
  errorEmpty: 'Тақырып пен мәтінді толтырыңыз',
  errorSend: 'Жіберу мүмкін болмады',
};

export default adminNotifications;
