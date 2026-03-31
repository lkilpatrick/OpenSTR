import jwt from 'jsonwebtoken';
import { requireAuth, requireRole, requirePropertyAccess } from './auth';
import type { AuthRequest } from './auth';
import type { Response, NextFunction } from 'express';

process.env.JWT_SECRET = 'test-secret';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe('requireAuth', () => {
  it('passes with valid Bearer token', () => {
    const payload = { userId: 'u1', role: 'owner', propertyIds: [] };
    const token = jwt.sign(payload, 'test-secret', { expiresIn: '1m' });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    const next = mockNext();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe('u1');
  });

  it('rejects missing token with 401', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();
    requireAuth(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('rejects expired token with 401', () => {
    const token = jwt.sign({ userId: 'u1', role: 'owner', propertyIds: [] }, 'test-secret', { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();
    requireAuth(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireRole', () => {
  it('passes when user has required role', () => {
    const req = { user: { userId: 'u1', role: 'owner', propertyIds: [] } } as unknown as AuthRequest;
    const next = mockNext();
    requireRole('owner')(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks when user lacks required role', () => {
    const req = { user: { userId: 'u1', role: 'cleaner', propertyIds: [] } } as unknown as AuthRequest;
    const res = mockRes();
    requireRole('owner')(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requirePropertyAccess', () => {
  it('allows owner access to any property', () => {
    const req = {
      user: { userId: 'u1', role: 'owner', propertyIds: [] },
      params: { propertyId: 'prop-999' },
    } as unknown as AuthRequest;
    const next = mockNext();
    requirePropertyAccess()(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks cleaner from unassigned property', () => {
    const req = {
      user: { userId: 'u1', role: 'cleaner', propertyIds: ['prop-1'] },
      params: { propertyId: 'prop-2' },
    } as unknown as AuthRequest;
    const res = mockRes();
    requirePropertyAccess()(req, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows cleaner access to assigned property', () => {
    const req = {
      user: { userId: 'u1', role: 'cleaner', propertyIds: ['prop-1'] },
      params: { propertyId: 'prop-1' },
    } as unknown as AuthRequest;
    const next = mockNext();
    requirePropertyAccess()(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});
