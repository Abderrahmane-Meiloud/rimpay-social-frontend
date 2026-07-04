import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listAnomalies(query) {
  return api.get(`/anomalies${buildQuery(query)}`);
}

export function getAnomaly(id) {
  return api.get(`/anomalies/${id}`);
}

export function resolveAnomaly(id, resolutionNotes) {
  return api.patch(`/anomalies/${id}/resolve`, { resolutionNotes });
}

export function reopenAnomaly(id, reason) {
  return api.patch(`/anomalies/${id}/reopen`, { reason });
}
