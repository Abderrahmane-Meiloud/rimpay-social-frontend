import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listOperators(query) {
  return api.get(`/operators${buildQuery(query)}`);
}

export function getOperator(id) {
  return api.get(`/operators/${id}`);
}

export function createOperator(payload) {
  return api.post('/operators', payload);
}

export function updateOperator(id, payload) {
  return api.patch(`/operators/${id}`, payload);
}

export function updateOperatorStatus(id, status) {
  return api.patch(`/operators/${id}/status`, { status });
}
