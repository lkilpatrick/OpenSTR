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
  await pool.query(`UPDATE guest_messages SET read = true WHERE id = $1`, [req.params.id]);
  res.json({ message: 'Marked as read' });
});

export default router;
