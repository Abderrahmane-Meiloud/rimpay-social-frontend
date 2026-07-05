import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listPrograms(query) {
  return api.get(`/programs${buildQuery(query)}`);
}

export function getProgram(id) {
  return api.get(`/programs/${id}`);
}

export function createProgram(payload) {
  return api.post('/programs', payload);
}

export function updateProgram(id, payload) {
  return api.patch(`/programs/${id}`, payload);
}
