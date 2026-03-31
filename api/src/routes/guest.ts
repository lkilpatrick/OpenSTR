import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool';

const router = Router();

const PHOTO_DIR = process.env.PHOTO_STORAGE_PATH ?? '/photos';
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
    cb(null, PHOTO_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `guest-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Simple in-memory rate limiter: 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(req: Request, res: Response): boolean {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  if (entry.count > 10) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return true;
  }
  return false;
}

// GET /guest/:propertySlug — public property guide
router.get('/:propertySlug', async (req: Request, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT id, name, type, address, welcome_message, house_rules,
            checkin_instructions, checkout_instructions, wifi_password
     FROM properties WHERE slug = $1 AND active = true`,
    [req.params.propertySlug]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Property not found' }); return; }

  const property = result.rows[0];
  const roomsResult = await pool.query(
    `SELECT id, display_name FROM rooms WHERE property_id = $1 AND archived = false ORDER BY display_order`,
    [property.id]
  );

  res.json({
    name: property.name,
    welcome_message: property.welcome_message,
    house_rules: property.house_rules,
    checkin_instructions: property.checkin_instructions,
    checkout_instructions: property.checkout_instructions,
    wifi_password: property.wifi_password,
    rooms: roomsResult.rows,
  });
});

// POST /guest/:propertySlug/issues — submit issue (no auth, rate-limited)
router.post('/:propertySlug/issues', upload.single('photo'), async (req: Request, res: Response): Promise<void> => {
  if (rateLimit(req, res)) return;

  const propResult = await pool.query(
    `SELECT id FROM properties WHERE slug = $1 AND active = true`,
    [req.params.propertySlug]
  );
  if (!propResult.rows[0]) { res.status(404).json({ error: 'Property not found' }); return; }

  const { room_id, description, severity, contact_name } = req.body;
  if (!description) { res.status(400).json({ error: 'description required' }); return; }

  const photoPath = req.file ? `/photos/${req.file.filename}` : null;

  const result = await pool.query(
    `INSERT INTO issues (property_id, room_id, title, description, severity, reporter_type, reporter_name, photo_path)
     VALUES ($1, $2, $3, $4, $5, 'guest', $6, $7) RETURNING *`,
    [propResult.rows[0].id, room_id ?? null, (description as string).slice(0, 80),
     description, severity ?? 'medium', contact_name ?? null, photoPath]
  );
  res.status(201).json({ message: 'Issue reported successfully', id: result.rows[0].id });
});

// POST /guest/:propertySlug/messages — submit message (no auth, rate-limited)
router.post('/:propertySlug/messages', async (req: Request, res: Response): Promise<void> => {
  if (rateLimit(req, res)) return;

  const propResult = await pool.query(
    `SELECT id FROM properties WHERE slug = $1 AND active = true`,
    [req.params.propertySlug]
  );
  if (!propResult.rows[0]) { res.status(404).json({ error: 'Property not found' }); return; }

  const { subject, message, sender_name, sender_email } = req.body;
  if (!message) { res.status(400).json({ error: 'message required' }); return; }

  const result = await pool.query(
    `INSERT INTO guest_messages (property_id, sender_name, sender_email, subject, message, source)
     VALUES ($1, $2, $3, $4, $5, 'guest_web') RETURNING *`,
    [propResult.rows[0].id, sender_name ?? null, sender_email ?? null, subject ?? null, message]
  );
  res.status(201).json({ message: 'Message sent successfully', id: result.rows[0].id });
});

export default router;
