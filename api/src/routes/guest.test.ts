import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({
  pool: { query: mockQuery },
}));

// Mock multer to avoid file system operations in tests
jest.mock('multer', () => {
  const m = () => ({
    single: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  });
  m.diskStorage = () => ({});
  return m;
});

import guestRouter from './guest';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/guest', guestRouter);
  return app;
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('GET /guest/:propertySlug', () => {
  it('returns property guide for valid slug', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 'p1', name: 'Beach House', welcome_message: 'Welcome!', house_rules: 'No parties',
          checkin_instructions: 'Code is 1234', checkout_instructions: 'Leave keys', wifi_password: 'beach123' }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'r1', display_name: 'Kitchen' }] });

    const app = buildApp();
    const res = await request(app).get('/guest/beach-house');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Beach House');
    expect(res.body.welcome_message).toBe('Welcome!');
    expect(res.body.rooms).toHaveLength(1);
  });

  it('returns 404 for unknown slug', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app).get('/guest/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /guest/:propertySlug/issues', () => {
  it('creates an issue for valid property', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] }) // property lookup
      .mockResolvedValueOnce({ rows: [{ id: 'i1' }] }); // insert issue
    const app = buildApp();
    const res = await request(app)
      .post('/guest/beach-house/issues')
      .send({ description: 'Broken faucet', severity: 'high', contact_name: 'John' });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('successfully');
  });

  it('returns 404 for unknown property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const app = buildApp();
    const res = await request(app)
      .post('/guest/nonexistent/issues')
      .send({ description: 'Something broke' });
    expect(res.status).toBe(404);
  });

  it('rejects missing description', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
    const app = buildApp();
    const res = await request(app)
      .post('/guest/beach-house/issues')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /guest/:propertySlug/messages', () => {
  it('creates a message for valid property', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'p1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'm1' }] });
    const app = buildApp();
    const res = await request(app)
      .post('/guest/beach-house/messages')
      .send({ message: 'Hello owner!', sender_name: 'Jane', sender_email: 'jane@test.com', subject: 'Question' });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('successfully');
  });

  it('rejects missing message body', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
    const app = buildApp();
    const res = await request(app)
      .post('/guest/beach-house/messages')
      .send({});
    expect(res.status).toBe(400);
  });
});
