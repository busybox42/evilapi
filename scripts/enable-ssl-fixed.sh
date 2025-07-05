#!/bin/bash

# Fixed SSL Enablement Script
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}[SSL-SETUP]${NC} $1"; }

if [ -z "$1" ]; then
    print_error "Usage: $0 <domain> [email] [additional_domains...]"
    exit 1
fi

PRIMARY_DOMAIN="$1"
EMAIL="${2:-admin@${PRIMARY_DOMAIN}}"
DOMAINS=("$PRIMARY_DOMAIN")
shift 2 2>/dev/null || shift 1
for domain in "$@"; do
    DOMAINS+=("$domain")
done

print_header "Enabling SSL for EvilAPI"
print_status "Domains: ${DOMAINS[*]}"
print_status "Primary domain: $PRIMARY_DOMAIN"
print_status "Email: $EMAIL"

# Check docker-compose
DOCKER_COMPOSE=$(which docker-compose)
if [ -z "$DOCKER_COMPOSE" ]; then
    print_error "docker-compose not found"
    exit 1
fi

# Step 1: Switch to HTTP-only configuration for ACME
print_status "Switching to HTTP-only configuration for certificate generation..."
if [ -f nginx/sites-available/evilapi.conf ]; then
    cp nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-backup.conf
fi
cp nginx/sites-available/evilapi-acme.conf nginx/sites-available/evilapi.conf

# Update domain in ACME config
sed -i "s/evil-admin\.com/$PRIMARY_DOMAIN/g" nginx/sites-available/evilapi.conf

# Restart nginx with HTTP-only config
print_status "Restarting nginx with HTTP-only configuration..."
$DOCKER_COMPOSE restart nginx

# Wait for nginx to start
sleep 3

# Step 2: Verify HTTP access works
print_status "Verifying HTTP access..."
for domain in "${DOMAINS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain/api/health" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "✓ HTTP access to $domain is working"
    else
        print_warning "! HTTP access to $domain returned code: $HTTP_CODE"
    fi
done

# Step 3: Create directories
print_status "Creating SSL directories..."
mkdir -p nginx/ssl certbot/conf certbot/www

# Step 4: Request certificate
print_status "Requesting Let's Encrypt certificate..."
CERTBOT_DOMAINS=""
for domain in "${DOMAINS[@]}"; do
    CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d $domain"
done

$DOCKER_COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    $CERTBOT_DOMAINS

CERTBOT_EXIT_CODE=$?

if [ $CERTBOT_EXIT_CODE -eq 0 ]; then
    print_status "✓ Certificate obtained successfully!"
    
    # Step 5: Switch to SSL configuration
    print_status "Switching to SSL configuration..."
    cp nginx/sites-available/evilapi-ssl.conf nginx/sites-available/evilapi.conf
    
    # Update domain in SSL config
    sed -i "s/evil-admin\.com/$PRIMARY_DOMAIN/g" nginx/sites-available/evilapi.conf
    
    # Restart nginx with SSL
    print_status "Restarting nginx with SSL configuration..."
    $DOCKER_COMPOSE restart nginx
    
    # Wait for nginx to start
    sleep 5
    
    # Step 6: Test HTTPS
    print_status "Testing HTTPS access..."
    for domain in "${DOMAINS[@]}"; do
        HTTPS_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://$domain/api/health" || echo "000")
        if [ "$HTTPS_CODE" = "200" ]; then
            print_status "✓ HTTPS access to $domain is working"
        else
            print_warning "! HTTPS access to $domain returned code: $HTTPS_CODE"
        fi
    done
    
    print_status "🎉 SSL setup completed successfully!"
    print_status "Your EvilAPI is now available with SSL:"
    for domain in "${DOMAINS[@]}"; do
        print_status "  - https://$domain"
    done
    
else
    print_error "Certificate request failed (exit code: $CERTBOT_EXIT_CODE)"
    print_error "Restoring previous configuration..."
    
    # Restore backup if it exists
    if [ -f nginx/sites-available/evilapi-backup.conf ]; then
        cp nginx/sites-available/evilapi-backup.conf nginx/sites-available/evilapi.conf
        $DOCKER_COMPOSE restart nginx
    fi
    
    print_error "Check logs: docker-compose logs certbot"
    exit 1
fi 