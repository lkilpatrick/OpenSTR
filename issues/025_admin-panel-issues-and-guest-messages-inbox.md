---
title: "Admin panel: issues and guest messages inbox"
milestone: "M7: Admin Panel — Core"
labels: ["admin", "frontend"]
---

# Admin panel: issues and guest messages inbox

**Milestone:** M7: Admin Panel — Core
**Labels:** admin, frontend

## Dependencies
- Depends on #6
- Depends on #22

## Overview
Unified inbox for all guest messages and cleaner-reported issues across all properties.

## Issues Screen
- Filter: property | severity | status | date
- Table: date, property, room, reporter (guest/cleaner), description, severity badge, status
- Row click → detail modal
- Inline "Mark Resolved" button

### Issue Detail Modal
- Full description + photo (if attached)
- Severity + status controls
- Admin notes text area (internal only)
- Link to related session (if any)
- Status history timeline

## Guest Messages Screen
- Message list with: sender (guest name/ref), subject, date, status badge
- Message detail: full body + admin reply notes
- Response time shown — feeds Superhost response rate KPI
- Mark as: In Progress | Resolved

## Response Time Tracking
- Each message records `first_viewed_at` and `responded_at`
- Response time = `responded_at` - `created_at`
- Used in Superhost KPI calculation

## Tasks
- [ ] Issues list with filters
- [ ] Issue detail modal with photo viewer
- [ ] Guest messages list and detail
- [ ] Response time recording
- [ ] Severity badge component (Low/Medium/High colour coding)
- [ ] Status workflow controls

## Acceptance Criteria
- [ ] Response time recorded correctly from first "Resolved" action
- [ ] Issues with photos display photo inline in modal
- [ ] Status updates reflected immediately in list
- [ ] Filter by severity works correctly
