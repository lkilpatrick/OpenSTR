# Database Schema

OpenSTR uses **PostgreSQL 16** with **node-pg-migrate** for schema management. The database contains 27 migrations covering all domain tables.

## Entity Relationship Overview

```
properties ──┬── rooms ────── tasks
              ├── reservations
              ├── clean_sessions ──┬── room_cleans ──┬── task_completions
              │                    │                  └── photos
              │                    └── cleaner_notes
              ├── property_cleaners ── users
              ├── issues
              ├── guest_messages
              ├── supply_alerts
              └── superhost_snapshots

standards ──── standard_tasks

users ──── session (auth)
      ──── account (auth)
      ──── verification (auth)
```

## Core Tables

### `properties`

Represents a short-term rental property or residence.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Property name |
| `type` | ENUM | `short_term_rental` or `residence` |
| `address` | TEXT | Physical address |
| `ical_url` | TEXT | Airbnb iCal calendar URL |
| `lock_entity_id` | VARCHAR | Home Assistant lock entity ID |
| `session_trigger_time` | TIME | Default time to trigger cleaning sessions |
| `min_turnaround_hours` | INTEGER | Minimum hours between checkout and next checkin |
| `standard_id` | UUID | FK to `standards` — default cleaning standard |
| `slug` | VARCHAR | URL-safe identifier for guest portal |
| `welcome_message` | TEXT | Guest welcome message |
| `house_rules` | TEXT | Property rules for guests |
| `checkin_instructions` | TEXT | Check-in directions |
| `checkout_instructions` | TEXT | Check-out directions |
| `wifi_password` | VARCHAR | WiFi password displayed to guests |
| `active` | BOOLEAN | Whether property is active |

### `rooms`

Rooms within a property (e.g., Master Bedroom, Kitchen).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `slug` | VARCHAR | URL-safe identifier |
| `display_name` | VARCHAR | Displayed room name |
| `theme_name` | VARCHAR | Theme/grouping name |
| `standard_room_type` | VARCHAR | Maps to standard task templates |
| `display_order` | INTEGER | Sort order |
| `is_laundry_phase` | BOOLEAN | Whether this room is part of laundry phase |
| `archived` | BOOLEAN | Soft-delete flag |

### `tasks`

Individual cleaning tasks assigned to a room.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `room_id` | UUID | FK to `rooms` |
| `standard_task_id` | UUID | FK to `standard_tasks` (if from template) |
| `label` | VARCHAR | Task description text |
| `category` | VARCHAR | Category grouping |
| `frequency` | VARCHAR | How often task should be done |
| `is_high_touch` | BOOLEAN | High-touch surface flag |
| `is_mandatory` | BOOLEAN | Must be completed every session |
| `is_override` | BOOLEAN | Property-level override of standard |
| `is_applicable` | BOOLEAN | Whether task applies to this property |
| `requires_supply_check` | BOOLEAN | Triggers supply level check |
| `supply_item` | VARCHAR | Name of the supply to check |
| `supply_low_threshold` | INTEGER | Threshold for low-supply alert |
| `display_order` | INTEGER | Sort order within room |
| `archived` | BOOLEAN | Soft-delete flag |

### `users`

All platform users across all roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR | Unique email address |
| `name` | VARCHAR | Display name |
| `role` | ENUM | `owner`, `admin`, `cleaner`, or `guest` |
| `active` | BOOLEAN | Whether account is active |
| `push_token` | VARCHAR | Expo push notification token |
| `cleaning_rate` | DECIMAL | Cleaner's hourly/per-session rate |
| `email_verified` | BOOLEAN | Whether email has been verified |
| `image` | TEXT | Profile image URL |

## Cleaning Session Tables

### `clean_sessions`

