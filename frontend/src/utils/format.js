/**
 * formatWatts
 * Rounds to a whole number and appends 'W'.
 * e.g. 847.3 → '847W', null → '0W'
 */
export const formatWatts = (watts) => {
  if (watts === null || watts === undefined) return '0W';
  return `${Math.round(watts)}W`;
};

/**
 * formatKwh
 * Whole numbers → no decimals (e.g. '200 kWh').
 * Fractional values → exactly 4 decimal places (e.g. '0.0012 kWh').
 * null/undefined → '0 kWh'.
 */
export const formatKwh = (kwh) => {
  if (kwh === null || kwh === undefined) return '0 kWh';
  const n = Number(kwh);
  return n % 1 === 0 ? `${n} kWh` : `${n.toFixed(4)} kWh`;
};

/**
 * formatBudget
 * Rounds to 0 decimals, formats with Indian comma grouping, prepends '₹'.
 * e.g. 2000.75 → '₹2,000', null → '₹0'
 */
export const formatBudget = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
};

/**
 * formatBill
 * Identical logic to formatBudget — 0 decimals, Indian commas, '₹' prefix.
 * e.g. 1345.9 → '₹1,346', null → '₹0'
 */
export const formatBill = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString('en-IN')}`;
};

/**
 * formatPercent
 * Displays exactly 1 decimal place and appends '%'.
 * e.g. 12.5 → '12.5%', null → '0%'
 */
export const formatPercent = (percent) => {
  if (percent === null || percent === undefined) return '0%';
  return `${Number(percent).toFixed(1)}%`;
};
