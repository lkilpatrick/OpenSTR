---
title: "Mobile app: active session screen — room list and checklist"
milestone: "M5: Mobile App — Cleaner Core"
labels: ["mobile", "sessions"]
---

# Mobile app: active session screen — room list and checklist

**Milestone:** M5: Mobile App — Cleaner Core
**Labels:** mobile, sessions

## Dependencies
- Depends on #13
- Depends on #14
- Depends on #16

## Overview
The core cleaning workflow screen. Cleaner sees their active session, selects rooms, completes checklists.

## Screens & Flow

### Session Overview Screen
- Property name + address at top
- List of rooms with completion status (pending / in_progress / complete)
- Progress bar: X of Y rooms complete
- Submit button (only enabled when all rooms complete)

### Room Screen
- Room name and theme name
- Before photo status — if not taken: full-width "Take Before Photo" CTA (blocks checklist)
- Checklist — tasks in display_order
  - Regular tasks: checkbox + label
  - High-touch tasks (🖐): checkbox + label + teal highlight
  - Supply check tasks: checkbox + inline "Note shortage" button
  - Weekly tasks: shown with "Weekly" badge
- "Other / Notes" free text field at bottom
- After photo CTA (only appears when all tasks checked)
- "Complete Room" button

### Photo Capture
- Use `expo-image-picker` with camera
- Show before/after photo thumbnails once taken
- Compress to <2MB before upload (`expo-image-manipulator`)

### Supply Alert Modal
- Triggered by "Note shortage" button
- Fields: item name (pre-filled), quantity remaining, notes
- Submits to supply-alerts API

## Tasks
- [ ] Session overview screen with room list
- [ ] Room screen with full checklist logic
- [ ] High-touch task highlighting (🖐 icon + teal bg)
- [ ] Photo capture + compression + upload
- [ ] Before-photo gate (checklist locked until before photo taken)
- [ ] After-photo gate (complete button locked until after photo taken)
- [ ] Supply alert modal
- [ ] Offline support: cache active session to AsyncStorage, sync on reconnect

## Acceptance Criteria
- [ ] Checklist inaccessible until before photo submitted
- [ ] Room cannot be marked complete without after photo (BNB); optional for Residence
- [ ] High-touch tasks visually distinct from regular tasks
- [ ] Supply alert saved and synced when back online
- [ ] Progress persists if app is closed mid-session
