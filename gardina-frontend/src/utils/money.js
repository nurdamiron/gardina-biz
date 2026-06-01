/**
 * Normalize a money value to a Number.
 *
 * The API serializes money as a value object: { amount: 920000, currency: 'KZT' }.
 * Rendering that object directly (e.g. `value.toLocaleString()`) yields the string
 * "[object Object]". Use this helper at every render/calculation site so both the
 * value-object shape and a raw number are handled safely.
 *
 * @param {{amount?: number|string}|number|string|null|undefined} m
 * @returns {number}
 */
export const money = (m) =>
  m && typeof m === 'object' ? (Number(m.amount) || 0) : (Number(m) || 0);

/**
 * Full money format with grouped thousands and a tenge sign.
 * Example: 2252000 → "2 252 000 ₸".
 * Uses ru-RU grouping (narrow no-break space) for both locales — readable everywhere.
 */
export const formatMoney = (value) => {
  const n = Math.round(money(value));
  return `${n.toLocaleString('ru-RU')} ₸`;
};

/**
 * Compact money format for tight UI (dashboard hero numbers, KPI cards).
 * Example: 2252000 → "2,25 млн ₸"; 254000 → "254 тыс ₸"; 800 → "800 ₸".
 * Single source of truth for the K/k suffix mess — never mix "K"/"k" again.
 *
 * @param {*} value money value (number or {amount})
 * @param {'ru'|'kz'} lang controls the unit words
 */
export const formatMoneyShort = (value, lang = 'ru') => {
  const n = money(value);
  const abs = Math.abs(n);
  const mln = 'М';
  const ths = 'К';
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    const str = (v >= 10 ? v.toFixed(0) : v.toFixed(1)).replace('.', ',');
    return `${str}${mln} ₸`;
  }
  if (abs >= 1_000) {
    return `${Math.round(n / 1000).toLocaleString('ru-RU')}${ths} ₸`;
  }
  return `${Math.round(n).toLocaleString('ru-RU')} ₸`;
};

export default money;
