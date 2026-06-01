const payments = {
  title: 'Төлемдер',
  status: {
    sufficient: 'Төлем жеткілікті',
    controlNeeded: 'Бақылау қажет',
    high: 'Жоғары қауіп!',
  },
  summary: {
    total: 'Жалпы сома',
    required: 'Қажет (80%)',
    paid: 'Төленген',
    remaining: 'Қалды',
  },
  history: {
    title: 'Төлем тарихы',
    empty: 'Төлемдер әлі жоқ',
  },
  type: {
    prepayment: 'Алдын ала төлем',
    final: 'Қорытынды төлем',
    extra: 'Қосымша төлем',
  },
  partialPercent: '{percent}% ғана',
  warn: {
    attention: 'Назар аударыңыз!',
    production: 'Төлем тек {percent}%. Өндіріске жіберілген, бірақ минимум 80% қажет. Клиентке төлем туралы еске салыңыз!',
    dontInstall: 'Орнатпаңыз!',
    ready: 'Тапсырыс дайын, бірақ клиент тек {percent}% төледі. Орнатпас бұрын қалған {amount} ₸ алу керек!',
  },
  form: {
    addPayment: 'Төлем қосу',
    amount: 'Сома',
    prepayment: 'Алдын ала',
    final: 'Қорытынды',
    extra: 'Қосымша',
    note: 'Ескерту (міндетті емес)',
    saving: 'Сақталуда…',
    save: 'Сақтау',
    cancel: 'Болдырмау',
  },

  risk: {
    safe: { label: 'Қауіпсіз', desc: 'Төлем жеткілікті' },
    medium: { label: 'Орташа қауіп', desc: '{amount} ₸ жетіспейді' },
    high: { label: 'Жоғары қауіп', desc: 'Тек {percent}% төленген' },
  },
  paidShort: 'төленген',
  detail: {
    total: 'Барлығы',
    paid: 'Төленген',
    remaining: 'Қалды',
  },
  indicator: {
    highWarn: 'Төлем өте аз. Өндіріске жібермес бұрын басшылықпен келісіңіз.',
    mediumWarnTitle: 'Бақылау қажет!',
    mediumWarnBody: 'Минимум {percent}% қажет. Клиентке төлем туралы еске салыңыз.',
  },
  action: {
    call: 'Қоңырау шалу',
    message: 'Хабарлама',
  },
  unpriced: {
    title: 'Смета анықталмаған',
    subtitle: 'Сома есептелгеннен кейін шығады',
  },

  section: {
    title: 'Төлем қауіптері',
    totalUnpaid: 'Жалпы төленбеген сома:',
    empty: 'Қауіпті төлемдер жоқ',
    emptySubtitle: 'Барлық тапсырыстар қауіпсіз',
  },
  row: {
    status: 'Статус:',
    days: 'Күндер:',
    paid: 'Төленген:',
    shortfall: 'Жетіспейді:',
  },
  orderStatus: {
    in_production: 'Өндірісте',
    ready: 'Дайын',
    installing: 'Орнатылуда',
  },
  warnHigh: 'Өндірісте {days} күн, төлем тек {percent}%!',
  warnMedium: 'Орнатпас бұрын доплата алу керек!',
  level: {
    high: { label: 'Жоғары қауіп', desc: 'Төлем 50% төмен — шұғыл әрекет қажет' },
    medium: { label: 'Орташа қауіп', desc: 'Төлем 50-79% — бақылау қажет' },
    safe: { label: 'Қауіпсіз', desc: 'Төлем 80%+ — барлығы жақсы' },
  },
  rowAction: {
    call: 'Қоңырау',
    remind: 'Еске салу',
  },
};

export default payments;
