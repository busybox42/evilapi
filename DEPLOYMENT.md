# EvilAPI Production Deployment Guide

## Overview
Deploy EvilAPI to production with SSL certificates for `example.com` and `www.example.com`.

## Prerequisites

### 1. Server Requirements
- Ubuntu/Debian Linux server with root access
- Docker and Docker Compose installed
- Ports 80 and 443 open in firewall
- At least 2GB RAM and 20GB disk space

### 2. Domain Configuration
Configure your DNS records to point both domains to your server:

```
example.com       A    YOUR_SERVER_IP
www.example.com   A    YOUR_SERVER_IP
```

**Wait for DNS propagation** (can take up to 24 hours, check with `nslookup example.com`)

### 3. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

Log out and back in for group changes to take effect.

## Deployment Steps

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/evilapi.git
cd evilapi

# Create configuration
cp src/config/config.js.example src/config/config.js
# Edit config.js with your settings if needed
```

### 2. Deploy to Production
```bash
# Option A: Quick deployment with SSL
DOMAIN=example.com EMAIL=admin@example.com make deploy-ssl

# Option B: Manual step-by-step deployment
make deploy
./scripts/setup-ssl.sh example.com admin@example.com www.example.com
```

### 3. Verify Deployment
```bash
# Check service status
make deploy-status

# Check logs
make deploy-logs

# Test endpoints
curl -I https://example.com/api/health
curl -I https://www.example.com/api/health
```

## Configuration Details

### Production Services
The deployment creates these services:
- **EvilAPI**: Main application on port 3011
- **Nginx**: Reverse proxy on ports 80/443
- **Certbot**: SSL certificate management

### SSL Configuration
- **Primary Domain**: `example.com`
- **Additional Domain**: `www.example.com`
- **Certificate Path**: `/etc/letsencrypt/live/example.com/`
- **Auto-renewal**: Configured via cron job

### Security Features
- **TLS 1.2/1.3**: Modern SSL protocols only
- **HSTS**: Strict Transport Security enabled
- **Rate Limiting**: 20 requests/minute per IP
- **Security Headers**: X-Frame-Options, CSP, XSS-Protection
- **SSL Stapling**: Enabled for performance

## Management Commands

### Basic Operations
```bash
# Start services
make deploy

# Stop services
make deploy-stop

# Restart services
make deploy-restart

# View logs
make deploy-logs

# Check status
make deploy-status

# Update application
make deploy-update
```

### SSL Management
```bash
# Setup SSL certificates
./scripts/setup-ssl.sh example.com admin@example.com www.example.com

# Renew certificates (automatic via cron)
make ssl-renew

# Check certificate status
make ssl-status
```

### Troubleshooting
```bash
# View specific service logs
docker-compose logs -f evilapi
docker-compose logs -f nginx
docker-compose logs -f certbot

# Check nginx configuration
docker-compose exec nginx nginx -t

# Restart individual services
docker-compose restart evilapi
docker-compose restart nginx
```

## Firewall Configuration

### UFW (Ubuntu Firewall)
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

### iptables
```bash
# Allow HTTP and HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

## Monitoring and Maintenance

### Health Checks
- **API Health**: `https://example.com/api/health`
- **Nginx Status**: `https://example.com/health`
- **SSL Certificate**: `https://example.com` (check browser lock icon)

### Log Locations
- **EvilAPI Logs**: `docker-compose logs evilapi`
- **Nginx Logs**: `docker-compose logs nginx`
- **Certbot Logs**: `docker-compose logs certbot`

### Backup Strategy
```bash
# Backup SSL certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz nginx/ src/config/
```

## Performance Optimization

### Nginx Optimizations
The production nginx configuration includes:
- **Gzip Compression**: Enabled for all text content
- **Static File Caching**: 1 year cache for assets
- **Connection Keep-Alive**: Optimized for performance
- **Worker Processes**: Auto-scaled to CPU cores

### Resource Limits
```bash
# Check resource usage
docker stats

# Monitor disk usage
df -h
du -sh /var/lib/docker/
```

## Security Best Practices

### 1. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
make deploy-update
```

### 2. SSL Certificate Renewal
Certificates auto-renew via cron job. Manual renewal:
```bash
make ssl-renew
```

### 3. Firewall Rules
- Only allow necessary ports (22, 80, 443)
- Consider changing SSH port from default 22
- Use fail2ban for brute force protection

### 4. Access Control
- Use strong passwords for admin access
- Consider implementing IP whitelisting
- Regular log review for suspicious activity

## Troubleshooting Common Issues

### 1. Certificate Request Fails
```bash
# Check DNS propagation
nslookup example.com
nslookup www.example.com

# Check firewall
sudo ufw status
curl -I http://example.com/.well-known/acme-challenge/test
```

### 2. nginx Configuration Errors
```bash
# Test nginx config
docker-compose exec nginx nginx -t

# Check logs
docker-compose logs nginx
```

### 3. API Not Responding
```bash
# Check EvilAPI logs
docker-compose logs evilapi

# Check if service is running
docker-compose ps

# Test direct API access
curl http://localhost:3011/api/health
```

## Success Verification

After deployment, verify these work:
- ✅ `https://example.com` - Loads EvilAPI interface
- ✅ `https://www.example.com` - Loads EvilAPI interface  
- ✅ `http://example.com` - Redirects to HTTPS
- ✅ `https://example.com/api/health` - Returns API health status
- ✅ SSL certificate is valid and trusted
- ✅ All EvilAPI tools function correctly

## Support

For issues or questions:
1. Check the logs: `make deploy-logs`
2. Verify DNS configuration
3. Check firewall rules
4. Review this deployment guide

Your EvilAPI should now be live at:
- **https://example.com**
- **https://www.example.com**

## Next Steps

1. **Configure monitoring** (optional)
2. **Set up automated backups**
3. **Implement additional security measures**
4. **Scale horizontally if needed** 