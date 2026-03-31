---
title: "Build task completion and photo upload API"
milestone: "M4: Session Engine"
labels: ["backend", "api", "photos"]
---

# Build task completion and photo upload API

**Milestone:** M4: Session Engine
**Labels:** backend, api, photos

## Dependencies
- Depends on #13

## Overview
Endpoints for completing checklist tasks and uploading before/after photos within a session.

## Endpoints

### Task Completions
```
GET    /room-cleans/:id/task-completions              — list all completions for a room clean
PATCH  /room-cleans/:id/task-completions/:taskId      — mark complete/incomplete, add notes
POST   /room-cleans/:id/task-completions/bulk         — batch update (all tasks at once)
```

### Photos
```
POST   /room-cleans/:id/photos        — upload before or after photo
GET    /room-cleans/:id/photos        — list photos for room clean
DELETE /room-cleans/:id/photos/:photoId — admin/owner only
```

### Supply Alerts
```
POST   /room-cleans/:id/supply-alerts    — log a supply shortage
GET    /properties/:id/supply-alerts     — list unresolved alerts for property
PATCH  /supply-alerts/:id               — mark resolved (admin/owner)
```

## Photo Upload Implementation
- Accept: `multipart/form-data` with `file` and `type` (before|after)
- Validate: max 5MB server-side (client compresses to 2MB target)
- Store: `/photos/{property_id}/{session_id}/{room_clean_id}/{type}_{timestamp}.jpg`
- Record: `storage_path`, `file_size_kb`, `taken_at` (from EXIF or upload time)
- Serve: `GET /photos/*` static file route (nginx in production)

## Tasks
- [ ] Install `multer` for file upload handling
- [ ] Implement task completion endpoints
- [ ] Implement photo upload with storage logic
- [ ] Implement supply alert endpoints
- [ ] Validate only one `before` and one `after` photo per room clean
- [ ] Unit tests for supply alert threshold logic

## Acceptance Criteria
- [ ] Photo upload stores file at correct path with correct naming
- [ ] Second before-photo upload replaces the first (or returns 409 — configurable)
- [ ] Supply alert created with correct `supply_item` and `quantity_remaining`
- [ ] Task completion records `completed_at` timestamp
