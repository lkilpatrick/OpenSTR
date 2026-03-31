---
title: "Mobile app: cleaning standards reference screen"
milestone: "M6: Mobile App — Schedule View"
labels: ["mobile", "standards"]
---

# Mobile app: cleaning standards reference screen

**Milestone:** M6: Mobile App — Schedule View
**Labels:** mobile, standards

## Dependencies
- Depends on #10
- Depends on #19

## Overview
In-app reference guide so cleaners can look up the cleaning standard for any property at any time — not just during a session.

## Screens

### Standards Reference (accessible from Profile tab)
- Property selector
- Room list for selected property
- Tap room → task list grouped by category
- High-touch tasks highlighted with 🖐
- "What not to miss" section pinned at top — high-touch tasks only

### Task Detail
- Task label
- Description/guidance notes (from `standard_tasks.description`)
- Category badge
- Frequency badge (Every Clean / Weekly / Deep Clean)

## Tasks
- [ ] Standards reference screen in Profile tab
- [ ] Room list with category grouping
- [ ] Task detail view
- [ ] High-touch section pinned at top
- [ ] Offline cache of standards (downloaded on login, refreshed on sync)

## Acceptance Criteria
- [ ] Standards reference accessible without an active session
- [ ] High-touch tasks visually distinct and pinned to top
- [ ] Works offline using cached data
- [ ] Cleaner can only view standards for their assigned properties