The main cleaning workflow record — one per cleaning job.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `cleaner_id` | UUID | FK to `users` (assigned cleaner) |
| `status` | ENUM | `pending`, `accepted`, `in_progress`, `submitted`, `approved`, `rejected` |
| `session_type` | ENUM | `turnover`, `deep_clean`, `scheduled` |
| `triggered_by` | ENUM | `ical`, `lock_event`, `manual` |
| `compliance_score` | DECIMAL | Calculated compliance percentage |
| `reservation_id` | UUID | FK to `reservations` |
| `rejection_reason` | TEXT | Admin's reason for rejection |
| `cleaner_start_time` | TIMESTAMP | When cleaner started |
| `cleaner_end_time` | TIMESTAMP | When cleaner finished |
| `submitted_at` | TIMESTAMP | When session was submitted |
| `reviewed_at` | TIMESTAMP | When session was reviewed |
| `reviewed_by` | UUID | FK to `users` (reviewer) |
| `photo_required` | BOOLEAN | Whether photos are mandatory |
| `scheduled_date` | DATE | Scheduled cleaning date |

### `room_cleans`

Per-room record within a cleaning session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK to `clean_sessions` |
| `room_id` | UUID | FK to `rooms` |
| `status` | VARCHAR | Room cleaning status |
| `started_at` | TIMESTAMP | When room cleaning started |
| `completed_at` | TIMESTAMP | When room cleaning completed |

### `task_completions`

Individual task completion records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `room_clean_id` | UUID | FK to `room_cleans` |
| `task_id` | UUID | FK to `tasks` |
| `completed` | BOOLEAN | Whether task was completed |
| `quantity_value` | INTEGER | Quantity for supply-check tasks |
| `supply_replenished` | BOOLEAN | Whether supply was replenished |
| `completed_at` | TIMESTAMP | Completion timestamp |
| `notes` | TEXT | Optional notes |

### `photos`

Before/after/issue photos uploaded during cleaning.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `room_clean_id` | UUID | FK to `room_cleans` |
| `type` | ENUM | `before`, `after`, `issue` |
| `storage_path` | VARCHAR | Filesystem path to photo file |
| `file_size_kb` | INTEGER | File size in kilobytes |
| `taken_at` | TIMESTAMP | When the photo was taken |
| `uploaded_at` | TIMESTAMP | When the photo was uploaded |

## Reservation Tables

### `reservations`

Bookings imported from Airbnb via iCal sync.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `source` | VARCHAR | Booking platform (e.g., "airbnb") |
| `external_uid` | VARCHAR | iCal event UID |
| `checkin_date` | DATE | Guest check-in date |
| `checkout_date` | DATE | Guest check-out date |
| `summary` | TEXT | iCal event summary |
| `guest_name` | VARCHAR | Guest name |
| `phone` | VARCHAR | Guest phone (partially masked) |
| `num_guests` | INTEGER | Number of guests |
| `description` | TEXT | iCal event description |
| `location` | TEXT | iCal event location |
| `is_blocked` | BOOLEAN | Whether this is a blocked date (not a booking) |
| `synced_at` | TIMESTAMP | Last sync timestamp |

## Standards System

### `standards`

Reusable cleaning standard templates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR | Standard name |
| `description` | TEXT | Standard description |

### `standard_tasks`

Tasks within a cleaning standard template.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `standard_id` | UUID | FK to `standards` |
| `room_type` | VARCHAR | Room type this task applies to |
| `label` | VARCHAR | Task description |
| `category` | VARCHAR | Task category |
| `frequency` | VARCHAR | Frequency (every clean, weekly, etc.) |
| `is_high_touch` | BOOLEAN | High-touch surface flag |
| `is_mandatory` | BOOLEAN | Required every clean |
| `display_order` | INTEGER | Sort order |
| `archived` | BOOLEAN | Soft-delete flag |

## Guest & Maintenance Tables

### `guest_ratings`

Guest-submitted cleanliness ratings after a stay.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK to `clean_sessions` |
| `rating` | INTEGER | 1–5 star rating |
| `review_text` | TEXT | Optional written review |

### `issues`

