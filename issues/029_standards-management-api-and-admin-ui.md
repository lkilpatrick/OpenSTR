---
title: "Standards management API and admin UI"
milestone: "M10: Standards System"
labels: ["backend", "admin", "standards"]
---

# Standards management API and admin UI

**Milestone:** M10: Standards System
**Labels:** backend, admin, standards

## Dependencies
- Depends on #9
- Depends on #24

## Overview
Build the standards management system — the reusable cleaning checklist templates that can be applied across properties.

## API Endpoints
```
GET    /standards                        — list all standards
GET    /standards/:id                    — standard detail with standard_tasks
POST   /standards                        — create new standard (owner only)
PATCH  /standards/:id                    — update standard (owner only)
POST   /standards/:id/tasks              — add standard task
PATCH  /standards/:id/tasks/:taskId      — edit standard task
DELETE /standards/:id/tasks/:taskId      — archive standard task

POST   /standards/:id/propagate          — push standard changes to all assigned properties
GET    /standards/:id/propagate/preview  — preview what would change before propagating
```

## Auto-Propagation (per decision Q11)
When a standard task is updated:
1. Find all properties using this standard
2. Find matching `tasks` records (`standard_task_id` match)
3. Update non-overridden tasks automatically
4. Create `standard_propagation_log` record
5. Send admin notification: "Standard updated — N tasks changed across M properties"
6. Admin sees review banner in checklist management UI

## Admin UI
- Admin → Standards: list of standards
- Standard detail: task list by room type
- Edit task modal (same as checklist management)
- "Push to all properties" button with preview diff

## Tasks
- [ ] Standards CRUD API
- [ ] Auto-propagation logic
- [ ] Propagation preview endpoint (dry run)
- [ ] Admin notification on propagation
- [ ] Standards list and detail screens in admin panel
- [ ] Propagation preview diff UI

## Acceptance Criteria
- [ ] Standard task update auto-propagates to all assigned properties
- [ ] Overridden property tasks are NOT overwritten by propagation
- [ ] Admin receives notification after propagation
- [ ] Propagation preview shows exact changes before commit
- [ ] Propagation is atomic — all properties updated or none
