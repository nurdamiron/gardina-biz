const adminNotifications = {
  title: 'Уведомления',
  tabs: {
    send: 'Отправка',
    history: 'История',
    stats: 'Статистика',
  },
  sections: {
    recipients: 'Получатели',
    message: 'Сообщение',
    byType: 'По типу',
    recent7d: 'Последние 7 дней',
  },
  recipientFilters: {
    all: 'Все пользователи',
    admin: 'Администраторы',
    manager: 'Менеджеры',
    designer: 'Дизайнеры',
  },
  types: {
    info: 'Информация',
    success: 'Успешно',
    warning: 'Предупреждение',
    error: 'Ошибка',
  },
  fields: {
    title: 'Заголовок',
    titlePlaceholder: 'О чём уведомление',
    body: 'Текст',
    bodyPlaceholder: 'Развёрнутое сообщение',
    actionUrl: 'Ссылка (необязательно)',
    sendPush: 'Отправить push',
  },
  send: 'Отправить',
  sending: 'Отправка…',
  sentSuccess: 'Отправлено: {count}',
  errorEmpty: 'Заполните заголовок и текст',
  errorSend: 'Не удалось отправить',
};

export default adminNotifications;
