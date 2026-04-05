# Admin Panel Components

Reusable components shared across the admin panel pages.

## Layout

**File**: `admin/src/components/Layout.tsx`

The master layout wrapper that provides the sidebar navigation and content area for all authenticated pages.

### Structure

- **Sidebar** (fixed 220px width, dark theme `#1e293b`)
    - App title
    - User name display
    - 9 navigation links:
        - Dashboard
        - Cleanings
        - Team
        - Checklists
        - Issues
        - Messages
        - Cleaner Pay
        - Standards
        - Properties
    - Sign-out button
- **Content area** (flex-grow, light background `#f8fafc`)
    - `<Outlet />` renders the current page component

### Usage

Applied as the layout route wrapper in `App.tsx`. All authenticated pages render inside this layout.

---

## PropertySwitcher

**File**: `admin/src/components/PropertySwitcher.tsx`

A dropdown component that lets the user switch between properties, scoping all page data to the selected property.

### Features

- Dropdown select populated from `GET /properties`
- Stores selection in `localStorage` (`selectedPropertyId` key)
- Auto-selects the first property if none is stored
- Provides context via `PropertyContext` and `useSelectedProperty()` hook

### Context API

```typescript
// PropertyContext provides:
{
  propertyId: string | null;       // Currently selected property ID
  selectProperty: (id: string) => void;  // Change selection
}
```

### Hook

```typescript
const { propertyId, selectProperty } = useSelectedProperty();
```

Used by page components to scope their API queries to the selected property.

### Provider

The `PropertyProvider` wraps all authenticated routes in `App.tsx`, ensuring the property context is available to all pages.

---

## Auth Hook

**File**: `admin/src/hooks/useAuth.ts`

Custom React hook that wraps Better-Auth session management.

### Returned Values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `object \| null` | Current user (id, name, email, role) |
| `isAuthenticated` | `boolean` | Whether user has an active session |
| `isPending` | `boolean` | Whether session check is in progress |
| `isOwnerOrAdmin` | `boolean` | Whether user is owner or admin role |
| `login(email, password)` | `function` | Sign in with credentials |
| `logout()` | `function` | Sign out and clear session |

### Usage

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

---

## API Client

**File**: `admin/src/lib/api.ts`

Axios instance configured for API communication.

### Configuration

| Setting | Value |
|---------|-------|
| Base URL | `VITE_API_URL` env var (default: `http://localhost:3000`) |
| Credentials | `withCredentials: true` (sends cookies) |
| 401 handler | Redirects to `/login` |

### Interceptor

A response interceptor catches `401 Unauthorized` responses and redirects the user to the login page, handling session expiry automatically.

### Usage

```typescript
import api from '../lib/api';

// GET request
const { data } = await api.get('/sessions?property_id=' + propertyId);

// POST request
await api.post('/sessions', { property_id: propertyId, ... });

// PATCH request
await api.patch(`/sessions/${id}/status`, { status: 'approved' });
```

---

## Auth Client

**File**: `admin/src/lib/auth-client.ts`

Better-Auth client instance for the admin panel.

### Configuration

- Base URL: `VITE_API_URL` env var
- Provider: Email + password (credentials)
- Session management via HTTP-only cookies

### Key Methods

| Method | Description |
|--------|-------------|
| `authClient.signIn.email({ email, password })` | Login |
| `authClient.signOut()` | Logout |
| `authClient.useSession()` | React hook for session state |
