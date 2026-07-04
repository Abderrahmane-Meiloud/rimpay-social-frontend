import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listSyncBatches(query) {
  return api.get(`/sync/batches${buildQuery(query)}`);
}

export function getSyncBatch(id) {
  return api.get(`/sync/batches/${id}`);
}
