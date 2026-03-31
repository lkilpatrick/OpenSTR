import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /users — list all users (owner/admin only)
router.get('/', requireRole('owner', 'admin'), async (_req, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT id, email, name, role, active, push_token, created_at FROM users ORDER BY name`
  );
  res.json(result.rows);
});

// GET /users/:userId
router.get('/:userId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT id, email, name, role, active, push_token, created_at FROM users WHERE id = $1`,
    [req.params.userId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// PATCH /users/:userId (update name, active, push_token)
router.patch('/:userId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['name', 'active', 'push_token', 'role'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  updates.push('updated_at = now()');
  values.push(req.params.userId);
  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, active`,
    values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// GET /users/me/push-token — cleaner updates their own push token
router.patch('/me/push-token', async (req: AuthRequest, res: Response): Promise<void> => {
  const { push_token } = req.body as { push_token?: string };
  if (!push_token) { res.status(400).json({ error: 'push_token required' }); return; }
  await pool.query(`UPDATE users SET push_token = $1, updated_at = now() WHERE id = $2`,
    [push_token, req.user!.userId]);
  res.json({ message: 'Push token updated' });
});

// GET /properties/:propertyId/cleaners
router.get('/properties/:propertyId/cleaners', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.active, pc.is_primary, pc.is_active, pc.assigned_at
     FROM property_cleaners pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.property_id = $1
     ORDER BY pc.is_primary DESC, u.name`,
    [req.params.propertyId]
  );
  res.json(result.rows);
});

// POST /properties/:propertyId/cleaners — assign cleaner
router.post('/properties/:propertyId/cleaners', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { user_id, is_primary, notes } = req.body as { user_id?: string; is_primary?: boolean; notes?: string };
  if (!user_id) { res.status(400).json({ error: 'user_id required' }); return; }
  const result = await pool.query(
    `INSERT INTO property_cleaners (property_id, user_id, is_primary, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (property_id, user_id) DO UPDATE SET is_active = true, is_primary = $3
     RETURNING *`,
    [req.params.propertyId, user_id, is_primary ?? false, notes ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /properties/:propertyId/cleaners/:userId — unassign cleaner
router.delete('/properties/:propertyId/cleaners/:userId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query(
    `UPDATE property_cleaners SET is_active = false WHERE property_id = $1 AND user_id = $2`,
    [req.params.propertyId, req.params.userId]
  );
  res.json({ message: 'Cleaner unassigned' });
});

export default router;
