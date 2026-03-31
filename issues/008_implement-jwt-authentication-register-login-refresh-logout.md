---
title: "Implement JWT authentication (register, login, refresh, logout)"
milestone: "M3: API Core"
labels: ["backend", "auth"]
---

# Implement JWT authentication (register, login, refresh, logout)

**Milestone:** M3: API Core
**Labels:** backend, auth

## Dependencies
- Depends on #4

## Overview
Build the authentication system. All other API routes depend on this.

## Endpoints
```
POST /auth/login          — email + password → access token + refresh token
POST /auth/refresh        — refresh token → new access token
POST /auth/logout         — invalidate refresh token
POST /auth/register       — owner-only, creates new user accounts
```

## Implementation Details
- Access token: JWT, 15 minute expiry, payload: `{ userId, role, propertyIds[] }`
- Refresh token: JWT, 30 day expiry, stored in httpOnly cookie
- Passwords: bcrypt, 12 rounds
- `propertyIds`: array of property UUIDs the user is assigned to (for cleaners); empty = all properties (for owner/admin)
- Middleware: `requireAuth` — validates access token on all protected routes
- Middleware: `requireRole(...roles)` — checks role
- Middleware: `requirePropertyAccess(propertyId)` — validates cleaner has access to the requested property

## Tasks
- [ ] Install: `jsonwebtoken`, `bcrypt`, `cookie-parser`
- [ ] Create `api/src/middleware/auth.ts` with all three middleware functions
- [ ] Create `api/src/routes/auth.ts` with all four endpoints
- [ ] Refresh token rotation on each use
- [ ] Unit tests for all auth middleware

## Acceptance Criteria
- [ ] Login with correct credentials returns valid tokens
- [ ] Expired access token returns 401
- [ ] Cleaner token includes only their assigned `propertyIds`
- [ ] `requirePropertyAccess` blocks cleaner from accessing unassigned property
- [ ] Refresh token is invalidated on logout
