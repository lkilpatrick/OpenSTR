import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, requirePropertyAccess, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

type SessionStatus = 'pending' | 'accepted' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  pending: ['accepted', 'in_progress'],
  accepted: ['in_progress'],
  in_progress: ['submitted'],
  submitted: ['approved', 'rejected'],
  approved: [],
  rejected: ['in_progress'],
};

// GET /sessions — list sessions for property
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, status } = req.query;
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (property_id) {
    conditions.push(`s.property_id = $${idx++}`);
    values.push(property_id);
  }
  if (status) {
    conditions.push(`s.status = $${idx++}`);
    values.push(status);
  }
  // Cleaners only see their own sessions
  if (req.user!.role === 'cleaner') {
    conditions.push(`s.cleaner_id = $${idx++}`);
    values.push(req.user!.userId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT s.*, u.name as cleaner_name, p.name as property_name
     FROM clean_sessions s
     LEFT JOIN users u ON u.id = s.cleaner_id
     LEFT JOIN properties p ON p.id = s.property_id
     ${where}
     ORDER BY s.created_at DESC LIMIT 50`,
    values
  );
  res.json(result.rows);
});

// GET /sessions/notes/recent — recent cleaner notes across all sessions for a property
// NOTE: Must be registered BEFORE /:sessionId to avoid Express matching "notes" as a sessionId
router.get('/notes/recent', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, limit } = req.query;
  const maxNotes = Math.min(parseInt(limit as string) || 10, 50);
  const conditions: string[] = [];
  const values: unknown[] = [maxNotes];
  if (property_id) {
    conditions.push('cs.property_id = $2');
    values.push(property_id);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT cn.*, u.name as author_name, cs.property_id,
            r.checkin_date, r.checkout_date, r.guest_name, r.summary as reservation_summary
     FROM cleaner_notes cn
     JOIN users u ON u.id = cn.user_id
     JOIN clean_sessions cs ON cs.id = cn.session_id
     LEFT JOIN reservations r ON r.id = cs.reservation_id
     ${where}
     ORDER BY cn.created_at DESC
     LIMIT $1`,
    values
  );
  res.json(result.rows);
});

// DELETE /sessions/notes/:noteId — delete a cleaner note
// NOTE: Must be registered BEFORE /:sessionId routes
router.delete('/notes/:noteId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(`DELETE FROM cleaner_notes WHERE id = $1 RETURNING id`, [req.params.noteId]);
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json({ message: 'Note deleted' });
});

// GET /sessions/room-cleans/:roomCleanId/tasks — task completions for a room clean
// NOTE: Must be registered BEFORE /:sessionId to avoid Express matching "room-cleans" as a sessionId
router.get('/room-cleans/:roomCleanId/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT tc.id, tc.task_id, t.label, tc.completed, tc.notes, tc.quantity_value, tc.supply_replenished
     FROM task_completions tc
     JOIN tasks t ON t.id = tc.task_id
     WHERE tc.room_clean_id = $1
     ORDER BY t.display_order`,
    [req.params.roomCleanId]
  );
  res.json(result.rows);
});

// POST /sessions/:sessionId/accept — cleaner accepts a pending session
router.post('/:sessionId/accept', async (req: AuthRequest, res: Response): Promise<void> => {
  const current = await pool.query(`SELECT status, cleaner_id FROM clean_sessions WHERE id = $1`, [req.params.sessionId]);
  if (!current.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  if (current.rows[0].status !== 'pending') {
    res.status(422).json({ error: 'Session is not pending' });
    return;
  }
  if (req.user!.role === 'cleaner' && current.rows[0].cleaner_id !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  const result = await pool.query(
    `UPDATE clean_sessions SET status = 'accepted', accepted_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
    [req.params.sessionId]
  );
  res.json(result.rows[0]);
});

