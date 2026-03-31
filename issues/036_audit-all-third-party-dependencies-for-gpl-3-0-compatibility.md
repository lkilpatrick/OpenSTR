---
title: "Audit all third-party dependencies for GPL-3.0 compatibility"
milestone: "M12: Open Source Release"
labels: ["open-source", "security", "legal"]
---

# Audit all third-party dependencies for GPL-3.0 compatibility

**Milestone:** M12: Open Source Release
**Labels:** open-source, security, legal

## Dependencies
- Depends on #1

## Overview
Before public release under GPL-3.0, verify that every dependency across all three apps is GPL-3.0 compatible. GPL requires that all linked libraries be GPL-compatible — MIT, Apache 2.0, BSD, and ISC are all compatible. LGPL is compatible. AGPL is compatible. Proprietary licenses are not.

## How to Audit

### Automated check
```bash
# Install license checker
npm install -g license-checker

# Run from each app directory
cd api && license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;PostgreSQL;Unlicense;CC0-1.0;0BSD;Python-2.0"
cd admin && license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Unlicense;CC0-1.0;0BSD"
cd mobile && license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Unlicense;CC0-1.0;0BSD"
```

### Manual review required for
- Any package flagged as unknown license
- Any package with a custom or proprietary license
- Any package with a CC-BY-NC clause (non-commercial restrictions conflict with GPL)

## Tasks
- [ ] Run license-checker in `api/`
- [ ] Run license-checker in `admin/`
- [ ] Run license-checker in `mobile/`
- [ ] Document any incompatible licenses found and find alternatives
- [ ] Add license-checker to CI — flag any new incompatible dependency in PRs
- [ ] Add `license-checker` script to root `package.json`
- [ ] Update `ATTRIBUTION.md` with complete accurate dependency list

## Known-Compatible Core Dependencies
All core dependencies (Express, React, React Native, Expo, PostgreSQL, node-ical, etc.)
are MIT-licensed. This audit primarily targets transitive dependencies.

## Acceptance Criteria
- [ ] License checker passes with zero violations across all three apps
- [ ] License checker runs in CI on every PR
- [ ] Any flagged packages have been replaced or have a written legal justification
- [ ] `ATTRIBUTION.md` reflects the complete accurate dependency list
