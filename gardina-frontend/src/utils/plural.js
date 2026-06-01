/**
 * Russian plural agreement.
 *
 * RU nouns take three forms depending on the count:
 *   one  → 1, 21, 31, 101 …  (but NOT 11)
 *   few  → 2–4, 22–24 …      (but NOT 12–14)
 *   many → 0, 5–20, 25–30 …
 *
 * Example: pluralRu(1, ['сделка','сделки','сделок'])  → "сделка"
 *          pluralRu(3, ['сделка','сделки','сделок'])  → "сделки"
 *          pluralRu(5, ['сделка','сделки','сделок'])  → "сделок"
 *
 * @param {number} count
 * @param {[string, string, string]} forms [one, few, many]
 * @returns {string} the correct noun form (without the number)
 */
export function pluralRu(count, [one, few, many]) {
  const n = Math.abs(Math.trunc(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/**
 * Locale-aware noun form for a count.
 * Kazakh has no number-based plural agreement (the noun stays singular after
 * a numeral: "2 мәміле", "5 мәміле"), so the KZ form is just `forms[0]`.
 *
 * @param {number} count
 * @param {{ru: [string,string,string], kz: string}} forms
 * @param {'ru'|'kz'} lang
 * @returns {string} the noun form only
 */
export function pluralUnit(count, forms, lang = 'ru') {
  if (lang === 'kz') return forms.kz;
  return pluralRu(count, forms.ru);
}

/**
 * Count + correctly-declined noun, e.g. "3 сделки".
 *
 * @param {number} count
 * @param {{ru: [string,string,string], kz: string}} forms
 * @param {'ru'|'kz'} lang
 * @returns {string}
 */
export function pluralize(count, forms, lang = 'ru') {
  const n = Math.trunc(Number(count) || 0);
  return `${n} ${pluralUnit(n, forms, lang)}`;
}

/** Common nouns reused across the app. */
export const NOUNS = {
  deal:        { ru: ['сделка', 'сделки', 'сделок'],          kz: 'мәміле' },
  measurement: { ru: ['замер', 'замера', 'замеров'],          kz: 'өлшем' },
  room:        { ru: ['помещение', 'помещения', 'помещений'], kz: 'бөлме' },
  order:       { ru: ['заказ', 'заказа', 'заказов'],          kz: 'тапсырыс' },
  payment:     { ru: ['платёж', 'платежа', 'платежей'],       kz: 'төлем' },
  day:         { ru: ['день', 'дня', 'дней'],                 kz: 'күн' },
};

export default pluralize;
