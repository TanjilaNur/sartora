import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { User } from '../types/user';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const API = `${API_BASE}/api`;

const TOKEN_KEY = 'ds_web_token';
const REFRESH_KEY = 'ds_web_refresh';
const USER_KEY = 'ds_web_user';
const GUEST_ID_KEY = 'ds_web_guest_id';
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/phone-login',
  '/auth/register',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/google',
];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Bumped by clearSession() so a refresh already in flight can tell it was
// superseded by a logout and avoid writing a fresh token back afterward.
let sessionGeneration = 0;

// Keeps other tabs in sync: logging out (or a token refresh) in one tab only
// notifies that tab's in-process listeners directly (see setToken/
// clearSession below) — this catches the same change arriving via
// localStorage's cross-tab `storage` event so other open tabs pick it up too.
window.addEventListener('storage', (e) => {
  if (e.key === TOKEN_KEY) {
    listeners.forEach((l) => l(e.newValue));
  }
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, refreshToken: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  listeners.forEach((l) => l(token));
}

// Persists an updated profile without touching tokens — a profile edit
// isn't a new session, just newer data for the existing one.
export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  listeners.forEach((l) => l(token));
}

export function clearSession(): void {
  sessionGeneration++;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((l) => l(null));
}

export function getGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY);
}

export function saveGuestId(id: string): void {
  localStorage.setItem(GUEST_ID_KEY, id);
}

export function clearGuestId(): void {
  localStorage.removeItem(GUEST_ID_KEY);
}

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    const refreshToken = getRefreshToken();
    const generationAtStart = sessionGeneration;
    refreshing = (
      refreshToken
        ? axios
            .post<{ token: string }>(`${API}/auth/refresh`, { refreshToken })
            .then(({ data }) => {
              // If a logout happened while this request was in flight, don't
              // resurrect a token right after the session was torn down.
              if (sessionGeneration === generationAtStart) setToken(data.token);
              return data.token;
            })
        : Promise.reject(new Error('No refresh token available'))
    ).catch((err) => {
      clearSession();
      throw err;
    });
    refreshing
      .finally(() => {
        refreshing = null;
      })
      .catch(() => {});
  }
  return refreshing;
}

// A stuck "stuck loading" spinner is worse than a slightly slow error: without
// a timeout, a single unreachable request hangs indefinitely on the caller's
// isLoading flag with no way to recover short of a page reload.
axios.defaults.timeout = 15000;

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

export function errorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message ?? fallback;
}
