/**
 * Locale-aware date helpers.
 *
 * The lang argument matches the I18nContext lang ('ru' | 'kz'). Defaults
 * to 'ru' to match the app default. When called from a component that
 * already has access to the lang via useI18n(), pass it through.
 */

const MONTH_NAMES = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  kz: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
       'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'],
};

const MONTH_SHORT = {
  ru: ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'],
  kz: ['Қаң','Ақп','Нау','Сәу','Мам','Мау','Шіл','Там','Қыр','Қаз','Қар','Жел'],
};

const WEEKDAYS_FULL = {
  ru: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  kz: ['Жексенбі','Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі'],
};

const WEEKDAYS_SHORT = {
  ru: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
  kz: ['Жек','Дүй','Сей','Сәр','Бей','Жұм','Сен'],
};

const RELATIVE = {
  ru: { today: 'Сегодня', tomorrow: 'Завтра', yesterday: 'Вчера' },
  kz: { today: 'Бүгін',   tomorrow: 'Ертең', yesterday: 'Кеше'   },
};

function pickLang(lang) {
  return MONTH_NAMES[lang] ? lang : 'ru';
}

export const monthNames = (lang = 'ru') => MONTH_NAMES[pickLang(lang)];
export const monthShort = (lang = 'ru') => MONTH_SHORT[pickLang(lang)];
export const weekdayNames = (lang = 'ru') => WEEKDAYS_FULL[pickLang(lang)];
export const weekdayShort = (lang = 'ru') => WEEKDAYS_SHORT[pickLang(lang)];

/**
 * Format time in 24-hour format (HH:mm) — locale-independent.
 */
export const formatTime24 = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date with smart "Today/Tomorrow/Yesterday" labels.
 */
export const formatDate = (dateString, lang = 'ru') => {
  if (!dateString) return '';
  const L = pickLang(lang);

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime())     return RELATIVE[L].today;
  if (targetDate.getTime() === tomorrow.getTime())  return RELATIVE[L].tomorrow;
  if (targetDate.getTime() === yesterday.getTime()) return RELATIVE[L].yesterday;

  const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const day = targetDate.getDate();
  const month = MONTH_NAMES[L][targetDate.getMonth()];

  if (daysUntil > 0 && daysUntil <= 7) {
    return `${WEEKDAYS_FULL[L][targetDate.getDay()]}, ${day} ${month}`;
  }
  return `${day} ${month}`;
};

/**
 * Format datetime: "15 декабря, 14:30"
 */
export const formatDateTime = (dateTimeString, lang = 'ru') => {
  if (!dateTimeString) return '';
  return `${formatDate(dateTimeString, lang)}, ${formatTime24(dateTimeString)}`;
};

/**
 * Format datetime with smart label: "15 декабря (Сегодня) • 14:30"
 */
export const formatDateTimeFull = (dateTimeString, lang = 'ru') => {
  if (!dateTimeString) return '';
  const L = pickLang(lang);

  const date = new Date(dateTimeString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const day = date.getDate();
  const month = MONTH_NAMES[L][date.getMonth()];
  const time = formatTime24(dateTimeString);

  let label = '';
  if (targetDate.getTime() === today.getTime())     label = RELATIVE[L].today;
  else if (targetDate.getTime() === tomorrow.getTime())  label = RELATIVE[L].tomorrow;
  else if (targetDate.getTime() === yesterday.getTime()) label = RELATIVE[L].yesterday;

  return label ? `${day} ${month} (${label}) • ${time}` : `${day} ${month} • ${time}`;
};

// ── Back-compat aliases (legacy callers used the *KZ suffix) ────────────────
export const formatDateKZ = (s) => formatDate(s, 'kz');
export const formatDateTimeKZ = (s) => formatDateTime(s, 'kz');
