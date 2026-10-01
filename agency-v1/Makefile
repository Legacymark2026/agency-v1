.PHONY: help up down logs ps clean backup restore deploy health

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker compose up -d

down: ## Stop all services (preserves data)
	docker compose down

logs: ## Follow logs for all services (or: make logs SERVICE=web)
	docker compose logs -f $(SERVICE)

ps: ## Show status of all containers
	docker compose ps

clean: ## Remove build cache (safe - does NOT delete data)
	docker builder prune -f && docker image prune -f

backup: ## Run manual database backup
	bash scripts/backup-database.sh

restore: ## Restore database from backup (interactive)
	bash scripts/restore-database.sh

deploy: ## Deploy latest changes
	git pull origin main && docker compose up -d --build

health: ## Check health of all services
	docker compose ps --format 'table {{.Name}}\t{{.Status}}'

replica-up: ## Start read replica
	docker compose up -d postgres-replica pgbouncer-replica

secrets: ## Generate production secrets (run once)
	bash scripts/generate-production-secrets.sh
