import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse } from '../types/user';
import * as authApi from '../api/authApi';
import { saveSession, saveUser, clearSession, getToken, getStoredUser, onTokenChange, errorMessage } from '../api/client';
import { registerForPushNotifications, unregisterForPushNotifications } from '../utils/pushNotifications';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  errorMessage: string;
  login: (email: string, password: string) => Promise<boolean>;
  phoneLogin: (phone: string, password: string) => Promise<boolean>;
  register: (input: { name: string; email: string; password: string; phone: string }) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    return onTokenChange((t) => {
      setToken(t);
      if (t === null) setUserState(null);
    });
  }, []);

  // Covers the page-refresh / already-logged-in-on-load case — logging in
  // fresh registers via handleAuthResult below, but restoring an existing
  // session from localStorage never passes through there.
  useEffect(() => {
    if (getToken()) registerForPushNotifications().catch(() => {});
  }, []);

  // Public setter for pages that update the profile server-side (edit
  // profile, notification preferences) — keeps React state and the
  // persisted copy in sync so a refresh doesn't revert to stale data.
  const setUser = useCallback((updated: User) => {
    saveUser(updated);
    setUserState(updated);
  }, []);

  const handleAuthResult = useCallback(async (promise: Promise<AuthResponse>): Promise<boolean> => {
    setIsLoading(true);
    setErrMsg('');
    try {
      const data = await promise;
      saveSession(data.token, data.refreshToken, data.user);
      setUserState(data.user);
      setToken(data.token);
      registerForPushNotifications().catch(() => {});
      return true;
    } catch (err) {
      setErrMsg(errorMessage(err, 'Something went wrong. Please try again.'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) => handleAuthResult(authApi.login(email, password)),
    [handleAuthResult]
  );
  const phoneLogin = useCallback(
    (phone: string, password: string) => handleAuthResult(authApi.phoneLogin(phone, password)),
    [handleAuthResult]
  );
  const register = useCallback(
    (input: { name: string; email: string; password: string; phone: string }) =>
      handleAuthResult(authApi.register(input)),
    [handleAuthResult]
  );
  const loginWithGoogle = useCallback(
    (idToken: string) => handleAuthResult(authApi.googleLogin(idToken)),
    [handleAuthResult]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Must run before clearSession() clears the auth token below — the
      // unregister call needs it to authenticate.
      await unregisterForPushNotifications();
      await authApi.logout();
    } catch {
      // Best-effort — still clear the local session either way.
    } finally {
      clearSession();
      setUserState(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!token,
        isLoading,
        errorMessage: errMsg,
        login,
        phoneLogin,
        register,
        loginWithGoogle,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
