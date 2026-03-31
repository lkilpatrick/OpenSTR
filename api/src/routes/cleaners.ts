import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.use(requireRole('owner', 'admin'));

// GET /admin/cleaners — list cleaners with summary stats
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.active,
            COALESCE(stats.total_sessions, 0) as total_sessions,
            COALESCE(stats.avg_compliance, 0) as avg_compliance,
            stats.last_session_date,
            COALESCE(props.properties, '[]') as assigned_properties
     FROM users u
     LEFT JOIN LATERAL (
       SELECT COUNT(*) as total_sessions,
              AVG(cs.compliance_score) as avg_compliance,
              MAX(cs.created_at) as last_session_date
       FROM clean_sessions cs WHERE cs.cleaner_id = u.id
     ) stats ON true
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', p.id, 'name', p.name)) as properties
       FROM property_cleaners pc
       JOIN properties p ON p.id = pc.property_id
       WHERE pc.user_id = u.id AND pc.is_active = true
     ) props ON true
     WHERE u.role = 'cleaner'
     ORDER BY u.name`
  );
  res.json(result.rows);
});

// GET /admin/cleaners/:id/performance — individual performance profile
router.get('/:id/performance', async (req: AuthRequest, res: Response): Promise<void> => {
  const cleanerId = req.params.id;

  // Last 12 sessions with compliance scores
  const sessionsResult = await pool.query(
    `SELECT cs.id, cs.compliance_score, cs.created_at, cs.cleaner_start_time, cs.cleaner_end_time,
            p.name as property_name, p.id as property_id
     FROM clean_sessions cs
     JOIN properties p ON p.id = cs.property_id
     WHERE cs.cleaner_id = $1 AND cs.status = 'approved'
     ORDER BY cs.created_at DESC LIMIT 12`,
    [cleanerId]
  );

  // Average duration per property
  const durationResult = await pool.query(
    `SELECT p.name as property_name,
            AVG(EXTRACT(EPOCH FROM (cs.cleaner_end_time - cs.cleaner_start_time)) / 60) as avg_minutes
     FROM clean_sessions cs
     JOIN properties p ON p.id = cs.property_id
     WHERE cs.cleaner_id = $1 AND cs.status = 'approved'
       AND cs.cleaner_start_time IS NOT NULL AND cs.cleaner_end_time IS NOT NULL
     GROUP BY p.id, p.name`,
    [cleanerId]
  );

  // Task completion rate by room
  const taskRateResult = await pool.query(
    `SELECT r.display_name,
            COUNT(tc.id) as completed_tasks,
            COUNT(t.id) as total_tasks
     FROM clean_sessions cs
     JOIN room_cleans rc ON rc.session_id = cs.id
     JOIN rooms r ON r.id = rc.room_id
     LEFT JOIN tasks t ON t.room_id = r.id AND t.archived = false
     LEFT JOIN task_completions tc ON tc.room_clean_id = rc.id AND tc.task_id = t.id AND tc.completed = true
     WHERE cs.cleaner_id = $1 AND cs.status = 'approved'
     GROUP BY r.id, r.display_name
     ORDER BY r.display_order`,
    [cleanerId]
  );

  // Photo submission rate
  const photoResult = await pool.query(
    `SELECT COUNT(DISTINCT cs.id) as sessions_with_photos,
            (SELECT COUNT(*) FROM clean_sessions WHERE cleaner_id = $1 AND status = 'approved') as total_sessions
     FROM clean_sessions cs
     JOIN room_cleans rc ON rc.session_id = cs.id
     JOIN photos ph ON ph.room_clean_id = rc.id
     WHERE cs.cleaner_id = $1 AND cs.status = 'approved'`,
    [cleanerId]
  );
  const totalSessions = parseInt(photoResult.rows[0].total_sessions) || 0;
  const sessionsWithPhotos = parseInt(photoResult.rows[0].sessions_with_photos) || 0;

  // Issue/alert rate
  const issueResult = await pool.query(
    `SELECT COUNT(i.id) as issue_count
     FROM issues i
     JOIN clean_sessions cs ON cs.id = i.session_id
     WHERE cs.cleaner_id = $1`,
    [cleanerId]
  );

  res.json({
    compliance_history: sessionsResult.rows,
    duration_by_property: durationResult.rows,
    task_rate_by_room: taskRateResult.rows,
    photo_submission_rate: totalSessions > 0 ? Math.round((sessionsWithPhotos / totalSessions) * 100) : 0,
    total_sessions: totalSessions,
    issue_count: parseInt(issueResult.rows[0].issue_count) || 0,
  });
});

// GET /admin/cleaners/compare?cleaner1=...&cleaner2=...&property_id=...
router.get('/compare', async (req: AuthRequest, res: Response): Promise<void> => {
  const { cleaner1, cleaner2, property_id } = req.query as Record<string, string>;
  if (!cleaner1 || !cleaner2 || !property_id) {
    res.status(400).json({ error: 'cleaner1, cleaner2, and property_id required' });
    return;
  }

  async function getStats(cleanerId: string) {
    const r = await pool.query(
      `SELECT AVG(cs.compliance_score) as compliance,
              AVG(EXTRACT(EPOCH FROM (cs.cleaner_end_time - cs.cleaner_start_time)) / 60) as avg_minutes,
              COUNT(*) as total_sessions
       FROM clean_sessions cs
       WHERE cs.cleaner_id = $1 AND cs.property_id = $2 AND cs.status = 'approved'`,
      [cleanerId, property_id]
    );
    const photoR = await pool.query(
      `SELECT COUNT(DISTINCT cs.id) as with_photos
       FROM clean_sessions cs
       JOIN room_cleans rc ON rc.session_id = cs.id
       JOIN photos ph ON ph.room_clean_id = rc.id
       WHERE cs.cleaner_id = $1 AND cs.property_id = $2 AND cs.status = 'approved'`,
      [cleanerId, property_id]
    );
    const issueR = await pool.query(
      `SELECT COUNT(i.id) as issues
       FROM issues i JOIN clean_sessions cs ON cs.id = i.session_id
       WHERE cs.cleaner_id = $1 AND cs.property_id = $2`,
      [cleanerId, property_id]
    );
    const total = parseInt(r.rows[0].total_sessions) || 1;
    return {
      compliance: parseFloat(r.rows[0].compliance) || 0,
      speed: parseFloat(r.rows[0].avg_minutes) || 0,
      photo_rate: Math.round((parseInt(photoR.rows[0].with_photos) / total) * 100),
      issue_rate: Math.round((parseInt(issueR.rows[0].issues) / total) * 100),
      total_sessions: parseInt(r.rows[0].total_sessions) || 0,
    };
  }

  const [stats1, stats2] = await Promise.all([getStats(cleaner1), getStats(cleaner2)]);
  res.json({ cleaner1: stats1, cleaner2: stats2 });
});

export default router;
