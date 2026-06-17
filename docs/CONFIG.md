# Config files

Wato keeps only what must live at the project root. Everything else is grouped by purpose.

## Root directory (required)

These files must stay at the root because Next.js, Prisma, Docker, or their CLIs expect them there.

| File | Why it stays at root |
|------|----------------------|
| `package.json` / `package-lock.json` | npm entry point |
| `next.config.js` | Next.js build config |
| `tsconfig.json` | TypeScript project root |
| `next-env.d.ts` | Auto-generated Next.js types |
| `middleware.ts` | Next.js edge middleware convention |
| `instrumentation.ts` | Next.js server startup hook |
| `postcss.config.mjs` | PostCSS/Tailwind plugin discovery |
| `prisma.config.ts` | Prisma 7 CLI config |
| `components.json` | shadcn/ui generator |
| `Dockerfile` | Docker build context entry |
| `docker-compose.yml` | Compose orchestration |
| `README.md` | GitHub/repo landing page |
| `.dockerignore` / `.gitignore` | Tool defaults |
| `.env.example` | Env template for developers |

## `config/` — tooling

| File | Purpose |
|------|---------|
| `config/jest.config.js` | Unit & integration test runner |
| `config/jest.setup.js` | Jest mocks and test env vars |
| `config/eslint.config.mjs` | Lint rules |

## `tests/` — all test code

| Path | Purpose |
|------|---------|
| `tests/unit/` | Fast isolated tests |
| `tests/integration/` | API and database tests |
| `tests/e2e/` | Playwright browser tests |
| `tests/playwright.config.ts` | E2E runner config |

## `docs/` — documentation

| File | Purpose |
|------|---------|
| `docs/SETUP.md` | First-time setup |
| `docs/TESTING.md` | How to run tests |
| `docs/SECURITY.md` | Security practices |
| `docs/DEPLOYMENT.md` | Docker deployment |
| `docs/API.md` | API reference |
| `docs/ARCHITECTURE.md` | System overview |

## Application source

| Path | Purpose |
|------|---------|
| `app/` | Next.js pages and API routes |
| `components/` | React UI |
| `lib/` | Business logic |
| `prisma/` | Schema and migrations |
| `docker/` | Docker-related assets |
| `scripts/db/` | Backup/restore helpers |

## Removed clutter

- **Sentry** — three root config files and `@sentry/nextjs` were removed; they were never wired into `next.config.js`, so they added noise without working.
- **Vercel / Kubernetes / duplicate compose files** — removed in favor of Docker-only deployment.
- **`.nvmrc` / `.npmrc`** — removed; Node version is enforced via `package.json` `engines` and the Docker image (`node:20-alpine`).
