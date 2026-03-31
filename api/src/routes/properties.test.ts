import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const mockQuery = jest.fn();
const mockClient = { query: jest.fn(), release: jest.fn() };
const mockConnect = jest.fn().mockResolvedValue(mockClient);
jest.mock('../db/pool', () => ({
  pool: { query: mockQuery, connect: mockConnect },
}));

import propertiesRouter from './properties';
import { requireAuth } from '../middleware/auth';

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign({ userId: 'u1', role: 'owner', propertyIds: ['p1'], ...overrides }, 'test-secret', { expiresIn: '5m' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requireAuth);
  app.use('/properties', propertiesRouter);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
  mockConnect.mockReset().mockResolvedValue(mockClient);
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('GET /properties', () => {
  it('returns properties list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Beach House' }] });
    const app = buildApp();
    const res = await request(app).get('/properties').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Beach House');
  });

  it('returns 401 without auth', async () => {
    const app = buildApp();
    const res = await request(app).get('/properties');
    expect(res.status).toBe(401);
  });
});

describe('GET /properties/:propertyId', () => {
  it('returns a single property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Beach House' }] });
    const app = buildApp();
    const res = await request(app).get('/properties/p1').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('p1');
  });

  it('returns 404 for missing property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app).get('/properties/missing').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /properties/:propertyId', () => {
  it('updates property fields', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Updated', ical_url: 'https://test.com' }] });
    const app = buildApp();
    const res = await request(app)
      .patch('/properties/p1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'Updated', ical_url: 'https://test.com' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('rejects empty body', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/properties/p1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects cleaner role', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/properties/p1')
      .set('Authorization', `Bearer ${makeToken({ role: 'cleaner' })}`)
      .send({ name: 'Hack' });
    expect(res.status).toBe(403);
  });
});

describe('GET /properties/:propertyId/rooms', () => {
  it('returns rooms for a property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', display_name: 'Kitchen', display_order: 0 }] });
    const app = buildApp();
    const res = await request(app).get('/properties/p1/rooms').set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body[0].display_name).toBe('Kitchen');
  });
});

describe('POST /properties/:propertyId/rooms', () => {
  it('creates a room', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r-new', display_name: 'Living Room' }] });
    const app = buildApp();
    const res = await request(app)
      .post('/properties/p1/rooms')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ display_name: 'Living Room', slug: 'living-room' });
    expect(res.status).toBe(201);
    expect(res.body.display_name).toBe('Living Room');
  });
});

describe('PATCH /properties/:propertyId/rooms/reorder', () => {
  it('reorders rooms by id array', async () => {
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // UPDATE r1
      .mockResolvedValueOnce({ rows: [] }) // UPDATE r2
      .mockResolvedValueOnce(undefined); // COMMIT
    // After COMMIT, route does pool.query for final SELECT
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', display_order: 0 }, { id: 'r2', display_order: 1 }] });
    const app = buildApp();
    const res = await request(app)
      .patch('/properties/p1/rooms/reorder')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_ids: ['r1', 'r2'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mockClient.query).toHaveBeenCalledTimes(4);
  });

  it('rejects missing room_ids', async () => {
    const app = buildApp();
    const res = await request(app)
      .patch('/properties/p1/rooms/reorder')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
