import request from 'supertest';
import express from 'express';

process.env.WEBHOOK_SECRET = 'test-webhook-secret';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: mockQuery },
}));

import webhookRouter from './webhook';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/webhook', webhookRouter);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('POST /webhook/home-assistant', () => {
  it('rejects missing webhook secret', async () => {
    const app = buildApp();
    const res = await request(app).post('/webhook/home-assistant').send({ entity_id: 'lock.front', state: 'unlocked' });
    expect(res.status).toBe(401);
  });

  it('rejects wrong webhook secret', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/webhook/home-assistant')
      .set('x-webhook-secret', 'wrong-secret')
      .send({ entity_id: 'lock.front', state: 'unlocked' });
    expect(res.status).toBe(401);
  });

  it('ignores non-unlock events', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/webhook/home-assistant')
      .set('x-webhook-secret', 'test-webhook-secret')
      .send({ entity_id: 'lock.front', state: 'locked' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Ignored');
  });

  it('returns message when no property matches entity', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // property lookup
    const app = buildApp();
    const res = await request(app)
      .post('/webhook/home-assistant')
      .set('x-webhook-secret', 'test-webhook-secret')
      .send({ entity_id: 'lock.unknown', state: 'unlocked' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('No property');
  });

  it('creates session for STR property with unlock event', async () => {
    // Property lookup
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Beach House' }] });
    // Full property details
    mockQuery.mockResolvedValueOnce({ rows: [{ type: 'str', photo_required_default: true }] });
    // Reservation lookup
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'res1' }] });
    // Insert session
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's1' }] });
    // Insert room_cleans
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const app = buildApp();
    const res = await request(app)
      .post('/webhook/home-assistant')
      .set('x-webhook-secret', 'test-webhook-secret')
      .send({ entity_id: 'lock.front', state: 'unlocked' });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('s1');

    // Verify it created a turnover session
    const insertCall = mockQuery.mock.calls[3][0] as string;
    expect(insertCall).toContain('INSERT INTO clean_sessions');
    const insertParams = mockQuery.mock.calls[3][1] as unknown[];
    expect(insertParams[1]).toBe('turnover');
  });

  it('creates session for residence property with optional photos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p2', name: 'Home' }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ type: 'residence', photo_required_default: false }] });
    // No reservation lookup for residence
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 's2' }] }); // Insert session
    mockQuery.mockResolvedValueOnce({ rows: [] }); // room_cleans

    const app = buildApp();
    const res = await request(app)
      .post('/webhook/home-assistant')
      .set('x-webhook-secret', 'test-webhook-secret')
      .send({ entity_id: 'lock.home', state: 'unlocked' });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('s2');

    // Verify it created a scheduled session with photo_required=false
    const insertParams = mockQuery.mock.calls[2][1] as unknown[];
    expect(insertParams[1]).toBe('scheduled');
    expect(insertParams[3]).toBe(false); // photo_required
  });
});
