---
title: "Build user and cleaner assignment API endpoints"
milestone: "M3: API Core"
labels: ["backend", "api"]
---

# Build user and cleaner assignment API endpoints

**Milestone:** M3: API Core
**Labels:** backend, api

## Dependencies
- Depends on #8

## Overview
User management and property-cleaner assignment endpoints.

## Endpoints

### Users
```
GET    /users                         — owner/admin only
GET    /users/:id                     — own profile always allowed; others: owner/admin
POST   /users                         — owner only (invite/create)
PATCH  /users/:id                     — own profile or owner/admin
PATCH  /users/:id/push-token          — cleaner updates their own push token
DELETE /users/:id                     — owner only (active=false)
```

### Property Cleaners
```
GET    /properties/:id/cleaners       — list assigned cleaners for a property
POST   /properties/:id/cleaners       — assign a cleaner to a property
PATCH  /properties/:id/cleaners/:userId  — update is_primary, is_active, notes
DELETE /properties/:id/cleaners/:userId  — remove assignment
```

## Business Rules
- Only one cleaner can be `is_primary = true` per property — enforce in API
- Removing a cleaner assignment does not delete session history
- A cleaner's JWT `propertyIds` must be refreshed when assignments change

## Tasks
- [ ] Implement all user CRUD endpoints
- [ ] Implement property_cleaners endpoints
- [ ] Enforce single primary cleaner constraint
- [ ] Input validation with zod

## Acceptance Criteria
- [ ] Setting a new primary cleaner automatically unsets the previous one
- [ ] Cleaner cannot view other users' profiles
- [ ] Deleting a user sets `active = false`, does not cascade delete sessions
