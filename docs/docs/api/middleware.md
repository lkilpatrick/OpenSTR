# API Middleware

The API uses both global middleware and route-level middleware for security, authentication, and authorization.

## Global Middleware

Applied to all requests in `api/src/index.ts`:

### Helmet

```typescript
app.use(helmet());
```

Adds security headers including:

- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- And other security-related headers

### CORS

```typescript
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

- **Development**: Allows `localhost` origins automatically
- **Production**: Configure via `ALLOWED_ORIGINS` env var (comma-separated)
- Credentials enabled for cookie-based authentication

### JSON Body Parser

```typescript
app.use(express.json());
```

Parses JSON request bodies.

### Cookie Parser

```typescript
app.use(cookieParser());
```

Parses session cookies for Better-Auth session management.

!!! note
    Better-Auth routes are registered **before** the JSON parser, as Better-Auth handles its own body parsing.

### Static File Serving

```typescript
app.use('/photos', express.static(PHOTO_STORAGE_PATH));
```

Serves uploaded photos from the configured storage path.

---

## Authentication Middleware

**File**: `api/src/middleware/auth.ts`

### `requireAuth()`

Validates the current session and populates `req.user`.

**Behavior:**

1. Reads session token from cookies or `Authorization: Bearer` header
2. Validates against Better-Auth session store
3. Queries user's assigned properties from `property_cleaners` table
4. Sets `req.user` with:
    - `userId` — User's ID
    - `role` — User's role (owner/admin/cleaner/guest)
    - `propertyIds` — Array of property IDs the user is assigned to

**Response on failure:** `401 Unauthorized`

### `requireRole(...roles: string[])`

Enforces role-based access control.

**Behavior:**

1. Reads `req.user.role` (set by `requireAuth`)
2. Checks if the user's role is in the allowed list
3. Returns `403 Forbidden` if the role is not permitted

**Usage examples:**

```typescript
// Only owners can create properties
router.post('/', requireAuth(), requireRole('owner'), createProperty);

// Owners and admins can manage users
router.get('/', requireAuth(), requireRole('owner', 'admin'), listUsers);
```

### `requirePropertyAccess(paramName: string)`

Restricts cleaners to their assigned properties.

**Behavior:**

1. If user is `owner` or `admin` — access granted (full access)
2. If user is `cleaner` — checks if the property ID from the route parameter is in `req.user.propertyIds`
3. Returns `403 Forbidden` if the cleaner is not assigned to the property

**Usage example:**

```typescript
// Cleaners can only see rooms for their assigned properties
router.get('/:propertyId/rooms',
  requireAuth(),
  requirePropertyAccess('propertyId'),
  listRooms
);
```

---

## Rate Limiting

Guest-facing endpoints use a simple in-memory rate limiter:

- **Limit**: 10 requests per minute per IP address
- **Applied to**: `POST /guest/:propertySlug/issues` and `POST /guest/:propertySlug/messages`
- **Response on limit**: `429 Too Many Requests`

This is implemented inline in the guest route handler rather than as separate middleware.

---

## Middleware Application Order

The middleware is applied in this order in `index.ts`:

1. `helmet()` — Security headers
2. `cors()` — CORS configuration
3. **Better-Auth handler** — Auth endpoint routes (`/api/auth/*`)
4. `express.json()` — JSON body parsing
5. `cookieParser()` — Cookie parsing
6. Static file serving (`/photos/*`)
7. Route handlers (with `requireAuth`, `requireRole`, `requirePropertyAccess` as needed)
