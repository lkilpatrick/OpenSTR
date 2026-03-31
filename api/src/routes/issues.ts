import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /issues
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, status } = req.query;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (property_id) { conditions.push(`property_id = $${idx++}`); values.push(property_id); }
  if (status) { conditions.push(`status = $${idx++}`); values.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(`SELECT * FROM issues ${where} ORDER BY created_at DESC`, values);
  res.json(result.rows);
});

// POST /issues
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, session_id, title, description, severity } = req.body;
  const result = await pool.query(
    `INSERT INTO issues (property_id, session_id, reported_by, title, description, severity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [property_id, session_id ?? null, req.user!.userId, title, description ?? null, severity ?? 'medium']
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /issues/:id
router.patch('/:id', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, resolved_at } = req.body as { status?: string; resolved_at?: string };
  const result = await pool.query(
    `UPDATE issues SET status = COALESCE($1, status), resolved_at = COALESCE($2, resolved_at), updated_at = now()
     WHERE id = $3 RETURNING *`,
    [status ?? null, resolved_at ?? (status === 'resolved' ? new Date().toISOString() : null), req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

export default router;
