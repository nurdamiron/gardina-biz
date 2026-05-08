const services = {
  title: 'Услуги',

  card: {
    pricePerUnit: '₸ / {unit}',
    perMeter: 'за м',
    perPiece: 'за шт',
    perHour: 'за час',
    perJob: 'за работу',
    edit: 'Редактировать',
  },

  create: {
    title: 'Новая услуга',
    titleEdit: 'Редактирование услуги',
    fieldName: 'Название',
    fieldNamePlaceholder: 'Например: Пошив штор',
    fieldCategory: 'Категория',
    fieldPrice: 'Цена',
    fieldUnit: 'Единица измерения',
    fieldDescription: 'Описание',
    units: {
      meter: 'м (метр)',
      piece: 'шт (штука)',
      hour: 'час',
      job: 'за работу',
    },
    categories: {
      sewing: 'Пошив',
      installation: 'Монтаж',
      delivery: 'Доставка',
      design: 'Дизайн',
      other: 'Другое',
    },
    submit: 'Сохранить',
    submitNew: 'Создать',
    cancel: 'Отмена',
    errorNameRequired: 'Введите название',
    errorPriceRequired: 'Укажите цену',
  },
};

export default services;
