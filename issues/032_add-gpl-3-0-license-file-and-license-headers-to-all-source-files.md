---
title: "Add GPL-3.0 LICENSE file and license headers to all source files"
milestone: "M12: Open Source Release"
labels: ["open-source", "setup"]
---

# Add GPL-3.0 LICENSE file and license headers to all source files

**Milestone:** M12: Open Source Release
**Labels:** open-source, setup

## Dependencies
- Depends on #1

## Overview
Add the GPL-3.0 license and ensure every source file carries the correct license header. This is required before any public release.

## Tasks

### License File
- [ ] Copy `LICENSE` file to repo root (provided in `oss-files/LICENSE`)
- [ ] Verify copyright year and author name are filled in

### License Headers
Add the following header to the top of **every** `.ts` and `.tsx` source file across `api/`, `admin/`, and `mobile/`:

```ts
/**
 * OpenSTR — Open Source Short-Term Rental Management
 * Copyright (C) 2026 [Your Name]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * https://github.com/[your-username]/openstr
 */
```

### Automate with ESLint
- [ ] Install `eslint-plugin-notice`
- [ ] Configure it to enforce the license header on all `.ts` / `.tsx` files
- [ ] Add to CI — missing headers fail the lint check

### Files That Need Headers
- [ ] All files in `api/src/**/*.ts`
- [ ] All files in `admin/src/**/*.tsx`
- [ ] All files in `mobile/src/**/*.tsx`
- [ ] All files in `shared/**/*.ts`

## Acceptance Criteria
- [ ] `LICENSE` file present in repo root with correct author name and year
- [ ] All source files have the license header
- [ ] CI lint check fails if a new file is added without the header
- [ ] `package.json` in each app includes `"license": "GPL-3.0"`
