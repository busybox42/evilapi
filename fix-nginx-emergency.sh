#!/bin/bash

echo "Emergency nginx fix..."

# Stop everything
sudo docker-compose down 2>/dev/null || true

# Use the minimal config that definitely works
echo "Using minimal nginx configuration..."
cp nginx/sites-available/evilapi-minimal.conf nginx/sites-available/evilapi.conf

# Test the config first
echo "Testing nginx configuration..."
sudo docker run --rm \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/nginx/sites-available:/etc/nginx/sites-available:ro \
  nginx:alpine nginx -t

if [ $? -eq 0 ]; then
    echo "✓ Nginx config is valid"
    
    # Start services
    echo "Starting services with minimal config..."
    sudo docker-compose up -d
    
    echo "Waiting for services..."
    sleep 10
    
    echo "Checking status..."
    sudo docker ps | grep nginx
    
    echo ""
    echo "Testing API:"
    curl -I http://localhost:3011/api/health 2>/dev/null || echo "API not responding"
    
    echo ""
    echo "Testing nginx proxy:"
    curl -I http://localhost/ 2>/dev/null || echo "Nginx not responding"
    
    echo ""
    echo "If localhost works, test your domain:"
    echo "curl -I http://example.com/"
    
else
    echo "✗ Nginx config is invalid. Check the error above."
fi 