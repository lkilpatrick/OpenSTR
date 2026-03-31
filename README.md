# OpenSTR

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Self-hosted](https://img.shields.io/badge/deployment-self--hosted-teal)](https://github.com/lkilpatrick/OpenSTR)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Open source short-term rental management for hosts who want a real system.**

OpenSTR is a self-hosted platform that replaces the chaos of WhatsApp messages, spreadsheets, and Google Forms with a proper cleaning management system — scheduling, checklists, photo evidence, supply tracking, and Superhost KPI monitoring, all in one place.

Built for Airbnb hosts. Works for any short-term rental platform.

---

## What It Does

- **Automatic schedule** — imports your Airbnb booking calendar via iCal so cleaners always know what's coming
- **Calendar dashboard** — see upcoming stays, past cleans, assigned cleaners, and guest info at a glance
- **Structured checklists** — room-by-room task lists with drag-and-drop reorder
- **Photo evidence** — mandatory before/after photos per room for every clean
- **Multi-property** — manage your STR, your home, and future properties from one dashboard
- **Multi-cleaner** — assign cleaners per property, track performance, compare against your standard
- **Superhost tracker** — live KPI dashboard tracking your 4.8 rating, response rate, and completed stays
- **Supply alerts** — cleaners flag low stock inline; you see it on the dashboard
- **Smart lock trigger** — integrates with Home Assistant + August lock to auto-start sessions

---

## Architecture

OpenSTR is a monorepo with three apps:

```
openstr/
├── api/          # Node.js + Express REST API (TypeScript)
├── admin/        # React + Vite admin panel (TypeScript)
├── mobile/       # React Native (Expo) cleaner app
└── shared/       # Shared TypeScript types
```

| Service | Tech | Port |
|---------|------|------|
| API | Express + PostgreSQL | 3000 |
| Admin | React + Vite | 5173 |
| Mobile | Expo (React Native) | 8083 |
| Database | PostgreSQL 16 | 5432 |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- Your Airbnb iCal URL (from Calendar → Export in your Airbnb host dashboard)

### 1. Clone and install

```bash
git clone https://github.com/lkilpatrick/OpenSTR.git
cd OpenSTR
npm install
```

### 2. Start PostgreSQL

```bash
docker run -d --name openstr-postgres \
  -e POSTGRES_DB=openstr \
  -e POSTGRES_USER=openstr \
  -e POSTGRES_PASSWORD=openstr \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Configure environment

```bash
cp api/.env.example api/.env
# Edit api/.env — defaults work with the Docker command above
```

Default `.env` values:
```env
DATABASE_URL=postgresql://openstr:openstr@localhost:5432/openstr
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

### 4. Run migrations and seed data

```bash
cd api
npx node-pg-migrate up --database-url-var DATABASE_URL
npm run db:seed:full
```

This creates:
- **Admin user**: `admin@openstr.dev` / `admin123`
- **Cleaner user**: `dallas@openstr.dev` / `dallas123`
- **Properties**: Ocean View BNB (STR) + Upstairs (residence)
- Full rooms, tasks, sessions, issues, messages, and ratings

### 5. Start the API and Admin panel

```bash
# From the repo root
npm run dev:api     # API on http://localhost:3000
npm run dev:admin   # Admin on http://localhost:5173
```

### 6. Start the Mobile app (optional)

```bash
cd mobile
npx expo start
```
Scan the QR code with Expo Go (Android) or Camera app (iOS).

---

## Configuration

### Airbnb iCal Import

1. Go to your Airbnb Host Dashboard → Calendar → Export Calendar
2. Copy the iCal URL
3. In the admin panel, update your property's iCal URL via the API:
   ```
   PATCH /properties/:id  { "ical_url": "https://www.airbnb.com/calendar/ical/..." }
   ```
4. Trigger a sync: `POST /ical/sync/:propertyId`

The sync extracts: check-in/out dates, guest names, phone numbers (last 4 digits), number of guests, reservation URLs, and blocked dates.

### Home Assistant Integration

OpenSTR can receive webhooks from Home Assistant when your smart lock opens, automatically triggering a clean session.

See `docs/home-assistant-setup.md` for setup instructions.

---

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | JWT login |
| `GET /properties` | List properties |
| `GET /properties/:id/rooms` | Rooms for a property |
| `GET /properties/:id/rooms/:roomId/tasks` | Tasks for a room |
| `GET /sessions` | List clean sessions |
| `POST /sessions/schedule` | Schedule a clean |
| `GET /ical/reservations/:id` | Reservations from iCal |
| `POST /ical/sync/:id` | Trigger iCal sync |
| `GET /admin/cleaners` | Cleaner performance |
| `GET /admin/superhost/current` | Superhost metrics |
| `GET /issues` | Property issues |
| `GET /messages` | Guest messages |

All endpoints require JWT auth (`Authorization: Bearer <token>`).

---

## Mobile App

Built with Expo (React Native) for iOS and Android.

**For cleaners:** Schedule view, room checklists, photo capture, supply alerts.

**Requirements:**
- Node.js 20+
- Expo Go app on your phone
- Set `EXPO_PUBLIC_API_URL` to your API server address

---

## Roadmap

- [x] Core cleaning session workflow
- [x] iCal schedule integration with guest data extraction
- [x] Multi-property + multi-cleaner support
- [x] Superhost KPI tracking
- [x] Home Assistant / smart lock integration
- [x] Calendar dashboard with stays and cleans
- [x] Room management (add, rename, reorder, archive)
- [ ] VRBO / Booking.com iCal support
- [ ] Direct booking calendar (no OTA)
- [ ] Mobile app on App Store / Play Store
- [ ] Zapier / webhook integrations
- [ ] Multi-language support

---

## Contributing

OpenSTR welcomes contributions from hosts, developers, and STR industry folks.

See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

## License

OpenSTR is licensed under the **GNU General Public License v3 (GPL-3.0)**.

You are free to use, modify, and distribute OpenSTR — including for your own STR business. If you distribute a modified version, it must remain open source under the same license.

See [LICENSE](./LICENSE) for full terms.

---

## Credits

Created by **lkilpatrick** in 2026.

Built on: Express, React, React Native, PostgreSQL, Expo, and many other excellent open source projects. See [ATTRIBUTION.md](./ATTRIBUTION.md) for the full list.

---

## Support

- **Bug reports** — [open an issue](https://github.com/lkilpatrick/OpenSTR/issues)
- **Feature requests** — [open an issue](https://github.com/lkilpatrick/OpenSTR/issues) with the `enhancement` label
- **Questions** — [GitHub Discussions](https://github.com/lkilpatrick/OpenSTR/discussions)
