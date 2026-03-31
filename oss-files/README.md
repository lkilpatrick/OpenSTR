# OpenSTR

**Open source short-term rental management for hosts who want a real system.**

OpenSTR is a self-hosted platform that replaces the chaos of WhatsApp messages, spreadsheets, and Google Forms with a proper cleaning management system — scheduling, checklists, photo evidence, supply tracking, and Superhost KPI monitoring, all in one place.

Built for Airbnb hosts. Works for any short-term rental platform.

---

## What It Does

- 📅 **Automatic schedule** — imports your Airbnb booking calendar via iCal so cleaners always know what's coming
- ✅ **Structured checklists** — room-by-room, aligned to Airbnb's 5-step Enhanced Clean protocol
- 📸 **Photo evidence** — mandatory before/after photos per room for every clean
- 🏠 **Multi-property** — manage your STR, your home, and future properties from one dashboard
- 👥 **Multi-cleaner** — assign cleaners per property, track performance, compare against your standard
- 🌟 **Superhost tracker** — live KPI dashboard tracking your 4.8 rating, response rate, and completed stays
- 📦 **Supply alerts** — cleaners flag low stock inline; you see it on the dashboard
- 🔒 **Smart lock trigger** — integrates with Home Assistant + August lock to auto-start sessions

---

## Screenshots

> Coming soon — contribute yours!

---

## Quick Start (Docker)

### Prerequisites
- Docker + Docker Compose
- A Linux server (or any machine running Docker)
- Your Airbnb iCal URL (from Calendar → Export in your Airbnb host dashboard)

### 1. Clone the repo

```bash
git clone https://github.com/[your-username]/openstr.git
cd openstr
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Configuration below)
```

### 3. Start the stack

```bash
docker-compose up -d
```

### 4. Run database migrations and seed data

```bash
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

### 5. Create your owner account

```bash
docker-compose exec api npm run create-owner
```

### 6. Open the admin panel

Navigate to `http://your-server-ip` and log in with your owner credentials.

---

## Configuration

Copy `.env.example` to `.env` and fill in the following:

```env
# Database
POSTGRES_USER=openstr
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=openstr

# Auth
JWT_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-other-long-random-secret

# Storage
PHOTO_STORAGE_PATH=/data/photos

# Optional: Home Assistant integration
WEBHOOK_SECRET=your-webhook-secret
```

Your Airbnb iCal URL is configured per-property inside the admin panel (Admin → Properties → Integrations).

---

## Architecture

OpenSTR is a monorepo with three apps:

```
openstr/
├── api/          # Node.js + Express REST API
├── admin/        # React + Vite admin panel (desktop)
├── mobile/       # React Native (Expo) mobile app
└── shared/       # Shared TypeScript types
```

Runs as a Docker Compose stack:

| Service | Description |
|---------|-------------|
| `api` | Node.js backend |
| `postgres` | PostgreSQL 16 database |
| `nginx` | Reverse proxy + static file serving |

**Portable by design** — the schema and storage layer are designed to migrate cleanly to Supabase or Firebase if you outgrow self-hosting.

---

## Mobile App

The mobile app is built with Expo (React Native) and is available for:
- iOS (via Expo Go or custom build)
- Android (via Expo Go or APK)

**For cleaners:** Schedule view, room checklists, photo capture, supply alerts.
**For guests:** Property guide, issue reporting, owner contact.

See [`mobile/README.md`](./mobile/README.md) for build instructions.

---

## Home Assistant Integration

OpenSTR integrates with Home Assistant to trigger clean sessions when your smart lock opens.

See [`docs/home-assistant-setup.md`](./docs/home-assistant-setup.md) for setup instructions.

---

## Roadmap

- [x] Core cleaning session workflow
- [x] iCal schedule integration
- [x] Multi-property + multi-cleaner support
- [x] Superhost KPI tracking
- [x] Home Assistant / smart lock integration
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

Any deployment accessible to users must display:
> "Powered by OpenSTR — created by [Your Name]"

See [LICENSE](./LICENSE) for full terms.

---

## Credits

Created by **[Your Name]** in 2026.

Built on top of: Express, React, React Native, PostgreSQL, Expo, node-ical, and many other excellent open source projects. See [ATTRIBUTION.md](./ATTRIBUTION.md) for the full list.

---

## Support

- 🐛 **Bug reports** — [open an issue](https://github.com/[your-username]/openstr/issues)
- 💡 **Feature requests** — [open an issue](https://github.com/[your-username]/openstr/issues) with the `enhancement` label
- 💬 **Questions** — [GitHub Discussions](https://github.com/[your-username]/openstr/discussions)
