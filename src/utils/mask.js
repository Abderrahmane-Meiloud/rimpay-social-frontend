// Masks a national ID (NNI) for display, revealing only the last 4
// digits, e.g. "0000000123" -> "**** **** 0123". Never displays the raw
// value.
export function maskNni(nni) {
  if (!nni) return '—';
  const digits = String(nni).replace(/\s+/g, '');
  const last4 = digits.slice(-4);
  return `**** **** ${last4}`;
}
