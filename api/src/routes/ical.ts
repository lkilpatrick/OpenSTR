import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { fetchIcal } from '../services/ical';

const router = Router();
router.use(requireAuth, requireRole('owner', 'admin'));

// Shared sync logic
async function syncPropertyIcal(propertyId: string): Promise<{ synced: number; created: number; updated: number }> {
  const propertyResult = await pool.query(
    `SELECT id, name, ical_url, min_turnaround_hours FROM properties WHERE id = $1 AND active = true`,
    [propertyId]
  );
  const property = propertyResult.rows[0];
  if (!property) throw new Error('Property not found');
  if (!property.ical_url) throw new Error('No iCal URL configured for this property');

  const events = await fetchIcal(property.ical_url);
  let created = 0;
  let updated = 0;

  for (const event of events) {
    const result = await pool.query(
      `INSERT INTO reservations (property_id, source, external_uid, checkin_date, checkout_date,
        summary, guest_name, phone, num_guests, description, location, is_blocked, synced_at)
       VALUES ($1, 'airbnb_ical', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
       ON CONFLICT (external_uid) DO UPDATE
         SET checkin_date = $3, checkout_date = $4, summary = $5,
             guest_name = $6, phone = $7, num_guests = $8,
             description = $9, location = $10, is_blocked = $11, synced_at = now()
       RETURNING (xmax = 0) as inserted`,
      [property.id, event.uid, event.dtstart, event.dtend, event.summary,
       event.guest_name || null, event.phone || null, event.num_guests,
       event.description || null, event.location || null, event.is_blocked]
    );
    if (result.rows[0]?.inserted) created++;
    else updated++;
  }

  return { synced: events.length, created, updated };
}

// POST /ical/sync/:propertyId — trigger iCal sync
router.post('/sync/:propertyId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await syncPropertyIcal(req.params.propertyId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    if (message === 'Property not found') { res.status(404).json({ error: message }); return; }
    if (message.startsWith('No iCal')) { res.status(400).json({ error: message }); return; }
    throw err;
  }
});

// GET /ical/reservations/:propertyId
router.get('/reservations/:propertyId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM reservations WHERE property_id = $1 ORDER BY checkin_date DESC`,
    [req.params.propertyId]
  );
  res.json(result.rows);
});

// POST /ical/reservations/:propertyId — manually create a reservation
router.post('/reservations/:propertyId', async (req: AuthRequest, res: Response): Promise<void> => {
  const { checkin_date, checkout_date, guest_name, phone, num_guests, summary, is_blocked, description } = req.body;
  if (!checkin_date || !checkout_date) {
    res.status(400).json({ error: 'checkin_date and checkout_date are required' });
    return;
  }
  const result = await pool.query(
    `INSERT INTO reservations (property_id, source, checkin_date, checkout_date, guest_name, phone, num_guests, summary, is_blocked, description, synced_at)
     VALUES ($1, 'manual', $2, $3, $4, $5, $6, $7, $8, $9, now()) RETURNING *`,
    [req.params.propertyId, checkin_date, checkout_date, guest_name ?? null, phone ?? null,
     num_guests ?? null, summary ?? null, is_blocked ?? false, description ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /ical/reservations/:propertyId/:reservationId — update a reservation
router.patch('/reservations/:propertyId/:reservationId', async (req: AuthRequest, res: Response): Promise<void> => {
  const fields = ['checkin_date', 'checkout_date', 'guest_name', 'phone', 'num_guests', 'summary', 'is_blocked', 'description'];
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
  values.push(req.params.reservationId);
  values.push(req.params.propertyId);
  const result = await pool.query(
    `UPDATE reservations SET ${updates.join(', ')} WHERE id = $${idx} AND property_id = $${idx + 1} RETURNING *`,
    values
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json(result.rows[0]);
});

// DELETE /ical/reservations/:propertyId/all — delete ALL reservations for a property (clear data)
// NOTE: Must be registered BEFORE /:reservationId to avoid Express matching "all" as a reservationId
router.delete('/reservations/:propertyId/all', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `DELETE FROM reservations WHERE property_id = $1 RETURNING id`,
    [req.params.propertyId]
  );
  res.json({ message: `Deleted ${result.rowCount} reservations` });
});

// DELETE /ical/reservations/:propertyId/:reservationId — delete a reservation
router.delete('/reservations/:propertyId/:reservationId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `DELETE FROM reservations WHERE id = $1 AND property_id = $2 RETURNING id`,
    [req.params.reservationId, req.params.propertyId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  res.json({ message: 'Reservation deleted' });
});

export { syncPropertyIcal };
export default router;
