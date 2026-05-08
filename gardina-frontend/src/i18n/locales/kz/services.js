const services = {
  title: 'Қызметтер',

  card: {
    pricePerUnit: '₸ / {unit}',
    perMeter: 'м/үшін',
    perPiece: 'дана үшін',
    perHour: 'сағатына',
    perJob: 'жұмыс үшін',
    edit: 'Өңдеу',
  },

  create: {
    title: 'Жаңа қызмет',
    titleEdit: 'Қызметті өңдеу',
    fieldName: 'Атауы',
    fieldNamePlaceholder: 'Мысалы: Перде тігу',
    fieldCategory: 'Категория',
    fieldPrice: 'Бағасы',
    fieldUnit: 'Өлшем бірлігі',
    fieldDescription: 'Сипаттама',
    units: {
      meter: 'м (метр)',
      piece: 'дана',
      hour: 'сағат',
      job: 'жұмыс үшін',
    },
    categories: {
      sewing: 'Тігу',
      installation: 'Монтаж',
      delivery: 'Жеткізу',
      design: 'Дизайн',
      other: 'Басқа',
    },
    submit: 'Сақтау',
    submitNew: 'Қосу',
    cancel: 'Болдырмау',
    errorNameRequired: 'Атауын енгізіңіз',
    errorPriceRequired: 'Бағасын көрсетіңіз',
  },
};

export default services;
