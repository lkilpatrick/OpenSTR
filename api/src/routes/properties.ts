import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, requirePropertyAccess, type AuthRequest } from '../middleware/auth';
import { syncPropertyIcal } from './ical';

const router = Router();
router.use(requireAuth);

// GET /properties
router.get('/', requireRole('owner', 'admin'), async (_req, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT id, name, type, address, ical_url, lock_entity_id, session_trigger_time,
            min_turnaround_hours, active, standard_id, created_at, updated_at
     FROM properties ORDER BY name`
  );
  res.json(result.rows);
});

// GET /properties/:propertyId
router.get('/:propertyId', requirePropertyAccess(), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT id, name, type, address, lock_entity_id, session_trigger_time,
            min_turnaround_hours, active, standard_id, created_at, updated_at
     FROM properties WHERE id = $1`,
    [req.params.propertyId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// POST /properties
router.post('/', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, address, slug, lock_entity_id, session_trigger_time, min_turnaround_hours, ical_url,
          welcome_message, house_rules, checkin_instructions, checkout_instructions, wifi_password } = req.body;
  const result = await pool.query(
    `INSERT INTO properties (name, type, address, slug, lock_entity_id, session_trigger_time, min_turnaround_hours, ical_url,
      welcome_message, house_rules, checkin_instructions, checkout_instructions, wifi_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [name, type ?? 'short_term_rental', address, slug ?? null, lock_entity_id,
     session_trigger_time ?? '10:00', min_turnaround_hours ?? 3, ical_url ?? null,
     welcome_message ?? null, house_rules ?? null, checkin_instructions ?? null,
     checkout_instructions ?? null, wifi_password ?? null]
  );
  const property = result.rows[0];
  // Auto-sync iCal if URL was provided
  if (ical_url) {
    try { await syncPropertyIcal(property.id); } catch { /* sync errors are non-fatal */ }
  }
  res.status(201).json(property);
});

// PATCH /properties/:propertyId
router.patch('/:propertyId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['name', 'type', 'address', 'slug', 'lock_entity_id', 'session_trigger_time',
                  'min_turnaround_hours', 'active', 'ical_url', 'welcome_message', 'house_rules',
                  'checkin_instructions', 'checkout_instructions', 'wifi_password'];
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
  updates.push(`updated_at = now()`);
  values.push(req.params.propertyId);
  const result = await pool.query(
    `UPDATE properties SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  // Auto-sync iCal whenever ical_url is set/changed
  if (req.body.ical_url && req.body.ical_url.trim()) {
    try { await syncPropertyIcal(req.params.propertyId); } catch { /* sync errors are non-fatal */ }
  }
  res.json(result.rows[0]);
});

// DELETE /properties/:propertyId — hard delete a property and all related data (owner only)
router.delete('/:propertyId', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM task_completions WHERE room_clean_id IN (
        SELECT rc.id FROM room_cleans rc JOIN clean_sessions cs ON cs.id = rc.session_id WHERE cs.property_id = $1)`,
      [req.params.propertyId]
    );
    await client.query(
      `DELETE FROM photos WHERE room_clean_id IN (
        SELECT rc.id FROM room_cleans rc JOIN clean_sessions cs ON cs.id = rc.session_id WHERE cs.property_id = $1)`,
      [req.params.propertyId]
    );
    await client.query(
      `DELETE FROM room_cleans WHERE session_id IN (SELECT id FROM clean_sessions WHERE property_id = $1)`,
      [req.params.propertyId]
    );
    await client.query(
      `DELETE FROM guest_ratings WHERE session_id IN (SELECT id FROM clean_sessions WHERE property_id = $1)`,
      [req.params.propertyId]
    );
    await client.query(
      `DELETE FROM issues WHERE session_id IN (SELECT id FROM clean_sessions WHERE property_id = $1)`,
      [req.params.propertyId]
    );
    await client.query(`DELETE FROM clean_sessions WHERE property_id = $1`, [req.params.propertyId]);
    await client.query(`DELETE FROM tasks WHERE property_id = $1`, [req.params.propertyId]);
    await client.query(`DELETE FROM rooms WHERE property_id = $1`, [req.params.propertyId]);
    await client.query(`DELETE FROM property_cleaners WHERE property_id = $1`, [req.params.propertyId]);
    await client.query(`DELETE FROM reservations WHERE property_id = $1`, [req.params.propertyId]);
    const result = await client.query(`DELETE FROM properties WHERE id = $1 RETURNING id`, [req.params.propertyId]);
    await client.query('COMMIT');
    if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
    res.json({ message: 'Property deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /properties/:propertyId/rooms
router.get('/:propertyId/rooms', requirePropertyAccess(), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM rooms WHERE property_id = $1 AND archived = false ORDER BY display_order`,
    [req.params.propertyId]
  );
  res.json(result.rows);
});

