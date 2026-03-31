---
title: "Mobile app: guest rating screen and session submission"
milestone: "M5: Mobile App — Cleaner Core"
labels: ["mobile", "sessions"]
---

# Mobile app: guest rating screen and session submission

**Milestone:** M5: Mobile App — Cleaner Core
**Labels:** mobile, sessions

## Dependencies
- Depends on #17

## Overview
End-of-session screens: guest rating (BNB only) and session submission.

## Screens

### Guest Rating Screen (short_term_rental properties only)
- 5-star tap rating
- Labels: 1 = "Never have them back", 5 = "Invite back any time"
- Colour indicator:
  - 5★ = green (supports Superhost 4.8 target)
  - 4★ = amber
  - 1–3★ = red
- Free-text field: "How did these guests do?"
- "Log Issue" quick-button → opens issue modal

### Issue Modal
- Room selector (or "General")
- Description text field
- Severity: Low | Medium | High
- Optional photo

### Session Summary Screen
- All rooms listed as complete ✅
- Guest rating shown (if applicable)
- Any issues or supply alerts logged
- "Submit Clean" button

## Tasks
- [ ] Guest rating screen with star tap UI
- [ ] Colour-coded feedback indicator
- [ ] Issue logging modal (accessible from rating screen and room screen)
- [ ] Session summary screen
- [ ] Submit session API call → status transitions to 'submitted'
- [ ] Post-submit confirmation screen: "Clean submitted! Great work."
- [ ] Residence sessions skip guest rating screen entirely

## Acceptance Criteria
- [ ] Guest rating screen only shown for short_term_rental property sessions
- [ ] Cannot submit without guest rating (if BNB) — rating is required
- [ ] Issue modal saves correctly with optional photo
- [ ] Post-submission, session no longer appears as "active" in the app
