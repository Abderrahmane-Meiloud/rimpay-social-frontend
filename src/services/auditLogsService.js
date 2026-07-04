import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listAuditLogs(query) {
  return api.get(`/audit-logs${buildQuery(query)}`);
}

export function getAuditLog(id) {
  return api.get(`/audit-logs/${id}`);
}
