import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({ pool: { query: mockQuery } }));
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

import issuesRouter from './issues';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/issues', issuesRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
});

describe('GET /issues', () => {
  it('returns issues list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'i1', title: 'Slow drain' }] });
    const res = await request(buildApp()).get('/issues?property_id=p1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Slow drain');
  });

  it('filters by status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await request(buildApp()).get('/issues?status=open');
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('status');
  });

  it('returns 401 without auth', async () => {
    currentUser = null;
    const res = await request(buildApp()).get('/issues');
    expect(res.status).toBe(401);
  });
});

describe('POST /issues', () => {
  it('creates an issue', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'i2', title: 'Broken lock' }] });
    const res = await request(buildApp()).post('/issues').send({ property_id: 'p1', title: 'Broken lock' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Broken lock');
  });

  it('rejects without title', async () => {
    const res = await request(buildApp()).post('/issues').send({ property_id: 'p1' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /issues/:id', () => {
  it('updates issue fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'i1', status: 'resolved' }] });
    const res = await request(buildApp()).patch('/issues/i1').send({ status: 'resolved' });
    expect(res.status).toBe(200);
  });

  it('returns 400 for empty body', async () => {
    const res = await request(buildApp()).patch('/issues/i1').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing issue', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).patch('/issues/missing').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).patch('/issues/i1').send({ title: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /issues/:id', () => {
  it('deletes an issue', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'i1' }] });
    const res = await request(buildApp()).delete('/issues/i1');
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing issue', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).delete('/issues/missing');
    expect(res.status).toBe(404);
  });
});
