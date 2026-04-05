# Production Deployment

<img src="https://openstr.dev/static/df9ff8b2cd5112a505e312a5e814bbea/a2e28/sunrise.webp" alt="Property at sunrise — ready for production" class="hero-image-sm">

OpenSTR is designed to self-host on a Linux server using Docker.

## Prerequisites

- **Linux server** (Ubuntu 22.04+ recommended)
- **Docker + Docker Compose v2**
- A **domain name** pointing to your server (for SSL)
- Ports **80** and **443** open

## 1. Clone and Configure

```bash
git clone https://github.com/lkilpatrick/OpenSTR.git
cd OpenSTR
cp .env.production.example .env.production
nano .env.production   # Fill in DOMAIN, passwords, secrets
```

### Generate Secrets

```bash
openssl rand -base64 32   # Use for JWT_SECRET
openssl rand -base64 32   # Use for JWT_REFRESH_SECRET
openssl rand -base64 32   # Use for BETTER_AUTH_SECRET
```

## 2. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:

- Build the API, admin panel, and mobile web app as Docker containers
- Start PostgreSQL, the API, and nginx with SSL
- Run database migrations
- Generate a self-signed cert if no SSL certs exist yet

## 3. Set Up SSL (Recommended)

```bash
./deploy.sh --ssl        # Automated Let's Encrypt certificate
```

## 4. Seed Data

```bash
./deploy.sh --seed-demo  # Generic demo data
```

## 5. Access Your Instance

| Service | URL |
|---------|-----|
| Admin panel | `https://yourdomain.com` |
| Mobile web app | `https://yourdomain.com/app/` |
| API | `https://yourdomain.com/api/` |

## Docker Compose Services

The production stack (`docker-compose.prod.yml`) runs:

| Service | Image | Purpose |
|---------|-------|---------|
| `postgres` | `postgres:16-alpine` | PostgreSQL database |
| `api` | Custom (Dockerfile) | Express API server |
| `nginx` | `nginx:alpine` | Reverse proxy, SSL termination, static file serving |

## Management Commands

```bash
./deploy.sh --update     # Pull latest, rebuild, migrate, restart
./deploy.sh --logs       # Tail container logs
./deploy.sh --stop       # Stop all services
```

## Network-Aware Mobile App

The mobile app detects whether the cleaner is on your local WiFi or accessing remotely:

- **Remote access**: Can view schedule, accept assignments, view history
- **Local WiFi only**: Can start and continue cleaning sessions

This is enforced by nginx's `geo` module, which tags requests with an `X-Is-Local` header based on the client's IP range. The mobile app calls `/api/network-check` to detect its status.

## Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | PostgreSQL data persistence |
| `photos` | Uploaded cleaning photos |

!!! warning "Backup your volumes"
    Make sure to back up both `postgres_data` and `photos` volumes regularly. These contain all your property data and cleaning evidence photos.
