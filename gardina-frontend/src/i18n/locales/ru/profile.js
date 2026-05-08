const profile = {
  title: 'Профиль',
  defaultUserName: 'Пользователь',
  unknownPhone: '—',
  loginLabel: 'Логин',

  roles: {
    admin: 'Администратор',
    manager: 'Менеджер',
    sales_manager: 'Менеджер продаж',
    sales: 'Продажи',
    designer: 'Дизайнер',
    production: 'Производство',
    installer: 'Монтажник',
    employee: 'Сотрудник',
  },

  menu: {
    personal: 'Личные данные',
    personalDesc: 'Имя, телефон',
    notifications: 'Уведомления',
    notificationsDesc: 'Push, email настройки',
    password: 'Сменить пароль',
    passwordDesc: 'Безопасность',
    help: 'Помощь',
    helpDesc: 'Контакты, инструкция',
  },

  edit: {
    title: 'Личные данные',
    name: 'Имя и фамилия',
    namePlaceholder: 'Введите ваше имя',
    phone: 'Логин / Телефон',
    phonePlaceholder: '+7 (XXX) XXX-XX-XX',
    errorNameRequired: 'Имя обязательно к заполнению',
    errorGeneric: 'Произошла ошибка',
  },

  password: {
    title: 'Сменить пароль',
    current: 'Текущий пароль',
    currentPlaceholder: 'Введите текущий пароль',
    next: 'Новый пароль',
    nextPlaceholder: 'Минимум 6 символов',
    confirm: 'Подтвердите новый пароль',
    confirmPlaceholder: 'Введите ещё раз',
    submit: 'Сменить',
    successTitle: 'Пароль успешно изменён!',
    errorAllRequired: 'Заполните все поля',
    errorTooShort: 'Новый пароль должен быть не менее 6 символов',
    errorMismatch: 'Новые пароли не совпадают',
  },

  help: {
    title: 'Помощь',
    contact: 'Контакт',
    contactValue: '+7 (777) 123-45-67',
    email: 'Email',
    emailValue: 'support@gardina.kz',
    schedule: 'Часы работы',
    scheduleValue: 'Пн–Пт: 09:00–18:00',
    appVersion: 'Gardina v1.0.0',
  },

  logout: {
    cta: 'Выйти',
    confirmTitle: 'Выход',
    confirmText: 'Вы уверены, что хотите выйти?',
  },
};

export default profile;
