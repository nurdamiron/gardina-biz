const adminUsers = {
  title: 'Сотрудники',
  create: 'Создать',
  searchPlaceholder: 'Поиск по имени или логину…',
  noUsers: 'Пользователи не найдены',

  roles: {
    designer: 'Дизайнер',
    manager: 'Менеджер',
    sales_manager: 'Менеджер продаж',
    admin: 'Администратор',
    production: 'Производство',
    installer: 'Монтажник',
  },

  statuses: {
    active: 'Активен',
    deactivated: 'Деактивирован',
  },

  modals: {
    createTitle: 'Новый сотрудник',
    editTitle: 'Редактирование сотрудника',
    resetPasswordTitle: 'Сбросить пароль',
    deactivateTitle: 'Деактивировать',
    deactivateConfirm: 'Точно деактивировать этого сотрудника?',
    saveLabel: 'Сохранить',
    createLabel: 'Создать',
    changeLabel: 'Сменить',
    deactivateLabel: 'Деактивировать',
    saving: 'Сохранение…',
  },

  fields: {
    fullName: 'ФИО *',
    fullNamePlaceholder: 'Полное имя',
    login: 'Логин / Телефон *',
    loginPlaceholder: 'akbota или +77001234567',
    password: 'Пароль *',
    passwordPlaceholder: 'Минимум 6 символов',
    role: 'Роль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтверждение',
  },

  errors: {
    allRequired: 'Заполните все поля',
    passwordTooShort: 'Пароль минимум 6 символов',
    nameRequired: 'Имя обязательно',
    passwordsMismatch: 'Пароли не совпадают',
    generic: 'Произошла ошибка',
  },

  toast: {
    userCreated: 'Сотрудник создан',
    saved: 'Изменения сохранены',
    passwordChanged: 'Пароль изменён',
    activated: 'Активирован',
    deactivated: 'Деактивирован',
    userDeactivated: 'Сотрудник деактивирован',
  },

  table: {
    user: 'Пользователь',
    contact: 'Контакт',
    role: 'Роль',
    status: 'Статус',
    created: 'Зарегистрирован',
    actions: 'Действия',
  },
};

export default adminUsers;
