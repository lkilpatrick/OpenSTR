---
title: "Create CONTRIBUTING.md, CODE_OF_CONDUCT.md, ATTRIBUTION.md and GitHub templates"
milestone: "M12: Open Source Release"
labels: ["open-source", "documentation"]
---

# Create CONTRIBUTING.md, CODE_OF_CONDUCT.md, ATTRIBUTION.md and GitHub templates

**Milestone:** M12: Open Source Release
**Labels:** open-source, documentation

## Dependencies
- Depends on #1

## Overview
Add all the community and legal files that make an open source project welcoming and trustworthy. All files are provided in `oss-files/` — this issue is about dropping them into the repo and filling in the blanks.

## Files to Add (from `oss-files/`)

| File | Location in Repo | Action |
|------|-----------------|--------|
| `CONTRIBUTING.md` | Root | Copy + fill in GitHub username |
| `CODE_OF_CONDUCT.md` | Root | Copy — no changes needed |
| `ATTRIBUTION.md` | Root | Copy + fill in name and GitHub URL |
| `PULL_REQUEST_TEMPLATE.md` | `.github/` | Copy — no changes needed |
| `bug_report.md` | `.github/ISSUE_TEMPLATE/` | Copy — no changes needed |
| `feature_request.md` | `.github/ISSUE_TEMPLATE/` | Copy — no changes needed |

## Additional Tasks
- [ ] Replace all `[Your Name]` placeholders with your real name
- [ ] Replace all `[your-username]` placeholders with your GitHub username
- [ ] Add a `CHANGELOG.md` to root: start with `## [Unreleased]` section
- [ ] Add `SECURITY.md` — how to responsibly disclose security vulnerabilities
- [ ] Enable GitHub Discussions on the repo (Settings → Features → Discussions)
- [ ] Add topics to the GitHub repo: `airbnb`, `short-term-rental`, `property-management`, `self-hosted`, `open-source`, `cleaning-management`

## Acceptance Criteria
- [ ] All 6 files present with no `[placeholder]` text remaining
- [ ] GitHub issue templates appear when clicking "New Issue"
- [ ] PR template appears when opening a pull request
- [ ] GitHub Discussions enabled
- [ ] Repo topics added
