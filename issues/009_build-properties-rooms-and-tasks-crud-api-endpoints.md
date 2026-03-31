---
title: "Build properties, rooms, and tasks CRUD API endpoints"
milestone: "M3: API Core"
labels: ["backend", "api"]
---

# Build properties, rooms, and tasks CRUD API endpoints

**Milestone:** M3: API Core
**Labels:** backend, api

## Dependencies
- Depends on #8

## Overview
Core read/write API for the property configuration data.

## Endpoints

### Properties
```
GET    /properties                    — owner/admin: list all; cleaner: list assigned
GET    /properties/:id                — property detail
POST   /properties                    — owner only
PATCH  /properties/:id                — owner/admin
DELETE /properties/:id                — owner only (soft delete: active=false)
```

### Rooms
```
GET    /properties/:id/rooms          — list rooms for property (ordered)
GET    /properties/:id/rooms/:roomId  — room detail
POST   /properties/:id/rooms          — admin/owner
PATCH  /properties/:id/rooms/:roomId  — admin/owner
```

### Tasks
```
GET    /properties/:id/rooms/:roomId/tasks   — list tasks (respects frequency + week detection)
POST   /properties/:id/rooms/:roomId/tasks   — admin/owner
PATCH  /properties/:id/rooms/:roomId/tasks/:taskId
DELETE /properties/:id/rooms/:roomId/tasks/:taskId  — soft delete (archived=true)
PATCH  /properties/:id/rooms/:roomId/tasks/reorder  — accepts ordered array of task IDs
```

## Weekly Task Logic
When fetching tasks, the API should:
- Always return `every_clean` tasks
- Return `weekly` tasks only if the current calendar week number is different from the week of the last session for that property
- Return `deep_clean` tasks only if `last_deep_clean_at` for the property is > 90 days ago or null

## Tasks
- [ ] Implement all endpoints with proper role checks
- [ ] Weekly task detection logic in task fetch
- [ ] `GET /properties/:id/rooms` excludes archived rooms
- [ ] `GET /rooms/:id/tasks` excludes archived tasks
- [ ] Input validation with `zod`
- [ ] Integration tests for weekly task logic

## Acceptance Criteria
- [ ] Cleaner cannot access rooms/tasks for unassigned property (403)
- [ ] Weekly tasks appear on first clean of the week, not subsequent cleans
- [ ] Deep clean tasks appear when `last_deep_clean_at` > 90 days
- [ ] Reorder endpoint updates `display_order` atomically
