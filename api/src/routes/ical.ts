import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { fetchIcal } from '../services/ical';

const router = Router();
router.use(requireAuth, requireRole('owner', 'admin'));

// POST /ical/sync/:propertyId — trigger iCal sync
router.post('/sync/:propertyId', async (req: AuthRequest, res: Response): Promise<void> => {
  const propertyResult = await pool.query(
    `SELECT id, name, ical_url, min_turnaround_hours FROM properties WHERE id = $1 AND active = true`,
    [req.params.propertyId]
  );
  const property = propertyResult.rows[0];
  if (!property) { res.status(404).json({ error: 'Property not found' }); return; }
  if (!property.ical_url) { res.status(400).json({ error: 'No iCal URL configured for this property' }); return; }

  const events = await fetchIcal(property.ical_url);
  let created = 0;
  let skipped = 0;

  for (const event of events) {
    const checkinDate = event.dtstart;
    const checkoutDate = event.dtend;

    const result = await pool.query(
      `INSERT INTO reservations (property_id, source, external_uid, checkin_date, checkout_date, summary, synced_at)
       VALUES ($1, 'airbnb_ical', $2, $3, $4, $5, now())
       ON CONFLICT (external_uid) DO UPDATE
         SET checkin_date = $3, checkout_date = $4, summary = $5, synced_at = now()
       RETURNING (xmax = 0) as inserted`,
      [property.id, event.uid, checkinDate, checkoutDate, event.summary]
    );
    if (result.rows[0]?.inserted) created++;
    else skipped++;
  }

  res.json({ synced: events.length, created, updated: skipped });
});

// GET /ical/reservations/:propertyId
router.get('/reservations/:propertyId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM reservations WHERE property_id = $1 ORDER BY checkin_date DESC`,
    [req.params.propertyId]
  );
  res.json(result.rows);
});

export default router;
