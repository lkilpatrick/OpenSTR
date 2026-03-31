---
title: "Admin panel: dashboard with property health cards and upcoming cleans"
milestone: "M7: Admin Panel — Core"
labels: ["admin", "frontend"]
---

# Admin panel: dashboard with property health cards and upcoming cleans

**Milestone:** M7: Admin Panel — Core
**Labels:** admin, frontend

## Dependencies
- Depends on #21
- Depends on #11
- Depends on #13

## Overview
The main dashboard — first screen after login. Gives the owner an instant health overview of all properties.

## Widgets

### Property Health Cards (one per property)
- Property name + type badge
- Last clean: date + compliance score + cleaner name
- Next scheduled clean: date + turnaround window
- Open issues count (red badge if > 0)
- Low supply alerts count (amber badge if > 0)

### Upcoming Cleans (next 14 days)
- Timeline/list view
- Colour-coded by property
- Shows: checkout date, turnaround, session status, assigned cleaner

### Open Issues & Supply Alerts
- Consolidated list across all properties
- Quick "Mark Resolved" action inline

### Active Session Card (if a session is in_progress)
- Live progress: X of Y rooms complete
- Cleaner name + started time
- Link to full session detail

## Tasks
- [ ] Property health card component
- [ ] Upcoming cleans list component
- [ ] Issues and supply alerts widgets
- [ ] Active session card with live polling (every 30s)
- [ ] All widgets respect property switcher selection

## Acceptance Criteria
- [ ] Dashboard loads within 1 second
- [ ] Active session card updates without full page refresh
- [ ] Property health cards show correct last clean data
- [ ] Upcoming cleans shows next 14 days correctly