// GET /properties/:propertyId/rooms/:roomId/tasks
router.get('/:propertyId/rooms/:roomId/tasks', requirePropertyAccess(), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM tasks WHERE room_id = $1 AND property_id = $2 AND archived = false ORDER BY display_order`,
    [req.params.roomId, req.params.propertyId]
  );
  res.json(result.rows);
});

// POST /properties/:propertyId/rooms
router.post('/:propertyId/rooms', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { slug, display_name, theme_name, standard_room_type, display_order } = req.body;
  const result = await pool.query(
    `INSERT INTO rooms (property_id, slug, display_name, theme_name, standard_room_type, display_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.propertyId, slug, display_name, theme_name, standard_room_type, display_order ?? 0]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /properties/:propertyId/rooms/reorder — batch reorder rooms
router.patch('/:propertyId/rooms/reorder', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { room_ids } = req.body as { room_ids?: string[] };
  if (!room_ids || !Array.isArray(room_ids) || room_ids.length === 0) {
    res.status(400).json({ error: 'room_ids array required' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < room_ids.length; i++) {
      await client.query(
        `UPDATE rooms SET display_order = $1 WHERE id = $2 AND property_id = $3`,
        [i, room_ids[i], req.params.propertyId]
      );
    }
    await client.query('COMMIT');
    const result = await pool.query(
      `SELECT * FROM rooms WHERE property_id = $1 AND archived = false ORDER BY display_order`,
      [req.params.propertyId]
    );
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /properties/:propertyId/rooms/:roomId
router.patch('/:propertyId/rooms/:roomId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['display_name', 'theme_name', 'slug', 'standard_room_type', 'display_order', 'is_laundry_phase', 'archived'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = $${idx++}`); values.push(req.body[f]); }
  }
  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  values.push(req.params.roomId);
  values.push(req.params.propertyId);
  const result = await pool.query(
    `UPDATE rooms SET ${updates.join(', ')} WHERE id = $${idx} AND property_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// POST /properties/:propertyId/rooms/:roomId/tasks
router.post('/:propertyId/rooms/:roomId/tasks', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { label, category, frequency, is_high_touch, is_mandatory, display_order,
          requires_supply_check, supply_item, supply_low_threshold } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (property_id, room_id, label, category, frequency, is_high_touch,
      is_mandatory, display_order, requires_supply_check, supply_item, supply_low_threshold)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [req.params.propertyId, req.params.roomId, label, category, frequency ?? 'every_clean',
     is_high_touch ?? false, is_mandatory ?? true, display_order ?? 0,
     requires_supply_check ?? false, supply_item ?? null, supply_low_threshold ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /properties/:propertyId/rooms/:roomId/tasks/reorder — batch reorder
router.patch('/:propertyId/rooms/:roomId/tasks/reorder', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { task_ids } = req.body as { task_ids?: string[] };
  if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
    res.status(400).json({ error: 'task_ids array required' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < task_ids.length; i++) {
      await client.query(
        `UPDATE tasks SET display_order = $1, updated_at = now() WHERE id = $2 AND room_id = $3`,
        [i, task_ids[i], req.params.roomId]
      );
    }
    await client.query('COMMIT');
    const result = await pool.query(
      `SELECT * FROM tasks WHERE room_id = $1 AND property_id = $2 AND archived = false ORDER BY display_order`,
      [req.params.roomId, req.params.propertyId]
    );
    res.json(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /properties/:propertyId/rooms/:roomId/tasks/:taskId
router.patch('/:propertyId/rooms/:roomId/tasks/:taskId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['label', 'category', 'frequency', 'is_high_touch', 'is_mandatory',
                  'is_applicable', 'requires_supply_check', 'supply_item', 'supply_low_threshold',
                  'display_order', 'archived'];
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
  values.push(req.params.taskId);
  const result = await pool.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} AND room_id = $${idx + 1} RETURNING *`,
    [...values, req.params.roomId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

export default router;
