---
title: "Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server)"
milestone: "M1: Repo & Infrastructure"
labels: ["infrastructure", "ci-cd"]
---

# Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server)

**Milestone:** M1: Repo & Infrastructure
**Labels:** infrastructure, ci-cd

## Dependencies
- Depends on #1
- Depends on #2

## Overview
Automate testing and deployment. Push to `main` branch triggers a deploy to the local Linux server via SSH.

## Workflows Required

### 1. `ci.yml` — runs on every PR
- Lint (ESLint + Prettier) all packages
- TypeScript type-check all packages
- Run unit tests (Jest)

### 2. `deploy.yml` — runs on push to `main`
- SSH into Linux server
- `git pull`
- `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build`
- Run pending DB migrations
- Notify on success/failure

## Tasks
- [ ] Add `.github/workflows/ci.yml`
- [ ] Add `.github/workflows/deploy.yml`
- [ ] Add ESLint + Prettier config to root
- [ ] Set up GitHub Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_PATH`
- [ ] Add Jest config to `api/` package
- [ ] Add a smoke test: `GET /health` returns 200 after deploy

## Acceptance Criteria
- [ ] PR checks pass on a clean branch
- [ ] Push to `main` triggers deploy and completes without error
- [ ] Failed tests block the deploy
- [ ] Deployment is idempotent (running twice has no side effects)
