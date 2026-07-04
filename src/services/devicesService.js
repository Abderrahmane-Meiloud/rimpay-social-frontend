import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listDevices(query) {
  return api.get(`/devices${buildQuery(query)}`);
}

export function getDevice(id) {
  return api.get(`/devices/${id}`);
}
