---
title: "Admin panel: property management — add, configure, and manage multiple properties"
milestone: "M11: Multi-Property & Residence"
labels: ["admin", "frontend", "multi-property"]
---

# Admin panel: property management — add, configure, and manage multiple properties

**Milestone:** M11: Multi-Property & Residence
**Labels:** admin, frontend, multi-property

## Dependencies
- Depends on #22
- Depends on #29

## Overview
UI for managing multiple properties — adding new properties, configuring iCal/lock integration per property, and managing rooms.

## Screens

### Properties List (Admin → Settings → Properties)
- Cards for each property: name, type, active sessions, last sync time
- "+ Add Property" button

### Property Setup Wizard (for new properties)
Step 1: Basic info — name, type (STR / private home), address
Step 2: Rooms — add rooms with display name, theme name, display order
Step 3: Standard — assign a cleaning standard (STD-01 or STD-02)
Step 4: Integrations — iCal URL (STR only), lock entity ID, session trigger time
Step 5: Cleaners — assign from cleaner pool, set primary

### Property Settings Screen (existing property)
- All above fields editable
- "Sync iCal now" button
- Last sync status + any errors
- "Deep Clean Reset" button — resets `last_deep_clean_at` for whole property

## Tasks
- [ ] Properties list screen
- [ ] Property setup wizard (5 steps)
- [ ] Property settings screen
- [ ] iCal URL input with "Test Connection" button
- [ ] Deep clean reset confirmation modal
- [ ] Cleaner assignment UI within property settings

## Acceptance Criteria
- [ ] New property created via wizard is immediately usable
- [ ] "Test iCal Connection" validates URL and shows next 3 reservations as preview
- [ ] Deep clean reset requires confirmation and logs the reset action
- [ ] Adding a second STR property with its own iCal URL works independently
