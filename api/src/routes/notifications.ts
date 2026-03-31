import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { sendPushNotification } from '../services/notifications';

const router = Router();
router.use(requireAuth, requireRole('owner', 'admin'));

// POST /notifications/session-assigned — notify cleaner of new session
router.post('/session-assigned', async (req: AuthRequest, res: Response): Promise<void> => {
  const { session_id } = req.body as { session_id?: string };
  if (!session_id) { res.status(400).json({ error: 'session_id required' }); return; }

  const result = await pool.query(
    `SELECT s.id, s.session_type, p.name as property_name, u.push_token, u.name as cleaner_name
     FROM clean_sessions s
     JOIN properties p ON p.id = s.property_id
     LEFT JOIN users u ON u.id = s.cleaner_id
     WHERE s.id = $1`,
    [session_id]
  );
  const session = result.rows[0];
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  if (!session.push_token) { res.status(400).json({ error: 'Cleaner has no push token' }); return; }

  await sendPushNotification({
    token: session.push_token,
    title: 'New Clean Session',
    body: `${session.property_name} is ready for a ${session.session_type} clean`,
    data: { sessionId: session.id, type: 'session_assigned' },
  });

  res.json({ message: 'Notification sent' });
});

// POST /notifications/broadcast — send to all cleaners of a property
router.post('/broadcast', async (req: AuthRequest, res: Response): Promise<void> => {
  const { property_id, title, body } = req.body as { property_id?: string; title?: string; body?: string };
  if (!property_id || !title || !body) {
    res.status(400).json({ error: 'property_id, title, and body required' });
    return;
  }

  const result = await pool.query(
    `SELECT u.push_token FROM property_cleaners pc
     JOIN users u ON u.id = pc.user_id
     WHERE pc.property_id = $1 AND pc.is_active = true AND u.push_token IS NOT NULL`,
    [property_id]
  );

  const tokens = result.rows.map((r: { push_token: string }) => r.push_token);
  await Promise.all(tokens.map((token: string) => sendPushNotification({ token, title, body })));

  res.json({ sent: tokens.length });
});

export default router;
