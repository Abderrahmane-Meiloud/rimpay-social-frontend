import { api, ApiError } from './apiClient';

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function listReports(query) {
  return api.get(`/reports${buildQuery(query)}`);
}

export function getReport(id) {
  return api.get(`/reports/${id}`);
}

export function getReportCatalog() {
  return api.get('/reports/catalog');
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function downloadPaymentSummary(format, period) {
  const token = localStorage.getItem('accessToken');
  const q = new URLSearchParams({ format, period: period || 'LAST_12_MONTHS' });
  const res = await fetch(`${BASE_URL}/reports/payment-summary/export?${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new ApiError(401, 'Session expirée');
  }
  if (res.status === 403) {
    throw new ApiError(403, 'Accès refusé : vous ne disposez pas des autorisations nécessaires pour cette action.');
  }
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || `Erreur ${res.status}`;
      throw new ApiError(res.status, msg, data);
    }
    throw new ApiError(res.status, `Erreur ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const disposition = res.headers.get('content-disposition') || '';

  const expectedTypes = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  if (!contentType.includes(expectedTypes[format])) {
    throw new ApiError(0, 'Réponse de téléchargement invalide.');
  }
  if (!disposition.toLowerCase().includes('attachment')) {
    throw new ApiError(0, 'Réponse de téléchargement invalide.');
  }

  const blob = await res.blob();
  const match = disposition.match(/filename="?([^";\s]+)"?/);
  const filename = match ? match[1] : `rapport.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
