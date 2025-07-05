# EvilAPI Nginx Proxy Deployment Guide

This guide covers deploying EvilAPI with nginx as a reverse proxy, including SSL/TLS certificate setup using Let's Encrypt.

## Overview

The nginx proxy setup provides:
- **SSL/TLS termination** with Let's Encrypt certificates
- **Standard ports** (80/443) instead of custom ports
- **Enhanced security** with proper headers and rate limiting
- **Automatic HTTP to HTTPS** redirection
- **Professional deployment** suitable for production

## Architecture

```
Internet → nginx (80/443) → EvilAPI (3011)
```

- **nginx**: Handles SSL, security headers, rate limiting, and proxying
- **EvilAPI**: Runs on internal port 3011
- **Certbot**: Manages SSL certificate generation and renewal

## Quick Start

### 1. Deploy with Docker Compose

```bash
# Start all services
./scripts/deploy.sh start

# Setup SSL for your domain
./scripts/deploy.sh setup-ssl your-domain.com your-email@example.com

# Check service status
./scripts/deploy.sh status
```

### 2. Manual Deployment

```bash
# Start services
docker-compose up -d

# Setup SSL certificates
./scripts/setup-ssl.sh your-domain.com your-email@example.com
```

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Domain name** pointing to your server
- **Ports 80 and 443** open in your firewall
- **Root access** for SSL certificate management

## Configuration

### Domain Setup

Before running SSL setup, ensure:

1. **DNS A Record** points your domain to your server IP
2. **Firewall allows** ports 80 and 443
3. **No other services** are using ports 80/443

### Nginx Configuration

The nginx configuration includes:

- **SSL Settings**: Modern TLS 1.2/1.3 with secure ciphers
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Rate Limiting**: API endpoint protection
- **Proxy Configuration**: Proper headers for EvilAPI
- **Static File Caching**: Optimized performance

### SSL Certificate Management

Certificates are automatically:
- **Generated** during initial setup
- **Renewed** every 12 hours via cron
- **Validated** with OCSP stapling

## Deployment Commands

### Basic Operations

```bash
# Start all services
./scripts/deploy.sh start

# Stop all services
./scripts/deploy.sh stop

# Restart services
./scripts/deploy.sh restart

# View logs
./scripts/deploy.sh logs

# Check service status
./scripts/deploy.sh status
```

### SSL Management

```bash
# Setup SSL for domain
./scripts/deploy.sh setup-ssl example.com

# Setup SSL with custom email
./scripts/deploy.sh setup-ssl example.com admin@example.com

# Manual certificate renewal
docker-compose run --rm certbot renew

# Test certificate renewal
docker-compose run --rm certbot renew --dry-run
```

### Updates and Maintenance

```bash
# Update and rebuild
./scripts/deploy.sh update

# View service logs
docker-compose logs -f

# Check certificate expiry
docker-compose run --rm certbot certificates
```

## Service URLs

After deployment, EvilAPI is available at:

- **HTTPS**: `https://your-domain.com` (recommended)
- **HTTP**: `http://your-domain.com` (redirects to HTTPS)
- **Direct API**: `http://your-domain.com:3011` (internal, if exposed)

## Firewall Configuration

### Required Ports

```bash
# Allow HTTP (for Let's Encrypt challenges)
sudo ufw allow 80/tcp

# Allow HTTPS (main service)
sudo ufw allow 443/tcp

# Optional: Allow direct API access
sudo ufw allow 3011/tcp
```

### iptables Rules

```bash
# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Optional: Allow direct API access
sudo iptables -A INPUT -p tcp --dport 3011 -j ACCEPT
```

## Security Features

### SSL/TLS Security

- **TLS 1.2/1.3** only
- **Perfect Forward Secrecy** (PFS)
- **OCSP Stapling** for certificate validation
- **HSTS** for browser security

### HTTP Security Headers

- **Strict-Transport-Security**: Force HTTPS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **X-XSS-Protection**: Enable XSS filtering
- **Content-Security-Policy**: Restrict resource loading

### Rate Limiting

- **API Endpoints**: 10 requests per minute
- **Login Attempts**: 5 requests per minute
- **General Traffic**: 20 requests per minute burst

## Troubleshooting

### Common Issues

#### Certificate Generation Fails

```bash
# Check domain DNS resolution
nslookup your-domain.com

# Verify port 80 is accessible
curl -I http://your-domain.com/.well-known/acme-challenge/test

# Check nginx logs
docker-compose logs nginx
```

#### SSL Certificate Expired

```bash
# Manual renewal
docker-compose run --rm certbot renew --force-renewal

# Check certificate status
docker-compose run --rm certbot certificates
```

#### Nginx Configuration Errors

```bash
# Test configuration
docker-compose exec nginx nginx -t

# Reload configuration
docker-compose exec nginx nginx -s reload

# Check nginx logs
docker-compose logs nginx
```

#### API Not Responding

```bash
# Check EvilAPI health
curl http://localhost:3011/api/health

# Check container status
docker-compose ps

# View EvilAPI logs
docker-compose logs evilapi
```

### Debug Commands

```bash
# Test SSL configuration
curl -I https://your-domain.com

# Check certificate details
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Test API through proxy
curl -I https://your-domain.com/api/health

# View all container logs
docker-compose logs -f --tail=50
```

## Monitoring

### Health Checks

The deployment includes health checks for:
- **EvilAPI**: `/api/health` endpoint
- **Nginx**: HTTP response on port 80/443
- **SSL Certificate**: Automatic renewal monitoring

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f nginx
docker-compose logs -f evilapi
docker-compose logs -f certbot
```

## Production Considerations

### Performance Optimization

- **Gzip compression** enabled
- **Static file caching** with long expiry
- **HTTP/2** support for faster loading
- **Keepalive connections** for reduced latency

### Security Hardening

- **Rate limiting** on all endpoints
- **Security headers** for all responses
- **IP whitelisting** capability
- **Access logging** for audit trails

### Backup Strategy

Important files to backup:
- **SSL certificates**: `./certbot/conf/`
- **Nginx configuration**: `./nginx/`
- **EvilAPI configuration**: `./src/config/`

## Advanced Configuration

### Custom Nginx Settings

Edit `nginx/nginx.conf` for global settings:
```nginx
# Increase worker processes
worker_processes auto;

# Adjust rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
```

### Multiple Domains

To support multiple domains:

1. **Create additional site configs**:
```bash
cp nginx/sites-available/evilapi.conf nginx/sites-available/domain2.conf
```

2. **Update domain in new config**:
```bash
sed -i 's/your-domain.com/domain2.com/g' nginx/sites-available/domain2.conf
```

3. **Request additional certificates**:
```bash
./scripts/setup-ssl.sh domain2.com
```

### Custom SSL Certificates

To use custom SSL certificates instead of Let's Encrypt:

1. **Place certificates in** `nginx/ssl/`
2. **Update nginx configuration** to reference custom certificates
3. **Restart nginx** with new configuration

## Support

For issues with the nginx deployment:

1. **Check logs**: `docker-compose logs -f`
2. **Verify DNS**: Ensure domain points to your server
3. **Test connectivity**: Verify ports 80/443 are accessible
4. **Review configuration**: Check nginx config syntax

For EvilAPI-specific issues, refer to the main [README.md](../README.md) and [API_Documentation.md](API_Documentation.md). 