---
title: "Guest web page: property guide, issue reporting, and owner contact"
milestone: "M9: Guest Web Link"
labels: ["frontend", "guest"]
---

# Guest web page: property guide, issue reporting, and owner contact

**Milestone:** M9: Guest Web Link
**Labels:** frontend, guest

## Dependencies
- Depends on #6
- Depends on #9

## Overview
A simple public web page (no account needed — per decision Q7) that guests can access via a link in their Airbnb welcome message. Built as a standalone page within the admin React app or as a simple separate route.

## URL Structure
`/guest/{property_slug}` — publicly accessible, no auth required

## Page Sections

### 1. Property Guide
- Property name and welcome message (configured by admin)
- House rules (configured by admin)
- Check-in / check-out instructions (static, admin configured)
- WiFi password (admin configured)

### 2. Report an Issue
- Room selector (dropdown)
- Description (textarea)
- Severity: Low | Medium | High
- Optional photo upload
- Contact name (optional)
- Submit → creates `issues` record with reporter identified as "guest"

### 3. Contact Owner
- Subject + message fields
- Contact name + email (optional)
- Submit → creates `guest_messages` record

## Backend
```
GET  /guest/:propertySlug          — fetch public property guide data
POST /guest/:propertySlug/issues   — submit issue (no auth)
POST /guest/:propertySlug/messages — submit message (no auth)
```

## Tasks
- [ ] Public guest page route
- [ ] Property guide section
- [ ] Issue report form with photo upload
- [ ] Contact form
- [ ] Public API endpoints (rate-limited: 10 req/min per IP)
- [ ] Admin screen to configure guide content (property name, rules, instructions)
- [ ] Ocean theme applied

## Acceptance Criteria
- [ ] Page accessible without login at `/guest/{slug}`
- [ ] Issue and message submissions appear in admin inbox
- [ ] Rate limiting prevents abuse
- [ ] Photo upload works from mobile browser
