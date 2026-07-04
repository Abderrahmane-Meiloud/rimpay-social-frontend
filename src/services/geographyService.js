import { api } from './apiClient';

export function listLocalities() {
  return api.get('/geography/localities');
}

export function listRegions() {
  return api.get('/geography/regions');
}
