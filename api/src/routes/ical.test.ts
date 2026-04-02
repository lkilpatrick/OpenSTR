import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();
jest.mock('../db/pool', () => ({ pool: { query: mockQuery } }));
jest.mock('../lib/auth', () => ({ auth: { api: { getSession: jest.fn() } } }));
jest.mock('../services/ical', () => ({ fetchIcal: jest.fn() }));

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

import icalRouter from './ical';
import { fetchIcal } from '../services/ical';

const mockFetchIcal = fetchIcal as jest.MockedFunction<typeof fetchIcal>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/ical', icalRouter);
  return app;
}

beforeEach(() => {
  currentUser = { userId: 'u1', role: 'owner', propertyIds: ['p1'] };
  mockQuery.mockReset();
  mockFetchIcal.mockReset();
});

describe('POST /ical/sync/:propertyId', () => {
  it('syncs reservations from ical', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Prop', ical_url: 'https://example.com/cal', min_turnaround_hours: 4 }] });
    mockFetchIcal.mockResolvedValueOnce([
      { uid: 'e1', dtstart: '2025-06-01', dtend: '2025-06-05', summary: 'Guest', guest_name: null, phone: null, num_guests: 2, description: null, location: null, is_blocked: false },
    ] as any);
    mockQuery.mockResolvedValueOnce({ rows: [{ inserted: true }] });
    const res = await request(buildApp()).post('/ical/sync/p1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('synced', 1);
  });

  it('returns 404 for missing property', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).post('/ical/sync/missing');
    expect(res.status).toBe(404);
  });

  it('returns 400 when no ical_url', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Prop', ical_url: null }] });
    const res = await request(buildApp()).post('/ical/sync/p1');
    expect(res.status).toBe(400);
  });

  it('rejects cleaner role', async () => {
    currentUser = { userId: 'u1', role: 'cleaner', propertyIds: ['p1'] };
    const res = await request(buildApp()).post('/ical/sync/p1');
    expect(res.status).toBe(403);
  });
});

describe('GET /ical/reservations/:propertyId', () => {
  it('returns reservations', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', summary: 'Guest' }] });
    const res = await request(buildApp()).get('/ical/reservations/p1');
    expect(res.status).toBe(200);
    expect(res.body[0].summary).toBe('Guest');
  });
});

describe('POST /ical/reservations/:propertyId', () => {
  it('creates a manual reservation', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r2', source: 'manual' }] });
    const res = await request(buildApp()).post('/ical/reservations/p1').send({
      checkin_date: '2025-06-01', checkout_date: '2025-06-05', summary: 'Test Guest',
    });
    expect(res.status).toBe(201);
  });

  it('rejects without dates', async () => {
    const res = await request(buildApp()).post('/ical/reservations/p1').send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /ical/reservations/:propertyId/:reservationId', () => {
  it('updates reservation', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1', summary: 'Updated' }] });
    const res = await request(buildApp()).patch('/ical/reservations/p1/r1').send({ summary: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).patch('/ical/reservations/p1/missing').send({ summary: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty body', async () => {
    const res = await request(buildApp()).patch('/ical/reservations/p1/r1').send({});
    expect(res.status).toBe(400);
  });
});

describe('DELETE /ical/reservations/:propertyId/:reservationId', () => {
  it('deletes a reservation', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'r1' }] });
    const res = await request(buildApp()).delete('/ical/reservations/p1/r1');
    expect(res.status).toBe(200);
  });

  it('returns 404 for missing', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(buildApp()).delete('/ical/reservations/p1/missing');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /ical/reservations/:propertyId/all', () => {
  it('deletes all reservations for property', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 5 });
    const res = await request(buildApp()).delete('/ical/reservations/p1/all');
    expect(res.status).toBe(200);
  });
});
