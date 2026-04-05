# Configuration

## Environment Variables

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | Full PostgreSQL connection string |
| `POSTGRES_USER` | `openstr` | PostgreSQL username |
| `POSTGRES_PASSWORD` | — | PostgreSQL password |
| `POSTGRES_DB` | `openstr` | PostgreSQL database name |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `JWT_SECRET` | — | Secret for JWT token signing |
| `JWT_REFRESH_SECRET` | — | Secret for JWT refresh token signing |
| `JWT_EXPIRY` | — | JWT token expiry duration |
| `JWT_REFRESH_EXPIRY` | — | JWT refresh token expiry duration |
| `BETTER_AUTH_SECRET` | — | Secret for Better-Auth session management |
| `BETTER_AUTH_URL` | — | Better-Auth base URL |
| `PORT` | `3000` | API server port |
| `NODE_ENV` | `development` | Environment mode |
| `ADMIN_URL` | `http://localhost:5173` | Admin panel URL (for CORS) |
| `ALLOWED_ORIGINS` | — | Comma-separated list of allowed CORS origins |
| `PHOTO_STORAGE_PATH` | `/photos` | Filesystem path for photo uploads |
| `WEBHOOK_SECRET` | — | Shared secret for Home Assistant webhooks |

### Admin Panel Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | API base URL |

### Mobile App Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3000` | API base URL (passed via `--dart-define`) |

## Airbnb iCal Import

1. Go to your Airbnb Host Dashboard → Calendar → Export Calendar
2. Copy the iCal URL
3. In the admin panel, update your property's iCal URL
4. Trigger a sync from the Dashboard page or via API: `POST /ical/sync/:propertyId`

The sync extracts:

- Check-in/out dates
- Guest names
- Phone numbers (last 4 digits visible)
- Number of guests
- Reservation URLs
- Blocked dates

## Home Assistant Integration

OpenSTR can receive webhooks from Home Assistant when your smart lock opens, automatically triggering a clean session.

### Webhook Endpoint

```
POST /webhook/home-assistant
Header: X-Webhook-Secret: <your-webhook-secret>
```

### Payload

The webhook expects a Home Assistant event payload containing the lock entity ID. When a matching lock event is received, OpenSTR automatically creates a cleaning session for the corresponding property.

### Setup Steps

1. Set `WEBHOOK_SECRET` in your API `.env` file
2. Configure a Home Assistant automation that fires when your August lock unlocks
3. Point the automation's webhook action at `https://yourdomain.com/api/webhook/home-assistant`
4. Include the `X-Webhook-Secret` header with your secret

## User Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access to everything — properties, users, sessions, standards |
| `admin` | Manage properties, sessions, cleaners, and view analytics |
| `cleaner` | View assigned properties, accept/claim sessions, execute cleaning workflow |
| `guest` | Public property guide access, issue reporting, messaging |
