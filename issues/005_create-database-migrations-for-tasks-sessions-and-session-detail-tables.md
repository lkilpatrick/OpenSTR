---
title: "Create database migrations for tasks, sessions, and session detail tables"
milestone: "M2: Database Schema & Seed Data"
labels: ["database", "backend"]
---

# Create database migrations for tasks, sessions, and session detail tables

**Milestone:** M2: Database Schema & Seed Data
**Labels:** database, backend

## Dependencies
- Depends on #4

## Overview
Second batch of migrations covering the cleaning session data model.

## Tables in This Issue
- `standards`
- `standard_tasks`
- `tasks`
- `clean_sessions`
- `room_cleans`
- `task_completions`
- `photos`

## Key Columns

### tasks
- `property_id` UUID FK
- `room_id` UUID FK
- `standard_task_id` UUID FK nullable
- `label` TEXT NOT NULL
- `category` VARCHAR(50) — Cleaning|Sanitise|Laundry|Restocking|Check|Photography
- `frequency` VARCHAR(20) — every_clean|weekly|monthly|deep_clean
- `is_high_touch` BOOLEAN DEFAULT false
- `is_mandatory` BOOLEAN DEFAULT true
- `is_override` BOOLEAN DEFAULT false
- `is_applicable` BOOLEAN DEFAULT true
- `requires_supply_check` BOOLEAN DEFAULT false
- `supply_item` VARCHAR(100)
- `supply_low_threshold` SMALLINT DEFAULT 5
- `display_order` SMALLINT
- `archived` BOOLEAN DEFAULT false

### clean_sessions
- `property_id` UUID FK NOT NULL
- `triggered_by` VARCHAR(30) — ical|lock_event|manual
- `cleaner_id` UUID FK nullable
- `status` VARCHAR(30) — pending|in_progress|submitted|approved|rejected
- `session_type` VARCHAR(20) — turnover|deep_clean|scheduled
- `compliance_score` NUMERIC(5,2)
- `reservation_id` UUID FK nullable
- `rejection_reason` TEXT
- `cleaner_start_time` TIMESTAMPTZ
- `cleaner_end_time` TIMESTAMPTZ
- `submitted_at` TIMESTAMPTZ
- `reviewed_at` TIMESTAMPTZ
- `reviewed_by` UUID FK

### photos
- `room_clean_id` UUID FK
- `type` VARCHAR(10) — before|after
- `storage_path` TEXT
- `file_size_kb` INTEGER
- `taken_at` TIMESTAMPTZ
- `uploaded_at` TIMESTAMPTZ

## Tasks
- [ ] Migration `005_create_standards`
- [ ] Migration `006_create_standard_tasks`
- [ ] Migration `007_create_tasks`
- [ ] Migration `008_create_clean_sessions`
- [ ] Migration `009_create_room_cleans`
- [ ] Migration `010_create_task_completions`
- [ ] Migration `011_create_photos`
- [ ] Add all relevant indexes

## Acceptance Criteria
- [ ] All migrations run cleanly in order
- [ ] `session_type` CHECK constraint enforced
- [ ] `photos.type` CHECK constraint (before|after) enforced
- [ ] Cascading deletes configured correctly (session → room_cleans → task_completions)
