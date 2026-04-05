# API Overview

The OpenSTR API is a **Node.js/Express** backend built with **TypeScript** that provides a complete REST API for short-term rental cleaning management.

<div class="before-after">
  <figure>
    <img src="https://openstr.dev/static/5c9f86bc4945a62b711d7f9efaca4b93/a2e28/Cleaningb4.webp" alt="Room before cleaning">
    <figcaption>Guest checks out</figcaption>
  </figure>
  <figure>
    <img src="https://openstr.dev/static/e962a6df22182adbd6be5357addb97dd/a2e28/cleaningafter.webp" alt="Room after cleaning">
    <figcaption>API coordinates the clean</figcaption>
  </figure>
</div>

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20+ |
| Framework | Express.js | 4.21 |
| Language | TypeScript | 5.8 |
| Database | PostgreSQL | 16 |
| Auth | Better-Auth | 1.5 |
| Migrations | node-pg-migrate | 7.9 |
| File uploads | Multer | 1.4 |
| Push notifications | Expo Push API | — |

## Project Structure

```
api/
├── src/
│   ├── index.ts                 # Express app entry point
│   ├── db/
│   │   ├── pool.ts              # PostgreSQL connection pool
│   │   ├── seed.ts              # Production seed script
│   │   ├── seed-demo.ts         # Demo data seed script
│   │   └── seeds/               # Seed data templates
│   ├── lib/
│   │   └── auth.ts              # Better-Auth configuration
│   ├── middleware/
│   │   └── auth.ts              # Auth & authorization middleware
│   ├── routes/
│   │   ├── properties.ts        # Property & room CRUD
│   │   ├── users.ts             # User management & cleaner assignment
│   │   ├── sessions.ts          # Clean session state machine
│   │   ├── photos.ts            # Photo uploads & task completion
│   │   ├── ical.ts              # Airbnb iCal sync
│   │   ├── webhook.ts           # Home Assistant integration
│   │   ├── notifications.ts     # Push notifications
│   │   ├── issues.ts            # Issue reporting
│   │   ├── messages.ts          # Guest messages
│   │   ├── cleaners.ts          # Cleaner analytics
│   │   ├── guest.ts             # Public guest endpoints
│   │   └── standards.ts         # Cleaning standard templates
│   ├── services/
│   │   ├── ical.ts              # iCal parsing service
│   │   └── notifications.ts     # Expo push notification service
│   └── utils/                   # Utility functions
├── migrations/                  # Database migration files
├── uploads/                     # Uploaded photo storage
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Key Features

- **Multi-role system** — Owner, Admin, Cleaner, and Guest roles with hierarchical permissions
- **Session state machine** — Strict workflow transitions (pending → accepted → in_progress → submitted → approved/rejected)
- **Automatic iCal sync** — Pulls Airbnb bookings and creates cleaning sessions
- **Home Assistant integration** — Smart lock events trigger cleaning sessions automatically
- **Task completion tracking** — Per-room checklists with before/after photo evidence
- **Supply management** — Alert system for low-stock supplies
- **Cleaner analytics** — Performance metrics, compliance scores, and comparison tools
- **Push notifications** — Expo-based notifications to mobile cleaners
- **Guest interface** — Public property guides, issue reporting, and messaging
- **Rate limiting** — In-memory throttling on guest-facing endpoints

## Running the API

### Development

```bash
cd api
npm install
npm run dev          # Start with hot-reload (tsx watch)
```

### Production

```bash
cd api
npm run build        # Compile TypeScript
npm start            # Run compiled JavaScript
```

### Testing

```bash
cd api
npm test             # Run Jest test suite
```

Test files exist for all route modules:

- `auth.test.ts`, `properties.test.ts`, `users.test.ts`, `sessions.test.ts`
- `photos.test.ts`, `ical.test.ts`, `webhook.test.ts`, `notifications.test.ts`
- `issues.test.ts`, `messages.test.ts`, `cleaners.test.ts`, `guest.test.ts`
- `standards.test.ts`

### Database

```bash
cd api

# Run migrations
npx node-pg-migrate up --database-url-var DATABASE_URL

# Seed demo data
npm run db:seed:demo

# Create new migration
npx node-pg-migrate create migration-name --database-url-var DATABASE_URL
```

## Dependencies

### Core

| Package | Purpose |
|---------|---------|
| `express` | HTTP server framework |
| `pg` | PostgreSQL client |
| `better-auth` | Session & credential authentication |
| `bcrypt` | Password hashing |
| `multer` | Multipart file upload handling |
| `helmet` | Security headers |
| `cors` | Cross-origin resource sharing |
| `cookie-parser` | Cookie parsing |
| `dotenv` | Environment variable loading |
| `node-pg-migrate` | Database migration runner |

### Dev

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `tsx` | TypeScript execution with hot-reload |
| `jest` / `ts-jest` | Testing framework |
| `supertest` | HTTP assertion library |
