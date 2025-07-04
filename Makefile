# Evil Admin Tools - Docker Management Makefile
# Usage: make [target]

# Variables
IMAGE_NAME = evilapi
CONTAINER_NAME = evilapi-container
API_PORT = 3011
WEB_PORT = 8080

# Default target
.DEFAULT_GOAL := help

# Build the Docker image
.PHONY: build
build:
	@echo "🔨 Building Evil Admin Tools Docker image..."
	docker build -t $(IMAGE_NAME) .
	@echo "✅ Build complete!"

# Start the container in detached mode
.PHONY: up
up:
	@echo "🚀 Starting Evil Admin Tools container..."
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(API_PORT):$(API_PORT) \
		-p $(WEB_PORT):$(WEB_PORT) \
		--restart unless-stopped \
		$(IMAGE_NAME)
	@echo "✅ Evil Admin Tools is running!"
	@echo "📡 API Server: http://localhost:$(API_PORT)"
	@echo "🌐 Web Interface: http://localhost:$(WEB_PORT)"

# Stop and remove the container
.PHONY: down
down:
	@echo "🛑 Stopping Evil Admin Tools container..."
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "✅ Container stopped and removed!"

# Restart the container (down + up)
.PHONY: restart
restart: down up

# Build and start (build + up)
.PHONY: deploy
deploy: build up

# Rebuild everything (down + build + up)
.PHONY: rebuild
rebuild: down build up

# View container logs
.PHONY: logs
logs:
	@echo "📋 Evil Admin Tools container logs:"
	docker logs -f $(CONTAINER_NAME)

# View recent logs (last 50 lines)
.PHONY: logs-tail
logs-tail:
	@echo "📋 Recent Evil Admin Tools logs (last 50 lines):"
	docker logs --tail 50 $(CONTAINER_NAME)

# Check container status
.PHONY: status
status:
	@echo "📊 Evil Admin Tools status:"
	@docker ps --filter "name=$(CONTAINER_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "❌ Container not running"

# Open web interface in browser (Linux)
.PHONY: open
open:
	@echo "🌐 Opening Evil Admin Tools web interface..."
	@command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:$(WEB_PORT) || echo "❌ xdg-open not found. Please open http://localhost:$(WEB_PORT) manually"

# Test API endpoint
.PHONY: test
test:
	@echo "🧪 Testing Evil Admin Tools API..."
	@curl -s http://localhost:$(API_PORT)/api/whoami > /dev/null && echo "✅ API is responding" || echo "❌ API is not responding"

# Clean up Docker resources
.PHONY: clean
clean:
	@echo "🧹 Cleaning up Docker resources..."
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "✅ Cleanup complete!"

# Remove all Evil Admin Tools related images and containers
.PHONY: clean-all
clean-all:
	@echo "🧹 Removing all Evil Admin Tools Docker resources..."
	@docker ps -aq --filter "ancestor=$(IMAGE_NAME)" | xargs docker rm -f 2>/dev/null || true
	@docker images -q $(IMAGE_NAME) | xargs docker rmi -f 2>/dev/null || true
	@echo "✅ All resources cleaned!"

# Show Docker system information
.PHONY: info
info:
	@echo "ℹ️  Docker system information:"
	@echo "📦 Images:"
	@docker images | grep $(IMAGE_NAME) || echo "   No $(IMAGE_NAME) images found"
	@echo ""
	@echo "📋 Containers:"
	@docker ps -a | grep $(IMAGE_NAME) || echo "   No $(IMAGE_NAME) containers found"

# Development mode - rebuild and show logs
.PHONY: dev
dev: rebuild logs

# Quick health check
.PHONY: health
health:
	@echo "🏥 Evil Admin Tools health check:"
	@echo "🐳 Docker status: $$(docker --version)"
	@echo "📦 Container status:"
	@docker ps --filter "name=$(CONTAINER_NAME)" --format "   {{.Names}}: {{.Status}}" || echo "   ❌ Container not running"
	@echo "🌐 API health:"
	@curl -s -w "   Response time: %{time_total}s\n" http://localhost:$(API_PORT)/api/whoami > /dev/null 2>&1 && echo "   ✅ API responsive" || echo "   ❌ API not responding"

# Show help
.PHONY: help
help:
	@echo "🔧 Evil Admin Tools - Docker Management"
	@echo ""
	@echo "📚 Available commands:"
	@echo "   make build      🔨 Build the Docker image"
	@echo "   make up         🚀 Start container in background"
	@echo "   make down       🛑 Stop and remove container"
	@echo "   make restart    🔄 Restart the container"
	@echo "   make deploy     📦 Build and start (build + up)"
	@echo "   make rebuild    🏗️  Full rebuild (down + build + up)"
	@echo "   make logs       📋 View live container logs"
	@echo "   make logs-tail  📋 View recent logs (last 50 lines)"
	@echo "   make status     📊 Check container status"
	@echo "   make test       🧪 Test API connectivity"
	@echo "   make health     🏥 Run health checks"
	@echo "   make open       🌐 Open web interface in browser"
	@echo "   make clean      🧹 Clean up container and image"
	@echo "   make clean-all  🧹 Remove all related Docker resources"
	@echo "   make info       ℹ️  Show Docker resource information"
	@echo "   make dev        👨‍💻 Development mode (rebuild + logs)"
	@echo "   make help       ❓ Show this help message"
	@echo ""
	@echo "🌐 URLs:"
	@echo "   Web Interface: http://localhost:$(WEB_PORT)"
	@echo "   API Server:    http://localhost:$(API_PORT)"
	@echo ""
	@echo "📖 Examples:"
	@echo "   make deploy     # First time setup"
	@echo "   make restart    # Restart after changes"
	@echo "   make dev        # Development workflow" 