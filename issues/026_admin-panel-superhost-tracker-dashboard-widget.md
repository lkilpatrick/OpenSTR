---
title: "Admin panel: Superhost tracker dashboard widget"
milestone: "M8: Admin Panel — Superhost & Performance"
labels: ["admin", "frontend", "superhost"]
---

# Admin panel: Superhost tracker dashboard widget

**Milestone:** M8: Admin Panel — Superhost & Performance
**Labels:** admin, frontend, superhost

## Dependencies
- Depends on #6
- Depends on #22

## Overview
Real-time Superhost KPI tracking dashboard for the My STR Property property.

## Widget Layout (4 KPI gauges)

### 1. Overall Rating
- Gauge: 0–5 scale with 4.8 target line
- Current value from rolling 12-month average of `guest_ratings.rating`
- Colour: green ≥4.8 | amber 4.5–4.7 | red <4.5

### 2. Response Rate
- Gauge: 0–100% with 90% target line
- Calculated from `guest_messages` response times
- Colour: green ≥90% | amber 80–89% | red <80%

### 3. Cancellation Rate
- Gauge: 0–5% (most useful range) with <1% target
- Placeholder in MVP (no booking management) — show "Track manually"
- Colour: green <1% | red ≥1%

### 4. Completed Stays
- Progress bar: 0 to 10 stays (or 100 nights)
- Count from approved `clean_sessions` in 12-month window
- Colour: green ≥10 | amber 7–9 | red <7

### Status Summary
- "Will you qualify?" prediction badge
- Days until next Airbnb quarterly assessment (Jan 1 / Apr 1 / Jul 1 / Oct 1)

## Backend
- `POST /admin/superhost/snapshot` — calculate and store snapshot
- `GET /admin/superhost/current` — latest snapshot + live calculations
- Snapshot auto-calculated weekly via cron

## Tasks
- [ ] Superhost snapshot API endpoint
- [ ] Weekly snapshot cron job
- [ ] Gauge component (reusable)
- [ ] 4 KPI gauges wired to live data
- [ ] "Will you qualify?" prediction logic
- [ ] Next assessment date calculation

## Acceptance Criteria
- [ ] Overall rating gauge reflects last 12 months of `guest_ratings`
- [ ] Next assessment date always shows the next upcoming quarterly date
- [ ] Snapshot stored weekly and accessible in history
- [ ] Widget only visible for short_term_rental properties
