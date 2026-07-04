// Compact French-locale MRU formatting: amounts of 1 million or more are
// shown as "57,16 M MRU" instead of the full digit string, so KPI cards
// stay readable on narrow layouts (e.g. 1366x768) without truncation.
export const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return `${value} MRU`;
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(millions)} M MRU`;
  }
  return `${new Intl.NumberFormat('fr-FR').format(num)} MRU`;
};

export const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(value);
