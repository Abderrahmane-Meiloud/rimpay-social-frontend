import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listBeneficiaries(query) {
  return api.get(`/beneficiaries${buildQuery(query)}`);
}

export function getBeneficiary(id) {
  return api.get(`/beneficiaries/${id}`);
}

export function createBeneficiary(payload) {
  return api.post('/beneficiaries', payload);
}

export function updateBeneficiary(id, payload) {
  return api.patch(`/beneficiaries/${id}`, payload);
}

export function importBeneficiaries(beneficiaries) {
  return api.post('/beneficiaries/import', { beneficiaries });
}
