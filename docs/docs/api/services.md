# API Services

Business logic services used by the API route handlers.

## iCal Service

**File**: `api/src/services/ical.ts`

Parses Airbnb (and generic) iCal calendar feeds to extract reservation data.

### `fetchIcal(url: string)`

Fetches and parses an iCal feed URL, returning an array of reservation events.

**Extracted fields:**

| Field | Source | Description |
|-------|--------|-------------|
| `uid` | `UID` property | Unique event identifier |
| `checkin_date` | `DTSTART` | Guest check-in date |
| `checkout_date` | `DTEND` | Guest check-out date |
| `summary` | `SUMMARY` | Event summary text |
| `guest_name` | `SUMMARY` parsing | Guest name extracted from summary |
| `phone` | `DESCRIPTION` parsing | Phone number (last 4 digits masked) |
| `num_guests` | `DESCRIPTION` parsing | Number of guests |
| `description` | `DESCRIPTION` | Full event description |
| `location` | `LOCATION` | Event location |
| `is_blocked` | `SUMMARY` detection | `true` for "Not available" / "Airbnb (Not available)" entries |

**Behavior:**

- Supports both HTTP and HTTPS URLs with streaming parse
- Handles both `DATE` and `DATETIME` format start/end values
- Detects blocked dates (not real bookings) by checking summary text
- Extracts partial phone numbers and guest counts from the description field

### Usage in Routes

Called from the iCal route handler during:

- `POST /ical/sync/:propertyId` — manual sync trigger
- `PATCH /properties/:propertyId` — when iCal URL is added/updated

The sync process:

1. Fetches the iCal feed
2. Compares events against existing `reservations` by `external_uid`
3. Creates new reservations or updates existing ones
4. Returns `{ synced, created, updated }` counts

---

## Notifications Service

**File**: `api/src/services/notifications.ts`

Sends push notifications to mobile devices via the Expo Push API.

### `sendPushNotification(payload)`

Sends a single push notification to an Expo push token.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `to` | `string` | Expo push token (from user's mobile device) |
| `title` | `string` | Notification title |
| `body` | `string` | Notification body text |
| `data` | `object` (optional) | Additional data payload |

**Endpoint:** `https://exp.host/--/api/v2/push/send`

### Usage in Routes

Called from the notifications route handler:

- `POST /notifications/session-assigned` — notifies the assigned cleaner of a new session
- `POST /notifications/broadcast` — sends a notification to all cleaners assigned to a property

**Requirements:**

- The cleaner must have a valid Expo push token stored in `users.push_token`
- The mobile app registers the push token on login via `PATCH /users/me/push-token`

---

## Better-Auth Library

**File**: `api/src/lib/auth.ts`

Configures the Better-Auth authentication library.

### Configuration

| Setting | Value |
|---------|-------|
| Database | PostgreSQL pool connection |
| Secret | `BETTER_AUTH_SECRET` env var |
| Password hashing | Bcrypt with 12 rounds |
| Provider | Email + password (credentials) |
| User table | `users` |
| Session table | `session` |

### Custom Fields

The auth configuration maps additional user fields beyond the default Better-Auth schema:

- `role` — User role (owner/admin/cleaner/guest)
- `active` — Account active status
- `pushToken` — Expo push notification token

### Auth Endpoint

Better-Auth handles all `/api/auth/*` routes internally, including:

- `POST /api/auth/sign-in/email` — credential login
- `GET /api/auth/get-session` — session validation
- `POST /api/auth/sign-out` — logout

!!! note
    The Better-Auth handler is registered **before** the Express JSON body parser in `index.ts`, as it needs to handle its own request body parsing.
