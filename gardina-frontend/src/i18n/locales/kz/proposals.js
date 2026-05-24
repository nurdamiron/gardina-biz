const proposals = {
  title: 'Коммерциялық ұсыныс',
  back: 'Өлшемге',

  fields: {
    proposalNumber: 'КП нөмірі',
    client: 'Клиент',
    address: 'Мекенжай',
    date: 'Күні',
    validUntil: 'Қолданыс мерзімі',
    items: 'Құрамы',
    subtotal: 'Аралық сомасы',
    discount: 'Жеңілдік',
    total: 'Жиыны',
    note: 'Ескертпе',
    paymentTerms: 'Төлем шарттары',
  },

  table: {
    no: '№',
    name: 'Атауы',
    quantity: 'Саны',
    unit: 'Бірлік',
    price: 'Бағасы',
    sum: 'Сомасы',
  },

  actions: {
    download: 'PDF жүктеу',
    print: 'Басып шығару',
    send: 'Клиентке жіберу',
    edit: 'Өңдеу',
    duplicate: 'Көшіру',
  },

  toast: {
    sent: 'КП жіберілді',
    downloaded: 'PDF дайын',
    saveError: 'Сақтау сәтсіз',
  },

  empty: 'КП әзірге құрылмаған',
  loading: 'Жүктелуде…',
  notFound: 'КП табылмады',

  print: {
    button: 'Басып шығару (PDF)',
    salonTagline: 'Перделер салоны',
    addressLine: '📍 Мекен-жайы: Төле би 123',
    phoneLine: '📞 Тел: +7 707 942 9827',
    instagramLine: '📷 Instagram: @gardina.kz',
    estimate: 'СМЕТА',
    dateLabel: 'Күні',
    customerLabel: 'Тапсырыс беруші',
    designerLabel: 'Дизайнер',
    roomsHeading: 'Бөлмелер тізімі',
    windowSuffix: '(Терезе #{n})',
    tableName: 'Атауы',
    tableQty: 'Мөлшер',
    tablePrice: 'Баға',
    tableSum: 'Сома',
    materialsServices: 'Маталар мен қызметтер',
    delivery: 'Жеткізу',
    grandTotal: 'ЖАЛПЫ',
    footerTagline: 'Gardina — перделер мен жабындылар',
    footerThanks: 'Рахмет, бізді таңдағаныңызға!',
  },
};

export default proposals;
