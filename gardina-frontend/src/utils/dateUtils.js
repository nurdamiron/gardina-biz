/**
 * Format time in 24-hour format (HH:mm) with proper timezone conversion
 * Backend sends time in UTC (e.g., "2025-12-15T06:00:00.000Z" for 12:00 Almaty time)
 * We convert to local time for display
 */
export const formatTime24 = (dateTimeString) => {
  if (!dateTimeString) return '';

  // Parse as Date object - this automatically converts UTC to local time
  const date = new Date(dateTimeString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

/**
 * Format date in Kazakh locale with smart labels (Бүгін, Ертең, etc.)
 */
export const formatDateKZ = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const kazakhMonths = [
    'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
    'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
  ];

  const kazakhWeekdays = ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'];

  // Today
  if (targetDate.getTime() === today.getTime()) {
    return 'Бүгін';
  }

  // Tomorrow
  if (targetDate.getTime() === tomorrow.getTime()) {
    return 'Ертең';
  }

  // Yesterday
  if (targetDate.getTime() === yesterday.getTime()) {
    return 'Кеше';
  }

  // Within next 7 days - show weekday + date
  const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const day = targetDate.getDate();
  const month = kazakhMonths[targetDate.getMonth()];

  if (daysUntil > 0 && daysUntil <= 7) {
    return `${kazakhWeekdays[targetDate.getDay()]}, ${day} ${month}`;
  }

  // Otherwise show date
  return `${day} ${month}`;
};

/**
 * Format datetime in Kazakh with 24-hour time
 */
export const formatDateTimeKZ = (dateTimeString) => {
  if (!dateTimeString) return '';

  const date = formatDateKZ(dateTimeString);
  const time = formatTime24(dateTimeString);

  return `${date}, ${time}`;
};

/**
 * Format datetime with full date + smart label (Бүгін/Ертең)
 * Example: "15 желтоқсан (Бүгін) • 03:11"
 */
export const formatDateTimeFull = (dateTimeString) => {
  if (!dateTimeString) return '';

  const date = new Date(dateTimeString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const kazakhMonths = [
    'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
    'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'
  ];

  const day = date.getDate();
  const month = kazakhMonths[date.getMonth()];
  const time = formatTime24(dateTimeString);

  let label = '';
  if (targetDate.getTime() === today.getTime()) {
    label = 'Бүгін';
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    label = 'Ертең';
  } else if (targetDate.getTime() === yesterday.getTime()) {
    label = 'Кеше';
  }

  if (label) {
    return `${day} ${month} (${label}) • ${time}`;
  } else {
    return `${day} ${month} • ${time}`;
  }
};
