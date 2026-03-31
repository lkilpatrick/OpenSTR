---
title: "Residence support: manual session scheduling and optional photo flow"
milestone: "M11: Multi-Property & Residence"
labels: ["backend", "mobile", "admin", "residence"]
---

# Residence support: manual session scheduling and optional photo flow

**Milestone:** M11: Multi-Property & Residence
**Labels:** backend, mobile, admin, residence

## Dependencies
- Depends on #13
- Depends on #17
- Depends on #30

## Overview
Finalise support for the Owner's Residence as a `private_home` property type. Key differences from BNB: manual scheduling, same lock/HA system, photos optional.

## Differences from BNB Flow

| Feature | My STR Property | Owner's Residence |
|---------|---------------|-------------------|
| Schedule trigger | iCal auto-create | Manual by admin |
| Lock trigger | Yes | Yes (same HA system) |
| Before/after photos | Required | Optional |
| Guest rating screen | Yes | No |
| iCal URL | Yes | No |
| Superhost tracker | Yes | No |

## Manual Scheduling (Admin → Schedule → Add Clean)
- Select property: Owner's Residence
- Select date + time
- Select cleaner from pool
- Select session type: Standard Clean | Deep Clean
- Optional notes
- Submit → creates session, notifies cleaner

## Residence Lock Trigger
- Same webhook as BNB (`POST /webhooks/lock-event`)
- `property_id` in payload differentiates residence from BNB
- If a session is scheduled for today → activates it
- If no session scheduled → optionally creates one (configurable)

## Mobile App Changes
- Residence sessions: before/after photo CTAs shown but marked "(Optional)"
- No guest rating screen after room completion
- "Submit Clean" goes straight to session summary

## Tasks
- [ ] Manual session creation API endpoint
- [ ] Admin "Add Clean" modal for residence
- [ ] Mobile app: photo optional flow for private_home sessions
- [ ] Mobile app: skip guest rating for private_home sessions
- [ ] Lock webhook handles residence property_id correctly
- [ ] Residence sessions excluded from Superhost calculations

## Acceptance Criteria
- [ ] Manual session created from admin panel and cleaner notified
- [ ] Residence lock event activates a scheduled session correctly
- [ ] Cleaner can submit residence session without any photos
- [ ] Compliance score still calculated for residence (based on tasks only)
- [ ] Residence sessions do not appear in Superhost tracker
