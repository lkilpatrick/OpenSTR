import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.use(requireRole('owner', 'admin'));

function nextAssessmentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const quarters = [
    new Date(year, 0, 1), new Date(year, 3, 1),
    new Date(year, 6, 1), new Date(year, 9, 1),
    new Date(year + 1, 0, 1),
  ];
  for (const q of quarters) {
    if (q > now) return q.toISOString().slice(0, 10);
  }
  return quarters[4].toISOString().slice(0, 10);
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// GET /admin/superhost/current?property_id=...
router.get('/current', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id } = req.query;
  if (!property_id) { res.status(400).json({ error: 'property_id required' }); return; }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const since = twelveMonthsAgo.toISOString();

  // 1. Overall Rating (rolling 12-month average)
  const ratingResult = await pool.query(
    `SELECT COALESCE(AVG(gr.rating), 0) as avg_rating, COUNT(gr.id) as rating_count
     FROM guest_ratings gr
     JOIN clean_sessions cs ON cs.id = gr.session_id
     WHERE cs.property_id = $1 AND gr.created_at >= $2`,
    [property_id, since]
  );
  const avgRating = parseFloat(ratingResult.rows[0].avg_rating) || 0;

  // 2. Response Rate (from guest_messages)
  const msgResult = await pool.query(
    `SELECT COUNT(*) as total, COUNT(CASE WHEN read = true THEN 1 END) as responded
     FROM guest_messages
     WHERE property_id = $1 AND received_at >= $2`,
    [property_id, since]
  );
  const totalMsgs = parseInt(msgResult.rows[0].total) || 0;
  const responseRate = totalMsgs > 0 ? Math.round((parseInt(msgResult.rows[0].responded) / totalMsgs) * 100) : 100;

  // 3. Completed Stays (approved sessions in 12-month window)
  const staysResult = await pool.query(
    `SELECT COUNT(*) as completed_stays
     FROM clean_sessions
     WHERE property_id = $1 AND status = 'approved' AND created_at >= $2
       AND session_type = 'turnover'`,
    [property_id, since]
  );
  const completedStays = parseInt(staysResult.rows[0].completed_stays) || 0;

  // 4. Latest snapshot
  const snapshotResult = await pool.query(
    `SELECT * FROM superhost_snapshots WHERE property_id = $1 ORDER BY snapshot_date DESC LIMIT 1`,
    [property_id]
  );

  const assessment = nextAssessmentDate();
  const willQualify = avgRating >= 4.8 && responseRate >= 90 && completedStays >= 10;

  res.json({
    overall_rating: Math.round(avgRating * 100) / 100,
    rating_count: parseInt(ratingResult.rows[0].rating_count),
    response_rate: responseRate,
    cancellation_rate: null, // placeholder — no booking management in MVP
    completed_stays: completedStays,
    next_assessment_date: assessment,
    days_until_assessment: daysUntil(assessment),
    will_qualify: willQualify,
    latest_snapshot: snapshotResult.rows[0] ?? null,
  });
});

// POST /admin/superhost/snapshot — calculate and store snapshot
router.post('/snapshot', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id } = req.body;
  if (!property_id) { res.status(400).json({ error: 'property_id required' }); return; }

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const since = twelveMonthsAgo.toISOString();

  const ratingResult = await pool.query(
    `SELECT COALESCE(AVG(gr.rating), 0) as avg_rating
     FROM guest_ratings gr JOIN clean_sessions cs ON cs.id = gr.session_id
     WHERE cs.property_id = $1 AND gr.created_at >= $2`,
    [property_id, since]
  );

  const msgResult = await pool.query(
    `SELECT COUNT(*) as total, COUNT(CASE WHEN read = true THEN 1 END) as responded
     FROM guest_messages WHERE property_id = $1 AND received_at >= $2`,
    [property_id, since]
  );
  const totalMsgs = parseInt(msgResult.rows[0].total) || 0;
  const responseRate = totalMsgs > 0 ? Math.round((parseInt(msgResult.rows[0].responded) / totalMsgs) * 100) : 100;

  const staysResult = await pool.query(
    `SELECT COUNT(*) as c FROM clean_sessions
     WHERE property_id = $1 AND status = 'approved' AND created_at >= $2 AND session_type = 'turnover'`,
    [property_id, since]
  );

  const result = await pool.query(
    `INSERT INTO superhost_snapshots (property_id, snapshot_date, overall_rating, response_rate, cancellation_rate, completed_stays)
     VALUES ($1, current_date, $2, $3, 0, $4) RETURNING *`,
    [property_id, parseFloat(ratingResult.rows[0].avg_rating) || 0, responseRate, parseInt(staysResult.rows[0].c) || 0]
  );

  res.status(201).json(result.rows[0]);
});

export default router;
