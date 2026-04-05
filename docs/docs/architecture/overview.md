# Architecture Overview

<img src="https://openstr.dev/static/df9ff8b2cd5112a505e312a5e814bbea/a2e28/sunrise.webp" alt="Rental property at sunrise" class="hero-image-sm">

OpenSTR is a monorepo with four components that work together to manage short-term rental cleaning operations.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        nginx                             │
│                   (reverse proxy + SSL)                   │
│                                                          │
│   /          → Admin Panel (React SPA)                   │
│   /app/      → Mobile Web App (Flutter Web)              │
│   /api/      → API Server (Express)                      │
│   /photos/   → Static photo files                        │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
    ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
    │ Admin Panel │ │   API   │ │ Mobile App  │
    │ React 19    │ │ Express │ │ Flutter     │
    │ Vite        │ │ TS      │ │ iOS/Android │
    │ TypeScript  │ │         │ │ Web         │
    └─────────────┘ └────┬────┘ └─────────────┘
                         │
                   ┌─────▼─────┐
                   │PostgreSQL │
                   │   16      │
                   └───────────┘
```

## Repository Structure

```
openstr/
├── api/                  # Node.js + Express REST API (TypeScript)
│   ├── src/
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Business logic (iCal, notifications)
│   │   ├── middleware/    # Auth & authorization middleware
│   │   ├── lib/          # Better-Auth configuration
│   │   └── db/           # Database pool, seeds
│   └── migrations/       # PostgreSQL migrations (node-pg-migrate)
├── admin/                # React + Vite admin panel (TypeScript)
│   └── src/
│       ├── pages/        # Route-level page components
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # API client, auth client
├── mobile_flutter/       # Flutter cleaner app (Dart)
│   └── lib/
│       ├── screens/      # Screen widgets organized by feature
│       ├── services/     # API, auth, network, storage services
│       └── models/       # Data models with JSON serialization
├── shared/               # Shared TypeScript type definitions
├── docker/               # Dockerfiles and nginx config
└── docs/                 # This documentation
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **API Runtime** | Node.js | 20+ |
| **API Framework** | Express.js | 4.21 |
| **Language (API/Admin)** | TypeScript | 5.8 |
| **Database** | PostgreSQL | 16 |
| **Migrations** | node-pg-migrate | 7.9 |
| **Authentication** | Better-Auth | 1.5 |
| **Admin Framework** | React | 19.0 |
| **Admin Build Tool** | Vite | 6.2 |
| **Admin State** | TanStack React Query | 5.69 |
| **Mobile Framework** | Flutter | 3.10+ |
| **Mobile Language** | Dart | 3.10+ |
| **Mobile HTTP** | Dio | 5.9 |
| **Mobile State** | Provider | 6.1 |
| **Reverse Proxy** | nginx | alpine |
| **Containerization** | Docker + Compose | v2 |

## Data Flow

### Cleaning Session Lifecycle

1. **Reservation imported** — iCal sync pulls Airbnb bookings into the `reservations` table
2. **Session created** — Triggered manually, by iCal checkout date, or by a smart lock event
3. **Cleaner assigned** — Auto-assigned to primary cleaner or left open for claiming
4. **Session accepted** — Cleaner accepts or claims the session via mobile app
5. **Cleaning started** — Cleaner begins work (requires local WiFi if configured)
6. **Room-by-room workflow** — Before photos → task checklist → after photos for each room
7. **Session submitted** — Cleaner finishes and optionally rates guest cleanliness
8. **Session reviewed** — Admin approves or rejects with feedback

### Session State Machine

```
pending → accepted → in_progress → submitted → approved
                                             → rejected
```

## External Integrations

| Integration | Purpose | Mechanism |
|-------------|---------|-----------|
| **Airbnb** | Import bookings | iCal feed sync |
| **Home Assistant** | Smart lock triggers | Webhook receiver |
| **Expo** | Push notifications | Expo Push API |

## Security Model

- **Authentication**: Better-Auth with bcrypt password hashing (12 rounds)
- **Sessions**: HTTP-only cookies with database-backed session storage
- **Authorization**: Role-based access control (owner > admin > cleaner > guest)
- **Property isolation**: Cleaners can only access their assigned properties
- **Rate limiting**: Guest endpoints rate-limited (10 req/min per IP)
- **Security headers**: Helmet.js for CSP, X-Frame-Options, etc.
- **CORS**: Configurable allowed origins
- **Webhook auth**: Shared secret header validation
