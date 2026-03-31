---
title: "Mobile app: authentication screens and navigation structure"
milestone: "M5: Mobile App — Cleaner Core"
labels: ["mobile", "auth"]
---

# Mobile app: authentication screens and navigation structure

**Milestone:** M5: Mobile App — Cleaner Core
**Labels:** mobile, auth

## Dependencies
- Depends on #8

## Overview
Build the login screen and core navigation shell for the mobile app. Ocean theme throughout.

## Screens
- **Login screen** — email + password, ocean theme (teal/blue/white)
- **Main tab navigator** — 3 tabs: Schedule | Active Session | Profile
- **Loading/splash screen** — ocean wave animation or static

## Design Tokens (Ocean Theme)
```
Primary:   #0D7E8A (Teal)
Secondary: #1A5FA8 (Blue)
Background: #FFFFFF
Text:      #1A2332
Accent:    #E0F4F6 (Light Teal)
```

## Tasks
- [ ] Install: `expo-router` or `react-navigation`
- [ ] Create login screen with ocean theme
- [ ] Create tab navigator (Schedule | Active Session | Profile)
- [ ] Implement token storage with `expo-secure-store`
- [ ] Implement token refresh interceptor in API client (`axios`)
- [ ] Create shared `api/` client module with base URL from env
- [ ] Auto-redirect to login if token expired

## Acceptance Criteria
- [ ] Login with valid credentials navigates to Schedule tab
- [ ] Invalid credentials shows clear error message
- [ ] Token persists between app restarts
- [ ] Logged-out state returns to login screen
- [ ] Ocean colour theme applied consistently
