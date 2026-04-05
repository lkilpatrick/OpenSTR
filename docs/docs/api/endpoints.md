# API Endpoints

All endpoints are prefixed with the API base URL (default: `http://localhost:3000`). Unless noted otherwise, all endpoints require authentication.

## Health & Utilities

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Server health check |
| `GET` | `/network-check` | No | Returns `{ is_local: 1 }` for WiFi detection |
| `GET` | `/photos/*` | No | Static file serving for uploaded photos |

---

## Authentication

Handled by Better-Auth at `/api/auth/*`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/sign-in/email` | No | Login with email/password |
| `GET` | `/api/auth/get-session` | Yes | Validate current session |
| `POST` | `/api/auth/sign-out` | Yes | Logout and invalidate session |

---

## Properties

Manage rental properties and their rooms.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/properties` | owner, admin | List all properties |
| `GET` | `/properties/:propertyId` | All authed | Get property details |
| `POST` | `/properties` | owner | Create a new property |
| `PATCH` | `/properties/:propertyId` | owner, admin | Update property (triggers iCal sync if URL provided) |
| `DELETE` | `/properties/:propertyId` | owner | Delete property and all related data (cascading) |

### Rooms

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/properties/:propertyId/rooms` | All authed | List rooms for a property |
| `POST` | `/properties/:propertyId/rooms` | owner, admin | Create a new room |
| `PATCH` | `/properties/:propertyId/rooms/:roomId` | owner, admin | Update room details |
| `PATCH` | `/properties/:propertyId/rooms/reorder` | owner, admin | Batch reorder rooms |

### Room Tasks

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/properties/:propertyId/rooms/:roomId/tasks` | All authed | List tasks for a room |

---

## Users

Manage platform users and cleaner assignments.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/users` | owner, admin | List all users |
| `POST` | `/users` | owner, admin | Create user with credential account |
| `GET` | `/users/:userId` | owner, admin | Get user details |
| `PATCH` | `/users/:userId` | owner, admin | Update user fields and/or password |
| `PATCH` | `/users/me/push-token` | cleaner | Update own push notification token |

### Cleaner Assignments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/users/properties/:propertyId/cleaners` | owner, admin | List cleaners assigned to a property |
| `POST` | `/users/properties/:propertyId/cleaners` | owner, admin | Assign cleaner to property |
| `DELETE` | `/users/properties/:propertyId/cleaners/:userId` | owner, admin | Unassign cleaner from property |

---

## Sessions

Manage cleaning sessions and their state machine workflow.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/sessions` | All authed | List sessions (cleaners see only their own). Filter: `property_id`, `status` |
| `POST` | `/sessions` | owner, admin | Create session with auto-assignment and auto-room creation |
| `GET` | `/sessions/:sessionId` | All authed | Get session details |
| `GET` | `/sessions/:sessionId/detail` | All authed | Full session breakdown (rooms, photos, notes, rating) |
| `PATCH` | `/sessions/:sessionId/status` | All authed | Transition session status (state machine validated) |
| `POST` | `/sessions/:sessionId/accept` | cleaner | Accept a pending session |
| `POST` | `/sessions/:sessionId/request-backup` | cleaner | Request backup cleaner (logged as issue) |
| `POST` | `/sessions/claim` | cleaner | Claim an unassigned clean (creates & accepts session) |

### Upcoming Cleans

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/sessions/upcoming-cleans` | All authed | Upcoming jobs from reservations. Filter: `property_id`. Cleaners see assigned properties only |

### Cleaner Notes

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/sessions/notes/recent` | owner, admin | Recent cleaner notes per property |
| `DELETE` | `/sessions/notes/:noteId` | owner, admin | Delete a cleaner note |

### Session State Machine

Valid transitions:

```
pending    → accepted       (cleaner accepts)
accepted   → in_progress    (cleaner starts)
in_progress → submitted     (cleaner finishes)
submitted  → approved       (admin approves)
submitted  → rejected       (admin rejects)
```

---

## Photos & Task Completion

Upload photos and mark tasks complete within room cleans.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/photos/:roomCleanId` | cleaner | Upload photo (before/after/issue). Multipart form. Max 10MB. JPEG/PNG/WebP |
| `GET` | `/photos/:roomCleanId` | All authed | List photos for a room clean |
| `DELETE` | `/photos/file/:photoId` | owner, admin | Delete photo and remove file from disk |
| `POST` | `/photos/:roomCleanId/tasks/:taskId/complete` | cleaner | Mark task complete (upsert). Body: `{ quantity_value?, supply_replenished?, notes? }` |
| `DELETE` | `/photos/:roomCleanId/tasks/:taskId/complete` | owner, admin | Uncomplete a task |

