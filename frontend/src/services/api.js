import axios from "axios";

const TOKEN_KEY = "curator-auth-token";
const DEFAULT_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout: 15000
});

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

const bootstrapToken = getStoredToken();
if (bootstrapToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootstrapToken}`;
}

export default api;
