.DEFAULT_GOAL := help

.PHONY: help lint format test build package-smoke check security license hooks benchmark-smoke

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "%-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

lint: ## Run static analysis
	pnpm run lint

format: ## Check formatting
	pnpm run format:check

test: ## Run the test suite with coverage
	pnpm run test

build: ## Build JavaScript and declarations
	pnpm run build

package-smoke: ## Verify the packed ESM, CommonJS, and type entry points
	pnpm run package:smoke

check: ## Run lint, tests, and build
	pnpm run check

security: ## Audit production dependencies
	pnpm run security:audit

license: ## Check production dependency licenses
	pnpm run license:check

hooks: ## Enable the repository's pre-commit hooks
	git config --local core.hooksPath .githooks

benchmark-smoke: ## Run a short performance regression smoke test
	pnpm run benchmark:smoke
