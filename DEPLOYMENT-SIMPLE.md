# EvilAPI Simple Deployment Guide

## 🚀 Quick Production Deployment

### Step 1: Deploy with HTTP only
```bash
# On your Rocky Linux 9 ARM64 server
git clone https://github.com/busybox42/evilapi.git
cd evilapi

# Create configuration
cp src/config/config.js.example src/config/config.js

# Deploy with HTTP only (no SSL needed yet)
sudo make deploy
```

### Step 2: Verify HTTP deployment works
```bash
# Check if services are running
sudo make deploy-status

# Test the website
curl -I http://example.com/api/health
curl -I http://www.example.com/api/health

# Visit in browser
http://example.com
```

### Step 3: Enable SSL (after HTTP works)
```bash
# Enable SSL certificates for both domains
sudo DOMAIN=example.com make enable-ssl
```

### Step 4: Verify HTTPS deployment
```bash
# Test HTTPS access
curl -I https://example.com/api/health
curl -I https://www.example.com/api/health

# Visit in browser (should auto-redirect from HTTP)
https://example.com
```

## 🔧 Management Commands

```bash
# Basic operations
sudo make deploy         # Start HTTP deployment
sudo make deploy-stop    # Stop deployment
sudo make deploy-restart # Restart services
sudo make deploy-logs    # View logs
sudo make deploy-status  # Check status

# SSL operations
sudo DOMAIN=example.com make enable-ssl  # Add SSL to existing HTTP deployment
sudo make ssl-renew      # Renew certificates
sudo make ssl-status     # Check certificate status
```

## 🎯 What This Approach Does

1. **HTTP First**: Deploy with HTTP only, verify everything works
2. **Add SSL Later**: Once HTTP is confirmed working, add SSL certificates
3. **Safe Fallback**: If SSL fails, HTTP deployment still works
4. **Easier Debugging**: Can troubleshoot HTTP issues separately from SSL issues

## 🌐 Final Result

- **HTTP**: Automatically redirects to HTTPS
- **HTTPS**: https://example.com and https://www.example.com
- **Security**: Full SSL/TLS encryption with Let's Encrypt certificates
- **Performance**: Nginx reverse proxy with caching and compression

## 🛠️ Troubleshooting

If HTTP deployment fails:
```bash
sudo make deploy-logs    # Check what went wrong
sudo docker ps           # See container status
```

If SSL enablement fails:
```bash
# HTTP site still works, SSL can be retried
sudo DOMAIN=example.com make enable-ssl
```

This approach separates concerns and makes deployment much more reliable! 🚀 