import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { LoginResponse } from '@openstr/shared';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  return { user, login, logout, isAuthenticated, isOwnerOrAdmin };
}
