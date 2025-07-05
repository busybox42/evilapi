#!/bin/bash

# Simplified SSL Enablement Script
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

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

print_status "Setting up SSL for: ${DOMAINS[*]}"

# Check existing certificates
print_status "Checking existing certificates..."
if docker-compose run --rm certbot certificates | grep -q "$PRIMARY_DOMAIN"; then
    print_warning "Certificate for $PRIMARY_DOMAIN already exists"
    print_status "Use --force-renewal if you want to replace it"
fi

# Create directories
mkdir -p nginx/ssl certbot/conf certbot/www

# Build domain arguments
CERTBOT_DOMAINS=""
for domain in "${DOMAINS[@]}"; do
    CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d $domain"
done

# Request certificate
print_status "Requesting certificate..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    $CERTBOT_DOMAINS

CERTBOT_EXIT_CODE=$?

if [ $CERTBOT_EXIT_CODE -eq 0 ]; then
    print_status "Certificate obtained successfully!"
    
    # Switch to SSL config
    print_status "Switching to SSL configuration..."
    if [ -f nginx/sites-available/evilapi.conf ]; then
        cp nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-http-backup.conf
    fi
    cp nginx/sites-available/evilapi-ssl.conf nginx/sites-available/evilapi.conf
    
    # Update domain in SSL config
    sed -i "s/evil-admin\.com/$PRIMARY_DOMAIN/g" nginx/sites-available/evilapi.conf
    
    # Restart nginx
    print_status "Restarting nginx..."
    docker-compose restart nginx
    
    print_status "SSL setup completed!"
    print_status "Test your site: https://$PRIMARY_DOMAIN"
    
else
    print_error "Certificate request failed (exit code: $CERTBOT_EXIT_CODE)"
    print_error "Check logs: docker-compose logs certbot"
fi 