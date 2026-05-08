const deals = {
  detailTitle: 'Заказ',
  back: 'Назад',
  loading: 'Загрузка заказа…',
  notFound: 'Заказ не найден',

  sections: {
    summary: 'Сводка',
    client: 'Клиент',
    designer: 'Дизайнер',
    measurement: 'Замер',
    proposal: 'Коммерческое предложение',
    payment: 'Оплата',
    timeline: 'История',
    notes: 'Заметки',
    documents: 'Документы',
    actions: 'Действия',
  },

  fields: {
    status: 'Статус',
    paymentStatus: 'Статус оплаты',
    totalAmount: 'Сумма',
    prepayment: 'Аванс',
    finalPayment: 'Остаток',
    deadline: 'Дедлайн',
    address: 'Адрес',
    phone: 'Телефон',
    createdAt: 'Создан',
    updatedAt: 'Обновлён',
    designerCommission: 'Комиссия дизайнера',
  },

  actions: {
    edit: 'Редактировать',
    cancel: 'Отменить заказ',
    completeStep: 'Завершить этап',
    sendProposal: 'Отправить КП',
    addPayment: 'Добавить оплату',
    scheduleInstall: 'Назначить монтаж',
    downloadInvoice: 'Скачать счёт',
    print: 'Печать',
    contactClient: 'Связаться с клиентом',
  },

  empty: {
    proposal: 'КП ещё не отправлено',
    measurement: 'Замер ещё не сделан',
    payment: 'Оплат пока нет',
    notes: 'Заметок нет',
  },

  paymentStatus: {
    pending: 'Не оплачен',
    partial: 'Частично оплачен',
    paid: 'Оплачен',
    refunded: 'Возвращён',
    overdue: 'Просрочен',
  },

  toast: {
    statusChanged: 'Статус изменён',
    paymentAdded: 'Оплата добавлена',
    proposalSent: 'КП отправлено',
    saveError: 'Не удалось сохранить',
  },
};

export default deals;
