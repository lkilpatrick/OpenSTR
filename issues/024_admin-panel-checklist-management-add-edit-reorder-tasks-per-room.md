---
title: "Admin panel: checklist management — add, edit, reorder tasks per room"
milestone: "M7: Admin Panel — Core"
labels: ["admin", "frontend", "checklists"]
---

# Admin panel: checklist management — add, edit, reorder tasks per room

**Milestone:** M7: Admin Panel — Core
**Labels:** admin, frontend, checklists

## Dependencies
- Depends on #9
- Depends on #22

## Overview
Allows the admin to manage the cleaning checklists for each property room.

## Screen Layout
- Property → Room selector
- Task list with drag-and-drop reordering
- Each task row shows: label, category badge, frequency, high-touch icon, supply check icon, archive button
- "+ Add Task" button at bottom
- "Save Order" button appears when order is changed

## Task Edit Modal
- Label (text)
- Description / guidance notes (textarea)
- Category dropdown: Cleaning | Sanitise | Laundry | Restocking | Check | Photography
- Frequency: Every Clean | Weekly | Monthly | Deep Clean
- Is High Touch toggle
- Is Mandatory toggle
- Supply Check toggle → reveals: supply item name + threshold
- Save / Cancel

## Standard Propagation Banner
When a standard_task is updated and auto-pushed (per decision Q11):
- Yellow banner at top: "Standard updated — [N] tasks were auto-applied to this property. Review changes."
- Each auto-applied change is highlighted in the list until reviewed

## Tasks
- [ ] Room/property selector
- [ ] Draggable task list (`@dnd-kit/sortable`)
- [ ] Task edit modal with all fields
- [ ] Archive task with confirmation
- [ ] Standard propagation banner + per-task review
- [ ] Unsaved changes warning before navigation

## Acceptance Criteria
- [ ] Drag-and-drop reorder saves correctly
- [ ] Archived tasks hidden from list but visible in "Show archived" toggle
- [ ] Standard propagation banner appears after auto-push
- [ ] Task changes take effect on next clean session (not retroactively)
