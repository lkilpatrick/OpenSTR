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

import messagesRouter from './messages';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/messages', messagesRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
});

describe('GET /messages', () => {
  it('returns messages list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'm1', message: 'Hello' }] });
    const res = await request(buildApp()).get('/messages?property_id=p1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('filters unread messages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await request(buildApp()).get('/messages?unread=true');
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toContain('read');
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).get('/messages');
    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    currentUser = null;
    const res = await request(buildApp()).get('/messages');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /messages/:id/read', () => {
  it('marks message as read', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(buildApp()).patch('/messages/m1/read').send({ read: true });
    expect(res.status).toBe(200);
  });

  it('marks message as unread', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(buildApp()).patch('/messages/m1/read').send({ read: false });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('unread');
  });
});

describe('DELETE /messages/:id', () => {
  it('deletes a message', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'm1' }] });
    const res = await request(buildApp()).delete('/messages/m1');
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing message', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).delete('/messages/missing');
    expect(res.status).toBe(404);
  });
});
