# OpenSTR — GitHub Issues Import Script (Windows PowerShell)
# Usage: 
#   1. Install GitHub CLI from https://cli.github.com
#   2. Run: gh auth login
#   3. Unzip github-issues.zip and openstr-complete.zip to a folder
#   4. Update $ISSUES_DIR below to point to your issues folder
#   5. Run this script from PowerShell: .\import-issues.ps1

$REPO = "lkilpatrick/OpenSTR"
$ISSUES_DIR = "C:\path\to\github-issues\issues"   # <-- UPDATE THIS PATH

Write-Host "=== OpenSTR GitHub Import ===" -ForegroundColor Cyan
Write-Host "Repo: $REPO"
Write-Host ""

# ── MILESTONES ────────────────────────────────────────────────────────────────
Write-Host "Creating milestones..." -ForegroundColor Yellow

$milestones = @(
    "M1: Repo & Infrastructure",
    "M2: Database Schema & Seed Data",
    "M3: API Core",
    "M4: Session Engine",
    "M5: Mobile App — Cleaner Core",
    "M6: Mobile App — Schedule View",
    "M7: Admin Panel — Core",
    "M8: Admin Panel — Superhost & Performance",
    "M9: Guest Web Link",
    "M10: Standards System",
    "M11: Multi-Property & Residence",
    "M12: Open Source Release"
)

foreach ($m in $milestones) {
    gh api repos/$REPO/milestones -f title="$m" -f state="open" 2>$null
    Write-Host "  ✓ $m" -ForegroundColor Green
}

# ── LABELS ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Creating labels..." -ForegroundColor Yellow

$labels = @(
    @{name="infrastructure"; color="e4e669"},
    @{name="setup"; color="c5def5"},
    @{name="docker"; color="0075ca"},
    @{name="ci-cd"; color="cfd3d7"},
    @{name="database"; color="f9d0c4"},
    @{name="seed-data"; color="fef2c0"},
    @{name="backend"; color="0e8a16"},
    @{name="auth"; color="d93f0b"},
    @{name="api"; color="1d76db"},
    @{name="ical"; color="5319e7"},
    @{name="integrations"; color="e11d48"},
    @{name="home-assistant"; color="006b75"},
    @{name="sessions"; color="b60205"},
    @{name="photos"; color="f7a8b8"},
    @{name="notifications"; color="fbca04"},
    @{name="mobile"; color="0075ca"},
    @{name="schedule"; color="0e8a16"},
    @{name="standards"; color="5319e7"},
    @{name="admin"; color="e4e669"},
    @{name="frontend"; color="c5def5"},
    @{name="checklists"; color="bfd4f2"},
    @{name="superhost"; color="fef2c0"},
    @{name="performance"; color="f9d0c4"},
    @{name="guest"; color="d4c5f9"},
    @{name="multi-property"; color="0075ca"},
    @{name="residence"; color="006b75"},
    @{name="open-source"; color="5319e7"},
    @{name="legal"; color="f9d0c4"},
    @{name="documentation"; color="0075ca"},
    @{name="security"; color="d93f0b"}
)

foreach ($label in $labels) {
    gh label create $label.name --color $label.color --repo $REPO 2>$null
    Write-Host "  ✓ $($label.name)" -ForegroundColor Green
}

# ── ISSUES ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Creating issues..." -ForegroundColor Yellow

