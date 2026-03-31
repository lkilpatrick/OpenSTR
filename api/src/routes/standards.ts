import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /standards
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT s.*, COUNT(st.id) as task_count
     FROM standards s
     LEFT JOIN standard_tasks st ON st.standard_id = s.id
     GROUP BY s.id ORDER BY s.name`
  );
  res.json(result.rows);
});

// GET /standards/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const standard = await pool.query(`SELECT * FROM standards WHERE id = $1`, [req.params.id]);
  if (!standard.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }

  const tasks = await pool.query(
    `SELECT * FROM standard_tasks WHERE standard_id = $1 ORDER BY room_type, display_order`,
    [req.params.id]
  );
  res.json({ ...standard.rows[0], tasks: tasks.rows });
});

// POST /standards
router.post('/', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const result = await pool.query(
    `INSERT INTO standards (name, description) VALUES ($1, $2) RETURNING *`,
    [name, description ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /standards/:id
router.patch('/:id', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['name', 'description'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]); }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  updates.push('updated_at = now()');
  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE standards SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// POST /standards/:id/tasks
router.post('/:id/tasks', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { label, room_type, category, frequency, is_high_touch, is_mandatory, display_order } = req.body;
  if (!label || !room_type) { res.status(400).json({ error: 'label and room_type required' }); return; }
  const result = await pool.query(
    `INSERT INTO standard_tasks (standard_id, label, room_type, category, frequency, is_high_touch, is_mandatory, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.params.id, label, room_type, category ?? 'Cleaning', frequency ?? 'every_clean',
     is_high_touch ?? false, is_mandatory ?? true, display_order ?? 0]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /standards/:id/tasks/:taskId
router.patch('/:id/tasks/:taskId', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['label', 'room_type', 'category', 'frequency', 'is_high_touch', 'is_mandatory', 'display_order', 'archived'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]); }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  updates.push('updated_at = now()');
  values.push(req.params.taskId);
  const result = await pool.query(
    `UPDATE standard_tasks SET ${updates.join(', ')} WHERE id = $${idx} AND standard_id = $${idx + 1} RETURNING *`,
    [...values, req.params.id]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// DELETE /standards/:id/tasks/:taskId — archive
router.delete('/:id/tasks/:taskId', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  await pool.query(
    `UPDATE standard_tasks SET archived = true, updated_at = now() WHERE id = $1 AND standard_id = $2`,
    [req.params.taskId, req.params.id]
  );
  res.json({ message: 'Archived' });
});

// GET /standards/:id/propagate/preview — dry-run propagation
router.get('/:id/propagate/preview', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const standardId = req.params.id;

  // Find all properties using this standard
  const props = await pool.query(
    `SELECT id, name FROM properties WHERE standard_id = $1`, [standardId]
  );

  // Get standard tasks
  const stdTasks = await pool.query(
    `SELECT * FROM standard_tasks WHERE standard_id = $1`, [standardId]
  );

  const changes: Array<{ property_name: string; room_type: string; action: string; label: string }> = [];

  for (const prop of props.rows) {
    for (const st of stdTasks.rows) {
      const existing = await pool.query(
        `SELECT t.id, t.label, t.is_override FROM tasks t
         JOIN rooms r ON r.id = t.room_id
         WHERE t.property_id = $1 AND t.standard_task_id = $2 AND r.standard_room_type = $3`,
        [prop.id, st.id, st.room_type]
      );
      if (existing.rows.length === 0) {
        changes.push({ property_name: prop.name, room_type: st.room_type, action: 'add', label: st.label });
      } else if (!existing.rows[0].is_override && existing.rows[0].label !== st.label) {
        changes.push({ property_name: prop.name, room_type: st.room_type, action: 'update', label: st.label });
      }
    }
  }

  res.json({ property_count: props.rows.length, changes });
});

// POST /standards/:id/propagate — push changes to all assigned properties
router.post('/:id/propagate', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const standardId = req.params.id;

  const props = await pool.query(
    `SELECT id, name FROM properties WHERE standard_id = $1`, [standardId]
  );
  const stdTasks = await pool.query(
    `SELECT * FROM standard_tasks WHERE standard_id = $1`, [standardId]
  );

  const client = await pool.connect();
  let totalChanges = 0;

  try {
    await client.query('BEGIN');

    for (const prop of props.rows) {
      for (const st of stdTasks.rows) {
        // Find matching rooms by standard_room_type
        const rooms = await client.query(
          `SELECT id FROM rooms WHERE property_id = $1 AND standard_room_type = $2 AND archived = false`,
          [prop.id, st.room_type]
        );

        for (const room of rooms.rows) {
          const existing = await client.query(
            `SELECT id, is_override FROM tasks WHERE standard_task_id = $1 AND room_id = $2`,
            [st.id, room.id]
          );

          if (existing.rows.length === 0) {
            // Add new task
            await client.query(
              `INSERT INTO tasks (property_id, room_id, standard_task_id, label, category, frequency,
                is_high_touch, is_mandatory, display_order)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [prop.id, room.id, st.id, st.label, st.category, st.frequency,
               st.is_high_touch, st.is_mandatory, st.display_order]
            );
            totalChanges++;
          } else if (!existing.rows[0].is_override) {
            // Update non-overridden task
            await client.query(
              `UPDATE tasks SET label = $1, category = $2, frequency = $3, is_high_touch = $4,
                is_mandatory = $5, updated_at = now()
               WHERE id = $6`,
              [st.label, st.category, st.frequency, st.is_high_touch, st.is_mandatory, existing.rows[0].id]
            );
            totalChanges++;
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({
    message: `Propagated to ${props.rows.length} properties`,
    total_changes: totalChanges,
  });
});

export default router;
