# Admin Panel Overview

<img src="https://openstr.dev/static/5df23647643e45f110fe4b1bf8868631/a2e28/Insidepool.webp" alt="Luxury rental property interior" class="hero-image-sm">

The OpenSTR Admin Panel is a **React 19** single-page application for property managers to oversee cleaning operations, manage teams, review sessions, and handle guest communications.

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| UI Framework | React | 19.0 |
| Build Tool | Vite | 6.2 |
| Language | TypeScript | 5.8 |
| Routing | React Router | 7.4 |
| Server State | TanStack React Query | 5.69 |
| HTTP Client | Axios | 1.8 |
| Authentication | Better-Auth | 1.5 |

## Project Structure

```
admin/
├── src/
│   ├── main.tsx                   # Entry point, renders App into #root
│   ├── App.tsx                    # Router, auth guard, QueryClient
│   ├── components/
│   │   ├── Layout.tsx             # Sidebar + content layout
│   │   └── PropertySwitcher.tsx   # Property context dropdown
│   ├── hooks/
│   │   └── useAuth.ts            # Auth state hook
│   ├── lib/
│   │   ├── auth-client.ts        # Better-Auth client
│   │   └── api.ts                # Axios instance + 401 interceptor
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── CleaningsPage.tsx
│       ├── ChecklistsPage.tsx
│       ├── IssuesPage.tsx
│       ├── CleanersPage.tsx
│       ├── StandardsPage.tsx
│       ├── PropertiesPage.tsx
│       ├── TeamPage.tsx
│       └── MessagesPage.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Key Features

- **Multi-property management** — property switcher persists selection across pages
- **Calendar dashboard** — monthly calendar with upcoming stays and cleaning sessions
- **Session review** — before/after photo comparison with task checklist verification
- **Team management** — create/edit users, assign cleaning rates, activate/deactivate
- **Cleaner analytics** — performance stats, pay tracking, and priority assignments
- **Checklist builder** — drag-and-drop room task management
- **Standards system** — reusable cleaning templates that push to properties
- **Issue tracking** — severity-based issue workflow
- **Guest messages** — inbox for guest communications

## Running the Admin Panel

### Development

```bash
cd admin
npm install
npm run dev          # Starts on http://localhost:5173
```

The Vite dev server proxies API requests:

- `/api` → `http://localhost:3000` (with path rewrite)
- `/photos` → `http://localhost:3000/photos`

### Production Build

```bash
cd admin
npm run build        # Output to dist/
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | API server base URL |

### Vite Configuration

The dev server is configured with:

- React plugin for JSX transformation
- API proxy for local development
- Path alias: `@openstr/shared` → `../shared/index.ts`

### TypeScript

- Target: ES2020
- Strict mode enabled
- No unused locals or parameters allowed

## State Management

### Server State — TanStack React Query

All API data is managed through React Query:

- `useQuery()` for data fetching with automatic caching
- `useMutation()` for create/update/delete operations
- `QueryClient` manages cache invalidation
- Auto-refetch on window focus

### Application State — React Context

- `PropertyContext` holds the selected property ID
- `useSelectedProperty()` hook provides property selection to all pages
- Selection persisted in `localStorage`

### Local State

Individual page components use `useState()` for UI state (form inputs, filters, modals, expansion states).

## Styling

The admin panel uses **inline CSS styles** (React `style` props) with no external CSS framework:

- Dark sidebar: `#1e293b` (slate-800)
- Light main area: `#f8fafc` (slate-50)
- Primary buttons: `#3b82f6` (blue-500)
- Card design: white background, border-radius, subtle box shadows
- Status badges with semantic colors (green/amber/red)

## Authentication Flow

1. User enters credentials on the login page
2. `useAuth()` hook calls `authClient.signIn.email()`
3. Session established via Better-Auth (cookies)
4. `PrivateRoute` wrapper checks session on each navigation
5. Axios interceptor redirects to `/login` on `401` responses

## Shared Types

The admin panel imports TypeScript type definitions from `@openstr/shared`:

- `User`, `Property`, `Room`, `Task`
- `CleanSession`, `Reservation`
- `SessionStatus`, `PropertyType`, `UserRole`
