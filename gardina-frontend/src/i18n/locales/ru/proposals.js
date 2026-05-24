const proposals = {
  title: 'Коммерческое предложение',
  back: 'К замеру',

  fields: {
    proposalNumber: 'Номер КП',
    client: 'Клиент',
    address: 'Адрес',
    date: 'Дата',
    validUntil: 'Действительно до',
    items: 'Состав',
    subtotal: 'Промежуточная сумма',
    discount: 'Скидка',
    total: 'Итого',
    note: 'Примечание',
    paymentTerms: 'Условия оплаты',
  },

  table: {
    no: '№',
    name: 'Наименование',
    quantity: 'Количество',
    unit: 'Ед.',
    price: 'Цена',
    sum: 'Сумма',
  },

  actions: {
    download: 'Скачать PDF',
    print: 'Печать',
    send: 'Отправить клиенту',
    edit: 'Редактировать',
    duplicate: 'Дублировать',
  },

  toast: {
    sent: 'КП отправлено',
    downloaded: 'PDF готов',
    saveError: 'Не удалось сохранить',
  },

  empty: 'КП ещё не сформировано',
  loading: 'Загрузка…',
  notFound: 'КП не найдено',

  // Print template
  print: {
    button: 'Печать (PDF)',
    salonTagline: 'Салон штор',
    addressLine: '📍 Адрес: ул. Толе би 123',
    phoneLine: '📞 Тел: +7 707 942 9827',
    instagramLine: '📷 Instagram: @gardina.kz',
    estimate: 'СМЕТА',
    dateLabel: 'Дата',
    customerLabel: 'Заказчик',
    designerLabel: 'Дизайнер',
    roomsHeading: 'Список помещений',
    windowSuffix: '(Окно №{n})',
    tableName: 'Наименование',
    tableQty: 'Количество',
    tablePrice: 'Цена',
    tableSum: 'Сумма',
    materialsServices: 'Материалы и услуги',
    delivery: 'Доставка',
    grandTotal: 'ИТОГО',
    footerTagline: 'Gardina — шторы и покрытия',
    footerThanks: 'Спасибо, что выбрали нас!',
  },
};

export default proposals;
