# Wato

Social challenge app — create dares, submit proof, earn points with friends.

## Development

```bash
cp .env.example .env
make setup          # install, start DB, migrate, seed
make dev            # hot reload → http://localhost:3000
```

Or without Make:

```bash
cp .env.example .env
npm install
npm run docker:db
npm run db:migrate
npm run db:seed
npm run dev
```

Demo login: `demo1@test.com` / `password123`

## Run everything in Docker

```bash
cp .env.example .env       # set NEXTAUTH_SECRET
make docker-up             # or: npm run docker:up
```

## Project structure

```
wato/
├── app/              # Next.js pages & API routes
├── components/       # React UI
├── lib/              # business logic
├── prisma/           # database schema & migrations
├── config/           # jest, eslint
├── tests/            # unit, integration, e2e
├── docker/           # Docker-related assets
├── docs/             # documentation
├── Dockerfile        # production image
└── docker-compose.yml
```

## Commands

| Command | Purpose |
|---------|---------|
| `make dev` | Dev server (starts DB, you run app with hot reload) |
| `make docker-up` | Full app stack in containers |
| `make setup` | First-time install + DB + migrate + seed |
| `npm run test:unit` | Unit tests |
| `npm run build` | Production build |

## Docs

- [Config files explained](docs/CONFIG.md)
- [Setup](docs/SETUP.md)
- [Testing](docs/TESTING.md)
- [Docker deployment](docs/DEPLOYMENT.md)
- [API](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

## License

MIT
