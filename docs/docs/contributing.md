# Contributing

<img src="https://openstr.dev/static/8d9b6a334b9bbd78e36ee44fecd8c77f/a2e28/happyguests.webp" alt="Happy guests enjoying a well-managed rental property" class="hero-image-sm">

OpenSTR welcomes contributions from hosts, developers, and STR industry folks.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Follow the [Quick Start](getting-started/quick-start.md) guide to set up your development environment
4. Create a feature branch from `main`

## Repository Structure

```
openstr/
├── api/              # Node.js + Express REST API (TypeScript)
├── admin/            # React + Vite admin panel (TypeScript)
├── mobile_flutter/   # Flutter cleaner app (iOS, Android, Web)
├── shared/           # Shared TypeScript types
├── docker/           # Dockerfiles and nginx config
└── docs/             # Documentation (MkDocs)
```

## Development Workflow

### API Development

```bash
cd api
npm install
npm run dev          # Start with hot-reload
npm test             # Run tests
```

### Admin Panel Development

```bash
cd admin
npm install
npm run dev          # Start Vite dev server on :5173
```

### Mobile App Development

```bash
cd mobile_flutter
flutter run -d chrome --dart-define=API_URL=http://localhost:3000
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include tests for new API endpoints
- Update documentation if the change affects user-facing behavior
- Ensure all existing tests pass

## Reporting Bugs

Open an issue on GitHub with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, browser, device)

## Feature Requests

Open an issue with the `enhancement` label describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## License

By contributing to OpenSTR, you agree that your contributions will be licensed under the GPL-3.0 license.
