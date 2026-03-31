import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { saveAccessToken, clearAccessToken, getAccessToken } from '../lib/storage';
import type { LoginResponse, User } from '@openstr/shared';

export function useAuth() {
  const [user, setUser] = useState<Pick<User, 'id' | 'name' | 'email' | 'role'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      await saveAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    await clearAccessToken();
    setUser(null);
  }, []);

  const checkToken = useCallback(async () => {
    const token = await getAccessToken();
    return !!token;
  }, []);

  return { user, loading, error, login, logout, checkToken };
}
