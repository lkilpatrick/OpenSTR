# Contributing to OpenSTR

First off — thank you! OpenSTR exists to make life easier for STR hosts everywhere,
and every contribution helps.

---

## Ways to Contribute

- 🐛 **Report a bug** — something broken? Open an issue
- 💡 **Suggest a feature** — have an idea? Open an issue with the `enhancement` label
- 🛠️ **Fix a bug** — find an issue labelled `good first issue` or `help wanted`
- 📖 **Improve the docs** — clearer setup instructions help every host
- 🌍 **Add a translation** — help non-English speaking hosts use OpenSTR
- 🧪 **Write tests** — help us keep the codebase stable

---

## Before You Start

1. **Check existing issues** — someone may already be working on it
2. **Open an issue first** for large changes — let's discuss before you build
3. **Keep PRs focused** — one feature or fix per PR makes review much easier

---

## Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- Git

### Local setup

```bash
# Clone
git clone https://github.com/[your-username]/openstr.git
cd openstr

# Install all dependencies
npm install

# Start the database
docker-compose up postgres -d

# Run migrations
cd api && npm run db:migrate && npm run db:seed

# Start all apps in dev mode (from root)
npm run dev
```

This starts:
- API at `http://localhost:3000`
- Admin panel at `http://localhost:5173`
- Expo dev server for the mobile app

### Running tests

```bash
# API tests
cd api && npm test

# Admin tests
cd admin && npm test

# All tests from root
npm test
```

---

## Code Style

- **TypeScript** throughout — no `any` types
- **ESLint + Prettier** — run `npm run lint` before committing
- **Commits** — use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add weekly task auto-detection`
  - `fix: resolve photo upload race condition`
  - `docs: improve Home Assistant setup guide`

A pre-commit hook runs lint and type-check automatically.

---

## Pull Request Process

1. Fork the repo and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes with tests where applicable

3. Ensure all checks pass:
   ```bash
   npm run lint && npm test
   ```

4. Push and open a PR against `main`

5. Fill in the PR template — describe what you changed and why

6. A maintainer will review within a few days

---

## License

By contributing to OpenSTR, you agree that your contributions will be
licensed under the same **GPL-3.0** license that covers the project.

Your name will be credited in the commit history and, if significant,
in [ATTRIBUTION.md](./ATTRIBUTION.md).

---

## Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md).
We are committed to a welcoming and respectful community.