$issues = @(
    @{file="001_*.md"; title="Initialise monorepo structure with Node.js, React, and React Native"; milestone="M1: Repo & Infrastructure"; labels="infrastructure,setup"},
    @{file="002_*.md"; title="Set up Docker Compose for local development (API + PostgreSQL + Nginx)"; milestone="M1: Repo & Infrastructure"; labels="infrastructure,docker"},
    @{file="003_*.md"; title="Set up GitHub Actions CI/CD pipeline (lint, test, deploy to Linux server)"; milestone="M1: Repo & Infrastructure"; labels="infrastructure,ci-cd"},
    @{file="004_*.md"; title="Create database migration system and initial schema (properties, users, rooms)"; milestone="M2: Database Schema & Seed Data"; labels="database,backend"},
    @{file="005_*.md"; title="Create database migrations for tasks, sessions, and session detail tables"; milestone="M2: Database Schema & Seed Data"; labels="database,backend"},
    @{file="006_*.md"; title="Create migrations for reservations, supply alerts, ratings, issues, messages, and Superhost snapshots"; milestone="M2: Database Schema & Seed Data"; labels="database,backend"},
    @{file="007_*.md"; title="Seed database with properties, rooms, standards, and all Ocean View BNB tasks"; milestone="M2: Database Schema & Seed Data"; labels="database,seed-data"},
    @{file="008_*.md"; title="Implement JWT authentication (register, login, refresh, logout)"; milestone="M3: API Core"; labels="backend,auth"},
    @{file="009_*.md"; title="Build properties, rooms, and tasks CRUD API endpoints"; milestone="M3: API Core"; labels="backend,api"},
    @{file="010_*.md"; title="Build user and cleaner assignment API endpoints"; milestone="M3: API Core"; labels="backend,api"},
    @{file="011_*.md"; title="Build iCal sync service — import Airbnb booking calendar"; milestone="M4: Session Engine"; labels="backend,ical,integrations"},
    @{file="012_*.md"; title="Build Home Assistant webhook receiver — August lock trigger"; milestone="M4: Session Engine"; labels="backend,integrations,home-assistant"},
    @{file="013_*.md"; title="Build clean session CRUD API and session state machine"; milestone="M4: Session Engine"; labels="backend,api,sessions"},
    @{file="014_*.md"; title="Build task completion and photo upload API"; milestone="M4: Session Engine"; labels="backend,api,photos"},
    @{file="015_*.md"; title="Build push notification service"; milestone="M4: Session Engine"; labels="backend,notifications"},
    @{file="016_*.md"; title="Mobile app: authentication screens and navigation structure"; milestone="M5: Mobile App — Cleaner Core"; labels="mobile,auth"},
    @{file="017_*.md"; title="Mobile app: active session screen — room list and checklist"; milestone="M5: Mobile App — Cleaner Core"; labels="mobile,sessions"},
    @{file="018_*.md"; title="Mobile app: guest rating screen and session submission"; milestone="M5: Mobile App — Cleaner Core"; labels="mobile,sessions"},
    @{file="019_*.md"; title="Mobile app: cleaner schedule screen (upcoming cleans from iCal)"; milestone="M6: Mobile App — Schedule View"; labels="mobile,schedule"},
    @{file="020_*.md"; title="Mobile app: cleaning standards reference screen"; milestone="M6: Mobile App — Schedule View"; labels="mobile,standards"},
    @{file="021_*.md"; title="Admin panel: authentication, layout, and property switcher"; milestone="M7: Admin Panel — Core"; labels="admin,frontend"},
    @{file="022_*.md"; title="Admin panel: dashboard with property health cards and upcoming cleans"; milestone="M7: Admin Panel — Core"; labels="admin,frontend"},
    @{file="023_*.md"; title="Admin panel: session review — before/after photo comparison"; milestone="M7: Admin Panel — Core"; labels="admin,frontend,sessions"},
    @{file="024_*.md"; title="Admin panel: checklist management — add, edit, reorder tasks per room"; milestone="M7: Admin Panel — Core"; labels="admin,frontend,checklists"},
    @{file="025_*.md"; title="Admin panel: issues and guest messages inbox"; milestone="M7: Admin Panel — Core"; labels="admin,frontend"},
    @{file="026_*.md"; title="Admin panel: Superhost tracker dashboard widget"; milestone="M8: Admin Panel — Superhost & Performance"; labels="admin,frontend,superhost"},
    @{file="027_*.md"; title="Admin panel: cleaner performance profiles and comparison view"; milestone="M8: Admin Panel — Superhost & Performance"; labels="admin,frontend,performance"},
    @{file="028_*.md"; title="Guest web page: property guide, issue reporting, and owner contact"; milestone="M9: Guest Web Link"; labels="frontend,guest"},
    @{file="029_*.md"; title="Standards management API and admin UI"; milestone="M10: Standards System"; labels="backend,admin,standards"},
    @{file="030_*.md"; title="Admin panel: property management — add, configure, and manage multiple properties"; milestone="M11: Multi-Property & Residence"; labels="admin,frontend,multi-property"},
    @{file="031_*.md"; title="Residence support: manual session scheduling and optional photo flow"; milestone="M11: Multi-Property & Residence"; labels="backend,mobile,admin,residence"},
    @{file="032_*.md"; title="Add GPL-3.0 LICENSE file and license headers to all source files"; milestone="M12: Open Source Release"; labels="open-source,setup"},
    @{file="033_*.md"; title="Create CONTRIBUTING.md, CODE_OF_CONDUCT.md, ATTRIBUTION.md and GitHub templates"; milestone="M12: Open Source Release"; labels="open-source,documentation"},
    @{file="034_*.md"; title="Write public-facing README with self-hosting setup guide"; milestone="M12: Open Source Release"; labels="open-source,documentation"},
    @{file="035_*.md"; title="Add OpenSTR attribution notice to guest web page and mobile app About screen"; milestone="M12: Open Source Release"; labels="open-source,frontend,mobile"},
    @{file="036_*.md"; title="Audit all third-party dependencies for GPL-3.0 compatibility"; milestone="M12: Open Source Release"; labels="open-source,security,legal"}
)

$count = 0
foreach ($issue in $issues) {
    # Resolve wildcard to actual file
    $file = Get-ChildItem -Path $ISSUES_DIR -Filter $issue.file | Select-Object -First 1
    
    if ($null -eq $file) {
        Write-Host "  ✗ File not found: $($issue.file)" -ForegroundColor Red
        continue
    }

    gh issue create `
        --repo $REPO `
        --title $issue.title `
        --milestone $issue.milestone `
        --label $issue.labels `
        --body-file $file.FullName

    $count++
    Write-Host "  ✓ #$count $($issue.title.Substring(0, [Math]::Min(60, $issue.title.Length)))..." -ForegroundColor Green
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host "$count issues created at https://github.com/$REPO/issues"
Write-Host "View milestones at https://github.com/$REPO/milestones"
