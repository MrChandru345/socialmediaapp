import axios from "axios";

const TOKEN_KEY = "curator-auth-token";
const REFRESH_TOKEN_KEY = "curator-refresh-token";
const DEFAULT_BASE_URL = "http://localhost:5000/api";

export const AUTH_TOKEN_REFRESHED_EVENT = "curator:auth-token-refreshed";
export const AUTH_SESSION_EXPIRED_EVENT = "curator:auth-session-expired";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout: 15000
});

function storage() {
  return window.localStorage;
}

export function getStoredToken() {
  return storage().getItem(TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return storage().getItem(REFRESH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    storage().setItem(TOKEN_KEY, token);
  }
}

export function setStoredRefreshToken(refreshToken) {
  if (refreshToken) {
    storage().setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function setStoredSession({ token, accessToken, refreshToken }) {
  setStoredToken(accessToken || token);
  setStoredRefreshToken(refreshToken);
}

export function clearStoredToken() {
  storage().removeItem(TOKEN_KEY);
  storage().removeItem(REFRESH_TOKEN_KEY);
}

async function requestTokenRefresh() {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token is missing");
  }

  const response = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { timeout: api.defaults.timeout }
  );
  const session = response.data.data;

  setStoredSession(session);
  window.dispatchEvent(new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, { detail: session }));

  return session.accessToken || session.token;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const nextToken = await requestTokenRefresh();
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredToken();
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
