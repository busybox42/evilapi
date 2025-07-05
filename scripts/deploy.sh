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
    start               Start all services
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
    --dev                 Development mode (HTTP only)

Examples:
    $0 start
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

# Start services
start_services() {
    print_header "Starting EvilAPI services..."
    
    # Create config from example if it doesn't exist
    if [ ! -f "src/config/config.js" ]; then
        print_warning "Config file not found. Creating from example..."
        cp src/config/config.js.example src/config/config.js
    fi
    
    # Start services
    docker-compose up -d
    
    print_status "Services started successfully!"
    print_status "EvilAPI is available at:"
    print_status "  - HTTP: http://localhost"
    print_status "  - HTTPS: https://localhost (if SSL is configured)"
    print_status "  - Direct API: http://localhost:3011"
}

# Stop services
stop_services() {
    print_header "Stopping EvilAPI services..."
    docker-compose down
    print_status "Services stopped successfully!"
}

# Restart services
restart_services() {
    print_header "Restarting EvilAPI services..."
    docker-compose restart
    print_status "Services restarted successfully!"
}

# Show logs
show_logs() {
    print_header "Showing service logs..."
    docker-compose logs -f --tail=100
}

# Show service status
show_status() {
    print_header "Service Status:"
    docker-compose ps
    
    echo
    print_header "Health Checks:"
    
    # Check EvilAPI
    if curl -s http://localhost:3011/api/health > /dev/null 2>&1; then
        print_status "✓ EvilAPI is responding"
    else
        print_error "✗ EvilAPI is not responding"
    fi
    
    # Check nginx
    if curl -s http://localhost > /dev/null 2>&1; then
        print_status "✓ Nginx is responding"
    else
        print_error "✗ Nginx is not responding"
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
    print_header "Updating EvilAPI..."
    
    # Pull latest code
    print_status "Pulling latest code..."
    git pull origin main
    
    # Rebuild containers
    print_status "Rebuilding containers..."
    docker-compose build --no-cache
    
    # Restart services
    print_status "Restarting services..."
    docker-compose up -d
    
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
            start_services
            ;;
        stop)
            check_dependencies
            stop_services
            ;;
        restart)
            check_dependencies
            restart_services
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
            update_services
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