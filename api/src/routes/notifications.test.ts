import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({ pool: { query: mockQuery } }));
jest.mock('../lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock('../services/notifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(undefined),
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

import notificationsRouter from './notifications';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/notifications', notificationsRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
});

describe('POST /notifications/session-assigned', () => {
  it('sends push notification to cleaner', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 's1', session_type: 'checkout', property_name: 'Beach House', push_token: 'token123', cleaner_name: 'Alice' }],
    });
    const res = await request(buildApp()).post('/notifications/session-assigned').send({ session_id: 's1' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Notification sent');
  });

  it('rejects missing session_id', async () => {
    const res = await request(buildApp()).post('/notifications/session-assigned').send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing session', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).post('/notifications/session-assigned').send({ session_id: 'missing' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when cleaner has no push token', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 's1', session_type: 'checkout', property_name: 'Beach House', push_token: null, cleaner_name: 'Bob' }],
    });
    const res = await request(buildApp()).post('/notifications/session-assigned').send({ session_id: 's1' });
    expect(res.status).toBe(400);
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).post('/notifications/session-assigned').send({ session_id: 's1' });
    expect(res.status).toBe(403);
  });
});

describe('POST /notifications/broadcast', () => {
  it('sends to all cleaners of a property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ push_token: 'tok1' }, { push_token: 'tok2' }] });
    const res = await request(buildApp()).post('/notifications/broadcast').send({
      property_id: 'p1', title: 'Urgent', body: 'Please check schedule',
    });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(2);
  });

  it('rejects missing fields', async () => {
    const res = await request(buildApp()).post('/notifications/broadcast').send({ property_id: 'p1' });
    expect(res.status).toBe(400);
  });

  it('handles zero tokens', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).post('/notifications/broadcast').send({
      property_id: 'p1', title: 'Test', body: 'Hello',
    });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(0);
  });
});
