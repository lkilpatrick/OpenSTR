import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { saveAccessToken, clearAccessToken, getAccessToken } from '../lib/storage';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // better-auth sign-in endpoint (cookie-based)
      const { data } = await api.post('/api/auth/sign-in/email', { email, password });
      const session = data as { token?: string; user?: AuthUser };
      if (session.token) await saveAccessToken(session.token);
      if (session.user) setUser(session.user);
      return true;
    } catch {
      setError('Invalid email or password');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/sign-out').catch(() => {});
    await clearAccessToken();
    setUser(null);
  }, []);

  const checkToken = useCallback(async () => {
    const token = await getAccessToken();
    return !!token;
  }, []);

  return { user, loading, error, login, logout, checkToken };
}
