#!/bin/bash
# Quick fix for docker-compose path on remote server

# Update the deployment script to use the correct docker-compose path
sed -i 's|docker-compose|/usr/local/bin/docker-compose|g' scripts/deploy.sh

echo "Fixed docker-compose paths in deployment script"
