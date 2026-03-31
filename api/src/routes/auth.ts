import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import type { AuthTokenPayload } from '@openstr/shared';

const router = Router();

async function getPropertyIds(userId: string, role: string): Promise<string[]> {
  if (role === 'owner' || role === 'admin') return [];
  const result = await pool.query<{ property_id: string }>(
    `SELECT property_id FROM property_cleaners WHERE user_id = $1 AND is_active = true`,
    [userId]
  );
  return result.rows.map((r) => r.property_id);
}

function signAccess(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRY ?? '15m',
  } as jwt.SignOptions);
}

function signRefresh(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY ?? '30d',
  } as jwt.SignOptions);
}

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Bad Request', message: 'Email and password required' });
    return;
  }

  const result = await pool.query(
    `SELECT id, name, email, role, password_hash, active FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  const user = result.rows[0];

  if (!user || !user.active) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    return;
  }

  const propertyIds = await getPropertyIds(user.id, user.role);
  const payload: AuthTokenPayload = { userId: user.id, role: user.role, propertyIds };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'No refresh token' });
    return;
  }

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid refresh token' });
    return;
  }

  const result = await pool.query(
    `SELECT id, role, active FROM users WHERE id = $1`,
    [payload.userId]
  );
  const user = result.rows[0];
  if (!user || !user.active) {
    res.status(401).json({ error: 'Unauthorized', message: 'User not found or inactive' });
    return;
  }

  const propertyIds = await getPropertyIds(user.id, user.role);
  const newPayload: AuthTokenPayload = { userId: user.id, role: user.role, propertyIds };
  const newAccessToken = signAccess(newPayload);
  const newRefreshToken = signRefresh(user.id);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: newAccessToken });
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// POST /auth/register — owner only
router.post(
  '/register',
  requireAuth,
  requireRole('owner'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, name, role, password } = req.body as {
      email?: string;
      name?: string;
      role?: string;
      password?: string;
    };

    if (!email || !name || !role || !password) {
      res.status(400).json({ error: 'Bad Request', message: 'email, name, role, and password required' });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, name, role, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [email.toLowerCase().trim(), name, role, hash]
    );

    res.status(201).json({ user: result.rows[0] });
  }
);

export default router;
