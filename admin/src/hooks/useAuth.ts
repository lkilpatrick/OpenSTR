import { useCallback } from 'react';
import { authClient, useSession } from '../lib/auth-client';

export function useAuth() {
  const { data: session, isPending } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as unknown as { role?: string }).role ?? 'cleaner',
      }
    : null;

  const login = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message ?? 'Login failed');
    return result.data;
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const isAuthenticated = !!user;
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

  return { user, login, logout, isAuthenticated, isOwnerOrAdmin, isPending };
}
