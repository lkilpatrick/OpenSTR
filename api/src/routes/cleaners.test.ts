import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: mockQuery },
}));

import cleanersRouter from './cleaners';
import { requireAuth } from '../middleware/auth';

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign({ userId: 'u1', role: 'owner', propertyIds: ['p1'], ...overrides }, 'test-secret', { expiresIn: '5m' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use('/admin/cleaners', cleanersRouter);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('GET /admin/cleaners', () => {
  it('returns cleaner list for owner', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'c1', name: 'Dallas', email: 'dallas@test.com', total_sessions: '5', avg_compliance: '92', assigned_properties: [] }],
    });
    const app = buildApp();
    const res = await request(app).get('/admin/cleaners').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Dallas');
  });

  it('rejects cleaner role', async () => {
    const app = buildApp();
    const res = await request(app).get('/admin/cleaners').set('Authorization', `Bearer ${makeToken({ role: 'cleaner' })}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /admin/cleaners/assignments/:propertyId', () => {
  it('returns assignments for a property', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'a1', user_id: 'c1', priority: 0, is_primary: true, name: 'Dallas', email: 'dallas@test.com' },
        { id: 'a2', user_id: 'c2', priority: 1, is_primary: false, name: 'Alex', email: 'alex@test.com' },
      ],
    });
    const app = buildApp();
    const res = await request(app).get('/admin/cleaners/assignments/p1').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].priority).toBe(0);
    expect(res.body[1].priority).toBe(1);
  });
});

describe('PATCH /admin/cleaners/assignments/:id', () => {
  it('updates priority', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'a1', priority: 2 }] });
    const app = buildApp();
    const res = await request(app)
      .patch('/admin/cleaners/assignments/a1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ priority: 2 });
    expect(res.status).toBe(200);
    expect(res.body.priority).toBe(2);
  });

  it('rejects empty body', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/admin/cleaners/assignments/a1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing assignment', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app)
      .patch('/admin/cleaners/assignments/missing')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ priority: 0 });
    expect(res.status).toBe(404);
  });
});

describe('POST /admin/cleaners/assignments', () => {
  it('creates an assignment', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'a-new', property_id: 'p1', user_id: 'c1', priority: 0 }] });
    const app = buildApp();
    const res = await request(app)
      .post('/admin/cleaners/assignments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ property_id: 'p1', user_id: 'c1', priority: 0, is_primary: true });
    expect(res.status).toBe(201);
    expect(res.body.property_id).toBe('p1');
  });

  it('rejects missing property_id', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/admin/cleaners/assignments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ user_id: 'c1' });
    expect(res.status).toBe(400);
  });

  it('rejects missing user_id', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/admin/cleaners/assignments')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ property_id: 'p1' });
    expect(res.status).toBe(400);
  });
});
