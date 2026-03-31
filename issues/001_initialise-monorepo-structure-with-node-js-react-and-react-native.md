---
title: "Initialise monorepo structure with Node.js, React, and React Native"
milestone: "M1: Repo & Infrastructure"
labels: ["infrastructure", "setup"]
---

# Initialise monorepo structure with Node.js, React, and React Native

**Milestone:** M1: Repo & Infrastructure
**Labels:** infrastructure, setup

## Dependencies
- None

## Overview
Set up the GitHub monorepo with the correct folder structure for all three apps. This is the foundation every other issue depends on.

## Folder Structure
```
/
├── api/          # Node.js + Express backend
├── admin/        # React + Vite admin panel
├── mobile/       # React Native (Expo) mobile app
├── shared/       # Shared TypeScript types and utilities
├── docker/       # Docker config files
├── .github/      # GitHub Actions workflows
├── docker-compose.yml
└── README.md
```

## Tasks
- [ ] Initialise repo with the above folder structure
- [ ] Add root `package.json` with workspaces
- [ ] Add `.gitignore` covering Node, Expo, and environment files
- [ ] Add root `README.md` with project overview and setup instructions
- [ ] Initialise `api/` with Express + TypeScript (`tsconfig.json`, `package.json`)
- [ ] Initialise `admin/` with Vite + React + TypeScript
- [ ] Initialise `mobile/` with Expo (React Native + TypeScript)
- [ ] Add `shared/types/` with initial TypeScript interfaces (Property, User, Room, Task)
- [ ] Confirm all three apps start without errors (`npm run dev` in each)

## Acceptance Criteria
- [ ] `git clone` + `npm install` from root works cleanly
- [ ] All three apps start locally without errors
- [ ] `.env.example` files present in `api/`, `admin/`, `mobile/`
- [ ] README documents the local setup process
