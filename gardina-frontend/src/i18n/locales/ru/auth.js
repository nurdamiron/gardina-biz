const auth = {
  // Headings
  loginTitle: 'Вход',
  loginSubtitle: 'Система для салонов штор и ателье',
  registerTitle: 'Регистрация',
  registerSubtitle: 'Создайте новый салон или присоединитесь к команде',

  // Modes
  modeNewSalon: 'Новый салон',
  modeJoin: 'Присоединиться',

  // Fields
  organizationName: 'Название салона',
  organizationNamePlaceholder: 'Например: Gardina Алматы',
  organizationSlug: 'Код-ссылка (slug)',
  organizationSlugPlaceholder: 'gardina-almaty',
  organizationSlugHint: 'Только латинские буквы, цифры и дефис. Может потребоваться при входе.',
  organizationSlugJoin: 'Slug салона',
  organizationSlugJoinPlaceholder: 'код от администратора',
  organizationSlugJoinHint:
    'Введите идентификатор салона, полученный от администратора. Если публичная регистрация выключена, режим не сработает.',
  fullName: 'Имя и фамилия',
  fullNamePlaceholder: 'Полное имя',
  loginField: 'Логин',
  loginFieldPlaceholder: 'Телефон, email или логин',
  selectOrganization: 'Выберите салон',
  selectOrganizationHint: 'Этот логин есть в нескольких салонах — выберите нужный',
  fieldRequired: 'Заполните это поле',
  phone: 'Телефон / логин',
  phonePlaceholder: '+7 … или логин',
  email: 'Email',
  emailOptional: '(по желанию)',
  emailPlaceholder: 'you@example.com',
  password: 'Пароль',
  passwordPlaceholderMin: 'Минимум 6 символов',
  passwordConfirm: 'Подтвердите пароль',
  passwordConfirmPlaceholder: 'Введите ещё раз',
  organizationSlugLogin: 'Salon slug',
  organizationSlugLoginOptional: '(если в нескольких салонах)',

  // Buttons
  login: 'Войти',
  loginCta: 'Войти в систему',
  register: 'Регистрация',
  registerSalonCta: 'Зарегистрировать салон',
  registerJoinCta: 'Создать аккаунт',
  showPassword: 'Показать',
  hidePassword: 'Скрыть',

  // Links
  noAccount: 'Нужен новый аккаунт?',
  hasAccount: 'Уже есть аккаунт?',
  forgotPassword: 'Забыли пароль?',
  contactUs: 'Связаться с нами',

  // Consent
  consentText: 'Я прочитал и принимаю',
  consentTerms: 'Условия использования',
  consentAnd: 'и',
  consentPrivacy: 'Политику обработки персональных данных',

  // Validation errors
  errorOrgNameRequired: 'Введите название салона',
  errorSlugRequired: 'Введите slug салона',
  errorSlugTooShort: 'Slug — минимум 2 символа, латиница и цифры',
  errorNameRequired: 'Введите имя и фамилию',
  errorPhoneRequired: 'Нужен телефон или логин',
  errorPasswordTooShort: 'Пароль — минимум 6 символов',
  errorPasswordsMismatch: 'Пароли не совпадают',
  errorConsentRequired: 'Нужно согласиться с условиями и политикой',
  errorLoginFailed: 'Логин или пароль неверны',
  slugChecking: 'Проверяем…',
  slugAvailable: 'Свободен',
  slugTaken: 'Уже занят, выберите другой',

  // Footer
  copyright: '© 2026 Gardina. Все права защищены.',
};

export default auth;
