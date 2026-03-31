---
title: "Admin panel: cleaner performance profiles and comparison view"
milestone: "M8: Admin Panel — Superhost & Performance"
labels: ["admin", "frontend", "performance"]
---

# Admin panel: cleaner performance profiles and comparison view

**Milestone:** M8: Admin Panel — Superhost & Performance
**Labels:** admin, frontend, performance

## Dependencies
- Depends on #13
- Depends on #14
- Depends on #26

## Overview
Per-cleaner performance dashboard. Compliance scores are owner/admin only (per decision Q10, Q12).

## Cleaner List Screen (Admin → Cleaners)
- Table: cleaner name, assigned properties, avg compliance score (all time), last session date, active status
- Click → individual performance profile

## Individual Performance Profile
- Header: cleaner name, properties assigned, total sessions
- **Compliance Score Chart**: line chart of last 12 sessions (recharts)
- **Average Clean Duration**: bar chart per property vs property average
- **Task Completion Rate**: breakdown by room
- **Photo Submission Rate**: % sessions with all photos submitted
- **Issue Flag Rate**: supply alerts + issues raised per session

## Side-by-Side Comparison
- Select 2 cleaners assigned to the same property
- Radar chart: Compliance | Speed | Photo Rate | Issue Rate | Thoroughness
- Useful for coaching conversations

## Important UX Notes
- Compliance scores NOT shown to cleaners (decisions Q10, Q12)
- Admin sees "performance data" framing, not "score cards" — coaching tool
- No public leaderboard

## Tasks
- [ ] Cleaner list screen
- [ ] Individual performance profile with charts (recharts)
- [ ] Comparison view with radar chart
- [ ] Performance metrics API: `GET /admin/cleaners/:id/performance`
- [ ] Data aggregated server-side — not calculated in frontend

## Acceptance Criteria
- [ ] Performance data only visible to owner/admin
- [ ] Compliance score chart shows last 12 sessions correctly
- [ ] Comparison radar chart works for 2 cleaners on same property
- [ ] Empty state handled gracefully (new cleaner with no sessions)
