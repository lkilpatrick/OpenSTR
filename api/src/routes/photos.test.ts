import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({ pool: { query: mockQuery } }));
jest.mock('../lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));

// Mock multer to skip actual file handling
jest.mock('multer', () => {
  const multerInstance = {
    single: () => (req: any, _res: any, next: any) => {
      req.file = { filename: 'test-photo.jpg', size: 204800, originalname: 'photo.jpg' };
      // Parse body from multipart fields (supertest .field() sets them on req.body via busboy,
      // but since we're mocking multer we need to handle this)
      if (!req.body) req.body = {};
      next();
    },
  };
  const multerFn: any = () => multerInstance;
  multerFn.diskStorage = () => ({});
  return multerFn;
});

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

let currentUser: { userId: string; role: string; propertyIds: string[] } | null = null;
jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    requireAuth: (req: any, res: any, next: any) => {
      if (currentUser) { req.user = currentUser; next(); }
      else res.status(401).json({ error: 'Unauthorized' });
    },
  };
});

import photosRouter from './photos';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/photos', photosRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
  mockQuery.mockReset();
});

describe('POST /photos/:roomCleanId', () => {
  it('uploads a photo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'ph1', type: 'before', storage_path: '/photos/test-photo.jpg' }] });
    const res = await request(buildApp())
      .post('/photos/rc1')
      .send({ type: 'before' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('before');
  });

  it('rejects invalid type', async () => {
    const res = await request(buildApp())
      .post('/photos/rc1')
      .send({ type: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('rejects missing type', async () => {
    const res = await request(buildApp())
      .post('/photos/rc1')
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated', async () => {
    currentUser = null;
    const res = await request(buildApp()).post('/photos/rc1').send({ type: 'before' });
    expect(res.status).toBe(401);
  });
});

describe('GET /photos/:roomCleanId', () => {
  it('returns photos for a room clean', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'ph1', type: 'before' }, { id: 'ph2', type: 'after' }] });
    const res = await request(buildApp()).get('/photos/rc1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns empty array when no photos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).get('/photos/rc1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /photos/:roomCleanId/tasks/:taskId/complete', () => {
  it('marks a task as completed', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ room_clean_id: 'rc1', task_id: 't1', completed: true }] });
    const res = await request(buildApp()).post('/photos/rc1/tasks/t1/complete').send({});
    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(true);
  });

  it('accepts optional fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ room_clean_id: 'rc1', task_id: 't1', completed: true, notes: 'Done' }] });
    const res = await request(buildApp()).post('/photos/rc1/tasks/t1/complete').send({
      notes: 'Done', quantity_value: 3, supply_replenished: true,
    });
    expect(res.status).toBe(201);
  });
});

describe('DELETE /photos/:roomCleanId/tasks/:taskId/complete', () => {
  it('uncompletes a task as owner', async () => {
    currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
    mockQuery.mockResolvedValueOnce({ rows: [{ room_clean_id: 'rc1', task_id: 't1' }] });
    const res = await request(buildApp()).delete('/photos/rc1/tasks/t1/complete');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task uncompleted');
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).delete('/photos/rc1/tasks/t1/complete');
    expect(res.status).toBe(403);
  });

  it('returns 404 for missing completion', async () => {
    currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).delete('/photos/rc1/tasks/t1/complete');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /photos/file/:photoId', () => {
  it('deletes a photo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'ph1', storage_path: '/photos/test-photo.jpg' }] });
    const res = await request(buildApp()).delete('/photos/file/ph1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Photo deleted');
  });

  it('returns 404 for missing photo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).delete('/photos/file/missing');
    expect(res.status).toBe(404);
  });
});
