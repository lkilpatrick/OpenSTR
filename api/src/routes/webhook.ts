import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// POST /webhook/home-assistant — August lock trigger
// Home Assistant calls this when the door lock changes state
router.post('/home-assistant', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { entity_id, state } = req.body as { entity_id?: string; state?: string };
  if (!entity_id || state !== 'unlocked') {
    res.json({ message: 'Ignored — not an unlock event' });
    return;
  }

  // Find property with this lock entity
  const propResult = await pool.query(
    `SELECT id, name FROM properties WHERE lock_entity_id = $1 AND active = true`,
    [entity_id]
  );
  const property = propResult.rows[0];
  if (!property) {
    res.json({ message: 'No property found for this entity' });
    return;
  }

  // Check property type for residence vs STR handling
  const fullProp = await pool.query(`SELECT type, photo_required_default FROM properties WHERE id = $1`, [property.id]);
  const isResidence = fullProp.rows[0]?.type === 'residence';

  let reservationId: string | null = null;
  let sessionType = 'turnover';
  let photoRequired = true;

  if (isResidence) {
    // Residence: no reservation lookup, session type = 'scheduled', photos optional by default
    sessionType = 'scheduled';
    photoRequired = fullProp.rows[0]?.photo_required_default ?? false;
  } else {
    // STR: check for upcoming checkout (turnover window)
    const reservationResult = await pool.query(
      `SELECT id FROM reservations
       WHERE property_id = $1
         AND checkout_date >= current_date - interval '1 day'
         AND checkout_date <= current_date + interval '1 day'
       ORDER BY checkout_date DESC LIMIT 1`,
      [property.id]
    );
    reservationId = reservationResult.rows[0]?.id ?? null;
  }

  // Create a pending clean session triggered by the lock event
  const sessionResult = await pool.query(
    `INSERT INTO clean_sessions (property_id, triggered_by, session_type, reservation_id, photo_required)
     VALUES ($1, 'lock_event', $2, $3, $4)
     RETURNING id`,
    [property.id, sessionType, reservationId, photoRequired]
  );

  // Auto-create room_cleans
  await pool.query(
    `INSERT INTO room_cleans (session_id, room_id)
     SELECT $1, id FROM rooms WHERE property_id = $2 AND archived = false`,
    [sessionResult.rows[0].id, property.id]
  );

  res.json({
    message: 'Session created',
    sessionId: sessionResult.rows[0].id,
    propertyName: property.name,
  });
});

export default router;
