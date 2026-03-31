---
title: "Build Home Assistant webhook receiver — August lock trigger"
milestone: "M4: Session Engine"
labels: ["backend", "integrations", "home-assistant"]
---

# Build Home Assistant webhook receiver — August lock trigger

**Milestone:** M4: Session Engine
**Labels:** backend, integrations, home-assistant

## Dependencies
- Depends on #11

## Overview
Receive webhook events from Home Assistant when the August lock is opened. Per decision Q14, both the BNB and the Residence use the same lock/HA system.

## Behaviour
- Lock event fires → check if it falls within the configured time window
- If within window AND a reservation checkout is today → activate/create session
- iCal is the primary trigger; lock is a confirmation signal and backup
- The residence uses the same lock — differentiated by `property_id` in the payload

## Endpoint
```
POST /webhooks/lock-event
```

### Expected Payload
```json
{
  "property_id": "uuid",
  "event_type": "lock_opened",
  "timestamp": "2026-03-30T11:23:00Z",
  "entity_id": "lock.august_front_door"
}
```

### Webhook Security
- Shared secret header: `X-HA-Webhook-Secret`
- Validate against `WEBHOOK_SECRET` env var
- Return 200 immediately (process async) to avoid HA timeout

### Processing Logic
1. Validate payload and secret
2. Check `property.session_trigger_time` window (±2 hours of configured time)
3. Find today's reservation for the property
4. If active session exists → log event (already running)
5. If pending session exists → activate it, assign cleaner, notify
6. If no session → create and activate, assign cleaner, notify

## Tasks
- [ ] Create `POST /webhooks/lock-event` endpoint
- [ ] Implement time-window validation
- [ ] Async processing queue (or simple async handler with error logging)
- [ ] Home Assistant configuration example in `/docs/home-assistant-setup.md`
- [ ] Unit tests for time-window edge cases

## Acceptance Criteria
- [ ] Request with invalid secret returns 403
- [ ] Lock event outside time window is logged but does not create a session
- [ ] Lock event within window and matching checkout creates/activates session
- [ ] HA receives 200 within 500ms (async processing)
- [ ] Both properties (BNB + Residence) handled via `property_id` in payload
