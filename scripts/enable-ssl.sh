#!/bin/bash

# EvilAPI SSL Enablement Script
# This script adds SSL certificates to an existing HTTP deployment

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
    echo -e "${BLUE}[SSL-SETUP]${NC} $1"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <domain> [email] [additional_domains...]"
    print_error "Example: $0 example.com admin@example.com www.example.com"
    exit 1
fi

PRIMARY_DOMAIN="$1"
EMAIL="${2:-admin@${PRIMARY_DOMAIN}}"

# Build domains list
DOMAINS=("$PRIMARY_DOMAIN")
shift 2 2>/dev/null || shift 1

# Add additional domains
for domain in "$@"; do
    DOMAINS+=("$domain")
done

print_header "Enabling SSL for EvilAPI"
print_status "Domains: ${DOMAINS[*]}"
print_status "Primary domain: $PRIMARY_DOMAIN"
print_status "Email: $EMAIL"

# Check if docker-compose is available
DOCKER_COMPOSE=$(which docker-compose)
if [ -z "$DOCKER_COMPOSE" ]; then
    print_error "docker-compose command not found in PATH"
    exit 1
fi

print_status "Using docker-compose: $DOCKER_COMPOSE"

# Check if services are running
if ! $DOCKER_COMPOSE ps | grep -q "Up"; then
    print_error "EvilAPI services are not running. Please start them first with: make deploy"
    exit 1
fi

# Verify HTTP access works first
print_status "Verifying HTTP access..."
for domain in "${DOMAINS[@]}"; do
    if ! curl -s -o /dev/null -w "%{http_code}" "http://$domain/api/health" | grep -q "200"; then
        print_warning "HTTP access to $domain is not working properly"
        print_warning "Please ensure DNS is configured and the site is accessible via HTTP first"
    else
        print_status "✓ HTTP access to $domain is working"
    fi
done

# Create necessary directories
print_status "Creating SSL directories..."
mkdir -p nginx/ssl certbot/conf certbot/www

# Build certbot domain arguments
CERTBOT_DOMAINS=""
for domain in "${DOMAINS[@]}"; do
    CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d $domain"
done

# Request Let's Encrypt certificate
print_status "Requesting Let's Encrypt certificate for: ${DOMAINS[*]}"
$DOCKER_COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $CERTBOT_DOMAINS

if [ $? -eq 0 ]; then
    print_status "SSL certificate obtained successfully!"
    
    # Backup HTTP config and switch to SSL config
    print_status "Switching to SSL configuration..."
    mv nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-http-backup.conf
    cp nginx/sites-available/evilapi-ssl.conf nginx/sites-available/evilapi.conf
    
    # Update the SSL config with the correct domain
    sed -i "s/evil-admin\.com/$PRIMARY_DOMAIN/g" nginx/sites-available/evilapi.conf
    
    # Restart nginx with SSL configuration
    print_status "Restarting nginx with SSL configuration..."
    $DOCKER_COMPOSE restart nginx
    
    # Wait for nginx to restart
    sleep 5
    
    # Test HTTPS access
    print_status "Testing HTTPS access..."
    for domain in "${DOMAINS[@]}"; do
        if curl -s -k -o /dev/null -w "%{http_code}" "https://$domain/api/health" | grep -q "200"; then
            print_status "✓ HTTPS access to $domain is working"
        else
            print_warning "! HTTPS access to $domain may not be working yet"
        fi
    done
    
    print_status "SSL setup completed successfully!"
    print_status "Your EvilAPI is now available with SSL at:"
    for domain in "${DOMAINS[@]}"; do
        print_status "  - https://$domain"
    done
    
    print_status "HTTP traffic will be automatically redirected to HTTPS"
    
else
    print_error "SSL certificate request failed!"
    print_error "Common issues:"
    print_error "  1. DNS not pointing to this server"
    print_error "  2. Firewall blocking port 80"
    print_error "  3. Domain not accessible via HTTP"
    print_error ""
    print_error "Please verify HTTP access works first, then try again."
    exit 1
fi

# Test certificate renewal
print_status "Testing certificate renewal..."
$DOCKER_COMPOSE run --rm certbot renew --dry-run

if [ $? -eq 0 ]; then
    print_status "✓ Certificate renewal test passed!"
    print_status "Certificates will auto-renew every 90 days"
else
    print_warning "! Certificate renewal test failed. Please check the configuration."
fi

print_status "SSL enablement complete!"
print_status ""
print_status "Next steps:"
print_status "  1. Test your site: https://$PRIMARY_DOMAIN"
print_status "  2. Verify HTTPS redirect: http://$PRIMARY_DOMAIN"
print_status "  3. Check SSL rating: https://www.ssllabs.com/ssltest/" 