#!/bin/bash

# EvilAPI Deployment Script
# Handles deployment with nginx proxy and SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Display usage
show_help() {
    cat << EOF
EvilAPI Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start               Start all services (production mode)
    start-dev           Start all services (development mode - non-privileged ports)
    stop                Stop all services
    restart             Restart all services
    setup-ssl DOMAIN    Setup SSL certificates for domain
    logs                Show logs
    update              Update and rebuild containers
    status              Show service status
    help                Show this help message

Options:
    -d, --domain DOMAIN    Domain name for SSL setup
    -e, --email EMAIL      Email for Let's Encrypt (default: admin@domain)
    --no-ssl              Skip SSL setup
    --dev                 Development mode (HTTP only, non-privileged ports)

Examples:
    $0 start-dev                              # Local development
    $0 start                                  # Production deployment
    $0 setup-ssl evilapi.example.com
    $0 setup-ssl evilapi.example.com admin@example.com
    $0 restart
    $0 logs
    $0 update
EOF
}

# Check if docker-compose is available
check_dependencies() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is required but not installed."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "docker is required but not installed."
        exit 1
    fi
}

# Determine which compose file to use
get_compose_file() {
    local mode="$1"
    if [ "$mode" = "dev" ] || [ "$mode" = "development" ]; then
        echo "docker-compose.dev.yml"
    else
        echo "docker-compose.yml"
    fi
}

# Start services
start_services() {
    local mode="$1"
    local compose_file=$(get_compose_file "$mode")
    
    if [ "$mode" = "dev" ]; then
        print_header "Starting EvilAPI services (Development Mode)..."
        print_status "Using non-privileged ports: HTTP=8080, HTTPS=8443"
    else
        print_header "Starting EvilAPI services (Production Mode)..."
        print_status "Using standard ports: HTTP=80, HTTPS=443"
    fi
    
    # Create config from example if it doesn't exist
    if [ ! -f "src/config/config.js" ]; then
        print_warning "Config file not found. Creating from example..."
        cp src/config/config.js.example src/config/config.js
    fi
    
    # Start services
    docker-compose -f "$compose_file" up -d
    
    print_status "Services started successfully!"
    if [ "$mode" = "dev" ]; then
        print_status "EvilAPI is available at:"
        print_status "  - HTTP: http://localhost:8080"
        print_status "  - Direct API: http://localhost:3011"
    else
        print_status "EvilAPI is available at:"
        print_status "  - HTTP: http://localhost"
        print_status "  - HTTPS: https://localhost (if SSL is configured)"
        print_status "  - Direct API: http://localhost:3011"
    fi
}

# Stop services
stop_services() {
    local mode="$1"
    local compose_file=$(get_compose_file "$mode")
    
    print_header "Stopping EvilAPI services..."
    
    # Try both compose files to ensure cleanup
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    print_status "Services stopped successfully!"
}

# Restart services
restart_services() {
    local mode="$1"
    local compose_file=$(get_compose_file "$mode")
    
    print_header "Restarting EvilAPI services..."
    docker-compose -f "$compose_file" restart
    print_status "Services restarted successfully!"
}

# Show logs
show_logs() {
    local mode="$1"
    local compose_file=$(get_compose_file "$mode")
    
    print_header "Showing service logs..."
    
    # Try to detect which compose file is currently running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        compose_file="docker-compose.dev.yml"
    fi
    
    docker-compose -f "$compose_file" logs -f --tail=100
}

# Show service status
show_status() {
    print_header "Service Status:"
    
    # Check both compose files
    echo "Production Services:"
    docker-compose -f docker-compose.yml ps 2>/dev/null || echo "  No production services running"
    
    echo ""
    echo "Development Services:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "  No development services running"
    
    echo
    print_header "Health Checks:"
    
    # Check EvilAPI
    if curl -s http://localhost:3011/api/health > /dev/null 2>&1; then
        print_status "✓ EvilAPI is responding (port 3011)"
    else
        print_error "✗ EvilAPI is not responding (port 3011)"
    fi
    
    # Check nginx (development)
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        print_status "✓ Nginx is responding (development port 8080)"
    else
        print_warning "! Nginx is not available on development port 8080"
    fi
    
    # Check nginx (production)
    if curl -s http://localhost > /dev/null 2>&1; then
        print_status "✓ Nginx is responding (production port 80)"
    else
        print_warning "! Nginx is not available on production port 80"
    fi
    
    # Check SSL if configured
    if curl -s -k https://localhost > /dev/null 2>&1; then
        print_status "✓ HTTPS is available"
    else
        print_warning "! HTTPS is not available (SSL may not be configured)"
    fi
}

# Update and rebuild
update_services() {
    local mode="$1"
    local compose_file=$(get_compose_file "$mode")
    
    print_header "Updating EvilAPI..."
    
    # Pull latest code
    print_status "Pulling latest code..."
    git pull origin main
    
    # Rebuild containers
    print_status "Rebuilding containers..."
    docker-compose -f "$compose_file" build --no-cache
    
    # Restart services
    print_status "Restarting services..."
    docker-compose -f "$compose_file" up -d
    
    print_status "Update completed successfully!"
}

# Setup SSL certificates
setup_ssl() {
    local domain="$1"
    local email="$2"
    
    if [ -z "$domain" ]; then
        print_error "Domain is required for SSL setup"
        print_error "Usage: $0 setup-ssl <domain> [email]"
        exit 1
    fi
    
    print_header "Setting up SSL for domain: $domain"
    
    # Check if setup-ssl script exists
    if [ ! -f "scripts/setup-ssl.sh" ]; then
        print_error "SSL setup script not found!"
        exit 1
    fi
    
    # Make script executable
    chmod +x scripts/setup-ssl.sh
    
    # Run SSL setup
    if [ -n "$email" ]; then
        ./scripts/setup-ssl.sh "$domain" "$email"
    else
        ./scripts/setup-ssl.sh "$domain"
    fi
}

# Main script logic
main() {
    local command="$1"
    shift
    
    case "$command" in
        start)
            check_dependencies
            start_services "production"
            ;;
        start-dev|dev)
            check_dependencies
            start_services "dev"
            ;;
        stop)
            check_dependencies
            stop_services
            ;;
        restart)
            check_dependencies
            restart_services "production"
            ;;
        restart-dev)
            check_dependencies
            restart_services "dev"
            ;;
        setup-ssl)
            check_dependencies
            setup_ssl "$@"
            ;;
        logs)
            check_dependencies
            show_logs
            ;;
        status)
            check_dependencies
            show_status
            ;;
        update)
            check_dependencies
            update_services "production"
            ;;
        update-dev)
            check_dependencies
            update_services "dev"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Run main function with all arguments
main "$@" 