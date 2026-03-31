---
title: "Admin panel: session review — before/after photo comparison"
milestone: "M7: Admin Panel — Core"
labels: ["admin", "frontend", "sessions"]
---

# Admin panel: session review — before/after photo comparison

**Milestone:** M7: Admin Panel — Core
**Labels:** admin, frontend, sessions

## Dependencies
- Depends on #13
- Depends on #14
- Depends on #22

## Overview
The session review screen is where the owner audits completed cleans and approves or rejects them.

## Sessions List Screen
- Filter bar: date range | property | cleaner | status | session type
- Table rows: date, property, cleaner, rooms complete, compliance score, status, actions
- Bulk approve (for quick review of multiple sessions)

## Session Detail Screen
- Header: property, cleaner, date, duration, compliance score badge
- Per-room accordion sections:
  - Before/after photo side-by-side comparison
  - Task completion list with any notes
  - Supply alerts for this room
- Guest rating (if BNB session) — stars + review text
- Issues logged during session
- Action bar: Approve ✅ | Reject ❌ (requires rejection reason) | Request Re-clean

## Compliance Score Display
- Colour-coded badge: 95-100% Gold | 85-94% Good | 70-84% Needs Improvement | <70% Below Standard
- Breakdown: tasks completed X/Y, photos submitted X/Y

## Tasks
- [ ] Sessions list with filters
- [ ] Before/after photo side-by-side component
- [ ] Task completion accordion per room
- [ ] Approve/reject actions with confirmation modal
- [ ] Rejection reason required — free text field
- [ ] Compliance score badge component

## Acceptance Criteria
- [ ] Photo comparison loads without layout shift
- [ ] Reject action requires non-empty rejection reason
- [ ] Compliance score calculated and shown correctly
- [ ] Session status updates immediately on approve/reject (optimistic UI)
