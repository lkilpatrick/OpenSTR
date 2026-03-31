---
title: "Add OpenSTR attribution notice to guest web page and mobile app About screen"
milestone: "M12: Open Source Release"
labels: ["open-source", "frontend", "mobile"]
---

# Add OpenSTR attribution notice to guest web page and mobile app About screen

**Milestone:** M12: Open Source Release
**Labels:** open-source, frontend, mobile

## Dependencies
- Depends on #28
- Depends on #16

## Overview
The GPL-3.0 license (with our additional attribution requirement) requires that any deployment accessible to users displays an OpenSTR credit. This issue implements that in all user-facing surfaces.

## Attribution Text Required
```
Powered by OpenSTR — created by [Your Name]
https://github.com/[your-username]/openstr
```

## Where to Add It

### 1. Guest Web Page Footer
- [ ] Add a small, unobtrusive footer to the guest web page (`/guest/:slug`)
- [ ] Teal text link: "Powered by OpenSTR" → links to GitHub repo
- [ ] Must be visible on mobile

### 2. Mobile App — About Screen
- [ ] Add "About OpenSTR" item to the Profile tab settings list
- [ ] About screen shows: version number, creator credit, GitHub link, GPL-3.0 license summary
- [ ] "View License" button → links to `https://www.gnu.org/licenses/gpl-3.0.html`

### 3. Admin Panel Footer
- [ ] Small footer in the admin panel sidebar bottom: "OpenSTR v{version} by [Your Name]"
- [ ] Links to GitHub repo

### 4. API Response Header
- [ ] Add `X-Powered-By: OpenSTR` response header to all API responses
- [ ] This is a minor technical signal, not the primary attribution

## Implementation Notes
- Version number should be pulled from `package.json` — do not hardcode
- Attribution links must be real, working URLs before public release

## Acceptance Criteria
- [ ] Guest web page footer visible on mobile with working link
- [ ] Mobile About screen accessible from Profile tab
- [ ] Admin panel footer credit present
- [ ] Attribution survives a CSS/theme change (not hidden by styling)
