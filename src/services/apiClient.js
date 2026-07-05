const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getToken() {
  return localStorage.getItem('accessToken');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // /auth/login itself returning 401 means invalid credentials (or an
  // OPERATOR account without an active linked Operator) — not an expired
  // session. Let the caller (Login page) show a clean message instead of
  // hard-redirecting, which would wipe that message off the screen.
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new ApiError(401, 'Session expirée');
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (res.status === 401) {
    throw new ApiError(401, 'Accès non autorisé ou compte opérateur non activé.', isJson ? data : null);
  }

  if (res.status === 403) {
    throw new ApiError(403, 'Accès refusé : vous ne disposez pas des autorisations nécessaires pour cette action.', isJson ? data : null);
  }

  if (!res.ok) {
    const message = isJson && data.message
      ? Array.isArray(data.message) ? data.message.join(', ') : data.message
      : `Erreur ${res.status}`;
    throw new ApiError(res.status, message, isJson ? data : null);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export { ApiError };
