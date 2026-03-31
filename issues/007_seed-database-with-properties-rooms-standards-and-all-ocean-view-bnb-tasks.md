---
title: "Seed database with properties, rooms, standards, and all My STR Property tasks"
milestone: "M2: Database Schema & Seed Data"
labels: ["database", "seed-data"]
---

# Seed database with properties, rooms, standards, and all My STR Property tasks

**Milestone:** M2: Database Schema & Seed Data
**Labels:** database, seed-data

## Dependencies
- Depends on #5
- Depends on #6

## Overview
Populate the database with all real data from the PRD so the app is usable from day one without any manual data entry.

## Seed Data Required

### Properties
- `P01` — My STR Property (short_term_rental)
- `P02` — Owner's Residence (private_home)

### Standards
- `STD-01` — Airbnb Enhanced Clean
- `STD-02` — Home Standard

### Rooms — My STR Property
| Slug | Display Name | Theme | Order |
|------|-------------|-------|-------|
| the-tide | Laundry Phase | The Tide | 0 |
| the-deep | Kitchen & Living Room | The Deep | 1 |
| the-kelp | Bathroom | The Kelp | 2 |
| the-beach | Bedroom | The Beach | 3 |
| the-shore | Final Cleaning | The Shore | 4 |

### Tasks — All 50+ tasks from PRD v4 §11 seed data
Include for each task:
- Correct `room_id`
- `category` (Cleaning|Sanitise|Laundry|Restocking|Check)
- `frequency` (every_clean|weekly)
- `is_high_touch` (true for light switches, remotes, handles, taps)
- `requires_supply_check` and `supply_item` where applicable
- `display_order` matching the original Google Form order

### High-touch tasks (is_high_touch = true):
- Sanitise light switches (all rooms)
- Sanitise tap handles (kitchen + bathroom)
- Sanitise door handles (all rooms)
- Sanitise TV remotes / Roku remotes
- Sanitise toilet flush handle
- Sanitise microwave/appliance buttons

### Weekly tasks (frequency = weekly):
- 3rd load — blankets (one at a time) — The Tide

### Supply check tasks:
- Take out garbage → small white bags, threshold 5
- Take out recycling → small blue bags, threshold 5
- Check dish soap
- Check consumables (Coffee, Popcorn)
- Refill shampoo/conditioner/body wash
- Replace toilet paper stock
- Empty trash can liners

## Tasks
- [ ] Create `api/src/db/seeds/001_properties.ts`
- [ ] Create `api/src/db/seeds/002_standards.ts`
- [ ] Create `api/src/db/seeds/003_rooms.ts`
- [ ] Create `api/src/db/seeds/004_tasks_the_tide.ts`
- [ ] Create `api/src/db/seeds/005_tasks_the_deep.ts`
- [ ] Create `api/src/db/seeds/006_tasks_the_kelp.ts`
- [ ] Create `api/src/db/seeds/007_tasks_the_beach.ts`
- [ ] Create `api/src/db/seeds/008_tasks_the_shore.ts`
- [ ] Add `npm run db:seed` script
- [ ] Seeds are idempotent (safe to run twice)

## Acceptance Criteria
- [ ] `npm run db:seed` populates all data without errors
- [ ] All 50+ tasks present with correct metadata
- [ ] All high-touch tasks have `is_high_touch = true`
- [ ] Weekly tasks have `frequency = 'weekly'`
- [ ] Supply check tasks have correct `supply_item` and `supply_low_threshold = 5`
