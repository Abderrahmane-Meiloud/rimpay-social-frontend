import { api } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listUsers(query) {
  return api.get(`/users${buildQuery(query)}`);
}

export function getUser(id) {
  return api.get(`/users/${id}`);
}

export function createProgrammeUser(payload) {
  return api.post('/users/programme', payload);
}

export function createOperatorUser(payload) {
  return api.post('/users/operator', payload);
}

export function updateUserStatus(id, status) {
  return api.patch(`/users/${id}/status`, { status });
}

export function resetUserPassword(id, password) {
  return api.patch(`/users/${id}/password`, { password });
}

export function updateProgrammeScopes(id, socialProgramIds) {
  return api.patch(`/users/${id}/programme-scopes`, { socialProgramIds });
}

export function updateOperatorScope(id, operatorId) {
  return api.patch(`/users/${id}/operator-scope`, { operatorId });
}
