#!/bin/bash

# Debug SSL Setup Script
set -e

PRIMARY_DOMAIN="$1"
EMAIL="${2:-admin@${PRIMARY_DOMAIN}}"

echo "Debug: Checking certbot container..."
docker-compose run --rm certbot --version

echo "Debug: Checking webroot directory..."
docker-compose exec nginx ls -la /var/www/certbot/

echo "Debug: Testing direct certbot command..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --dry-run \
    -d "$PRIMARY_DOMAIN"

echo "Debug: Checking if certificates already exist..."
docker-compose run --rm certbot certificates

echo "Debug: Complete" 