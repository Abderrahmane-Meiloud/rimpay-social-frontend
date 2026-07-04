import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listAgents(query) {
  return api.get(`/agents${buildQuery(query)}`);
}

export function getAgent(id) {
  return api.get(`/agents/${id}`);
}