// POST /sessions/:sessionId/request-backup — cleaner requests backup for a session
router.post('/:sessionId/request-backup', async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason } = req.body as { reason?: string };
  const current = await pool.query(
    `SELECT s.status, s.cleaner_id, s.property_id, p.name as property_name
     FROM clean_sessions s
     JOIN properties p ON p.id = s.property_id
     WHERE s.id = $1`,
    [req.params.sessionId]
  );
  if (!current.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  if (req.user!.role === 'cleaner' && current.rows[0].cleaner_id !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  // Create an issue to notify admin
  await pool.query(
    `INSERT INTO issues (session_id, property_id, reported_by, category, description, severity)
     VALUES ($1, $2, $3, 'backup_request', $4, 'medium')`,
    [req.params.sessionId, current.rows[0].property_id, req.user!.userId,
     reason || `Backup requested for ${current.rows[0].property_name}`]
  );
  await pool.query(
    `UPDATE clean_sessions SET notes = COALESCE(notes, '') || E'\n[Backup Requested] ' || $2, updated_at = now() WHERE id = $1`,
    [req.params.sessionId, reason || 'Cleaner requested backup']
  );
  res.json({ message: 'Backup request submitted' });
});

// GET /sessions/:sessionId
router.get('/:sessionId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT s.*, u.name as cleaner_name, p.name as property_name
     FROM clean_sessions s
     LEFT JOIN users u ON u.id = s.cleaner_id
     LEFT JOIN properties p ON p.id = s.property_id
     WHERE s.id = $1`,
    [req.params.sessionId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// POST /sessions — create session (owner/admin)
router.post('/', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, cleaner_id, session_type, triggered_by, reservation_id } = req.body;
  if (!property_id) { res.status(400).json({ error: 'property_id required' }); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `INSERT INTO clean_sessions (property_id, cleaner_id, session_type, triggered_by, reservation_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [property_id, cleaner_id ?? null, session_type ?? 'turnover', triggered_by ?? 'manual', reservation_id ?? null]
    );
    const session = sessionResult.rows[0];

    // Auto-create room_cleans for each room in the property
    await client.query(
      `INSERT INTO room_cleans (session_id, room_id)
       SELECT $1, id FROM rooms WHERE property_id = $2 AND archived = false`,
      [session.id, property_id]
    );

    await client.query('COMMIT');
    res.status(201).json(session);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /sessions/:sessionId/status — state machine transition
router.patch('/:sessionId/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, rejection_reason } = req.body as { status?: string; rejection_reason?: string };
  if (!status) { res.status(400).json({ error: 'status required' }); return; }

  const current = await pool.query(`SELECT status, cleaner_id FROM clean_sessions WHERE id = $1`, [req.params.sessionId]);
  if (!current.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }

  const currentStatus = current.rows[0].status as SessionStatus;
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(status as SessionStatus)) {
    res.status(422).json({ error: `Cannot transition from ${currentStatus} to ${status}` });
    return;
  }

  // Cleaners can only update their own session
  if (req.user!.role === 'cleaner' && current.rows[0].cleaner_id !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const extraFields: Record<string, unknown> = {};
  if (status === 'in_progress') extraFields.cleaner_start_time = new Date().toISOString();
  if (status === 'submitted') extraFields.cleaner_end_time = new Date().toISOString();
  if (status === 'submitted') extraFields.submitted_at = new Date().toISOString();
  if (status === 'approved' || status === 'rejected') {
    extraFields.reviewed_at = new Date().toISOString();
    extraFields.reviewed_by = req.user!.userId;
  }
  if (status === 'rejected' && rejection_reason) extraFields.rejection_reason = rejection_reason;

  const setClauses = Object.keys(extraFields).map((k, i) => `${k} = $${i + 3}`);
  const result = await pool.query(
    `UPDATE clean_sessions SET status = $1, updated_at = now()${setClauses.length ? ', ' + setClauses.join(', ') : ''}
     WHERE id = $2 RETURNING *`,
    [status, req.params.sessionId, ...Object.values(extraFields)]
  );
  res.json(result.rows[0]);
});

