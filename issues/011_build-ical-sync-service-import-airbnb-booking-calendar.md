---
title: "Build iCal sync service — import Airbnb booking calendar"
milestone: "M4: Session Engine"
labels: ["backend", "ical", "integrations"]
---

# Build iCal sync service — import Airbnb booking calendar

**Milestone:** M4: Session Engine
**Labels:** backend, ical, integrations

## Dependencies
- Depends on #6
- Depends on #9

## Overview
The iCal sync service reads the Airbnb calendar export URL for each property and stores reservations. This drives the cleaner schedule view and auto-creates sessions.

## Behaviour (per decisions Q1, Q2)
- iCal auto-creates AND activates sessions (no lock needed)
- Sessions auto-trigger at 10:00am on checkout day
- Both are configurable per-property

## Implementation

### Sync Service (`api/src/services/icalSync.ts`)
- Install: `node-ical`
- Fetch iCal URL for each active `short_term_rental` property
- Parse VEVENT blocks: extract `DTSTART`, `DTEND`, `SUMMARY`, `UID`
- Upsert into `reservations` table using `external_uid` for dedup
- Compute `turnaround_hours` between checkout and next checkin
- Log `ical_last_synced_at` on the property record
- Handle parse errors gracefully — retain last valid data, surface error in DB

### Cron Schedule
- Auto-sync every 3 hours: `0 */3 * * *`
- Manual trigger: `POST /admin/properties/:id/sync-ical` (admin/owner only)

### Session Auto-Creation (`api/src/services/sessionScheduler.ts`)
- Runs daily at 09:50am
- Finds all reservations with `checkout_date = today` and no existing `clean_session`
- Creates a `clean_session` with `triggered_by = 'ical'`, `status = 'in_progress'`
- Assigns primary cleaner (if set); falls back to backup cleaner
- Sends push notification to assigned cleaner

## Tasks
- [ ] Install `node-ical`, `node-cron`
- [ ] Create `icalSync.ts` service
- [ ] Create `sessionScheduler.ts` cron job
- [ ] `POST /admin/properties/:id/sync-ical` manual trigger endpoint
- [ ] `GET /admin/properties/:id/reservations` — list synced reservations
- [ ] Store iCal URL encrypted in DB (`pgcrypto` or app-level AES)
- [ ] Error state stored on property: `ical_last_error`, `ical_last_error_at`
- [ ] Unit tests for iCal parser with mock .ics fixtures

## Acceptance Criteria
- [ ] Syncing a real Airbnb iCal URL populates `reservations` table correctly
- [ ] Re-syncing does not create duplicate reservations (idempotent)
- [ ] A session is auto-created at 10:00am on checkout day
- [ ] Primary cleaner is assigned and notified
- [ ] iCal parse error is stored and visible in admin panel — does not crash service
