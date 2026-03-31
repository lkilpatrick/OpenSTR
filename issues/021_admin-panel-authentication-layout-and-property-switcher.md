---
title: "Admin panel: authentication, layout, and property switcher"
milestone: "M7: Admin Panel — Core"
labels: ["admin", "frontend"]
---

# Admin panel: authentication, layout, and property switcher

**Milestone:** M7: Admin Panel — Core
**Labels:** admin, frontend

## Dependencies
- Depends on #8

## Overview
Build the admin panel shell — login, navigation, and the property switcher that scopes all views.

## Layout
- **Left sidebar nav**: Dashboard | Sessions | Schedule | Checklists | Cleaners | Issues | Messages | Settings
- **Top bar**: Property switcher dropdown + user menu
- **Main content area**: changes based on selected nav item
- **Property switcher**: "All Properties" (owner) or specific property (admin/cleaner scoped)

## Ocean Theme
- Sidebar: dark teal (#095F67) with white text
- Active nav item: teal (#0D7E8A)
- Top bar: white with teal accents
- Consistent with mobile app colour tokens

## Tasks
- [ ] Login page (email + password)
- [ ] Sidebar navigation component
- [ ] Top bar with property switcher
- [ ] Route protection — redirect to login if unauthenticated
- [ ] Role-based nav — certain items hidden for non-owner roles
- [ ] Responsive layout (works at 1280px min width)
- [ ] React Query setup for server state management

## Acceptance Criteria
- [ ] Login works and stores JWT
- [ ] Property switcher filters all subsequent API calls
- [ ] Owner sees "All Properties" option; admin sees only assigned properties
- [ ] Sidebar highlights active route
- [ ] Ocean theme consistent with mobile app
