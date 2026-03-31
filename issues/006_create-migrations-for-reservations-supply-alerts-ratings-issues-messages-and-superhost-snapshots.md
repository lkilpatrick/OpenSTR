---
title: "Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots"
milestone: "M2: Database Schema & Seed Data"
labels: ["database", "backend"]
---

# Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots

**Milestone:** M2: Database Schema & Seed Data
**Labels:** database, backend

## Dependencies
- Depends on #5

## Overview
Final batch of migrations covering supporting data tables.

## Tables in This Issue
- `reservations`
- `supply_alerts`
- `guest_ratings`
- `issues`
- `guest_messages`
- `superhost_snapshots`

### reservations
- `property_id` UUID FK NOT NULL
- `source` VARCHAR(30) — airbnb_ical|manual
- `external_uid` VARCHAR(200) UNIQUE — iCal VEVENT UID for dedup
- `checkin_date` DATE NOT NULL
- `checkout_date` DATE NOT NULL
- `summary` VARCHAR(200)
- `turnaround_hours` SMALLINT — computed on sync
- `synced_at` TIMESTAMPTZ

### guest_ratings
- `session_id` UUID FK UNIQUE
- `rating` SMALLINT CHECK (1-5)
- `review_text` TEXT

### superhost_snapshots
- `snapshot_date` DATE
- `overall_rating` NUMERIC(3,2)
- `response_rate` NUMERIC(5,2)
- `cancellation_rate` NUMERIC(5,2)
- `completed_stays` SMALLINT
- `qualifies` BOOLEAN
- `next_assessment_date` DATE

## Tasks
- [ ] Migration `012_create_reservations`
- [ ] Migration `013_create_supply_alerts`
- [ ] Migration `014_create_guest_ratings`
- [ ] Migration `015_create_issues`
- [ ] Migration `016_create_guest_messages`
- [ ] Migration `017_create_superhost_snapshots`
- [ ] Index: `idx_reservations_property_checkout`
- [ ] Index: `idx_reservations_uid`

## Acceptance Criteria
- [ ] UNIQUE constraint on `guest_ratings.session_id` (one rating per session)
- [ ] UNIQUE constraint on `reservations.external_uid`
- [ ] All migrations reversible
