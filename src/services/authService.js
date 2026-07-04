import { api } from './apiClient';

const TOKEN_KEY = 'accessToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  setToken(data.accessToken);
  return data;
}

export async function getMe() {
  return api.get('/auth/me');
}

export function logout() {
  clearToken();
}
