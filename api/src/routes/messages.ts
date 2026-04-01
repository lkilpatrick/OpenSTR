import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireRole('owner', 'admin'));

// GET /messages
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, unread } = req.query;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (property_id) { conditions.push(`property_id = $${idx++}`); values.push(property_id); }
  if (unread === 'true') { conditions.push(`read = false`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(`SELECT * FROM guest_messages ${where} ORDER BY received_at DESC`, values);
  res.json(result.rows);
});

// PATCH /messages/:id/read
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const { read } = req.body as { read?: boolean };
  await pool.query(`UPDATE guest_messages SET read = $1 WHERE id = $2`, [read ?? true, req.params.id]);
  res.json({ message: read === false ? 'Marked as unread' : 'Marked as read' });
});

// DELETE /messages/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(`DELETE FROM guest_messages WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json({ message: 'Message deleted' });
});

export default router;
