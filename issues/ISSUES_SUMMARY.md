# GitHub Issues — My STR Property Manager

Total issues: **31**

## M1: Repo & Infrastructure
- [ ] **#1** Initialise monorepo structure with Node.js, React, and React Native
- [ ] **#2** Set up Docker Compose for local development (API + PostgreSQL + Nginx) _(deps: #1)_
- [ ] **#3** Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server) _(deps: #1, #2)_

## M2: Database Schema & Seed Data
- [ ] **#4** Create database migration system and initial schema (properties, users, rooms) _(deps: #2)_
- [ ] **#5** Create database migrations for tasks, sessions, and session detail tables _(deps: #4)_
- [ ] **#6** Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots _(deps: #5)_
- [ ] **#7** Seed database with properties, rooms, standards, and all My STR Property tasks _(deps: #5, #6)_

## M3: API Core
- [ ] **#8** Implement JWT authentication (register, login, refresh, logout) _(deps: #4)_
- [ ] **#9** Build properties, rooms, and tasks CRUD API endpoints _(deps: #8)_
- [ ] **#10** Build user and cleaner assignment API endpoints _(deps: #8)_

## M4: Session Engine
- [ ] **#11** Build iCal sync service — import Airbnb booking calendar _(deps: #6, #9)_
- [ ] **#12** Build Home Assistant webhook receiver — August lock trigger _(deps: #11)_
- [ ] **#13** Build clean session CRUD API and session state machine _(deps: #11, #12)_
- [ ] **#14** Build task completion and photo upload API _(deps: #13)_
- [ ] **#15** Build push notification service _(deps: #13)_

## M5: Mobile App — Cleaner Core
- [ ] **#16** Mobile app: authentication screens and navigation structure _(deps: #8)_
- [ ] **#17** Mobile app: active session screen — room list and checklist _(deps: #13, #14, #16)_
- [ ] **#18** Mobile app: guest rating screen and session submission _(deps: #17)_

## M6: Mobile App — Schedule View
- [ ] **#19** Mobile app: cleaner schedule screen (upcoming cleans from iCal) _(deps: #11, #16)_
- [ ] **#20** Mobile app: cleaning standards reference screen _(deps: #10, #19)_

## M7: Admin Panel — Core
- [ ] **#21** Admin panel: authentication, layout, and property switcher _(deps: #8)_
- [ ] **#22** Admin panel: dashboard with property health cards and upcoming cleans _(deps: #21, #11, #13)_
- [ ] **#23** Admin panel: session review — before/after photo comparison _(deps: #13, #14, #22)_
- [ ] **#24** Admin panel: checklist management — add, edit, reorder tasks per room _(deps: #9, #22)_
- [ ] **#25** Admin panel: issues and guest messages inbox _(deps: #6, #22)_

## M8: Admin Panel — Superhost & Performance
- [ ] **#26** Admin panel: Superhost tracker dashboard widget _(deps: #6, #22)_
- [ ] **#27** Admin panel: cleaner performance profiles and comparison view _(deps: #13, #14, #26)_

## M9: Guest Web Link
- [ ] **#28** Guest web page: property guide, issue reporting, and owner contact _(deps: #6, #9)_

## M10: Standards System
- [ ] **#29** Standards management API and admin UI _(deps: #9, #24)_

## M11: Multi-Property & Residence
- [ ] **#30** Admin panel: property management — add, configure, and manage multiple properties _(deps: #22, #29)_
- [ ] **#31** Residence support: manual session scheduling and optional photo flow _(deps: #13, #17, #30)_

## Dependency Order (suggested work order)

```
# 1 Initialise monorepo structure with Node.js, React, and React → no deps (start here)
# 2 Set up Docker Compose for local development (API + PostgreSQ → requires [1]
# 3 Set up GitHub Actions CI/CD pipeline (lint, test, deploy to  → requires [1, 2]
# 4 Create database migration system and initial schema (propert → requires [2]
# 5 Create database migrations for tasks, sessions, and session  → requires [4]
# 6 Create migrations for reservations, supply alerts, ratings,  → requires [5]
# 7 Seed database with properties, rooms, standards, and all Oce → requires [5, 6]
# 8 Implement JWT authentication (register, login, refresh, logo → requires [4]
# 9 Build properties, rooms, and tasks CRUD API endpoints        → requires [8]
#10 Build user and cleaner assignment API endpoints              → requires [8]
#11 Build iCal sync service — import Airbnb booking calendar     → requires [6, 9]
#12 Build Home Assistant webhook receiver — August lock trigger  → requires [11]
#13 Build clean session CRUD API and session state machine       → requires [11, 12]
#14 Build task completion and photo upload API                   → requires [13]
#15 Build push notification service                              → requires [13]
#16 Mobile app: authentication screens and navigation structure  → requires [8]
#17 Mobile app: active session screen — room list and checklist  → requires [13, 14, 16]
#18 Mobile app: guest rating screen and session submission       → requires [17]
#19 Mobile app: cleaner schedule screen (upcoming cleans from iC → requires [11, 16]
#20 Mobile app: cleaning standards reference screen              → requires [10, 19]
#21 Admin panel: authentication, layout, and property switcher   → requires [8]
#22 Admin panel: dashboard with property health cards and upcomi → requires [21, 11, 13]
#23 Admin panel: session review — before/after photo comparison  → requires [13, 14, 22]
#24 Admin panel: checklist management — add, edit, reorder tasks → requires [9, 22]
#25 Admin panel: issues and guest messages inbox                 → requires [6, 22]
#26 Admin panel: Superhost tracker dashboard widget              → requires [6, 22]
#27 Admin panel: cleaner performance profiles and comparison vie → requires [13, 14, 26]
#28 Guest web page: property guide, issue reporting, and owner c → requires [6, 9]
#29 Standards management API and admin UI                        → requires [9, 24]
#30 Admin panel: property management — add, configure, and manag → requires [22, 29]
#31 Residence support: manual session scheduling and optional ph → requires [13, 17, 30]
```

