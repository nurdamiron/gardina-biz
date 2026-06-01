import React from 'react';
import { formatMoney, formatMoneyShort } from '../../utils/money';

/**
 * Consistent money rendering — single source for the "₸" + grouping,
 * so cards never hand-roll toLocaleString again.
 *  - short: compact form ("2,25 млн ₸") for tight tiles
 */
const MoneyText = ({ value, short = false, lang = 'ru', className = '' }) => (
  <span className={className}>{short ? formatMoneyShort(value, lang) : formatMoney(value)}</span>
);

export default MoneyText;
