# Authentication

OpenSTR uses **Better-Auth** for authentication across all clients, with bcrypt password hashing and database-backed sessions.

## Overview

| Aspect | Implementation |
|--------|---------------|
| **Library** | Better-Auth 1.5.6 |
| **Password hashing** | Bcrypt (12 rounds) |
| **Session storage** | PostgreSQL `session` table |
| **Token delivery** | HTTP-only cookies + Bearer token header |
| **User roles** | `owner`, `admin`, `cleaner`, `guest` |

## Authentication Flow

### Login (Admin Panel)

1. User submits email/password on the login form
2. Better-Auth client calls `POST /api/auth/sign-in/email`
3. Server validates credentials against the `account` table (bcrypt comparison)
4. Creates a session in the `session` table
5. Returns session cookie (HTTP-only)
6. Admin panel stores session and redirects to dashboard

### Login (Mobile App)

1. User submits email/password on the login screen
2. `AuthService.login()` calls `POST /api/auth/sign-in/email`
3. Server returns JWT token + user object
4. Token stored securely:
    - **iOS**: Keychain via `flutter_secure_storage`
    - **Android**: Keystore via `flutter_secure_storage`
    - **Web**: `SharedPreferences`
5. All subsequent API calls include `Authorization: Bearer <token>` header

### Session Persistence

On app cold start, the mobile app:

1. Retrieves stored token from secure storage
2. Calls `GET /api/auth/get-session` to validate
3. If valid, populates user state and shows main screen
4. If invalid/expired, clears token and shows login screen

## Authorization

### Middleware Chain

The API uses three middleware functions for authorization:

```
requireAuth() → requireRole() → requirePropertyAccess()
```

#### `requireAuth()`

- Validates Better-Auth session from cookies or Bearer token
- Populates `req.user` with `{ userId, role, propertyIds }`
- Returns `401 Unauthorized` if no valid session

#### `requireRole(...roles)`

- Checks `req.user.role` against the allowed roles
- Returns `403 Forbidden` if role is not permitted
- Example: `requireRole('owner', 'admin')` restricts to owners and admins

#### `requirePropertyAccess(paramName)`

- For cleaners: verifies the requested property is in their assigned properties
- Owners and admins bypass this check (full access)
- Returns `403 Forbidden` if cleaner is not assigned to the property

### Role Permissions

| Capability | Owner | Admin | Cleaner | Guest |
|-----------|-------|-------|---------|-------|
| Manage properties | ✅ | ❌ | ❌ | ❌ |
| Create/edit users | ✅ | ✅ | ❌ | ❌ |
| Create sessions | ✅ | ✅ | ❌ | ❌ |
| Accept/claim sessions | ❌ | ❌ | ✅ | ❌ |
| Execute cleaning workflow | ❌ | ❌ | ✅ | ❌ |
| Review sessions | ✅ | ✅ | ❌ | ❌ |
| View all sessions | ✅ | ✅ | ❌ | ❌ |
| View own sessions | ✅ | ✅ | ✅ | ❌ |
| Manage standards | ✅ | ❌ | ❌ | ❌ |
| View property guide | ✅ | ✅ | ✅ | ✅ |
| Report issues | ✅ | ✅ | ✅ | ✅ |
| Send messages | ❌ | ❌ | ❌ | ✅ |

## Security Configuration

### Better-Auth Setup

```typescript
// Configured in api/src/lib/auth.ts
{
  database: pool,                    // PostgreSQL connection
  secret: BETTER_AUTH_SECRET,        // Session signing secret
  emailAndPassword: {
    enabled: true,
    hashFunction: bcrypt (12 rounds)
  }
}
```

### CORS

- Development: localhost origins allowed automatically
- Production: set `ALLOWED_ORIGINS` env var (comma-separated)
- Credentials (`withCredentials: true`) enabled for cookie-based auth

### 401 Handling

- **Admin panel**: Axios interceptor redirects to `/login` on 401
- **Mobile app**: Dio interceptor clears token and navigates to login screen
- Both clients treat 401 as "session expired, re-authenticate"