// POST /sessions/schedule — manual scheduling for residences (issue #31)
router.post('/schedule', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, cleaner_id, scheduled_date, session_type, photo_required, recurrence, notes } = req.body;
  if (!property_id || !scheduled_date) {
    res.status(400).json({ error: 'property_id and scheduled_date required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sessionResult = await client.query(
      `INSERT INTO clean_sessions (property_id, cleaner_id, session_type, triggered_by,
        scheduled_date, photo_required, recurrence, notes)
       VALUES ($1, $2, $3, 'manual', $4, $5, $6, $7) RETURNING *`,
      [property_id, cleaner_id ?? null, session_type ?? 'scheduled',
       scheduled_date, photo_required ?? true, recurrence ?? null, notes ?? null]
    );
    const session = sessionResult.rows[0];

    // Auto-create room_cleans
    await client.query(
      `INSERT INTO room_cleans (session_id, room_id)
       SELECT $1, id FROM rooms WHERE property_id = $2 AND archived = false`,
      [session.id, property_id]
    );

    await client.query('COMMIT');
    res.status(201).json(session);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// POST /sessions/:sessionId/rating
router.post('/:sessionId/rating', async (req: AuthRequest, res: Response): Promise<void> => {
  const { rating, review_text } = req.body as { rating?: number; review_text?: string };
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'rating must be 1–5' });
    return;
  }
  const result = await pool.query(
    `INSERT INTO guest_ratings (session_id, rating, review_text)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id) DO UPDATE SET rating = $2, review_text = $3
     RETURNING *`,
    [req.params.sessionId, rating, review_text ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /sessions/:sessionId — delete a session and its related data (owner/admin only)
router.delete('/:sessionId', requireRole('owner', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Delete child data first
    await client.query(
      `DELETE FROM task_completions WHERE room_clean_id IN (SELECT id FROM room_cleans WHERE session_id = $1)`,
      [req.params.sessionId]
    );
    await client.query(
      `DELETE FROM photos WHERE room_clean_id IN (SELECT id FROM room_cleans WHERE session_id = $1)`,
      [req.params.sessionId]
    );
    await client.query(`DELETE FROM room_cleans WHERE session_id = $1`, [req.params.sessionId]);
    await client.query(`DELETE FROM guest_ratings WHERE session_id = $1`, [req.params.sessionId]);
    await client.query(`DELETE FROM issues WHERE session_id = $1`, [req.params.sessionId]);
    const result = await client.query(`DELETE FROM clean_sessions WHERE id = $1 RETURNING id`, [req.params.sessionId]);
    await client.query('COMMIT');
    if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
    res.json({ message: 'Session deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /sessions/:sessionId/rooms — room cleans with task completions
router.get('/:sessionId/rooms', async (req: AuthRequest, res: Response): Promise<void> => {
  const rooms = await pool.query(
    `SELECT rc.*, r.display_name, r.slug, r.theme_name, r.display_order
     FROM room_cleans rc
     JOIN rooms r ON r.id = rc.room_id
     WHERE rc.session_id = $1
     ORDER BY r.display_order`,
    [req.params.sessionId]
  );
  res.json(rooms.rows);
});

// GET /sessions/:sessionId/notes — cleaner notes for a session
router.get('/:sessionId/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT cn.*, u.name as author_name
     FROM cleaner_notes cn
     JOIN users u ON u.id = cn.user_id
     WHERE cn.session_id = $1
     ORDER BY cn.created_at DESC`,
    [req.params.sessionId]
  );
  res.json(result.rows);
});

// POST /sessions/:sessionId/notes — add a cleaner note
router.post('/:sessionId/notes', async (req: AuthRequest, res: Response): Promise<void> => {
  const { note } = req.body as { note?: string };
  if (!note?.trim()) { res.status(400).json({ error: 'note is required' }); return; }
  const result = await pool.query(
    `INSERT INTO cleaner_notes (session_id, user_id, note) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.sessionId, req.user!.userId, note.trim()]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
