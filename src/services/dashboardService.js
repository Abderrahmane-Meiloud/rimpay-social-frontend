import { api } from './apiClient';

export function getDashboardSummary(period) {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  const q = params.toString();
  return api.get(`/dashboard/summary${q ? `?${q}` : ''}`);
}
