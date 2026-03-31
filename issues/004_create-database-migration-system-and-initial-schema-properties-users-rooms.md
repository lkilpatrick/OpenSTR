---
title: "Create database migration system and initial schema (properties, users, rooms)"
milestone: "M2: Database Schema & Seed Data"
labels: ["database", "backend"]
---

# Create database migration system and initial schema (properties, users, rooms)

**Milestone:** M2: Database Schema & Seed Data
**Labels:** database, backend

## Dependencies
- Depends on #2

## Overview
Set up the database migration system and create the core tables. Use `node-pg-migrate` or `db-migrate` for versioned migrations.

## Tables in This Issue
- `properties`
- `users`
- `rooms`
- `property_cleaners`

## Schema Reference
See PRD v4 §11 for full column definitions.

### properties
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| name | VARCHAR(100) | NOT NULL |
| type | VARCHAR(30) | short_term_rental | private_home |
| address | TEXT | |
| ical_url | TEXT | Encrypted at rest |
| lock_entity_id | VARCHAR(100) | |
| session_trigger_time | TIME | DEFAULT '10:00' |
| min_turnaround_hours | SMALLINT | DEFAULT 3 |
| standard_id | UUID FK | nullable |
| active | BOOLEAN | DEFAULT true |
| created_at / updated_at | TIMESTAMPTZ | |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR(255) | UNIQUE NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| role | VARCHAR(20) | guest|cleaner|admin|owner |
| password_hash | TEXT | bcrypt |
| active | BOOLEAN | DEFAULT true |
| push_token | TEXT | nullable |
| created_at / updated_at | TIMESTAMPTZ | |

### rooms
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| property_id | UUID FK | NOT NULL |
| slug | VARCHAR(50) | |
| display_name | VARCHAR(100) | |
| theme_name | VARCHAR(100) | |
| standard_room_type | VARCHAR(50) | |
| display_order | SMALLINT | |
| is_laundry_phase | BOOLEAN | DEFAULT false |
| last_deep_clean_at | TIMESTAMPTZ | |
| archived | BOOLEAN | DEFAULT false |

### property_cleaners
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| property_id | UUID FK | |
| user_id | UUID FK | |
| is_primary | BOOLEAN | DEFAULT false |
| is_active | BOOLEAN | DEFAULT true |
| assigned_at | TIMESTAMPTZ | |
| notes | TEXT | |

## Tasks
- [ ] Install and configure migration tool
- [ ] Create migration `001_create_properties`
- [ ] Create migration `002_create_users`
- [ ] Create migration `003_create_rooms`
- [ ] Create migration `004_create_property_cleaners`
- [ ] Add all indexes from PRD §11.9
- [ ] Add UNIQUE constraint on `property_cleaners(property_id, user_id)`
- [ ] Add `npm run db:migrate` and `npm run db:rollback` scripts

## Acceptance Criteria
- [ ] `npm run db:migrate` runs cleanly on a fresh database
- [ ] All tables exist with correct column types and constraints
- [ ] Rollback works cleanly (`npm run db:rollback`)
- [ ] Foreign key constraints enforced
