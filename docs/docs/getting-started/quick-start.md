# Quick Start (Local Development)

<img src="https://openstr.dev/static/81a9af08b34471ee2c99cc959364f416/a2e28/Daytime.webp" alt="Rental property during the day" class="hero-image-sm">

Get OpenSTR running locally for development or evaluation.

## Prerequisites

- **Node.js 20+**
- **Docker** (for PostgreSQL)
- **Flutter SDK 3.10+** (optional, for mobile app)
- Your **Airbnb iCal URL** (from Calendar → Export in your Airbnb host dashboard)

## 1. Clone and Install

```bash
git clone https://github.com/lkilpatrick/OpenSTR.git
cd OpenSTR
npm install
```

## 2. Start PostgreSQL

```bash
docker run -d --name openstr-postgres \
  -e POSTGRES_DB=openstr \
  -e POSTGRES_USER=openstr \
  -e POSTGRES_PASSWORD=openstr \
  -p 5432:5432 \
  postgres:16-alpine
```

## 3. Configure Environment

```bash
cp api/.env.example api/.env
```

Default `.env` values work with the Docker command above:

```env
DATABASE_URL=postgresql://openstr:openstr@localhost:5432/openstr
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

## 4. Run Migrations and Seed Data

```bash
cd api
npx node-pg-migrate up --database-url-var DATABASE_URL
npm run db:seed:demo    # Generic demo data (open source)
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.openstr.dev` | `admin123` |
| Cleaner | `cleaner@demo.openstr.dev` | `cleaner123` |

The demo seed creates a **Beach House** property with rooms, tasks, reservations, and cleaning sessions.

## 5. Start the API and Admin Panel

```bash
# From the repo root
npm run dev:api     # API on http://localhost:3000
npm run dev:admin   # Admin on http://localhost:5173
```

## 6. Start the Mobile App (Optional)

```bash
cd mobile_flutter
flutter run -d chrome --dart-define=API_URL=http://localhost:3000
```

For a physical device:

```bash
flutter run --dart-define=API_URL=http://YOUR_LAN_IP:3000
```

## Verify It's Working

1. Open `http://localhost:5173` — you should see the admin login page
2. Log in with `admin@demo.openstr.dev` / `admin123`
3. You should see the Dashboard with the Beach House property
4. Check `http://localhost:3000/health` — should return a health check response
