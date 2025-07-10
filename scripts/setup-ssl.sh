#!/bin/bash

# EvilAPI SSL Setup Script
# This script sets up Let's Encrypt SSL certificates for EvilAPI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <primary_domain> [email] [additional_domains...]"
    print_error "Example: $0 example.com admin@example.com www.example.com"
    exit 1
fi

PRIMARY_DOMAIN="$1"
EMAIL="${2:-admin@${PRIMARY_DOMAIN}}"

# Build domains list
DOMAINS=("$PRIMARY_DOMAIN")
shift 2 2>/dev/null || shift 1  # Remove first two args if they exist, or just first one

# Add additional domains
for domain in "$@"; do
    DOMAINS+=("$domain")
done

print_status "Setting up SSL certificates for domains: ${DOMAINS[*]}"
print_status "Primary domain: $PRIMARY_DOMAIN"
print_status "Email: $EMAIL"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is required but not installed."
    exit 1
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p nginx/ssl certbot/conf certbot/www

# Create temporary nginx config for initial certificate request
print_status "Creating temporary nginx config..."
cat > nginx/sites-available/evilapi-temp.conf << EOF
server {
    listen 80;
    server_name ${DOMAINS[*]};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAINS[*]};
    
    # Temporary self-signed certificate
    ssl_certificate /etc/nginx/ssl/temp-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/temp-key.pem;
    
    location / {
        proxy_pass http://evilapi_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Generate temporary self-signed certificate
print_status "Generating temporary self-signed certificate..."
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout nginx/ssl/temp-key.pem \
    -out nginx/ssl/temp-cert.pem \
    -subj "/CN=$PRIMARY_DOMAIN"

# Backup original config and use temporary config
if [ -f nginx/sites-available/evilapi.conf ]; then
    mv nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-real.conf
fi
mv nginx/sites-available/evilapi-temp.conf nginx/sites-available/evilapi.conf

# Start services with temporary config
print_status "Starting services with temporary configuration..."
docker-compose up -d nginx

# Wait for nginx to be ready
print_status "Waiting for nginx to be ready..."
sleep 10

# Build certbot domain arguments
CERTBOT_DOMAINS=""
for domain in "${DOMAINS[@]}"; do
    CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d $domain"
done

# Request Let's Encrypt certificate
print_status "Requesting Let's Encrypt certificate for: ${DOMAINS[*]}"
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $CERTBOT_DOMAINS

if [ $? -eq 0 ]; then
    print_status "Certificate obtained successfully!"
    
    # Switch to real configuration
    print_status "Switching to production configuration..."
    mv nginx/sites-available/evilapi.conf nginx/sites-available/evilapi-temp.conf
    if [ -f nginx/sites-available/evilapi-real.conf ]; then
        mv nginx/sites-available/evilapi-real.conf nginx/sites-available/evilapi.conf
    fi
    
    # Remove temporary certificate
    rm -f nginx/ssl/temp-cert.pem nginx/ssl/temp-key.pem
    
    # Restart nginx with real configuration
    print_status "Restarting nginx with SSL configuration..."
    docker-compose restart nginx
    
    print_status "SSL setup completed successfully!"
    print_status "Your EvilAPI is now available at:"
    for domain in "${DOMAINS[@]}"; do
        print_status "  - https://$domain"
    done
    
else
    print_error "Certificate request failed!"
    print_error "Please check your domain DNS settings and try again."
    exit 1
fi

# Test certificate renewal
print_status "Testing certificate renewal..."
docker-compose run --rm certbot renew --dry-run

if [ $? -eq 0 ]; then
    print_status "Certificate renewal test passed!"
else
    print_warning "Certificate renewal test failed. Please check the configuration."
fi

print_status "Setup complete! Your EvilAPI is running with SSL."
print_status "Available at:"
for domain in "${DOMAINS[@]}"; do
    print_status "  - https://$domain"
done 