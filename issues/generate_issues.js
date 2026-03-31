const fs = require('fs');
const path = require('path');

const issues = [

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 1 — REPO & INFRASTRUCTURE
  // ══════════════════════════════════════════════════════════════
  {
    id: 1,
    milestone: "M1: Repo & Infrastructure",
    title: "Initialise monorepo structure with Node.js, React, and React Native",
    labels: ["infrastructure", "setup"],
    deps: [],
    body: `## Overview
Set up the GitHub monorepo with the correct folder structure for all three apps. This is the foundation every other issue depends on.

## Folder Structure
\`\`\`
/
├── api/          # Node.js + Express backend
├── admin/        # React + Vite admin panel
├── mobile/       # React Native (Expo) mobile app
├── shared/       # Shared TypeScript types and utilities
├── docker/       # Docker config files
├── .github/      # GitHub Actions workflows
├── docker-compose.yml
└── README.md
\`\`\`

## Tasks
- [ ] Initialise repo with the above folder structure
- [ ] Add root \`package.json\` with workspaces
- [ ] Add \`.gitignore\` covering Node, Expo, and environment files
- [ ] Add root \`README.md\` with project overview and setup instructions
- [ ] Initialise \`api/\` with Express + TypeScript (\`tsconfig.json\`, \`package.json\`)
- [ ] Initialise \`admin/\` with Vite + React + TypeScript
- [ ] Initialise \`mobile/\` with Expo (React Native + TypeScript)
- [ ] Add \`shared/types/\` with initial TypeScript interfaces (Property, User, Room, Task)
- [ ] Confirm all three apps start without errors (\`npm run dev\` in each)

## Acceptance Criteria
- [ ] \`git clone\` + \`npm install\` from root works cleanly
- [ ] All three apps start locally without errors
- [ ] \`.env.example\` files present in \`api/\`, \`admin/\`, \`mobile/\`
- [ ] README documents the local setup process`
  },

  {
    id: 2,
    milestone: "M1: Repo & Infrastructure",
    title: "Set up Docker Compose for local development (API + PostgreSQL + Nginx)",
    labels: ["infrastructure", "docker"],
    deps: [1],
    body: `## Overview
Create the Docker Compose configuration that runs the full stack locally on the Linux server. This should be a single \`docker-compose up\` to get everything running.

## Services Required
| Service | Image | Port |
|---------|-------|------|
| api | Node.js (custom Dockerfile) | 3000 |
| postgres | postgres:16-alpine | 5432 |
| nginx | nginx:alpine | 80 / 443 |
| adminer | adminer (dev only) | 8080 |

## Tasks
- [ ] Create \`docker/api/Dockerfile\` (Node 20 Alpine, non-root user)
- [ ] Create \`docker-compose.yml\` with all four services
- [ ] Create \`docker-compose.prod.yml\` override for production (no adminer, restart policies)
- [ ] Add named volumes for postgres data and photo storage (\`/photos\`)
- [ ] Add \`docker/nginx/nginx.conf\` with reverse proxy to API and admin panel
- [ ] Add health checks for postgres and api services
- [ ] Add \`.env.example\` with all required variables:
  - \`POSTGRES_USER\`, \`POSTGRES_PASSWORD\`, \`POSTGRES_DB\`
  - \`JWT_SECRET\`, \`JWT_REFRESH_SECRET\`
  - \`PHOTO_STORAGE_PATH\`
  - \`PORT\`

## Acceptance Criteria
- [ ] \`docker-compose up\` starts all services cleanly
- [ ] API health check endpoint \`GET /health\` returns 200
- [ ] Postgres is reachable from the API container
- [ ] Photo volume persists between container restarts
- [ ] \`docker-compose down -v\` cleanly removes all containers and volumes`
  },

  {
    id: 3,
    milestone: "M1: Repo & Infrastructure",
    title: "Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server)",
    labels: ["infrastructure", "ci-cd"],
    deps: [1, 2],
    body: `## Overview
Automate testing and deployment. Push to \`main\` branch triggers a deploy to the local Linux server via SSH.

## Workflows Required

### 1. \`ci.yml\` — runs on every PR
- Lint (ESLint + Prettier) all packages
- TypeScript type-check all packages
- Run unit tests (Jest)

### 2. \`deploy.yml\` — runs on push to \`main\`
- SSH into Linux server
- \`git pull\`
- \`docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build\`
- Run pending DB migrations
- Notify on success/failure

## Tasks
- [ ] Add \`.github/workflows/ci.yml\`
- [ ] Add \`.github/workflows/deploy.yml\`
- [ ] Add ESLint + Prettier config to root
- [ ] Set up GitHub Secrets: \`SERVER_HOST\`, \`SERVER_USER\`, \`SERVER_SSH_KEY\`, \`SERVER_PATH\`
- [ ] Add Jest config to \`api/\` package
- [ ] Add a smoke test: \`GET /health\` returns 200 after deploy

## Acceptance Criteria
- [ ] PR checks pass on a clean branch
- [ ] Push to \`main\` triggers deploy and completes without error
- [ ] Failed tests block the deploy
- [ ] Deployment is idempotent (running twice has no side effects)`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 2 — DATABASE SCHEMA & SEED DATA
  // ══════════════════════════════════════════════════════════════
  {
    id: 4,
    milestone: "M2: Database Schema & Seed Data",
    title: "Create database migration system and initial schema (properties, users, rooms)",
    labels: ["database", "backend"],
    deps: [2],
    body: `## Overview
Set up the database migration system and create the core tables. Use \`node-pg-migrate\` or \`db-migrate\` for versioned migrations.

## Tables in This Issue
- \`properties\`
- \`users\`
- \`rooms\`
- \`property_cleaners\`

## Schema Reference
See PRD v4 §11 for full column definitions.

### properties
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | gen_random_uuid() |
| name | VARCHAR(100) | NOT NULL |
| type | VARCHAR(30) | short_term_rental \| private_home |
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
| role | VARCHAR(20) | guest\|cleaner\|admin\|owner |
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
- [ ] Create migration \`001_create_properties\`
- [ ] Create migration \`002_create_users\`
- [ ] Create migration \`003_create_rooms\`
- [ ] Create migration \`004_create_property_cleaners\`
- [ ] Add all indexes from PRD §11.9
- [ ] Add UNIQUE constraint on \`property_cleaners(property_id, user_id)\`
- [ ] Add \`npm run db:migrate\` and \`npm run db:rollback\` scripts

## Acceptance Criteria
- [ ] \`npm run db:migrate\` runs cleanly on a fresh database
- [ ] All tables exist with correct column types and constraints
- [ ] Rollback works cleanly (\`npm run db:rollback\`)
- [ ] Foreign key constraints enforced`
  },

  {
    id: 5,
    milestone: "M2: Database Schema & Seed Data",
    title: "Create database migrations for tasks, sessions, and session detail tables",
    labels: ["database", "backend"],
    deps: [4],
    body: `## Overview
Second batch of migrations covering the cleaning session data model.

## Tables in This Issue
- \`standards\`
- \`standard_tasks\`
- \`tasks\`
- \`clean_sessions\`
- \`room_cleans\`
- \`task_completions\`
- \`photos\`

## Key Columns

### tasks
- \`property_id\` UUID FK
- \`room_id\` UUID FK
- \`standard_task_id\` UUID FK nullable
- \`label\` TEXT NOT NULL
- \`category\` VARCHAR(50) — Cleaning|Sanitise|Laundry|Restocking|Check|Photography
- \`frequency\` VARCHAR(20) — every_clean|weekly|monthly|deep_clean
- \`is_high_touch\` BOOLEAN DEFAULT false
- \`is_mandatory\` BOOLEAN DEFAULT true
- \`is_override\` BOOLEAN DEFAULT false
- \`is_applicable\` BOOLEAN DEFAULT true
- \`requires_supply_check\` BOOLEAN DEFAULT false
- \`supply_item\` VARCHAR(100)
- \`supply_low_threshold\` SMALLINT DEFAULT 5
- \`display_order\` SMALLINT
- \`archived\` BOOLEAN DEFAULT false

### clean_sessions
- \`property_id\` UUID FK NOT NULL
- \`triggered_by\` VARCHAR(30) — ical|lock_event|manual
- \`cleaner_id\` UUID FK nullable
- \`status\` VARCHAR(30) — pending|in_progress|submitted|approved|rejected
- \`session_type\` VARCHAR(20) — turnover|deep_clean|scheduled
- \`compliance_score\` NUMERIC(5,2)
- \`reservation_id\` UUID FK nullable
- \`rejection_reason\` TEXT
- \`cleaner_start_time\` TIMESTAMPTZ
- \`cleaner_end_time\` TIMESTAMPTZ
- \`submitted_at\` TIMESTAMPTZ
- \`reviewed_at\` TIMESTAMPTZ
- \`reviewed_by\` UUID FK

### photos
- \`room_clean_id\` UUID FK
- \`type\` VARCHAR(10) — before|after
- \`storage_path\` TEXT
- \`file_size_kb\` INTEGER
- \`taken_at\` TIMESTAMPTZ
- \`uploaded_at\` TIMESTAMPTZ

## Tasks
- [ ] Migration \`005_create_standards\`
- [ ] Migration \`006_create_standard_tasks\`
- [ ] Migration \`007_create_tasks\`
- [ ] Migration \`008_create_clean_sessions\`
- [ ] Migration \`009_create_room_cleans\`
- [ ] Migration \`010_create_task_completions\`
- [ ] Migration \`011_create_photos\`
- [ ] Add all relevant indexes

## Acceptance Criteria
- [ ] All migrations run cleanly in order
- [ ] \`session_type\` CHECK constraint enforced
- [ ] \`photos.type\` CHECK constraint (before|after) enforced
- [ ] Cascading deletes configured correctly (session → room_cleans → task_completions)`
  },

  {
    id: 6,
    milestone: "M2: Database Schema & Seed Data",
    title: "Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots",
    labels: ["database", "backend"],
    deps: [5],
    body: `## Overview
Final batch of migrations covering supporting data tables.

## Tables in This Issue
- \`reservations\`
- \`supply_alerts\`
- \`guest_ratings\`
- \`issues\`
- \`guest_messages\`
- \`superhost_snapshots\`

### reservations
- \`property_id\` UUID FK NOT NULL
- \`source\` VARCHAR(30) — airbnb_ical|manual
- \`external_uid\` VARCHAR(200) UNIQUE — iCal VEVENT UID for dedup
- \`checkin_date\` DATE NOT NULL
- \`checkout_date\` DATE NOT NULL
- \`summary\` VARCHAR(200)
- \`turnaround_hours\` SMALLINT — computed on sync
- \`synced_at\` TIMESTAMPTZ

### guest_ratings
- \`session_id\` UUID FK UNIQUE
- \`rating\` SMALLINT CHECK (1-5)
- \`review_text\` TEXT

### superhost_snapshots
- \`snapshot_date\` DATE
- \`overall_rating\` NUMERIC(3,2)
- \`response_rate\` NUMERIC(5,2)
- \`cancellation_rate\` NUMERIC(5,2)
- \`completed_stays\` SMALLINT
- \`qualifies\` BOOLEAN
- \`next_assessment_date\` DATE

## Tasks
- [ ] Migration \`012_create_reservations\`
- [ ] Migration \`013_create_supply_alerts\`
- [ ] Migration \`014_create_guest_ratings\`
- [ ] Migration \`015_create_issues\`
- [ ] Migration \`016_create_guest_messages\`
- [ ] Migration \`017_create_superhost_snapshots\`
- [ ] Index: \`idx_reservations_property_checkout\`
- [ ] Index: \`idx_reservations_uid\`

## Acceptance Criteria
- [ ] UNIQUE constraint on \`guest_ratings.session_id\` (one rating per session)
- [ ] UNIQUE constraint on \`reservations.external_uid\`
- [ ] All migrations reversible`
  },

  {
    id: 7,
    milestone: "M2: Database Schema & Seed Data",
    title: "Seed database with properties, rooms, standards, and all Ocean View BNB tasks",
    labels: ["database", "seed-data"],
    deps: [5, 6],
    body: `## Overview
Populate the database with all real data from the PRD so the app is usable from day one without any manual data entry.

## Seed Data Required

### Properties
- \`P01\` — Ocean View BNB (short_term_rental)
- \`P02\` — Owner's Residence (private_home)

### Standards
- \`STD-01\` — Airbnb Enhanced Clean
- \`STD-02\` — Home Standard

### Rooms — Ocean View BNB
| Slug | Display Name | Theme | Order |
|------|-------------|-------|-------|
| the-tide | Laundry Phase | The Tide | 0 |
| the-deep | Kitchen & Living Room | The Deep | 1 |
| the-kelp | Bathroom | The Kelp | 2 |
| the-beach | Bedroom | The Beach | 3 |
| the-shore | Final Cleaning | The Shore | 4 |

### Tasks — All 50+ tasks from PRD v4 §11 seed data
Include for each task:
- Correct \`room_id\`
- \`category\` (Cleaning|Sanitise|Laundry|Restocking|Check)
- \`frequency\` (every_clean|weekly)
- \`is_high_touch\` (true for light switches, remotes, handles, taps)
- \`requires_supply_check\` and \`supply_item\` where applicable
- \`display_order\` matching the original Google Form order

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
- [ ] Create \`api/src/db/seeds/001_properties.ts\`
- [ ] Create \`api/src/db/seeds/002_standards.ts\`
- [ ] Create \`api/src/db/seeds/003_rooms.ts\`
- [ ] Create \`api/src/db/seeds/004_tasks_the_tide.ts\`
- [ ] Create \`api/src/db/seeds/005_tasks_the_deep.ts\`
- [ ] Create \`api/src/db/seeds/006_tasks_the_kelp.ts\`
- [ ] Create \`api/src/db/seeds/007_tasks_the_beach.ts\`
- [ ] Create \`api/src/db/seeds/008_tasks_the_shore.ts\`
- [ ] Add \`npm run db:seed\` script
- [ ] Seeds are idempotent (safe to run twice)

## Acceptance Criteria
- [ ] \`npm run db:seed\` populates all data without errors
- [ ] All 50+ tasks present with correct metadata
- [ ] All high-touch tasks have \`is_high_touch = true\`
- [ ] Weekly tasks have \`frequency = 'weekly'\`
- [ ] Supply check tasks have correct \`supply_item\` and \`supply_low_threshold = 5\``
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 3 — API CORE
  // ══════════════════════════════════════════════════════════════
  {
    id: 8,
    milestone: "M3: API Core",
    title: "Implement JWT authentication (register, login, refresh, logout)",
    labels: ["backend", "auth"],
    deps: [4],
    body: `## Overview
Build the authentication system. All other API routes depend on this.

## Endpoints
\`\`\`
POST /auth/login          — email + password → access token + refresh token
POST /auth/refresh        — refresh token → new access token
POST /auth/logout         — invalidate refresh token
POST /auth/register       — owner-only, creates new user accounts
\`\`\`

## Implementation Details
- Access token: JWT, 15 minute expiry, payload: \`{ userId, role, propertyIds[] }\`
- Refresh token: JWT, 30 day expiry, stored in httpOnly cookie
- Passwords: bcrypt, 12 rounds
- \`propertyIds\`: array of property UUIDs the user is assigned to (for cleaners); empty = all properties (for owner/admin)
- Middleware: \`requireAuth\` — validates access token on all protected routes
- Middleware: \`requireRole(...roles)\` — checks role
- Middleware: \`requirePropertyAccess(propertyId)\` — validates cleaner has access to the requested property

## Tasks
- [ ] Install: \`jsonwebtoken\`, \`bcrypt\`, \`cookie-parser\`
- [ ] Create \`api/src/middleware/auth.ts\` with all three middleware functions
- [ ] Create \`api/src/routes/auth.ts\` with all four endpoints
- [ ] Refresh token rotation on each use
- [ ] Unit tests for all auth middleware

## Acceptance Criteria
- [ ] Login with correct credentials returns valid tokens
- [ ] Expired access token returns 401
- [ ] Cleaner token includes only their assigned \`propertyIds\`
- [ ] \`requirePropertyAccess\` blocks cleaner from accessing unassigned property
- [ ] Refresh token is invalidated on logout`
  },

  {
    id: 9,
    milestone: "M3: API Core",
    title: "Build properties, rooms, and tasks CRUD API endpoints",
    labels: ["backend", "api"],
    deps: [8],
    body: `## Overview
Core read/write API for the property configuration data.

## Endpoints

### Properties
\`\`\`
GET    /properties                    — owner/admin: list all; cleaner: list assigned
GET    /properties/:id                — property detail
POST   /properties                    — owner only
PATCH  /properties/:id                — owner/admin
DELETE /properties/:id                — owner only (soft delete: active=false)
\`\`\`

### Rooms
\`\`\`
GET    /properties/:id/rooms          — list rooms for property (ordered)
GET    /properties/:id/rooms/:roomId  — room detail
POST   /properties/:id/rooms          — admin/owner
PATCH  /properties/:id/rooms/:roomId  — admin/owner
\`\`\`

### Tasks
\`\`\`
GET    /properties/:id/rooms/:roomId/tasks   — list tasks (respects frequency + week detection)
POST   /properties/:id/rooms/:roomId/tasks   — admin/owner
PATCH  /properties/:id/rooms/:roomId/tasks/:taskId
DELETE /properties/:id/rooms/:roomId/tasks/:taskId  — soft delete (archived=true)
PATCH  /properties/:id/rooms/:roomId/tasks/reorder  — accepts ordered array of task IDs
\`\`\`

## Weekly Task Logic
When fetching tasks, the API should:
- Always return \`every_clean\` tasks
- Return \`weekly\` tasks only if the current calendar week number is different from the week of the last session for that property
- Return \`deep_clean\` tasks only if \`last_deep_clean_at\` for the property is > 90 days ago or null

## Tasks
- [ ] Implement all endpoints with proper role checks
- [ ] Weekly task detection logic in task fetch
- [ ] \`GET /properties/:id/rooms\` excludes archived rooms
- [ ] \`GET /rooms/:id/tasks\` excludes archived tasks
- [ ] Input validation with \`zod\`
- [ ] Integration tests for weekly task logic

## Acceptance Criteria
- [ ] Cleaner cannot access rooms/tasks for unassigned property (403)
- [ ] Weekly tasks appear on first clean of the week, not subsequent cleans
- [ ] Deep clean tasks appear when \`last_deep_clean_at\` > 90 days
- [ ] Reorder endpoint updates \`display_order\` atomically`
  },

  {
    id: 10,
    milestone: "M3: API Core",
    title: "Build user and cleaner assignment API endpoints",
    labels: ["backend", "api"],
    deps: [8],
    body: `## Overview
User management and property-cleaner assignment endpoints.

## Endpoints

### Users
\`\`\`
GET    /users                         — owner/admin only
GET    /users/:id                     — own profile always allowed; others: owner/admin
POST   /users                         — owner only (invite/create)
PATCH  /users/:id                     — own profile or owner/admin
PATCH  /users/:id/push-token          — cleaner updates their own push token
DELETE /users/:id                     — owner only (active=false)
\`\`\`

### Property Cleaners
\`\`\`
GET    /properties/:id/cleaners       — list assigned cleaners for a property
POST   /properties/:id/cleaners       — assign a cleaner to a property
PATCH  /properties/:id/cleaners/:userId  — update is_primary, is_active, notes
DELETE /properties/:id/cleaners/:userId  — remove assignment
\`\`\`

## Business Rules
- Only one cleaner can be \`is_primary = true\` per property — enforce in API
- Removing a cleaner assignment does not delete session history
- A cleaner's JWT \`propertyIds\` must be refreshed when assignments change

## Tasks
- [ ] Implement all user CRUD endpoints
- [ ] Implement property_cleaners endpoints
- [ ] Enforce single primary cleaner constraint
- [ ] Input validation with zod

## Acceptance Criteria
- [ ] Setting a new primary cleaner automatically unsets the previous one
- [ ] Cleaner cannot view other users' profiles
- [ ] Deleting a user sets \`active = false\`, does not cascade delete sessions`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 4 — SESSION ENGINE
  // ══════════════════════════════════════════════════════════════
  {
    id: 11,
    milestone: "M4: Session Engine",
    title: "Build iCal sync service — import Airbnb booking calendar",
    labels: ["backend", "ical", "integrations"],
    deps: [6, 9],
    body: `## Overview
The iCal sync service reads the Airbnb calendar export URL for each property and stores reservations. This drives the cleaner schedule view and auto-creates sessions.

## Behaviour (per decisions Q1, Q2)
- iCal auto-creates AND activates sessions (no lock needed)
- Sessions auto-trigger at 10:00am on checkout day
- Both are configurable per-property

## Implementation

### Sync Service (\`api/src/services/icalSync.ts\`)
- Install: \`node-ical\`
- Fetch iCal URL for each active \`short_term_rental\` property
- Parse VEVENT blocks: extract \`DTSTART\`, \`DTEND\`, \`SUMMARY\`, \`UID\`
- Upsert into \`reservations\` table using \`external_uid\` for dedup
- Compute \`turnaround_hours\` between checkout and next checkin
- Log \`ical_last_synced_at\` on the property record
- Handle parse errors gracefully — retain last valid data, surface error in DB

### Cron Schedule
- Auto-sync every 3 hours: \`0 */3 * * *\`
- Manual trigger: \`POST /admin/properties/:id/sync-ical\` (admin/owner only)

### Session Auto-Creation (\`api/src/services/sessionScheduler.ts\`)
- Runs daily at 09:50am
- Finds all reservations with \`checkout_date = today\` and no existing \`clean_session\`
- Creates a \`clean_session\` with \`triggered_by = 'ical'\`, \`status = 'in_progress'\`
- Assigns primary cleaner (if set); falls back to backup cleaner
- Sends push notification to assigned cleaner

## Tasks
- [ ] Install \`node-ical\`, \`node-cron\`
- [ ] Create \`icalSync.ts\` service
- [ ] Create \`sessionScheduler.ts\` cron job
- [ ] \`POST /admin/properties/:id/sync-ical\` manual trigger endpoint
- [ ] \`GET /admin/properties/:id/reservations\` — list synced reservations
- [ ] Store iCal URL encrypted in DB (\`pgcrypto\` or app-level AES)
- [ ] Error state stored on property: \`ical_last_error\`, \`ical_last_error_at\`
- [ ] Unit tests for iCal parser with mock .ics fixtures

## Acceptance Criteria
- [ ] Syncing a real Airbnb iCal URL populates \`reservations\` table correctly
- [ ] Re-syncing does not create duplicate reservations (idempotent)
- [ ] A session is auto-created at 10:00am on checkout day
- [ ] Primary cleaner is assigned and notified
- [ ] iCal parse error is stored and visible in admin panel — does not crash service`
  },

  {
    id: 12,
    milestone: "M4: Session Engine",
    title: "Build Home Assistant webhook receiver — August lock trigger",
    labels: ["backend", "integrations", "home-assistant"],
    deps: [11],
    body: `## Overview
Receive webhook events from Home Assistant when the August lock is opened. Per decision Q14, both the BNB and the Residence use the same lock/HA system.

## Behaviour
- Lock event fires → check if it falls within the configured time window
- If within window AND a reservation checkout is today → activate/create session
- iCal is the primary trigger; lock is a confirmation signal and backup
- The residence uses the same lock — differentiated by \`property_id\` in the payload

## Endpoint
\`\`\`
POST /webhooks/lock-event
\`\`\`

### Expected Payload
\`\`\`json
{
  "property_id": "uuid",
  "event_type": "lock_opened",
  "timestamp": "2026-03-30T11:23:00Z",
  "entity_id": "lock.august_front_door"
}
\`\`\`

### Webhook Security
- Shared secret header: \`X-HA-Webhook-Secret\`
- Validate against \`WEBHOOK_SECRET\` env var
- Return 200 immediately (process async) to avoid HA timeout

### Processing Logic
1. Validate payload and secret
2. Check \`property.session_trigger_time\` window (±2 hours of configured time)
3. Find today's reservation for the property
4. If active session exists → log event (already running)
5. If pending session exists → activate it, assign cleaner, notify
6. If no session → create and activate, assign cleaner, notify

## Tasks
- [ ] Create \`POST /webhooks/lock-event\` endpoint
- [ ] Implement time-window validation
- [ ] Async processing queue (or simple async handler with error logging)
- [ ] Home Assistant configuration example in \`/docs/home-assistant-setup.md\`
- [ ] Unit tests for time-window edge cases

## Acceptance Criteria
- [ ] Request with invalid secret returns 403
- [ ] Lock event outside time window is logged but does not create a session
- [ ] Lock event within window and matching checkout creates/activates session
- [ ] HA receives 200 within 500ms (async processing)
- [ ] Both properties (BNB + Residence) handled via \`property_id\` in payload`
  },

  {
    id: 13,
    milestone: "M4: Session Engine",
    title: "Build clean session CRUD API and session state machine",
    labels: ["backend", "api", "sessions"],
    deps: [11, 12],
    body: `## Overview
The session API drives both the mobile app and admin panel. Includes a strict state machine to prevent invalid transitions.

## State Machine
\`\`\`
pending → in_progress → submitted → approved
                     ↘             ↘
                      rejected ←────┘ (rejected → in_progress for re-clean)
\`\`\`

## Endpoints
\`\`\`
GET    /properties/:id/sessions               — list sessions (filter: status, date, type)
GET    /properties/:id/sessions/:sessionId    — session detail with room_cleans + photos
POST   /properties/:id/sessions               — manual create (admin/owner)
PATCH  /properties/:id/sessions/:sessionId    — update status, assign cleaner
POST   /properties/:id/sessions/:sessionId/submit    — cleaner submits completed session
POST   /properties/:id/sessions/:sessionId/approve   — admin/owner approves
POST   /properties/:id/sessions/:sessionId/reject    — admin/owner rejects (reason required)

GET    /properties/:id/sessions/:sessionId/room-cleans              — list room cleans
PATCH  /properties/:id/sessions/:sessionId/room-cleans/:roomCleanId — update status, notes
POST   /properties/:id/sessions/:sessionId/room-cleans/:roomCleanId/complete
\`\`\`

## Compliance Score Calculation
Triggered on session approval:
- Score = (mandatory tasks completed / total mandatory tasks) × 100
- Deduct 5 points for each missing before/after photo pair
- Stored on \`clean_sessions.compliance_score\`
- Visible to owner/admin only (not cleaner)

## Tasks
- [ ] Implement all session endpoints
- [ ] State machine enforced — invalid transitions return 422
- [ ] Compliance score calculation on approval
- [ ] Session cannot be submitted unless all rooms have both photos (BNB) or photos optional (Residence)
- [ ] \`GET /sessions\` supports filtering by \`status\`, \`date_from\`, \`date_to\`, \`session_type\`

## Acceptance Criteria
- [ ] Cleaner cannot approve/reject their own session
- [ ] Rejected session can be re-opened (status back to in_progress)
- [ ] Compliance score calculated correctly on approval
- [ ] Residence sessions allow photo submission but do not require it
- [ ] BNB sessions cannot be submitted without both photos per room`
  },

  {
    id: 14,
    milestone: "M4: Session Engine",
    title: "Build task completion and photo upload API",
    labels: ["backend", "api", "photos"],
    deps: [13],
    body: `## Overview
Endpoints for completing checklist tasks and uploading before/after photos within a session.

## Endpoints

### Task Completions
\`\`\`
GET    /room-cleans/:id/task-completions              — list all completions for a room clean
PATCH  /room-cleans/:id/task-completions/:taskId      — mark complete/incomplete, add notes
POST   /room-cleans/:id/task-completions/bulk         — batch update (all tasks at once)
\`\`\`

### Photos
\`\`\`
POST   /room-cleans/:id/photos        — upload before or after photo
GET    /room-cleans/:id/photos        — list photos for room clean
DELETE /room-cleans/:id/photos/:photoId — admin/owner only
\`\`\`

### Supply Alerts
\`\`\`
POST   /room-cleans/:id/supply-alerts    — log a supply shortage
GET    /properties/:id/supply-alerts     — list unresolved alerts for property
PATCH  /supply-alerts/:id               — mark resolved (admin/owner)
\`\`\`

## Photo Upload Implementation
- Accept: \`multipart/form-data\` with \`file\` and \`type\` (before|after)
- Validate: max 5MB server-side (client compresses to 2MB target)
- Store: \`/photos/{property_id}/{session_id}/{room_clean_id}/{type}_{timestamp}.jpg\`
- Record: \`storage_path\`, \`file_size_kb\`, \`taken_at\` (from EXIF or upload time)
- Serve: \`GET /photos/*\` static file route (nginx in production)

## Tasks
- [ ] Install \`multer\` for file upload handling
- [ ] Implement task completion endpoints
- [ ] Implement photo upload with storage logic
- [ ] Implement supply alert endpoints
- [ ] Validate only one \`before\` and one \`after\` photo per room clean
- [ ] Unit tests for supply alert threshold logic

## Acceptance Criteria
- [ ] Photo upload stores file at correct path with correct naming
- [ ] Second before-photo upload replaces the first (or returns 409 — configurable)
- [ ] Supply alert created with correct \`supply_item\` and \`quantity_remaining\`
- [ ] Task completion records \`completed_at\` timestamp`
  },

  {
    id: 15,
    milestone: "M4: Session Engine",
    title: "Build push notification service",
    labels: ["backend", "notifications"],
    deps: [13],
    body: `## Overview
Send push notifications to cleaners via Expo Push API. All decisions Q3 are implemented here: both night-before and morning-of reminders.

## Notification Events
| Trigger | Recipient | Message |
|---------|-----------|---------|
| Session created/activated | Primary cleaner | "A clean is ready at [Property Name]" |
| Night before checkout (8pm) | Assigned cleaner | "Reminder: You have a clean tomorrow at [Property Name]" |
| Morning of checkout (7am) | Assigned cleaner | "Good morning! Your clean at [Property Name] starts today" |
| Session rejected | Cleaner | "Your clean at [Property Name] was sent back: [reason]" |
| Standard task auto-pushed | Admin | "Cleaning standard updated — [N] tasks changed across [M] properties" |

## Implementation
- Install: \`expo-server-sdk\`
- Create \`api/src/services/notifications.ts\`
- Cron jobs:
  - \`0 20 * * *\` — night before reminder (check tomorrow's checkouts)
  - \`0 7 * * *\` — morning of reminder (check today's checkouts)
- Handle Expo push receipts — remove invalid tokens from DB

## Tasks
- [ ] Install \`expo-server-sdk\`
- [ ] Create notification service with all event types
- [ ] Add night-before cron job
- [ ] Add morning-of cron job
- [ ] Graceful handling of invalid push tokens (remove from user record)
- [ ] \`POST /admin/notifications/test\` — send test notification (admin only)

## Acceptance Criteria
- [ ] Cleaner receives push notification when session is created
- [ ] Night-before reminder fires at 8pm the evening before a checkout
- [ ] Morning reminder fires at 7am on checkout day
- [ ] Invalid push tokens are removed and do not cause repeated errors
- [ ] Notifications include property name (cleaner knows which property)`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 5 — MOBILE APP: CLEANER
  // ══════════════════════════════════════════════════════════════
  {
    id: 16,
    milestone: "M5: Mobile App — Cleaner Core",
    title: "Mobile app: authentication screens and navigation structure",
    labels: ["mobile", "auth"],
    deps: [8],
    body: `## Overview
Build the login screen and core navigation shell for the mobile app. Ocean theme throughout.

## Screens
- **Login screen** — email + password, ocean theme (teal/blue/white)
- **Main tab navigator** — 3 tabs: Schedule | Active Session | Profile
- **Loading/splash screen** — ocean wave animation or static

## Design Tokens (Ocean Theme)
\`\`\`
Primary:   #0D7E8A (Teal)
Secondary: #1A5FA8 (Blue)
Background: #FFFFFF
Text:      #1A2332
Accent:    #E0F4F6 (Light Teal)
\`\`\`

## Tasks
- [ ] Install: \`expo-router\` or \`react-navigation\`
- [ ] Create login screen with ocean theme
- [ ] Create tab navigator (Schedule | Active Session | Profile)
- [ ] Implement token storage with \`expo-secure-store\`
- [ ] Implement token refresh interceptor in API client (\`axios\`)
- [ ] Create shared \`api/\` client module with base URL from env
- [ ] Auto-redirect to login if token expired

## Acceptance Criteria
- [ ] Login with valid credentials navigates to Schedule tab
- [ ] Invalid credentials shows clear error message
- [ ] Token persists between app restarts
- [ ] Logged-out state returns to login screen
- [ ] Ocean colour theme applied consistently`
  },

  {
    id: 17,
    milestone: "M5: Mobile App — Cleaner Core",
    title: "Mobile app: active session screen — room list and checklist",
    labels: ["mobile", "sessions"],
    deps: [13, 14, 16],
    body: `## Overview
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
- Use \`expo-image-picker\` with camera
- Show before/after photo thumbnails once taken
- Compress to <2MB before upload (\`expo-image-manipulator\`)

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
- [ ] Progress persists if app is closed mid-session`
  },

  {
    id: 18,
    milestone: "M5: Mobile App — Cleaner Core",
    title: "Mobile app: guest rating screen and session submission",
    labels: ["mobile", "sessions"],
    deps: [17],
    body: `## Overview
End-of-session screens: guest rating (BNB only) and session submission.

## Screens

### Guest Rating Screen (short_term_rental properties only)
- 5-star tap rating
- Labels: 1 = "Never have them back", 5 = "Invite back any time"
- Colour indicator:
  - 5★ = green (supports Superhost 4.8 target)
  - 4★ = amber
  - 1–3★ = red
- Free-text field: "How did these guests do?"
- "Log Issue" quick-button → opens issue modal

### Issue Modal
- Room selector (or "General")
- Description text field
- Severity: Low | Medium | High
- Optional photo

### Session Summary Screen
- All rooms listed as complete ✅
- Guest rating shown (if applicable)
- Any issues or supply alerts logged
- "Submit Clean" button

## Tasks
- [ ] Guest rating screen with star tap UI
- [ ] Colour-coded feedback indicator
- [ ] Issue logging modal (accessible from rating screen and room screen)
- [ ] Session summary screen
- [ ] Submit session API call → status transitions to 'submitted'
- [ ] Post-submit confirmation screen: "Clean submitted! Great work."
- [ ] Residence sessions skip guest rating screen entirely

## Acceptance Criteria
- [ ] Guest rating screen only shown for short_term_rental property sessions
- [ ] Cannot submit without guest rating (if BNB) — rating is required
- [ ] Issue modal saves correctly with optional photo
- [ ] Post-submission, session no longer appears as "active" in the app`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 6 — MOBILE APP: SCHEDULE VIEW
  // ══════════════════════════════════════════════════════════════
  {
    id: 19,
    milestone: "M6: Mobile App — Schedule View",
    title: "Mobile app: cleaner schedule screen (upcoming cleans from iCal)",
    labels: ["mobile", "schedule"],
    deps: [11, 16],
    body: `## Overview
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
- [ ] Deep clean warning appears when \`last_deep_clean_at\` > 90 days
- [ ] Pull-to-refresh triggers sync and updates list within 10 seconds
- [ ] Empty state shown correctly when no upcoming cleans`
  },

  {
    id: 20,
    milestone: "M6: Mobile App — Schedule View",
    title: "Mobile app: cleaning standards reference screen",
    labels: ["mobile", "standards"],
    deps: [10, 19],
    body: `## Overview
In-app reference guide so cleaners can look up the cleaning standard for any property at any time — not just during a session.

## Screens

### Standards Reference (accessible from Profile tab)
- Property selector
- Room list for selected property
- Tap room → task list grouped by category
- High-touch tasks highlighted with 🖐
- "What not to miss" section pinned at top — high-touch tasks only

### Task Detail
- Task label
- Description/guidance notes (from \`standard_tasks.description\`)
- Category badge
- Frequency badge (Every Clean / Weekly / Deep Clean)

## Tasks
- [ ] Standards reference screen in Profile tab
- [ ] Room list with category grouping
- [ ] Task detail view
- [ ] High-touch section pinned at top
- [ ] Offline cache of standards (downloaded on login, refreshed on sync)

## Acceptance Criteria
- [ ] Standards reference accessible without an active session
- [ ] High-touch tasks visually distinct and pinned to top
- [ ] Works offline using cached data
- [ ] Cleaner can only view standards for their assigned properties`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 7 — ADMIN PANEL: CORE
  // ══════════════════════════════════════════════════════════════
  {
    id: 21,
    milestone: "M7: Admin Panel — Core",
    title: "Admin panel: authentication, layout, and property switcher",
    labels: ["admin", "frontend"],
    deps: [8],
    body: `## Overview
Build the admin panel shell — login, navigation, and the property switcher that scopes all views.

## Layout
- **Left sidebar nav**: Dashboard | Sessions | Schedule | Checklists | Cleaners | Issues | Messages | Settings
- **Top bar**: Property switcher dropdown + user menu
- **Main content area**: changes based on selected nav item
- **Property switcher**: "All Properties" (owner) or specific property (admin/cleaner scoped)

## Ocean Theme
- Sidebar: dark teal (#095F67) with white text
- Active nav item: teal (#0D7E8A)
- Top bar: white with teal accents
- Consistent with mobile app colour tokens

## Tasks
- [ ] Login page (email + password)
- [ ] Sidebar navigation component
- [ ] Top bar with property switcher
- [ ] Route protection — redirect to login if unauthenticated
- [ ] Role-based nav — certain items hidden for non-owner roles
- [ ] Responsive layout (works at 1280px min width)
- [ ] React Query setup for server state management

## Acceptance Criteria
- [ ] Login works and stores JWT
- [ ] Property switcher filters all subsequent API calls
- [ ] Owner sees "All Properties" option; admin sees only assigned properties
- [ ] Sidebar highlights active route
- [ ] Ocean theme consistent with mobile app`
  },

  {
    id: 22,
    milestone: "M7: Admin Panel — Core",
    title: "Admin panel: dashboard with property health cards and upcoming cleans",
    labels: ["admin", "frontend"],
    deps: [21, 11, 13],
    body: `## Overview
The main dashboard — first screen after login. Gives the owner an instant health overview of all properties.

## Widgets

### Property Health Cards (one per property)
- Property name + type badge
- Last clean: date + compliance score + cleaner name
- Next scheduled clean: date + turnaround window
- Open issues count (red badge if > 0)
- Low supply alerts count (amber badge if > 0)

### Upcoming Cleans (next 14 days)
- Timeline/list view
- Colour-coded by property
- Shows: checkout date, turnaround, session status, assigned cleaner

### Open Issues & Supply Alerts
- Consolidated list across all properties
- Quick "Mark Resolved" action inline

### Active Session Card (if a session is in_progress)
- Live progress: X of Y rooms complete
- Cleaner name + started time
- Link to full session detail

## Tasks
- [ ] Property health card component
- [ ] Upcoming cleans list component
- [ ] Issues and supply alerts widgets
- [ ] Active session card with live polling (every 30s)
- [ ] All widgets respect property switcher selection

## Acceptance Criteria
- [ ] Dashboard loads within 1 second
- [ ] Active session card updates without full page refresh
- [ ] Property health cards show correct last clean data
- [ ] Upcoming cleans shows next 14 days correctly`
  },

  {
    id: 23,
    milestone: "M7: Admin Panel — Core",
    title: "Admin panel: session review — before/after photo comparison",
    labels: ["admin", "frontend", "sessions"],
    deps: [13, 14, 22],
    body: `## Overview
The session review screen is where the owner audits completed cleans and approves or rejects them.

## Sessions List Screen
- Filter bar: date range | property | cleaner | status | session type
- Table rows: date, property, cleaner, rooms complete, compliance score, status, actions
- Bulk approve (for quick review of multiple sessions)

## Session Detail Screen
- Header: property, cleaner, date, duration, compliance score badge
- Per-room accordion sections:
  - Before/after photo side-by-side comparison
  - Task completion list with any notes
  - Supply alerts for this room
- Guest rating (if BNB session) — stars + review text
- Issues logged during session
- Action bar: Approve ✅ | Reject ❌ (requires rejection reason) | Request Re-clean

## Compliance Score Display
- Colour-coded badge: 95-100% Gold | 85-94% Good | 70-84% Needs Improvement | <70% Below Standard
- Breakdown: tasks completed X/Y, photos submitted X/Y

## Tasks
- [ ] Sessions list with filters
- [ ] Before/after photo side-by-side component
- [ ] Task completion accordion per room
- [ ] Approve/reject actions with confirmation modal
- [ ] Rejection reason required — free text field
- [ ] Compliance score badge component

## Acceptance Criteria
- [ ] Photo comparison loads without layout shift
- [ ] Reject action requires non-empty rejection reason
- [ ] Compliance score calculated and shown correctly
- [ ] Session status updates immediately on approve/reject (optimistic UI)`
  },

  {
    id: 24,
    milestone: "M7: Admin Panel — Core",
    title: "Admin panel: checklist management — add, edit, reorder tasks per room",
    labels: ["admin", "frontend", "checklists"],
    deps: [9, 22],
    body: `## Overview
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
- [ ] Draggable task list (\`@dnd-kit/sortable\`)
- [ ] Task edit modal with all fields
- [ ] Archive task with confirmation
- [ ] Standard propagation banner + per-task review
- [ ] Unsaved changes warning before navigation

## Acceptance Criteria
- [ ] Drag-and-drop reorder saves correctly
- [ ] Archived tasks hidden from list but visible in "Show archived" toggle
- [ ] Standard propagation banner appears after auto-push
- [ ] Task changes take effect on next clean session (not retroactively)`
  },

  {
    id: 25,
    milestone: "M7: Admin Panel — Core",
    title: "Admin panel: issues and guest messages inbox",
    labels: ["admin", "frontend"],
    deps: [6, 22],
    body: `## Overview
Unified inbox for all guest messages and cleaner-reported issues across all properties.

## Issues Screen
- Filter: property | severity | status | date
- Table: date, property, room, reporter (guest/cleaner), description, severity badge, status
- Row click → detail modal
- Inline "Mark Resolved" button

### Issue Detail Modal
- Full description + photo (if attached)
- Severity + status controls
- Admin notes text area (internal only)
- Link to related session (if any)
- Status history timeline

## Guest Messages Screen
- Message list with: sender (guest name/ref), subject, date, status badge
- Message detail: full body + admin reply notes
- Response time shown — feeds Superhost response rate KPI
- Mark as: In Progress | Resolved

## Response Time Tracking
- Each message records \`first_viewed_at\` and \`responded_at\`
- Response time = \`responded_at\` - \`created_at\`
- Used in Superhost KPI calculation

## Tasks
- [ ] Issues list with filters
- [ ] Issue detail modal with photo viewer
- [ ] Guest messages list and detail
- [ ] Response time recording
- [ ] Severity badge component (Low/Medium/High colour coding)
- [ ] Status workflow controls

## Acceptance Criteria
- [ ] Response time recorded correctly from first "Resolved" action
- [ ] Issues with photos display photo inline in modal
- [ ] Status updates reflected immediately in list
- [ ] Filter by severity works correctly`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 8 — ADMIN PANEL: SUPERHOST & PERFORMANCE
  // ══════════════════════════════════════════════════════════════
  {
    id: 26,
    milestone: "M8: Admin Panel — Superhost & Performance",
    title: "Admin panel: Superhost tracker dashboard widget",
    labels: ["admin", "frontend", "superhost"],
    deps: [6, 22],
    body: `## Overview
Real-time Superhost KPI tracking dashboard for the Ocean View BNB property.

## Widget Layout (4 KPI gauges)

### 1. Overall Rating
- Gauge: 0–5 scale with 4.8 target line
- Current value from rolling 12-month average of \`guest_ratings.rating\`
- Colour: green ≥4.8 | amber 4.5–4.7 | red <4.5

### 2. Response Rate
- Gauge: 0–100% with 90% target line
- Calculated from \`guest_messages\` response times
- Colour: green ≥90% | amber 80–89% | red <80%

### 3. Cancellation Rate
- Gauge: 0–5% (most useful range) with <1% target
- Placeholder in MVP (no booking management) — show "Track manually"
- Colour: green <1% | red ≥1%

### 4. Completed Stays
- Progress bar: 0 to 10 stays (or 100 nights)
- Count from approved \`clean_sessions\` in 12-month window
- Colour: green ≥10 | amber 7–9 | red <7

### Status Summary
- "Will you qualify?" prediction badge
- Days until next Airbnb quarterly assessment (Jan 1 / Apr 1 / Jul 1 / Oct 1)

## Backend
- \`POST /admin/superhost/snapshot\` — calculate and store snapshot
- \`GET /admin/superhost/current\` — latest snapshot + live calculations
- Snapshot auto-calculated weekly via cron

## Tasks
- [ ] Superhost snapshot API endpoint
- [ ] Weekly snapshot cron job
- [ ] Gauge component (reusable)
- [ ] 4 KPI gauges wired to live data
- [ ] "Will you qualify?" prediction logic
- [ ] Next assessment date calculation

## Acceptance Criteria
- [ ] Overall rating gauge reflects last 12 months of \`guest_ratings\`
- [ ] Next assessment date always shows the next upcoming quarterly date
- [ ] Snapshot stored weekly and accessible in history
- [ ] Widget only visible for short_term_rental properties`
  },

  {
    id: 27,
    milestone: "M8: Admin Panel — Superhost & Performance",
    title: "Admin panel: cleaner performance profiles and comparison view",
    labels: ["admin", "frontend", "performance"],
    deps: [13, 14, 26],
    body: `## Overview
Per-cleaner performance dashboard. Compliance scores are owner/admin only (per decision Q10, Q12).

## Cleaner List Screen (Admin → Cleaners)
- Table: cleaner name, assigned properties, avg compliance score (all time), last session date, active status
- Click → individual performance profile

## Individual Performance Profile
- Header: cleaner name, properties assigned, total sessions
- **Compliance Score Chart**: line chart of last 12 sessions (recharts)
- **Average Clean Duration**: bar chart per property vs property average
- **Task Completion Rate**: breakdown by room
- **Photo Submission Rate**: % sessions with all photos submitted
- **Issue Flag Rate**: supply alerts + issues raised per session

## Side-by-Side Comparison
- Select 2 cleaners assigned to the same property
- Radar chart: Compliance | Speed | Photo Rate | Issue Rate | Thoroughness
- Useful for coaching conversations

## Important UX Notes
- Compliance scores NOT shown to cleaners (decisions Q10, Q12)
- Admin sees "performance data" framing, not "score cards" — coaching tool
- No public leaderboard

## Tasks
- [ ] Cleaner list screen
- [ ] Individual performance profile with charts (recharts)
- [ ] Comparison view with radar chart
- [ ] Performance metrics API: \`GET /admin/cleaners/:id/performance\`
- [ ] Data aggregated server-side — not calculated in frontend

## Acceptance Criteria
- [ ] Performance data only visible to owner/admin
- [ ] Compliance score chart shows last 12 sessions correctly
- [ ] Comparison radar chart works for 2 cleaners on same property
- [ ] Empty state handled gracefully (new cleaner with no sessions)`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 9 — GUEST WEB LINK
  // ══════════════════════════════════════════════════════════════
  {
    id: 28,
    milestone: "M9: Guest Web Link",
    title: "Guest web page: property guide, issue reporting, and owner contact",
    labels: ["frontend", "guest"],
    deps: [6, 9],
    body: `## Overview
A simple public web page (no account needed — per decision Q7) that guests can access via a link in their Airbnb welcome message. Built as a standalone page within the admin React app or as a simple separate route.

## URL Structure
\`/guest/{property_slug}\` — publicly accessible, no auth required

## Page Sections

### 1. Property Guide
- Property name and welcome message (configured by admin)
- House rules (configured by admin)
- Check-in / check-out instructions (static, admin configured)
- WiFi password (admin configured)

### 2. Report an Issue
- Room selector (dropdown)
- Description (textarea)
- Severity: Low | Medium | High
- Optional photo upload
- Contact name (optional)
- Submit → creates \`issues\` record with reporter identified as "guest"

### 3. Contact Owner
- Subject + message fields
- Contact name + email (optional)
- Submit → creates \`guest_messages\` record

## Backend
\`\`\`
GET  /guest/:propertySlug          — fetch public property guide data
POST /guest/:propertySlug/issues   — submit issue (no auth)
POST /guest/:propertySlug/messages — submit message (no auth)
\`\`\`

## Tasks
- [ ] Public guest page route
- [ ] Property guide section
- [ ] Issue report form with photo upload
- [ ] Contact form
- [ ] Public API endpoints (rate-limited: 10 req/min per IP)
- [ ] Admin screen to configure guide content (property name, rules, instructions)
- [ ] Ocean theme applied

## Acceptance Criteria
- [ ] Page accessible without login at \`/guest/{slug}\`
- [ ] Issue and message submissions appear in admin inbox
- [ ] Rate limiting prevents abuse
- [ ] Photo upload works from mobile browser`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 10 — STANDARDS SYSTEM
  // ══════════════════════════════════════════════════════════════
  {
    id: 29,
    milestone: "M10: Standards System",
    title: "Standards management API and admin UI",
    labels: ["backend", "admin", "standards"],
    deps: [9, 24],
    body: `## Overview
Build the standards management system — the reusable cleaning checklist templates that can be applied across properties.

## API Endpoints
\`\`\`
GET    /standards                        — list all standards
GET    /standards/:id                    — standard detail with standard_tasks
POST   /standards                        — create new standard (owner only)
PATCH  /standards/:id                    — update standard (owner only)
POST   /standards/:id/tasks              — add standard task
PATCH  /standards/:id/tasks/:taskId      — edit standard task
DELETE /standards/:id/tasks/:taskId      — archive standard task

POST   /standards/:id/propagate          — push standard changes to all assigned properties
GET    /standards/:id/propagate/preview  — preview what would change before propagating
\`\`\`

## Auto-Propagation (per decision Q11)
When a standard task is updated:
1. Find all properties using this standard
2. Find matching \`tasks\` records (\`standard_task_id\` match)
3. Update non-overridden tasks automatically
4. Create \`standard_propagation_log\` record
5. Send admin notification: "Standard updated — N tasks changed across M properties"
6. Admin sees review banner in checklist management UI

## Admin UI
- Admin → Standards: list of standards
- Standard detail: task list by room type
- Edit task modal (same as checklist management)
- "Push to all properties" button with preview diff

## Tasks
- [ ] Standards CRUD API
- [ ] Auto-propagation logic
- [ ] Propagation preview endpoint (dry run)
- [ ] Admin notification on propagation
- [ ] Standards list and detail screens in admin panel
- [ ] Propagation preview diff UI

## Acceptance Criteria
- [ ] Standard task update auto-propagates to all assigned properties
- [ ] Overridden property tasks are NOT overwritten by propagation
- [ ] Admin receives notification after propagation
- [ ] Propagation preview shows exact changes before commit
- [ ] Propagation is atomic — all properties updated or none`
  },

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 11 — MULTI-PROPERTY & RESIDENCE
  // ══════════════════════════════════════════════════════════════
  {
    id: 30,
    milestone: "M11: Multi-Property & Residence",
    title: "Admin panel: property management — add, configure, and manage multiple properties",
    labels: ["admin", "frontend", "multi-property"],
    deps: [22, 29],
    body: `## Overview
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
- "Deep Clean Reset" button — resets \`last_deep_clean_at\` for whole property

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
- [ ] Adding a second STR property with its own iCal URL works independently`
  },

  {
    id: 31,
    milestone: "M11: Multi-Property & Residence",
    title: "Residence support: manual session scheduling and optional photo flow",
    labels: ["backend", "mobile", "admin", "residence"],
    deps: [13, 17, 30],
    body: `## Overview
Finalise support for the Owner's Residence as a \`private_home\` property type. Key differences from BNB: manual scheduling, same lock/HA system, photos optional.

## Differences from BNB Flow

| Feature | Ocean View BNB | Owner's Residence |
|---------|---------------|-------------------|
| Schedule trigger | iCal auto-create | Manual by admin |
| Lock trigger | Yes | Yes (same HA system) |
| Before/after photos | Required | Optional |
| Guest rating screen | Yes | No |
| iCal URL | Yes | No |
| Superhost tracker | Yes | No |

## Manual Scheduling (Admin → Schedule → Add Clean)
- Select property: Owner's Residence
- Select date + time
- Select cleaner from pool
- Select session type: Standard Clean | Deep Clean
- Optional notes
- Submit → creates session, notifies cleaner

## Residence Lock Trigger
- Same webhook as BNB (\`POST /webhooks/lock-event\`)
- \`property_id\` in payload differentiates residence from BNB
- If a session is scheduled for today → activates it
- If no session scheduled → optionally creates one (configurable)

## Mobile App Changes
- Residence sessions: before/after photo CTAs shown but marked "(Optional)"
- No guest rating screen after room completion
- "Submit Clean" goes straight to session summary

## Tasks
- [ ] Manual session creation API endpoint
- [ ] Admin "Add Clean" modal for residence
- [ ] Mobile app: photo optional flow for private_home sessions
- [ ] Mobile app: skip guest rating for private_home sessions
- [ ] Lock webhook handles residence property_id correctly
- [ ] Residence sessions excluded from Superhost calculations

## Acceptance Criteria
- [ ] Manual session created from admin panel and cleaner notified
- [ ] Residence lock event activates a scheduled session correctly
- [ ] Cleaner can submit residence session without any photos
- [ ] Compliance score still calculated for residence (based on tasks only)
- [ ] Residence sessions do not appear in Superhost tracker`
  },

];

// ── Write individual markdown files ─────────────────────────────────────────
const outputDir = '/home/claude/github-issues/issues';
fs.mkdirSync(outputDir, { recursive: true });

issues.forEach(issue => {
  const filename = `${String(issue.id).padStart(3, '0')}_${issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.md`;
  const deps = issue.deps.length > 0 ? issue.deps.map(d => `- Depends on #${d}`).join('\n') : '- None';
  const labels = issue.labels.join(', ');

  const content = `---
title: "${issue.title}"
milestone: "${issue.milestone}"
labels: [${issue.labels.map(l => `"${l}"`).join(', ')}]
---

# ${issue.title}

**Milestone:** ${issue.milestone}
**Labels:** ${labels}

## Dependencies
${deps}

${issue.body}
`;
  fs.writeFileSync(path.join(outputDir, filename), content);
});

// ── Write summary file ───────────────────────────────────────────────────────
const milestones = [...new Set(issues.map(i => i.milestone))];
let summary = `# GitHub Issues — Ocean View BNB Manager\n\n`;
summary += `Total issues: **${issues.length}**\n\n`;

milestones.forEach(m => {
  const mIssues = issues.filter(i => i.milestone === m);
  summary += `## ${m}\n`;
  mIssues.forEach(i => {
    const depStr = i.deps.length > 0 ? ` _(deps: ${i.deps.map(d => `#${d}`).join(', ')})_` : '';
    summary += `- [ ] **#${i.id}** ${i.title}${depStr}\n`;
  });
  summary += '\n';
});

// Dependency graph
summary += `## Dependency Order (suggested work order)\n\n`;
summary += `\`\`\`\n`;
issues.forEach(i => {
  const depStr = i.deps.length > 0 ? ` → requires [${i.deps.join(', ')}]` : ' → no deps (start here)';
  summary += `#${String(i.id).padStart(2)} ${i.title.substring(0, 60).padEnd(60)}${depStr}\n`;
});
summary += `\`\`\`\n\n`;

// GitHub CLI import script
summary += `## Import Script (GitHub CLI)\n\n`;
summary += `Install \`gh\` CLI and run:\n\n`;
summary += `\`\`\`bash\n#!/bin/bash\nREPO="your-username/bnb-manager"\n\n`;

// Create milestones
const milestoneNames = milestones.map((m, i) => ({ name: m, num: i + 1 }));
summary += `# Create milestones\n`;
milestoneNames.forEach(m => {
  summary += `gh api repos/$REPO/milestones -f title="${m.name}" -f state="open"\n`;
});

summary += `\n# Create labels\n`;
const allLabels = [...new Set(issues.flatMap(i => i.labels))];
const labelColors = {
  'infrastructure': 'e4e669', 'setup': 'c5def5', 'docker': '0075ca',
  'ci-cd': 'cfd3d7', 'database': 'f9d0c4', 'seed-data': 'fef2c0',
  'backend': '0e8a16', 'auth': 'd93f0b', 'api': '1d76db',
  'ical': '5319e7', 'integrations': 'e11d48', 'home-assistant': '006b75',
  'sessions': 'b60205', 'photos': 'f7a8b8', 'notifications': 'fbca04',
  'mobile': '0075ca', 'schedule': '0e8a16', 'standards': '5319e7',
  'admin': 'e4e669', 'frontend': 'c5def5', 'checklists': 'bfd4f2',
  'superhost': 'fef2c0', 'performance': 'f9d0c4', 'guest': 'd4c5f9',
  'multi-property': '0075ca', 'residence': '006b75',
};
allLabels.forEach(l => {
  const color = labelColors[l] || 'ededed';
  summary += `gh label create "$REPO" --repo $REPO --name "${l}" --color "${color}" 2>/dev/null || true\n`;
});

summary += `\n# Create issues (run in order)\n`;
issues.forEach(i => {
  const milestoneNum = milestoneNames.findIndex(m => m.name === i.milestone) + 1;
  const labelStr = i.labels.map(l => `--label "${l}"`).join(' ');
  summary += `gh issue create --repo $REPO --title "${i.title}" --milestone "${i.milestone}" ${labelStr} --body-file issues/${String(i.id).padStart(3,'0')}_*.md\n`;
});
summary += `\`\`\`\n`;

fs.writeFileSync('/home/claude/github-issues/ISSUES_SUMMARY.md', summary);
console.log(`✅ Generated ${issues.length} issue files`);
console.log(`✅ Generated ISSUES_SUMMARY.md with import script`);
