import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiJson, setUnauthorizedHandler, tokenStore } from '../../lib/api';

export interface Admin {
  id: number;
  name: string;
  email: string;
}

type AuthState =
  | { status: 'checking'; admin: null }
  | { status: 'authenticated'; admin: Admin }
  | { status: 'anonymous'; admin: null };

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.get() ? { status: 'checking', admin: null } : { status: 'anonymous', admin: null },
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    queryClient.clear(); // drop cached inquiries so the next user can't see them
    setState({ status: 'anonymous', admin: null });
  }, [queryClient]);

  // Any 401 from a protected request (expired / revoked token) logs out.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // On first load, confirm a stored token is still valid.
  useEffect(() => {
    if (state.status !== 'checking') return;
    const controller = new AbortController();
    apiJson<{ admin: Admin }>('/auth/me', { auth: true, signal: controller.signal })
      .then(({ admin }) => setState({ status: 'authenticated', admin }))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        // Only a 401 clears the token (handled in api.ts). A network error keeps it,
        // but the user must still log in to proceed.
        setState({ status: 'anonymous', admin: null });
      });
    return () => controller.abort();
  }, [state.status]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, admin } = await apiJson<{ token: string; admin: Admin }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    tokenStore.set(token);
    setState({ status: 'authenticated', admin });
  }, []);

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
