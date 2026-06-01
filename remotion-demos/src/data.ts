export const BRAND = {
  primary: '#1b5e45',
  primaryLight: '#2d6a4f',
  primaryDark: '#0f2919',
  accent: '#74c69d',
  bg: '#f1f6f3',
  textMain: '#101916',
  textSecondary: '#4d5c54',
};

export const FPS = 30;
export const INTRO_SEC = 2.6;
export const OUTRO_SEC = 2.8;

export interface RoleConfig {
  id: string;
  video: string;       // file in public/videos
  role: string;        // intro title
  tagline: string;     // intro subtitle
  captions: string[];  // distributed across the screen-recording portion
}

export const ROLES: Record<string, RoleConfig> = {
  designer: {
    id: 'designer',
    video: 'videos/designer.webm',
    role: 'Дизайнер',
    tagline: 'Замеры на объекте и подбор тканей',
    captions: [
      'Личный кабинет: KPI, рейтинг и замеры за месяц',
      'Все назначенные замеры — в одном списке',
      'Открываем замер: клиент, адрес, помещение',
      'Дизайнер выезжает и снимает размеры',
    ],
  },
  manager: {
    id: 'manager',
    video: 'videos/manager.webm',
    role: 'Менеджер',
    tagline: 'Клиенты, сделки и задачи команды',
    captions: [
      'Дашборд менеджера: показатели команды',
      'База клиентов всегда под рукой',
      'Карточка клиента: история и контакты',
      'Сделки команды и их статусы',
      'Задачи на замеры — кто, где и когда',
    ],
  },
  sales: {
    id: 'sales',
    video: 'videos/sales.webm',
    role: 'Продажи',
    tagline: 'Лиды и воронка продаж',
    captions: [
      'Воронка продаж: выручка по этапам',
      'Лиды — все обращения в одном месте',
      'Карточка лида со всеми деталями',
      'Новая заявка на замер за минуту',
    ],
  },
  admin: {
    id: 'admin',
    video: 'videos/admin.webm',
    role: 'Администратор',
    tagline: 'Полный контроль над бизнесом',
    captions: [
      'Аналитика бизнеса: выручка, сделки, клиенты',
      'Каталог тканей и услуг',
      'Команда и роли сотрудников',
      'Отчёты: тренд и структура выручки',
      'Тариф и подписка салона',
    ],
  },
};
