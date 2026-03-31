---
title: "Write public-facing README with self-hosting setup guide"
milestone: "M12: Open Source Release"
labels: ["open-source", "documentation"]
---

# Write public-facing README with self-hosting setup guide

**Milestone:** M12: Open Source Release
**Labels:** open-source, documentation

## Dependencies
- Depends on #2
- Depends on #33

## Overview
The README is the front door of OpenSTR. It needs to work for two audiences: a non-technical Airbnb host who wants to understand if this is for them, and a developer who wants to set it up. The base README is provided in `oss-files/README.md`.

## Tasks

### Populate the README
- [ ] Copy `oss-files/README.md` to repo root
- [ ] Fill in all `[your-username]` and `[Your Name]` placeholders
- [ ] Add real screenshots once the UI is built (placeholder section exists)

### Add Badges to README header
Add these badges at the very top:
```markdown
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Self-hosted](https://img.shields.io/badge/deployment-self--hosted-teal)](https://github.com/[your-username]/openstr)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
```

### Additional Docs Pages
Create these in `docs/`:
- [ ] `docs/home-assistant-setup.md` — step-by-step HA webhook configuration
- [ ] `docs/ical-setup.md` — how to get your Airbnb iCal URL
- [ ] `docs/adding-a-property.md` — walkthrough of the property setup wizard
- [ ] `docs/mobile-app-setup.md` — how cleaners install and set up the app

### `api/README.md`
Document the API:
- [ ] Available endpoints overview
- [ ] Auth flow
- [ ] Environment variables reference

## Acceptance Criteria
- [ ] README renders correctly on GitHub with no broken links
- [ ] Docker quick-start instructions work on a fresh machine (test this!)
- [ ] All 4 docs pages exist with at least skeleton content
- [ ] Badges display correctly
