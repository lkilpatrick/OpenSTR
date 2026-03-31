---
title: "Mobile app: cleaner schedule screen (upcoming cleans from iCal)"
milestone: "M6: Mobile App — Schedule View"
labels: ["mobile", "schedule"]
---

# Mobile app: cleaner schedule screen (upcoming cleans from iCal)

**Milestone:** M6: Mobile App — Schedule View
**Labels:** mobile, schedule

## Dependencies
- Depends on #11
- Depends on #16

## Overview
The Schedule tab shows the cleaner all upcoming cleans across their assigned properties, driven by the iCal-sourced reservations.

## Screen Layout

### Schedule Tab
- Property filter tabs: All | [Property Name] | [Property Name]
- **Today section**: Today's session (if any) with large CTA card → "Start Clean"
- **This week**: List of upcoming cleans (next 7 days) — each card shows:
  - Property name + colour dot
  - Check-out date and day
  - Turnaround window: "4 hours until next check-in"
  - Session status badge
- **Next 30 days**: Compact list of future checkout dates
- Pull-to-refresh triggers manual iCal sync

### Session Card
- Property icon (🌊 for Ocean View, 🏠 for Residence)
- Date + day of week
- Turnaround time (green if >4hr, amber if 2–4hr, red if <2hr)
- Deep clean warning 🔴 if property due for deep clean

### Empty State
"No upcoming cleans — you're all caught up! 🌊"

## Tasks
- [ ] Schedule tab screen with Today / This Week / Next 30 sections
- [ ] Property filter tabs
- [ ] Session card component
- [ ] Turnaround time colour coding
- [ ] Deep clean warning logic
- [ ] Pull-to-refresh with manual iCal sync
- [ ] Tapping "Start Clean" on today's session navigates to Active Session tab

## Acceptance Criteria
- [ ] Schedule shows only cleans for properties the cleaner is assigned to
- [ ] Turnaround time calculated correctly from reservation data
- [ ] Deep clean warning appears when `last_deep_clean_at` > 90 days
- [ ] Pull-to-refresh triggers sync and updates list within 10 seconds
- [ ] Empty state shown correctly when no upcoming cleans
