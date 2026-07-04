import { api } from './apiClient';

export function getDashboardSummary(period, scenario) {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (scenario) params.set('scenario', scenario);
  const q = params.toString();
  return api.get(`/dashboard/summary${q ? `?${q}` : ''}`);
}
