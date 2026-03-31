---
title: "Set up Docker Compose for local development (API + PostgreSQL + Nginx)"
milestone: "M1: Repo & Infrastructure"
labels: ["infrastructure", "docker"]
---

# Set up Docker Compose for local development (API + PostgreSQL + Nginx)

**Milestone:** M1: Repo & Infrastructure
**Labels:** infrastructure, docker

## Dependencies
- Depends on #1

## Overview
Create the Docker Compose configuration that runs the full stack locally on the Linux server. This should be a single `docker-compose up` to get everything running.

## Services Required
| Service | Image | Port |
|---------|-------|------|
| api | Node.js (custom Dockerfile) | 3000 |
| postgres | postgres:16-alpine | 5432 |
| nginx | nginx:alpine | 80 / 443 |
| adminer | adminer (dev only) | 8080 |

## Tasks
- [ ] Create `docker/api/Dockerfile` (Node 20 Alpine, non-root user)
- [ ] Create `docker-compose.yml` with all four services
- [ ] Create `docker-compose.prod.yml` override for production (no adminer, restart policies)
- [ ] Add named volumes for postgres data and photo storage (`/photos`)
- [ ] Add `docker/nginx/nginx.conf` with reverse proxy to API and admin panel
- [ ] Add health checks for postgres and api services
- [ ] Add `.env.example` with all required variables:
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - `PHOTO_STORAGE_PATH`
  - `PORT`

## Acceptance Criteria
- [ ] `docker-compose up` starts all services cleanly
- [ ] API health check endpoint `GET /health` returns 200
- [ ] Postgres is reachable from the API container
- [ ] Photo volume persists between container restarts
- [ ] `docker-compose down -v` cleanly removes all containers and volumes
