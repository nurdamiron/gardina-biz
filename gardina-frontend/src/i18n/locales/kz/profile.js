const profile = {
  title: 'Профиль',
  defaultUserName: 'Пайдаланушы',
  unknownPhone: '—',
  loginLabel: 'Логин',

  roles: {
    admin: 'Әкімші',
    manager: 'Менеджер',
    sales_manager: 'Сатылым менеджері',
    sales: 'Сатылым',
    designer: 'Дизайнер',
    production: 'Өндіріс',
    installer: 'Орнатушы',
    employee: 'Қызметкер',
  },

  menu: {
    personal: 'Жеке мәліметтер',
    personalDesc: 'Аты-жөні, телефон',
    notifications: 'Хабарландырулар',
    notificationsDesc: 'Push, email баптаулары',
    password: 'Құпия сөзді өзгерту',
    passwordDesc: 'Қауіпсіздік',
    help: 'Көмек',
    helpDesc: 'Байланыс, нұсқаулық',
  },

  edit: {
    title: 'Жеке мәліметтер',
    name: 'Аты-жөні',
    namePlaceholder: 'Аты-жөніңізді енгізіңіз',
    phone: 'Логин / Телефон',
    phonePlaceholder: '+7 (XXX) XXX-XX-XX',
    errorNameRequired: 'Аты міндетті түрде толтырылуы керек',
    errorGeneric: 'Қате орын алды',
  },

  password: {
    title: 'Құпия сөзді өзгерту',
    current: 'Ағымдағы пароль',
    currentPlaceholder: 'Ағымдағы парольді енгізіңіз',
    next: 'Жаңа пароль',
    nextPlaceholder: 'Кемінде 6 таңба',
    confirm: 'Жаңа парольді растау',
    confirmPlaceholder: 'Парольді қайталаңыз',
    submit: 'Өзгерту',
    successTitle: 'Пароль сәтті өзгертілді!',
    errorAllRequired: 'Барлық өрістерді толтырыңыз',
    errorTooShort: 'Жаңа пароль кемінде 6 таңба болуы керек',
    errorMismatch: 'Жаңа парольдер сәйкес келмейді',
  },

  help: {
    title: 'Көмек',
    contact: 'Байланыс',
    contactValue: '+7 (777) 123-45-67',
    email: 'Email',
    emailValue: 'support@gardina.kz',
    schedule: 'Жұмыс уақыты',
    scheduleValue: 'Дс–Жм: 09:00–18:00',
    appVersion: 'Gardina v1.0.0',
  },

  logout: {
    cta: 'Шығу',
    confirmTitle: 'Шығу',
    confirmText: 'Жүйеден шыққыңыз келе ме?',
  },
};

export default profile;
