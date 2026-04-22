# RetenciónClara — Developer Commands

.PHONY: install dev build test test-watch lint format ci spec-list spec-add clean help

install: ## Install dependencies
	npm install

dev: ## Start dev server (localhost:5173)
	npm run dev

build: ## Build for production
	npm run build

preview: ## Preview production build
	npm run preview

test: ## Run test suite
	npm test -- --run

test-watch: ## Watch tests
	npm test -- --watch

test-coverage: ## Tests with coverage
	npm run test:coverage

lint: ## ESLint check
	npm run lint

format: ## Format with Prettier
	npm run format

format-check: ## Check formatting
	npm run format:check

ci: ## Full CI check (format + lint + test + build)
	npm run format:check && npm run lint && npm test -- --run && npm run build

# ── Specs ─────────────────────────────────────────────────────────────────────

spec-list: ## List all specs
	@echo "Specs:"
	@find specs -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort

spec-add: ## Create new spec (usage: make spec-add N=002 NAME=pdf-upload)
	@if [ -z "$(N)" ] || [ -z "$(NAME)" ]; then echo "Usage: make spec-add N=002 NAME=pdf-upload"; exit 1; fi
	@mkdir -p specs/$(N)-$(NAME)/{contracts,checklists}
	@cp SPEC_TEMPLATE.md specs/$(N)-$(NAME)/spec.md
	@echo "Created specs/$(N)-$(NAME)/spec.md"

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts
	rm -rf dist/ coverage/

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' Makefile | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