## Import Script (GitHub CLI)

Install `gh` CLI and run:

```bash
#!/bin/bash
REPO="your-username/bnb-manager"

# Create milestones
gh api repos/$REPO/milestones -f title="M1: Repo & Infrastructure" -f state="open"
gh api repos/$REPO/milestones -f title="M2: Database Schema & Seed Data" -f state="open"
gh api repos/$REPO/milestones -f title="M3: API Core" -f state="open"
gh api repos/$REPO/milestones -f title="M4: Session Engine" -f state="open"
gh api repos/$REPO/milestones -f title="M5: Mobile App — Cleaner Core" -f state="open"
gh api repos/$REPO/milestones -f title="M6: Mobile App — Schedule View" -f state="open"
gh api repos/$REPO/milestones -f title="M7: Admin Panel — Core" -f state="open"
gh api repos/$REPO/milestones -f title="M8: Admin Panel — Superhost & Performance" -f state="open"
gh api repos/$REPO/milestones -f title="M9: Guest Web Link" -f state="open"
gh api repos/$REPO/milestones -f title="M10: Standards System" -f state="open"
gh api repos/$REPO/milestones -f title="M11: Multi-Property & Residence" -f state="open"

# Create labels
gh label create "$REPO" --repo $REPO --name "infrastructure" --color "e4e669" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "setup" --color "c5def5" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "docker" --color "0075ca" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "ci-cd" --color "cfd3d7" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "database" --color "f9d0c4" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "backend" --color "0e8a16" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "seed-data" --color "fef2c0" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "auth" --color "d93f0b" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "api" --color "1d76db" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "ical" --color "5319e7" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "integrations" --color "e11d48" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "home-assistant" --color "006b75" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "sessions" --color "b60205" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "photos" --color "f7a8b8" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "notifications" --color "fbca04" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "mobile" --color "0075ca" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "schedule" --color "0e8a16" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "standards" --color "5319e7" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "admin" --color "e4e669" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "frontend" --color "c5def5" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "checklists" --color "bfd4f2" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "superhost" --color "fef2c0" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "performance" --color "f9d0c4" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "guest" --color "d4c5f9" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "multi-property" --color "0075ca" 2>/dev/null || true
gh label create "$REPO" --repo $REPO --name "residence" --color "006b75" 2>/dev/null || true

# Create issues (run in order)
gh issue create --repo $REPO --title "Initialise monorepo structure with Node.js, React, and React Native" --milestone "M1: Repo & Infrastructure" --label "infrastructure" --label "setup" --body-file issues/001_*.md
gh issue create --repo $REPO --title "Set up Docker Compose for local development (API + PostgreSQL + Nginx)" --milestone "M1: Repo & Infrastructure" --label "infrastructure" --label "docker" --body-file issues/002_*.md
gh issue create --repo $REPO --title "Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server)" --milestone "M1: Repo & Infrastructure" --label "infrastructure" --label "ci-cd" --body-file issues/003_*.md
gh issue create --repo $REPO --title "Create database migration system and initial schema (properties, users, rooms)" --milestone "M2: Database Schema & Seed Data" --label "database" --label "backend" --body-file issues/004_*.md
gh issue create --repo $REPO --title "Create database migrations for tasks, sessions, and session detail tables" --milestone "M2: Database Schema & Seed Data" --label "database" --label "backend" --body-file issues/005_*.md
gh issue create --repo $REPO --title "Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots" --milestone "M2: Database Schema & Seed Data" --label "database" --label "backend" --body-file issues/006_*.md
gh issue create --repo $REPO --title "Seed database with properties, rooms, standards, and all My STR Property tasks" --milestone "M2: Database Schema & Seed Data" --label "database" --label "seed-data" --body-file issues/007_*.md
gh issue create --repo $REPO --title "Implement JWT authentication (register, login, refresh, logout)" --milestone "M3: API Core" --label "backend" --label "auth" --body-file issues/008_*.md
gh issue create --repo $REPO --title "Build properties, rooms, and tasks CRUD API endpoints" --milestone "M3: API Core" --label "backend" --label "api" --body-file issues/009_*.md
gh issue create --repo $REPO --title "Build user and cleaner assignment API endpoints" --milestone "M3: API Core" --label "backend" --label "api" --body-file issues/010_*.md
gh issue create --repo $REPO --title "Build iCal sync service — import Airbnb booking calendar" --milestone "M4: Session Engine" --label "backend" --label "ical" --label "integrations" --body-file issues/011_*.md
gh issue create --repo $REPO --title "Build Home Assistant webhook receiver — August lock trigger" --milestone "M4: Session Engine" --label "backend" --label "integrations" --label "home-assistant" --body-file issues/012_*.md
gh issue create --repo $REPO --title "Build clean session CRUD API and session state machine" --milestone "M4: Session Engine" --label "backend" --label "api" --label "sessions" --body-file issues/013_*.md
gh issue create --repo $REPO --title "Build task completion and photo upload API" --milestone "M4: Session Engine" --label "backend" --label "api" --label "photos" --body-file issues/014_*.md
gh issue create --repo $REPO --title "Build push notification service" --milestone "M4: Session Engine" --label "backend" --label "notifications" --body-file issues/015_*.md
gh issue create --repo $REPO --title "Mobile app: authentication screens and navigation structure" --milestone "M5: Mobile App — Cleaner Core" --label "mobile" --label "auth" --body-file issues/016_*.md
gh issue create --repo $REPO --title "Mobile app: active session screen — room list and checklist" --milestone "M5: Mobile App — Cleaner Core" --label "mobile" --label "sessions" --body-file issues/017_*.md
gh issue create --repo $REPO --title "Mobile app: guest rating screen and session submission" --milestone "M5: Mobile App — Cleaner Core" --label "mobile" --label "sessions" --body-file issues/018_*.md
gh issue create --repo $REPO --title "Mobile app: cleaner schedule screen (upcoming cleans from iCal)" --milestone "M6: Mobile App — Schedule View" --label "mobile" --label "schedule" --body-file issues/019_*.md
gh issue create --repo $REPO --title "Mobile app: cleaning standards reference screen" --milestone "M6: Mobile App — Schedule View" --label "mobile" --label "standards" --body-file issues/020_*.md
gh issue create --repo $REPO --title "Admin panel: authentication, layout, and property switcher" --milestone "M7: Admin Panel — Core" --label "admin" --label "frontend" --body-file issues/021_*.md
gh issue create --repo $REPO --title "Admin panel: dashboard with property health cards and upcoming cleans" --milestone "M7: Admin Panel — Core" --label "admin" --label "frontend" --body-file issues/022_*.md
gh issue create --repo $REPO --title "Admin panel: session review — before/after photo comparison" --milestone "M7: Admin Panel — Core" --label "admin" --label "frontend" --label "sessions" --body-file issues/023_*.md
gh issue create --repo $REPO --title "Admin panel: checklist management — add, edit, reorder tasks per room" --milestone "M7: Admin Panel — Core" --label "admin" --label "frontend" --label "checklists" --body-file issues/024_*.md
gh issue create --repo $REPO --title "Admin panel: issues and guest messages inbox" --milestone "M7: Admin Panel — Core" --label "admin" --label "frontend" --body-file issues/025_*.md
gh issue create --repo $REPO --title "Admin panel: Superhost tracker dashboard widget" --milestone "M8: Admin Panel — Superhost & Performance" --label "admin" --label "frontend" --label "superhost" --body-file issues/026_*.md
gh issue create --repo $REPO --title "Admin panel: cleaner performance profiles and comparison view" --milestone "M8: Admin Panel — Superhost & Performance" --label "admin" --label "frontend" --label "performance" --body-file issues/027_*.md
gh issue create --repo $REPO --title "Guest web page: property guide, issue reporting, and owner contact" --milestone "M9: Guest Web Link" --label "frontend" --label "guest" --body-file issues/028_*.md
gh issue create --repo $REPO --title "Standards management API and admin UI" --milestone "M10: Standards System" --label "backend" --label "admin" --label "standards" --body-file issues/029_*.md
gh issue create --repo $REPO --title "Admin panel: property management — add, configure, and manage multiple properties" --milestone "M11: Multi-Property & Residence" --label "admin" --label "frontend" --label "multi-property" --body-file issues/030_*.md
gh issue create --repo $REPO --title "Residence support: manual session scheduling and optional photo flow" --milestone "M11: Multi-Property & Residence" --label "backend" --label "mobile" --label "admin" --label "residence" --body-file issues/031_*.md
```
