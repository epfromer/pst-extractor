.DEFAULT_GOAL := help

.PHONY: help lint test build check security

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "%-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

lint: ## Run static analysis
	pnpm run lint

test: ## Run the test suite with coverage
	pnpm run test

build: ## Build JavaScript and declarations
	pnpm run build

check: ## Run lint, tests, and build
	pnpm run check

security: ## Audit production dependencies
	pnpm run security:audit
