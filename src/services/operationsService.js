import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listOperations(query) {
  return api.get(`/payment-operations${buildQuery(query)}`);
}

export function getOperation(id) {
  return api.get(`/payment-operations/${id}`);
}

export function getOperationPayments(id, query) {
  return api.get(`/payment-operations/${id}/payments${buildQuery(query)}`);
}

export function createOperation(payload) {
  return api.post('/payment-operations', payload);
}

export function updateOperation(id, payload) {
  return api.patch(`/payment-operations/${id}`, payload);
}

export function openOperation(id) {
  return api.post(`/payment-operations/${id}/open`);
}

export function closeOperation(id) {
  return api.post(`/payment-operations/${id}/close`);
}

export function listAssignedBeneficiaries(id, query) {
  return api.get(`/payment-operations/${id}/beneficiaries${buildQuery(query)}`);
}

export function assignBeneficiaries(id, beneficiaries) {
  return api.post(`/payment-operations/${id}/beneficiaries`, { beneficiaries });
}

export function excludeOperationBeneficiary(operationId, beneficiaryId) {
  return api.delete(`/payment-operations/${operationId}/beneficiaries/${beneficiaryId}`);
}

export function reincludeOperationBeneficiary(operationId, beneficiaryId) {
  return api.post(`/payment-operations/${operationId}/beneficiaries/${beneficiaryId}/reinclude`);
}

export function generateOperationPayments(operationId) {
  return api.post(`/payment-operations/${operationId}/payments/generate`);
}

export function transitionOperationStatus(id, targetStatus) {
  if (targetStatus === 'OPEN') return openOperation(id);
  if (targetStatus === 'CLOSED') return closeOperation(id);
  return api.post(`/payment-operations/${id}/transition`, { targetStatus });
}
