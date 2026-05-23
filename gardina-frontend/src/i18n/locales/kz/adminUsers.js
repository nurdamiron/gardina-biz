const adminUsers = {
  title: 'Қызметкерлер',
  create: 'Жасау',
  searchPlaceholder: 'Аты немесе логин бойынша іздеу…',
  noUsers: 'Пайдаланушылар табылмады',

  roles: {
    designer: 'Дизайнер',
    manager: 'Менеджер',
    sales_manager: 'Сатылым менеджері',
    admin: 'Әкімші',
    production: 'Өндіріс',
    installer: 'Орнатушы',
  },

  statuses: {
    active: 'Белсенді',
    deactivated: 'Деактивация',
  },

  modals: {
    createTitle: 'Жаңа қызметкер',
    editTitle: 'Қызметкерді өңдеу',
    resetPasswordTitle: 'Парольді қалпына келтіру',
    deactivateTitle: 'Деактивациялау',
    deactivateConfirm: 'Шынымен бұл қызметкерді деактивациялайсыз ба?',
    saveLabel: 'Сақтау',
    createLabel: 'Жасау',
    changeLabel: 'Өзгерту',
    deactivateLabel: 'Деактивациялау',
    saving: 'Сақталуда…',
  },

  fields: {
    fullName: 'Аты-жөні *',
    fullNamePlaceholder: 'Толық аты',
    login: 'Логин / Телефон *',
    loginPlaceholder: 'akbota немесе +77001234567',
    password: 'Пароль *',
    passwordPlaceholder: 'Кемінде 6 таңба',
    role: 'Рөлі',
    newPassword: 'Жаңа пароль',
    confirmPassword: 'Растау',
  },

  errors: {
    allRequired: 'Барлық өрістерді толтырыңыз',
    passwordTooShort: 'Пароль кемінде 6 таңба',
    nameRequired: 'Аты міндетті',
    passwordsMismatch: 'Парольдер сәйкес келмейді',
    generic: 'Қате орын алды',
  },

  toast: {
    userCreated: 'Пайдаланушы сәтті жасалды',
    saved: 'Өзгерістер сақталды',
    passwordChanged: 'Пароль өзгертілді',
    activated: 'Активацияланды',
    deactivated: 'Деактивацияланды',
    userDeactivated: 'Пайдаланушы деактивацияланды',
  },

  table: {
    user: 'Пайдаланушы',
    contact: 'Байланыс',
    role: 'Рөл',
    status: 'Статус',
    created: 'Тіркелді',
    actions: 'Әрекеттер',
  },
};

export default adminUsers;
