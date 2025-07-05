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
	@echo "Nginx Deployment Commands:"
	@echo "  deploy        - Deploy with nginx proxy"
	@echo "  deploy-ssl    - Deploy with SSL (requires DOMAIN env var)"
	@echo "  deploy-stop   - Stop nginx deployment"
	@echo "  deploy-restart - Restart nginx deployment"
	@echo "  deploy-logs   - Show deployment logs"
	@echo "  deploy-status - Show deployment status"
	@echo "  deploy-update - Update and rebuild deployment"
	@echo ""
	@echo "SSL Management:"
	@echo "  ssl-setup     - Setup SSL certificates (requires DOMAIN env var)"
	@echo "  ssl-renew     - Renew SSL certificates"
	@echo "  ssl-status    - Check SSL certificate status"
	@echo ""
	@echo "Development Commands:"
	@echo "  dev           - Start development environment"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make deploy"
	@echo "  DOMAIN=example.com make deploy-ssl"
	@echo "  DOMAIN=example.com EMAIL=admin@example.com make ssl-setup"

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

# Nginx Deployment Commands
.PHONY: deploy
deploy:
	@echo "Starting nginx deployment..."
	./scripts/deploy.sh start

.PHONY: deploy-ssl
deploy-ssl:
	@echo "Starting nginx deployment with SSL..."
	@if [ -z "$(DOMAIN)" ]; then \
		echo "Error: DOMAIN environment variable is required"; \
		echo "Usage: DOMAIN=example.com make deploy-ssl"; \
		exit 1; \
	fi
	./scripts/deploy.sh start
	@if [ -n "$(EMAIL)" ]; then \
		./scripts/deploy.sh setup-ssl $(DOMAIN) $(EMAIL); \
	else \
		./scripts/deploy.sh setup-ssl $(DOMAIN); \
	fi

.PHONY: deploy-stop
deploy-stop:
	@echo "Stopping nginx deployment..."
	./scripts/deploy.sh stop

.PHONY: deploy-restart
deploy-restart:
	@echo "Restarting nginx deployment..."
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
	@echo "Updating nginx deployment..."
	./scripts/deploy.sh update

# SSL Management Commands
.PHONY: ssl-setup
ssl-setup:
	@echo "Setting up SSL certificates..."
	@if [ -z "$(DOMAIN)" ]; then \
		echo "Error: DOMAIN environment variable is required"; \
		echo "Usage: DOMAIN=example.com make ssl-setup"; \
		exit 1; \
	fi
	@if [ -n "$(EMAIL)" ]; then \
		./scripts/setup-ssl.sh $(DOMAIN) $(EMAIL); \
	else \
		./scripts/setup-ssl.sh $(DOMAIN); \
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
.PHONY: dev
dev:
	@echo "Starting development environment..."
	npm run dev

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