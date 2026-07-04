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
