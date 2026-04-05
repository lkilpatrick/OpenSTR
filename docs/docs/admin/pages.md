# Admin Panel Pages

The admin panel has 10 pages covering all management functions. All pages except Login require authentication.

## Login Page

**Route**: `/login`

Email/password authentication form. On successful login, redirects to the dashboard.

---

## Dashboard Page

**Route**: `/dashboard`

The main overview page with a monthly calendar and operational summary.

**Features:**

- **Monthly calendar** — visual calendar showing upcoming stays and cleaning sessions
- **Upcoming stays** — next reservations with guest names, dates, and guest counts
- **Recent cleans** — recently completed cleaning sessions with status
- **Cleaning stats** — summary metrics for the selected property
- **iCal sync button** — manually trigger Airbnb calendar sync
- **Manual booking entry** — create reservations directly (for non-Airbnb bookings)
- **Cleaner notes** — recent notes from cleaners about sessions

**Data sources:** Sessions, reservations, cleaner notes, cleaners list. Approximately 8 independent queries with 5 mutations.

---

## Cleanings Page

**Route**: `/cleanings`

Review and manage cleaning sessions.

**Features:**

- **Status filters** — filter by pending, in_progress, submitted, approved, rejected
- **Session list** — filterable list of all cleaning sessions for the selected property
- **Before/after photo comparison** — side-by-side photo viewer for each room
- **Task checklist review** — verify task completion status per room
- **Bulk approve** — approve multiple submitted sessions at once
- **Session detail** — expand to see full breakdown with rooms, photos, notes

---

## Checklists Page

**Route**: `/checklists`

Manage room-level cleaning task templates for the selected property.

**Features:**

- **Room list** — all rooms for the selected property
- **Task management** — add, edit, archive tasks for each room
- **Drag-and-drop reorder** — reorder tasks within a room
- **Task properties** — label, category, frequency, high-touch flag, mandatory flag
- **Supply tracking** — configure supply check items with low-stock thresholds
- **Archive tasks** — soft-delete tasks that are no longer needed

---

## Issues Page

**Route**: `/issues`

Track and manage property issues reported by cleaners or guests.

**Features:**

- **Issue list** — filterable by property. Shows title, severity, status, reporter
- **Severity levels** — low, medium, high, critical (color-coded badges)
- **Status workflow** — open → in_progress → resolved → closed
- **Create/edit issues** — report new issues or update existing ones
- **Delete issues** — remove resolved or duplicate issues

---

## Cleaners Page

**Route**: `/cleaners`

Two-view page for cleaner management and analytics.

### Pay View

- **Cleaner list** — all cleaners with summary statistics
- **Per-cleaner stats** — total sessions, average compliance, YTD sessions
- **Assigned properties** — which properties each cleaner is assigned to

### Assignments View

- **Property assignments** — manage which cleaners are assigned to each property
- **Priority settings** — set primary/backup designation
- **Activation toggle** — enable/disable assignments
- **Rate configuration** — set per-cleaner cleaning rates
- **Notes** — admin notes on each assignment

---

## Standards Page

**Route**: `/standards`

Manage reusable cleaning standard templates.

**Features:**

- **Standards list** — all cleaning standards with task counts
- **Standard detail** — view tasks grouped by room type
- **Create standard** — define a new cleaning standard
- **Push to properties** — apply a standard template to one or more properties (with preview of changes)
- **Task management** — add, edit, archive tasks within a standard

---

## Properties Page

**Route**: `/properties`

CRUD management for properties.

**Features:**

- **Property list** — all properties with status
- **Setup wizard** — guided creation flow:
    1. Property name and address
    2. Property type (short-term rental or residence)
    3. iCal URL for Airbnb calendar sync
    4. Initial room setup
    5. Cleaning standard template selection
- **Edit property** — update name, address, iCal URL, settings
- **Delete property** — remove with confirmation (cascading delete)

---

## Team Page

**Route**: `/team`

Manage all platform users.

**Features:**

- **User list** — all users with role, email, and status
- **Create user** — form with name, email, password, and role selection
- **Edit user** — update name, email, role, cleaning rate, password
- **Activate/deactivate** — toggle account active status
- **Role management** — assign owner, admin, or cleaner roles

---

## Messages Page

**Route**: `/messages`

Inbox for guest messages received through the property portal.

**Features:**

- **Message list** — incoming messages with sender, subject, and timestamp
- **Read/unread filtering** — filter by read status
- **Property filtering** — filter by property
- **Mark read/unread** — toggle message read status
- **Delete messages** — remove messages from the inbox

---

## Routing Structure

```
/login                    → LoginPage (public)

/ (authenticated)         → PropertyProvider → Layout
├── /dashboard            → DashboardPage
├── /cleanings            → CleaningsPage
├── /team                 → TeamPage
├── /checklists           → ChecklistsPage
├── /issues               → IssuesPage
├── /messages             → MessagesPage
├── /cleaners             → CleanersPage
├── /standards            → StandardsPage
├── /properties           → PropertiesPage
└── * (catch-all)         → Redirect to /dashboard
```

All authenticated routes are wrapped in a `PrivateRoute` component that checks for an active session and redirects to `/login` if not authenticated.
