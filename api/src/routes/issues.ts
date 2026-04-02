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
  if (!property_id || !title) { res.status(400).json({ error: 'property_id and title are required' }); return; }
  const result = await pool.query(
    `INSERT INTO issues (property_id, session_id, reported_by, title, description, severity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [property_id, session_id ?? null, req.user!.userId, title, description ?? null, severity ?? 'medium']
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /issues/:id — update issue fields
router.patch('/:id', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['title', 'description', 'severity', 'status'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${idx++}`);
      values.push(req.body[f]);
    }
  }
  // Auto-set resolved_at when status changes to resolved
  if (req.body.status === 'resolved') {
    updates.push(`resolved_at = $${idx++}`);
    values.push(new Date().toISOString());
  } else if (req.body.resolved_at !== undefined) {
    updates.push(`resolved_at = $${idx++}`);
    values.push(req.body.resolved_at);
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  updates.push('updated_at = now()');
  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE issues SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// DELETE /issues/:id
router.delete('/:id', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(`DELETE FROM issues WHERE id = $1 RETURNING id`, [req.params.id]);
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json({ message: 'Issue deleted' });
});

export default router;
