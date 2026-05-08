const onboarding = {
  title: 'Выберите тариф',
  subtitle:
    'Регистрация завершена. Выберите подходящий вашему салону тариф — выбор сохранится, позже его можно изменить в админ-панели.',
  cycleLabel: 'Цикл оплаты:',
  monthly: 'Помесячно',
  yearly: 'На год',
  bonus: '2 месяца в подарок (10× месячного)',
  current: 'Текущий',
  recommended: 'Рекомендуем',

  start: {
    name: 'Start',
    description: 'Для маленьких салонов: клиенты, воронка, календарь.',
    feature1: '1 салон, до 3 пользователей',
    feature2: 'Базовая аналитика',
    cta: 'Выбрать Start',
  },

  pro: {
    name: 'Pro',
    description: 'Полный цикл: от заявки до монтажа, склад, задачи.',
    feature1: 'До 8 пользователей, полный workflow',
    feature2: '7 дней Pro бесплатно (карта не нужна)',
    ctaTrial: '7 дней бесплатно',
    ctaPaid: 'Pro — оплата ({cycle})',
    cycleMonthly: 'помесячно',
    cycleYearly: 'на год',
  },

  network: {
    name: 'Network',
    description: 'Несколько салонов, сводная аналитика.',
    feature1: 'Все возможности Pro + несколько точек',
    feature2: 'Цена зависит от числа салонов',
    cta: 'Выбрать Network',
  },

  notice:
    'До подключения платёжного шлюза тариф сохраняется как договорённость. На пробном периоде карта не нужна.',
  skipLater: 'Позже — оставить Start',
  saving: 'Сохраняется…',
  selecting: 'Применяется…',
  starting: 'Запуск…',
  please_wait: 'Подождите…',
  errorSaveFailed: 'Сохранение не удалось',
};

export default onboarding;
