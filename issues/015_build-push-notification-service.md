---
title: "Build push notification service"
milestone: "M4: Session Engine"
labels: ["backend", "notifications"]
---

# Build push notification service

**Milestone:** M4: Session Engine
**Labels:** backend, notifications

## Dependencies
- Depends on #13

## Overview
Send push notifications to cleaners via Expo Push API. All decisions Q3 are implemented here: both night-before and morning-of reminders.

## Notification Events
| Trigger | Recipient | Message |
|---------|-----------|---------|
| Session created/activated | Primary cleaner | "A clean is ready at [Property Name]" |
| Night before checkout (8pm) | Assigned cleaner | "Reminder: You have a clean tomorrow at [Property Name]" |
| Morning of checkout (7am) | Assigned cleaner | "Good morning! Your clean at [Property Name] starts today" |
| Session rejected | Cleaner | "Your clean at [Property Name] was sent back: [reason]" |
| Standard task auto-pushed | Admin | "Cleaning standard updated — [N] tasks changed across [M] properties" |

## Implementation
- Install: `expo-server-sdk`
- Create `api/src/services/notifications.ts`
- Cron jobs:
  - `0 20 * * *` — night before reminder (check tomorrow's checkouts)
  - `0 7 * * *` — morning of reminder (check today's checkouts)
- Handle Expo push receipts — remove invalid tokens from DB

## Tasks
- [ ] Install `expo-server-sdk`
- [ ] Create notification service with all event types
- [ ] Add night-before cron job
- [ ] Add morning-of cron job
- [ ] Graceful handling of invalid push tokens (remove from user record)
- [ ] `POST /admin/notifications/test` — send test notification (admin only)

## Acceptance Criteria
- [ ] Cleaner receives push notification when session is created
- [ ] Night-before reminder fires at 8pm the evening before a checkout
- [ ] Morning reminder fires at 7am on checkout day
- [ ] Invalid push tokens are removed and do not cause repeated errors
- [ ] Notifications include property name (cleaner knows which property)
