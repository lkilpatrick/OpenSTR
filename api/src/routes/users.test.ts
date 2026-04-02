import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({ pool: { query: mockQuery } }));
jest.mock('../lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed-pw') }));

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

import usersRouter from './users';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', usersRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
});

describe('GET /users', () => {
  it('returns user list for owner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Admin', role: 'owner' }] });
    const res = await request(buildApp()).get('/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).get('/users');
    expect(res.status).toBe(403);
  });
});

describe('POST /users', () => {
  it('creates a user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })               // SELECT existing email check
      .mockResolvedValueOnce({ rowCount: 1 })             // INSERT user
      .mockResolvedValueOnce({ rowCount: 1 })             // INSERT account
      .mockResolvedValueOnce({ rows: [{ id: 'u2', name: 'New User', role: 'cleaner' }] }); // SELECT final
    const res = await request(buildApp()).post('/users').send({ email: 'test@test.com', name: 'New User', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New User');
  });

  it('rejects missing required fields', async () => {
    const res = await request(buildApp()).post('/users').send({ email: 'only@email.com' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing' }] }); // SELECT finds existing
    const res = await request(buildApp()).post('/users').send({ email: 'dup@test.com', name: 'Dup', password: 'pass' });
    expect(res.status).toBe(409);
  });
});

describe('GET /users/:userId', () => {
  it('returns single user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Admin' }] });
    const res = await request(buildApp()).get('/users/u1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Admin');
  });

  it('returns 404 for missing user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).get('/users/missing');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /users/:userId', () => {
  it('updates user fields', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Updated' }] }) // UPDATE users
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Updated' }] }); // SELECT final
    const res = await request(buildApp()).patch('/users/u1').send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('returns 400 for empty body', async () => {
    const res = await request(buildApp()).patch('/users/u1').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE returns nothing
    const res = await request(buildApp()).patch('/users/missing').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /users/me/push-token', () => {
  it('updates push token', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(buildApp()).patch('/users/me/push-token').send({ push_token: 'expo-token-123' });
    expect(res.status).toBe(200);
  });

  it('returns 400 without token', async () => {
    const res = await request(buildApp()).patch('/users/me/push-token').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /users/properties/:propertyId/cleaners', () => {
  it('returns cleaners for property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'u2', name: 'Cleaner', is_primary: true }] });
    const res = await request(buildApp()).get('/users/properties/p1/cleaners');
    expect(res.status).toBe(200);
    expect(res.body[0].is_primary).toBe(true);
  });
});

describe('POST /users/properties/:propertyId/cleaners', () => {
  it('assigns a cleaner', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ property_id: 'p1', user_id: 'u2' }] });
    const res = await request(buildApp()).post('/users/properties/p1/cleaners').send({ user_id: 'u2' });
    expect(res.status).toBe(201);
  });

  it('returns 400 without user_id', async () => {
    const res = await request(buildApp()).post('/users/properties/p1/cleaners').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /users/properties/:propertyId/cleaners/:userId', () => {
  it('soft-deletes assignment', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(buildApp()).delete('/users/properties/p1/cleaners/u2');
    expect(res.status).toBe(200);
  });
});