### Task Completion Request

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/sessions/room-cleans/:roomCleanId/tasks` | All authed | Get task completions for a room clean |

---

## iCal & Reservations

Sync Airbnb bookings and manage reservations.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/ical/sync/:propertyId` | owner, admin | Trigger manual iCal sync. Returns `{ synced, created, updated }` |
| `GET` | `/ical/reservations/:propertyId` | owner, admin | List reservations for a property |
| `POST` | `/ical/reservations/:propertyId` | owner, admin | Manually create a reservation |
| `PATCH` | `/ical/reservations/:propertyId/:reservationId` | owner, admin | Update a reservation |

---

## Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/webhook/home-assistant` | `X-Webhook-Secret` header | Receives August lock unlock events. Auto-creates cleaning sessions for matching property |

### Home Assistant Webhook

The webhook requires the `X-Webhook-Secret` header matching the `WEBHOOK_SECRET` environment variable. When a matching lock event is received, a cleaning session is automatically created for the property associated with that lock entity.

---

## Notifications

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/notifications/session-assigned` | owner, admin | Send push notification to assigned cleaner |
| `POST` | `/notifications/broadcast` | owner, admin | Broadcast notification to all cleaners at a property |

Notifications are delivered via the **Expo Push API** to cleaners' mobile devices.

---

## Issues

Report and track property issues.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/issues` | All authed | List issues. Filter: `property_id`, `status` |
| `POST` | `/issues` | All authed | Report a new issue (`reported_by` = current user) |
| `PATCH` | `/issues/:id` | All authed | Update issue (title, description, severity, status). Auto-sets `resolved_at` when resolved |
| `DELETE` | `/issues/:id` | owner, admin | Delete an issue |

---

## Messages

Guest messages received through the property portal.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/messages` | owner, admin | List messages. Filter: `property_id`, unread status |
| `PATCH` | `/messages/:id/read` | owner, admin | Toggle message read/unread |
| `DELETE` | `/messages/:id` | owner, admin | Delete a message |

---

## Cleaner Analytics (Admin)

Performance metrics and management for cleaners.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/admin/cleaners` | owner, admin | List all cleaners with summary stats (total sessions, avg compliance, YTD sessions, assigned properties) |
| `GET` | `/admin/cleaners/:id/performance` | owner, admin | Individual cleaner profile (compliance history, duration per property, task completion rates, photo submission rate, issues) |
| `GET` | `/admin/cleaners/compare` | owner, admin | Compare two cleaners' stats. Query: `cleaner1`, `cleaner2`, `property_id` |
| `GET` | `/admin/cleaners/assignments/:propertyId` | owner, admin | List cleaner assignments for a property |
| `POST` | `/admin/cleaners/assignments` | owner, admin | Create cleaner assignment |
| `PATCH` | `/admin/cleaners/assignments/:id` | owner, admin | Update assignment (priority, is_active, rate, notes) |

---

## Guest (Public)

Public endpoints accessible without authentication. Rate-limited to 10 requests per minute per IP.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/guest/:propertySlug` | No | Public property guide (name, welcome message, rules, rooms, WiFi) |
| `POST` | `/guest/:propertySlug/issues` | No | Guest submits a property issue (optional photo upload) |
| `POST` | `/guest/:propertySlug/messages` | No | Guest sends a message to the host |

---

## Standards

Manage reusable cleaning standard templates.

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/standards` | All authed | List cleaning standards with task counts |
| `GET` | `/standards/:id` | All authed | Get standard with nested tasks |
| `POST` | `/standards` | owner | Create a new standard |
| `PATCH` | `/standards/:id` | owner | Update a standard |
| `POST` | `/standards/:id/tasks` | owner | Add a task to a standard |
| `PATCH` | `/standards/:id/tasks/:taskId` | owner | Update a standard task |
| `DELETE` | `/standards/:id/tasks/:taskId` | owner | Archive a standard task (soft delete) |
