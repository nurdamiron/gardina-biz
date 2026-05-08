const deals = {
  detailTitle: 'Тапсырыс',
  back: 'Артқа',
  loading: 'Тапсырыс жүктелуде…',
  notFound: 'Тапсырыс табылмады',

  sections: {
    summary: 'Қысқаша',
    client: 'Клиент',
    designer: 'Дизайнер',
    measurement: 'Өлшем',
    proposal: 'Коммерциялық ұсыныс',
    payment: 'Төлем',
    timeline: 'Тарих',
    notes: 'Ескертпелер',
    documents: 'Құжаттар',
    actions: 'Әрекеттер',
  },

  fields: {
    status: 'Күй',
    paymentStatus: 'Төлем күйі',
    totalAmount: 'Сома',
    prepayment: 'Алдын ала төлем',
    finalPayment: 'Қалдық',
    deadline: 'Мерзім',
    address: 'Мекенжай',
    phone: 'Телефон',
    createdAt: 'Құрылды',
    updatedAt: 'Жаңартылды',
    designerCommission: 'Дизайнер комиссиясы',
  },

  actions: {
    edit: 'Өңдеу',
    cancel: 'Тапсырысты болдырмау',
    completeStep: 'Кезеңді аяқтау',
    sendProposal: 'КП жіберу',
    addPayment: 'Төлем қосу',
    scheduleInstall: 'Монтажды жоспарлау',
    downloadInvoice: 'Шот жүктеу',
    print: 'Басып шығару',
    contactClient: 'Клиентпен байланысу',
  },

  empty: {
    proposal: 'КП әзірге жіберілмеген',
    measurement: 'Өлшем әзірге жасалмаған',
    payment: 'Әзірге төлем жоқ',
    notes: 'Ескертпе жоқ',
  },

  paymentStatus: {
    pending: 'Төленбеген',
    partial: 'Жартылай төленді',
    paid: 'Төленді',
    refunded: 'Қайтарылды',
    overdue: 'Мерзімі өтті',
  },

  toast: {
    statusChanged: 'Күй өзгертілді',
    paymentAdded: 'Төлем қосылды',
    proposalSent: 'КП жіберілді',
    saveError: 'Сақтау сәтсіз',
  },
};

export default deals;
