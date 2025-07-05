#!/bin/bash

# Quick fix for nginx deployment issues

echo "Fixing nginx deployment..."

# Stop everything
echo "Stopping services..."
sudo docker-compose down 2>/dev/null || true

# Ensure we use HTTP-only config
echo "Setting up HTTP-only configuration..."
cp nginx/sites-available/evilapi-http.conf nginx/sites-available/evilapi.conf

# Remove any SSL-related containers
echo "Cleaning up..."
sudo docker container prune -f

# Start with fresh deployment
echo "Starting fresh HTTP deployment..."
sudo docker-compose up -d

echo "Waiting for services to start..."
sleep 10

# Check status
echo "Checking status..."
sudo docker ps
echo ""
echo "Testing API:"
curl -I http://localhost:3011/api/health

echo ""
echo "If EvilAPI is responding, test your domain:"
echo "curl -I http://evil-admin.com/api/health" 