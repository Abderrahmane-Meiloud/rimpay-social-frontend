import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listPayments(query) {
  return api.get(`/payments${buildQuery(query)}`);
}

export function getPayment(id) {
  return api.get(`/payments/${id}`);
}

export function cancelPayment(id, reason) {
  const body = reason ? { reason } : {};
  return api.post(`/payments/${id}/cancel`, body);
}
