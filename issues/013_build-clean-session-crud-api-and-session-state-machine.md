---
title: "Build clean session CRUD API and session state machine"
milestone: "M4: Session Engine"
labels: ["backend", "api", "sessions"]
---

# Build clean session CRUD API and session state machine

**Milestone:** M4: Session Engine
**Labels:** backend, api, sessions

## Dependencies
- Depends on #11
- Depends on #12

## Overview
The session API drives both the mobile app and admin panel. Includes a strict state machine to prevent invalid transitions.

## State Machine
```
pending → in_progress → submitted → approved
                     ↘             ↘
                      rejected ←────┘ (rejected → in_progress for re-clean)
```

## Endpoints
```
GET    /properties/:id/sessions               — list sessions (filter: status, date, type)
GET    /properties/:id/sessions/:sessionId    — session detail with room_cleans + photos
POST   /properties/:id/sessions               — manual create (admin/owner)
PATCH  /properties/:id/sessions/:sessionId    — update status, assign cleaner
POST   /properties/:id/sessions/:sessionId/submit    — cleaner submits completed session
POST   /properties/:id/sessions/:sessionId/approve   — admin/owner approves
POST   /properties/:id/sessions/:sessionId/reject    — admin/owner rejects (reason required)

GET    /properties/:id/sessions/:sessionId/room-cleans              — list room cleans
PATCH  /properties/:id/sessions/:sessionId/room-cleans/:roomCleanId — update status, notes
POST   /properties/:id/sessions/:sessionId/room-cleans/:roomCleanId/complete
```

## Compliance Score Calculation
Triggered on session approval:
- Score = (mandatory tasks completed / total mandatory tasks) × 100
- Deduct 5 points for each missing before/after photo pair
- Stored on `clean_sessions.compliance_score`
- Visible to owner/admin only (not cleaner)

## Tasks
- [ ] Implement all session endpoints
- [ ] State machine enforced — invalid transitions return 422
- [ ] Compliance score calculation on approval
- [ ] Session cannot be submitted unless all rooms have both photos (BNB) or photos optional (Residence)
- [ ] `GET /sessions` supports filtering by `status`, `date_from`, `date_to`, `session_type`

## Acceptance Criteria
- [ ] Cleaner cannot approve/reject their own session
- [ ] Rejected session can be re-opened (status back to in_progress)
- [ ] Compliance score calculated correctly on approval
- [ ] Residence sessions allow photo submission but do not require it
- [ ] BNB sessions cannot be submitted without both photos per room
