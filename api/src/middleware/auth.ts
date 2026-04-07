import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { pool } from '../db/pool';

export type UserRole = 'guest' | 'cleaner' | 'admin' | 'owner';

export interface AuthUser {
  userId: string;
  role: UserRole;
  propertyIds: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware that validates the better-auth session cookie.
 * Populates req.user with { userId, role, propertyIds }.
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as Record<string, string>,
    });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'No valid session' });
      return;
    }

    const user = session.user as { id: string; role?: string };

    // Always fetch role fresh from DB — session cache may not include it
    const dbUser = await pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );
    const role = ((dbUser.rows[0]?.role) ?? user.role ?? 'cleaner') as UserRole;

    // Fetch property IDs for cleaners
    let propertyIds: string[] = [];
    if (role === 'cleaner') {
      const result = await pool.query<{ property_id: string }>(
        `SELECT property_id FROM property_cleaners WHERE user_id = $1 AND is_active = true`,
        [user.id]
      );
      propertyIds = result.rows.map((r) => r.property_id);
    }

    req.user = { userId: user.id, role, propertyIds };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid session' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requirePropertyAccess(paramName = 'propertyId') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Not authenticated' });
      return;
    }
    // Owners/admins have access to all properties
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      next();
      return;
    }
    const propertyId = req.params[paramName] as string;
    if (!req.user.propertyIds.includes(propertyId)) {
      res.status(403).json({ error: 'Forbidden', message: 'No access to this property' });
      return;
    }
    next();
  };
}
