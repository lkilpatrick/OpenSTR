import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };
const mockConnect = jest.fn().mockResolvedValue(mockClient);

jest.mock('../db/pool', () => ({
  pool: { query: mockQuery, connect: mockConnect },
}));

jest.mock('../lib/auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));

// currentUser is injected by the mocked requireAuth
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

import sessionsRouter from './sessions';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/sessions', sessionsRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('GET /sessions', () => {
  it('returns sessions list for owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', status: 'pending' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions?property_id=p1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('s1');
  });

  it('returns 401 without auth', async () => {
    currentUser = null;
    const app = buildApp();
    const res = await request(app).get('/sessions');
    expect(res.status).toBe(401);
  });

  it('filters cleaner to own sessions', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    await request(app).get('/sessions');
    const queryStr = mockQuery.mock.calls[0][0] as string;
    expect(queryStr).toContain('cleaner_id');
  });
});

describe('GET /sessions/:sessionId', () => {
  it('returns a single session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', status: 'pending', property_name: 'Beach' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions/s1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('s1');
  });

  it('returns 404 for missing session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app).get('/sessions/missing');
    expect(res.status).toBe(404);
  });
});

describe('POST /sessions', () => {
  it('creates a session as owner', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 's-new', status: 'pending' }] }) // INSERT session
      .mockResolvedValueOnce({ rows: [] }) // INSERT room_cleans
      .mockResolvedValueOnce(undefined); // COMMIT
    const app = buildApp();
    const res = await request(app)
      .post('/sessions')
      .send({ property_id: 'p1', session_type: 'turnover' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('s-new');
  });

  it('rejects without property_id', async () => {
    const app = buildApp();
    const res = await request(app).post('/sessions').send({});
    expect(res.status).toBe(400);
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const app = buildApp();
    const res = await request(app).post('/sessions').send({ property_id: 'p1' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /sessions/:sessionId/status', () => {
  it('transitions pending to in_progress', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 's1', status: 'in_progress' }] });
    const app = buildApp();
    const res = await request(app).patch('/sessions/s1/status').send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'u1' }] });
    const app = buildApp();
    const res = await request(app).patch('/sessions/s1/status').send({ status: 'approved' });
    expect(res.status).toBe(422);
  });

  it('rejects missing status', async () => {
    const app = buildApp();
    const res = await request(app).patch('/sessions/s1/status').send({});
    expect(res.status).toBe(400);
  });

  it('prevents cleaner from updating others session', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'other-user' }] });
    const app = buildApp();
    const res = await request(app).patch('/sessions/s1/status').send({ status: 'in_progress' });
    expect(res.status).toBe(403);
  });
});

describe('POST /sessions/schedule', () => {
  it('creates a scheduled session for residence', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: 's-sched', status: 'pending' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined);
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/schedule')
      .send({ property_id: 'p1', scheduled_date: '2025-04-15', photo_required: false });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('s-sched');
  });

  it('rejects without scheduled_date', async () => {
    const app = buildApp();
    const res = await request(app).post('/sessions/schedule').send({ property_id: 'p1' });
    expect(res.status).toBe(400);
  });
});

describe('POST /sessions/:sessionId/rating', () => {
  it('creates a rating', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', rating: 5 }] });
    const app = buildApp();
    const res = await request(app).post('/sessions/s1/rating').send({ rating: 5, review_text: 'Great!' });
    expect(res.status).toBe(201);
  });

  it('rejects invalid rating', async () => {
    const app = buildApp();
    const res = await request(app).post('/sessions/s1/rating').send({ rating: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects rating > 5', async () => {
    const app = buildApp();
    const res = await request(app).post('/sessions/s1/rating').send({ rating: 6 });
    expect(res.status).toBe(400);
  });
});

describe('GET /sessions/:sessionId/rooms', () => {
  it('returns room cleans', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rc1', display_name: 'Kitchen' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions/s1/rooms');
    expect(res.status).toBe(200);
    expect(res.body[0].display_name).toBe('Kitchen');
  });
});
