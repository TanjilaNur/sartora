import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'ds_admin_token';
const REFRESH_KEY = 'ds_admin_refresh';
const USER_KEY = 'ds_admin_user';
const AUTH_BASE = 'http://localhost:4000/api/auth';
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/phone-login'];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  listeners.forEach((l) => l(token));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((l) => l(null));
}

let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    refreshing = (
      refreshToken
        ? axios
            .post<{ token: string }>(`${AUTH_BASE}/refresh`, { refreshToken })
            .then(({ data }) => {
              setToken(data.token);
              return data.token;
            })
        : Promise.reject(new Error('No refresh token available'))
    ).catch((err) => {
      clearSession();
      throw err;
    });
    refreshing.finally(() => {
      refreshing = null;
    }).catch(() => {});
  }
  return refreshing;
}

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !config ||
      config._retry ||
      AUTH_ENDPOINTS.some((path) => config.url?.includes(path))
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    const token = await refreshAccessToken();
    config.headers.set('Authorization', `Bearer ${token}`);
    return axios(config);
  }
);
