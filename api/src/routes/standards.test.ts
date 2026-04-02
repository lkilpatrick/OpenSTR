import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };
const mockConnect = jest.fn().mockResolvedValue(mockClient);

jest.mock('../db/pool', () => ({
  pool: { query: mockQuery, connect: mockConnect },
}));
jest.mock('../lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));

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

import standardsRouter from './standards';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/standards', standardsRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('GET /standards', () => {
  it('returns standards with task counts', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', name: 'Enhanced Clean', task_count: 12 }] });
    const res = await request(buildApp()).get('/standards');
    expect(res.status).toBe(200);
    expect(res.body[0].task_count).toBe(12);
  });
});

describe('GET /standards/:id', () => {
  it('returns standard with tasks', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 's1', name: 'Enhanced Clean' }] })
      .mockResolvedValueOnce({ rows: [{ id: 't1', label: 'Wipe counters' }] });
    const res = await request(buildApp()).get('/standards/s1');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
  });

  it('returns 404 for missing standard', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).get('/standards/missing');
    expect(res.status).toBe(404);
  });
});

describe('POST /standards', () => {
  it('creates a standard', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's2', name: 'Deep Clean' }] });
    const res = await request(buildApp()).post('/standards').send({ name: 'Deep Clean' });
    expect(res.status).toBe(201);
  });

  it('rejects without name', async () => {
    const res = await request(buildApp()).post('/standards').send({});
    expect(res.status).toBe(400);
  });

  it('rejects non-owner', async () => {
    currentUser = { userId: 'u1', role: 'admin', propertyIds: ['p1'] };
    const res = await request(buildApp()).post('/standards').send({ name: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /standards/:id', () => {
  it('updates standard', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', name: 'Updated' }] });
    const res = await request(buildApp()).patch('/standards/s1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 400 for empty body', async () => {
    const res = await request(buildApp()).patch('/standards/s1').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing standard', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).patch('/standards/missing').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /standards/:id', () => {
  it('deletes standard via transaction', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce(undefined) // UPDATE properties SET standard_id = NULL
      .mockResolvedValueOnce(undefined) // DELETE standard_tasks
      .mockResolvedValueOnce({ rows: [{ id: 's1' }] }) // DELETE standards RETURNING id
      .mockResolvedValueOnce(undefined); // COMMIT
    const res = await request(buildApp()).delete('/standards/s1');
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing standard', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce(undefined) // UPDATE properties
      .mockResolvedValueOnce(undefined) // DELETE standard_tasks
      .mockResolvedValueOnce({ rows: [] }) // DELETE standards returns nothing
      .mockResolvedValueOnce(undefined); // COMMIT
    const res = await request(buildApp()).delete('/standards/missing');
    expect(res.status).toBe(404);
  });
});

describe('POST /standards/:id/tasks', () => {
  it('adds a task to standard', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'st1', label: 'New task' }] });
    const res = await request(buildApp()).post('/standards/s1/tasks').send({ label: 'New task', room_type: 'kitchen' });
    expect(res.status).toBe(201);
  });

  it('rejects without label', async () => {
    const res = await request(buildApp()).post('/standards/s1/tasks').send({ room_type: 'kitchen' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /standards/:id/tasks/:taskId', () => {
  it('updates a standard task', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'st1', label: 'Updated' }] });
    const res = await request(buildApp()).patch('/standards/s1/tasks/st1').send({ label: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing task', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).patch('/standards/s1/tasks/missing').send({ label: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /standards/:id/tasks/:taskId', () => {
  it('archives a standard task', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(buildApp()).delete('/standards/s1/tasks/st1');
    expect(res.status).toBe(200);
  });
});
