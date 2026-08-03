import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AdminUser, AuthState } from '../types/auth';
import { adminLogout } from '../api/authApi';
import { onTokenChange } from '../api/tokenRefresh';

interface AuthContextValue extends AuthState {
  login: (user: AdminUser, token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ds_admin_token';
const REFRESH_KEY = 'ds_admin_refresh';
const USER_KEY = 'ds_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      const raw = localStorage.getItem(USER_KEY);
      const user = raw ? (JSON.parse(raw) as AdminUser) : null;
      return { token, refreshToken, user };
    } catch {
      return { token: null, refreshToken: null, user: null };
    }
  });

  const login = useCallback((user: AdminUser, token: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, refreshToken });
  }, []);

  const logout = useCallback(async () => {
    if (state.token) {
      try {
        await adminLogout(state.token);
      } catch {
        // ignore errors on logout
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, refreshToken: null });
  }, [state.token]);

  useEffect(() => {
    if (state.token) {
      console.log('[auth] session restored for', state.user?.email);
    }
  }, []);

  useEffect(() => {
    return onTokenChange((token) => {
      if (token === null) {
        setState({ user: null, token: null, refreshToken: null });
      } else {
        setState((prev) => ({ ...prev, token }));
      }
    });
  }, []);

  const isAdmin = state.user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
