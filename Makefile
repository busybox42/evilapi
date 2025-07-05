# EvilAPI Makefile

# Variables
DOCKER_IMAGE_NAME = evilapi
DOCKER_CONTAINER_NAME = evilapi-container
DOCKER_TAG = latest

# Default target
.PHONY: help
help:
	@echo "EvilAPI Make Commands"
	@echo "====================="
	@echo ""
	@echo "Docker Commands:"
	@echo "  build         - Build Docker image"
	@echo "  run           - Run Docker container"
	@echo "  stop          - Stop Docker container"
	@echo "  restart       - Restart Docker container"
	@echo "  logs          - Show Docker container logs"
	@echo "  shell         - Access Docker container shell"
	@echo "  clean         - Remove Docker container"
	@echo "  clean-all     - Remove container and image"
	@echo "  rebuild       - Clean and rebuild everything"
	@echo ""
	@echo "Development Commands (Non-privileged ports):"
	@echo "  dev           - Start development environment (port 8080)"
	@echo "  dev-stop      - Stop development environment"
	@echo "  dev-restart   - Restart development environment"
	@echo "  dev-logs      - Show development logs"
	@echo "  dev-status    - Show development status"
	@echo ""
	@echo "Production Deployment Commands:"
	@echo "  deploy        - Deploy with HTTP only (recommended first step)"
	@echo "  deploy-stop   - Stop production deployment"
	@echo "  deploy-restart - Restart production deployment"
	@echo "  deploy-logs   - Show deployment logs"
	@echo "  deploy-status - Show deployment status"
	@echo "  deploy-update - Update and rebuild deployment"
	@echo ""
	@echo "SSL Management (after HTTP deployment works):"
	@echo "  enable-ssl    - Enable SSL on existing HTTP deployment (requires DOMAIN env var)"
	@echo "  ssl-renew     - Renew SSL certificates"
	@echo "  ssl-status    - Check SSL certificate status"
	@echo ""
	@echo "Other Commands:"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make dev                              # Local development"
	@echo "  make deploy                           # Production HTTP deployment"
	@echo "  DOMAIN=evil-admin.com make enable-ssl # Add SSL to HTTP deployment"

# Docker Commands
.PHONY: build
build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) .

.PHONY: run
run:
	@echo "Starting Docker container..."
	docker run -d --name $(DOCKER_CONTAINER_NAME) -p 3011:3011 -p 8080:8080 $(DOCKER_IMAGE_NAME):$(DOCKER_TAG)

.PHONY: stop
stop:
	@echo "Stopping Docker container..."
	-docker stop $(DOCKER_CONTAINER_NAME)

.PHONY: restart
restart: stop
	@echo "Restarting Docker container..."
	-docker start $(DOCKER_CONTAINER_NAME)

.PHONY: logs
logs:
	@echo "Showing Docker container logs..."
	docker logs -f $(DOCKER_CONTAINER_NAME)

.PHONY: shell
shell:
	@echo "Accessing Docker container shell..."
	docker exec -it $(DOCKER_CONTAINER_NAME) /bin/bash

.PHONY: clean
clean:
	@echo "Cleaning Docker container..."
	-docker stop $(DOCKER_CONTAINER_NAME)
	-docker rm $(DOCKER_CONTAINER_NAME)

.PHONY: clean-all
clean-all: clean
	@echo "Cleaning Docker image..."
	-docker rmi $(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	-docker system prune -f

.PHONY: rebuild
rebuild: clean-all build run

# Development Commands (Non-privileged ports)
.PHONY: dev
dev:
	@echo "Starting development environment..."
	./scripts/deploy.sh start-dev

.PHONY: dev-stop
dev-stop:
	@echo "Stopping development environment..."
	./scripts/deploy.sh stop

.PHONY: dev-restart
dev-restart:
	@echo "Restarting development environment..."
	./scripts/deploy.sh restart-dev

.PHONY: dev-logs
dev-logs:
	@echo "Showing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

.PHONY: dev-status
dev-status:
	@echo "Checking development status..."
	./scripts/deploy.sh status

# Production Deployment Commands (HTTP-only by default)
.PHONY: deploy
deploy:
	@echo "Starting production HTTP deployment..."
	@echo "Ensuring HTTP-only configuration..."
	@cp nginx/sites-available/evilapi-http.conf nginx/sites-available/evilapi.conf
	./scripts/deploy.sh start

.PHONY: deploy-stop
deploy-stop:
	@echo "Stopping production deployment..."
	./scripts/deploy.sh stop

.PHONY: deploy-restart
deploy-restart:
	@echo "Restarting production deployment..."
	./scripts/deploy.sh restart

.PHONY: deploy-logs
deploy-logs:
	@echo "Showing deployment logs..."
	./scripts/deploy.sh logs

.PHONY: deploy-status
deploy-status:
	@echo "Checking deployment status..."
	./scripts/deploy.sh status

.PHONY: deploy-update
deploy-update:
	@echo "Updating production deployment..."
	./scripts/deploy.sh update

# SSL Management Commands
.PHONY: enable-ssl
enable-ssl:
	@echo "Enabling SSL on existing deployment..."
	@if [ -z "$(DOMAIN)" ]; then \
		echo "Error: DOMAIN environment variable is required"; \
		echo "Usage: DOMAIN=evil-admin.com make enable-ssl"; \
		echo "       DOMAIN=evil-admin.com EMAIL=admin@evil-admin.com make enable-ssl"; \
		exit 1; \
	fi
	@# Ensure SSL config exists
	@if [ ! -f nginx/sites-available/evilapi-ssl.conf ]; then \
		echo "Copying SSL configuration template..."; \
		cp nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-ssl.conf; \
	fi
	chmod +x scripts/enable-ssl.sh
	@if [ -n "$(EMAIL)" ]; then \
		./scripts/enable-ssl.sh $(DOMAIN) $(EMAIL) www.$(DOMAIN); \
	else \
		./scripts/enable-ssl.sh $(DOMAIN) admin@$(DOMAIN) www.$(DOMAIN); \
	fi

.PHONY: ssl-renew
ssl-renew:
	@echo "Renewing SSL certificates..."
	docker-compose run --rm certbot renew

.PHONY: ssl-status
ssl-status:
	@echo "Checking SSL certificate status..."
	docker-compose run --rm certbot certificates

# Development Commands
.PHONY: test
test:
	@echo "Running tests..."
	npm test

.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	npm run test:coverage

# Utility Commands
.PHONY: setup
setup:
	@echo "Setting up development environment..."
	npm install
	cp src/config/config.js.example src/config/config.js
	@echo "Setup complete! Edit src/config/config.js with your settings."

.PHONY: check-deps
check-deps:
	@echo "Checking dependencies..."
	@command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed."; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed."; exit 1; }
	@echo "All dependencies are installed."

.PHONY: status
status:
	@echo "EvilAPI Status"
	@echo "=============="
	@echo "Docker containers:"
	@docker ps -a --filter name=$(DOCKER_CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Docker Compose services:"
	@docker-compose ps
	@echo ""
	@echo "Health check:"
	@curl -s http://localhost:3011/api/health 2>/dev/null || echo "API not responding"

# Include custom makefile if it exists
-include Makefile.local 