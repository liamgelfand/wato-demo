.PHONY: help setup install dev docker-up docker-down docker-db db-migrate db-seed db-studio test lint build logs

# Wato — common commands (requires `make`: Git Bash, WSL, or `choco install make` on Windows)

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: install ## First-time setup: install deps, start DB, migrate, seed
	@test -f .env || cp .env.example .env
	@echo "Edit .env and set NEXTAUTH_SECRET, then run: make dev"
	$(MAKE) docker-db
	$(MAKE) db-migrate
	$(MAKE) db-seed

install: ## Install npm dependencies
	npm install

dev: docker-db ## Local dev: Postgres in Docker, app on host with hot reload
	npm run dev

docker-up: ## Run full stack in Docker (DB + app)
	docker compose up db -d --wait
	npm run db:migrate:deploy
	docker compose --profile prod up -d --build app
	@echo "Open http://localhost:3000"
	@echo "First time? Seed demo data: make docker-seed"

docker-seed: ## Seed demo users/data (DB must be running)
	npm run db:seed

docker-down: ## Stop full Docker stack
	docker compose --profile prod down

docker-db: ## Start Postgres only (for local dev)
	docker compose up db -d

db-migrate: ## Apply database migrations
	npm run db:migrate

db-seed: ## Seed demo data
	npm run db:seed

db-studio: ## Open Prisma Studio
	npm run db:studio

test: ## Run unit + integration tests (CI mode)
	npm run test:ci

lint: ## Lint and typecheck
	npm run lint
	npx prisma generate
	npx tsc --noEmit

build: ## Production build
	npx prisma generate
	npm run build

logs: ## Tail app container logs (docker-up only)
	docker compose logs -f app
