import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

// Mock the pool before importing routes
const mockQuery = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };
const mockConnect = jest.fn().mockResolvedValue(mockClient);

jest.mock('../db/pool', () => ({
  pool: { query: mockQuery, connect: mockConnect },
}));

import sessionsRouter from './sessions';
import { requireAuth } from '../middleware/auth';

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign({ userId: 'u1', role: 'owner', propertyIds: ['p1'], ...overrides }, 'test-secret', { expiresIn: '5m' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use('/sessions', sessionsRouter);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('GET /sessions', () => {
  it('returns sessions list for owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', status: 'pending' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions?property_id=p1').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('s1');
  });

  it('returns 401 without token', async () => {
    const app = buildApp();
    const res = await request(app).get('/sessions');
    expect(res.status).toBe(401);
  });

  it('filters cleaner to own sessions', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const token = makeToken({ role: 'cleaner' });
    await request(app).get('/sessions').set('Authorization', `Bearer ${token}`);
    // Verify the query contains cleaner_id filter
    const queryStr = mockQuery.mock.calls[0][0] as string;
    expect(queryStr).toContain('cleaner_id');
  });
});

describe('GET /sessions/:sessionId', () => {
  it('returns a single session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1', status: 'pending', property_name: 'Beach' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions/s1').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('s1');
  });

  it('returns 404 for missing session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app).get('/sessions/missing').set('Authorization', `Bearer ${makeToken()}`);
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
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ property_id: 'p1', session_type: 'turnover' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('s-new');
  });

  it('rejects without property_id', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects cleaner role', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${makeToken({ role: 'cleaner' })}`)
      .send({ property_id: 'p1' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /sessions/:sessionId/status', () => {
  it('transitions pending to in_progress', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'u1' }] }) // SELECT current
      .mockResolvedValueOnce({ rows: [{ id: 's1', status: 'in_progress' }] }); // UPDATE
    const app = buildApp();
    const res = await request(app)
      .patch('/sessions/s1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'u1' }] });
    const app = buildApp();
    const res = await request(app)
      .patch('/sessions/s1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(422);
  });

  it('rejects missing status', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/sessions/s1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('prevents cleaner from updating others session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ status: 'pending', cleaner_id: 'other-user' }] });
    const app = buildApp();
    const res = await request(app)
      .patch('/sessions/s1/status')
      .set('Authorization', `Bearer ${makeToken({ role: 'cleaner' })}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(403);
  });
});

describe('POST /sessions/schedule', () => {
  it('creates a scheduled session for residence', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 's-sched', status: 'pending' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined); // COMMIT
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/schedule')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ property_id: 'p1', scheduled_date: '2025-04-15', photo_required: false });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('s-sched');
  });

  it('rejects without scheduled_date', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/schedule')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ property_id: 'p1' });
    expect(res.status).toBe(400);
  });
});

describe('POST /sessions/:sessionId/rating', () => {
  it('creates a rating', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', rating: 5 }] });
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/s1/rating')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 5, review_text: 'Great!' });
    expect(res.status).toBe(201);
  });

  it('rejects invalid rating', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/s1/rating')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects rating > 5', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/sessions/s1/rating')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });
});

describe('GET /sessions/:sessionId/rooms', () => {
  it('returns room cleans', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rc1', display_name: 'Kitchen' }] });
    const app = buildApp();
    const res = await request(app).get('/sessions/s1/rooms').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body[0].display_name).toBe('Kitchen');
  });
});
