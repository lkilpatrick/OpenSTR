jest.mock('../lib/auth', () => ({
  auth: { api: { getSession: jest.fn() } },
}));

import { requireRole, requirePropertyAccess } from './auth';
import type { AuthRequest } from './auth';
import type { Response, NextFunction } from 'express';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function mockNext(): NextFunction {
  return jest.fn();
}

// requireAuth is async and calls auth.api.getSession() — tested via integration/route tests.
// Here we unit-test requireRole and requirePropertyAccess which are synchronous.

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

  it('accepts multiple allowed roles', () => {
    const req = { user: { userId: 'u1', role: 'admin', propertyIds: [] } } as unknown as AuthRequest;
    const next = mockNext();
    requireRole('owner', 'admin')(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects when user is missing', () => {
    const req = {} as unknown as AuthRequest;
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

  it('allows admin access to any property', () => {
    const req = {
      user: { userId: 'u1', role: 'admin', propertyIds: [] },
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
