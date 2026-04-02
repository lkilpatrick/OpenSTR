import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/pool';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const PHOTO_DIR = process.env.PHOTO_STORAGE_PATH ?? '/photos';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true });
    cb(null, PHOTO_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

// POST /photos/:roomCleanId — upload before/after photo
router.post('/:roomCleanId', upload.single('photo'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const { type, taken_at, notes } = req.body as { type?: string; taken_at?: string; notes?: string };
  if (!type || !['before', 'after', 'issue'].includes(type)) {
    res.status(400).json({ error: 'type must be "before", "after", or "issue"' });
    return;
  }

  const storagePath = `/photos/${req.file.filename}`;
  const fileSizeKb = Math.round(req.file.size / 1024);

  const result = await pool.query(
    `INSERT INTO photos (room_clean_id, type, storage_path, file_size_kb, taken_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.roomCleanId, type, storagePath, fileSizeKb, taken_at ?? null]
  );

  res.status(201).json(result.rows[0]);
});

// GET /photos/:roomCleanId — list photos for a room clean
router.get('/:roomCleanId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    `SELECT * FROM photos WHERE room_clean_id = $1 ORDER BY uploaded_at`,
    [req.params.roomCleanId]
  );
  res.json(result.rows);
});

// POST /photos/:roomCleanId/tasks/:taskId/complete — complete a task
router.post('/:roomCleanId/tasks/:taskId/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  const { quantity_value, supply_replenished, notes } = req.body as {
    quantity_value?: number;
    supply_replenished?: boolean;
    notes?: string;
  };

  const result = await pool.query(
    `INSERT INTO task_completions (room_clean_id, task_id, completed, quantity_value, supply_replenished, notes, completed_at)
     VALUES ($1, $2, true, $3, $4, $5, now())
     ON CONFLICT (room_clean_id, task_id)
     DO UPDATE SET completed = true, quantity_value = $3, supply_replenished = $4, notes = $5, completed_at = now()
     RETURNING *`,
    [req.params.roomCleanId, req.params.taskId, quantity_value ?? null, supply_replenished ?? null, notes ?? null]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /photos/:roomCleanId/tasks/:taskId/complete — uncomplete a task (admin only)
router.delete('/:roomCleanId/tasks/:taskId/complete', async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || !['owner', 'admin'].includes(req.user.role)) {
    res.status(403).json({ error: 'Only owners/admins can uncomplete tasks' });
    return;
  }
  const result = await pool.query(
    `DELETE FROM task_completions WHERE room_clean_id = $1 AND task_id = $2 RETURNING *`,
    [req.params.roomCleanId, req.params.taskId]
  );
  if (!result.rows[0]) { res.status(404).json({ error: 'Task completion not found' }); return; }
  res.json({ message: 'Task uncompleted' });
});

// DELETE /photos/file/:photoId — delete a single photo
router.delete('/file/:photoId', async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(`DELETE FROM photos WHERE id = $1 RETURNING id, storage_path`, [req.params.photoId]);
  if (!result.rows[0]) { res.status(404).json({ error: 'Not Found' }); return; }
  // Attempt to remove the file from disk
  const filePath = path.join(PHOTO_DIR, path.basename(result.rows[0].storage_path));
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ }
  res.json({ message: 'Photo deleted' });
});

export default router;