Property issues reported by staff or guests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `session_id` | UUID | FK to `clean_sessions` (optional) |
| `reported_by` | UUID | FK to `users` (optional) |
| `room_id` | UUID | FK to `rooms` (optional) |
| `title` | VARCHAR | Issue title |
| `description` | TEXT | Issue detail |
| `severity` | ENUM | `low`, `medium`, `high`, `critical` |
| `status` | ENUM | `open`, `in_progress`, `resolved`, `closed` |
| `reporter_type` | ENUM | `user` or `guest` |
| `reporter_name` | VARCHAR | Name when reported by guest |
| `photo_path` | VARCHAR | Optional issue photo |
| `resolved_at` | TIMESTAMP | Resolution timestamp |

### `guest_messages`

Messages from guests via the property portal.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `reservation_id` | UUID | FK to `reservations` (optional) |
| `sender_name` | VARCHAR | Guest name |
| `sender_email` | VARCHAR | Guest email |
| `subject` | VARCHAR | Message subject |
| `message` | TEXT | Message body |
| `source` | VARCHAR | Message source |
| `read` | BOOLEAN | Read/unread status |
| `received_at` | TIMESTAMP | When message was received |

### `supply_alerts`

Low-supply alerts triggered by cleaners during task completion.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `task_id` | UUID | FK to `tasks` |
| `item_name` | VARCHAR | Supply item name |
| `quantity_remaining` | INTEGER | Remaining quantity |
| `resolved` | BOOLEAN | Whether alert has been resolved |
| `resolved_at` | TIMESTAMP | Resolution timestamp |

## Admin & Analytics Tables

### `property_cleaners`

Join table for assigning cleaners to properties.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `user_id` | UUID | FK to `users` |
| `is_primary` | BOOLEAN | Primary cleaner for this property |
| `is_active` | BOOLEAN | Whether assignment is active |
| `assigned_at` | TIMESTAMP | Assignment date |
| `notes` | TEXT | Admin notes about this assignment |
| `priority` | INTEGER | Assignment priority (for auto-assignment) |

### `superhost_snapshots`

Historical Airbnb Superhost metric snapshots.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `property_id` | UUID | FK to `properties` |
| `snapshot_date` | DATE | Date of snapshot |
| `overall_rating` | DECIMAL | Overall property rating |
| `cleanliness_rating` | DECIMAL | Cleanliness sub-rating |
| `checkin_rating` | DECIMAL | Check-in sub-rating |
| `communication_rating` | DECIMAL | Communication sub-rating |
| `response_rate` | DECIMAL | Host response rate percentage |
| `acceptance_rate` | DECIMAL | Booking acceptance rate |
| `cancellation_count` | INTEGER | Number of cancellations |
| `is_superhost` | BOOLEAN | Current Superhost status |

### `cleaner_notes`

Notes added to cleaning sessions by staff.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK to `clean_sessions` |
| `user_id` | UUID | FK to `users` |
| `notes` | TEXT | Note content |
| `created_at` | TIMESTAMP | Creation timestamp |

## Authentication Tables (Better-Auth)

### `session`

Active auth sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to `users` |
| `token` | VARCHAR | Session token |
| `expires_at` | TIMESTAMP | Session expiry |
| `ip_address` | VARCHAR | Client IP address |
| `user_agent` | TEXT | Client user agent |

### `account`

Authentication provider credentials.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to `users` |
| `account_id` | VARCHAR | Provider account ID |
| `provider_id` | VARCHAR | Auth provider identifier |
| `password` | VARCHAR | Hashed password (bcrypt) |
| `access_token` | TEXT | Provider access token |

### `verification`

Email and phone verification tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `identifier` | VARCHAR | Email or phone being verified |
| `value` | VARCHAR | Verification token |
| `expires_at` | TIMESTAMP | Token expiry |

## Running Migrations

```bash
cd api

# Apply all pending migrations
npx node-pg-migrate up --database-url-var DATABASE_URL

# Create a new migration
npx node-pg-migrate create my-migration-name --database-url-var DATABASE_URL

# Roll back the last migration
npx node-pg-migrate down --database-url-var DATABASE_URL
```
